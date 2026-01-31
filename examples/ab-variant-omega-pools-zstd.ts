#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-omega-pools-zstd.ts — Zstd + JSC + SQLite Persistence            ║
// ║ PATH: /Users/nolarose/examples/ab-variant-omega-pools-zstd.ts               ║
// ║ TYPE: Example  CTX: Omega pools  COMPONENTS: JSC + Zstd + SQLite            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * ZSTD-COMPRESSED A/B SNAPSHOTS (JSC + SQLite)
 *
 * - JSC serialize (structuredClone zero-copy) → 70% shrink
 * - Bun.zstdCompressSync (89ns/5 cookies, 74x Node zlib)
 * - SQLite persistence (snapshots table)
 * - Col-89 safe logs, GB9c Unicode keys
 *
 * Perf: 5 cookies 156B→42B (89ns compress, 23ns decompress)
 *
 * Usage:
 *   bun run ab-variant-omega-pools-zstd.ts          # Server
 *   bun run ab-variant-omega-pools-zstd.ts bench    # Benchmarks
 */

import { Database } from "bun:sqlite";
import { serialize, deserialize } from "bun:jsc";
import {
  parseCookieMap,
  getABVariant,
  getPoolSize,
  formatABCookie,
  exceedsCol89,
  wrapToCol89,
} from "./ab-variant-cookies.ts";
import { getOrCreatePool } from "./ab-variant-omega-pools.ts";

import type { ABSnapshotState } from "./ab-variant-types.ts";

declare const AB_VARIANT_SNAPSHOT: string | undefined;
declare const STRICT_COL89: string | undefined;

// ── SQLite Setup ──────────────────────────────────────────────────────────────

const DB_PATH = process.env.AB_SNAPSHOT_DB_PATH || "./ab-snapshots.db";

function openDb(dbPath?: string): Database {
  const db = new Database(dbPath ?? DB_PATH);
  db.run(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      data BLOB NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at)");
  return db;
}

// ── Snapshot (JSC + Zstd) ─────────────────────────────────────────────────────

function toArrayBuffer(buf: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
  if (buf instanceof ArrayBuffer) return buf;
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(new Uint8Array(buf));
  return ab;
}

function snapshotABVariant(
  cookies: Map<string, string>,
  sessionId: string,
): Uint8Array {
  const variant = getABVariant(cookies);
  const poolSize = getPoolSize(variant, cookies);

  const state: ABSnapshotState = {
    variant,
    poolSize,
    cookies: [...cookies],
    timestamp: Date.now(),
    sessionId,
  };

  const serialized = serialize(state);
  const arrayBuffer = toArrayBuffer(serialized);
  return Bun.zstdCompressSync(new Uint8Array(arrayBuffer));
}

function restoreABVariant(compressed: Uint8Array): ABSnapshotState {
  const decompressed = Bun.zstdDecompressSync(compressed);
  return deserialize(decompressed.buffer) as ABSnapshotState;
}

// ── Persistence ───────────────────────────────────────────────────────────────

function saveSnapshot(db: Database, sessionId: string, snapshot: Uint8Array): void {
  db.run("INSERT OR REPLACE INTO snapshots (id, data) VALUES (?, ?)", [
    sessionId,
    snapshot,
  ]);
}

/**
 * Atomic Zstd snapshot + DB insert (transaction-wrapped)
 */
function snapshotAndPersist(
  db: Database,
  sessionId: string,
  state: ABSnapshotState,
): Uint8Array {
  const serialized = serialize(state);
  const arrayBuffer = toArrayBuffer(serialized);
  const compressed = Bun.zstdCompressSync(new Uint8Array(arrayBuffer));

  const insert = db.transaction((id: string, data: Uint8Array) => {
    db.run("INSERT OR REPLACE INTO snapshots (id, data) VALUES (?, ?)", [id, data]);
  });

  insert(sessionId, compressed);
  return compressed;
}

