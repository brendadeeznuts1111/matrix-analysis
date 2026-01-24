# Enterprise Dashboard

Production-grade security infrastructure for Bun projects with OS keychain integration, npm registry management, real-time monitoring, and enterprise networking.

[![Bun](https://img.shields.io/badge/Bun-1.3.6+-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Dashboard Modules](#dashboard-modules)
- [Setup Secrets](#setup-secrets)
- [Scripts](#scripts)
- [API Usage](#api-usage)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Security Model](#security-model)
- [Troubleshooting](#troubleshooting)
- [Documentation & References](#documentation--references)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Keychain Viewer** | Monitor secrets stored in macOS Keychain via [`Bun.secrets`](https://bun.sh/docs/api/secrets) |
| **Registry Viewer** | Browse npm package info with secure authentication |
| **Security Audit** | Verify [`trustedDependencies`](https://bun.sh/docs/install/lifecycle) for supply-chain protection |
| **Real-time Updates** | WebSocket-based live dashboard updates |
| **Anomaly Detection** | Automatic detection of unusual patterns in metrics |

### Enterprise Features

| Feature | Description |
|---------|-------------|
| **Multi-Registry Support** | npm, Azure Artifacts, JFrog Artifactory, GitHub Packages |
| **Network Topology** | Visualize service dependencies and connections |
| **PTY Terminals** | Embedded terminal sessions with full PTY support |
| **URLPattern Routing** | Hardware-accelerated request routing |
| **KYC Integration** | Optional identity verification workflows |
| **CI/CD Pipeline** | GitHub Actions with `--ignore-scripts` for external PRs |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Enterprise Dashboard                          │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│  Dashboard  │   Projects  │  Analytics  │   Network   │   Config    │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│  Settings   │  Clitools   │  Diagnose   │ URLPattern  │    PTY      │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│  Resources  │  Topology   │     KYC     │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Keychain  │ │  Registry   │ │   Network   │
            │   Service   │ │   Client    │ │   Monitor   │
            │ (Bun.secrets)│ │  (Secure)   │ │ (WebSocket) │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │              │              │
                    ▼              ▼              ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   macOS     │ │     npm     │ │  Internal   │
            │  Keychain   │ │  Registry   │ │  Services   │
            └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Quick Start

### Prerequisites

- [Bun 1.3.6+](https://bun.sh/docs/installation)
- macOS (for Keychain integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/brendadeeznuts1111/enterprise-dashboard.git
cd enterprise-dashboard

# Install dependencies
bun install

# Configure secrets (interactive)
bun run secrets

# Launch dashboard
bun run dashboard
```

### First Run

```bash
# 1. Set up your registry credentials
export NPM_TOKEN="npm_xxxxxxxxxxxx"
export NPM_PASSWORD="your-registry-password"
bun run secrets

# 2. Verify secrets are stored
bun run secrets:list

# 3. Run security audit
bun run audit

# 4. Launch full dashboard
bun run dashboard

# 5. Or view specific packages
bun run dashboard:registry typescript react zod
```

---

## Configuration

The dashboard is configured via `config.toml` in the project root. Copy and customize:

```bash
cp config.toml.example config.toml  # If starting fresh
```

### Core Settings

```toml
[dashboard]
title = "Enterprise Dashboard"
theme = "dark"                    # "dark" | "light" | "system"
refresh_interval = 30             # seconds, 0 to disable
timezone = "UTC"                  # IANA timezone

[dashboard.panels]
keychain = true
registry = true
analytics = true
network = true
```

### Project Monitoring

```toml
[projects]
root = "."                        # Scan root directory
max_depth = 3                     # Directory depth limit
ignore = [".git", "node_modules", "dist", ".cache"]
watch = true                      # Live file watching

[projects.git]
fetch_on_load = false             # Auto-fetch remotes
show_stale_branches = true        # Flag old branches
stale_days = 30
```

### Network & Registry

```toml
[network]
timeout = 30000                   # Request timeout (ms)
max_retries = 3
retry_delay = 1000

[network.proxy]
enabled = false
url = "http://proxy.example.com:8080"
no_proxy = ["localhost", "127.0.0.1"]

[network.dns]
prefetch = true                   # DNS prefetch optimization
cache_ttl = 300

[registry]
url = "https://registry.npmjs.org"
timeout = 10000
cache = true
cache_ttl = 3600

[registry.scopes]
"@myorg" = "https://npm.pkg.github.com"
"@company" = "https://pkgs.dev.azure.com/org/_packaging/feed/npm/registry"
```

### Terminal & Routing

```toml
[pty]
shell = "/bin/zsh"
rows = 24
cols = 80
scrollback = 1000
cursor_blink = true

[pty.env]
TERM = "xterm-256color"
COLORTERM = "truecolor"

[urlpattern]
base_url = "http://localhost:3000"
strict_mode = true

[urlpattern.routes]
api = "/api/:version/:resource/:id?"
dashboard = "/dashboard/:section?"
health = "/health"
```

### Monitoring & Resources

```toml
[diagnose]
enabled = true
log_level = "info"                # debug | info | warn | error
log_file = "logs/dashboard.log"
max_log_size = "10MB"
max_log_files = 5

[diagnose.checks]
memory = true
disk = true
network = true
dependencies = true

[resources]
max_memory = "512MB"
max_cpu = 80

[resources.limits]
max_concurrent_requests = 100
max_websocket_connections = 50
request_body_limit = "10MB"
```

### All Configuration Sections

| Section | Description |
|---------|-------------|
| `[dashboard]` | Theme, refresh interval, panel toggles |
| `[projects]` | Project scanning, git integration, file watching |
| `[analytics]` | Metrics collection, retention, sampling |
| `[network]` | Timeouts, retries, proxy, DNS prefetch |
| `[registry]` | npm registry URL, cache, scoped registries |
| `[pty]` | Terminal shell, dimensions, environment |
| `[urlpattern]` | URL routing patterns and base URL |
| `[diagnose]` | Logging, health checks, rotation |
| `[resources]` | Memory/CPU limits, connection caps |
| `[topology]` | Dependency graph visualization |
| `[kyc]` | KYC verification provider and fields |
| `[clitools]` | CLI history, aliases, autocomplete |
| `[settings]` | Auto-save, backup configuration |

See [`config.toml`](./config.toml) for the complete reference.

---

## Dashboard Modules

### Dashboard (Home)

Main overview with system status, recent activity, and quick actions.

### Projects

Monitor git repositories, track branches, view commit history.

```bash
bun run dashboard -- --section=projects
```

### Analytics

Build times, test coverage, bundle sizes, dependency updates.

### Network

Real-time network monitoring, request/response metrics, latency tracking.

### Config

View and edit `config.toml` settings through the UI.

### Settings

User preferences, theme selection, notification settings.

### Clitools

Embedded CLI with custom aliases and command history.

```toml
[clitools.aliases]
ll = "ls -la"
gst = "git status"
gco = "git checkout"
```

### Diagnose

System health checks, log viewer, dependency analysis.

```bash
# Run diagnostics
bun run dashboard -- --diagnose
```

### URLPattern

Test and debug URL routing patterns with the built-in tester.

### PTY

Full terminal emulator with PTY support for interactive sessions.

### Resources

Monitor memory, CPU, disk usage, and connection pools.

### Topology

Visualize service dependencies as an interactive graph.

### KYC

Identity verification workflows (when enabled).

---

## Setup Secrets

Store credentials in OS keychain (not in `.env` files):

```bash
# Set environment variables
export NPM_TOKEN="npm_xxxxxxxxxxxx"
export NPM_PASSWORD="your-registry-password"

# Store in keychain
bun run secrets

# Verify storage
bun run secrets:list
```

### Supported Secrets

| Secret | Environment Variable | Description |
|--------|---------------------|-------------|
| `npm-token` | `NPM_TOKEN` | npm registry authentication token |
| `registry-password` | `NPM_PASSWORD` | Azure/JFrog registry password |

### Why Keychain?

- Encrypted at rest by the OS
- Not exposed in process environment
- Survives shell sessions
- Auditable access logs

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dashboard` | Launch full enterprise dashboard |
| `bun run dashboard:keychain` | Keychain status viewer only |
| `bun run dashboard:registry [pkgs...]` | Registry viewer (multiple packages) |
| `bun run pm <action> [options]` | Workspace-aware package manager |
| `bun run secrets` | Store secrets from env vars to keychain |
| `bun run secrets:list` | List configured secrets and status |
| `bun run audit` | Verify trusted dependencies |
| `bun test` | Run test suite |
| `bun run typecheck` | TypeScript type checking |

### Package Manager (pm.ts)

Workspace-aware CLI with correct Bun filter syntax:

```bash
# Workspace Operations
bun run pm install -f @enterprise/dataview          # Specific workspace
bun run pm install -w                               # All workspaces
bun run pm install --filter '!@enterprise/s3-project' # Exclude

# Package Operations
bun run pm add zod -f @enterprise/dataview          # Add to workspace
bun run pm add zod -w --min-age 3d                  # Add with supply chain protection
bun run pm rm lodash -f @enterprise/dataview        # Remove from workspace

# Scripts
bun run pm run test -f @enterprise/dataview         # Run in workspace
bun run pm run build -w                             # Build all

# Inspection
bun run pm ls                                       # List workspaces
bun run pm why debug                                # Why is this installed?
bun run pm outdated                                 # Check for updates
```

**Key Syntax Rule:** Command verb first, then flags:
- ✅ `bun install --filter @pkg`
- ❌ `bun --filter @pkg install`

### Command Options

```bash
# Dashboard with specific section
bun run dashboard -- --section=analytics

# Registry viewer with custom packages
bun run dashboard:registry lodash zod typescript react vue

# Skip keychain display
bun run dashboard -- --no-keychain

# Skip registry display
bun run dashboard -- --no-registry

# Run diagnostics
bun run dashboard -- --diagnose
```

---

## API Usage

### EnterpriseDashboard

```typescript
import { EnterpriseDashboard } from "./src/dashboard/index.ts";

const dashboard = await EnterpriseDashboard.create();

// Render full dashboard
console.log(await dashboard.render({
  showKeychain: true,
  showRegistry: true,
  packages: ["zod", "lodash", "typescript"]
}));

// Access individual viewers
const keychain = dashboard.getKeychainViewer();
const registry = dashboard.getRegistryViewer();
```

### SecureRegistryClient

```typescript
import { SecureRegistryClient } from "./src/client/RegistryClient.ts";

const client = await SecureRegistryClient.create();

// Get package info (cached for 5 minutes)
const info = await client.getPackageInfo("zod");
console.log(info["dist-tags"].latest);

// Get all versions (uses cached package info)
const versions = await client.getPackageVersions("typescript");
console.log(versions.slice(-5)); // Last 5 versions
```

> **Note:** Package info is cached in-memory with a 5-minute TTL to reduce network calls. Repeated requests for the same package return cached data.

### KeychainViewer

```typescript
import { KeychainViewer } from "./src/dashboard/KeychainViewer.ts";

const viewer = await KeychainViewer.create();

// Render as table
console.log(viewer.render());

// Get raw data
const secrets = viewer.getSecrets();

// Programmatic access
await viewer.setSecret("custom-token", "value");
await viewer.deleteSecret("old-token");
```

### RegistryViewer

```typescript
import { RegistryViewer } from "./src/dashboard/RegistryViewer.ts";

const viewer = await RegistryViewer.create();

// Single package detail
console.log(await viewer.renderPackage("typescript"));

// Multiple packages comparison
console.log(await viewer.renderMultiple(["react", "vue", "svelte"]));

// Get structured data
const info = await viewer.getPackageInfo("zod");
const versions = await viewer.getVersions("zod", 10);
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NPM_TOKEN` | npm authentication token | - |
| `NPM_PASSWORD` | Registry password (Azure/JFrog) | - |
| `REGISTRY_URL` | Override registry URL | `https://registry.npmjs.org` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `DASHBOARD_PORT` | Dashboard server port | `3000` |

---

## Project Structure

```
enterprise-dashboard/
├── config.toml                    # Dashboard configuration
├── bunfig.toml                    # Bun runtime + install configuration
├── package.json                   # Dependencies, scripts, workspaces
├── .env.example                   # Environment template
│
├── src/
│   ├── client/
│   │   └── RegistryClient.ts      # Secure npm registry client
│   ├── dashboard/
│   │   ├── index.ts               # Main dashboard + EnterpriseDashboard class
│   │   ├── KeychainViewer.ts      # OS keychain status viewer
│   │   └── RegistryViewer.ts      # npm package info viewer
│   └── shortcuts/
│       ├── index.ts               # Shortcut manager exports
│       └── KeyboardShortcutManager.ts  # Conflict-free keyboard shortcuts
│
├── scripts/
│   ├── pm.ts                      # Workspace-aware package manager CLI
│   ├── setup-secrets.ts           # Keychain credential management
│   └── verify-trusted-deps.ts     # Security audit script
│
├── dataview/                      # @enterprise/dataview workspace
│   └── package.json
├── s3-project/                    # @enterprise/s3-project workspace
│   └── package.json
├── string-width/                  # @enterprise/string-width workspace
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI with external PR protection
│
├── SECURITY.md                    # Lifecycle script security guide
└── README.md                      # This file
```

### Workspaces

This project uses Bun workspaces for modular package organization:

| Workspace | Package | Description |
|-----------|---------|-------------|
| `dataview/` | `@enterprise/dataview` | Binary data handling utilities |
| `s3-project/` | `@enterprise/s3-project` | S3 project management |
| `string-width/` | `@enterprise/string-width` | String width calculations |

```bash
# Install specific workspace
bun install --filter @enterprise/dataview

# Run tests in all workspaces
bun test --workspaces

# Add package to workspace
bun add zod --filter @enterprise/dataview
```

---

## Security Model

This project uses Bun's **default-secure** lifecycle script model with supply chain protection:

### Principles

1. **Deny by default** - All lifecycle scripts (`postinstall`, etc.) are blocked
2. **Explicit trust** - Only packages in `trustedDependencies` can run scripts
3. **Minimum release age** - Block packages published less than 3 days ago
4. **Isolated linker** - Prevent phantom dependencies (pnpm-style)
5. **CI protection** - External PRs use `--ignore-scripts`
6. **Secure storage** - Credentials in OS keychain, never in files

### Supply Chain Configuration (bunfig.toml)

```toml
[install]
# Prevent phantom dependencies
linker = "isolated"

# Block packages published < 3 days ago
minimumReleaseAge = 259200  # seconds (3 days)

# Trusted packages bypass age gate
minimumReleaseAgeExcludes = [
  "@types/node",
  "@types/bun",
  "typescript",
  "bun-types",
]
```

### Trusted Dependencies (package.json)

```json
{
  "trustedDependencies": [
    "node-sass",
    "sharp",
    "esbuild",
    "@swc/core",
    "prisma"
  ]
}
```

### Audit Command

```bash
# Verify all dependencies against trust list
bun run audit

# Install with explicit age gate
bun run pm add express --min-age 3d

# CI install (frozen lockfile, production only)
bun run pm install --frozen-lockfile -p
```

See [SECURITY.md](./SECURITY.md) for the complete security guide.

---

## Troubleshooting

### "Required secrets not found"

```bash
# Ensure environment variables are set
export NPM_TOKEN="your-token"
export NPM_PASSWORD="your-password"

# Run setup
bun run secrets

# Verify
bun run secrets:list
```

### "Registry error: 401 Unauthorized"

Check your token is valid and has read access:

```bash
# Test token directly
curl -H "Authorization: Bearer $NPM_TOKEN" https://registry.npmjs.org/-/whoami
```

### "Keychain access denied"

macOS may prompt for keychain access. Click "Always Allow" for the Bun process.

### Dashboard won't start

```bash
# Check for port conflicts
lsof -i :3000

# Use alternate port
DASHBOARD_PORT=3001 bun run dashboard
```

### TypeScript errors

```bash
# Run type check
bun run typecheck

# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

---

## Dashboard Preview

```
╔════════════════════════════════════════╗
║       ENTERPRISE DASHBOARD             ║
╚════════════════════════════════════════╝

## Keychain Status

┌───────────────────┬────────┬───────────────┬───────────────────────────────┐
│ Name              │ Status │ Env Var       │ Description                   │
├───────────────────┼────────┼───────────────┼───────────────────────────────┤
│ npm-token         │ set    │ $NPM_TOKEN    │ npm registry auth token       │
│ registry-password │ set    │ $NPM_PASSWORD │ Azure/JFrog registry password │
└───────────────────┴────────┴───────────────┴───────────────────────────────┘

## Registry Packages

┌─────────┬─────────┬─────────┬─────────────────────────────────────────┐
│ Package │ Version │ License │ Description                             │
├─────────┼─────────┼─────────┼─────────────────────────────────────────┤
│ zod     │ 4.3.6   │ MIT     │ TypeScript-first schema validation...   │
│ lodash  │ 4.17.23 │ MIT     │ Lodash modular utilities.               │
└─────────┴─────────┴─────────┴─────────────────────────────────────────┘
```

---

## Documentation & References

### Bun APIs Used

| API | Documentation | Purpose |
|-----|---------------|---------|
| `Bun.secrets` | [Secrets API](https://bun.sh/docs/api/secrets) | OS keychain storage |
| `Bun.inspect.table()` | [Inspect Utils](https://bun.sh/docs/runtime/utils#bun-inspect-table) | Terminal table rendering |
| `Bun.serve()` | [HTTP Server](https://bun.sh/docs/api/http) | Dashboard server |
| `Bun.file()` | [File I/O](https://bun.sh/docs/api/file-io) | Config file reading |
| `trustedDependencies` | [Lifecycle Scripts](https://bun.sh/docs/install/lifecycle) | Supply-chain security |

### External Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [npm Registry API](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md)
- [TOML Specification](https://toml.io/en/)
- [OWASP Dependency Security](https://owasp.org/www-project-dependency-check/)

### Related Projects

- [Bun Default Trusted Dependencies](https://github.com/oven-sh/bun/blob/main/src/install/default-trusted-dependencies.txt)

---

## Keyboard Shortcuts

The dashboard supports configurable keyboard shortcuts via `config.toml`. Default shortcuts are designed to avoid common browser conflicts:

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+/` | Open search | Avoids `Cmd+K` (browser search) |
| `Ctrl+Shift+K` | KYC validate | |
| `Ctrl+Shift+Q` | KYC review queue | |
| `Ctrl+Shift+N` | Refresh network | Avoids `Cmd+Shift+R` (hard refresh) |
| `Ctrl+]` | Next tab | |
| `Ctrl+[` | Previous tab | |
| `Ctrl+B` | Toggle sidebar | |
| `Ctrl+S` | Quick save | |
| `Ctrl+E` | Quick export | |

### Custom Shortcuts

Configure in `config.toml`:

```toml
[clitools.shortcuts]
open-search = "ctrl+/"
kyc-validate = "ctrl+shift+k"
refresh-network = "ctrl+shift+n"
```

### Programmatic Usage

```typescript
import { initShortcuts, useGlobalShortcuts } from "./src/shortcuts";

// Load from config
await initShortcuts("./config.toml", {
  "open-search": () => openSearchModal(),
  "kyc-validate": () => validateKyc(),
});

// Or use hook-style API
const shortcuts = useGlobalShortcuts({
  "open-search": () => openSearchModal(),
  "refresh-network": () => refreshNetwork(),
});
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`bun test`)
4. Run security audit (`bun run audit`)
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Note: External PRs automatically use `--ignore-scripts` in CI.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with <a href="https://bun.sh">Bun</a>
</p>
