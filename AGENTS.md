# AGENTS.md

> **Agent-Focused Documentation** for the Nolarose MCP Config Workspace

## Project Overview

This is a comprehensive **Bun-native development workspace** featuring:

- **Matrix Analysis Platform** - 197-column URLPattern performance analysis with compile-time caching
- **Environment Profile Management** - Secure profile system for managing development environments
- **Matrix Agent** - AI agent management system (migrated from clawdbot) with Telegram integration
- **Skills Registry** - Secure credential management using OS keychain integration (`Bun.secrets`)
- **Dev HQ CLI** - Development intelligence platform with feature flags, device management, and templates
- **MCP Server Ecosystem** - Model Context Protocol configuration for AI assistant integrations

**Repository:** `nolarose-mcp-config`  
**Runtime:** Bun 1.3.6+  
**License:** MIT

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Runtime | Bun | >= 1.3.6 | JavaScript/TypeScript execution |
| Language | TypeScript | 5.7+ | Type safety |
| Protocol | MCP (Model Context Protocol) | latest | AI assistant integration |
| Secrets | Bun.secrets | native | OS keychain integration |
| Auth | Bun.password | native | Argon2id password hashing |
| Testing | bun:test | native | Test runner |
| Tables | Bun.inspect.table() | native | Terminal output |

### Key Bun APIs Used

| API | Purpose | Performance |
|-----|---------|-------------|
| `Bun.peek()` | Sync promise inspection | 0-copy |
| `Bun.color()` | HSL/RGB/Hex conversion | Native |
| `Bun.hash.crc32()` | Hardware-accelerated hash | ~9 GB/s |
| `Bun.dns.prefetch()` | DNS cache warming | 150x faster |
| `Bun.nanoseconds()` | High-resolution timing | Native |
| `Bun.secrets.get/set()` | OS keychain access | Native |
| `Bun.password.hash()` | Argon2id hashing | ~3ms |
| `URLPattern` | Route matching | JIT compiled |

---

## Project Structure

```
/
├── src/                          # Main source code
│   ├── cli.ts                    # CLI entry point
│   ├── commands/                 # Profile management commands
│   │   ├── profileCreate.ts
│   │   ├── profileDiff.ts
│   │   ├── profileExport.ts
│   │   ├── profileList.ts
│   │   ├── profileShow.ts
│   │   └── profileUse.ts
│   ├── lib/                      # Shared utilities
│   │   ├── output.ts
│   │   ├── profileLoader.ts
│   │   └── validators.ts
│   └── __tests__/                # Unit tests
│
├── .claude/                      # Claude-specific code (examples allowed in git)
│   ├── examples/enterprise/      # Demo scripts and examples
│   ├── scripts/                  # Utility scripts (1200+ files)
│   ├── core/                     # Core library modules
│   │   ├── terminal/             # Profile-Terminal Binding Manager
│   │   │   ├── ProfileTerminalBindingManager.ts  # Main manager
│   │   │   ├── cli.ts            # CLI interface
│   │   │   └── index.ts          # Module exports
│   │   ├── session/              # Session management
│   │   ├── rss/                  # RSS feed integration
│   │   └── shared/               # Shared utilities
│   ├── apps/                     # Application builds
│   ├── matrix/                   # Matrix analysis modules
│   └── packages/                 # Monorepo packages
│
├── skills/                       # Skills registry & Dev HQ CLI
│   ├── server/                   # Secure API servers
│   ├── scripts/                  # Setup scripts
│   ├── docs/                     # Documentation
│   └── r2+bun-production-stack-dashboardv1.02.21/  # Dashboard app
│
├── tools/                        # Standalone tools
│   ├── arm64/                    # ARM64 optimization toolkit
│   │   ├── guardian.ts           # ARM64 utility library
│   │   ├── wrap-migrator.ts      # AST migration CLI
│   │   ├── verify-arm64.ts       # Binary ARM64 verifier
│   │   ├── benchmark-arm64.ts    # Benchmark suite
│   │   └── arm64-demo.ts         # Interactive demo
│   └── bun-search.ts             # NPM registry search CLI
│
├── examples/                     # Bun feature demos
│   ├── bun-terminal-demo.ts      # PTY automation
│   ├── compile-time-flags-demo.ts # Feature detection
│   └── s3-content-disposition-demo.ts # S3 demo
│
├── docs/                         # Project documentation
│   ├── ROADMAP.md                # Development roadmap
│   └── release-notes.md          # Release notes
│
├── .matrix/                      # Matrix Agent (migrated from clawdbot)
│   ├── agent/
│   │   └── config.json           # Agent configuration
│   ├── logs/                     # Agent logs
│   ├── scripts/
│   │   └── health-check.ts       # Health monitoring
│   └── matrix-agent.ts           # Main agent CLI
│
├── .claude.json                  # Claude Code configuration
├── .mcp.json                     # MCP server definitions
├── bunfig.toml                   # Bun configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

---

## Build and Test Commands

### Core Scripts

```bash
# Run the main 30-column matrix analysis
bun run matrix

