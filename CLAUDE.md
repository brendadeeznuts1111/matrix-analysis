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

## Conventions

- **Commits:** `<type>(<scope>): <description>` with `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
- **Semicolons:** Required
- **Quotes:** Double quotes for strings
- **Tests:** Use `bun:test` with `it()` not `test()`

---

## Bun Quick Reference

Use Context7 MCP for detailed docs. Below are essential patterns and gotchas.

### Server & Requests

```typescript
const server = Bun.serve({
  port: 0,  // Auto-select available port
  fetch(req) {
    const url = new URL(req.url);

    // Query params
    const page = url.searchParams.get("page");

    // Request body
    const body = await req.json();      // JSON
    const text = await req.text();      // Text
    const form = await req.formData();  // Form

    // Responses - ALWAYS use Response.json() for JSON
    return Response.json({ data: result });
    return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  },
});
// server.port, server.url, server.stop(), server.stop(true) for force
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

### Shell

```typescript
import { $ } from "bun";
await $`ls -la`;
const output = await $`echo hello`.text();
await $`cmd`.quiet();                      // No output
const { exitCode } = await $`cmd`.nothrow();  // Don't throw on error
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

// DNS optimization
import { dns } from "bun";
dns.prefetch("api.example.com", 443);      // Warm cache before fetch
```
