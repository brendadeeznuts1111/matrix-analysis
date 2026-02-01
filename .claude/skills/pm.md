---
name: pm
description: "Use when user wants to manage packages, run shell commands, spawn processes, or use Bun runtime APIs: add, remove, update, audit, publish, bunx, $shell, spawn, file I/O, inspect (with advanced patterns), and more"
user-invocable: true
version: 3.1.0
---

# Bun Package Manager (/pm)

Unified package management using Bun's native PM commands.

===============================================================================
                              QUICK REFERENCE
===============================================================================

  COMMAND                      DESCRIPTION
  ───────────────────────────────────────────────────────────────────────────
  add <pkg>                    Install package
  add -d <pkg>                 Install as devDependency
  add --optional <pkg>         Install as optionalDependency
  add --peer <pkg>             Install as peerDependency
  remove <pkg>                 Uninstall package
  update                       Update all packages
  update -i                    Interactive update mode
  update --latest              Update ignoring semver
  audit                        Check for security vulnerabilities
  outdated                     List outdated packages
  why <pkg>                    Explain why package is installed
  link                         Register/link local package
  patch <pkg>                  Patch node_modules package
  pm ls                        List dependencies
  pm ls --all                  List all (including transitive)
  pm bin                       Show bin directory path
  pm bin -g                    Show global bin path
  pm pack                      Create tarball
  pm cache rm                  Clear cache
  pm trust <pkg>               Trust package scripts
  pm version <type>            Bump version (patch/minor/major)
  pm pkg get <path>            Get package.json field
  pm pkg set <k>=<v>           Set package.json field
  pm whoami                    Show npm username
  pm migrate                   Migrate from npm/yarn/pnpm
  bunx <pkg>                   Execute package without installing
  publish                      Publish to registry

  ─── RUNTIME APIS ─────────────────────────────────────────────────────────
  $`command`                   Shell scripting (import { $ } from "bun")
  Bun.spawn(cmd)               Spawn subprocess
  Bun.spawnSync(cmd)           Spawn subprocess (sync)
  Bun.file(path)               Read file
  Bun.write(path, data)        Write file
  Bun.inspect(obj)             Pretty-print any value
  Bun.inspect.table(data)      Display data as table
  Bun.sleep(ms)                Async sleep
  Bun.which(bin)               Find executable path
  Bun.deepEquals(a, b)         Deep equality check
  Bun.escapeHTML(str)          Escape HTML entities
  Bun.stringWidth(str)         Unicode-aware string width

===============================================================================
                           INSTALLATION COMMANDS
===============================================================================

ADD PACKAGE
───────────
  bun add <package>                     # Production dependency
  bun add -d <package>                  # Dev dependency (--dev)
  bun add --optional <package>          # Optional dependency
  bun add --peer <package>              # Peer dependency
  bun add -E <package>                  # Exact version (--exact)
  bun add <package>@1.2.3               # Specific version
  bun add <package>@^3.0.0              # Version range
  bun add <package>@latest              # Latest tag
  bun add lodash dayjs zod              # Multiple packages
  bun add --only-missing <pkg>          # Only if not in package.json
  bun add --trust <pkg>                 # Trust and run lifecycle scripts

GIT DEPENDENCIES
────────────────
  bun add git@github.com:user/repo.git
  bun add git+https://github.com/user/repo.git
  bun add git+ssh://github.com/user/repo.git#v1.0.0
  bun add github:user/repo

TARBALL DEPENDENCIES
────────────────────
  bun add zod@https://registry.npmjs.org/zod/-/zod-3.21.4.tgz

GLOBAL INSTALLATION
───────────────────
  bun add -g <package>                  # Install globally
  bun add --global <package>

REMOVE PACKAGE
──────────────
  bun remove <package>
  bun remove lodash dayjs              # Multiple

===============================================================================
                             UPDATE COMMANDS
===============================================================================