# Profile management
bun run matrix:profile:use <name>      # Activate environment profile
bun run matrix:profile:list            # List available profiles
bun run matrix:profile:show <name>     # Show profile details
bun run matrix:profile:diff <a> <b>    # Compare two profiles
bun run matrix:profile:create <name>   # Create new profile

# Profile-Terminal Binding Manager (Tier-1380)
bun run terminal:init                  # Initialize binding manager
bun run terminal:status                # Display current status
bun run terminal:bind <profile>        # Bind current directory to profile
bun run terminal:unbind [path]         # Remove project binding
bun run terminal:switch <profile>      # Switch to different profile
bun run terminal:matrix                # Generate profile matrix
bun run terminal:broadcast             # Broadcast matrix to RSS/MCP
bun run terminal:list                  # List available profiles

# Tier-1380 CLI (color | colors | terminal | dashboard)
bun run tier1380 -- color init --team=<name> --profile=<name>    # Initialize color system
bun run tier1380 -- color generate --wcag=aa --formats=all       # Enterprise palette
bun run tier1380 -- color deploy --env=production --scale=3       # Deploy to production
bun run tier1380 -- color metrics --team=<name> --live            # Monitor metrics
bun run tier1380 -- colors deploy <team> --profile <name>         # Deploy colors for team
bun run tier1380 -- terminal <team> <profile>                      # Launch colored terminal banner
bun run tier1380 -- dashboard --team=<name> --profile=<name>      # Open metrics dashboard (localhost:3001)

# Bun docs (mcp-bun-docs)
bun run docs:search -- "<query>"       # Search Bun docs (markdown)
bun run docs:entry -- <term> [--url]   # Curated entry (JSON or URL)
bun run docs:link -- [key]             # Reference URL or list keys
bun run docs:terms -- --count=N        # List curated terms (optional limit)
bun run docs:globals                   # Bun globals + API doc URL
bun run docs:xrefs -- <term>           # Cross-references for term
bun run docs:feedback                  # Upgrade-first / issue reporting
bun run docs:shop                      # Official Bun shop URL
bun run docs:blog                      # Bun blog URL
bun run docs:guides                    # Bun guides index URL
bun run docs:rss                       # Changelog + blog RSS URLs
bun run docs:repo                      # oven-sh/bun repo + releases
bun run docs:deps                      # Package manager + add dependency
bun run docs:compat                     # Node.js compatibility doc
bun run docs:reference                   # Bun reference (modules) index
bun run bun-docs                        # CLI help

# Shortcuts
bun run tbind <profile>                # Shortcut for terminal:bind
bun run tstatus                        # Shortcut for terminal:status
bun run tmatrix                        # Shortcut for terminal:matrix
bun run tbroadcast                     # Shortcut for terminal:broadcast
bun run t1380                          # Shortcut for tier1380

# Enterprise CLI tools
bun run bytes                          # Byte analysis CLI
bun run jsonl                          # JSONL processing CLI
bun run routes                         # Route analysis CLI

