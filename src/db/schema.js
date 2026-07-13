import * as SQLite from 'expo-sqlite';
import { CATEGORIES } from '../constants/categories';

const DB_NAME = 'expensetracker.db';

let _db = null;

export const getDb = () => {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
};

/**
 * Initialize all tables and seed categories on first run
 */
export const initializeDatabase = () => {
  const db = getDb();

  // Enable WAL mode for better performance
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  // ── users table ──────────────────────────────────────────────
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL UNIQUE,
      username      TEXT    NOT NULL,
      password_hash TEXT    NOT NULL,
      monthly_budget REAL   DEFAULT 0,
      created_at    TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── categories table ─────────────────────────────────────────
  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT    NOT NULL UNIQUE,
      icon  TEXT,
      color TEXT
    );
  `);

  // ── expenses table ────────────────────────────────────────────
  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL,
      category_id    INTEGER NOT NULL DEFAULT 10,
      amount         REAL    NOT NULL CHECK(amount > 0),
      currency       TEXT    NOT NULL DEFAULT 'INR',
      description    TEXT,
      date           TEXT    NOT NULL,
      is_recurring   INTEGER NOT NULL DEFAULT 0,
      recurrence_day INTEGER,
      created_at     TEXT    DEFAULT (datetime('now')),
      updated_at     TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // ── recurring_log table ───────────────────────────────────────
  db.execSync(`
    CREATE TABLE IF NOT EXISTS recurring_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id      INTEGER NOT NULL,
      triggered_month TEXT    NOT NULL,
      triggered_at    TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
    );
  `);

  // Seed categories if empty
  const count = db.getFirstSync('SELECT COUNT(*) as cnt FROM categories;');
  if (count.cnt === 0) {
    for (const cat of CATEGORIES) {
      db.runSync(
        'INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?);',
        [cat.id, cat.name, cat.icon, cat.color]
      );
    }
  }
};
