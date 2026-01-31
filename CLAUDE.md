# User Preferences

## Table Formatting

**NEVER use markdown tables in console output.** Use `Bun.inspect.table()` instead.

```typescript
Bun.inspect.table(data)                                      // All columns
Bun.inspect.table(data, ["col1", "col2"])                    // Filter columns
Bun.inspect.table(data, ["col1", "col2"], { colors: true })  // Filter + colors
```

**Gotcha:** Nested objects >1 level truncate to `[Object ...]`. Bun-only; guard with `typeof Bun !== "undefined"`.

## Conventions

- Semicolons required, double quotes for strings
- Variables: `camelCase`, Constants: `UPPER_SNAKE_CASE`, Types: `PascalCase`
- Commits: `<type>(<scope>): <description>` with `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
- Tests: `bun:test` with `it()` not `test()`
- Errors: Return `null`/default, don't throw. Use `.catch(() => null)` for non-critical async
- Browser: `open -a "Google Chrome" <url>`

**Exit codes:**
```typescript
main().catch((err) => { console.error(err); process.exit(1); });
```

**Large files:** Use Grep with context (`-A`, `-B`) instead of Read for files >4000 tokens.

---

## Bun Quick Reference

> **Use Context7 MCP for detailed docs.** Below are essential patterns and gotchas only.

### 📚 Official Documentation Links

**Core APIs:**
- [File API (deep dive)](https://bun.sh/docs/api/file-io) - File I/O, streams, BunFile
- [HTTP Server](https://bun.sh/docs/api/http) - Bun.serve(), WebSockets, SSE
- [Shell Scripting ($)](https://bun.sh/docs/runtime/shell) - Command execution, pipes
- [Password Hashing](https://bun.sh/docs/api/hashing) - Argon2id, bcrypt, verify
- [JSON5/JSONL](https://bun.sh/docs/api/utils#bun-json5-bun-jsonl) - Parse JSON variants
- [Test Runner](https://bun.sh/docs/cli/test) - bun:test, matchers, mocks
- [Full API Index](https://bun.sh/docs/api/index) - Complete API reference

**Quick Access:**
```bash
# Search Bun docs via MCP
# Use Context7 MCP server for detailed documentation
```

**Tier-1380 CLI quick ref:**
```bash
bun run tier1380 -- color init --team=<name> --profile=<name>
bun run tier1380 -- color generate --wcag=aa --formats=all
bun run tier1380 -- color deploy --env=production --scale=3
bun run tier1380 -- color metrics --team=<name> --live
bun run tier1380 -- colors deploy <team> --profile <name>
bun run tier1380 -- terminal <team> <profile>
bun run tier1380 -- dashboard --team=<name> --profile=<name>
bun run t1380
bun run tier1380:bench
```

### Server

```typescript
const server = Bun.serve({
  port: 0,                    // Random port (default: $BUN_PORT, $PORT, or 3000)
  hostname: "127.0.0.1",      // Local only (default "0.0.0.0" exposes to network)
  fetch(req, server) {
    const url = new URL(req.url);
    return Response.json({ data });  // ALWAYS use Response.json() for JSON
  },
});
// server.port, server.stop(), server.reload({ fetch })

// Unix socket
Bun.serve({ unix: "/tmp/agent.sock", fetch(req) { return Response.json({ ok: true }); } });
```

### File I/O

```typescript
const file = Bun.file("./data.json");
await file.text();            // string
await file.json();            // parsed
await Bun.write("out.txt", content);
await file.delete();          // Bun 1.2+
```

### S3

```typescript
import { s3 } from "bun";
await s3.write("file.pdf", data, { contentDisposition: 'attachment; filename="report.pdf"' });
const file = s3.file("key");
await file.exists();
```

### SQL (PostgreSQL)

```typescript
import { sql } from "bun";
// Uses DATABASE_URL env var
const users = await sql`SELECT * FROM users WHERE active = ${true}`;
await sql.begin(async (sql) => { /* transaction */ });
```

### SQLite

```typescript
import { Database } from "bun:sqlite";
const db = new Database("app.sqlite");
db.query("SELECT * FROM users").all();
db.prepare("SELECT * FROM users WHERE id = ?").get(1);

