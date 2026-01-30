# 🔥 OMEGA SNIPPET BIBLE v3.25

**Tier-1380 Advanced Bun Snippet Arsenal**
**Bun v1.3.8 Supremacy | Markdown | Metafile-MD | Built-ins | S3 | FFI | Mimalloc | Release Pipeline**

> 📅 Generated: January 30, 2026
> 🏷️ Protocol: TIER-1380-OMEGA-v3.25
> ⚡ Runtime: Bun 1.3.8+
> 📦 Snippets: 45+ across 13 categories

---

## Quick Reference

```bash
# Meta-command access
omega snippets              # List all snippets
omega run <cat> <name>      # Execute snippet
omega copy <cat> <name>     # Copy to clipboard
omega search <query>        # Fuzzy search
omega watch [interval]      # Live monitoring

# Release pipeline
./.githooks/pre-release patch   # Atomic release flow
```

---

## 🆕 NEW IN v3.25 — Bun v1.3.8 Supremacy

### **markdown** — Builtin CommonMark Parser (Zig)

#### `render` — Markdown → HTML One-Shot

```bash
bun -e '
  const html = Bun.markdown("# Hello\n\n**Bold** and *italic*.");
  console.log(html);
'
```

**Feature:** Native CommonMark-compliant parser, zero deps
**Use:** Documentation rendering, static site generation

---

#### `filerender` — Render Markdown File to HTML

```bash
bun -e '
  const md = await Bun.file("README.md").text();
  const html = Bun.markdown(md);
  await Bun.write("README.html", html);
  console.log("Rendered", html.length, "bytes of HTML");
'
```

**Use:** Batch markdown-to-HTML conversion

---

#### `mdserve` — Serve Markdown Directory as HTML

```bash
bun -e '
  Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url);
      const mdFile = Bun.file("./docs" + url.pathname + ".md");
      if (await mdFile.exists()) {
        return new Response(Bun.markdown(await mdFile.text()), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
  });
  console.log("Serving docs on :3000");
'
```

**Use:** Zero-dependency markdown documentation server

---

#### `mdpipe` — Pipe stdin Markdown → HTML stdout

```bash
cat README.md | bun -e 'console.log(Bun.markdown(await Bun.stdin.text()))'
```

**Use:** Pipeline markdown rendering

---

#### `mdgfm` — GFM Table + Strikethrough + Task Lists

```bash
bun -e '
  const md = `| Feature | Status |
|---------|--------|
| Tables | Done |
| ~~Old API~~ | Replaced |

- [x] Parse markdown
- [ ] Ship to prod`;
  console.log(Bun.markdown(md));
'
```

**Feature:** GFM extensions: tables, strikethrough, task lists, autolinks
**Use:** GitHub-flavored content rendering

---

#### `mdbatch` — Batch Convert Directory of .md Files

```bash
bun -e '
  const glob = new Bun.Glob("docs/**/*.md");
  let count = 0;
  for await (const path of glob.scan({ cwd: "." })) {
    const md = await Bun.file(path).text();
    const html = Bun.markdown(md);
    const outPath = path.replace(/\.md$/, ".html");
    await Bun.write(outPath, html);
    count++;
  }
  console.log("Converted", count, "files");
'
```

**Use:** Static site generation from markdown directory

---

#### `mdbench` — Quick Inline Benchmark

```bash
bun -e '
  const md = ("# Test\n\n" + "Paragraph with **bold** and *italic*.\n\n").repeat(100);
  const start = Bun.nanoseconds();
  for (let i = 0; i < 1000; i++) Bun.markdown(md);
  const elapsed = (Bun.nanoseconds() - start) / 1e6;
  console.log(elapsed.toFixed(1) + "ms for 1000 iterations");
  console.log((1000 / (elapsed / 1000)).toFixed(0) + " ops/sec");
'
```

**Use:** Quick performance sanity check

---

