# AGENTS.md

> **Agent-Focused Documentation** for the Nolarose MCP Config Workspace

## Project Overview

This is a comprehensive **Bun-native development workspace** featuring:

- **Matrix Analysis Platform** - 197-column URLPattern performance analysis with compile-time caching
- **Environment Profile Management** - Secure profile system for managing development environments
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
│   │   ├── profile-create.ts
│   │   ├── profile-diff.ts
│   │   ├── profile-export.ts
│   │   ├── profile-list.ts
│   │   ├── profile-show.ts
│   │   └── profile-use.ts
│   ├── lib/                      # Shared utilities
│   │   ├── output.ts
│   │   ├── profile-loader.ts
│   │   └── validators.ts
│   └── __tests__/                # Unit tests
│
├── .claude/                      # Claude-specific code (examples allowed in git)
│   ├── examples/enterprise/      # Demo scripts and examples
│   ├── scripts/                  # Utility scripts (1200+ files)
│   ├── core/                     # Core library modules
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
| `ROADMAP.md` | Development roadmap and progress |
| `skills/README.md` | Skills registry documentation |
| `skills/docs/dev-hq-cli.md` | Dev HQ CLI full documentation |
| `release-notes.md` | Bun runtime release notes |

---

## Environment Requirements

- **Bun:** >= 1.3.6
- **Git:** >= 2.40 (recommended)
- **OS:** macOS 14+ (recommended), Linux, Windows WSL
- **RAM:** 4GB minimum, 8GB+ recommended
- **Disk:** 1GB+ for dependencies

---

*This document is maintained for AI coding agents. For human contributors, see README.md.*
