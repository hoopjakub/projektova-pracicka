import type Database from 'better-sqlite3'

/**
 * SQLite adaptations from the MySQL/DBML schema:
 *  - ENUM       → TEXT with CHECK constraint
 *  - BIGINT/INT → INTEGER
 *  - DECIMAL    → REAL
 *  - BOOLEAN    → INTEGER (0 / 1)
 *  - JSON       → TEXT
 *  - datetime   → TEXT  (ISO-8601 strings via SQLite date functions)
 */
export function initSchema(db: InstanceType<typeof Database>) {
  db.exec(`
    /* ===========================
       FILE UPLOADS
       (created first — stocks.icon_file_id references this table)
    =========================== */

    CREATE TABLE IF NOT EXISTS files (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      purpose         TEXT    NOT NULL CHECK (purpose IN ('stock_icon','csv_import','avatar','other')),
      mime_type       TEXT    NOT NULL,
      size_bytes      INTEGER NOT NULL,
      storage_path    TEXT    NOT NULL,
      original_name   TEXT    NOT NULL,
      content_hash    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      deleted_at      TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_files_owner        ON files (owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_files_purpose      ON files (purpose);
    CREATE INDEX IF NOT EXISTS idx_files_content_hash ON files (content_hash);
    CREATE INDEX IF NOT EXISTS idx_files_deleted_at   ON files (deleted_at);

    /* ===========================
       USERS / AUTH
    =========================== */

    CREATE TABLE IF NOT EXISTS users (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      email             TEXT    NOT NULL UNIQUE,
      username          TEXT    NOT NULL UNIQUE,
      password_hash     TEXT,
      auth_provider     TEXT    NOT NULL DEFAULT 'local',
      provider_user_id  TEXT,
      is_email_verified INTEGER NOT NULL DEFAULT 0,
      -- profile fields
      full_name         TEXT,
      country           TEXT,
      profession        TEXT,
      date_of_birth     TEXT,
      bio               TEXT,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      deleted_at        TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider
      ON users (auth_provider, provider_user_id)
      WHERE provider_user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

    CREATE TABLE IF NOT EXISTS roles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      permissions TEXT,                              -- JSON
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id    INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, role_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

    CREATE TABLE IF NOT EXISTS sessions (
      id               TEXT    PRIMARY KEY,          -- hashed token / UUID
      user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address       TEXT,                         -- supports IPv6
      user_agent       TEXT,
      expires_at       TEXT    NOT NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      revoked_at       TEXT,
      last_activity_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

    /* ===========================
       MONEY / WALLET
    =========================== */

    CREATE TABLE IF NOT EXISTS wallets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      balance    REAL    NOT NULL DEFAULT 100000.00,
      version    INTEGER NOT NULL DEFAULT 0,         -- optimistic locking
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id      INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      amount         REAL    NOT NULL,               -- positive = credit, negative = debit
      balance_before REAL    NOT NULL,
      balance_after  REAL    NOT NULL,
      reason         TEXT    NOT NULL CHECK (reason IN (
                       'trade_buy','trade_sell','fee','deposit',
                       'withdrawal','admin_adjustment','season_reset'
                     )),
      reference_id   INTEGER,                        -- trade_id / order_id / etc.
      reference_type TEXT,
      notes          TEXT,
      created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created ON wallet_transactions (wallet_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref            ON wallet_transactions (reference_type, reference_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at     ON wallet_transactions (created_at);

    /* ===========================
       STOCKS / PRICES
    =========================== */

    CREATE TABLE IF NOT EXISTS stocks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol        TEXT    NOT NULL UNIQUE,
      name          TEXT    NOT NULL,
      description   TEXT,
      deleted_at    TEXT,
      icon_file_id  INTEGER REFERENCES files(id) ON DELETE SET NULL,
      sector        TEXT,
      initial_price REAL    NOT NULL DEFAULT 100.0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_stocks_deleted_at ON stocks (deleted_at);
    CREATE INDEX IF NOT EXISTS idx_stocks_sector     ON stocks (sector);

    CREATE TABLE IF NOT EXISTS stock_price_points (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_id  INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
      price     REAL    NOT NULL,
      timestamp TEXT    NOT NULL,
      sequence  INTEGER NOT NULL DEFAULT 0,
      source    TEXT    NOT NULL DEFAULT 'simulator',
      volume    INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_spp_stock_ts_seq    ON stock_price_points (stock_id, timestamp, sequence);
    CREATE INDEX        IF NOT EXISTS idx_spp_timestamp       ON stock_price_points (timestamp);
    CREATE INDEX        IF NOT EXISTS idx_spp_stock_timestamp ON stock_price_points (stock_id, timestamp);

    /* ===========================
       TRADING
    =========================== */

    CREATE TABLE IF NOT EXISTS orders (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
      stock_id         INTEGER NOT NULL REFERENCES stocks(id)  ON DELETE RESTRICT,
      side             TEXT    NOT NULL CHECK (side IN ('buy','sell')),
      order_kind       TEXT    NOT NULL CHECK (order_kind IN ('market','limit')),
      quantity         INTEGER NOT NULL,
      filled_quantity  INTEGER NOT NULL DEFAULT 0,
      limit_price      REAL,
      status           TEXT    NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','partially_filled','filled','cancelled','rejected')),
      expires_at       TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      filled_at        TEXT,
      cancelled_at     TEXT,
      idempotency_key  TEXT    UNIQUE,
      rejection_reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user_created  ON orders (user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_stock_status  ON orders (stock_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_status_expires ON orders (status, expires_at);

    CREATE TABLE IF NOT EXISTS trades (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      user_id         INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
      stock_id        INTEGER NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,
      side            TEXT    NOT NULL CHECK (side IN ('buy','sell')),
      quantity        INTEGER NOT NULL,
      price_per_share REAL    NOT NULL,
      fee             REAL    NOT NULL DEFAULT 0.0,
      total_value     REAL    NOT NULL,               -- quantity * price_per_share
      net_value       REAL    NOT NULL,               -- total_value +/- fee
      executed_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_trades_user_executed  ON trades (user_id, executed_at);
    CREATE INDEX IF NOT EXISTS idx_trades_stock_executed ON trades (stock_id, executed_at);
    CREATE INDEX IF NOT EXISTS idx_trades_order_executed ON trades (order_id, executed_at);

    CREATE TABLE IF NOT EXISTS holdings (
      user_id       INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
      stock_id      INTEGER NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,
      quantity      INTEGER NOT NULL DEFAULT 0,
      total_cost    REAL    NOT NULL DEFAULT 0.0,
      avg_buy_price REAL    NOT NULL DEFAULT 0.0,
      version       INTEGER NOT NULL DEFAULT 0,       -- optimistic locking
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, stock_id)
    );
    CREATE INDEX IF NOT EXISTS idx_holdings_stock_id ON holdings (stock_id);

    /* ===========================
       PORTFOLIO TRACKING
    =========================== */

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_day        INTEGER NOT NULL,
      snapshot_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      cash_balance    REAL    NOT NULL,
      portfolio_value REAL    NOT NULL,
      net_worth       REAL    NOT NULL,
      day_change      REAL    NOT NULL DEFAULT 0.0,
      day_change_pct  REAL    NOT NULL DEFAULT 0.0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ps_user_day     ON portfolio_snapshots (user_id, game_day);
    CREATE INDEX        IF NOT EXISTS idx_ps_user_snapshot ON portfolio_snapshots (user_id, snapshot_at);
    CREATE INDEX        IF NOT EXISTS idx_ps_snapshot_at   ON portfolio_snapshots (snapshot_at);

    /* ===========================
       EVENTS / NEWS
    =========================== */

    CREATE TABLE IF NOT EXISTS market_events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      description  TEXT,
      impact_type  TEXT    NOT NULL CHECK (impact_type IN ('global','single_stock','sector')),
      stock_id     INTEGER REFERENCES stocks(id) ON DELETE SET NULL,
      sector       TEXT,
      impact_value REAL    NOT NULL DEFAULT 0.0,        -- 0.15 = +15%, -0.10 = -10%
      starts_at    TEXT    NOT NULL,
      ends_at      TEXT,
      status       TEXT    NOT NULL DEFAULT 'scheduled'
                           CHECK (status IN ('scheduled','active','completed','cancelled')),
      applied_at   TEXT,
      created_by   INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_me_starts_status ON market_events (starts_at, status);
    CREATE INDEX IF NOT EXISTS idx_me_stock_id      ON market_events (stock_id);
    CREATE INDEX IF NOT EXISTS idx_me_sector        ON market_events (sector);

    /* ===========================
       GAME CLOCK / MARKET SESSIONS
    =========================== */

    CREATE TABLE IF NOT EXISTS game_clock (
      id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
      is_running          INTEGER NOT NULL DEFAULT 1,
      day_length_seconds  INTEGER NOT NULL DEFAULT 1200, -- 20 min = 1 in-game day
      market_open_second  INTEGER NOT NULL DEFAULT 0,
      market_close_second INTEGER NOT NULL DEFAULT 840,  -- market open for 14 min
      current_day         INTEGER NOT NULL DEFAULT 1,
      day_second          INTEGER NOT NULL DEFAULT 0,
      market_state        TEXT    NOT NULL DEFAULT 'open' CHECK (market_state IN ('open','closed')),
      last_tick_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_game_clock_market_state ON game_clock (market_state);

    /* ===========================
       LEADERBOARD
    =========================== */

    CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id    INTEGER NOT NULL DEFAULT 1,
      snapshot_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      game_day     INTEGER NOT NULL,
      metric       TEXT    NOT NULL DEFAULT 'net_worth'
                           CHECK (metric IN ('net_worth','roi','volume')),
      total_players INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_ls_season_day  ON leaderboard_snapshots (season_id, game_day);
    CREATE INDEX IF NOT EXISTS idx_ls_snapshot_at ON leaderboard_snapshots (snapshot_at);
    CREATE INDEX IF NOT EXISTS idx_ls_metric       ON leaderboard_snapshots (metric, snapshot_at);

    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      snapshot_id       INTEGER NOT NULL REFERENCES leaderboard_snapshots(id) ON DELETE CASCADE,
      user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rank              INTEGER NOT NULL,
      net_worth         REAL    NOT NULL,
      cash_balance      REAL    NOT NULL,
      portfolio_value   REAL    NOT NULL,
      starting_capital  REAL    NOT NULL DEFAULT 100000.00,
      roi_pct           REAL,
      total_trades_count INTEGER NOT NULL DEFAULT 0,
      day_pl            REAL    NOT NULL DEFAULT 0.0,
      rank_change       INTEGER NOT NULL DEFAULT 0,
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_le_snapshot_rank ON leaderboard_entries (snapshot_id, rank);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_le_snapshot_user ON leaderboard_entries (snapshot_id, user_id);
    CREATE INDEX        IF NOT EXISTS idx_le_user_snapshot ON leaderboard_entries (user_id, snapshot_id);

    /* ===========================
       TRADING FEES CONFIG
    =========================== */

    CREATE TABLE IF NOT EXISTS fee_tiers (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      fee_type         TEXT    NOT NULL CHECK (fee_type IN ('fixed','percentage','tiered')),
      fee_value        REAL    NOT NULL,
      min_net_worth    REAL,
      min_trades_count INTEGER,
      is_active        INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_fee_tiers (
      user_id      INTEGER PRIMARY KEY REFERENCES users(id)     ON DELETE CASCADE,
      fee_tier_id  INTEGER NOT NULL    REFERENCES fee_tiers(id) ON DELETE RESTRICT,
      assigned_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_uft_fee_tier_id ON user_fee_tiers (fee_tier_id);

    /* ===========================
       RATE LIMITING
    =========================== */

    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint      TEXT    NOT NULL,
      window_start  TEXT    NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rlb_user_endpoint_window
      ON rate_limit_buckets (user_id, endpoint, window_start);
    CREATE INDEX IF NOT EXISTS idx_rlb_window_start ON rate_limit_buckets (window_start);

    /* ===========================
       ADMIN AUDIT LOG
    =========================== */

    CREATE TABLE IF NOT EXISTS admin_actions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      action_type    TEXT    NOT NULL CHECK (action_type IN (
                       'create_event','modify_prices','adjust_balance',
                       'ban_user','delete_stock','other'
                     )),
      target_type    TEXT,
      target_id      INTEGER,
      details        TEXT,                               -- JSON
      ip_address     TEXT,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_aa_admin_created ON admin_actions (admin_user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_aa_action_created ON admin_actions (action_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_aa_target         ON admin_actions (target_type, target_id);
  `)

  // ── migrations: add profile columns to existing users table ──────────────
  // SQLite doesn't support IF NOT EXISTS on ALTER TABLE — swallow duplicate errors
  const migrations = [
    `ALTER TABLE users ADD COLUMN full_name     TEXT`,
    `ALTER TABLE users ADD COLUMN country       TEXT`,
    `ALTER TABLE users ADD COLUMN profession    TEXT`,
    `ALTER TABLE users ADD COLUMN date_of_birth TEXT`,
    `ALTER TABLE users ADD COLUMN bio           TEXT`,
  ]
  for (const sql of migrations) {
    try { db.exec(sql) } catch { /* column already exists */ }
  }
}
