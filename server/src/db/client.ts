import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";
import { hashPassword } from "../lib/password.js";
import { config } from "../lib/config.js";

export type Db = Database.Database;

export function openDatabase(filePath: string): Db {
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  migrateUsers(db);
  migratePointTransactions(db);
  return db;
}

/** 旧库补微信字段；email/password 改为可空以便公众号授权建档 */
function migrateUsers(db: Database.Database) {
  const cols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{
    name: string;
    notnull: number;
  }>;
  if (!cols.length) return;
  const names = new Set(cols.map((c) => c.name));
  const emailNotNull = cols.find((c) => c.name === "email")?.notnull === 1;
  const passNotNull = cols.find((c) => c.name === "password_hash")?.notnull === 1;
  const needsRebuild = !names.has("wechat_openid") || !names.has("disabled_at") || emailNotNull || passNotNull;

  if (!needsRebuild) {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_openid ON users(wechat_openid)`);
    return;
  }

  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users_migrated (
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
  `);

  const selectCols = [
    "id",
    "email",
    "username",
    "password_hash",
    names.has("wechat_openid") ? "wechat_openid" : "NULL",
    names.has("wechat_unionid") ? "wechat_unionid" : "NULL",
    names.has("avatar_url") ? "avatar_url" : "NULL",
    names.has("disabled_at") ? "disabled_at" : "NULL",
    "points",
    "created_at",
  ].join(", ");

  db.exec(`INSERT OR IGNORE INTO users_migrated (id, email, username, password_hash, wechat_openid, wechat_unionid, avatar_url, disabled_at, points, created_at)
           SELECT ${selectCols} FROM users`);
  db.exec(`DROP TABLE users`);
  db.exec(`ALTER TABLE users_migrated RENAME TO users`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_openid ON users(wechat_openid)`);
  db.pragma("foreign_keys = ON");
}

/** 为已存在的数据库补充决策投射消费类型。SQLite 无法原地修改 CHECK 约束。 */
function migratePointTransactions(db: Database.Database) {
  const table = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'point_transactions'`)
    .get() as { sql?: string } | undefined;
  if (!table?.sql || table.sql.includes("'decision_spend'")) return;

  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE point_transactions_migrated (
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
    INSERT INTO point_transactions_migrated
      (id, user_id, type, amount, balance_after, related_divination_id, operator_admin_id, note, created_at)
      SELECT id, user_id, type, amount, balance_after, related_divination_id, operator_admin_id, note, created_at
      FROM point_transactions;
    DROP TABLE point_transactions;
    ALTER TABLE point_transactions_migrated RENAME TO point_transactions;
    CREATE INDEX IF NOT EXISTS idx_point_tx_user_created
      ON point_transactions(user_id, created_at DESC);
  `);
  db.pragma("foreign_keys = ON");
}

export function seedAdmin(db: Db, username: string, password: string) {
  const row = db.prepare("SELECT id FROM admins LIMIT 1").get();
  if (row) return;
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(
    username,
    hashPassword(password),
  );
}

let singleton: Db | null = null;

export function getDb(): Db {
  if (!singleton) {
    singleton = openDatabase(config.databasePath);
    seedAdmin(singleton, config.adminUser, config.adminPassword);
  }
  return singleton;
}