BASIC UPDATE
────────────
  bun update                           # Update all
  bun update lodash                    # Update specific
  bun update --latest                  # Ignore semver constraints
  bun update --force                   # Force reinstall all
  bun update --dry-run                 # Preview changes

INTERACTIVE MODE
────────────────
  bun update -i                        # Interactive selection
  bun update --interactive
  bun update -i -r                     # Interactive + recursive (monorepo)

  Keyboard controls:
    Space       Toggle package selection
    Enter       Confirm and update
    a/A         Select all
    n/N         Select none
    i/I         Invert selection
    ↑/↓ or j/k  Navigate
    l/L         Toggle target/latest version
    Ctrl+C      Cancel

===============================================================================
                           INSPECTION COMMANDS
===============================================================================

LIST DEPENDENCIES
─────────────────
  bun pm ls                            # Direct dependencies
  bun pm ls --all                      # All (including transitive)
  bun list --all                       # Alias

OUTDATED PACKAGES
─────────────────
  bun outdated

BINARY PATHS
────────────
  bun pm bin                           # Local bin path
  bun pm bin -g                        # Global bin path

PACKAGE.JSON MANAGEMENT
───────────────────────
  bun pm pkg get                       # Entire package.json
  bun pm pkg get name                  # Single property
  bun pm pkg get name version          # Multiple properties
  bun pm pkg get scripts.build         # Nested (dot notation)
  bun pm pkg get contributors[0]       # Array access

  bun pm pkg set name="my-pkg"         # Set property
  bun pm pkg set version=2.0.0 license=MIT
  bun pm pkg set '{"private":true}' --json

  bun pm pkg delete description        # Delete property
  bun pm pkg delete scripts.test

  bun pm pkg fix                       # Auto-fix common issues

HASH INSPECTION
───────────────
  bun pm hash                          # Generate lockfile hash
  bun pm hash-string                   # Print hash string
  bun pm hash-print                    # Print stored hash

REGISTRY INFO
─────────────
  bun pm whoami                        # Print npm username

WHY (dependency explanation)
────────────────────────────
  bun why <package>                    # Show why package is installed
  bun why react                        # Single package
  bun why "@types/*"                   # Glob pattern
  bun why express --top                # Top-level deps only
  bun why express --depth 2            # Limit tree depth

===============================================================================
                           SECURITY AUDIT
===============================================================================

  bun audit                            # Check for vulnerabilities
  bun audit --audit-level=high         # Only high+ severity
  bun audit --prod                     # Production deps only
  bun audit --json                     # Raw JSON output
  bun audit --ignore CVE-2022-25883    # Ignore specific CVE

  Exit codes:
    0 = No vulnerabilities
    1 = Vulnerabilities found

===============================================================================
                           LINKING (local development)
===============================================================================

REGISTER A PACKAGE
──────────────────
  cd /path/to/my-lib
  bun link                             # Register as linkable

LINK INTO PROJECT
─────────────────
  cd /path/to/my-app
  bun link my-lib                      # Create symlink

PACKAGE.JSON SYNTAX
───────────────────
  "dependencies": {
    "my-lib": "link:my-lib"
  }

UNLINK
──────
  cd /path/to/my-lib
  bun unlink                           # Unregister package

===============================================================================
                           PATCHING (modify node_modules)
===============================================================================

PATCH WORKFLOW
──────────────
  bun patch <package>                  # 1. Prepare for patching
  # Edit files in node_modules/<package>/
  bun patch --commit <package>         # 2. Generate .patch file

EXAMPLES
────────
  bun patch react                      # Prepare react for patching
  bun patch react@17.0.2               # Specific version
  bun patch node_modules/react         # By path

  bun patch --commit react             # Commit changes
  bun patch --commit react --patches-dir=mypatches

Patches are stored in patches/ and auto-applied on bun install.

===============================================================================
                           VERSION MANAGEMENT
