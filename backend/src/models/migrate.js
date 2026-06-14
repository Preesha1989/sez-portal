const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('requester','sez_team','sez_admin')),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (NOW()::text),
        updated_at TEXT NOT NULL DEFAULT (NOW()::text)
      );

      CREATE TABLE IF NOT EXISTS sez_members (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        role_title TEXT NOT NULL,
        speciality TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        queue_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (NOW()::text)
      );

      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        idempotency_key TEXT UNIQUE,
        request_type TEXT NOT NULL,
        request_category TEXT NOT NULL,
        direction TEXT,
        requester_id TEXT NOT NULL REFERENCES users(id),
        department TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Normal',
        status TEXT NOT NULL DEFAULT 'New',
        assigned_to TEXT REFERENCES sez_members(id),
        description TEXT NOT NULL,
        dynamic_fields TEXT,
        reference_no TEXT,
        created_at TEXT NOT NULL DEFAULT (NOW()::text),
        updated_at TEXT NOT NULL DEFAULT (NOW()::text)
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        uploaded_by TEXT NOT NULL REFERENCES users(id),
        uploaded_at TEXT NOT NULL DEFAULT (NOW()::text)
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        request_id TEXT REFERENCES requests(id),
        actor_id TEXT REFERENCES users(id),
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (NOW()::text)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES users(id),
        author_name TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (NOW()::text)
      );

      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
      CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
      CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_log(request_id);
      CREATE INDEX IF NOT EXISTS idx_documents_request ON documents(request_id);
      CREATE INDEX IF NOT EXISTS idx_comments_request ON comments(request_id);
    `);
    console.log('✅ Migration complete');
  } finally {
    client.release();
    pool.end();
  }
};

migrate().catch(console.error);