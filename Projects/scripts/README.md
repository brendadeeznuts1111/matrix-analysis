# Scripts

Utility scripts and CLI tools for workspace management.

## Structure

```
scripts/
├── cli/           # Command-line tools
├── secrets/       # Secrets management
├── 1password/     # 1Password setup
├── generators/    # Code/config generators
├── terminal/      # Terminal effects
├── bun/           # Bun-specific tools
├── data/          # Generated data files
├── docs/          # Documentation
├── diagnose/      # Diagnose module
└── utils/         # Shared utilities
```

---

## CLI Tools

| Script | Type | Description |
|--------|------|-------------|
| `cli/diagnose.ts` | Analyzer | Project health analysis with scoring, painpoint detection |
| `cli/feedback.ts` | Reporter | Submit bug reports and feature requests from CLI |
| `cli/pm.ts` | Reference | Bun package manager reference and command wrapper |
| `cli/projects.ts` | Scanner | Unified workspace scanner, lists all projects with stats |
| `cli/deep-app-cli.ts` | Scanner | Project scanner with OSC8 hyperlinks, bloat/secret detection |

| Script | Properties | Patterns |
|--------|------------|----------|
| `cli/diagnose.ts` | `async` `file-io` `modular` | Plugin analyzers, Strategy (output formats) |
| `cli/feedback.ts` | `async` `network` `stdin` | Command, Template (issue format) |
| `cli/pm.ts` | `sync` `reference` | Facade (wraps bun commands) |
| `cli/projects.ts` | `async` `file-io` `ansi` | Registry, Observer (workspace scan) |
| `cli/deep-app-cli.ts` | `async` `file-io` `osc8` | Visitor (project tree), Strategy (scans) |

| Script | Interfaces | Types |
|--------|------------|-------|
| `cli/diagnose.ts` | `HealthResult` | — |
| `cli/feedback.ts` | — | — |
| `cli/pm.ts` | — | — |
| `cli/projects.ts` | `ExecutionOptions` `ExecutionResult` `ScriptDescriptor` `ProjectStats` `WorkspaceStats` `FileInfo` `FileTypeGroup` `ProjectFileStats` | `ProjectSlug` `ProjectPath` `WorkspaceKey` `ProjectRef` `CategoryKey` |
| `cli/deep-app-cli.ts` | `ProjectInfo` | — |

| Script | Flags |
|--------|-------|
| `cli/diagnose.ts` | `--quick` `--deep` `--all` `--json` `--html` `--chart` `--open` |
| `cli/feedback.ts` | `--email=<addr>` `--dry-run` `--open` |
| `cli/pm.ts` | `install` `add` `remove` `link` `update` `outdated` |
| `cli/projects.ts` | `--scan` `--filter=<pat>` `--sort=<field>` `--json` |
| `cli/deep-app-cli.ts` | `--projects` `--scan=outdated\|bloat\|secrets` `--hyper` `--fix` |

---

## Secrets Management

| Script | Type | Description |
|--------|------|-------------|
| `secrets/check-secrets.ts` | Validator | Validate secrets configuration and detect exposed credentials |
| `secrets/secrets-migrate.ts` | Migrator | Migrate secrets between stores (env, 1Password, Bun.secrets) |
| `secrets/sync-secrets.ts` | Syncer | Sync secrets across environments |
| `secrets/sync-wrangler-secrets.ts` | Syncer | Push secrets to Cloudflare Workers via wrangler |

| Script | Properties | Patterns |
|--------|------------|----------|
| `secrets/check-secrets.ts` | `async` `file-io` `sensitive` | Scanner, Reporter |
| `secrets/secrets-migrate.ts` | `async` `auth-required` `destructive` | Adapter (store adapters), Pipeline |
| `secrets/sync-secrets.ts` | `async` `auth-required` | Sync, Diff-Apply |
| `secrets/sync-wrangler-secrets.ts` | `async` `auth-required` `network` | Bridge (wrangler CLI) |

| Script | Interfaces | Classes |
|--------|------------|---------|
| `secrets/check-secrets.ts` | `SecretPattern` `ScanResult` | — |
| `secrets/secrets-migrate.ts` | `StoreConfig` `MigrationResult` | `SecretStore` |
| `secrets/sync-secrets.ts` | `SyncOptions` `SyncResult` | — |
| `secrets/sync-wrangler-secrets.ts` | `WranglerSecret` | — |

| Script | Flags |
|--------|-------|
| `secrets/check-secrets.ts` | `--fix` `--verbose` `--json` |
| `secrets/secrets-migrate.ts` | `--from=<store>` `--to=<store>` `--dry-run` |
| `secrets/sync-secrets.ts` | `--env=<name>` `--force` |
| `secrets/sync-wrangler-secrets.ts` | `--project=<name>` `--env=<name>` |

---

## 1Password Setup

| Script | Type | Description |
|--------|------|-------------|
| `1password/setup-1password.ts` | Installer | Complete 1Password CLI setup guide with status checks |
| `1password/setup-1password-plugins.ts` | Configurator | Configure shell plugins for auto credential injection |
| `1password/setup-1password-vault.ts` | Provisioner | Create Development vault with API credential items |

