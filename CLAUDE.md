# User Preferences

## Table Formatting Policy

**NEVER use markdown tables for summaries or overviews.** Markdown tables strip context and are limited in display.

### Required: Use `Bun.inspect.table()`

For any tabular data output, use Bun's built-in table utilities.

**API Signature (Bun 1.2+):**
```typescript
Bun.inspect.table(
  tabularData: object | unknown[],
  properties?: string[],
  options?: { colors: boolean }
): string
```

**Basic Usage:**
```typescript
// All columns, no colors
Bun.inspect.table(data)

// All columns with ANSI colors
Bun.inspect.table(data, { colors: true })

// Filter to specific columns
Bun.inspect.table(data, ["name", "status", "health"])

// Filter columns + colors
Bun.inspect.table(data, ["name", "status"], { colors: true })
```

**Pre-format Pattern for Custom Display:**
```typescript
// Transform data with custom column names and formatting
const formatted = skills.map(s => ({
  "#": s.id,
  "Skill": `${s.icon} ${s.name}`,           // Emoji + name
  "Status": `${statusIcon(s.status)} ${s.status}`,  // Icon + text
  "Health": "█".repeat(s.health/12.5) + "░".repeat(8 - s.health/12.5),
  "Category": s.category,
}));

console.log(Bun.inspect.table(formatted, { colors: true }));
```

**Output:**
```
┌───┬───┬────────────────────┬────────────┬──────────┬───────────────┐
│   │ # │ Skill              │ Status     │ Health   │ Category      │
├───┼───┼────────────────────┼────────────┼──────────┼───────────────┤
│ 0 │ 1 │ 🔐 1password       │ 🟢 ready   │ ████████ │ utilities     │
│ 1 │ 2 │ 📝 apple-notes     │ 🟢 ready   │ ████████ │ productivity  │
│ 2 │ 3 │ ⏰ apple-reminders │ 🟠 bin     │ ░░░░░░░░ │ productivity  │
└───┴───┴────────────────────┴────────────┴──────────┴───────────────┘
```

**Features:**
- Automatic column width calculation
- Perfect emoji/Unicode alignment (uses `Bun.stringWidth` internally)
- ANSI color code handling
- Box-drawing borders

**Not Yet Supported (as of Bun 1.3.6):**
- Column objects with `{ key, label, align, width, format }`
- Custom border styles (`rounded`, `single`, `double`)
- Built-in sorting
- `depth` option (nested objects always truncate to `[Object ...]`)
- `maxWidth` option (table expands beyond specified width)
- `columns` inside options object (use 2nd parameter array instead)

### `Bun.deepEquals()` - Object Comparison

Compare objects/arrays for deep equality:

```typescript
Bun.deepEquals(a: any, b: any, strict?: boolean): boolean
```

**Usage:**
```typescript
// Non-strict comparison (default)
Bun.deepEquals({ a: 1 }, { a: 1 })           // true
Bun.deepEquals({ a: 1 }, { a: "1" })         // false (different types)
Bun.deepEquals([1, 2, 3], [1, 2, 3])         // true

// Strict comparison (third parameter)
Bun.deepEquals({ a: 1 }, { a: 1 }, true)     // true
Bun.deepEquals({ a: 1 }, { a: "1" }, true)   // false

// Nested objects
const configA = { settings: { model: "gpt-4", temp: 0.7 } };
const configB = { settings: { model: "gpt-4", temp: 0.9 } };
Bun.deepEquals(configA, configB)             // false
```

**State Change Detection Pattern:**
```typescript
// Detect changes between snapshots
const previous = { id: 1, health: 100, version: "1.0" };
const current = { id: 1, health: 95, version: "1.0" };

if (!Bun.deepEquals(previous, current)) {
  // Find what changed
  for (const key of Object.keys(current)) {
    if (!Bun.deepEquals(previous[key], current[key])) {
      console.log(`${key}: ${previous[key]} → ${current[key]}`);
    }
  }
}
// Output: health: 100 → 95
```

### Preload via bunfig.toml

Register table utilities globally via preload:

```toml
# bunfig.toml
preload = ["./table-utils.ts"]
```

```typescript
// table-utils.ts
import { plugin } from "bun";

plugin({
  name: "table-formatter",
  setup(build) {
    // Use defer() to wait for all modules before aggregating stats
    build.onLoad({ filter: /\.stats\.json$/ }, async ({ defer }) => {
      await defer(); // Wait for all other modules to load first
      // Return aggregated data
      return { exports: { /* collected stats */ } };
    });
  },
});
```

### Width Calculation

Use `Bun.stringWidth()` for accurate terminal display width:

```typescript
Bun.stringWidth("🇺🇸")      // 2 - flag emoji
Bun.stringWidth("👨‍👩‍👧")    // 2 - ZWJ family sequence
Bun.stringWidth("\u2060")  // 0 - word joiner (invisible)
```

Handles:
- Unicode characters and ANSI escape sequences
- Zero-width characters (soft hyphen, word joiner, combining marks)
- Grapheme-aware emoji (ZWJ sequences, skin tones, flags)
- CSI sequences (cursor movement, erase, scroll)
- OSC sequences including OSC 8 hyperlinks

### Custom Object Formatting

Use `Bun.inspect.custom` symbol:

```typescript
const obj = {
  [Bun.inspect.custom]() {
    return "custom formatted output";
  }
};

// Also works: util.inspect.custom from node:util
```

### Color Parsing with `Bun.color()`

Parse and convert colors between formats:

```typescript
const color = Bun.color("rgba(255, 0, 0, 0.5)");
console.log(color.r, color.g, color.b, color.a); // 255 0 0 0.5
```