// Memory-efficient iteration
for (const row of db.query("SELECT * FROM large_table")) { }

// Auto-cleanup
{ using db = new Database("app.sqlite"); }
```

### Shell & Spawn

```typescript
import { $ } from "bun";
await $`ls -la | grep .ts`;
const out = await $`echo hello`.text();
await $`cmd`.quiet();                         // No output
const { exitCode } = await $`cmd`.nothrow();  // Don't throw

// Streaming/long-running
const proc = Bun.spawn(["node", "server.js"], { stdout: "pipe" });
await proc.exited;
```

### Testing

```typescript
import { describe, it, expect, mock, spyOn } from "bun:test";

describe("feature", () => {
  it("works", async () => {
    expect(value).toBe(expected);
    await expect(promise).resolves.toBe(value);
    expect(() => fn()).toThrow();
  });
});

const fn = mock(() => value);
spyOn(obj, "method").mockReturnValue(42);
```

```bash
CLAUDECODE=1 bun test           # Quieter output for AI agents
bun test --bail --timeout=5000  # Exit on first failure
```

### Secrets (OS Keychain)

```typescript
// Use UTI-style service names
const SERVICE = "com.mycompany.myapp";

await Bun.secrets.set({ service: SERVICE, name: "token", value: "xxx" });
const token = await Bun.secrets.get({ service: SERVICE, name: "token" });
await Bun.secrets.delete({ service: SERVICE, name: "token" });

// Positional syntax (set/get only)
await Bun.secrets.set(SERVICE, "token", "xxx");
```

**Gotcha:** Object form `({ service, name, value })` or positional `(service, name, value)` — NOT `(options, value)`.

### Fetch

```typescript
// DNS prefetch (call early)
import { dns } from "bun";
dns.prefetch("api.example.com", 443);
await fetch.preconnect("https://api.example.com");

// Zero-copy file upload (>=32KB)
await fetch(url, { body: Bun.file("large.bin") });

// Proxy
await fetch(url, { proxy: process.env.HTTPS_PROXY });

// Unix socket
await fetch("http://localhost/containers/json", { unix: "/var/run/docker.sock" });

// Timeout
await fetch(url, { signal: AbortSignal.timeout(5000) });
```

### Build

```typescript
await Bun.build({
  entrypoints: ["./app.tsx"],
  env: "PUBLIC_*",                    // Inject env vars
  drop: ["console", "debugger"],      // Remove for production
});
```

### Bun.color (HSL/RGB/Hex conversion)

```typescript
// Basic conversions (input: string name, hex, number, [r,g,b], { r, g, b })
Bun.color("red", "hex");           // "#ff0000" (lowercase)
Bun.color("red", "HEX");           // "#FF0000" (uppercase)
Bun.color("#FF0000", "hex");       // "#ff0000" (normalized)
Bun.color(0xff0000, "hex");        // "#ff0000"
Bun.color([255, 0, 0], "hex");     // "#ff0000"
Bun.color([99, 71, 255], "hex");   // "#6347ff"

// With alpha (hex8)
Bun.color("rgba(255,0,0,0.5)", "hex8");   // "#ff000080"
Bun.color([255, 0, 0, 128], "hex8");       // "#ff000080"
Bun.color("rgba(255,0,0,0.5)", "HEX8");   // "#FF000080"

