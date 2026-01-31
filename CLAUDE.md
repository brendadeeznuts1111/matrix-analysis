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