**Supported input formats:**
```typescript
Bun.color("#ff0000")                    // hex
Bun.color("#ff000080")                  // hex with alpha
Bun.color("rgb(255, 0, 0)")             // rgb
Bun.color("rgba(255, 0, 0, 0.5)")       // rgba
Bun.color("hsl(0, 100%, 50%)")          // hsl
Bun.color("hsla(0, 100%, 50%, 0.5)")    // hsla
Bun.color("red")                        // CSS color names
Bun.color("transparent")                // special values
Bun.color(0xff0000)                     // number
Bun.color({ r: 255, g: 0, b: 0 })       // object
Bun.color([255, 0, 0])                  // array
```

**Get RGBA channels:**
```typescript
Bun.color("#22c55e", "{rgba}")  // { r: 34, g: 197, b: 94, a: 1 }
Bun.color("red", "{rgb}")       // { r: 255, g: 0, b: 0 }
Bun.color("red", "[rgba]")      // [255, 0, 0, 1]
Bun.color("red", "[rgb]")       // [255, 0, 0]
```

**Convert to string formats:**
```typescript
const color = Bun.color("rgba(255, 0, 0, 0.5)");
color.toHexString()      // "#ff0000"
color.toHex8String()     // "#ff000080" (with alpha)
color.toRgbString()      // "rgb(255, 0, 0)"
color.toRgbaString()     // "rgba(255, 0, 0, 0.5)"
color.toHslString()      // "hsl(0, 100%, 50%)"
color.toHslaString()     // "hsla(0, 100%, 50%, 0.5)"
```

**Validation:**
```typescript
Bun.color.isValid("red")        // true
Bun.color.isValid("notacolor")  // false
```

### Bun.JSONC - Parse JSON with Comments

```typescript
const config = Bun.JSONC.parse(`
{
  "skills": {
    // Security tools
    "1password": { "enabled": true },

    // AI tools
    "gemini": {
      "model": "gemini-2.0-flash", // Latest
      "maxTokens": 4096,
    },
  },
}
`);
```

### Bun.Archive - Zero-dependency archives

```typescript
const archive = new Bun.Archive({
  "skills.json": JSON.stringify(skills, null, 2),
  "config.jsonc": configText,
  "install.sh": installScript,
}, { compress: "gzip", level: 9 });

await Bun.write("backup.tar.gz", archive);
```

### Bun.build - Virtual files & metafile

```typescript
const result = await Bun.build({
  entrypoints: ["virtual:loader"],
  files: {
    "virtual:loader": `
      import skills from './data.js';
      export default skills;
    `,
    "./data.js": `export default ${JSON.stringify(data)};`,
  },
  outdir: "./dist",
  metafile: true,
  minify: true,
});

// Analyze bundle
for (const [file, meta] of Object.entries(result.metafile.outputs)) {
  console.log(`${file}: ${(meta.bytes / 1024).toFixed(2)} KB`);
}
```

### `Bun.serve()` - Port & Hostname Configuration

```typescript
const server = Bun.serve({
  port: 8080,           // defaults to $BUN_PORT, $PORT, $NODE_PORT, then 3000
  hostname: "0.0.0.0",  // defaults to "0.0.0.0" (all interfaces)
  fetch(req) {
    return new Response("OK");
  },
});
```

**Random port (auto-select available):**
```typescript
const server = Bun.serve({
  port: 0,  // Bun picks an available port
  fetch(req) { return new Response("OK"); },
});

console.log(server.port);  // e.g., 54321
console.log(server.url);   // URL object: http://localhost:54321/
```

**Server properties:**
```typescript
server.port      // number - actual bound port
server.hostname  // string - bound hostname
server.url       // URL object - full server URL
```

**Environment variable priority:**
1. `$BUN_PORT`
2. `$PORT`
3. `$NODE_PORT`
4. `3000` (default)

**Server lifecycle methods:**
```typescript
// Get client IP address
const ip = server.requestIP(req);
// { address: "::1", family: "IPv6", port: 53945 }

// Set per-request idle timeout (seconds)
server.timeout(req, 30);  // Close socket if idle for 30s

// Hot-swap fetch handler without restart
server.reload({
  fetch(req) {
    return new Response("New handler!");
  },
});

// Stop server (graceful by default)
await server.stop();       // Wait for in-flight requests
await server.stop(true);   // Force immediate shutdown

// Control process keep-alive
server.unref();  // Allow process to exit if nothing else running
server.ref();    // Keep process alive (default)
```

**Server introspection:**
```typescript
server.port              // number - bound port
server.hostname          // string - bound hostname
server.url               // URL - full server URL
server.id                // string - unique server ID
server.development       // boolean - dev mode enabled
server.pendingRequests   // number - in-flight HTTP requests
server.pendingWebSockets // number - active WebSocket connections
```

### Response.json() - 3.5x faster serialization

```typescript
Bun.serve({
  fetch(req) {
    if (url.pathname === "/api/skills") {
      return Response.json(skills);  // Fast path
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  },
});
```

### Bun.serve() Automatic Content-Type Handling

**ALWAYS leverage Bun's automatic Content-Type detection instead of manual headers.**

| Response Body Type | Auto Content-Type | Notes |
|-------------------|-------------------|-------|
| `Bun.file("x.css")` | `text/css` | Inferred from extension |
| `Bun.file("x.png")` | `image/png` | Inferred from extension |
| `Bun.file("x.json")` | `application/json` | Inferred from extension |
| `Response.json(obj)` | `application/json` | **Always use for JSON** |
| `new Blob([...], { type })` | Copies `blob.type` | Explicit type preserved |
| `new FormData()` | `multipart/form-data; boundary=...` | Auto boundary |
| `new URLSearchParams()` | `application/x-www-form-urlencoded` | Auto |
| Plain string/ArrayBuffer | **None** | Must set manually |