// Common patterns
Bun.color("hsl(120, 100%, 40%)", "hex");   // "#00cc00" (success green)
Bun.color("rgb(255, 165, 0)", "hex");      // "#ffa500" (warning orange)
Bun.color({ r: 255, g: 0, b: 0 }, "hex");  // "#ff0000" (error red)
Bun.color(0x007acc, "hex");                // "#007acc" (info blue)
```

**Formats:** `hex` | `HEX` | `hex8` | `HEX8` | `number` | `rgb` | `rgba` | `hsl` | `ansi-16` | `ansi-256` | `ansi-16m`

### Utilities

```typescript
Bun.deepEquals(a, b)              // Deep comparison
Bun.randomUUIDv7()                // Time-sortable UUID
Bun.password.hash("pwd")          // Argon2id
Bun.password.verify("pwd", hash)
await Bun.sleep(1000)
Bun.which("node")                 // Find executable path
Bun.escapeHTML(userInput)         // XSS prevention
Bun.JSONL.parse(content)          // Parse newline-delimited JSON
Bun.JSON5.parse(content)          // JSON with comments/trailing commas
Bun.TOML.parse(content)          // Parse TOML config files
Bun.peek(promise)                 // Read settled value without await (returns promise if pending)
Bun.peek.status(promise)          // → "fulfilled" | "rejected" | "pending"
Bun.semver.satisfies("1.3.7", ">=1.3.0")  // true — semver range check
Bun.semver.order("1.3.7", "1.2.0")        // 1 — compare: -1 | 0 | 1
```

### Inspect, Timing, Streams & ANSI

```typescript
// ── Inspect ──────────────────────────────────────────────────────────
// Bun.inspect(value, options?)
//   defaults: { depth: 2, colors: process.stdout.isTTY, compact: false,
//     showHidden: false, maxArrayLength: 100, maxStringLength: 10000 }
//   DIVERGENCE: maxArrayLength/maxStringLength IGNORED in Bun — always full output
//   → implement manual truncation for large structures (see Tier-1380 guard below)
Bun.inspect(value)                                        // string (depth: 2, compact: false)
Bun.inspect(value, { depth: 4, colors: true })            // deeper, colored
Bun.inspect(value, { depth: null })                       // unlimited depth
Bun.inspect(value, { compact: true })                     // single-line where possible
Bun.inspect(value, { compact: 3 })                        // inline up to 3 items

// Bun.inspect.table(data, properties?, options?)
//   options: { colors?: boolean } (default: false)
//   Gotcha: nested objects >1 level → [Object ...]; slice to ≤50 rows for readability
Bun.inspect.table(data, ["col1", "col2"], { colors: process.stdout.isTTY })

// Bun.inspect.custom — override inspect for your classes (Node-compat 3-arg)
class Foo {
  [Bun.inspect.custom](depth: number | null, opts: object, inspect: Function) {
    if (depth === 0) return "[Foo ...]";  // guard deep recursion in audit objects
    return `Foo<${inspect(this.inner, { depth: (depth ?? 2) - 1 })}>`;
  }
}

// ── Timing ───────────────────────────────────────────────────────────
// Bun.nanoseconds() → u64 monotonic ns since process start
const t0 = Bun.nanoseconds();
await doWork();
console.log(`${(Bun.nanoseconds() - t0) / 1e6} ms`);

// ── Comparison ───────────────────────────────────────────────────────
// Bun.deepEquals(a, b, strict?)  strict default: false
//   Handles circular refs, NaN, -0/+0
Bun.deepEquals(a, b)              // loose (allows some coercions)
Bun.deepEquals(a, b, true)        // strict (exact match, use in tests)

// ── Buffers ──────────────────────────────────────────────────────────
// Bun.concatArrayBuffers(buffers) → ArrayBuffer (fast path for chunk merging)
Bun.concatArrayBuffers([chunk1, chunk2])      // practical limit ~2GB

