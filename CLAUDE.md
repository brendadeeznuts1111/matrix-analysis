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

**Script Exit Codes:** Always exit with code 1 on errors:
```typescript
// For async main()
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// For top-level scripts
process.on("uncaughtException", (err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
```

**Browser:** Always use Chrome when opening URLs:
```bash
open -a "Google Chrome" <url>
```

**Large Files:** Use Grep with context instead of Read for files >4000 tokens:
```typescript
// Find specific patterns with context
Grep({ pattern: "async function benchmark", path: "file.ts", output_mode: "content", "-B": 2, "-A": 10 })

// Find all test/describe blocks
Grep({ pattern: "it\\(|describe\\(", path: "file.ts", output_mode: "content", "-A": 3 })

// Find class definitions
Grep({ pattern: "^export class", path: "file.ts", output_mode: "content", "-A": 20 })

// Find imports and their usage context
Grep({ pattern: "import.*from", path: "file.ts", output_mode: "content", "-A": 2 })

// Bun-specific patterns
Grep({ pattern: "Bun\\.serve\\(", path: "src/", output_mode: "content", "-A": 5 })
Grep({ pattern: "await sql`", path: "src/", output_mode: "content" })
Grep({ pattern: "Bun\\.file\\(", path: "src/", output_mode: "content" })
```
Benefits: Targeted results, no token limits, focused context. Only use `Read` with offset/limit when you need sequential scanning.

---

## Bun Quick Reference

Use Context7 MCP for detailed docs. Below are essential patterns and gotchas.

### Quick Navigation
- [Server & Requests](#server--requests) | [Database (SQLite/SQL)](#sqlite) | [Storage (S3/File)](#file-io)
- [Build & Bundle](#build-system) | [Testing](#testing) | [Node.js Compatibility](#nodejs-compatibility)

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

// Delete files (Bun 1.2+)
await file.delete();  // or file.unlink()

// File stats (Node.js compatible)
const stat = await file.stat();
console.log(stat.size, stat.mode, stat.isFile());
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

### Bun.sql (PostgreSQL Client)

```typescript
import { sql } from "bun";

// Connection via DATABASE_URL env var
const users = await sql`
  SELECT * FROM users
  WHERE active = ${true}
  LIMIT ${10}
`;

// Transactions
await sql.begin(async (sql) => {
  await sql`INSERT INTO logs (msg) VALUES (${"start"})`;
  await sql`UPDATE users SET status = 'active'`;
});

// MySQL support coming soon
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

// ORM-less object mapping
class User {
  id: number;
  email: string;
  get domain() { return this.email.split("@")[1]; }
}
const users = db.query("SELECT * FROM users").as(User);

// Iterable queries (memory efficient for large tables)
for (const row of db.query("SELECT * FROM large_table")) {
  console.log(row);
}

// Automatic cleanup with `using`
{
  using db = new Database("app.sqlite");
  using query = db.query("SELECT * FROM users");
  // Auto-closed on scope exit, even on errors
}

// BigInt support for 64-bit integers
const db64 = new Database(":memory:", { safeIntegers: true });
```

### Testing

```typescript
import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";

describe("feature", () => {
  const fetchMock = mock(() => Promise.resolve({ json: () => ({}) }));

  beforeEach(() => {
    fetchMock.mockClear();  // Reset between tests
  });

  it("works", async () => {
    expect(value).toBe(expected);
    expect(obj).toEqual({ key: "val" });
    await expect(promise).resolves.toBe(value);
    expect(() => fn()).toThrow();
  });

  it("handles async errors", async () => {
    await expect(promise).rejects.toThrow("Network error");
  });
});

const fn = mock(() => value);
const spy = spyOn(obj, "method");
spy.mockReturnValue(42);

// Snapshot testing
it("matches snapshot", () => {
  expect({ a: 1, b: [2, 3] }).toMatchSnapshot();
});
// Update snapshots: bun test --update-snapshots
```

**AI Agent Integration:** Set `CLAUDECODE=1` for quieter output (only failures shown):
```bash
CLAUDECODE=1 bun test  # Reduces noise, preserves failure details
```

**Key CLI Flags:**
| Flag | Description |
|------|-------------|
| `--bail` / `--bail=N` | Exit after N failures (default: 1) |
| `--timeout=N` | Per-test timeout in ms (default: 5000) |
| `-t "pattern"` | Run tests matching regex |
| `--coverage` | Generate coverage profile |
| `--update-snapshots` / `-u` | Update snapshot files |
| `--rerun-each=N` | Re-run each file N times (catch flaky tests) |

### Hot Module Replacement (HMR)

Bun's dev server supports HMR via `import.meta.hot` ([docs](https://bun.com/docs/bundler/hot-reloading)):

```typescript
// Self-accepting module - re-evaluates on change
import.meta.hot.accept();