**Required Patterns:**

```typescript
// JSON responses - ALWAYS use Response.json()
return Response.json({ data: result });                    // 200
return Response.json({ error: "Not found" }, { status: 404 }); // 404
return Response.json({ error: "Unauthorized" }, { status: 401 });

// NEVER do this - missing Content-Type:
return new Response(JSON.stringify({ error: "Bad" }), { status: 400 });

// Static files - Bun.file() auto-detects
return new Response(Bun.file("./style.css"));     // text/css
return new Response(Bun.file("./image.png"));     // image/png
return new Response(Bun.file("./data.json"));     // application/json

// HTML - must set manually (strings have no auto Content-Type)
return new Response(htmlString, {
  headers: { "Content-Type": "text/html; charset=utf-8" }
});

// Plain text - must set manually
return new Response("Hello", {
  headers: { "Content-Type": "text/plain; charset=utf-8" }
});

// Form data - auto multipart boundary
const form = new FormData();
form.append("file", Bun.file("upload.txt"));
return new Response(form);  // multipart/form-data; boundary=----...

// URL params - auto urlencoded
const params = new URLSearchParams({ q: "search", page: "1" });
return new Response(params);  // application/x-www-form-urlencoded
```

**Error Response Pattern:**

```typescript
// Centralized error responses with proper Content-Type
function errorResponse(message: string, status: number) {
  return Response.json({ error: message, status }, { status });
}

// Usage
return errorResponse("Invalid credentials", 401);
return errorResponse("Resource not found", 404);
return errorResponse("Internal server error", 500);
```

### `Bun.hash.crc32()` - Hardware-Accelerated Checksums

CRC32 hashing with ~9 GB/s throughput (hardware accelerated):

```typescript
// From Uint8Array/Buffer
const bytes = await Bun.file("backup.tar.gz").bytes();
const checksum = Bun.hash.crc32(bytes);
const hex = checksum.toString(16).padStart(8, "0");
console.log(`CRC32: ${hex}`);  // e.g., "a1b2c3d4"

// From string
Bun.hash.crc32("hello world")  // number

// Verify archive integrity
const expected = await Bun.file("backup.crc32").text();
const calculated = Bun.hash.crc32(await Bun.file("backup.tar.gz").bytes());
if (calculated.toString(16).padStart(8, "0") === expected.trim().split(/\s+/)[0]) {
  console.log("Checksum verified");
}
```

### `%j` Format Specifier - SIMD FastStringifier

Console logging with ~3x faster JSON serialization (Bun 1.3.6+):

```typescript
// Debug logging with fast JSON
const data = { skills: 53, ready: 18, categories: 7 };
console.log("Stats: %j", data);
// Output: Stats: {"skills":53,"ready":18,"categories":7}

// Useful for debug output
const debug = (label: string, obj: any) => {
  console.error(`[DEBUG] ${label}: %j`, obj);
};
```

### `bun link` - Local Package Development

Link local packages for development without publishing to npm:

```bash
# Register a local package as linkable
cd /path/to/my-lib
bun link
# Success! Registered "my-lib"

# Link it into another project
cd /path/to/my-app
bun link my-lib
# Creates symlink in node_modules → /path/to/my-lib
```

**With --save flag (adds to package.json):**
```json
{
  "dependencies": {
    "my-lib": "link:my-lib"
  }
}
```

**Unlink:**
```bash
cd /path/to/my-lib
bun unlink
```

**Key flags:**
```bash
--save              # Add to package.json dependencies
--global, -g        # Install globally
--dry-run           # Preview without installing
--force, -f         # Reinstall all dependencies
--frozen-lockfile   # Disallow lockfile changes
--backend <type>    # clonefile|hardlink|symlink|copyfile
```

**Symlink backend for packages:**
```bash
# Use symlinks instead of clonefile (useful for debugging)
bun install --backend symlink

# In bunfig.toml
[install]
backend = "symlink"  # clonefile (default), hardlink, symlink, copyfile
```

**Package manifest (package.json) link specifiers:**
```json
{
  "dependencies": {
    "local-pkg": "link:local-pkg",           // Registered via bun link
    "file-pkg": "file:../path/to/pkg",       // Direct file path
    "workspace-pkg": "workspace:*"           // Workspace package
  }
}
```

**Manifest cache:**
```bash
bun install --no-cache      # Ignore manifest cache
bun install --cache-dir ./  # Custom cache directory
```

### `Bun.file()` / `Bun.write()` - File I/O

```typescript
// Read file
const file = Bun.file("./data.json");
await file.text();        // string
await file.json();        // parsed JSON
await file.bytes();       // Uint8Array
await file.arrayBuffer(); // ArrayBuffer
file.size;                // bytes
file.type;                // MIME type

// Write file
await Bun.write("./out.txt", "hello");
await Bun.write("./out.json", JSON.stringify(data));
await Bun.write("./copy.txt", Bun.file("./source.txt"));
await Bun.write(Bun.stdout, "to stdout");
```

### `Bun.$` - Shell Scripting

```typescript
import { $ } from "bun";

// Simple command
await $`ls -la`;

// Capture output
const result = await $`echo hello`.text();

// With variables (auto-escaped)
const file = "my file.txt";
await $`cat ${file}`;

// Quiet mode (no output)
await $`rm -rf dist`.quiet();

// Get exit code
const { exitCode } = await $`grep pattern file.txt`.nothrow();
```

### `Bun.spawn()` - Child Processes