// ── ReadableStream consumers ─────────────────────────────────────────
// All: (stream: ReadableStream) → Promise<T>
await Bun.readableStreamToText(stream)         // → string (must be UTF-8)
await Bun.readableStreamToJSON(stream)         // → parsed object (must be valid JSON)
await Bun.readableStreamToBytes(stream)        // → Uint8Array (binary safe)
await Bun.readableStreamToArrayBuffer(stream)  // → ArrayBuffer
await Bun.readableStreamToBlob(stream)         // → Blob
await Bun.readableStreamToArray(stream)        // → any[]
await Bun.readableStreamToFormData(stream, boundary)  // → FormData

// ── Module resolution ────────────────────────────────────────────────
// Bun.resolveSync(specifier, root?)  root default: process.cwd()
//   Throws if not found
Bun.resolveSync("zod", import.meta.dir)        // → full path

// ── ANSI / text utilities ────────────────────────────────────────────
// Bun.stringWidth(str, options?)
//   options: { countAnsiEscapeCodes?: boolean } (default: true)
//   Handles full Unicode + emoji + ZWJ + full-width + Indic conjuncts (GB9c)
//   countAnsiEscapeCodes: true → counts escape bytes; false → visual width only
//   GB9c fix: Devanagari conjuncts (क्ष) now correctly form single grapheme clusters
Bun.stringWidth("hello 🦊")                    // → 8 (correct visual width)
Bun.stringWidth("क्ष")                           // → 2 (single cluster, GB9c)
Bun.stringWidth(text, { countAnsiEscapeCodes: false })  // Col-89: use this for width checks

// Bun.stripANSI(text) — ~6-57x faster than strip-ansi npm
Bun.stripANSI(coloredText)

// Bun.wrapAnsi(input, columns, options?)
//   options defaults: { hard: false, wordWrap: true, trim: true, ambiguousIsNarrow: true }
//   Preserves ANSI codes, hyperlinks, emoji widths
Bun.wrapAnsi(text, 89, { wordWrap: true })

// ── Semver ───────────────────────────────────────────────────────────
// Bun.semver.satisfies(version, range) → boolean  (throws on invalid)
// Bun.semver.order(v1, v2) → -1 | 0 | 1
Bun.semver.satisfies(Bun.version, ">=1.3.0")   // version gate
Bun.semver.order("1.3.7", "1.2.0")             // 1 (v1 > v2)

// ── Config parsing ───────────────────────────────────────────────────
// Bun.TOML.parse(input) → object  (like JSON5/JSONL but for TOML)
Bun.TOML.parse(await Bun.file("bunfig.toml").text())