### **metafile** — LLM-Friendly Bundle Metadata

#### `metafilemd` — Build with Markdown Metafile

```bash
bun build ./src/index.ts --outdir ./dist --metafile-md ./dist/meta.md
```

**Feature:** `--metafile-md` outputs module graph as LLM-readable markdown
**Use:** AI-assisted bundle analysis, documentation generation

---

#### `metafiledual` — JSON + Markdown Metafiles

```bash
bun build ./src/index.ts --outdir ./dist --metafile ./dist/meta.json --metafile-md ./dist/meta.md
```

**Use:** Both machine-readable and LLM-friendly bundle metadata

---

#### `metafileapi` — Programmatic Metafile (JS API)

```bash
bun -e '
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    metafile: {
      json: "./dist/meta.json",
      markdown: "./dist/meta.md",
    },
  });
  console.log("Build complete:", result.outputs.length, "outputs");
'
```

**Use:** CI/CD bundle analysis with LLM-friendly output

---

## 📚 Legacy v3.24 — Bun v1.3.7 Supremacy

### **builtin** — Faster String/RegExp Built-ins

#### `iswellformed` — Benchmark String.isWellFormed vs Manual
```bash
bun -e '
  const s = "Hello 👋 world";
  console.time("isWellFormed");
  for (let i = 0; i < 1e6; i++) s.isWellFormed();
  console.timeEnd("isWellFormed");
  console.time("manual");
  for (let i = 0; i < 1e6; i++) { try { new TextDecoder().decode(new TextEncoder().encode(s)) } catch {} }
  console.timeEnd("manual");
'
```
**Speed:** 5.2–5.4× faster than manual TextEncoder/Decoder  
**Use:** Unicode validation at scale

---

#### `regexp` — RegExp [Symbol.replace] C++ Speed Test
```bash
bun -e '
  const text = "a".repeat(1e5) + "b".repeat(1e5);
  console.time("replace");
  text.replace(/a/g, "X");
  console.timeEnd("replace");
'
```
**Speed:** Native C++ implementation  
**Use:** Global string replacement benchmarking

---

#### `unicodestream` — Pipe → isWellFormed + toWellFormed
```bash
cat large-unicode.txt | bun -e '
  const raw = await Bun.stdin.text();
  console.log(raw.isWellFormed() ? "Valid" : "Invalid");
  console.log(raw.toWellFormed().slice(0, 100) + "...");
'
```
**Use:** Stream validation and sanitization

---

### **s3** — Native contentEncoding (gzip/br/deflate)

#### `brotli` — One-Shot Brotli Upload to R2/S3
```bash
bun -e '
  const data = await Bun.file("data.json").arrayBuffer();
  const compressed = await Bun.compress("br", data);
  await (new S3Client({bucket:"omega-profiles"})).file("data.json.br").write(compressed, {
    contentEncoding: "br",
    contentType: "application/json"
  });
  console.log("Brotli uploaded ✓");
'
```
**Feature:** Native S3 contentEncoding support  
**Use:** Compressed JSON/API responses

---

#### `gzipstream` — Streaming Log Upload with Gzip
```bash
bun -e '
  let buf = ""; const s3 = new S3Client({bucket:"logs"});
  for await (const chunk of Bun.stdin.stream()) {
    buf += new TextDecoder().decode(chunk);
    if (buf.length > 1e6) {
      const compressed = await Bun.compress("gzip", new TextEncoder().encode(buf));
      await s3.file(`logs/${Date.now()}.log.gz`).write(compressed, { contentEncoding: "gzip" });
      buf = "";
    }
  }
'
```
**Use:** Streaming log aggregation to S3

---

### **ffi** — C_INCLUDE_PATH / LIBRARY_PATH Support