| Script | Properties | Patterns |
|--------|------------|----------|
| `1password/setup-1password.ts` | `async` `auth-required` `interactive` | Wizard, State Machine (setup steps) |
| `1password/setup-1password-plugins.ts` | `async` `auth-required` `shell` | Registry (plugin configs), Builder |
| `1password/setup-1password-vault.ts` | `async` `auth-required` `destructive` | Factory (vault items), Template |

| Script | Interfaces | Constants |
|--------|------------|-----------|
| `1password/setup-1password.ts` | `SetupStatus` `StepResult` | `STEPS` |
| `1password/setup-1password-plugins.ts` | `PluginConfig` | `RECOMMENDED_PLUGINS` |
| `1password/setup-1password-vault.ts` | `VaultItem` `FieldDef` | `VAULT_NAME` `ITEMS` |

| Script | Flags |
|--------|-------|
| `1password/setup-1password.ts` | `--check` `--plugins` `--step=<n>` |
| `1password/setup-1password-plugins.ts` | `--list` `--all` `<plugin-name>` |
| `1password/setup-1password-vault.ts` | `--dry-run` `--force` |

---

## Generators

| Script | Type | Description |
|--------|------|-------------|
| `generators/generate-toc.ts` | Generator | Table of contents generator for markdown/code |
| `generators/generate-toml-types.ts` | Generator | Generate TypeScript interfaces from TOML config files |
| `generators/config-manager.ts` | Manager | TOML + R2 storage config manager with sync/diff |

| Script | Properties | Patterns |
|--------|------------|----------|
| `generators/generate-toc.ts` | `async` `file-io` `recursive` | Visitor (AST walk), Builder (TOC tree) |
| `generators/generate-toml-types.ts` | `async` `file-io` `codegen` | Parser, Template (d.ts output) |
| `generators/config-manager.ts` | `async` `network` `auth-required` | Repository (R2), Command (CRUD ops) |

| Script | Interfaces | Classes |
|--------|------------|---------|
| `generators/generate-toc.ts` | `Metrics` `GitStatus` `BuildHealth` `Scripts` `CodeMetrics` `TestStatus` `Activity` `ClaudeSkill` `ClaudePlugin` `ClaudeHook` `SkillsSummary` `CacheEntry` `DepsInfo` `HealthInfo` `Project` | — |
| `generators/generate-toml-types.ts` | — | `BunTomlTypeGenerator` |
| `generators/config-manager.ts` | `R2Config` `Config` | `R2Storage` `ConfigManager` |

| Script | Flags |
|--------|-------|
| `generators/generate-toc.ts` | `--depth=<n>` `--output=<path>` `--format=md\|json` |
| `generators/generate-toml-types.ts` | `--dir=<path>` `--output=<path>` |
| `generators/config-manager.ts` | `get <key>` `set <key> <val>` `sync` `diff` `push` `pull` |

---

## Terminal

| Script | Type | Description |
|--------|------|-------------|
| `terminal/hyper-matrix.ts` | Display | Clickable project matrix with OSC8 links |
| `terminal/osc8-matrix.sh` | Display | 25 clickable one-liner project commands |

| Script | Properties | Patterns |
|--------|------------|----------|
| `terminal/hyper-matrix.ts` | `sync` `ansi` `osc8` `interactive` | Table renderer, Hyperlink protocol |
| `terminal/osc8-matrix.sh` | `sync` `bash` `osc8` | Script collection, One-liner |

| Script | Interfaces | Constants |
|--------|------------|-----------|
| `terminal/hyper-matrix.ts` | `Project` | `PROJECTS` |
| `terminal/osc8-matrix.sh` | — | — |

| Script | Compatibility |
|--------|---------------|
| `terminal/hyper-matrix.ts` | iTerm2, WezTerm, Kitty, Hyper |
| `terminal/osc8-matrix.sh` | iTerm2, WezTerm, Kitty |

---

## Bun Tools

| Script | Type | Description |
|--------|------|-------------|
| `bun/bunpm-preinstall-gate.ts` | Hook | Pre-install security scanner, blocks supply chain attacks |

| Script | Properties | Patterns |
|--------|------------|----------|
| `bun/bunpm-preinstall-gate.ts` | `async` `network` `blocking` | Gate, Chain of Responsibility |

| Script | Interfaces | Classes |
|--------|------------|---------|
| `bun/bunpm-preinstall-gate.ts` | `GateResult` `ScanResult` | `EnterpriseScanner` (imported) |

| Script | Integration |
|--------|-------------|
| `bun/bunpm-preinstall-gate.ts` | `bunfig.toml` preinstall hook |

---

## Diagnose Module

| File | Type | Description |
|------|------|-------------|
| `diagnose/config.ts` | Config | Analyzer configuration and thresholds |
| `diagnose/painpoints.ts` | Detector | Painpoint detection rules and scoring |
| `diagnose/scoring.ts` | Calculator | Health score calculation and grading |
| `diagnose/analyzers/git.ts` | Analyzer | Git history and commit analysis |
| `diagnose/analyzers/code.ts` | Analyzer | Code complexity and quality metrics |
| `diagnose/analyzers/deps.ts` | Analyzer | Dependency health and vulnerabilities |
| `diagnose/analyzers/performance.ts` | Analyzer | Runtime and build performance metrics |

