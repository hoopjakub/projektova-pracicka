import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as z from 'zod'
import { sValidator } from '@hono/standard-validator'
import db from './db/index.js'
import authRoutes from './routes/auth.js'

const app = new Hono()
app.use(cors())

app.route('/auth', authRoutes)

/* ---------- stocks (DB) ---------- */

app.get('/stocks', (c) => {
  const rows = db.prepare(`
    SELECT id, symbol, name, sector, initial_price
    FROM   stocks
    WHERE  deleted_at IS NULL
    ORDER  BY symbol
  `).all()
  return c.json(rows)
})

app.get('/stocks/:symbol', (c) => {
  const symbol = c.req.param('symbol').toUpperCase()
  const row = db.prepare(`
    SELECT * FROM stocks WHERE symbol = ? AND deleted_at IS NULL
  `).get(symbol)
  if (!row) return c.json({ error: 'Stock not found' }, 404)
  return c.json(row)
})

/* ---------- legacy in-memory users (to be replaced) ---------- */

const users = ['Martin', 'Stefan', 'Robert', 'Maros']

app.get('/users', (c) => {
  return c.json(users)
})

app.get('/users/:id', (c) => {
  const id = parseInt(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.text('Napisal si chujovinu')
  }

  return c.text(users[id])
})

const schema = z.object({
  newUsername: z.email(),
})

app.post('/users', sValidator('json', schema), async (c) => {
  const body = c.req.valid('json')
  users.push(body.newUsername)
  return c.text('ok')
})

app.delete('/users/:id', (c) => {
  const id = parseInt(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.text('Napisal si chujovinu')
  }

  users.splice(id, 1)

  return c.text('ok')
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