#### `nixos` — NixOS-Style Custom Paths
```bash
C_INCLUDE_PATH=/nix/store/.../include LIBRARY_PATH=/nix/store/.../lib bun -e '
  const { cc } = await import("bun:ffi");
  const { symbols: { hello } } = cc({
    source: "hello.c",
    symbols: { hello: { returns: "int" } }
  });
  console.log(hello());
'
```
**Use:** NixOS, custom library paths, non-standard installs

---

#### `compile` — Quick FFI Compile Test
```bash
bun -e '
  const { cc } = await import("bun:ffi");
  const { symbols } = cc({ source: "native.c", symbols: { add: { returns: "int", args: ["int", "int"] } } });
  console.log("ffi compiled:", symbols.add(2, 3));
'
```
**Use:** Native extension compilation testing

---

### **mimalloc** — Mimalloc v3 Memory Efficiency

#### `heap` — Generate Heap Profile
```bash
bun run --smol --heap-prof-md tension-field/core.ts --games 1000
```
**Use:** Multi-threaded memory profiling with Mimalloc v3

---

#### `retained` — Grep Large Retained Objects
```bash
cat profiles/*heap-md-*.md | rg 'retainedSize=[1-9][0-9]{5,}' --color=always
```
**Use:** Find memory bloat in heap profiles

---

#### `compare` — Heap Before/After Comparison
```bash
bun -e '
  const heap = await Bun.gc(false);
  console.log("Heap before:", heap.heapSize);
  const after = await Bun.gc(false);
  console.log("Heap after:", after.heapSize, "Delta:", after.heapSize - heap.heapSize);
'
```
**Use:** Memory delta tracking

---

### **release** — bun pm bump + tag + secrets

#### `bump` — Atomic Bump + Tag + Push
```bash
bun pm bump patch && git tag v$(bun pm show version) && git push --tags
```
**Use:** One-command semantic release

---

#### `link` — Confirm bun link
```bash
bun link && bun link confirm && echo "Linked & confirmed ✓"
```
**Use:** Local package development confirmation

---

#### `template` — Inject Template Number to Secrets
```bash
bun -e '
  const secrets = await Bun.file(".secrets.json").json();
  secrets.templateNumber = Date.now();
  await Bun.write(".secrets.json", JSON.stringify(secrets, null, 2));
  console.log(`Template #${secrets.templateNumber} injected`);
'
```
**Use:** Build numbering, template versioning

---

#### `hotreload` — Hot-Reload Development
```bash
bun run --hot linker/hot-reload.ts
```
**Use:** Development server with hot reload

---

#### `secretsbump` — Template-Aware Version Bump
```bash
cat .secrets.json | bun -e '
  const s = JSON.parse(await Bun.stdin.text());
  console.log(`Bumping to template-v${s.templateNumber}`);
' && bun pm bump patch
```
**Use:** Template-number prefixed releases

---

## 📚 Legacy Categories (v3.23–v3.24)

### **runtime** — Pipe Execution & Flags

```bash
# Validate tension thresholds
cat matrix/config.json5 | bun -e '
  const cfg = Bun.JSON5.parse(await Bun.stdin.text());
  console.log(cfg.tension?.anomalyCritical > cfg.tension?.anomalyHigh
    ? "❌ Critical ≤ High threshold violation"
    : "🟢 Tension thresholds valid");
'

