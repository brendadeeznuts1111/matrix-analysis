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

### S3 with Content-Disposition (Bun 1.3.6+)

Control browser download behavior:

```typescript
import { s3 } from "bun";

// Force download with custom filename
await s3.write("report.pdf", pdfData, {
  contentDisposition: 'attachment; filename="Q3-Report-2025.pdf"',
});

// Display inline in browser (images, PDFs)
await s3.write("preview.png", imageData, {
  contentDisposition: "inline",
});

// Set on file object
const file = s3.file("contract.docx", {
  contentDisposition: 'attachment; filename="signed-contract.docx"',
});
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

### Terminal/PTY (Bun 1.3.6+)

Run interactive programs (vim, htop, python REPL, psql) with full TTY support:

```typescript
// Basic interactive terminal
const proc = Bun.spawn(["vim", "file.txt"], {
  terminal: {
    cols: 80,
    rows: 24,
    data(term, data) {
      process.stdout.write(data);  // Colors, cursor movements preserved
    },
  },
});

// Forward keyboard input
process.stdin.setRawMode(true);
process.stdin.pipe(proc.terminal);
await proc.exited;
```

**Custom terminal wrapper:**
```typescript
const terminal = new Bun.Terminal({
  cols: 120,
  rows: 40,
  data(term, data) {
    process.stdout.write(data);
  }
});

// Run any interactive command
Bun.spawn(["python3", "-i"], { terminal });
Bun.spawn(["psql", "-U", "user", "db"], { terminal });
Bun.spawn(["htop"], { terminal });
```

**Use cases:** Interactive shells, text editors, system monitors, REPLs, database clients.

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

// Open file in editor (respects $EDITOR / $VISUAL)
Bun.openInEditor("./src/app.ts");                  // Open file
Bun.openInEditor("./src/app.ts", { line: 42 });    // Jump to line
Bun.openInEditor("./src/app.ts", { line: 42, column: 10 });  // Line + column
Bun.resolveSync("./src/auth.ts", import.meta.dir); // Resolve relative path

// HTML escaping (XSS prevention)
Bun.escapeHTML("<script>alert('xss')</script>");  // &lt;script&gt;...
Bun.escapeHTML(userInput);                         // Always escape user input
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

### V8 Type Checking APIs (Bun 1.3.6+)

Bun implements V8 C++ APIs for native module (`.node` addon) compatibility:

| C++ API | Checks For | JS Equivalent |
|---------|------------|---------------|
| `value->IsMap()` | Map objects | `value instanceof Map` |
| `value->IsArray()` | Arrays | `Array.isArray(value)` |
| `value->IsInt32()` | 32-bit signed int | `Number.isInteger(v) && v >= -2³¹ && v < 2³¹` |
| `value->IsBigInt()` | BigInt values | `typeof value === 'bigint'` |

**Why it matters:**
- Native modules (`node-canvas`, `sqlite3`, `bcrypt`, `sharp`) work correctly
- C++ type checks faster than JS equivalents
- Memory safety via type guards before `As<T>()` casts

**JS usage (consuming native modules):**
```javascript
const nativeProcessor = require("native-data-processor.node");

