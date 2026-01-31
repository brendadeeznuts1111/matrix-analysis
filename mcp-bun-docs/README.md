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

# Bun test CLI options (BUN-TEST-001)
bun run test:validate     # Validate options matrix, exit 1 on invalid
bun run grep:options      # Ripgrep CLI options in mcp-bun-docs
bun run grep:timeout      # Timeout-related options
bun run index:options     # Build .options.index for rg -f queries

# Examples
bun run mcp:example:manifest          # Fetch & inspect manifest
bun run mcp:example:search            # Search "fetch" (default)
bun run mcp:example:search "Bun.serve" # Search custom term
```

## CLI shortcuts (bun-docs)

| Script | Command | Purpose |
|--------|---------|---------|
| `bun-docs` / `docs` | `bun run bun-docs` | CLI help |
| `docs:search` | `bun run docs:search -- "<query>"` | Search Bun docs (markdown) |
| `docs:entry` | `bun run docs:entry -- <term> [--url]` | Curated entry (JSON or URL) |
| `docs:link` | `bun run docs:link -- [key]` | Reference URL or list keys |
| `docs:terms` | `bun run docs:terms -- [--count=N]` | List curated terms |
| `docs:globals` | `bun run docs:globals` | Bun globals + API doc URL |
| `docs:xrefs` | `bun run docs:xrefs -- <term>` | Cross-references for term |
| `docs:feedback` | `bun run docs:feedback` | Upgrade-first guidance |
| `docs:shop` | `bun run docs:shop` | Official Bun shop URL |
| `docs:blog` | `bun run docs:blog` | Bun blog URL |
| `docs:guides` | `bun run docs:guides` | Bun guides index URL |
| `docs:rss` | `bun run docs:rss` | Changelog + blog RSS URLs |
| `docs:version` | `bun run docs:version` | Doc version constants |

## Tools

| Tool | Purpose |
|------|---------|
| **SearchBun** | Search Bun docs (curated + optional Mintlify fallback). Options: query, version, prodSafe, platform. |
| **GetBunDocEntry** | Resolve curated entry by term (e.g. spawn, Bun.serve). Returns path, version, stability, url; optional urlOnly. |
| **ListBunGlobals** | List top-level globals (Bun, $, fetch, Buffer, …) with doc paths and Bun.* API URL. |
| **GetBunDocCrossReferences** | Related doc entries with URLs for a term (from relatedTerms). |
| **ListBunReferenceLinks** | All reference link keys and URLs (fileAPI, bunTest, bunTypes, bunApis, webApis, nodeApi, etc.). |
| **GetBunFeedback** | Feedback/upgrade-first guidance and docs URL. |
| **GetBunTypesInfo** | oven-sh/bun-types: repo, README, authoring, key .d.ts file URLs. |
| **SuggestBunDocTerms** | Partial-match term suggestions (typeahead). Options: query, limit (default 10). |
| **GetBunLinks** | Shop, blog, guides index, and RSS feeds (changelog + blog; blog supports #tag= filter). |

### SearchBun options

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

## Resources

| URI | Description |
|-----|-------------|
| `bun://docs/matrix` | Full matrix: consts, curated terms, weights, entriesV2, perf baselines, test config. |
| `bun://docs/matrix/v1.3.7` | Tier-1380 feature matrix (same content). |
| `bun://docs/matrix/v1.3.7-complete` | v1.3.7 complete matrix (28 entries). |
| `bun://docs/matrix/perf-baselines` | Performance regression gates (Markdown). |
| `bun://profiles/cpu-heap-md` | CPU & Heap profiling (--cpu-prof-md, --heap-prof). |
| `bun://docs/reference-links` | All reference link keys and URLs (JSON). |
| `bun://docs/feedback` | Feedback/upgrade-first guidance (text). |
| `bun://docs/bun-types` | oven-sh/bun-types: repo, README, authoring, key file URLs (JSON). |
| `bun://docs/links` | Shop, blog, guides, RSS feeds (changelog + blog) (JSON). |

## Reference links, feedback, bun-types

- **Reference links**: Use `ListBunReferenceLinks` or resource `bun://docs/reference-links` for fileAPI, httpServer, shell, test, bunTest, bunTypes, bunApis, webApis, nodeApi, etc.
- **Feedback**: Use `GetBunFeedback` or resource `bun://docs/feedback` for "upgrade first, then search issues" and docs URL.
- **bun-types**: Use `GetBunTypesInfo` or resource `bun://docs/bun-types` for oven-sh/bun TypeScript definitions (README, authoring, key .d.ts files).
- **Shop, blog, guides, RSS**: Use `GetBunLinks` or resource `bun://docs/links` for shop, blog, guides index, and RSS feeds (changelog + blog).

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
