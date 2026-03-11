import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as z from 'zod'
import { sValidator } from '@hono/standard-validator'
import db from './db/index.js'
import authRoutes from './routes/auth.js'
import portfolioRoutes from './routes/portfolio.js'

const app = new Hono()
app.use(cors())

app.route('/auth', authRoutes)
app.route('/portfolio', portfolioRoutes)

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

/* ---------- game clock ---------- */

/* ─── game-clock helper ───────────────────────────────────────── */

type ClockRow = {
  is_running: number
  day_length_seconds: number
  market_open_second: number
  market_close_second: number
  current_day: number
  day_second: number
  market_state: string
  last_tick_at: string
  season: number
}

function computeClock(row: ClockRow) {
  let effectiveDaySecond = row.day_second
  let currentDay = row.current_day

  if (row.is_running) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(row.last_tick_at).getTime()) / 1000)
    const totalSecond    = row.day_second + elapsedSeconds
    effectiveDaySecond   = totalSecond % row.day_length_seconds
    currentDay           = row.current_day + Math.floor(totalSecond / row.day_length_seconds)
  }

  const market_state =
    effectiveDaySecond >= row.market_open_second &&
    effectiveDaySecond <  row.market_close_second
      ? 'open' : 'closed'

  return {
    is_running:          row.is_running === 1,
    day_length_seconds:  row.day_length_seconds,
    market_open_second:  row.market_open_second,
    market_close_second: row.market_close_second,
    current_day:         currentDay,
    day_second:          effectiveDaySecond,
    market_state,
    season:              row.season ?? 1,
  }
}

app.get('/game-clock', (c) => {
  const row = db.prepare(`SELECT * FROM game_clock WHERE id = 1`).get() as ClockRow | undefined
  if (!row) return c.json({ error: 'Game clock not initialized' }, 500)
  return c.json(computeClock(row))
})

/* ─── POST /admin/game-clock ──────────────────────────────────── */
// Actions: pause | resume | reset | set_season | set_day_length
// (No auth guard yet — add Bearer+admin check before going to production)

app.post('/admin/game-clock', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body || !body.action) return c.json({ error: 'Missing action' }, 400)

  const row = db.prepare(`SELECT * FROM game_clock WHERE id = 1`).get() as ClockRow | undefined
  if (!row) return c.json({ error: 'Game clock not initialized' }, 500)

  const ts = new Date().toISOString()

  switch (body.action) {
    case 'pause': {
      // freeze clock: compute current effective second and store it
      const clock = computeClock(row)
      db.prepare(`
        UPDATE game_clock
        SET is_running = 0,
            day_second = ?,
            current_day = ?,
            last_tick_at = ?,
            updated_at = ?
        WHERE id = 1
      `).run(clock.day_second, clock.current_day, ts, ts)
      break
    }
    case 'resume': {
      // resume from current frozen second
      db.prepare(`
        UPDATE game_clock SET is_running = 1, last_tick_at = ?, updated_at = ? WHERE id = 1
      `).run(ts, ts)
      break
    }
    case 'reset': {
      // reset to day 1, second 0
      db.prepare(`
        UPDATE game_clock
        SET is_running = 1, current_day = 1, day_second = 0, last_tick_at = ?, updated_at = ?
        WHERE id = 1
      `).run(ts, ts)
      break
    }
    case 'set_season': {
      const s = Number(body.season)
      if (!Number.isInteger(s) || s < 1) return c.json({ error: 'season must be a positive integer' }, 400)
      db.prepare(`UPDATE game_clock SET season = ?, updated_at = ? WHERE id = 1`).run(s, ts)
      break
    }
    case 'set_day_length': {
      const secs = Number(body.day_length_seconds)
      if (!Number.isInteger(secs) || secs < 60) return c.json({ error: 'day_length_seconds must be >= 60' }, 400)
      db.prepare(`UPDATE game_clock SET day_length_seconds = ?, updated_at = ? WHERE id = 1`).run(secs, ts)
      break
    }
    case 'set_day': {
      const d = Number(body.day)
      if (!Number.isInteger(d) || d < 1) return c.json({ error: 'day must be a positive integer' }, 400)
      db.prepare(`UPDATE game_clock SET current_day = ?, day_second = 0, last_tick_at = ?, updated_at = ? WHERE id = 1`).run(d, ts, ts)
      break
    }
    default:
      return c.json({ error: `Unknown action: ${body.action}` }, 400)
  }

  const updated = db.prepare(`SELECT * FROM game_clock WHERE id = 1`).get() as ClockRow
  return c.json(computeClock(updated))
})

/* ---------- sector indices ---------- */

app.get('/indices', (c) => {
  const stocks = db.prepare(`
    SELECT
      s.id,
      s.sector,
      s.initial_price,
      COALESCE(
        (SELECT price
           FROM stock_price_points
          WHERE stock_id = s.id
          ORDER BY timestamp DESC, sequence DESC
          LIMIT 1),
        s.initial_price
      ) AS current_price
    FROM stocks s
    WHERE s.deleted_at IS NULL
  `).all() as Array<{ id: number; sector: string; initial_price: number; current_price: number }>

  function avgChange(rows: typeof stocks) {
    if (!rows.length) return 0
    const sum = rows.reduce((acc, r) => acc + ((r.current_price - r.initial_price) / r.initial_price) * 100, 0)
    return Math.round((sum / rows.length) * 100) / 100
  }

  const tech   = stocks.filter(s => s.sector === 'Technology')
  const fin    = stocks.filter(s => s.sector === 'Finance')

  return c.json({
    tech:   { label: 'TECH-7',  change: avgChange(tech)   },
    fin:    { label: 'FIN-3',   change: avgChange(fin)    },
    allMkt: { label: 'ALL-MKT', change: avgChange(stocks) },
  })
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
