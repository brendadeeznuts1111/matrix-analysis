# User Preferences

## Table Formatting

**NEVER use markdown tables in console output or responses.** Use `Bun.inspect.table()` instead.

> Markdown tables are acceptable in `.md` documentation files (README, docs).

```typescript
// API: Bun.inspect.table(data, columns?, options?)
Bun.inspect.table(data)                                      // All columns
Bun.inspect.table(data, ["col1", "col2"])                    // Filter columns
Bun.inspect.table(data, undefined, { colors: true })         // All columns + colors
Bun.inspect.table(data, ["col1", "col2"], { colors: true })  // Filter + colors

// Pre-format for custom display
const formatted = items.map(x => ({
  "#": x.id,
  "Name": `${x.icon} ${x.name}`,
  "Status": `${statusIcon(x.status)} ${x.status}`,
}));
console.log(Bun.inspect.table(formatted, undefined, { colors: true }));
```

**Gotchas:** Nested objects >1 level deep truncate to `[Object ...]`. Bun-only; guard with `typeof Bun !== "undefined"` for cross-runtime code.

## Conventions

**Style:**
- Semicolons required, double quotes for strings
- Variables/functions: `camelCase`, Constants: `UPPER_SNAKE_CASE`, Types: `PascalCase`

**Commits:** `<type>(<scope>): <description>` with `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`

**Tests:** Use `bun:test` with `it()` not `test()`

**Errors:** Return `null`/default from helpers, don't throw. Use `.catch(() => null)` for non-critical async. Log with context for user-facing failures.

**Browser:** Always use Chrome when opening URLs:
```bash
open -a "Google Chrome" <url>
```

---

## Bun Quick Reference

Use Context7 MCP for detailed docs. Below are essential patterns and gotchas.

### Server & Requests

```typescript
const server = Bun.serve({
  port: 0,  // Auto-select available port
  fetch(req) {
    const url = new URL(req.url);
    const page = url.searchParams.get("page");       // Query params
    const body = await req.json();                   // Request body (.text(), .formData())

    // ALWAYS use Response.json() for JSON (auto Content-Type)
    return Response.json({ data: result });
    return Response.json({ error: "Not found" }, { status: 404 });
  },
});
// server.port, server.url, server.stop(), server.stop(true) for force
```

### URLPattern

```typescript
// REQUIRES baseURL for relative patterns (throws without it!)
const BASE = "http://localhost";
const route = new URLPattern("/users/:id(\\d+)", BASE);  // RegExp validation

route.test(`${BASE}/users/123`);   // true (fast boolean check)
route.test(`${BASE}/users/abc`);   // false (regex rejected)
route.exec(`${BASE}/users/123`);   // { pathname: { groups: { id: "123" } } }
```

### File I/O

```typescript
const file = Bun.file("./data.json");
await file.text();   // string
await file.json();   // parsed
await file.bytes();  // Uint8Array

await Bun.write("./out.txt", content);
await Bun.write("./copy.txt", Bun.file("./source.txt"));
```

### Shell & Spawn

```typescript
// Bun.$ - simple commands, shell features (pipes, globs)
import { $ } from "bun";
await $`ls -la | grep .ts`;
const output = await $`echo hello`.text();
await $`cmd`.quiet();                         // No output
const { exitCode } = await $`cmd`.nothrow();  // Don't throw on error

// Bun.spawn - streaming, long-running, fine control
const proc = Bun.spawn(["node", "server.js"], { stdout: "pipe" });
const out = await new Response(proc.stdout).text();
await proc.exited;
```

### SQLite

```typescript
import { Database } from "bun:sqlite";
const db = new Database("app.sqlite");
const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
stmt.get(1);   // Single row
stmt.all();    // All rows
```

### Testing

```typescript
import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";

describe("feature", () => {
  beforeEach(() => { /* setup */ });

  it("works", async () => {
    expect(value).toBe(expected);
    expect(obj).toEqual({ key: "val" });
    await expect(promise).resolves.toBe(value);
    expect(() => fn()).toThrow();
  });
});

const fn = mock(() => value);
const spy = spyOn(obj, "method");
spy.mockReturnValue(42);
```

### Utilities

```typescript
Bun.deepEquals(a, b)                       // Deep comparison
Bun.stringWidth("emoji")                   // Terminal display width
Bun.sleep(1000)                            // Async sleep (ms)
Bun.randomUUIDv7()                         // Time-sortable UUID
Bun.password.hash("pwd")                   // Argon2id hash
Bun.password.verify("pwd", hash)           // Verify
Bun.peek(promise)                          // Sync check if resolved
Bun.fileURLToPath(new URL(".", import.meta.url))  // Get directory path
```

### Fetch & DNS Optimization

```typescript
import { dns } from "bun";

// Warm-up (call early, before actual fetch)
dns.prefetch("api.example.com", 443);              // DNS only
await fetch.preconnect("https://api.example.com"); // DNS + TCP + TLS

// Zero-copy file I/O (upload requires file >=32KB)
await fetch(url, { body: Bun.file("large.bin") }); // Upload
await Bun.write("out.zip", await fetch(url));      // Download

// Debug headers: fetch(url, { verbose: true })
// Pool size: BUN_CONFIG_MAX_HTTP_REQUESTS=512 (default: 256)
```