# Run with --smol + profiling
bun run --smol --console-depth=10 --cpu-prof-md tension-field/core.ts --games 500
```

### **json5** — Config Surgery

```bash
# Extract hex constants
rg '0x[a-fA-F0-9]+' **/*.json5 --color=always | sort -u

# Find missing thresholds
rg -L 'anomalyCritical' matrix/**/*.json5 | xargs -I {} sh -c 'echo "⚠️ {} missing critical threshold"'
```

### **profile** — Forensics

```bash
# Large retained objects
rg -A 3 'size=[1-9][0-9]{5,}' profiles/*cpu-md-*.md --color=always | less -R

# Pretty print latest profile
cat $(ls -t profiles/*cpu-md-*.md | head -1) | bun -e '
  console.log(Bun.wrapAnsi(await Bun.stdin.text(), 120, {hard:true, trim:true}));
'
```

### **matrix** — Tension Zones

```bash
# Anomaly query
bun matrix:query --columns 31-45 --min-anomaly 0.90 --json | jq '.[0] | {anomaly: .col_31, q3_overreact: .col_35, severity: .col_43}'

# WAF spike detector
bun matrix:query --columns 23 --min-value 150 --json | jq '.[].col_23 | select(. > 150)'
```

### **chrome** — State Bridge

```bash
# Quick analysis
bun fw chrome-state analyze ./chrome-profile.json | rg -i 'partitioned|auth_domains'

# RSS export
bun fw chrome-state export-rss ./chrome-profile.json --auth-only --partition partition:api.factory-wager.com
```

### **visual** — wrapAnsi Formatting

```bash
# Pretty JSON5
cat matrix/config.json5 | bun -e '
  const t = await Bun.stdin.text();
  console.log(Bun.wrapAnsi(t, 90, {hard:true, trim:true}));
'
```

---

## 🚀 Release Pipeline

### **Atomic Release Flow** (pre-release hook)

```bash
# Run the full pipeline
./.githooks/pre-release patch   # or minor, major
```

**Pipeline Steps:**
1. ✅ Git status clean check
2. ✅ Test suite execution
3. ✅ Mimalloc v3 heap profile generation
4. ✅ CPU profile generation
5. ✅ Template number injection
6. ✅ `bun pm bump <version>`
7. ✅ Git commit + annotated tag
8. ✅ Brotli-compressed profile upload to S3
9. ✅ Push to origin with tags
10. ✅ Summary report

---

## 📊 Lethality Index (v3.24)

| Category | Exec Time | Memory | Kill Radius |
|----------|-----------|--------|-------------|
| markdown render | 0.2–1 ms | ~1 MB | npm markdown parsers |
| metafile-md build | 5–20 ms | ~3 MB | Manual bundle docs |
| builtin (isWellFormed) | 0.4–2 ms | ~1 MB | Manual unicode polyfills |
| s3 contentEncoding | 35–80 ms | ~6 MB | Temp compression files |
| ffi custom paths | 50–150 ms | ~10 MB | NixOS build failures |
| mimalloc v3 heap | 60–200 ms | ~15 MB | Multi-threaded leaks |
| release bump+tag | 0.8–1.5 s | ~8 MB | Manual version bumps |

---

## 🎯 One-Liner Combos

### Full Release with Profiles
```bash
omega run mimalloc heap && \
omega run release bump && \
omega run s3 brotli
```

### Unicode Stream Processing
```bash
cat data.json | omega run builtin unicodestream | \
  omega run s3 gzipstream
```

### FFI + Template Injection
```bash
omega run ffi nixos && \
omega run release template && \
omega run release hotreload
```

---

## 🔧 CI Integration

### GitHub Action
```yaml
- name: OMEGA Release
  run: |
    omega run builtin iswellformed
    omega run s3 brotli
    ./.githooks/pre-release patch
```

### Pre-commit Hook
```bash
# Add to .githooks/pre-commit
omega run json5 roundtrip || exit 1
omega run builtin iswellformed || exit 1
```

---

## 📚 Related Documentation

- [OMEGA_SNIPPET_CHEATSHEET.md](./OMEGA_SNIPPET_CHEATSHEET.md) — v3.23 reference
- [CHROME_STATE_INTEGRATION_COMPLETE.md](./CHROME_STATE_INTEGRATION_COMPLETE.md)
- [README.md](./README.md) — Main project docs

---

**Protocol:** TIER-1380-OMEGA-v3.25
**Status:** 🟢 PRODUCTION-READY
**Maintainer:** Chalmette Field-Weaver

---

*"One line. Total control. Bun v1.3.8 supremacy."*