```typescript
// Spawn process
const proc = Bun.spawn(["ls", "-la"], {
  cwd: "/path/to/dir",
  env: { ...process.env, MY_VAR: "value" },
  stdout: "pipe",  // "pipe" | "inherit" | "ignore" | Bun.file()
  stderr: "pipe",
});

// Read output
const output = await new Response(proc.stdout).text();
await proc.exited;  // Wait for exit

// Sync version
const result = Bun.spawnSync(["echo", "hello"]);
console.log(result.stdout.toString());
```

### `Bun.Glob` - File Pattern Matching

```typescript
const glob = new Bun.Glob("**/*.ts");

// Scan directory
for await (const file of glob.scan({ cwd: "./src" })) {
  console.log(file);
}

// Match string
glob.match("src/index.ts");  // true
```

### `Bun.password` - Password Hashing

```typescript
// Hash password (argon2id by default)
const hash = await Bun.password.hash("mypassword");

// Verify password
const valid = await Bun.password.verify("mypassword", hash);

// With options
await Bun.password.hash("pwd", {
  algorithm: "argon2id",  // or "bcrypt"
  memoryCost: 65536,
  timeCost: 3,
});
```

### `Bun.sleep()` - Async Sleep

```typescript
await Bun.sleep(1000);  // 1 second
await Bun.sleep(100);   // 100ms

// Also works with Date
await Bun.sleepSync(50);  // Sync version
```

### `Bun.semver` - Version Comparison

```typescript
Bun.semver.satisfies("1.2.3", "^1.0.0");  // true
Bun.semver.satisfies("2.0.0", "^1.0.0");  // false
Bun.semver.order("1.0.0", "2.0.0");       // -1 (less than)
Bun.semver.order("2.0.0", "1.0.0");       // 1 (greater than)
Bun.semver.order("1.0.0", "1.0.0");       // 0 (equal)
```

### `Bun.dns` - DNS Lookups & Cache

**Cache characteristics:** per-process, in-memory, 255 entries max, 30s TTL default

```typescript
import { dns } from "bun";

// Lookup hostname
const record = await dns.lookup("example.com");
// { address: "93.184.216.34", family: 4 }

// Specific record types
await dns.resolve("example.com", "A");     // IPv4 addresses
await dns.resolve("example.com", "AAAA");  // IPv6 addresses
await dns.resolve("example.com", "MX");    // Mail records
await dns.resolve("example.com", "TXT");   // TXT records

// Prefetch (warms cache + port-specific record for fetch)
dns.prefetch("api.example.com", 443);

// Prefetch with confirmation (blocks ≤1ms if already cached)
dns.prefetch("api.example.com", 443);
await dns.promises.resolve4("api.example.com"); // ensures prefetch complete

// Cache statistics
dns.getCacheStats();
// { size: 4, cacheMisses: 2, cacheHits: 15, ... }
```

**Cache performance (typical):**
```
First resolve (miss):  ~125ms
Second resolve (hit):  ~0.8ms  ← 150× faster
```

**TTL override:**
```bash
# Lower TTL for dynamic environments
BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS=5 bun app.ts
```

**Key behaviors:**
- Failed connections automatically evict cache entries (no stale data)
- `dns.prefetch(host, port)` warms both DNS and port-specific record used by `fetch`
- Cache is shared across all `fetch()` calls in the process

### `fetch()` Optimizations - Connection Tuning

**Optimization Quick Reference:**

| Optimization | API | When to Use |
|--------------|-----|-------------|
| DNS warm-up | `dns.prefetch("host")` | Know the host, not ready to fetch yet |
| TCP+TLS warm-up | `fetch.preconnect("https://host")` | Pre-establish secure connection |
| Debug trace | `fetch(url, { verbose: true })` | See exact headers sent/received |
| Zero-copy download | `await Bun.write("file", response)` | Large response → disk |
| Zero-copy upload | `fetch(url, { body: Bun.file("big.bin") })` | File ≥32KB, no proxy |
| Pool size | `BUN_CONFIG_MAX_HTTP_REQUESTS=512` | Burst traffic >256 parallel reqs |
| Disable keep-alive | `fetch(url, { keepalive: false })` | Force connection close |

**DNS Prefetch & Pre-connect:**

```typescript
import { dns } from "bun";

// Warm up DNS cache before you need it
dns.prefetch("api.example.com");

// Pre-establish TCP + TLS connection (even deeper warm-up)
await fetch.preconnect("https://api.example.com");

// CLI flag alternative:
// bun --fetch-preconnect=https://api.example.com app.ts

// Check DNS cache statistics
console.log("DNS cache:", dns.getCacheStats());
```

**Connection Pool Re-use:**

```typescript
// First request: DNS + TCP + TLS handshake
console.time("first");
await fetch("https://api.example.com/data");
console.timeEnd("first");  // ~150ms

// Second request: reuses existing connection
console.time("second");
await fetch("https://api.example.com/data");
console.timeEnd("second");  // ~20ms (pooled)
```

**Zero-Copy File Operations:**

```typescript
// Download large file - zero-copy when possible
const response = await fetch("https://example.com/large.zip");
await Bun.write("download.zip", response);

// Upload large file - uses sendfile() on macOS/Linux
// Requirements: file ≥32KB, no proxy, regular file
await fetch("https://api.example.com/upload", {
  method: "POST",
  body: Bun.file("large-upload.bin")
});
```

**Verbose Debugging:**

```typescript
// See exact request/response headers
const res = await fetch("https://api.example.com/debug", {
  verbose: true  // Prints headers to stderr
});
```

**Fast Body Consumption:**

```typescript
// Optimized body methods
const json = await fetch(url).then(r => r.json());
const bytes = await fetch(url).then(r => r.bytes());  // Uint8Array
const text = await fetch(url).then(r => r.text());
const blob = await fetch(url).then(r => r.blob());
const buffer = await fetch(url).then(r => r.arrayBuffer());
```

