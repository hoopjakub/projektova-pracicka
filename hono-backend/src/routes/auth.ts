import { Hono } from 'hono'
import * as z from 'zod'
import { sValidator } from '@hono/standard-validator'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import db from '../db/index.js'

const auth = new Hono()

/* ─── helpers ─────────────────────────────────────────────────── */

function sessionToken() {
  return crypto.randomBytes(32).toString('hex') // 64-char hex
}

function now() {
  return new Date().toISOString()
}

/* ─── POST /auth/register ─────────────────────────────────────── */

const registerSchema = z.object({
  username:      z.string().min(3).max(64),
  email:         z.string().email(),
  password:      z.string().min(8).max(128),
  // optional profile fields
  full_name:     z.string().min(2).max(128).optional(),
  country:       z.string().max(64).optional(),
  profession:    z.string().max(64).optional(),
  date_of_birth: z.string().max(16).optional(),  // ISO date YYYY-MM-DD
  bio:           z.string().max(300).optional(),
})

auth.post('/register', sValidator('json', registerSchema), async (c) => {
  const { username, email, password, full_name, country, profession, date_of_birth, bio } = c.req.valid('json')

  // check uniqueness
  const existing = db.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  ).get(email, username)

  if (existing) {
    return c.json({ error: 'Email or username already taken' }, 409)
  }

  const password_hash = await bcrypt.hash(password, 12)
  const ts = now()

  const insertUser = db.transaction(() => {
    // insert user
    const { lastInsertRowid: userId } = db.prepare(`
      INSERT INTO users (email, username, password_hash, full_name, country, profession, date_of_birth, bio, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(email, username, password_hash, full_name ?? null, country ?? null, profession ?? null, date_of_birth ?? null, bio ?? null, ts, ts)

    // create wallet with $100,000 starting balance
    db.prepare(`
      INSERT INTO wallets (user_id, balance, created_at, updated_at)
      VALUES (?, 100000.00, ?, ?)
    `).run(userId, ts, ts)

    // assign 'user' role
    const userRole = db.prepare(
      `SELECT id FROM roles WHERE name = 'user'`
    ).get() as { id: number } | undefined

    if (userRole) {
      db.prepare(`
        INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at)
        VALUES (?, ?, ?)
      `).run(userId, userRole.id, ts)
    }

    return userId as number
  })

  const userId = insertUser()

  // create session
  const token = sessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, expiresAt, ts)

  const user = db.prepare(
    'SELECT id, username, email FROM users WHERE id = ?'
  ).get(userId)

  return c.json({ token, user }, 201)
})

/* ─── POST /auth/login ────────────────────────────────────────── */

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

auth.post('/login', sValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = db.prepare(`
    SELECT id, username, email, password_hash, deleted_at
    FROM users WHERE email = ?
  `).get(email) as { id: number; username: string; email: string; password_hash: string | null; deleted_at: string | null } | undefined

  // generic message to prevent user enumeration
  if (!user || user.deleted_at) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  if (!user.password_hash) {
    return c.json({ error: 'Account uses SSO — password login not available' }, 400)
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // invalidate any expired sessions for this user
  db.prepare(`
    DELETE FROM sessions WHERE user_id = ? AND expires_at < ?
  `).run(user.id, now())

  const token = sessionToken()
  const ts = now()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, user.id, expiresAt, ts)

  return c.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  })
})

/* ─── POST /auth/logout ───────────────────────────────────────── */

auth.post('/logout', (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(token)
  }
  return c.json({ ok: true })
})

/* ─── GET /auth/me ────────────────────────────────────────────── */

auth.get('/me', (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorised' }, 401)

  const session = db.prepare(`
    SELECT s.user_id, u.username, u.email
    FROM   sessions s
    JOIN   users u ON u.id = s.user_id
    WHERE  s.id = ? AND s.expires_at > ? AND s.revoked_at IS NULL AND u.deleted_at IS NULL
  `).get(token, now()) as { user_id: number; username: string; email: string } | undefined

  if (!session) return c.json({ error: 'Unauthorised' }, 401)

  return c.json({ id: session.user_id, username: session.username, email: session.email })
})

export default auth
