# Bun v1.3.8 - Official API Reference

> Source: https://bun.com/blog/bun-v1.3.8
> Released: January 29, 2026
> Fixes: 8 issues (addressing 6 thumbs-up)

---

## New APIs

### Bun.markdown — Builtin CommonMark Markdown Parser

A builtin CommonMark-compliant Markdown parser written in Zig. Zero dependencies,
native performance. Supports GFM extensions and has builtin React rendering support.

Based on [koino](https://github.com/kivikakk/koino) (Zig port of
[comrak](https://github.com/kivikakk/comrak)), maintaining 100% spec-compatibility
with GitHub Flavored Markdown.

#### Basic Usage

```typescript
// Parse markdown to HTML
const html = Bun.markdown("# Hello World\n\nThis is **bold** text.");
// → "<h1>Hello World</h1>\n<p>This is <strong>bold</strong> text.</p>"

// Parse from file
const md = await Bun.file("README.md").text();
const rendered = Bun.markdown(md);

// Pipe stdin → markdown → stdout
// bun -e 'console.log(Bun.markdown(await Bun.stdin.text()))'
```

#### CommonMark Features

All core CommonMark elements are supported:

- **Headings** (h1–h6 via `#` syntax and setext underlines)
- **Emphasis** (`*italic*`, `**bold**`, `***bold italic***`)
- **Code** (inline `` `code` ``, fenced ` ``` `, indented 4-space)
- **Links** (`[text](url)`, `[text](url "title")`)
- **Images** (`![alt](src)`)
- **Lists** (ordered `1.`, unordered `-`/`*`/`+`, nested)
- **Blockquotes** (`>`, nested `>>`)
- **Horizontal rules** (`---`, `***`, `___`)
- **Line breaks** (two trailing spaces)
- **HTML entities** (properly escaped: `<` → `&lt;`)

#### GFM Extensions

GitHub Flavored Markdown extensions are supported:

```typescript
// Tables
Bun.markdown("| A | B |\n|---|---|\n| 1 | 2 |");
// → <table><thead><tr><th>A</th><th>B</th></tr></thead>...

// Strikethrough
Bun.markdown("~~deleted~~");
// → <p><del>deleted</del></p>

// Task lists
Bun.markdown("- [x] done\n- [ ] todo");
// → <ul><li><input type="checkbox" checked disabled> done</li>...

// Autolinks
Bun.markdown("Visit https://bun.com");
// → <p>Visit <a href="https://bun.com">https://bun.com</a></p>
```

#### React Rendering Support

Bun.markdown has builtin support for rendering to React elements
(announced via [HN thread](https://news.ycombinator.com/item?id=46814842)).
This eliminates the need for packages like `react-markdown` or `markdown-to-jsx`.

#### File Pipeline

```typescript
// Pipeline: markdown file → HTML → serve
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const mdFile = Bun.file(`./docs${url.pathname}.md`);
    if (await mdFile.exists()) {
      const html = Bun.markdown(await mdFile.text());
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});
```

#### Batch Directory Conversion

```typescript
const glob = new Bun.Glob("docs/**/*.md");
for await (const path of glob.scan({ cwd: "." })) {
  const html = Bun.markdown(await Bun.file(path).text());
  await Bun.write(path.replace(/\.md$/, ".html"), html);
}
```

**Key details:**
- CommonMark-compliant (full spec)
- GFM extensions: tables, strikethrough, task lists, autolinks
- Builtin React rendering support
- Written in Zig for native performance (koino/comrak lineage)
- No npm dependencies required
- Returns HTML string from markdown input

---

### Bundler: `--metafile-md` — LLM-Friendly Module Graph Metadata

Generate module graph metadata in markdown format optimized for LLM consumption.

#### CLI Usage

```bash
# Markdown metafile only
bun build ./src/index.ts --outdir ./dist --metafile-md ./dist/meta.md

# JSON + Markdown metafiles together
bun build ./src/index.ts --outdir ./dist --metafile ./dist/meta.json --metafile-md ./dist/meta.md
```

#### JavaScript API

```typescript
// Object form — separate JSON and markdown paths
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  metafile: {
    json: "./dist/meta.json",
    markdown: "./dist/meta.md",
  },
});