# Shortcuts
bun run m                              # matrix:cli
bun run b                              # bytes
bun run j                              # jsonl
bun run r                              # routes
```

### Testing

```bash
# Run all tests
bun test

# Quiet output (AI-friendly)
CLAUDECODE=1 bun test

# Exit on first failure with timeout
bun test --bail --timeout=5000
```

### Migration

```bash
# Run wrap-ansi migration
bun run migrate
bun run migrate:dry       # Dry run
bun run migrate:verbose   # Verbose output
```

### Benchmarks

```bash
# ARM64 benchmarks
bun run benchmark
bun run benchmark:output

# Tier-1380 color (palette generation benchmark)
bun run tier1380:bench   # color generate --wcag=aa --formats=all

# Spawn performance monitoring
bun run spawn:monitor    # Full validation + benchmark
bun run spawn:check      # Quick system check
bun run spawn:bench      # Extended benchmark (500 iterations)

# Verification
bun run verify:arm64

# Demo
bun run demo
```

### MCP Servers

```bash
# Inspect MCP servers
bun run mcp:inspector

# Run RSS MCP server
bun run mcp:rss
```

---

## Code Style Guidelines

### Syntax Conventions

| Element | Style | Example |
|---------|-------|---------|
| Variables | camelCase | `myVariable` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types | PascalCase | `UserProfile` |
| Strings | Double quotes | `"hello"` |
| Semicolons | Required | `const x = 1;` |

### Console Output

**NEVER use markdown tables in console output.** Use `Bun.inspect.table()` instead:

```typescript
// ✅ Correct
console.log(Bun.inspect.table(data));
console.log(Bun.inspect.table(data, ["col1", "col2"]));
console.log(Bun.inspect.table(data, ["col1", "col2"], { colors: true }));

// ❌ Incorrect - don't use markdown tables in CLI output
```

### Error Handling

Return `null` or default values instead of throwing:

```typescript
// ✅ Correct
const result = await fetch(url).catch(() => null);
if (!result) return defaultValue;

// ❌ Avoid throwing for non-critical errors
```

### Exit Codes

```typescript
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Commits

Use conventional commits with co-author attribution:

```
feat(matrix): add DNS prefetch optimization

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Testing Instructions

### Test Structure

Tests use `bun:test` with `describe` and `it()` (not `test()`):

```typescript
import { describe, it, expect, mock, spyOn } from "bun:test";

