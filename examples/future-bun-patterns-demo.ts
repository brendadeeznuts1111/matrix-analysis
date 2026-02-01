#!/usr/bin/env bun
// ╔═════════════════════════════════════════════════════════════╗
// ║ future-bun-patterns-demo.ts                                ║
// ║ Future-Proof Bun Patterns & Optimizations                  ║
// ║ PATH: /Users/nolarose/examples/future-bun-patterns-demo.ts ║
// ║ TYPE: Example  CTX: Tier-1380  COMPONENTS: SQLite+Streams  ║
// ╚═════════════════════════════════════════════════════════════╝

/**
 * FUTURE-PROOF BUN PATTERNS & OPTIMIZATIONS DEMO
 *
 * Demonstrates production-grade patterns that work TODAY:
 *   1. SQLite optimizations (WAL, statement cache, batch inserts)
 *   2. Runtime capability detection & progressive enhancement
 *   3. Typed arrays, NDJSON streaming, buffer ops
 *   4. CSS processing readiness (informational)
 *
 * Zero external dependencies. Uses :memory: SQLite (no side effects).
 *
 * Usage:
 *   bun run examples/future-bun-patterns-demo.ts
 *   bun run future:demo
 */

import { Database } from "bun:sqlite";

// ── Tier-1380 Startup Guard ─────────────────────────────────

const MIN_BUN = ">=1.3.7";
if (!Bun.semver.satisfies(Bun.version, MIN_BUN)) {
  console.error(
    `[TIER-1380] Bun ${Bun.version} < ${MIN_BUN} — upgrade required`
  );
  process.exit(1);
}

// ── Benchmark Results Collector ─────────────────────────────

interface BenchResult {
  section: string;
  operation: string;
  timeMs: string;
  throughput: string;
}

const allResults: BenchResult[] = [];

function recordResult(
  section: string,
  operation: string,
  timeMs: number,
  throughput: string
): void {
  allResults.push({
    section,
    operation,
    timeMs: timeMs.toFixed(3),
    throughput,
  });
}

// ── Statement Cache ─────────────────────────────────────────

type Statement = ReturnType<Database["prepare"]>;
const stmtCache = new Map<string, Statement>();

function cachedPrepare(db: Database, sql: string): Statement {
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
}

// ═════════════════════════════════════════════════════════════
// SECTION 1: SQLite Optimizations
// ═════════════════════════════════════════════════════════════

