import Database from 'better-sqlite3'

const db = new Database('test-db.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    age INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  )  
`)

const mail = 'b@a.com'
const username = 'adam'

// const result = db
//   .prepare(
//     `
//   INSERT INTO users (email, username)
//   VALUES (?, ?)
// `,
//   )
//   .run(mail, username)

const result = db.prepare('SELECT * FROM users WHERE username = ?').all('adam')

console.log(result)
