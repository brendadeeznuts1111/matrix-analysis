# 🤖 Kimi CLI Project Configuration

## Auto-Approve Settings

Shell mode is **enabled** and **auto-approved**. All shell commands run without confirmation prompts.

### Configuration Location
`~/.config/kimi/config.json`

```json
{
  "auto_approve_tools": ["shell", "python", "file_edit", "read", "write"],
  "auto_approve_risky": true,
  "auto_continue": true,
  "skip_confirmations": true
}
```

### What This Means
- ✅ Shell commands execute immediately
- ✅ File edits happen without prompts
- ✅ No more CONTINUE/STOP loops
- ✅ Risky commands are also auto-approved

## Project Structure

This is a local project folder. Run `kimi` from this directory to activate context.

## Shell Mode

Custom shell-mode skill available at:
- Skill: `~/.claude/skills/shell-mode.md`
- CLI helper: `~/.claude/bin/shell-mode`

Usage:
```bash
# In Kimi CLI, type shell commands directly:
ls -la
bun install
npm run build

# Or use the helper:
~/.claude/bin/shell-mode
```

## Tier-1380 OMEGA Skill

The **Tier-1380 OMEGA Protocol** skill is installed globally and provides:
- Phase 3.9 Apex intelligence (Cols 72-75)
- Bun BLAST suite operations
- Shell-pipe linker hot-reload
- wss:// live telemetry bridging

### Loading the Skill

In Kimi CLI, use:
```
/skill:tier1380-omega
```

Or from command line:
```bash
kimi --skill tier1380-omega
```

### Skill Location
- Global: `~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/skills/tier1380-omega/`
- Project: `.agents/skills/tier1380-omega/`
- Skill Pack: `.agents/skills/tier1380-omega.skill`

## Tier-1380 OMEGA Agent

A custom Kimi CLI agent with specialized system prompts for Tier-1380 OMEGA protocol work.

### Usage

```bash
# Start Kimi with Tier-1380 OMEGA agent
kimi --agent tier1380-omega

# Or combine with other options
kimi --agent tier1380-omega --skill tier1380-omega
```

### Agent Features

- **Extended System Prompt**: Includes Tier-1380 OMEGA protocol context
- **Specialized Tools**: Full tool suite for matrix telemetry operations
- **Subagent**: Coder subagent with OMEGA awareness

### Agent Location
- Global: `~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/agents/tier1380-omega/`

## Tier-1380 OMEGA Configuration File

A dedicated TOML configuration file optimized for Tier-1380 OMEGA workflows.

### Usage

```bash
# Use project config
kimi --config-file config/tier1380-omega.toml

# Or use global config
kimi --config-file ~/.kimi/configs/tier1380-omega.toml

# Combine with agent and skill
kimi --config-file config/tier1380-omega.toml --agent tier1380-omega --skill tier1380-omega
```

### Config Features

- **Loop Control**: Higher limits for complex matrix operations (150 steps/turn)
- **Skills Dir**: Points to `.agents/skills` for project-level skills
- **Performance**: 8 concurrent tasks for parallel operations
- **History**: 20k entries for complex telemetry sessions
- **Tier-1380 Section**: Custom settings for protocol version, phase, etc.

### Config Locations
- Project: `config/tier1380-omega.toml`
- Global: `~/.kimi/configs/tier1380-omega.toml`

## ACP (Agent Client Protocol) Server

ACP enables IDE integration with Tier-1380 OMEGA features.

### Starting the ACP Server

```bash
# Basic ACP server
kimi acp

# With OMEGA agent
kimi --agent tier1380-omega acp

# Full OMEGA mode
kimi --config-file config/tier1380-omega.toml --agent tier1380-omega acp
```

### IDE Integration

| IDE | Configuration |
|-----|---------------|
| VS Code | `.vscode/settings.json` |
| JetBrains | `.idea/kimi.yaml` |
| Zed | `~/.config/zed/settings.json` |
| Vim/Neovim | `g:kimi_acp_enabled` |

### ACP Config File
- Location: `config/acp-tier1380-omega.json`
- Features: Matrix telemetry, Chrome state, Bun BLAST, Skills compliance

See [ACP Integration Guide](docs/ACP-INTEGRATION.md) for details.

## Tier-1380 OMEGA Commit Flow Skill

A **flow skill** for perfect commit governance with automated validation and message generation.

### Loading the Flow

```
/flow:tier1380-commit-flow
```

Or as skill:
```
/skill:tier1380-commit-flow
```

### Slash Commands

| Command | Description |
|---------|-------------|
| `/commit [msg]` | Execute perfect commit workflow |
| `/governance [scope]` | Run governance checks |
| `/flow [step]` | Execute specific flow step |
| `/lint` | Run Biome lint |
| `/test` | Run tests |
| `/typecheck` | Run TypeScript check |
| `/commit-msg` | Generate commit message |
| `/validate-msg "msg"` | Validate message format |

### Flow Steps

1. **Stage** - Stage all changes
2. **Lint** - Run Biome lint (auto-fix if requested)
3. **Type Check** - Run TypeScript validation
4. **Test** - Run relevant test suite
5. **Generate Message** - Auto-generate commit message
6. **Commit** - Create commit with perfect message
7. **Push** (optional) - Push to origin

### Commit Message Format

```
[DOMAIN][COMPONENT:NAME][TIER:XXXX] Brief description

Examples:
[RUNTIME][COMPONENT:CHROME][TIER:1380] Fix entropy calc
[PLATFORM][COMPONENT:MATRIX][TIER:1380] Update col 45 threshold
[TEST][COMPONENT:SKILLS][TIER:1380] Add compliance test
```

### Flow Scripts

Located in `.agents/skills/tier1380-commit-flow/scripts/`:

```bash
# Validate commit message
bun .agents/skills/tier1380-commit-flow/scripts/validate-message.ts "[RUNTIME][CHROME][TIER:1380] Fix"

# Run governance checks
bun .agents/skills/tier1380-commit-flow/scripts/governance-check.ts [scope]

# Generate commit message
bun .agents/skills/tier1380-commit-flow/scripts/generate-message.ts

# Execute flow
bun .agents/skills/tier1380-commit-flow/scripts/flow-executor.ts [step] [--fix] [--push]
```

### Governance Rules

See `.agents/skills/tier1380-commit-flow/references/GOVERNANCE.md`

- Biome lint/format compliance
- TypeScript strict mode
- 100% skills compliance (Col 89-95)
- Security standards
- Performance requirements

### References

- **[GOVERNANCE.md](.agents/skills/tier1380-commit-flow/references/GOVERNANCE.md)** - Complete governance rules
- **[SLASH_CMDS.md](.agents/skills/tier1380-commit-flow/references/SLASH_CMDS.md)** - All slash commands