===============================================================================

  bun pm version                       # Show current version
  bun pm version patch                 # 1.0.0 → 1.0.1
  bun pm version minor                 # 1.0.0 → 1.1.0
  bun pm version major                 # 1.0.0 → 2.0.0
  bun pm version 1.2.3                 # Set specific version
  bun pm version from-git              # Use latest git tag

PRERELEASE VERSIONS
───────────────────
  bun pm version prerelease            # 1.0.0 → 1.0.1-0
  bun pm version prepatch              # 1.0.0 → 1.0.1-0
  bun pm version preminor              # 1.0.0 → 1.1.0-0
  bun pm version premajor              # 1.0.0 → 2.0.0-0
  bun pm version prerelease --preid beta   # 1.0.0 → 1.0.1-beta.0

VERSION FLAGS
─────────────
  --no-git-tag-version                 # Skip git operations
  --allow-same-version                 # Allow setting same version
  --message "Release %s"               # Custom commit message (-m)
  --preid <id>                         # Prerelease identifier
  --force                              # Bypass dirty git check (-f)

===============================================================================
                           WORKSPACE COMMANDS
===============================================================================

  bun pm ls --workspaces               # List workspaces
  bun --filter='*' run build           # Run in all workspaces
  bun --filter='api' run test          # Run in specific workspace
  bun --filter='@scope/*' run lint     # Run in scoped workspaces
  bun install --filter='web'           # Install for specific workspace

===============================================================================
                        TRUSTED DEPENDENCIES
===============================================================================

  bun pm untrusted                     # List untrusted with scripts
  bun pm trust <package>               # Trust specific package
  bun pm trust --all                   # Trust all untrusted
  bun pm default-trusted               # Show default trusted list
  bun add --trust <package>            # Add and trust in one step

===============================================================================
                              BUNX (npx equivalent)
===============================================================================

  bunx <package>                       # Auto-install and run
  bunx cowsay "Hello"
  bunx prettier foo.js
  bunx prisma migrate

VERSION SPECIFICATION
─────────────────────
  bunx uglify-js@3.14.0 app.js         # Specific version

PACKAGE FLAG (binary differs from package name)
───────────────────────────────────────────────
  bunx -p renovate renovate-config-validator
  bunx --package @angular/cli ng new my-app

FORCE BUN RUNTIME
─────────────────
  bunx --bun vite dev                  # Run with Bun, not Node

OTHER FLAGS
───────────
  bunx --no-install <pkg>              # Skip install if not present
  bunx --verbose <pkg>                 # Verbose output
  bunx --silent <pkg>                  # Suppress output

===============================================================================
                           PUBLISHING COMMANDS
===============================================================================

PACK
────
  bun pm pack                          # Create tarball
  bun pm pack --dry-run                # Preview without creating
  bun pm pack --destination ./dist     # Custom output directory
  bun pm pack --filename my-pkg.tgz    # Custom filename
  bun pm pack --gzip-level 6           # Compression level (0-9)
  bun pm pack --ignore-scripts         # Skip pre/postpack scripts
  bun pm pack --quiet                  # Only output filename

PUBLISH
───────
  bun publish                          # Publish to registry
  bun publish --tag beta               # Publish with tag
  bun publish --access public          # Public scoped package
  bun publish --access restricted      # Private scoped package
  bun publish --dry-run                # Preview publish
  bun publish --otp 123456             # With 2FA code

===============================================================================
                           CACHE MANAGEMENT
===============================================================================

  bun pm cache                         # Show cache location
  bun pm cache rm                      # Clear global cache
  bun install --prefer-offline         # Use cache only
  bun install --no-cache               # Ignore cache entirely

===============================================================================
                           LOCKFILE COMMANDS
===============================================================================

  bun install                          # Generate/update lockfile
  bun install --frozen-lockfile        # Disallow changes (CI mode)
  bun install --lockfile-only          # Generate without installing
  bun install --save-text-lockfile     # Text-based lockfile
  bun install --no-save                # Don't update lockfile
  bun pm migrate                       # Migrate from npm/yarn/pnpm

