// lib/db.ts - SQLite helpers with WAL defaults and typed queries
// ═══════════════════════════════════════════════════════════════════════════════
// Auto-creates parent directories, sets WAL mode, provides transaction
// wrappers and typed query helpers. All operations return null on failure.
// ═══════════════════════════════════════════════════════════════════════════════

import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// BN-065: Open with Pragmas
// ─────────────────────────────────────────────────────────────────────────────
export interface OpenOptions {
  readonly?: boolean;
  create?: boolean;
  wal?: boolean;
  strict?: boolean;
}

export const open = (path: string, options?: OpenOptions): Database | null => {
  const { readonly = false, create = true, wal = true, strict = false } = options ?? {};

  try {
    if (path !== ":memory:" && create) {
      mkdirSync(dirname(path), { recursive: true });
    }

    const db = new Database(path, { readonly, create, strict });

    if (wal && !readonly) {
      db.exec("PRAGMA journal_mode = WAL");
      db.exec("PRAGMA synchronous = NORMAL");
    }

    return db;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-066: Transaction Wrapper
// ─────────────────────────────────────────────────────────────────────────────
export const transaction = <T>(db: Database, fn: (db: Database) => T): T | null => {
  try {
    return db.transaction(() => fn(db))();
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-067: Schema Migration
// ─────────────────────────────────────────────────────────────────────────────
export const migrate = (db: Database, statements: string[]): boolean => {
  try {
    db.transaction(() => {
      for (const stmt of statements) {
        db.exec(stmt);
      }
    })();
    return true;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-068: Query Helpers
// ─────────────────────────────────────────────────────────────────────────────
export const queryAll = <T>(db: Database, sql: string, params?: any[]): T[] => {
  try {
    const stmt = db.prepare(sql);
    return (params ? stmt.all(...params) : stmt.all()) as T[];
  } catch {
    return [];
  }
};

export const queryOne = <T>(db: Database, sql: string, params?: any[]): T | null => {
  try {
    const stmt = db.prepare(sql);
    return (params ? stmt.get(...params) : stmt.get()) as T | null;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-069: Exec (Write Statements)
// ─────────────────────────────────────────────────────────────────────────────
export const exec = (db: Database, sql: string, params?: any[]): boolean => {
  try {
    if (params && params.length > 0) {
      db.prepare(sql).run(...params);
    } else {
      db.exec(sql);
    }
    return true;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-069b: Lifecycle & Convenience
// ─────────────────────────────────────────────────────────────────────────────
export const close = (db: Database): boolean => {
  try {
    db.close();
    return true;
  } catch {
    return false;
  }
};

export const tableExists = (db: Database, name: string): boolean => {
  const row = queryOne<{ cnt: number }>(
    db, "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=?", [name]
  );
  return (row?.cnt ?? 0) > 0;
};

export const tables = (db: Database): string[] =>
  queryAll<{ name: string }>(
    db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).map(r => r.name);
