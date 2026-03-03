import type Database from 'better-sqlite3'

/**
 * Seeds static / one-time data that must exist before the app runs:
 *  - roles          (user, admin, moderator)
 *  - fee_tiers      (standard flat fee)
 *  - game_clock     (singleton control row)
 *  - stocks         (demo market)
 *
 * All inserts use INSERT OR IGNORE so re-running seed is safe.
 */
export function seed(db: InstanceType<typeof Database>) {
  /* ---- roles ---- */
  const insertRole = db.prepare(
    `INSERT OR IGNORE INTO roles (name, permissions) VALUES (?, ?)`
  )
  const roles = [
    { name: 'user',      permissions: JSON.stringify({ trade: true,  manage_events: false, manage_users: false }) },
    { name: 'moderator', permissions: JSON.stringify({ trade: true,  manage_events: true,  manage_users: false }) },
    { name: 'admin',     permissions: JSON.stringify({ trade: true,  manage_events: true,  manage_users: true  }) },
  ]
  for (const r of roles) insertRole.run(r.name, r.permissions)

  /* ---- fee tiers ---- */
  const insertFeeTier = db.prepare(
    `INSERT OR IGNORE INTO fee_tiers (name, fee_type, fee_value) VALUES (?, ?, ?)`
  )
  insertFeeTier.run('standard', 'percentage', 0.001)   // 0.1 % per trade

  /* ---- game_clock singleton ---- */
  db.prepare(`
    INSERT OR IGNORE INTO game_clock (id) VALUES (1)
  `).run()

  /* ---- stocks ---- */
  const insertStock = db.prepare(`
    INSERT OR IGNORE INTO stocks (symbol, name, sector, initial_price)
    VALUES (?, ?, ?, ?)
  `)

  const stocks: [string, string, string, number][] = [
    // Tech
    ['AAPL',  'Apple Inc.',             'Technology',   182.50],
    ['MSFT',  'Microsoft Corp.',        'Technology',   415.00],
    ['GOOGL', 'Alphabet Inc.',          'Technology',   175.00],
    ['META',  'Meta Platforms Inc.',    'Technology',   505.00],
    ['NVDA',  'NVIDIA Corp.',           'Technology',   875.00],
    ['AMD',   'Advanced Micro Devices', 'Technology',   160.00],
    ['ORCL',  'Oracle Corp.',           'Technology',   125.00],
    // Finance
    ['JPM',   'JPMorgan Chase & Co.',   'Finance',      195.00],
    ['GS',    'Goldman Sachs Group',    'Finance',      470.00],
    ['BAC',   'Bank of America Corp.',  'Finance',       37.00],
    // Healthcare
    ['JNJ',   'Johnson & Johnson',      'Healthcare',   155.00],
    ['PFE',   'Pfizer Inc.',            'Healthcare',    27.00],
    // Energy
    ['XOM',   'Exxon Mobil Corp.',      'Energy',       110.00],
    ['CVX',   'Chevron Corp.',          'Energy',       155.00],
    // Consumer
    ['AMZN',  'Amazon.com Inc.',        'Consumer',     185.00],
    ['TSLA',  'Tesla Inc.',             'Consumer',     220.00],
    ['WMT',   'Walmart Inc.',           'Consumer',     175.00],
  ]

  const seedStocks = db.transaction(() => {
    for (const [symbol, name, sector, price] of stocks) {
      insertStock.run(symbol, name, sector, price)
    }
  })
  seedStocks()

  console.log('[db] seed complete')
}