| File | Interfaces | Types |
|------|------------|-------|
| `diagnose/config.ts` | `DiagnoseConfig` | — |
| `diagnose/painpoints.ts` | `Painpoint` `PainpointSummary` | — |
| `diagnose/scoring.ts` | `HealthScores` `Grade` | — |
| `diagnose/analyzers/git.ts` | `GitHealth` | — |
| `diagnose/analyzers/code.ts` | `CodeHealth` | — |
| `diagnose/analyzers/deps.ts` | `DepsHealth` | — |
| `diagnose/analyzers/performance.ts` | `PerformanceHealth` | — |

| File | Properties | Patterns |
|------|------------|----------|
| `diagnose/config.ts` | `sync` `readonly` | Configuration object |
| `diagnose/painpoints.ts` | `sync` `rules` | Rule engine, Weighted scoring |
| `diagnose/scoring.ts` | `sync` `pure` | Calculator, Grade mapper |
| `diagnose/analyzers/*.ts` | `async` `modular` | Strategy, Plugin architecture |

---

## Utils

| File | Type | Description |
|------|------|-------------|
| `utils/shared.ts` | Library | ANSI colors, OSC8 links, formatters, spinners |
| `utils/einstein-similarity.ts` | Algorithm | String similarity using Einstein coefficient |
| `utils/test-logger.js` | Debug | Test logging utility |

| File | Interfaces | Classes |
|------|------------|---------|
| `utils/shared.ts` | — | `Spinner` |
| `utils/einstein-similarity.ts` | `SimilarityResult` | — |
| `utils/test-logger.js` | — | — |

| File | Exports |
|------|---------|
| `utils/shared.ts` | `color` `osc8` `Spinner` `timer` `pad` `formatBytes` `formatDate` `SECRET_PATTERNS` `BLOAT_PATTERNS` |
| `utils/einstein-similarity.ts` | `SimilarityResult` `einsteinSimilarity` `tokenize` `compare` |
| `utils/test-logger.js` | `log` `debug` `trace` |

---

## Usage

```bash
# Health analysis
bun cli/diagnose.ts --quick
bun cli/diagnose.ts --all --html --open

# Project scanning
bun cli/projects.ts --scan
bun cli/deep-app-cli.ts --projects --hyper

# Package management
bun cli/pm.ts add zod
bun cli/pm.ts outdated

# 1Password setup
bun 1password/setup-1password.ts --check
bun 1password/setup-1password-plugins.ts --list

# Config management
bun generators/config-manager.ts sync
bun generators/config-manager.ts diff

# Terminal matrix (clickable links)
bun terminal/hyper-matrix.ts
```

---

## Property Legend

| Property | Meaning |
|----------|---------|
| `async` | Uses async/await, returns promises |
| `sync` | Synchronous execution |
| `file-io` | Reads/writes files |
| `network` | Makes HTTP requests |
| `auth-required` | Requires authentication (1Password, API keys) |
| `interactive` | Prompts for user input |
| `destructive` | Can modify/delete data |
| `modular` | Plugin/analyzer architecture |
| `ansi` | Uses ANSI escape codes for colors |
| `osc8` | Uses OSC8 hyperlink protocol |
| `stdin` | Accepts piped input |
| `codegen` | Generates code/types |
| `sensitive` | Handles secrets/credentials |
| `pure` | No side effects, deterministic |
| `readonly` | Does not modify state |
| `rules` | Contains rule definitions |
| `recursive` | Processes nested structures |
| `blocking` | Can block/prevent operations |

---

## Type Reference

### Core Types (cli/projects.ts)

```typescript
type ProjectSlug = "api-plive-setup-discovery" | "registry-powered-mcp" | ...
type ProjectPath = "/Users/nolarose/Projects/api-plive-setup-discovery" | ...
type WorkspaceKey = "apiPlive" | "registryMcp" | "traderAnalyzer" | ...
type ProjectRef = ProjectSlug | ProjectPath
type CategoryKey = "api" | "trading" | "mcp" | "bot" | "web" | ...
```

### Health Interfaces (diagnose/)

```typescript
interface GitHealth { commits: number; branches: number; stale: boolean; ... }
interface CodeHealth { loc: number; complexity: number; duplication: number; ... }
interface DepsHealth { total: number; outdated: number; vulnerable: number; ... }
interface PerformanceHealth { buildTime: number; startupTime: number; ... }
interface HealthScores { git: number; code: number; deps: number; perf: number; }
interface Grade { letter: "A" | "B" | "C" | "D" | "F"; score: number; label: string; }
```

### Config Interfaces (generators/)

```typescript
interface R2Config { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; }
interface Config { title: string; version: string; server: ServerConfig; database: DbConfig; ... }
```

### Utility Classes (utils/)

```typescript
class Spinner { start(msg): void; stop(msg?): void; update(msg): void; }
```