===============================================================================
                          NETWORK & REGISTRY
===============================================================================

CLI FLAGS
─────────
  --registry <url>                     # Use specific registry
  --network-concurrency <n>            # Max concurrent requests (default: 48)
  --ca <cert>                          # CA signing certificate
  --cafile <path>                      # CA certificate file path

===============================================================================
                       REGISTRY CONFIGURATION (bunfig.toml)
===============================================================================

DEFAULT REGISTRY
────────────────
  [install]
  registry = "https://registry.npmjs.org"

  # With token
  [install]
  registry = { url = "https://registry.npmjs.org", token = "123456" }

  # With username/password
  [install]
  registry = "https://username:password@registry.npmjs.org"

SCOPED REGISTRIES (private packages)
────────────────────────────────────
  [install.scopes]
  # Basic auth
  "@myorg" = "https://username:password@registry.myorg.com/"

  # With environment variables
  "@myorg" = { username = "myuser", password = "$NPM_PASS", url = "https://registry.myorg.com/" }

  # With token
  "@myorg" = { token = "$NPM_TOKEN", url = "https://registry.myorg.com/" }

NPMRC SUPPORT
─────────────
  Bun reads .npmrc files automatically. Supported:
  - //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  - @myorg:registry=https://registry.myorg.com/
  - registry=https://registry.npmjs.org/

===============================================================================
                       BUN.INSPECT() - DEBUGGING & LOGGING
===============================================================================

BASIC USAGE
───────────
  Bun.inspect(value)                   # Pretty-print any value
  Bun.inspect(obj, { depth: 3 })       # Limit nesting depth
  Bun.inspect(obj, { colors: true })   # Force ANSI colors
  Bun.inspect(obj, { compact: true })  # Minimize whitespace

FULL OPTIONS
────────────
  Bun.inspect(value, {
    depth: number,              // Max nesting depth (default: Infinity)
    colors: boolean,            // ANSI colors (auto if TTY)
    compact: boolean,           // Dense output (true) or pretty (false)
    sorted: boolean | fn,       // Sort object keys
    showHidden: boolean,        // Include non-enumerable properties
    maxArrayLength: number,     // Truncate arrays after N items
    maxStringLength: number,    // Truncate strings after N chars
    breakLength: number,        // Line wrap threshold (default: 80)
    trailingComma: boolean,     // Add trailing commas
    customInspect: boolean      // Honor [Bun.inspect.custom] (default: true)
  })

EXAMPLES
────────
  # Structured logging
  console.log(Bun.inspect(data, { depth: 3, colors: Bun.isTTY }))

  # Safe inspection of untrusted data
  Bun.inspect(obj, { depth: 4, maxArrayLength: 50, maxStringLength: 1000 })

  # Snapshot testing (normalized output)
  Bun.inspect(obj, { colors: false, sorted: true, compact: false })

===============================================================================
                       BUN.INSPECT.CUSTOM - CUSTOM FORMATTERS
===============================================================================

DEFINE CUSTOM INSPECT
─────────────────────
  class MyClass {
    constructor(public name: string, public value: number) {}

    [Symbol.for("Bun.inspect.custom")]() {
      return `<MyClass name="${this.name}" value=${this.value}>`;
    }
  }

  console.log(new MyClass("test", 42));
  // Output: <MyClass name="test" value=42>

CONDITIONAL OUTPUT (TTY vs logs)
────────────────────────────────
  [Symbol.for("Bun.inspect.custom")]() {
    if (!Bun.isTTY || process.env.NODE_ENV === "production") {
      return `<CacheEntry key="${this.key}">`;  // Compact for logs
    }
    return `📦 CacheEntry {\n` +
           `  key: "${this.key}",\n` +
           `  value: ${Bun.inspect(this.value, { depth: 1 })}\n}`;
  }