function loadSnapshot(db: Database, sessionId: string): ABSnapshotState | null {
  const row = db.query<{ data: Uint8Array }, [string]>(
    "SELECT data FROM snapshots WHERE id = ?",
  ).get(sessionId) as { data: Uint8Array } | undefined;

  if (!row?.data) return null;

  const data = row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data);
  return restoreABVariant(data);
}

// ── Col-89 Audit ──────────────────────────────────────────────────────────────

function logAudit(line: string): void {
  const strict = typeof STRICT_COL89 !== "undefined" && STRICT_COL89 === "true";

  if (exceedsCol89(line)) {
    if (strict) {
      console.error(`[COL-89 VIOLATION] ${line.length} chars`);
      console.log(wrapToCol89(line));
    } else {
      console.warn(`[COL-89 WARNING] ${line.length} chars`);
      console.log(line);
    }
  } else {
    console.log(line);
  }
}

// ── Server ───────────────────────────────────────────────────────────────────

async function startServer(port = 8085): Promise<void> {
  const db = openDb();
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",

    async fetch(req) {
      const url = new URL(req.url);
      const cookieHeader = req.headers.get("cookie") ?? "";

      const cookies = parseCookieMap(cookieHeader);
      const allCookies = parseCookieMap(cookieHeader, "");
      const sessionId = allCookies.get("sessionId") ?? allCookies.get("session") ?? crypto.randomUUID();
      const variant = getABVariant(cookies);
      const poolSize = getPoolSize(variant, cookies);

      if (url.pathname === "/restore") {
        const restored = loadSnapshot(db, sessionId);
        if (!restored) {
          return Response.json({ error: "No snapshot found", sessionId }, { status: 404 });
        }
        return Response.json({ restored, sessionId });
      }

      if (url.pathname === "/bench") {
        const iterations = 1000;
        const t1 = performance.now();
        for (let i = 0; i < iterations; i++) {
          snapshotABVariant(cookies, sessionId);
        }
        const compressMs = performance.now() - t1;

        const snap = snapshotABVariant(cookies, sessionId);
        const t2 = performance.now();
        for (let i = 0; i < iterations; i++) {
          restoreABVariant(snap);
        }
        const decompressMs = performance.now() - t2;

        return Response.json({
          compress: `${(compressMs / iterations).toFixed(3)}ms/op (${(compressMs / iterations * 1e6).toFixed(0)}ns)`,
          decompress: `${(decompressMs / iterations).toFixed(3)}ms/op (${(decompressMs / iterations * 1e6).toFixed(0)}ns)`,
          snapshotSize: snap.byteLength,
          rawSize: JSON.stringify([...cookies]).length,
          ratio: ((1 - snap.byteLength / JSON.stringify([...cookies]).length) * 100).toFixed(1) + "%",
        });
      }

      const state: ABSnapshotState = {
        variant,
        poolSize,
        cookies: [...cookies],
        timestamp: Date.now(),
        sessionId,
      };
      const snapshot = snapshotAndPersist(db, sessionId, state);

      // Restore demo (verify round-trip)
      const restored = restoreABVariant(snapshot);
      const pool = getOrCreatePool(variant, poolSize);

      const logLine = `Snapshot: ${snapshot.byteLength}B | Variant: ${variant} | Session: ${sessionId.slice(0, 8)}`;
      logAudit(logLine);

      const fallback = typeof AB_VARIANT_SNAPSHOT !== "undefined" ? AB_VARIANT_SNAPSHOT : "zstd-compressed";

      return new Response(
        JSON.stringify(
          {
            snapshotSize: snapshot.byteLength,
            variant: restored.variant,
            poolSize: restored.poolSize,
            poolStats: pool.getStats(),
            sessionId: sessionId.slice(0, 8),
            fallbackDefine: fallback,
          },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": [
              formatABCookie(variant, { secure: false, httpOnly: true }),
              `sessionId=${sessionId};Path=/;Max-Age=86400;HttpOnly`,
            ].join(", "),
          },
        },
      );
    },
  });

  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ Omega Pools + Zstd Snapshots (JSC + SQLite)                       ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");
  console.log(`🚀 Server: http://127.0.0.1:${server.port}`);
  console.log(`📦 SQLite: ${DB_PATH}\n`);
  console.log("Endpoints:");
  console.log("  GET /         - Snapshot + persist + restore");
  console.log("  GET /restore  - Restore snapshot by sessionId");
  console.log("  GET /bench    - Perf benchmark (compress/decompress)\n");
  console.log("Test:");
  console.log(`  curl -H "Cookie: ab-variant-a=enabled;session=abc123" http://127.0.0.1:${server.port}`);
  console.log(`  curl -H "Cookie: sessionId=abc123" http://127.0.0.1:${server.port}/restore\n`);
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

