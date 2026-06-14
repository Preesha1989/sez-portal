// src/models/migrate.js
// Run with: node src/models/migrate.js
// Creates all tables fresh. Safe to re-run (uses IF NOT EXISTS).

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './sez_portal.db';
const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrate = db.transaction(() => {

  // ── Users ─────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      department  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('requester','sez_team','sez_admin')),
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── SEZ Team Members (extended profile for the 4-member team) ─────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS sez_members (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id),
      role_title  TEXT NOT NULL,
      speciality  TEXT,           -- e.g. 'Customs', 'Exports', 'Documentation'
      is_active   INTEGER NOT NULL DEFAULT 1,
      queue_count INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Requests ───────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id               TEXT PRIMARY KEY,
      idempotency_key  TEXT UNIQUE,          -- prevents duplicate submissions
      request_type     TEXT NOT NULL,
      request_category TEXT NOT NULL,        -- DTA | RGP | NRGP | COMPLIANCE
      direction        TEXT,                 -- export | import | both | null
      requester_id     TEXT NOT NULL REFERENCES users(id),
      department       TEXT NOT NULL,
      priority         TEXT NOT NULL DEFAULT 'Normal'
                         CHECK(priority IN ('Normal','High','Urgent')),
      status           TEXT NOT NULL DEFAULT 'New'
                         CHECK(status IN ('New','Pending','In Review','Approved','Rejected','Closed')),
      assigned_to      TEXT REFERENCES sez_members(id),
      description      TEXT NOT NULL,
      dynamic_fields   TEXT,                 -- JSON blob of type-specific fields
      reference_no     TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Documents / Attachments ────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      request_id   TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      filename     TEXT NOT NULL,            -- original filename
      stored_name  TEXT NOT NULL,            -- UUID filename on disk
      mime_type    TEXT NOT NULL,
      size_bytes   INTEGER NOT NULL,
      uploaded_by  TEXT NOT NULL REFERENCES users(id),
      uploaded_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Audit Log (append-only — no UPDATE/DELETE allowed here) ───────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          TEXT PRIMARY KEY,
      request_id  TEXT REFERENCES requests(id),
      actor_id    TEXT REFERENCES users(id),
      actor_name  TEXT NOT NULL,
      action      TEXT NOT NULL,
      old_value   TEXT,
      new_value   TEXT,
      metadata    TEXT,                      -- JSON for extra context
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Comments ───────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id          TEXT PRIMARY KEY,
      request_id  TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      author_id   TEXT NOT NULL REFERENCES users(id),
      author_name TEXT NOT NULL,
      body        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Indexes ────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_requests_status      ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_assigned    ON requests(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_requests_requester   ON requests(requester_id);
    CREATE INDEX IF NOT EXISTS idx_requests_category    ON requests(request_category);
    CREATE INDEX IF NOT EXISTS idx_requests_created     ON requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_request        ON audit_log(request_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created        ON audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_documents_request    ON documents(request_id);
    CREATE INDEX IF NOT EXISTS idx_comments_request     ON comments(request_id);
  `);

});

migrate();
console.log('✅  Migration complete. DB at:', path.resolve(DB_PATH));
db.close();