// ── Promise peeking ──────────────────────────────────────────────────
// Bun.peek(promise) → value if settled, promise if pending
// Bun.peek.status(promise) → "fulfilled" | "rejected" | "pending"
const val = Bun.peek(promise)                   // sync read if resolved
Bun.peek.status(promise)                        // check without awaiting
```

**Runtime Utilities Reference:**

| Utility | Defaults | Options / Properties | Types | Min / Max | Version | Test Pattern | Bench |
| ------- | -------- | -------------------- | ----- | --------- | ------- | ------------ | ----- |
| `Bun.inspect(value, opts?)` | `depth: 2`, `colors: isTTY`, `compact: true`, `showHidden: false`, `maxArrayLength: 100`, `maxStringLength: 10000`, `customInspect: true`, `breakLength: 70` | `{ depth?: number \| null, colors?: boolean, compact?: boolean \| number, showHidden?: boolean, maxArrayLength?: number, maxStringLength?: number, customInspect?: boolean, breakLength?: number }` | `(any, InspectOptions?) → string` | `depth`: 0–`null`(∞), perf degrades >10; `maxArrayLength`: 0=unlimited; `maxStringLength`: 0=unlimited | ~1.0.0 | `expect(Bun.inspect(obj)).toContain("key")` | ~0.01ms |
| `Bun.inspect.table(data, props?, opts?)` | `colors: false`, props: all keys | `{ colors?: boolean }` | `(any[] \| object, string[]?, { colors?: boolean }?) → string` | rows: 0–~10k (>500 slow); cols: 1–~50 | ~1.1.10 | `expect(Bun.inspect.table([{a:1}])).toContain("a")` | ~0.1ms <100 rows |
| `Bun.inspect.custom` | depth from parent | Receives `(depth: number \| null, opts: InspectOptions, inspect: Function)` | `symbol` (method → `string`) | `depth`: 0–`null` | ~1.0.0 | `expect(Bun.inspect(new MyClass())).toBe("custom")` | N/A |
| `Bun.nanoseconds()` | — | — | `() → number` (u64) | 0 – ~2^64 (~584yr) | ~1.0.0 | `expect(Bun.nanoseconds()).toBeGreaterThan(0)` | <0.001ms |
| `Bun.deepEquals(a, b, strict?)` | `strict: false` | — | `(any, any, boolean?) → boolean` | circular refs ok; stack overflow ~1M+ depth | ~1.0.0 | `expect(Bun.deepEquals(a, b, true)).toBe(true)` | ~0.01ms shallow |
| `Bun.concatArrayBuffers(bufs)` | — | — | `((ArrayBuffer \| TypedArray)[]) → ArrayBuffer` | total: ~2GB practical | ~1.0.0 | `expect(result.byteLength).toBe(a.byteLength + b.byteLength)` | <0.01ms small |
| `Bun.stringWidth(str, opts?)` | `countAnsiEscapeCodes: false` | `{ countAnsiEscapeCodes?: boolean }` | `(string, object?) → number` | str: 0–~1M; returns 0–∞ | ~1.0.15 | `expect(Bun.stringWidth("hi")).toBe(2)` | <0.001ms |
| `Bun.stripANSI(text)` | — | — | `(string) → string` | — | ~1.0.15 | `expect(Bun.stripANSI("\x1b[31mhi\x1b[0m")).toBe("hi")` | 6–57x > `strip-ansi` |
| `Bun.wrapAnsi(input, cols, opts?)` | `hard: false`, `wordWrap: true`, `trim: true`, `ambiguousIsNarrow: true` | `{ hard?: boolean, wordWrap?: boolean, trim?: boolean, ambiguousIsNarrow?: boolean }` | `(string, number, object?) → string` | `columns`: 1–∞ (20–120 typical) | ~1.1.x | `expect(Bun.stringWidth(Bun.wrapAnsi(s,40))).toBeLessThanOrEqual(40)` | > `wrap-ansi` |
| `Bun.resolveSync(spec, root?)` | `root: process.cwd()` | — | `(string, string?) → string` | Throws if not found | ~1.0.0 | `expect(Bun.resolveSync("bun:test")).toContain("bun")` | <0.1ms |
| `Bun.semver.satisfies(ver, range)` | — (both required) | — | `(string, string) → boolean` | Throws on invalid semver | ~1.0.0 | `expect(Bun.semver.satisfies("1.3.7",">=1.3.0")).toBe(true)` | <0.001ms |
| `Bun.semver.order(v1, v2)` | — (both required) | — | `(string, string) → -1 \| 0 \| 1` | Throws on invalid semver | ~1.0.0 | `expect(Bun.semver.order("2.0.0","1.0.0")).toBe(1)` | <0.001ms |
| `Bun.TOML.parse(input)` | — | — | `(string) → object` | input: 0–~1M chars | ~1.0.0 | `expect(Bun.TOML.parse('[a]\nb=1')).toEqual({a:{b:1}})` | <0.1ms typical |
| `Bun.peek(promise)` | returns promise if pending | `.status(p) → "fulfilled" \| "rejected" \| "pending"` | `(Promise<T>) → T \| Promise<T>` | — | ~1.0.0 | `expect(Bun.peek(Promise.resolve(42))).toBe(42)` | sync <0.001ms |
| `readableStreamToText(s)` | — | — | `(ReadableStream) → Promise<string>` | UTF-8 only | ~1.0.0 | `expect(await Bun.readableStreamToText(s)).toBe("hi")` | native fast path |
| `readableStreamToJSON(s)` | — | — | `(ReadableStream) → Promise<object>` | Valid JSON only | ~1.0.0 | `expect(await Bun.readableStreamToJSON(s)).toEqual({ok:1})` | native fast path |
| `readableStreamToBytes(s)` | — | — | `(ReadableStream) → Promise<Uint8Array>` | Binary safe | ~1.0.0 | `expect((await Bun.readableStreamToBytes(s)).length).toBeGreaterThan(0)` | native fast path |

**Tier-1380 Hardened Defaults (Recommended Presets)**

| Context | Preset | Rationale |
| ------- | ------ | --------- |
| Audit log rendering | `{ depth: 5, colors: false, compact: 3 }` + manual array truncate ≤50 | Prevents huge logs, Col-89 violations, DoS-like output |
| Col-89 enforcement | `stringWidth(…, {countAnsiEscapeCodes: false}) ≤ 89` + `wrapAnsi(…, 89, {wordWrap: true})` | Core invariant — never ship lines >89 columns |
| deepEquals mode | `strict: true` for crypto/security; `false` for config/schema drift | Strict = zero-trust exact match |
| semver gate | `Bun.semver.satisfies(Bun.version, ">=1.3.7")` at startup | Ensures stringWidth GB9c, wrapAnsi, deepEquals fixes present |
| table() row limit | Slice input to ≤30–50 rows before `Bun.inspect.table` | Large tables break terminal readability & Col-89 |

**Tier-1380 Startup Guard:**

```typescript
// tier1380-guard.ts — run at startup or in audit cron
const MIN_BUN = ">=1.3.7";
if (!Bun.semver.satisfies(Bun.version, MIN_BUN)) {
  console.error(`[TIER-1380] Bun ${Bun.version} < ${MIN_BUN} → upgrade required`);
  process.exit(1);
}

