export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  username TEXT NOT NULL,
  password_hash TEXT,
  wechat_openid TEXT UNIQUE,
  wechat_unionid TEXT,
  avatar_url TEXT,
  disabled_at INTEGER,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS divinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  upper INTEGER NOT NULL,
  lower INTEGER NOT NULL,
  hexagram_order INTEGER NOT NULL,
  hexagram_name TEXT NOT NULL,
  moving_line INTEGER NOT NULL,
  moving_name TEXT NOT NULL,
  code INTEGER NOT NULL CHECK (code BETWEEN 1 AND 384),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  interpretation_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_divinations_user_created
  ON divinations(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS point_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('register_bonus','admin_recharge','divination_spend','decision_spend')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  related_divination_id INTEGER,
  operator_admin_id INTEGER,
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_point_tx_user_created
  ON point_transactions(user_id, created_at DESC);
`;
