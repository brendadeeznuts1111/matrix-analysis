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
| `docs:repo` | `bun run docs:repo` | oven-sh/bun repo + releases URLs |
| `docs:deps` | `bun run docs:deps` | Package manager + add dependency URLs |
| `docs:compat` | `bun run docs:compat` | Node.js compatibility doc URL |
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
| **GetBunLinks** | Shop, blog, guides, RSS; repo (main + releases); dependencies (pm, install/add); Node.js compatibility. |

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
| `bun://docs/links` | Shop, blog, guides, RSS; repo; dependencies; Node.js compatibility (JSON). |

## RSS parser (Tier-1380 hardened, Bun-safe)

- **`mcp-bun-docs/rss.ts`**: `parseRSS(url, options?)` → `{ feed, audit }`; `parseRSSLegacy(url)` → feed only. **`safeRSSPreview(input, options?)`** — Col-89 compliant, XSS-safe title/preview: ANSI strip, GB9c-aware width, word-boundary truncation, optional `onViolation` audit hook. Types: `RSSFeed`, `RSSItem`, `RSSFeedAudit`, `ParseRSSOptions`, `SafeRSSPreviewOptions`, `SafeRSSPreviewViolation`.
- **Hardening**: User-Agent always set; `AbortSignal.timeout(10000)` on fetch; try/catch + parsererror check; optional file cache (ETag / If-Modified-Since) via `cacheDir`; `onAudit(fetchTimeMs, sizeBytes, parseTimeMs)` for logging.
- **Callers**: Escape displayed content with `Bun.escapeHTML`; enforce Col-89 with `Bun.stringWidth` + `Bun.wrapAnsi`.
- **Example**: `bun run rss:parse` — parses `BUN_CHANGELOG_RSS`, logs audit to stderr, prints latest 3 items Col-89 safe.

## Base URL (standardized)

- **`BUN_BASE_URL` (https://bun.com)**: Single canonical base for docs, reference, guides, blog, RSS. All doc URLs are derived from it so the codebase is not confusing.
- **`BUN_INSTALL_SCRIPT_URL` (https://bun.sh/install)**: Only bun.sh URL — canonical in official install instructions (`curl -fsSL https://bun.sh/install | bash`).
- **`BUN_URL_CONFIG`**: Object with `base`, `docs`, `reference`, `changelogRSS`, `blogRss`, `installScript`, `globalsAPI` for dashboard/audit.
- **`getUrlCanonicalizationAuditEvent()`**: Returns `{ event: "URL_CANONICALIZATION_COMPLETE", ts, bun_version?, col89_safe, details, glyph }` for `auditRepo.append()`; details are Col-89 safe (Bun.escapeHTML when in Bun).
- **`getRssCanonicalizationAuditEvent()`**: Async. Returns `{ event: "RSS_CANONICALIZATION_LOCKED", ts, bun_version?, col89_safe, details, feed_preview_width?, glyph }`; fetches unified feed and computes width of first 200 chars. Use for Tier-1380 RSS checkpoint audit.
- **Col-89 (doc link preview)**: `COL89_MAX = 89`, `getDocLinkWidth(url)` (uses `Bun.stringWidth(url, { countAnsiEscapeCodes: false })`), `assertCol89(text, context?)` to width-check generated doc links.
- **Blog RSS (investigation)**: There is **no separate /blog/rss.xml** — both `bun.com/blog/rss.xml` and `bun.sh/blog/rss.xml` return 404. The official feed is **BUN_CHANGELOG_RSS** (`bun.com/rss.xml` / `bun.sh/rss.xml`, 200 application/xml). Blog HTML on bun.com/blog links only to `bun.com/rss.xml`. So `BUN_BLOG_RSS_URL` is set to `BUN_CHANGELOG_RSS`; use it for blog/changelog.

### Dashboard / audit usage

```ts
import { BUN_URL_CONFIG, getUrlCanonicalizationAuditEvent } from "mcp-bun-docs/lib.ts";

// In dashboard startup or auditRepo.append wrapper
const urlConfig = BUN_URL_CONFIG; // base, docs, reference, changelogRSS, blogRss, installScript, globalsAPI

const ev = getUrlCanonicalizationAuditEvent();
await auditRepo.append(ev);
```

## Reference links, feedback, bun-types

- **Reference links**: Use `ListBunReferenceLinks` or resource `bun://docs/reference-links` for fileAPI, httpServer, shell, test, bunTest, bunTypes, bunApis, webApis, nodeApi, etc.
- **Feedback**: Use `GetBunFeedback` or resource `bun://docs/feedback` for "upgrade first, then search issues" and docs URL.
- **bun-types**: Use `GetBunTypesInfo` or resource `bun://docs/bun-types` for oven-sh/bun TypeScript definitions (README, authoring, key .d.ts files).
- **Shop, blog, guides, RSS, repo, deps, compat**: Use `GetBunLinks` or resource `bun://docs/links` for shop, blog, guides, RSS, repo (main + releases), dependencies (pm, install/add), and Node.js compatibility.

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