**Environment Variables:**

```bash
# Increase max simultaneous connections (default: 256)
BUN_CONFIG_MAX_HTTP_REQUESTS=512 bun app.ts

# Pre-connect at startup via CLI
bun --fetch-preconnect=https://api.example.com app.ts
```

**Disable Keep-Alive Per Request:**

```typescript
// Force connection close after this request
await fetch("https://api.example.com/once", {
  keepalive: false,
  headers: { "Connection": "close" }
});
```

**Concurrency Limit & Auto-Queuing:**

Bun automatically queues requests beyond the limit (default: 256). No manual throttling needed.

```typescript
// Load test demonstrating auto-queuing behavior
const LIMIT = Number(process.env.BUN_CONFIG_MAX_HTTP_REQUESTS) || 256;
const TOTAL = 400;  // > 256 to trigger queuing

let active = 0, done = 0;
const t0 = performance.now();

// Fire all requests at once - Bun handles queuing
for (let i = 0; i < TOTAL; i++) {
  active++;
  fetch(`http://localhost:3000/api?i=${i}`)
    .then(r => r.json())
    .then(() => { done++; active--; })
    .catch(err => { console.error(err.message); active--; });
}

// Monitor: active count never exceeds LIMIT
const timer = setInterval(() => {
  console.log(`active: ${active} | done: ${done}`);
  if (done === TOTAL) {
    clearInterval(timer);
    console.log(`All finished in ${(performance.now() - t0).toFixed(0)} ms`);
  }
}, 100);
```

**Sample output (limit=256, total=400):**
```
active: 256 | done:   0   ← plateau at limit
active: 256 | done:  38   ← still at limit
active: 144 | done: 256   ← first wave done, queued start
active:   0 | done: 400   ← all complete, no errors
```

**Key behaviors:**
- Active count **never exceeds** the limit (256 default)
- Queued requests fire immediately as slots free up
- No `ECONNRESET` or file descriptor exhaustion
- Raise limit with `BUN_CONFIG_MAX_HTTP_REQUESTS` (max: 65336)

### `Bun.listen()` / `Bun.connect()` - TCP/UDP

```typescript
// TCP server
const server = Bun.listen({
  hostname: "localhost",
  port: 3000,
  socket: {
    open(socket) { console.log("connected"); },
    data(socket, data) { socket.write(data); },  // echo
    close(socket) { console.log("closed"); },
  },
});

// TCP client
const socket = await Bun.connect({
  hostname: "localhost",
  port: 3000,
  socket: {
    data(socket, data) { console.log(data.toString()); },
  },
});
socket.write("hello");

// UDP
const udp = Bun.udpSocket({
  port: 41234,
  socket: {
    message(socket, buf, port, addr) { },
  },
});
```

### `bun:sqlite` - SQLite Database

```typescript
import { Database } from "bun:sqlite";

const db = new Database("mydb.sqlite");
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");

// Prepared statements
const insert = db.prepare("INSERT INTO users (name) VALUES (?)");
insert.run("Alice");

// Query
const query = db.prepare("SELECT * FROM users WHERE name = ?");
const user = query.get("Alice");
const all = query.all();

// Transaction
db.transaction(() => {
  insert.run("Bob");
  insert.run("Charlie");
})();
```

### `Bun.redis` - Redis Client

```typescript
import { RedisClient } from "bun";

const redis = new RedisClient("redis://localhost:6379");

await redis.set("key", "value");
const val = await redis.get("key");
await redis.del("key");

// With expiry
await redis.set("session", data, { ex: 3600 });
```

### `Bun.s3` - S3 Client

```typescript
const s3 = Bun.s3({
  accessKeyId: "...",
  secretAccessKey: "...",
  bucket: "my-bucket",
  region: "us-east-1",
});

// Upload
await s3.write("path/to/file.txt", "content");
await s3.write("path/to/file.txt", Bun.file("./local.txt"));

// Download
const file = s3.file("path/to/file.txt");
const content = await file.text();

// Delete
await s3.delete("path/to/file.txt");
```

### `HTMLRewriter` - Streaming HTML Transforms

```typescript
const rewriter = new HTMLRewriter()
  .on("a[href]", {
    element(el) {
      el.setAttribute("target", "_blank");
    },
  })
  .on("script", {
    element(el) {
      el.remove();
    },
  })
  .onDocument({
    text(text) {
      // Process text nodes
    },
  });

const transformed = rewriter.transform(response);
```

### `Bun.Worker` - Multi-threading

```typescript
// main.ts
const worker = new Worker(new URL("./worker.ts", import.meta.url));
worker.postMessage({ type: "compute", data: [1, 2, 3] });
worker.onmessage = (e) => console.log("Result:", e.data);

// worker.ts
self.onmessage = (e) => {
  const result = e.data.data.reduce((a, b) => a + b, 0);
  self.postMessage(result);
};
```

### `Bun.secrets` - OS Keychain Storage

```typescript
// Store secret in OS keychain
await Bun.secrets.set({
  service: "myapp",
  name: "api-key",
  value: "secret123",
});

// Retrieve secret
const secret = await Bun.secrets.get({
  service: "myapp",
  name: "api-key",
});

// Delete secret
await Bun.secrets.delete({
  service: "myapp",
  name: "api-key",
});
```

### `Bun.randomUUIDv7()` - Time-Sortable UUIDs

```typescript
// Generate UUIDv7 (time-sortable, k-sortable)
const id = Bun.randomUUIDv7();
// "019be2f0-848e-7000-9a93-d5954967ca3c"

// UUIDv7 embeds timestamp - IDs sort chronologically
const ids = Array.from({ length: 3 }, () => Bun.randomUUIDv7());
ids.sort();  // Already in creation order

