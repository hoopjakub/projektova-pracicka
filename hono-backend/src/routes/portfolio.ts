import { Hono } from 'hono'
import db from '../db/index.js'

const portfolio = new Hono()

/* ─── auth helper ─────────────────────────────────────────────── */

function getUserIdFromToken(token: string): number | undefined {
  const session = db.prepare(`
    SELECT user_id
    FROM   sessions
    WHERE  id = ?
      AND  revoked_at IS NULL
      AND  expires_at > datetime('now')
  `).get(token) as { user_id: number } | undefined
  return session?.user_id
}

/* ─── GET /portfolio ──────────────────────────────────────────── */

portfolio.get('/', (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  const token = authHeader.slice(7)
  const userId = getUserIdFromToken(token)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  /* cash balance */
  const wallet = db.prepare(
    `SELECT balance FROM wallets WHERE user_id = ?`
  ).get(userId) as { balance: number } | undefined
  const cashBalance = wallet?.balance ?? 0

  /* holdings with current price */
  const rows = db.prepare(`
    SELECT
      h.stock_id,
      h.quantity,
      h.total_cost,
      h.avg_buy_price,
      s.symbol,
      s.name,
      s.sector,
      COALESCE(
        (SELECT price
           FROM stock_price_points
          WHERE stock_id = h.stock_id
          ORDER BY timestamp DESC, sequence DESC
          LIMIT 1),
        s.initial_price
      ) AS current_price
    FROM  holdings h
    JOIN  stocks s ON s.id = h.stock_id
    WHERE h.user_id = ?
      AND h.quantity > 0
    ORDER BY s.symbol
  `).all(userId) as Array<{
    stock_id: number
    quantity: number
    total_cost: number
    avg_buy_price: number
    symbol: string
    name: string
    sector: string
    current_price: number
  }>

  const holdings = rows.map(h => {
    const market_value = h.quantity * h.current_price
    const unrealized_pnl = market_value - h.total_cost
    const unrealized_pnl_pct = h.total_cost > 0 ? (unrealized_pnl / h.total_cost) * 100 : 0
    return {
      stock_id: h.stock_id,
      symbol: h.symbol,
      name: h.name,
      sector: h.sector,
      quantity: h.quantity,
      avg_buy_price: h.avg_buy_price,
      current_price: h.current_price,
      total_cost: h.total_cost,
      market_value,
      unrealized_pnl,
      unrealized_pnl_pct,
    }
  })

  const holdingsValue = holdings.reduce((s, h) => s + h.market_value, 0)
  const totalCost     = holdings.reduce((s, h) => s + h.total_cost,   0)
  const netWorth      = cashBalance + holdingsValue
  const totalPnl      = holdingsValue - totalCost
  const totalPnlPct   = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const pendingOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders
    WHERE user_id = ? AND status IN ('pending', 'partially_filled')
  `).get(userId) as { count: number }

  return c.json({
    cash_balance:         cashBalance,
    holdings_value:       holdingsValue,
    net_worth:            netWorth,
    total_pnl:            totalPnl,
    total_pnl_pct:        totalPnlPct,
    pending_orders_count: pendingOrders.count,
    holdings,
  })
})

export default portfolio
