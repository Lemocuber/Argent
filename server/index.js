import express from 'express'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = process.env.ARGENT_DATA_DIR || path.join(root, 'data')
const dbFile = path.join(dataDir, 'argent.sqlite')
const app = express()

fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(dbFile)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK(type IN ('cash', 'savings', 'accrued')),
    position INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    entry_date TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, entry_date)
  );

  CREATE INDEX IF NOT EXISTS channels_account ON channels(account_id, archived, position);
  CREATE INDEX IF NOT EXISTS entries_channel_date ON entries(channel_id, entry_date);
`)

if (!db.prepare("PRAGMA table_info(channels)").all().some(column => column.name === 'closed_at')) db.exec('ALTER TABLE channels ADD COLUMN closed_at TEXT')

app.use(express.json({ limit: '32kb' }))

const validAccount = id => /^[0-2][0-9a-z](?:[0-2][0-9a-z]){11}$/.test(id)
const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`))
const accountExists = id => db.prepare('SELECT 1 FROM accounts WHERE id = ?').get(id)
const channelFor = (id, accountId) => db.prepare('SELECT * FROM channels WHERE id = ? AND account_id = ?').get(id, accountId)
const stateFor = accountId => ({
  channels: db.prepare(`
    SELECT id, name, type, position, archived, closed_at AS closedAt
    FROM channels WHERE account_id = ? ORDER BY archived, position, id
  `).all(accountId),
  entries: db.prepare(`
    SELECT e.id, e.channel_id AS channelId, e.entry_date AS date,
           e.amount_cents AS amountCents, e.note
    FROM entries e JOIN channels c ON c.id = e.channel_id
    WHERE c.account_id = ? ORDER BY e.entry_date, e.id
  `).all(accountId)
})

app.put('/api/accounts/:accountId', (req, res) => {
  if (!validAccount(req.params.accountId)) return res.sendStatus(400)
  db.prepare('INSERT OR IGNORE INTO accounts (id) VALUES (?)').run(req.params.accountId)
  res.json(stateFor(req.params.accountId))
})

app.get('/api/accounts/:accountId/state', (req, res) => {
  const { accountId } = req.params
  if (!accountExists(accountId)) return res.sendStatus(404)
  res.json(stateFor(accountId))
})

app.post('/api/accounts/:accountId/channels', (req, res) => {
  const { accountId } = req.params
  const { name = '', type } = req.body
  if (!accountExists(accountId) || !['cash', 'savings', 'accrued'].includes(type)) return res.sendStatus(400)
  const position = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS value FROM channels WHERE account_id = ?').get(accountId).value
  const result = db.prepare('INSERT INTO channels (account_id, name, type, position) VALUES (?, ?, ?, ?)').run(accountId, String(name).slice(0, 48), type, position)
  res.status(201).json(db.prepare('SELECT id, name, type, position, archived, closed_at AS closedAt FROM channels WHERE id = ?').get(result.lastInsertRowid))
})

app.patch('/api/accounts/:accountId/channels/:channelId', (req, res) => {
  const { accountId, channelId } = req.params
  const channel = channelFor(channelId, accountId)
  if (!channel) return res.sendStatus(404)
  const next = {
    name: typeof req.body.name === 'string' ? req.body.name.slice(0, 48) : channel.name,
    type: ['cash', 'savings', 'accrued'].includes(req.body.type) ? req.body.type : channel.type,
    archived: req.body.archived === undefined ? channel.archived : Number(Boolean(req.body.archived))
  }
  db.prepare('UPDATE channels SET name = ?, type = ?, archived = ? WHERE id = ?').run(next.name, next.type, next.archived, channelId)
  res.json({ id: Number(channelId), ...next, position: channel.position })
})

app.delete('/api/accounts/:accountId/channels/:channelId', (req, res) => {
  const result = db.prepare('UPDATE channels SET archived = 1 WHERE id = ? AND account_id = ? AND archived = 0').run(req.params.channelId, req.params.accountId)
  res.sendStatus(result.changes ? 204 : 404)
})

app.put('/api/accounts/:accountId/channels/:channelId/close', (req, res) => {
  const channel = channelFor(req.params.channelId, req.params.accountId)
  if (!channel || channel.archived || channel.closed_at || !validDate(req.body.date)) return res.sendStatus(400)
  db.prepare(`
    INSERT INTO entries (channel_id, entry_date, amount_cents)
    VALUES (?, ?, 0)
    ON CONFLICT(channel_id, entry_date) DO UPDATE SET
      amount_cents = 0,
      updated_at = CURRENT_TIMESTAMP
  `).run(req.params.channelId, req.body.date)
  db.prepare('UPDATE channels SET closed_at = ? WHERE id = ?').run(req.body.date, req.params.channelId)
  res.json({
    channel: db.prepare('SELECT id, name, type, position, archived, closed_at AS closedAt FROM channels WHERE id = ?').get(req.params.channelId),
    entry: db.prepare(`
      SELECT id, channel_id AS channelId, entry_date AS date, amount_cents AS amountCents, note
      FROM entries WHERE channel_id = ? AND entry_date = ?
    `).get(req.params.channelId, req.body.date)
  })
})

app.put('/api/accounts/:accountId/entries', (req, res) => {
  const { accountId } = req.params
  const { channelId, date, amountCents, note = '' } = req.body
  const channel = channelFor(channelId, accountId)
  if (!channel || channel.archived || channel.closed_at && date >= channel.closed_at || !validDate(date) || !Number.isSafeInteger(amountCents)) return res.sendStatus(400)
  db.prepare(`
    INSERT INTO entries (channel_id, entry_date, amount_cents, note)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(channel_id, entry_date) DO UPDATE SET
      amount_cents = excluded.amount_cents,
      note = excluded.note,
      updated_at = CURRENT_TIMESTAMP
  `).run(channelId, date, amountCents, String(note).slice(0, 400))
  res.json(db.prepare(`
    SELECT id, channel_id AS channelId, entry_date AS date, amount_cents AS amountCents, note
    FROM entries WHERE channel_id = ? AND entry_date = ?
  `).get(channelId, date))
})

app.delete('/api/accounts/:accountId/entries/:entryId', (req, res) => {
  const result = db.prepare(`
    DELETE FROM entries WHERE id = ? AND channel_id IN (
      SELECT id FROM channels WHERE account_id = ?
    )
  `).run(req.params.entryId, req.params.accountId)
  res.sendStatus(result.changes ? 204 : 404)
})

const dist = path.join(root, 'dist')
if (process.env.NODE_ENV === 'production' && fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next())
}

const backup = async () => {
  const dir = path.join(dataDir, 'backups')
  const file = path.join(dir, `argent-${new Date().toISOString().slice(0, 10)}.sqlite`)
  fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) await db.backup(file)
}

const port = Number(process.env.PORT) || 3001
const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (direct) {
  backup().catch(console.error)
  setInterval(() => backup().catch(console.error), 60 * 60 * 1000).unref()
  const server = app.listen(port, () => console.log(`Argent :${port}`))
  const close = () => server.close(() => { db.close(); process.exit(0) })
  process.on('SIGINT', close)
  process.on('SIGTERM', close)
}

export { app, backup, db }