// Extract timestamp from UUIDv7
const uuid = "019be2f0-848e-7000-9a93-d5954967ca3c";
const timestamp = parseInt(uuid.slice(0, 8) + uuid.slice(9, 13), 16);
new Date(timestamp);  // Creation time
```

### `Bun.peek()` - Sync Promise Inspection

```typescript
// Synchronously get resolved promise value (no await)
const resolved = Promise.resolve(42);
Bun.peek(resolved);  // 42

// Returns the promise itself if pending
const pending = new Promise(() => {});
Bun.peek(pending);  // Promise { <pending> }

// Useful for checking cache hits
const cache = new Map<string, Promise<Data>>();
function get(key: string) {
  const cached = cache.get(key);
  if (cached) {
    const value = Bun.peek(cached);
    if (value !== cached) return value;  // Already resolved
  }
  // Fetch and cache...
}

// peek.status() for state inspection
Bun.peek.status(resolved);  // "fulfilled"
Bun.peek.status(pending);   // "pending"
Bun.peek.status(Promise.reject());  // "rejected"
```

### `Bun.gzipSync()` / `Bun.gunzipSync()` - Compression

```typescript
// Compress data
const data = Buffer.from("hello world".repeat(100));
const compressed = Bun.gzipSync(data);
console.log(`${data.length} → ${compressed.length} bytes`);

// Decompress
const decompressed = Bun.gunzipSync(compressed);
decompressed.toString();  // "hello world" × 100

// With compression level (1-9, default 6)
Bun.gzipSync(data, { level: 9 });  // Max compression
Bun.gzipSync(data, { level: 1 });  // Fastest

// Also available: deflate/inflate
const deflated = Bun.deflateSync(data);
const inflated = Bun.inflateSync(deflated);
```

### `Bun.fileURLToPath()` / `Bun.pathToFileURL()` - URL Conversion

```typescript
// Convert file:// URL to path
Bun.fileURLToPath("file:///etc/hosts");
// "/etc/hosts"

Bun.fileURLToPath("file:///C:/Users/name/file.txt");
// "C:\\Users\\name\\file.txt" (Windows)

Bun.fileURLToPath(new URL("file:///tmp/data.json"));
// "/tmp/data.json"

// Convert path to file:// URL
Bun.pathToFileURL("/etc/hosts");
// URL { href: "file:///etc/hosts" }

Bun.pathToFileURL("./relative/path.txt");
// URL { href: "file:///current/dir/relative/path.txt" }

// Useful with import.meta.url
const dir = Bun.fileURLToPath(new URL(".", import.meta.url));
const configPath = Bun.fileURLToPath(new URL("./config.json", import.meta.url));
```

### `URLPattern` - Route Matching with RegExp (Bun 1.3.4+)

Standard web API for URL pattern matching with named groups and RegExp validation.

```typescript
// Basic pattern with named parameter
const pattern = new URLPattern("/api/users/:id", "http://localhost");
pattern.test("http://localhost/api/users/123");  // true
pattern.exec("http://localhost/api/users/123");
// { pathname: { groups: { id: "123" } }, ... }

// RegExp validation - ensure :id is numeric
const numericId = new URLPattern("/api/users/:id(\\d+)", "http://localhost");
numericId.test("http://localhost/api/users/123");   // true
numericId.test("http://localhost/api/users/abc");   // false
numericId.hasRegExpGroups;  // true

// Multiple params with validation
const blogPost = new URLPattern(
  "/blog/:year(\\d{4})/:month(\\d{2})/:slug([\\w-]+)",
  "http://localhost"
);

// Wildcard patterns
const apiRoutes = new URLPattern("/api/*", "http://localhost");
const optionalPath = new URLPattern("/files{/*}?", "http://localhost");

// Alternative patterns (OR)
const versions = new URLPattern("/api/v(1|2)/users/:id", "http://localhost");

// Query string matching
const search = new URLPattern("/search?q=:term", "http://localhost");

// Full URL matching (protocol, hostname, port)
const multiTenant = new URLPattern("https://:tenant.example.com/api/*");
```

**Pattern introspection:**
```typescript
const pattern = new URLPattern("/api/projects/:id(\\d+)", baseUrl);

pattern.hasRegExpGroups;  // true - has custom RegExp
pattern.pathname;         // "/api/projects/:id(\\d+)"
pattern.protocol;         // "http"
pattern.hostname;         // "localhost"

// Fast boolean check (faster than exec)
pattern.test(url);

// Full match with captured groups
const match = pattern.exec(url);
match.pathname.groups;  // { id: "123" }
```

**Router pattern:**
```typescript
const routes = {
  project: new URLPattern("/api/projects/:id([\\w-]+)", BASE_URL),
  projectAction: new URLPattern("/api/projects/:id([\\w-]+)/:action(open|git|sync)", BASE_URL),
  systemPort: new URLPattern("/api/system/port/:port(\\d+)", BASE_URL),
};

function matchRoute(url: string) {
  for (const [name, pattern] of Object.entries(routes)) {
    const match = pattern.exec(url);
    if (match) {
      return { route: name, params: match.pathname.groups };
    }
  }
  return null;
}

// Validate params after match
function validatePort(port: string): boolean {
  const n = parseInt(port, 10);
  return n >= 1 && n <= 65535;
}
```

**Route groups for middleware:**
```typescript
const groups = {
  api: new URLPattern("/api/*", BASE_URL),
  admin: new URLPattern("/api/admin/*", BASE_URL),
  debug: new URLPattern("/api/debug/*", BASE_URL),
};

function getRouteGroup(url: string) {
  for (const [name, pattern] of Object.entries(groups)) {
    if (pattern.test(url)) return name;
  }
  return null;
}