WITH COLORS
───────────
  [Symbol.for("Bun.inspect.custom")]() {
    const color = this.active ? "\x1b[32m" : "\x1b[31m";  // green/red
    const reset = "\x1b[0m";
    return `${color}●${reset} ${this.name}`;
  }

===============================================================================
                       BUN.INSPECT.TABLE() - TABULAR DATA
===============================================================================

BASIC TABLE
───────────
  const data = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 }
  ];
  console.log(Bun.inspect.table(data));

  ┌───────┬─────┐
  │ name  │ age │
  ├───────┼─────┤
  │ Alice │ 30  │
  │ Bob   │ 25  │
  └───────┴─────┘

SELECT COLUMNS
──────────────
  Bun.inspect.table(data, ["name"])    # Only show 'name' column

TABLE OPTIONS
─────────────
  Bun.inspect.table(data, columns, {
    indent: string,           // Prefix each line (default: "")
    newline: string,          // Line separator (default: "\n")
    maxColumns: number,       // Hide columns beyond this
    maxRows: number,          // Truncate after N rows
    headerColor: string       // ANSI code for header row
  })

DYNAMIC COLUMN SELECTION
────────────────────────
  const columns = Object.keys(data[0]).filter(k =>
    typeof data[0][k] !== "function" && typeof data[0][k] !== "object"
  );
  console.log(Bun.inspect.table(data, columns, { maxRows: 20 }));

===============================================================================
                       INSPECT PERFORMANCE TIPS
===============================================================================

  ISSUE                        MITIGATION
  ───────────────────────────────────────────────────────────────────────────
  Deep inspection (large obj)  Set depth: 3, maxArrayLength: 100
  Recursive custom inspect     Guard with depth counter, avoid recursion
  ANSI in non-TTY output       Use colors: Bun.isTTY
  Table with 10k+ rows         Always set maxRows: 100 in CLI tools
  Log file corruption          Disable colors in production logs

===============================================================================
                    ADVANCED BUN.INSPECT PATTERNS
===============================================================================

CONDITIONAL OUTPUT (TTY vs Production)
──────────────────────────────────────
  class CacheEntry {
    constructor(public key: string, public value: any, public ttl: number) {}

    [Symbol.for("Bun.inspect.custom")]() {
      const expired = Date.now() > this.ttl;

      // Compact in production/logs, rich in REPL
      if (!Bun.isTTY || process.env.NODE_ENV === "production") {
        return `<CacheEntry key="${this.key}"${expired ? " EXPIRED" : ""}>`;
      }

      // Rich output for terminal
      const color = expired ? "\x1b[90m" : "\x1b[36m";  // gray vs cyan
      return `${color}CacheEntry\x1b[0m {
    key: "${this.key}",
    value: ${Bun.inspect(this.value, { depth: 1, colors: true })},
    expires: ${new Date(this.ttl).toISOString()}${expired ? " EXPIRED" : ""}
  }`;
    }
  }

DEPTH GUARDS (prevent infinite recursion)
─────────────────────────────────────────
  class TreeNode {
    children: TreeNode[] = [];
    static inspectDepth = 0;

    [Symbol.for("Bun.inspect.custom")]() {
      if (TreeNode.inspectDepth > 3) return "[TreeNode ...]";
      TreeNode.inspectDepth++;
      const result = `TreeNode { children: [${this.children.length}] }`;
      TreeNode.inspectDepth--;
      return result;
    }
  }

ANSI COLOR HELPERS
──────────────────
  const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    bold: "\x1b[1m",
    dim: "\x1b[2m"
  };

  // Usage in custom inspect
  [Symbol.for("Bun.inspect.custom")]() {
    const c = Bun.isTTY ? COLORS : { reset: "", green: "", red: "" };
    return `${c.green}●${c.reset} ${this.name} (${this.status})`;
  }