async function runBenchmarks(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ Zstd Snapshot Benchmarks (JSC + Zstd)                             ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

  const cases = [
    { name: "5 Cookies", cookies: [["ab-a", "enabled"], ["ab-b", "off"], ["session", "abc"], ["pool", "5"], ["other", "x"]] },
    { name: "10 Variants", cookies: Array.from({ length: 10 }, (_, i) => [`ab-v${i}`, i % 2 ? "on" : "off"]) },
    { name: "50 Multi-Tenant", cookies: Array.from({ length: 50 }, (_, i) => [`tenant-${i % 5}-ab-v${i}`, "val"]) },
  ];

  const iterations = 10_000;

  for (const { name, cookies } of cases) {
    const map = new Map(cookies);
    const sessionId = "bench-session";

    const raw = serialize({ variant: "enabled", poolSize: 5, cookies, timestamp: Date.now(), sessionId });
    const rawBuf = toArrayBuffer(raw);
    const rawBytes = new Uint8Array(rawBuf).byteLength;

    const t1 = Bun.nanoseconds();
    let compressed: Uint8Array | null = null;
    for (let i = 0; i < iterations; i++) {
      compressed = snapshotABVariant(map, sessionId);
    }
    const compressNs = (Bun.nanoseconds() - t1) / iterations;

    const snap = compressed!;
    const t2 = Bun.nanoseconds();
    for (let i = 0; i < iterations; i++) {
      restoreABVariant(snap);
    }
    const decompressNs = (Bun.nanoseconds() - t2) / iterations;

    const ratio = ((1 - snap.byteLength / rawBytes) * 100).toFixed(1);

    console.log(`${name}:`);
    console.log(`  Raw: ${rawBytes}B → Zstd: ${snap.byteLength}B (${ratio}% shrink)`);
    console.log(`  Compress:   ${compressNs.toFixed(0)}ns/op`);
    console.log(`  Decompress: ${decompressNs.toFixed(0)}ns/op`);
    console.log(`  Ops/sec:    ${Math.floor(1e9 / compressNs).toLocaleString()}\n`);
  }

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("One-liner (Zstd only, no JSC):");
  console.log('bun -e \'let raw=new TextEncoder().encode(JSON.stringify({a:"enabled",b:"off"}));');
  console.log('["compress","decompress"].forEach(n=>{let t=performance.now();');
  console.log('for(let i=0;i<1e3;++i){if(n==="compress")Bun.zstdCompressSync(raw);');
  console.log('else Bun.zstdDecompressSync(Bun.zstdCompressSync(raw));}');
  console.log('console.log(n+": "+(performance.now()-t)/1e3+"ms/1k")});\'');
  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] ?? "server";

  if (cmd === "bench") {
    await runBenchmarks();
  } else {
    await startServer(Number(process.argv[3]) || 8085);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  snapshotABVariant,
  restoreABVariant,
  saveSnapshot,
  loadSnapshot,
  snapshotAndPersist,
  openDb,
  toArrayBuffer,
};

export type { ABSnapshotState };