describe("feature", () => {
  it("should work correctly", async () => {
    expect(value).toBe(expected);
    await expect(promise).resolves.toBe(value);
    expect(() => fn()).toThrow();
  });
});
```

### Mocking

```typescript
const fn = mock(() => value);
spyOn(obj, "method").mockReturnValue(42);
```

### Test Files Location

- `src/__tests__/*.test.ts` - Unit tests for src/
- `.claude/core/*.test.ts` - Core module tests
- `.claude/scripts/dashboard/*.test.ts` - Dashboard tests

---

## Security Considerations

### Credential Management

- **NEVER** commit credentials to git
- Use `Bun.secrets` for all sensitive data (stored in OS keychain)
- Use UTI-style service names: `com.company.app`

```typescript
const SERVICE = "com.mycompany.myapp";
await Bun.secrets.set({ service: SERVICE, name: "token", value: "xxx" });
const token = await Bun.secrets.get({ service: SERVICE, name: "token" });
```

### Security Headers

All API responses should include:

```typescript
new Response(JSON.stringify(data), {
  headers: {
    "Content-Security-Policy": "default-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
});
```

### Input Validation

Always validate URLPattern inputs for security vectors:

```typescript
// Check for path traversal
if (pattern.includes("../")) return { error: "Path traversal detected" };

// Check for SSRF
if (hostname?.match(/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2|3)/))
  return { error: "SSRF risk detected" };
```

---

## MCP Server Configuration

The project uses multiple MCP servers defined in `.mcp.json`:

| Server | Purpose | Environment Variables |
|--------|---------|----------------------|
| `bun` | Bun runtime integration | `DISABLE_NOTIFICATIONS=true` |
| `context7` | Documentation search | - |
| `filesystem` | File system access | - |
| `sequential-thinking` | Problem-solving | - |
| `puppeteer` | Browser automation | `HEADLESS=true` |
| `rss` | RSS feed reader | `RSS_MAX_ITEMS=50`, `RSS_CACHE_TTL=300` |
| `github` | GitHub integration | `GITHUB_PERSONAL_ACCESS_TOKEN` |

---

## Profile Management

Profiles are stored in `~/.matrix/profiles/*.json`:

```json
{
  "name": "dev",
  "version": "1.0.0",
  "created": "2026-01-29T20:00:00Z",
  "author": "user",
  "description": "Development environment",
  "environment": "development",
  "env": {
    "NODE_ENV": "development",
    "API_URL": "http://localhost:3000"
  }
}
```

### Variable Resolution

Profiles support `${VAR}` references that are resolved at activation time:

```typescript
// Profile env
{ "DATABASE_URL": "postgres://${DB_USER}:${DB_PASS}@localhost/db" }

// After resolution (with DB_USER=admin, DB_PASS=secret)
{ "DATABASE_URL": "postgres://admin:secret@localhost/db" }
```

---

## Profile-Terminal Binding Manager (Tier-1380)

The ProfileTerminalBindingManager provides advanced profile and terminal management with per-project, per-path session handling.

### Features

- **Per-Project Profile Binding** - Automatically activate profiles based on project directory
- **Per-Path Session Management** - Track and manage terminal sessions by working directory
- **Terminal Lifecycle Management** - Register, activate, and cleanup terminal sessions
- **RSS Feed Integration** - Publish matrix updates to RSS feeds for dashboard consumption
- **MCP Server Notifications** - Real-time notifications via MCP protocol

### Usage

```typescript
import { ProfileTerminalBindingManager } from "./.claude/core/terminal";

const manager = new ProfileTerminalBindingManager();

// Initialize with RSS and MCP adapters
await manager.initialize({
  rssFeed: new BunRSSFeedAdapter(),
  mcpServer: new BunMCPServerAdapter(),
});

// Bind current directory to a profile
manager.bindCurrentDirectory("dev", { autoActivate: true });

// Switch profiles
await manager.switchProfile("prod");

// Broadcast matrix update
await manager.broadcastMatrixUpdate();

// Display status
manager.displayStatus();
```

### Matrix Update Broadcasting

The `broadcastMatrixUpdate()` method publishes to:

1. **RSS Feed** (`~/.matrix/feeds/tier-1380-matrix.json`)
   - Channel: `tier-1380-matrix`
   - Content: Full profile-terminal matrix
   - Checksum: Wyhash of content for integrity

2. **MCP Server** (`~/.matrix/mcp/bun___profiles_matrix_realtime.json`)
   - URI: `bun://profiles/matrix/realtime`
   - Data: `{ profiles, terminals, bindings, col93Integrity, timestamp, checksum }`

### Session Management

```typescript
// Create a session for current terminal
const terminal = manager.terminalManager.activeTerminal;
if (terminal) {
  const session = manager.sessionManager.createSession(
    terminal.id,
    "user-123",
    "admin",      // role
    "1380"        // tier
  );
}
```

---

## Matrix Agent (Migrated from Clawdbot)

The Matrix Agent is an AI agent management system integrated with the Matrix Analysis Platform. It was migrated from `clawdbot` v2026.1.17-1 and renamed to align with the project's Matrix/Tier-1380 theme.

### Directory Structure

```
~/.matrix/
├── agent/
│   └── config.json          # Agent configuration
├── logs/
│   └── agent-health.jsonl   # Health check logs
├── scripts/
│   └── health-check.ts      # Health monitoring script
└── matrix-agent.ts          # Main agent CLI
```

### Configuration

The agent configuration is stored in `~/.matrix/agent/config.json`:

```json
{
  "name": "matrix-agent",
  "version": "1.0.0",
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/minimax/minimax-m2.1" },
      "workspace": "/Users/nolarose"
    }
  },
  "channels": {
    "telegram": { "enabled": true }
  },
  "gateway": {
    "port": 18789,
    "mode": "local"
  },
  "integration": {
    "profiles": { "enabled": true },
    "terminal": { "enabled": true },
    "tier1380": { "enabled": true },
    "mcp": { "enabled": true }
  }
}
```

### Commands

```bash
# Initialize agent
bun run agent:init

# Show agent status
bun run agent:status

# Run health checks
bun run agent:health

# Migrate from legacy clawdbot
bun run agent:migrate

# Profile commands (via agent)
bun run agent:profile list
bun run agent:profile use <name>
bun run agent:profile show <name>

# Tier-1380 commands (via agent)
bun run agent:tier1380 color init --team=<name> --profile=<name>
```

### Direct Usage

```bash
# Using the global command
matrix-agent status
matrix-agent health
matrix-agent migrate

# Or via bun
bun ~/.matrix/matrix-agent.ts status
```

### Integration Points

The Matrix Agent integrates with:

1. **Profile System** (`~/.matrix/profiles/`)
   - Reads and manages environment profiles
   - Syncs with terminal binding manager

2. **Tier-1380 CLI** (`cli/tier1380.ts`)
   - Color system management
   - Team hierarchy
   - Dashboard operations

3. **Terminal Manager** (`.claude/core/terminal/`)
   - Profile-terminal bindings
   - Session management

4. **MCP Servers** (`.mcp.json`)
   - Bun runtime
   - Documentation search
   - File system access

### Migration from Clawdbot

To migrate from the legacy `clawdbot` installation:

```bash
# Run migration script
bun run agent:migrate

# Or manually
bun ~/.matrix/matrix-agent.ts migrate
```

This will:
- Copy relevant configuration from `~/.clawdbot/clawdbot.json`
- Create a migration marker at `~/.matrix/.migrated-from-clawdbot`
- Preserve agent settings, model preferences, and channel configs

After migration, the legacy `~/.clawdbot` directory can be safely removed.

---

## Bun-Specific Patterns

### Cross-Runtime Guard

```typescript
if (typeof Bun !== "undefined") {
  // Bun-specific code
} else {
  // Node.js fallback
}
```

### File I/O

```typescript
const file = Bun.file("./data.json");
const content = await file.text();
const json = await file.json();
await Bun.write("out.txt", content);
await file.delete(); // Bun 1.2+
```

### S3/R2 Storage

```typescript
import { s3 } from "bun";
await s3.write("file.pdf", data, {
  contentDisposition: 'attachment; filename="report.pdf"'
});
const file = s3.file("key");
await file.exists();
```

### SQLite

```typescript
import { Database } from "bun:sqlite";
const db = new Database("app.sqlite");
db.query("SELECT * FROM users").all();

// Auto-cleanup with using
{ using db = new Database("app.sqlite"); }
```

### Shell Commands

```typescript
import { $ } from "bun";
await $`ls -la | grep .ts`;
const out = await $`echo hello`.text();
await $`cmd`.quiet();              // No output
const { exitCode } = await $`cmd`.nothrow();  // Don't throw
```

---

## Related Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and features |
| `CLAUDE.md` | Bun API quick reference |
| `docs/ROADMAP.md` | Development roadmap and progress |
| `docs/SPAWN-OPTIMIZATION.md` | Bun spawn performance guide and validation |
| `skills/README.md` | Skills registry documentation |
| `skills/docs/dev-hq-cli.md` | Dev HQ CLI full documentation |
| `docs/release-notes.md` | Bun runtime release notes |
| `mcp-bun-docs/lib.ts` | Bun docs search, curated entries, reference links (searchBunDocs, getDocEntry, BUN_REFERENCE_LINKS) |

---

## Environment Requirements

- **Bun:** >= 1.3.6
- **Git:** >= 2.40 (recommended)
- **OS:** macOS 14+ (recommended), Linux, Windows WSL
- **RAM:** 4GB minimum, 8GB+ recommended
- **Disk:** 1GB+ for dependencies

---

*This document is maintained for AI coding agents. For human contributors, see README.md.*