// Persist state across hot reloads
const root = (import.meta.hot.data.root ??= createRoot(elem));
root.render(<App />);

// Cleanup before module replacement
import.meta.hot.dispose(() => {
  sideEffect.cleanup();
});

// Cleanup when module is no longer imported
import.meta.hot.prune(() => {
  ws.close();
});

// Listen for HMR events
import.meta.hot.on("bun:beforeUpdate", () => console.log("updating..."));
import.meta.hot.on("bun:error", (err) => console.error(err));
```

**API Methods:**

| Method | Purpose |
|--------|---------|
| `accept()` | Mark module as hot-replaceable |
| `accept(cb)` | Callback with new module on update |
| `accept("./dep", cb)` | Accept dependency updates |
| `data` | Persist state between reloads |
| `dispose(cb)` | Cleanup before replacement |
| `prune(cb)` | Cleanup when imports removed |
| `on(event, cb)` | Listen for HMR events |
| `off(event, cb)` | Remove event listener |

**Events:** `bun:beforeUpdate`, `bun:afterUpdate`, `bun:beforeFullReload`, `bun:error`, `bun:ws:disconnect`, `bun:ws:connect`

**Note:** HMR calls are dead-code-eliminated in production. Must call directly (no `const hot = import.meta.hot`).

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
| `--save-text-lockfile` | Force text bun.lock (default in 1.2+) |
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
| `--linker` | hoisted | `isolated` (pnpm-style) prevents phantom deps |

**Network & Registry:**
| Flag | Effect |
|------|--------|
| `--registry <url>` | Override npm registry |
| `--ca <cert>` | CA signing certificate |
| `--cafile <path>` | Path to CA certificate file |
| `--cache-dir <path>` | Custom cache directory |
| `--no-cache` | Ignore manifest cache |
| `--no-verify` | Skip integrity verification |

**Cross-Platform:**
| Flag | Values |
|------|--------|
| `--cpu` | `arm64`, `x64`, `ia32`, `ppc64`, `s390x` |
| `--os` | `linux`, `darwin`, `win32`, `freebsd`, `openbsd` |

**Security:**
| Flag | Effect |
|------|--------|
| `--minimum-release-age <sec>` | Only install packages older than N seconds |
| `--ignore-scripts` | Skip project lifecycle scripts |

**Environment Variables:**
| Variable | Effect |
|----------|--------|
| `BUN_CONFIG_REGISTRY` | Default registry URL |
| `BUN_CONFIG_YARN_LOCKFILE` | Save yarn.lock v1 |
| `BUN_CONFIG_SKIP_SAVE_LOCKFILE` | Don't save lockfile |
| `BUN_CONFIG_SKIP_LOAD_LOCKFILE` | Don't load lockfile |

**Common Combos:**
```bash
bun install --frozen-lockfile              # CI builds (or `bun ci`)
bun install --production                   # Deploy (no devDeps)
bun install --filter "@scope/*"            # Workspace subset
bun add lodash --exact                     # Pin exact version
bun add -d vitest                          # Add dev dependency
bun install --save-text-lockfile           # Migrate to text lockfile (better diffs)
bun install --cpu=x64 --os=linux           # Cross-platform install
bun install --minimum-release-age 259200   # 3-day supply chain protection
bun install --linker isolated              # pnpm-style isolation
```

**pnpm Migration:** Requires pnpm lockfile v7+. After `bun install`, remove `pnpm-lock.yaml` and `pnpm-workspace.yaml`.

### bun update CLI Reference

Update dependencies to latest versions. Use `bun upgrade` to upgrade Bun CLI itself.

```bash
bun update [package]           # Update specific package
bun update                     # Update all dependencies
bun update -g package          # Update global package
```

**Interactive Mode (`-i`):**
```bash
bun update -i                  # Select packages interactively
bun update -i -r               # Interactive + recursive (monorepos)
```

Interactive interface:
```
  dependencies              Current  Target   Latest
    □ react                 17.0.2   18.2.0   18.3.1
  devDependencies           Current  Target   Latest
    ☑ typescript            4.8.0    5.0.0    5.3.3