// String form — JSON only (pre-existing)
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  metafile: "./dist/meta.json",
});

// Boolean form — include in result object (pre-existing)
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  metafile: true,
});
// result.metafile contains the metadata
```

#### Metafile Structure (JSON)

```typescript
interface BuildMetafile {
  inputs: {
    [path: string]: {
      bytes: number;
      imports: Array<{
        path: string;
        kind: ImportKind;
        original?: string;
        external?: boolean;
      }>;
      format?: "esm" | "cjs" | "json" | "css";
    };
  };
  outputs: {
    [path: string]: {
      bytes: number;
      inputs: { [path: string]: { bytesInOutput: number } };
      imports: Array<{ path: string; kind: ImportKind }>;
      exports: string[];
      entryPoint?: string;
      cssBundle?: string;
    };
  };
}
```

**Use cases:**
- Bundle analysis and size tracking
- Dependency graph visualization
- CI bundle size regression detection
- LLM-assisted code analysis and documentation

---

## Bug Fixes

- Fixed regression in `npm install -g bun` on Windows
- 7 additional bug fixes (6 community-reported with thumbs-up)

---

## Inherited APIs (from v1.3.7)

All v1.3.7 APIs remain available. See [BUN_V1.3.7_OFFICIAL_APIS.md](./BUN_V1.3.7_OFFICIAL_APIS.md) for:

| Category | APIs |
|----------|------|
| **Timing** | `Bun.nanoseconds()`, `Bun.sleep()`, `Bun.sleepSync()` |
| **Promises** | `Bun.peek()`, `Bun.peek.status()` |
| **UUID** | `Bun.randomUUIDv7()` |
| **Equality** | `Bun.deepEquals()` |
| **Editor** | `Bun.openInEditor()` |
| **Compression** | `Bun.zstdCompressSync()`, `Bun.zstdDecompressSync()`, `Bun.gzipSync()`, `Bun.deflateSync()` |
| **Text** | `Bun.wrapAnsi()`, `Bun.stringWidth()`, `Bun.escapeHTML()` |
| **JSON** | `Bun.JSON5.parse/stringify`, `Bun.JSONL.parse/parseChunk` |
| **System** | `Bun.which()`, `Bun.version`, `Bun.revision`, `Bun.main`, `Bun.env` |
| **HTTP** | `Bun.serve()`, `fetch` (header preservation), `S3Client` |
| **CLI** | `--cpu-prof-md`, `--heap-prof-md` |

---

## Complete API Summary (v1.3.8)

| Category | APIs | Version |
|----------|------|---------|
| **Markdown** | `Bun.markdown()` | **v1.3.8 NEW** |
| **Bundler** | `--metafile-md`, `metafile: { markdown }` | **v1.3.8 NEW** |
| **Timing** | `Bun.nanoseconds()`, `Bun.sleep()`, `Bun.sleepSync()` | v1.3.7 |
| **Promises** | `Bun.peek()`, `Bun.peek.status()` | v1.3.7 |
| **UUID** | `Bun.randomUUIDv7()` | v1.3.7 |
| **Equality** | `Bun.deepEquals()` | v1.3.7 |
| **Editor** | `Bun.openInEditor()` | v1.3.7 |
| **Compression** | `Bun.zstd*`, `Bun.gzipSync()`, `Bun.deflateSync()` | v1.3.7 |
| **Text** | `Bun.wrapAnsi()`, `Bun.stringWidth()`, `Bun.escapeHTML()`, `Bun.stripANSI()` | v1.3.7 |
| **JSON** | `Bun.JSON5`, `Bun.JSONL` | v1.3.7 |
| **System** | `Bun.which()`, `Bun.version`, `Bun.revision`, `Bun.main` | v1.3.7 |
| **HTTP** | `Bun.serve()`, `fetch`, `S3Client` | v1.3.7 |
| **CLI** | `--cpu-prof-md`, `--heap-prof-md`, `--metafile-md` | v1.3.7+ |

---

## All New APIs Are Native (No Dependencies)

Every API listed above is built into Bun v1.3.8 and requires **zero npm packages**.
