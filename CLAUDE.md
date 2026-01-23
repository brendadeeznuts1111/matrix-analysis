# User Preferences

## Table Formatting

**NEVER use markdown tables.** Use `Bun.inspect.table()` instead.

```typescript
// Basic
Bun.inspect.table(data)
Bun.inspect.table(data, { colors: true })
Bun.inspect.table(data, ["col1", "col2"])
Bun.inspect.table(data, ["col1", "col2"], { colors: true })

// Pre-format for custom display
const formatted = items.map(x => ({
  "#": x.id,
  "Name": `${x.icon} ${x.name}`,
  "Status": `${statusIcon(x.status)} ${x.status}`,
}));
console.log(Bun.inspect.table(formatted, { colors: true }));
```

## Bun Quick Reference

Use Context7 MCP (`mcp__context7__query-docs`) for detailed Bun documentation. Below are common patterns only.

### Server

```typescript
const server = Bun.serve({
  port: 0,  // Auto-select available port
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/data") return Response.json(data);
    return Response.json({ error: "Not found" }, { status: 404 });
  },
});
// server.port, server.url, server.stop()
```

### File I/O

```typescript
// Read
const file = Bun.file("./data.json");
await file.text();  // string
await file.json();  // parsed
await file.bytes(); // Uint8Array

// Write
await Bun.write("./out.txt", content);
await Bun.write("./copy.txt", Bun.file("./source.txt"));
```

### Shell & Spawn

```typescript
import { $ } from "bun";
await $`ls -la`;
const output = await $`echo hello`.text();
await $`cmd`.quiet();  // No output
const { exitCode } = await $`cmd`.nothrow();
```

### SQLite

```typescript
import { Database } from "bun:sqlite";
const db = new Database("app.sqlite");
const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
stmt.get(1);  // Single row
stmt.all();   // All rows
```

### Utilities

```typescript
Bun.deepEquals(a, b)              // Deep comparison
Bun.stringWidth("emoji")          // Terminal display width
Bun.sleep(1000)                   // Async sleep (ms)
Bun.randomUUIDv7()                // Time-sortable UUID
Bun.password.hash("pwd")          // Argon2id hash
Bun.password.verify("pwd", hash)  // Verify
Bun.gzipSync(data)                // Compress
Bun.gunzipSync(compressed)        // Decompress
Bun.semver.satisfies("1.2.3", "^1.0.0")
```

### Testing

```typescript
import { test, expect, describe, mock, spyOn } from "bun:test";

test("example", () => {
  expect(value).toBe(expected);
  expect(obj).toEqual({ key: "val" });
  expect(arr).toContain(item);
  expect(() => fn()).toThrow();
});

const fn = mock(() => value);
const spy = spyOn(obj, "method");
```

### DNS & Fetch Optimization

```typescript
import { dns } from "bun";
dns.prefetch("api.example.com", 443);  // Warm DNS cache
await fetch.preconnect("https://api.example.com");  // Pre-establish connection
```