function safeInspect(value: any, maxDepth = 6): string {
  // maxArrayLength/maxStringLength ignored in Bun → manual Col-89 wrapping
  const raw = Bun.inspect(value, { depth: maxDepth, colors: false, compact: 3 });
  return Bun.wrapAnsi(raw, 89, { wordWrap: true, trim: true });
}

function assertCol89(text: string, context = "unknown"): void {
  const w = Bun.stringWidth(text, { countAnsiEscapeCodes: false });
  if (w > 89) console.warn(`[COL-89 VIOLATION] ${context} width=${w}`);
}
```

### Cross-Runtime Guard

```typescript
if (typeof Bun !== "undefined") {
  // Bun APIs
} else {
  // Node.js fallback
}
```

---

## .claude Directory Map

### Source Code
- `src/` — Main entry points
- `core/` — Core library modules
- `api/` — API server
- `sdk/` — SDK implementations
- `shared/` — Shared utilities
- `types/` — TypeScript definitions

### Executables
- `bin/` — Compiled binaries
- `scripts/` — Dev/utility scripts (122 files)
- `tools/` — Tool implementations

### Config
- `config/` — App/build configs, package.json
- `hooks/` — Git hooks (pre-commit, pre-push)
- `settings.json` — Claude Code settings

### Content
- `docs/` — Documentation
- `skills/` — Skill definitions (.md)
- `examples/` — Example code
- `commands/` — CLI command docs

### Data
- `data/` — Databases (*.db), reports
- `assets/` — Static assets, binaries
- `benchmarks/` — Performance tests

### Apps
- `apps/` — Application builds
- `packages/` — Monorepo packages

### Testing
- `tests/` — Test files
- `test-results/` — Test output

### Runtime (transient, gitignored)
- `projects/` — Session data per project
- `debug/` — Debug logs
- `file-history/` — File versioning
- `paste-cache/` — Clipboard cache
- `todos/`, `plans/`, `tasks/` — Task tracking
- `session-env/` — Session environments
- `statsig/` — Feature flags