// Block debug routes in production
const group = getRouteGroup(req.url);
if (group === "debug" && !isDevelopment) {
  return new Response("Not found", { status: 404 });
}
```

**Note:** Relative patterns require a baseURL:
```typescript
// Works
new URLPattern("/api/users/:id", "http://localhost");

// Throws: "Relative constructor string must have baseURL"
new URLPattern("/api/users/:id");
```

### FFI - Foreign Function Interface

```typescript
import { dlopen, ptr, CString } from "bun:ffi";

const lib = dlopen("libexample.so", {
  add: { args: ["i32", "i32"], returns: "i32" },
  greet: { args: ["cstring"], returns: "cstring" },
});

lib.symbols.add(2, 3);  // 5
lib.symbols.greet(ptr(Buffer.from("World\0")));
```

---

## Test Runner (`bun test`)

### Quick Reference

| Feature | Pattern | Type | Property | Description |
|---------|---------|------|----------|-------------|
| Test | `test("name", () => {})` | `(name, fn, timeout?) => void` | `.skip` `.only` `.todo` `.if` `.each` | Define a test |
| Describe | `describe("group", () => {})` | `(name, fn) => void` | `.skip` `.only` `.if` `.each` | Group tests |
| Expect | `expect(val).toBe(x)` | `(val) => Matchers` | `.not` `.resolves` `.rejects` | Assertion |
| Async | `test("x", async () => {})` | `(name, fn) => Promise<void>` | — | Async test |
| Skip | `test.skip("x", () => {})` | `(name, fn?) => void` | — | Skip test |
| Todo | `test.todo("x")` | `(name) => void` | — | Placeholder |
| Only | `test.only("x", () => {})` | `(name, fn) => void` | — | Run only this |
| Conditional | `test.if(cond)("x", () => {})` | `(cond) => TestFn` | — | Run if true |
| Each | `test.each(table)("x", fn)` | `(table) => TestFn` | — | Parameterized |
| Timeout | `test("x", () => {}, 5000)` | `number` (3rd arg) | — | Custom timeout |
| Mock fn | `mock(() => val)` | `<T>(fn?: T) => Mock<T>` | `.mock.calls` `.mock.results` | Mock function |
| Spy | `spyOn(obj, "method")` | `(obj, key) => Mock` | `.mockImplementation` `.mockReturnValue` | Spy on method |
| Mock module | `mock.module("pkg", () => ({}))` | `(path, factory) => void` | — | Mock import |
| Snapshot | `expect(x).toMatchSnapshot()` | `() => void` | — | Snapshot test |
| Inline snap | `expect(x).toMatchInlineSnapshot()` | `(snap?) => void` | — | Inline snapshot |
| Time | `setSystemTime(new Date())` | `(date?) => void` | — | Mock clock |
| beforeAll | `beforeAll(() => {})` | `(fn) => void` | — | Before all tests |
| afterEach | `afterEach(() => {})` | `(fn) => void` | — | After each test |

### Basic Tests

```typescript
import { test, expect, describe, beforeAll, afterEach } from "bun:test";

describe("math", () => {
  test("addition", () => {
    expect(1 + 1).toBe(2);
  });

  test("async test", async () => {
    const result = await fetchData();
    expect(result).toEqual({ id: 1 });
  });

  test.skip("skipped test", () => {});
  test.todo("not implemented yet");
  test.if(process.platform === "darwin")("mac only", () => {});
});
```

### Lifecycle Hooks

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

beforeAll(() => {
  // Once before all tests in file
});

afterAll(() => {
  // Once after all tests in file
});

beforeEach(() => {
  // Before each test
});

afterEach(() => {
  // After each test
});
```

### Matchers

```typescript
// Equality
expect(value).toBe(exact);           // ===
expect(value).toEqual(deep);         // Deep equality
expect(value).toStrictEqual(deep);   // Deep + type equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(num).toBeGreaterThan(3);
expect(num).toBeGreaterThanOrEqual(3);
expect(num).toBeLessThan(5);
expect(num).toBeCloseTo(0.3, 5);     // Floating point

// Strings
expect(str).toMatch(/regex/);
expect(str).toContain("substring");
expect(str).toStartWith("prefix");
expect(str).toEndWith("suffix");

// Arrays/Iterables
expect(arr).toContain(item);
expect(arr).toHaveLength(3);
expect(arr).toContainEqual({ id: 1 });

// Objects
expect(obj).toHaveProperty("key");
expect(obj).toHaveProperty("key", value);
expect(obj).toMatchObject({ subset: true });

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow("message");
expect(() => fn()).toThrow(ErrorClass);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Negation
expect(value).not.toBe(other);
```

### Mocking

```typescript
import { mock, spyOn } from "bun:test";

// Mock function
const fn = mock((x: number) => x * 2);
fn(5);
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(1);
expect(fn).toHaveBeenCalledWith(5);
expect(fn.mock.calls).toEqual([[5]]);
expect(fn.mock.results[0].value).toBe(10);

// Spy on object method
const obj = { method: (x: number) => x + 1 };
const spy = spyOn(obj, "method");
obj.method(5);
expect(spy).toHaveBeenCalledWith(5);

// Mock implementation
spy.mockImplementation((x) => x * 10);
spy.mockReturnValue(42);
spy.mockResolvedValue(data);  // For async
spy.mockRejectedValue(error);

// Reset mocks
fn.mockClear();   // Clear call history
fn.mockReset();   // Clear + remove implementation
fn.mockRestore(); // Restore original
```

### Module Mocking

```typescript
import { mock } from "bun:test";

// Mock entire module
mock.module("./api", () => ({
  fetchUser: mock(() => ({ id: 1, name: "Test" })),
}));

// Mock node modules
mock.module("fs", () => ({
  readFileSync: mock(() => "mocked content"),
}));
```