// These work correctly in Bun if the native module uses the new APIs
nativeProcessor.handleMap(new Map([["key", "value"]]));
nativeProcessor.handleArray([1, 2, 3, 4]);
nativeProcessor.handleBigInt(12345678901234567890n);
```

**C++ cross-platform pattern (writing native modules):**
```cpp
// Works in both Bun and Node.js
v8::Local<v8::Value> ProcessValue(v8::Local<v8::Value> input) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();

  if (input->IsArray()) {
    v8::Local<v8::Array> arr = input.As<v8::Array>();
    return ProcessArray(isolate, arr);
  } else if (input->IsMap()) {
    v8::Local<v8::Map> map = input.As<v8::Map>();
    return ProcessMap(isolate, map);
  } else if (input->IsBigInt()) {
    v8::Local<v8::BigInt> bigint = input.As<v8::BigInt>();
    return ProcessBigInt(isolate, bigint);
  }
  return v8::Undefined(isolate);
}
```

**Note:** SecurityBootstrap blocks native addons by default (`blockNativeAddons: true`). These APIs apply when addons are permitted.

### Windows Compatibility (Bun 1.3.6+)

Critical Windows stability fixes - Bun is now production-ready on Windows:

| Fix | Before | After |
|-----|--------|-------|
| WebSocket `perMessageDeflate` | Crashes on large messages | Works reliably |
| `bunx` argument parsing | Fails with spaces/empty strings | Handles all edge cases |
| Native module HMR | Crashes on hot reload | Reloads cleanly |
| TLS `_secureEstablished` | Incorrect state reporting | Accurate HTTPS detection |

**WebSocket compression (now safe on Windows):**
```javascript
const ws = new WebSocket("wss://api.example.com", {
  perMessageDeflate: true  // No longer crashes on Windows
});
ws.send(JSON.stringify(largeDataset));  // Safe
```

**bunx edge cases fixed:**
```bash
bunx create-react-app "My Project"           # Spaces in path
bunx some-tool --env="production" --debug="" # Empty strings
bunx my-cli "arg1" "" "arg with spaces"      # Mixed quotes
```

**Remove platform workarounds:**
```javascript
// BEFORE: Platform-specific code
function send(data) {
  if (process.platform === "win32") {
    ws.send(data, { compress: false });  // Workaround
  } else {
    ws.send(data, { compress: true });
  }
}

// AFTER: Clean cross-platform code
function send(data) {
  ws.send(data, { compress: true });  // Works everywhere
}
```

**CI/CD - Windows runners now reliable:**
```yaml
runs-on: windows-latest
steps:
  - uses: oven-sh/setup-bun@v1
    with:
      bun-version: ">=1.3.6"  # Critical fix version
```

### bun install CLI Reference

```bash
bun install [packages...] [flags]
```

**Dependency Scope:**
| Flag | Effect |
|------|--------|
| `--production` | Skip devDependencies |
| `--omit dev\|optional\|peer` | Exclude specific dep types |
| `--only-missing` | Only add if not already in package.json |

**Dependency Type:**
| Flag | Adds to |
|------|---------|
| `--dev` / `-d` | devDependencies |
| `--optional` | optionalDependencies |
| `--peer` | peerDependencies |
| `--exact` | Exact version (no ^ range) |

**Lockfile Control:**
| Flag | Effect |
|------|--------|
| `--frozen-lockfile` | Fail if lockfile would change (CI) |
| `--save-text-lockfile` | Force text bun.lock (not binary) |
| `--lockfile-only` | Generate lockfile without installing |
| `--yarn` | Write yarn.lock (v1 format) |
| `--no-save` | Don't update package.json or lockfile |

**Installation Control:**
| Flag | Effect |
|------|--------|
| `--force` | Re-fetch all from registry |
| `--dry-run` | Preview without installing |
| `--global` / `-g` | Install globally |
| `--filter <pattern>` | Install for matching workspaces only |
| `--analyze` | Recursively analyze imports & install |
| `--trust` | Add to trustedDependencies |

**Performance:**
| Flag | Default | Effect |
|------|---------|--------|
| `--concurrent-scripts` | 5 | Max parallel lifecycle scripts |
| `--network-concurrency` | 48 | Max parallel network requests |
| `--backend` | clonefile | `hardlink\|symlink\|copyfile` |

**Common Combos:**
```bash
bun install --frozen-lockfile              # CI builds
bun install --production                   # Deploy (no devDeps)
bun install --filter "@scope/*"            # Workspace subset
bun add lodash --exact                     # Pin exact version
bun add -d vitest                          # Add dev dependency
bun install --save-text-lockfile           # Migrate to text lockfile
```

**pnpm Migration:** Requires pnpm lockfile v7+. After `bun install`, remove `pnpm-lock.yaml` and `pnpm-workspace.yaml`.

### Benchmarking & Profiling

**CLI benchmarking with hyperfine:**
```bash
# Install
brew install hyperfine  # or cargo install hyperfine