```

| Column | Meaning |
|--------|---------|
| Current | Installed version |
| Target | Semver-compatible update |
| Latest | Newest available |

**Keyboard Controls:**
| Key | Action |
|-----|--------|
| `Space` | Toggle selection |
| `Enter` | Confirm and update |
| `a` | Select all |
| `n` | Select none |
| `i` | Invert selection |
| `j/k` or `↑/↓` | Navigate |
| `l` | Toggle target ↔ latest |
| `Ctrl+C` | Cancel |

**Visual Indicators:** ☑ selected, □ unselected, colors: red=major, yellow=minor, green=patch

**Key Flags:**
| Flag | Effect |
|------|--------|
| `--latest` | Update beyond semver range |
| `--force` / `-f` | Re-fetch all from registry |
| `--dry-run` | Preview without installing |
| `--frozen-lockfile` | Fail if lockfile would change |
| `--production` / `-p` | Skip devDependencies |
| `--recursive` / `-r` | Update across workspaces |

**Common Combos:**
```bash
bun update -i                       # Interactive selection
bun update --latest                 # Update all to latest (ignore semver)
bun update react --latest           # Update specific package to latest
bun update -i -r                    # Monorepo interactive update
bun update --dry-run                # Preview changes
```

### bun publish CLI Reference

Publish packages to npm registry.

```bash
bun publish                        # Publish from current directory
bun publish --dry-run              # Preview without publishing
bun publish --access public        # Set access level (public/restricted)
bun publish --tag alpha            # Publish with specific tag
```

**Key Flags:**
| Flag | Effect |
|------|--------|
| `--access public\|restricted` | Set package access level |
| `--tag <name>` | Set version tag (default: `latest`) |
| `--dry-run` | Simulate publish without uploading |
| `--otp <code>` | Provide 2FA one-time password |
| `--auth-type web\|legacy` | 2FA method preference |
| `--registry <url>` | Custom registry URL |
| `--ignore-scripts` | Skip lifecycle scripts |
| `--silent` | Suppress output |

**Authentication:**
```bash
bunx npm login                     # Login to npm (opens browser)
bun publish --otp 123456           # Publish with 2FA code
```

**Environment:** `NPM_CONFIG_TOKEN` for CI/CD automated publishing.

**publishConfig in package.json:**
```json
{
  "publishConfig": {
    "access": "public",
    "tag": "latest",
    "registry": "https://registry.npmjs.org"
  }
}
```

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

### HTML Imports & CSS Bundling

```typescript
// Import HTML directly - bundles JS/CSS automatically
import homepage from "./index.html";

Bun.serve({
  static: {
    "/": homepage,
  },
  async fetch(req) {
    // API requests...
  },
});

// CSS imports (experimental)
import "./styles.css";  // Bundled and optimized
```

### Node.js Compatibility

```typescript
// HTTP/2 server (now supported)
import { createSecureServer } from "node:http2";

// UDP sockets (node:dgram)
import { createSocket } from "node:dgram";

// Cluster module
import cluster from "node:cluster";
```

### Build System

```typescript
// Environment variable injection at build time
await Bun.build({
  entrypoints: ["./app.tsx"],
  env: "PUBLIC_*",  // Inject process.env.PUBLIC_*
});
// CLI: bun build --env="PUBLIC_*" app.tsx

// Remove console/debugger from production
await Bun.build({
  entrypoints: ["./index.ts"],
  drop: ["console", "debugger"],
  banner: "/* License: MIT */",
  footer: "/* Built with Bun */",
});
```

### Web Streams APIs

```typescript
// Streaming text decoding (up to 30x faster than Node.js)
const response = await fetch("https://api.example.com/stream");
const body = response.body.pipeThrough(new TextDecoderStream());

// Text encoding stream
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello");
    controller.close();
  },
}).pipeThrough(new TextEncoderStream());
```

### Experimental C Interop

```typescript
// Compile and run C from JavaScript
import { cc } from "bun:ffi";

const lib = cc({
  source: `
    int add(int a, int b) {
      return a + b;
    }
  `,
});
console.log(lib.add(1, 2));  // 3
```

### Error Handling Patterns

Consistent with the "Return null" convention:

```typescript
// Database errors with context
const user = await sql`SELECT * FROM users WHERE id = ${id}`.catch((err) => {
  console.error(`DB error fetching user ${id}:`, err.message);
  return null;
});

// File operations
const data = await Bun.file("config.json").json().catch(() => null);

// S3 operations with fallback
const file = Bun.s3.file("backup.zip");
const exists = await file.exists().catch(() => false);
```

### Performance Best Practices

```typescript
// Use iterable queries for large datasets
for (const row of db.query("SELECT * FROM huge_table")) {
  // Process row-by-row, no memory bloat
}

// DNS prefetch for API calls
import { dns } from "bun";
dns.prefetch("api.example.com", 443);

// Zero-copy file uploads (files >=32KB)
await fetch(url, { body: Bun.file("large.zip") });
```

### Cross-Runtime Guards

For code that runs in both Bun and Node.js:

```typescript
if (typeof Bun !== "undefined") {
  const file = Bun.file("./data.txt");
  // Use Bun APIs
} else {
  // Node.js fallback
  const fs = require("fs");
}
```