STRINGWIDTH ALIGNMENT (unicode-aware padding)
─────────────────────────────────────────────
  [Symbol.for("Bun.inspect.custom")]() {
    const label = `📡 ${this.name}`;
    const width = Bun.stringWidth(label);          // Handles emoji/CJK
    const padded = label + " ".repeat(Math.max(0, 25 - width));
    return `${padded}${this.connected ? "🟢" : "🔴"} ${this.host}:${this.port}`;
  }

TYPESCRIPT DECLARATIONS
───────────────────────
  // types/inspect.d.ts
  declare global {
    interface Inspectable {
      [Symbol.for("Bun.inspect.custom")](): string;
    }
  }

  // Type-safe usage
  function logItem(item: Inspectable) {
    console.log(item);  // Guaranteed custom formatter
  }

===============================================================================
                    BUN.INSPECT INTEGRATIONS
===============================================================================

WITH ZOD VALIDATION ERRORS
──────────────────────────
  import { z } from "zod";

  const UserSchema = z.object({ name: z.string(), age: z.number() });

  try {
    UserSchema.parse({ name: 123, age: "invalid" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("Validation failed:\n" +
        Bun.inspect(err.issues, { depth: 2, colors: true }));
    }
  }

WITH BUN.SERVE DEBUG MODE
─────────────────────────
  const DEBUG = process.env.DEBUG === "true";

  Bun.serve({
    fetch(req) {
      if (DEBUG) {
        console.log(Bun.inspect({
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers),
          timestamp: new Date().toISOString()
        }, { depth: 2, colors: Bun.isTTY }));
      }
      return new Response("OK");
    }
  });

WITH WEBSOCKET STREAMING
────────────────────────
  Bun.serve({
    fetch(req, server) {
      if (req.url.endsWith("/inspect-stream")) {
        server.upgrade(req);
        return;
      }
      return new Response("Not found", { status: 404 });
    },
    websocket: {
      open(ws) {
        ws.send(Bun.inspect({ connected: true }, { colors: false }));
      },
      message(ws, msg) {
        const data = JSON.parse(msg);
        ws.send(Bun.inspect(data, { depth: 3, colors: false }));
      }
    }
  });

WITH SQLITE LOGGING
───────────────────
  import { Database } from "bun:sqlite";

  const db = new Database("audit.db");
  db.run("CREATE TABLE IF NOT EXISTS logs (ts TEXT, data TEXT)");

  function auditLog(obj: any) {
    const inspected = Bun.inspect(obj, { colors: false, depth: 5 });
    db.run("INSERT INTO logs VALUES (?, ?)", [
      new Date().toISOString(),
      inspected
    ]);
  }

===============================================================================
                    INSPECT UTILITY HELPERS
===============================================================================

HELPER LIBRARY
──────────────
  // lib/inspect-utils.ts

  /** Compact single-line output */
  export function inspectCompact(obj: any): string {
    return Bun.inspect(obj, { compact: true, colors: false });
  }

  /** Safe for log files (no ANSI, truncated) */
  export function inspectForLog(obj: any): string {
    return Bun.inspect(obj, {
      colors: false,
      depth: 4,
      maxArrayLength: 20,
      maxStringLength: 500
    });
  }

  /** Type guard for inspectable objects */
  export function isInspectable(obj: any): obj is { [Symbol.for("Bun.inspect.custom")](): string } {
    return obj && typeof obj[Symbol.for("Bun.inspect.custom")] === "function";
  }

  /** Compare and format differences */
  export function inspectDiff(a: any, b: any): string {
    const equals = Bun.deepEquals(a, b);
    if (equals) return "Objects are equal";
    return `A: ${inspectCompact(a)}\nB: ${inspectCompact(b)}`;
  }

  /** Peek promise state without await */
  export function inspectPromise(p: Promise<any>): string {
    const status = Bun.peek.status(p);
    const value = status === "fulfilled" ? p : null;
    return `Promise<${status}>${value ? `: ${inspectCompact(value)}` : ""}`;
  }