# Compare runtimes
hyperfine "bun script.ts" "node script.js"
hyperfine --warmup 3 "bun build src/index.ts"
```

**JavaScript heap stats:**
```typescript
import { heapStats } from "bun:jsc";
console.log(heapStats());

// Force garbage collection
Bun.gc(true);   // synchronous
Bun.gc(false);  // asynchronous
```

**Heap snapshots (view in Safari DevTools → Timeline → JS Allocations):**
```typescript
import { generateHeapSnapshot } from "bun";
const snapshot = generateHeapSnapshot();
await Bun.write("heap.json", JSON.stringify(snapshot, null, 2));
```

**Native heap stats (mimalloc):**
```bash
MIMALLOC_SHOW_STATS=1 bun script.ts
# Prints: peak, total, freed, current memory on exit
```

**CPU profiling:**
```bash
bun --cpu-prof script.ts                      # Generate .cpuprofile
bun --cpu-prof --cpu-prof-name my.cpuprofile  # Custom filename
bun --cpu-prof --cpu-prof-dir ./profiles      # Custom directory
# Open in Chrome DevTools (Performance tab → Load profile)
```

| Tool | Use Case | Output |
|------|----------|--------|
| `hyperfine` | CLI/script timing | Terminal stats |
| `heapStats()` | JS memory inspection | Object counts |
| `generateHeapSnapshot()` | Memory leak debugging | Safari DevTools |
| `MIMALLOC_SHOW_STATS=1` | Native memory | Exit summary |
| `--cpu-prof` | Performance bottlenecks | Chrome DevTools |

### Compile-Time Feature Flags (Bun 1.3.6+)

Dead-code elimination at build time - code for disabled features is removed from bundle:

```typescript
// env.d.ts - Type-safe feature definitions
declare module "bun:bundle" {
  interface Registry {
    features: "DEBUG" | "PREMIUM" | "ADMIN" | "TIER_FREE" | "TIER_PRO";
  }
}

// app.ts
import { feature } from "bun:bundle";

if (feature("DEBUG")) {
  console.log("Debug mode");  // Removed unless --feature=DEBUG
}

if (feature("TIER_PRO")) {
  initPremiumFeatures();  // Only in pro tier bundle
}
```

**Build commands:**
```bash
bun build --feature=DEBUG --minify src/app.ts      # Dev build
bun build --feature=TIER_FREE --minify src/app.ts  # Free tier
bun build --feature=TIER_PRO --minify src/app.ts   # Pro tier
bun run --feature=DEBUG src/app.ts                 # Runtime
```

**package.json scripts:**
```json
{
  "scripts": {
    "build:free": "bun build --feature=TIER_FREE --minify src/app.ts",
    "build:pro": "bun build --feature=TIER_PRO --minify src/app.ts",
    "build:enterprise": "bun build --feature=TIER_ENTERPRISE --minify src/app.ts"
  }
}
```

**Result:** Up to 60% bundle size reduction by eliminating unused feature code.

### .npmrc Environment Variables (Bun 1.3.6+)

All variable formats now work correctly:

```bash
# .npmrc - all these work now
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
//registry.npmjs.org/:_authToken="${NPM_TOKEN}"
//registry.npmjs.org/:_authToken='${NPM_TOKEN}'

# Optional modifier (undefined → empty string instead of error)
//registry.npmjs.org/:_authToken=${NPM_TOKEN?}
email="${NPM_EMAIL?}"
```

**CI/CD usage:**
```yaml
# GitHub Actions
env:
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
steps:
  - run: bun install  # .npmrc ${NPM_TOKEN} works correctly
```