async function sqliteOptimizations(): Promise<void> {
  console.log("\n[1] SQLite Optimizations");
  console.log("=".repeat(55));

  const db = new Database(":memory:");

  // ── 1a. WAL Mode & PRAGMAs ──────────────────────────────

  console.log("\n  1a. Production PRAGMAs");
  console.log("  " + "-".repeat(40));

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA cache_size = -64000;");
  db.exec("PRAGMA mmap_size = 268435456;");
  db.exec("PRAGMA temp_store = MEMORY;");
  db.exec("PRAGMA page_size = 4096;");

  const pragmas = [
    {
      pragma: "journal_mode",
      value: String(
        (db.query("PRAGMA journal_mode").get() as any)?.journal_mode
      ),
      note: ":memory: returns 'memory'; file DB returns 'wal'",
    },
    {
      pragma: "synchronous",
      value: String(
        (db.query("PRAGMA synchronous").get() as any)?.synchronous
      ),
      note: "1 = NORMAL (safe + fast)",
    },
    {
      pragma: "cache_size",
      value: String(
        (db.query("PRAGMA cache_size").get() as any)?.cache_size
      ),
      note: "negative = KB (64MB)",
    },
    {
      pragma: "mmap_size",
      value: (() => {
        const row = db.query("PRAGMA mmap_size").get() as any;
        return row ? String(Object.values(row)[0]) : "N/A (:memory:)";
      })(),
      note: "256MB memory-mapped I/O (file DB only)",
    },
  ];

  console.log(Bun.inspect.table(pragmas, ["pragma", "value", "note"]));

  // ── 1b. Schema + Indexes ────────────────────────────────

  console.log("  1b. Schema + Indexes");
  console.log("  " + "-".repeat(40));

  db.exec(`
    CREATE TABLE metrics (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      category TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);

  db.exec(
    "CREATE INDEX idx_metrics_cat_val ON metrics(category, value)"
  );
  db.exec(
    "CREATE INDEX idx_metrics_high ON metrics(value) WHERE value > 100"
  );

  console.log("  Created: metrics table");
  console.log("  Index:   idx_metrics_cat_val (composite)");
  console.log("  Index:   idx_metrics_high (partial, value > 100)");

  // ── 1c. Prepared Statement Cache Benchmark ──────────────

  console.log("\n  1c. Prepared Statement Cache");
  console.log("  " + "-".repeat(40));

  const insertSql =
    "INSERT INTO metrics (name, value, category) VALUES (?, ?, ?)";
  const iterations = 10_000;

  // Benchmark: raw prepare each time
  const t1 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    db.prepare(insertSql);
  }
  const rawPrepareNs = (Bun.nanoseconds() - t1) / iterations;

  // Benchmark: cached prepare
  stmtCache.clear();
  const t2 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    cachedPrepare(db, insertSql);
  }
  const cachedPrepareNs = (Bun.nanoseconds() - t2) / iterations;

  const cacheSpeedup = rawPrepareNs / cachedPrepareNs;

  const cacheResults = [
    {
      approach: "db.prepare() each call",
      nsPerOp: rawPrepareNs.toFixed(0),
      opsPerSec: Math.floor(1e9 / rawPrepareNs).toLocaleString(),
    },
    {
      approach: "cachedPrepare()",
      nsPerOp: cachedPrepareNs.toFixed(0),
      opsPerSec: Math.floor(1e9 / cachedPrepareNs).toLocaleString(),
    },
  ];

  console.log(Bun.inspect.table(cacheResults));
  console.log(`  Speedup: ${cacheSpeedup.toFixed(1)}x`);

  recordResult(
    "SQLite",
    "Statement cache",
    cachedPrepareNs / 1e6,
    `${cacheSpeedup.toFixed(1)}x faster`
  );

  // ── 1d. Batch Insert Benchmark ──────────────────────────

  console.log("\n  1d. Batch Insert (Transaction vs Individual)");
  console.log("  " + "-".repeat(40));

  const categories = ["cpu", "memory", "disk", "network", "gpu"];

  function generateRows(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      name: `metric_${i}`,
      value: Math.random() * 200,
      category: categories[i % categories.length],
    }));
  }

  // Individual inserts (1,000 only)
  const smallRows = generateRows(1_000);
  const insertStmt = cachedPrepare(db, insertSql);

  const t3 = Bun.nanoseconds();
  for (const row of smallRows) {
    insertStmt.run(row.name, row.value, row.category);
  }
  const individualMs = (Bun.nanoseconds() - t3) / 1e6;

  // Transaction-wrapped batch (10,000)
  const batchRows = generateRows(10_000);

  const batchInsert = db.transaction(() => {
    const stmt = cachedPrepare(db, insertSql);
    for (const row of batchRows) {
      stmt.run(row.name, row.value, row.category);
    }
  });

  const t4 = Bun.nanoseconds();
  batchInsert();
  const transactionMs = (Bun.nanoseconds() - t4) / 1e6;

  const insertResults = [
    {
      approach: "Individual inserts",
      rows: 1_000,
      timeMs: individualMs.toFixed(2),
      nsPerRow: ((individualMs * 1e6) / 1_000).toFixed(0),
      rowsPerSec: Math.floor(1_000 / (individualMs / 1_000))
        .toLocaleString(),
    },
    {
      approach: "Transaction batch",
      rows: 10_000,
      timeMs: transactionMs.toFixed(2),
      nsPerRow: ((transactionMs * 1e6) / 10_000).toFixed(0),
      rowsPerSec: Math.floor(10_000 / (transactionMs / 1_000))
        .toLocaleString(),
    },
  ];

  console.log(Bun.inspect.table(insertResults));

  recordResult(
    "SQLite",
    "Transaction batch (10k)",
    transactionMs,
    `${Math.floor(10_000 / (transactionMs / 1_000)).toLocaleString()} rows/sec`
  );

  // ── 1e. EXPLAIN QUERY PLAN ──────────────────────────────

  console.log("\n  1e. EXPLAIN QUERY PLAN");
  console.log("  " + "-".repeat(40));

  const planIndexed = db
    .prepare(
      "EXPLAIN QUERY PLAN " +
        "SELECT * FROM metrics WHERE category = ? AND value > ?"
    )
    .all("cpu", 100) as any[];

  console.log("  With index (category + value > 100):");
  for (const row of planIndexed) {
    console.log(`    ${row.detail}`);
  }

  const planScan = db
    .prepare(
      "EXPLAIN QUERY PLAN " +
        "SELECT * FROM metrics WHERE name LIKE ?"
    )
    .all("%metric_5%") as any[];

  console.log("\n  Without index (LIKE scan):");
  for (const row of planScan) {
    console.log(`    ${row.detail}`);
  }

  // ── 1f. Query Metrics ───────────────────────────────────

  console.log("\n  1f. Query Metrics");
  console.log("  " + "-".repeat(40));

  const t5 = Bun.nanoseconds();
  const grouped = db
    .prepare(
      "SELECT category, COUNT(*) as cnt, AVG(value) as avg_val " +
        "FROM metrics GROUP BY category ORDER BY avg_val DESC"
    )
    .all() as any[];
  const queryMs = (Bun.nanoseconds() - t5) / 1e6;

  const totalRows = (
    db.query("SELECT COUNT(*) as c FROM metrics").get() as any
  ).c;

  console.log(
    `  Total rows: ${totalRows.toLocaleString()}`
  );
  console.log(`  GROUP BY query: ${queryMs.toFixed(3)}ms`);
  console.log(
    Bun.inspect.table(
      grouped.map((r: any) => ({
        category: r.category,
        count: r.cnt,
        avgValue: Number(r.avg_val).toFixed(2),
      }))
    )
  );

  recordResult(
    "SQLite",
    `GROUP BY (${totalRows.toLocaleString()} rows)`,
    queryMs,
    `${(totalRows / (queryMs / 1_000)).toFixed(0)} rows/sec`
  );

  stmtCache.clear();
  db.close();
}

// ═════════════════════════════════════════════════════════════
// SECTION 2: Capability Detection & Progressive Enhancement
// ═════════════════════════════════════════════════════════════

async function capabilityDetection(): Promise<void> {
  console.log("\n[2] Capability Detection");
  console.log("=".repeat(55));

  // ── 2a. Runtime Feature Probing ─────────────────────────

  console.log("\n  2a. Runtime Feature Probing");
  console.log("  " + "-".repeat(40));

  function probe(name: string, check: () => boolean): boolean {
    try {
      return check();
    } catch {
      return false;
    }
  }

  const capabilities = [
    {
      feature: "Bun.semver",
      available: probe(
        "semver",
        () => typeof Bun.semver !== "undefined"
      )
        ? "yes"
        : "no",
      useCase: "Version gating",
    },
    {
      feature: "Bun.color",
      available: probe(
        "color",
        () => typeof Bun.color === "function"
      )
        ? "yes"
        : "no",
      useCase: "Color conversion",
    },
    {
      feature: "Bun.stringWidth",
      available: probe(
        "stringWidth",
        () => typeof Bun.stringWidth === "function"
      )
        ? "yes"
        : "no",
      useCase: "Col-89 enforcement",
    },
    {
      feature: "Bun.JSONL",
      available: probe(
        "JSONL",
        () => typeof Bun.JSONL !== "undefined"
      )
        ? "yes"
        : "no",
      useCase: "NDJSON streaming",
    },
    {
      feature: "Bun.sql",
      available: probe(
        "sql",
        () => typeof (Bun as any).sql !== "undefined"
      )
        ? "yes"
        : "no",
      useCase: "PostgreSQL native",
    },
    {
      feature: "WebAssembly",
      available: probe(
        "wasm",
        () => typeof WebAssembly !== "undefined"
      )
        ? "yes"
        : "no",
      useCase: "WASM modules",
    },
    {
      feature: "WebGPU",
      available: probe(
        "gpu",
        () =>
          typeof globalThis !== "undefined" &&
          "gpu" in (globalThis as any).navigator
      )
        ? "yes"
        : "no",
      useCase: "GPU compute (future)",
    },
    {
      feature: "Bun.password",
      available: probe(
        "password",
        () => typeof Bun.password !== "undefined"
      )
        ? "yes"
        : "no",
      useCase: "Argon2id hashing",
    },
  ];

  console.log(Bun.inspect.table(capabilities));

  // ── 2b. Version-Gated Features ──────────────────────────

  console.log("  2b. Version-Gated Features");
  console.log("  " + "-".repeat(40));

  const versionGates = [
    { feature: "wrapAnsi", range: ">=1.1.0" },
    { feature: "JSONL.parseChunk", range: ">=1.3.7" },
    { feature: "stringWidth GB9c", range: ">=1.3.7" },
    { feature: "Terminal PTY", range: ">=1.3.7" },
  ];

  const gateResults = versionGates.map((g) => ({
    feature: g.feature,
    required: g.range,
    current: Bun.version,
    enabled: Bun.semver.satisfies(Bun.version, g.range)
      ? "yes"
      : "no",
  }));

  console.log(Bun.inspect.table(gateResults));

  // ── 2c. Cross-Runtime Guard ─────────────────────────────

  console.log("  2c. Cross-Runtime Guard Pattern");
  console.log("  " + "-".repeat(40));

  function getRuntime(): string {
    if (typeof Bun !== "undefined") return `Bun ${Bun.version}`;
    if (typeof Deno !== "undefined") return "Deno";
    if (typeof process !== "undefined" && process.versions?.node) {
      return `Node.js ${process.versions.node}`;
    }
    return "Unknown";
  }

  console.log(`  Detected runtime: ${getRuntime()}`);
  console.log("  Pattern: typeof Bun !== 'undefined'");

  // Demonstrate graceful wrap
  const wrap = Bun.semver.satisfies(Bun.version, ">=1.1.0")
    ? (t: string) => Bun.wrapAnsi(t, 89, { wordWrap: true })
    : (t: string) => t.slice(0, 89);

  console.log(
    `  Col-89 wrap: ${wrap === Bun.wrapAnsi ? "native" : "fallback"}`
  );
}

// ═════════════════════════════════════════════════════════════
// SECTION 3: Typed Arrays & Streaming
// ═════════════════════════════════════════════════════════════

async function typedArraysAndStreaming(): Promise<void> {
  console.log("\n[3] Typed Arrays & Streaming");
  console.log("=".repeat(55));

  // ── 3a. Typed Array Performance ─────────────────────────

  console.log("\n  3a. Float64Array vs Array Sum");
  console.log("  " + "-".repeat(40));

  const SIZE = 100_000;
  const typedArr = new Float64Array(SIZE);
  const plainArr = new Array(SIZE);

  for (let i = 0; i < SIZE; i++) {
    const v = Math.random() * 1000;
    typedArr[i] = v;
    plainArr[i] = v;
  }

  // Warmup
  for (let w = 0; w < 5; w++) {
    let s = 0;
    for (let i = 0; i < SIZE; i++) s += typedArr[i];
    s = 0;
    for (let i = 0; i < SIZE; i++) s += plainArr[i];
  }

  const iters = 1_000;

  const t1 = Bun.nanoseconds();
  for (let iter = 0; iter < iters; iter++) {
    let sum = 0;
    for (let i = 0; i < SIZE; i++) sum += typedArr[i];
  }
  const typedNs = (Bun.nanoseconds() - t1) / iters;

  const t2 = Bun.nanoseconds();
  for (let iter = 0; iter < iters; iter++) {
    let sum = 0;
    for (let i = 0; i < SIZE; i++) sum += plainArr[i];
  }
  const plainNs = (Bun.nanoseconds() - t2) / iters;

  const arrayResults = [
    {
      type: "Float64Array",
      elements: SIZE.toLocaleString(),
      nsPerSum: typedNs.toFixed(0),
      msPerSum: (typedNs / 1e6).toFixed(3),
    },
    {
      type: "Array",
      elements: SIZE.toLocaleString(),
      nsPerSum: plainNs.toFixed(0),
      msPerSum: (plainNs / 1e6).toFixed(3),
    },
  ];

  console.log(Bun.inspect.table(arrayResults));

  const ratio = plainNs / typedNs;
  console.log(
    `  Float64Array is ${ratio.toFixed(2)}x ${ratio > 1 ? "faster" : "slower"} than Array`
  );

  recordResult(
    "TypedArrays",
    `Float64Array sum (${SIZE.toLocaleString()})`,
    typedNs / 1e6,
    `${ratio.toFixed(2)}x vs Array`
  );

  // ── Buffer concat ───────────────────────────────────────

  console.log("\n  Buffer Concatenation");
  console.log("  " + "-".repeat(40));

  const chunks = Array.from(
    { length: 100 },
    () => new Uint8Array(1024).fill(42)
  );

  const t3 = Bun.nanoseconds();
  for (let i = 0; i < 1_000; i++) {
    Bun.concatArrayBuffers(chunks);
  }
  const concatNs = (Bun.nanoseconds() - t3) / 1_000;

  console.log(
    `  100 x 1KB chunks: ${(concatNs / 1e3).toFixed(1)}us/concat`
  );
  console.log(
    `  Throughput: ${((100 * 1024 * 1e9) / concatNs / 1e6).toFixed(0)} MB/s`
  );

  recordResult(
    "Buffers",
    "concatArrayBuffers (100x1KB)",
    concatNs / 1e6,
    `${((100 * 1024 * 1e9) / concatNs / 1e6).toFixed(0)} MB/s`
  );

  // ── 3b. NDJSON Streaming ────────────────────────────────

  console.log("\n  3b. NDJSON Streaming");
  console.log("  " + "-".repeat(40));

  const NDJSON_ROWS = 1_000;
  const lines: string[] = [];
  for (let i = 0; i < NDJSON_ROWS; i++) {
    lines.push(
      JSON.stringify({ id: i, value: Math.random(), ts: Date.now() })
    );
  }
  const ndjsonText = lines.join("\n") + "\n";

  // Stream approach
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(ndjsonText));
      controller.close();
    },
  });

  const t4 = Bun.nanoseconds();
  const text = await Bun.readableStreamToText(stream);
  const parsed = Bun.JSONL.parse(text);
  const streamMs = (Bun.nanoseconds() - t4) / 1e6;

  // Direct parse approach
  const t5 = Bun.nanoseconds();
  const directParsed = Bun.JSONL.parse(ndjsonText);
  const directMs = (Bun.nanoseconds() - t5) / 1e6;

  const streamResults = [
    {
      approach: "Stream -> readableStreamToText -> JSONL",
      rows: parsed.length,
      timeMs: streamMs.toFixed(3),
    },
    {
      approach: "Direct JSONL.parse",
      rows: directParsed.length,
      timeMs: directMs.toFixed(3),
    },
  ];

  console.log(Bun.inspect.table(streamResults));

  recordResult(
    "Streaming",
    `NDJSON parse (${NDJSON_ROWS} rows)`,
    directMs,
    `${Math.floor(NDJSON_ROWS / (directMs / 1_000)).toLocaleString()} rows/sec`
  );

  // ── 3c. CSS Processing Note ─────────────────────────────

  console.log("\n  3c. CSS Processing (LightningCSS)");
  console.log("  " + "-".repeat(40));
  console.log("  LightningCSS can be added with:");
  console.log("    bun add lightningcss");
  console.log("");
  console.log("  Pattern:");
  console.log("    import { transform } from 'lightningcss';");
  console.log("    const result = transform({");
  console.log("      filename: 'style.css',");
  console.log("      code: Buffer.from(css),");
  console.log("      minify: true,");
  console.log("      drafts: { nesting: true }");
  console.log("    });");
  console.log("");
  console.log("  Bun.build() also handles CSS entrypoints:");
  console.log("    await Bun.build({");
  console.log("      entrypoints: ['./app.css'],");
  console.log("      outdir: './dist'");
  console.log("    });");
}

// ═════════════════════════════════════════════════════════════
// SECTION 4: Summary
// ═════════════════════════════════════════════════════════════

function printSummary(): void {
  console.log("\n[4] Benchmark Summary");
  console.log("=".repeat(55));

  if (allResults.length > 0) {
    console.log(
      Bun.inspect.table(allResults, [
        "section",
        "operation",
        "timeMs",
        "throughput",
      ])
    );
  }

  const box = [
    "╔═════════════════════════════════════════════════════════╗",
    "║ Future-Proof Patterns Summary                           ║",
    "╠═════════════════════════════════════════════════════════╣",
    "║ Available NOW:                                          ║",
    "║   [x] SQLite WAL + PRAGMAs                              ║",
    "║   [x] Prepared statement caching                        ║",
    "║   [x] Transaction batch inserts                         ║",
    "║   [x] EXPLAIN QUERY PLAN analysis                       ║",
    "║   [x] Bun.JSONL streaming                               ║",
    "║   [x] Typed arrays (Float64Array, Uint8Array)           ║",
    "║   [x] Bun.concatArrayBuffers                            ║",
    "║   [x] Runtime capability detection                      ║",
    "║   [x] Version-gated progressive enhancement             ║",
    "║                                                         ║",
    "║ Aspirational:                                           ║",
    "║   [ ] WebGPU compute shaders                            ║",
    "║   [ ] HTTP/3 + QUIC                                     ║",
    "║   [ ] Native SIMD operations                            ║",
    "║   [ ] LightningCSS (install: bun add lightningcss)      ║",
    "╚═════════════════════════════════════════════════════════╝",
  ];
  for (const line of box) console.log(line);
}

// ═════════════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log(
    "╔═════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║ Future-Proof Bun Patterns & Optimizations Demo          ║"
  );
  console.log(
    `║ Bun ${Bun.version.padEnd(52)}║`
  );
  console.log(
    "╚═════════════════════════════════════════════════════════╝"
  );

  await sqliteOptimizations();
  await capabilityDetection();
  await typedArraysAndStreaming();
  printSummary();
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  cachedPrepare,
  stmtCache,
  allResults,
};

export type { BenchResult };