CLI EXPLORER PATTERN
────────────────────
  // cli.ts
  const data = await loadData();

  if (process.argv.includes("--table")) {
    console.log(Bun.inspect.table(data));
  } else if (process.argv.includes("--compact")) {
    console.log(Bun.inspect(data));
  } else {
    console.log(Bun.inspect(data, { depth: 3, colors: Bun.isTTY }));
  }

SNAPSHOT TESTING
────────────────
  function normalizeInspect(obj: any): string {
    return Bun.inspect(obj, {
      colors: false,
      sorted: true,
      depth: 5,
      compact: false
    }).replace(/\s+/g, " ");  // Normalize whitespace
  }

  // In test:
  expect(normalizeInspect(result)).toBe(normalizeInspect(expected));

===============================================================================
                       BUN SHELL ($) - SCRIPTING API
===============================================================================

BASIC USAGE
───────────
  import { $ } from "bun";

  await $`echo hello`;                 # Run command
  const result = await $`ls -la`;      # Capture output
  console.log(result.text());          # Get as string

OUTPUT METHODS
──────────────
  result.text()                        # stdout as string
  result.json()                        # Parse stdout as JSON
  result.lines()                       # stdout as string[]
  result.bytes()                       # stdout as Uint8Array
  result.blob()                        # stdout as Blob
  result.exitCode                      # Exit code (0 = success)

PIPING
──────
  await $`cat file.txt | grep pattern | wc -l`;
  await $`echo ${data} | jq .name`;

ENVIRONMENT VARIABLES
─────────────────────
  await $`echo $HOME`;                 # Use shell vars
  await $`MY_VAR=value command`;       # Set inline
  $.env({ NODE_ENV: "production" });   # Set for all commands

ERROR HANDLING
──────────────
  const result = await $`exit 1`.nothrow();  # Don't throw on non-zero
  if (result.exitCode !== 0) {
    console.error(result.stderr.toString());
  }

QUIET MODE
──────────
  await $`command`.quiet();            # Suppress stdout/stderr

WORKING DIRECTORY
─────────────────
  await $`pwd`.cwd("/tmp");            # Run in specific directory
  $.cwd("/project");                   # Set default cwd

===============================================================================
                       BUN.SPAWN() - PROCESS SPAWNING
===============================================================================

BASIC SPAWN
───────────
  const proc = Bun.spawn(["echo", "hello"]);
  await proc.exited;                   # Wait for exit
  console.log(proc.exitCode);          # 0

WITH OPTIONS
────────────
  const proc = Bun.spawn(["node", "script.js"], {
    cwd: "/path/to/dir",
    env: { NODE_ENV: "production" },
    stdin: "pipe",                     # "pipe" | "inherit" | null | Blob
    stdout: "pipe",                    # "pipe" | "inherit" | null | Blob
    stderr: "pipe",                    # "pipe" | "inherit" | null | Blob
  });

READING OUTPUT
──────────────
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

WRITING TO STDIN
────────────────
  const proc = Bun.spawn(["cat"], { stdin: "pipe" });
  proc.stdin.write("hello");
  proc.stdin.end();

SYNCHRONOUS SPAWN
─────────────────
  const result = Bun.spawnSync(["echo", "hello"]);
  console.log(result.stdout.toString());  # "hello\n"
  console.log(result.exitCode);           # 0

===============================================================================
                       BUN UTILITIES - COMMON APIS
===============================================================================

SLEEP
─────
  await Bun.sleep(1000);               # Async sleep (ms)
  Bun.sleepSync(1000);                 # Sync sleep (ms)

WHICH (find executable)
───────────────────────
  const path = Bun.which("node");      # "/usr/local/bin/node"
  const path = Bun.which("notfound");  # null

DEEP EQUALS
───────────
  Bun.deepEquals(obj1, obj2);          # true/false
  Bun.deepEquals([1, 2], [1, 2]);  # true

