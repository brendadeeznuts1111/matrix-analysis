# SearchBun MCP

**Tier-1380 Test Config:** See [docs/TIER-1380-TEST-CONFIG-SPEC.md](docs/TIER-1380-TEST-CONFIG-SPEC.md) for architecture.

--- Server

Implements the **SearchBun** tool from [bun.com/docs/mcp](https://bun.com/docs/mcp) as a local stdio MCP server, since no public HTTP endpoint is documented.

## Quick Start

```bash
# Test manifest (CLI)
bun run mcp:bun-test

# Run server (stdio)
bun run mcp:bun-docs

# Run all tests
bun run mcp:bun-test:suite

# Matrix view (consts, v2 traceability)
bun run mcp:matrix

# CI validation (exit 1 if deprecated)
bun run mcp:ci-validate

# Matrix validation (Col 93, GB9c, security)
bun run matrix:validate --region=us-east --check=all

# Seal lock file
bun run tier1380:seal --matrix=v1.3.7

# RSS hydration
bun run matrix:rss --output=./feeds/bun-v1.3.7.xml

# Secure test run
bun run mcp:secure-test [ci|local|staging]

# Examples
bun run mcp:example:manifest          # Fetch & inspect manifest
bun run mcp:example:search            # Search "fetch" (default)
bun run mcp:example:search "Bun.serve" # Search custom term
```

## Tool: SearchBun

- **query** (required): Search Bun docs
- **version** (optional): Filter by bunMinVersion (e.g. 1.3.6)
- **language** (optional): en, zh, es
- **apiReferenceOnly** (optional): Only API reference pages
- **codeOnly** (optional): Only code snippets
- **prodSafe** (optional): Exclude experimental/deprecated (prod builds)
- **platform** (optional): darwin | linux | win32 — exclude incompatible APIs

## Tier-1380 Matrix v2

`BUN_DOC_ENTRIES` provides traceability fields for CI gating and ACP filtering:

| Field | Purpose |
|-------|---------|
| bunMinVersion | Gate features in polyfills |
| stability | stable \| experimental \| deprecated |
| platforms | darwin, linux, win32 (exclude Windows-incompatible) |
| perfProfile | Auto-benchmark regression baseline |
| security | high \| medium \| low (ZTNA policy) |
| breakingChanges | Migration alerts |
| relatedTerms | Graph traversal for ACP |

**Filter helpers:** `filterEntriesByVersion`, `filterEntriesByStability`, `filterEntriesByPlatform`

**CI:** `bun run mcp:ci-validate` — exits 1 if deprecated entries exist.

**Recent additions (v1.3.5 / v1.3.8):** `Bun.Terminal` (PTY), `bun:bundle feature` (compile-time flags), `pm pack` (lifecycle re-read), `Redis` (7.9x ioredis).

## Cursor / Claude Integration

Add to your MCP config (e.g. `package.json` → `mcp.servers`):

```json
"bun-docs": {
  "command": "bun",
  "args": ["mcp-bun-docs/index.ts"],
  "description": "SearchBun - Search Bun docs"
}
```

## Implementation

- Fetches [bun.com/docs/mcp](https://bun.com/docs/mcp) manifest for validation
- Uses curated doc map when no search API is available
- Tries Mintlify-style `/api/search` as fallback
- Compatible with [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
