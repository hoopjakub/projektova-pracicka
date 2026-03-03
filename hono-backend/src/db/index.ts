import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { initSchema } from './schema.js'
import { seed } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../../stock_market.db')

const db = new Database(DB_PATH)

// WAL mode = much faster concurrent reads; keep FK enforcement on
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

initSchema(db)
seed(db)

console.log(`[db] opened: ${DB_PATH}`)

export default db