ESCAPE HTML
───────────
  Bun.escapeHTML("<script>alert('xss')</script>");
  // "&lt;script&gt;alert('xss')&lt;/script&gt;"

STRING WIDTH (unicode-aware)
────────────────────────────
  Bun.stringWidth("hello");            # 5
  Bun.stringWidth("你好");              # 4 (2 per CJK char)
  Bun.stringWidth("👋");               # 2 (emoji width)

VERSION INFO
────────────
  Bun.version                          # "1.0.0"
  Bun.revision                         # Git commit hash

OPEN IN EDITOR
──────────────
  Bun.openInEditor("/path/to/file.ts");
  Bun.openInEditor("/path/to/file.ts", { line: 10, column: 5 });

PEEK (check promise state)
──────────────────────────
  const promise = fetch("https://...");
  promise;                   # Promise state without awaiting
  Bun.peek.status(promise);            # "pending" | "fulfilled" | "rejected"

NANOSECONDS
───────────
  Bun.nanoseconds();                   # High-resolution timestamp

ENVIRONMENT
───────────
  Bun.env.NODE_ENV                     # Read env var
  Bun.env.MY_VAR = "value";            # Set env var

TTY CHECK
─────────
  Bun.isTTY                            # true if terminal (for colors)

===============================================================================
                       BUN FILE I/O - QUICK REFERENCE
===============================================================================

READ FILE
─────────
  const file = Bun.file("path/to/file");
  await file.text();                   # As string
  await file.json();                   # As parsed JSON
  await file.arrayBuffer();            # As ArrayBuffer
  await file.stream();                 # As ReadableStream
  file.size                            # File size in bytes
  file.type                            # MIME type

WRITE FILE
──────────
  await Bun.write("output.txt", "content");
  await Bun.write("output.json", JSON.stringify(data));
  await Bun.write("output.txt", Bun.file("input.txt"));  # Copy

CHECK EXISTS
────────────
  const file = Bun.file("path");
  await file.exists();                 # true/false

===============================================================================
                            BEST PRACTICES
===============================================================================

  1. Use exact versions in production:  bun add -E <pkg>
  2. Frozen lockfile in CI:             BUN_FROZEN_LOCKFILE=1 bun install
  3. Interactive updates:               bun update -i
  4. Prefer offline for speed:          bun install --prefer-offline
  5. Clean cache if issues:             bun pm cache rm
  6. Check outdated regularly:          bun outdated
  7. Security audit before deploy:      bun audit
  8. Trust deps explicitly:             bun add --trust <pkg>
  9. Migrate from npm/yarn:             bun pm migrate
  10. Debug dependency issues:          bun why <pkg>

===============================================================================
                             COMMON ISSUES
===============================================================================

  ISSUE                  CAUSE                 FIX
  ───────────────────────────────────────────────────────────────────────────
  ENOENT on install      Missing package       Check package name spelling
  Peer dep warnings      Missing peer deps     bun add --peer <dep>
  Lockfile conflict      Multiple installs     Delete bun.lockb, reinstall
  Cache corruption       Bad cache state       bun pm cache rm
  Registry auth fail     Bad token             Check $BUN_REGISTRY_TOKEN
  Scripts not running    Untrusted package     bun pm trust <pkg>
  Wrong runtime          Node shebang          bunx --bun <pkg>
  Audit needs lockfile   No bun.lock           Run bun install first
  Patch not applying     Missing patches/      Check patches directory exists
  Link not found         Not registered        Run bun link in package dir first

===============================================================================
                          ENVIRONMENT VARIABLES
===============================================================================

  BUN_FROZEN_LOCKFILE=1                # Force frozen lockfile
  BUN_REGISTRY_TOKEN=<token>           # Registry auth token
  BUN_CONFIG_NO_VERIFY=1               # Skip integrity verification

===============================================================================