### Snapshots

```typescript
import { expect } from "bun:test";

test("snapshot", () => {
  const data = { id: 1, name: "test", items: [1, 2, 3] };
  expect(data).toMatchSnapshot();
});

// Inline snapshot
test("inline snapshot", () => {
  expect({ a: 1 }).toMatchInlineSnapshot(`{ "a": 1 }`);
});

// Update snapshots: bun test --update-snapshots
```

### Mock Time/Date

```typescript
import { setSystemTime, mock } from "bun:test";

test("mock time", () => {
  // Set fixed time
  setSystemTime(new Date("2025-01-01T00:00:00Z"));
  expect(new Date().getFullYear()).toBe(2025);

  // Reset to real time
  setSystemTime();
});

// Mock timers
test("mock timers", () => {
  mock.setInterval(() => {}, 1000);
  // ...
});
```

### DOM Testing (happy-dom)

```typescript
// bunfig.toml
// [test]
// preload = ["happy-dom/global"]

import { test, expect } from "bun:test";

test("DOM", () => {
  document.body.innerHTML = `<button id="btn">Click</button>`;
  const btn = document.getElementById("btn");
  expect(btn?.textContent).toBe("Click");
});
```

### Code Coverage

```bash
# Generate coverage
bun test --coverage

# With threshold
bun test --coverage --coverage-threshold 80

# Coverage report formats
bun test --coverage-reporter=text
bun test --coverage-reporter=lcov
bun test --coverage-reporter=json
```

### Test Configuration (bunfig.toml)

```toml
[test]
# Preload scripts
preload = ["./setup.ts"]

# Test file patterns
include = ["**/*.test.ts", "**/*.spec.ts"]

# Coverage settings
coverage = true
coverageThreshold = 80
coverageReporter = ["text", "lcov"]

# Timeout per test (ms)
timeout = 5000

# Fail fast
bail = 1

# Parallel execution
jobs = 4
```

### CLI Options

```bash
bun test                     # Run all tests
bun test ./src               # Run tests in directory
bun test --watch             # Watch mode
bun test --bail              # Stop on first failure
bun test --timeout 10000     # 10s timeout
bun test --rerun-each 3      # Run each test 3 times
bun test --only              # Only run test.only()
bun test --todo              # Include test.todo()
bun test -t "pattern"        # Filter by test name
```

### References
- [Bun.inspect.table](https://bun.sh/docs/runtime/utils#bun-inspect-table)
- [Bun.stringWidth](https://bun.sh/docs/runtime/utils#bun-stringwidth)
- [Bun.deepEquals](https://bun.sh/docs/runtime/utils#bun-deepequals)
- [Bun.inspect.custom](https://bun.sh/docs/runtime/utils#bun-inspect-custom)
- [Bun.hash](https://bun.sh/docs/api/hashing)
- [Bun.color](https://bun.sh/docs/runtime/color)
- [Bun.JSONC](https://bun.sh/docs/runtime/jsonc)
- [Bun.Archive](https://bun.sh/docs/runtime/archive)
- [Bun.build](https://bun.sh/docs/bundler)
- [Bun.serve()](https://bun.sh/docs/api/http#start-a-server-bun-serve)
- [Response.json()](https://bun.sh/docs/api/http)
- [Plugins & Preload](https://bun.sh/docs/runtime/plugins)
- [bunfig.toml](https://bun.sh/docs/runtime/bunfig)
- [bun link](https://bun.sh/docs/cli/link)
- [Bun.file](https://bun.sh/docs/api/file-io)
- [Bun.$](https://bun.sh/docs/runtime/shell)
- [Bun.spawn](https://bun.sh/docs/api/spawn)
- [Bun.Glob](https://bun.sh/docs/api/glob)
- [Bun.password](https://bun.sh/docs/api/hashing#bun-password)
- [Bun.sleep](https://bun.sh/docs/api/utils#bun-sleep)
- [Bun.semver](https://bun.sh/docs/api/semver)
- [Bun.dns](https://bun.sh/docs/api/dns)
- [Bun.listen/connect](https://bun.sh/docs/api/tcp)
- [bun:sqlite](https://bun.sh/docs/api/sqlite)
- [Bun.redis](https://bun.sh/docs/api/redis)
- [Bun.s3](https://bun.sh/docs/api/s3)
- [HTMLRewriter](https://bun.sh/docs/api/html-rewriter)
- [Workers](https://bun.sh/docs/api/workers)
- [Bun.secrets](https://bun.sh/docs/api/secrets)
- [Bun.randomUUIDv7](https://bun.sh/docs/api/utils#bun-randomuuidv7)
- [Bun.peek](https://bun.sh/docs/api/utils#bun-peek)
- [Bun.gzipSync](https://bun.sh/docs/api/utils#bun-gzipsync)
- [Bun.fileURLToPath](https://bun.sh/docs/api/utils#bun-fileurltopath)
- [URLPattern](https://bun.sh/docs/api/urlpattern)
- [FFI](https://bun.sh/docs/api/ffi)
- [Test Runner](https://bun.sh/docs/cli/test)
- [Test Matchers](https://bun.sh/docs/test/writing)
- [Test Mocking](https://bun.sh/docs/test/mocks)
- [Test Snapshots](https://bun.sh/docs/test/snapshots)
- [Test Coverage](https://bun.sh/docs/test/coverage)
- [Test DOM](https://bun.sh/docs/test/dom)
- [Test Lifecycle](https://bun.sh/docs/test/lifecycle)
- [Bun v1.3.6 Release](https://bun.sh/blog/bun-v1.3.6)
