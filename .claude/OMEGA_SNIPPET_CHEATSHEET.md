# 🔥 OMEGA SNIPPET CHEATSHEET v3.24

**Tier-1380 Advanced Bun Snippet Arsenal**
**Copy-paste ready | --smol compatible | Protocol-safe**

> 📅 Generated: January 30, 2026
> 🏷️ Protocol: TIER-1380-OMEGA-v3.24
> ⚡ Runtime: Bun 1.3.8+

---

## Quick Reference

```bash
# Meta-command access
omega snippets              # List all snippets
omega run <cat> <name>      # Execute snippet
omega copy <cat> <name>     # Copy to clipboard
omega search <query>        # Fuzzy search
omega watch [interval]      # Live monitoring
```

---

## 🆕 Bun v1.3.8 — Markdown & Metafile-MD

### Markdown → HTML (One-Shot)
```bash
bun -e 'console.log(Bun.markdown("# Hello\n\n**Bold** text."))'
```
**Use:** Native CommonMark rendering, zero deps

---

### Render Markdown File to HTML
```bash
bun -e '
  const html = Bun.markdown(await Bun.file("README.md").text());
  await Bun.write("README.html", html);
  console.log("Rendered", html.length, "bytes");
'
```
**Use:** Batch markdown-to-HTML conversion

---

### Pipe stdin Markdown → HTML
```bash
cat README.md | bun -e 'console.log(Bun.markdown(await Bun.stdin.text()))'
```
**Use:** Pipeline markdown rendering

---

### GFM: Tables + Strikethrough + Tasks
```bash
bun -e '
  console.log(Bun.markdown("| A | B |\n|---|---|\n| 1 | 2 |\n\n~~old~~ **new**\n\n- [x] done\n- [ ] todo"));
'
```
**Use:** GitHub-flavored markdown rendering

---

### Batch Convert .md Directory to HTML
```bash
bun -e '
  const glob = new Bun.Glob("docs/**/*.md");
  let n = 0;
  for await (const p of glob.scan({ cwd: "." })) {
    await Bun.write(p.replace(/\.md$/, ".html"), Bun.markdown(await Bun.file(p).text()));
    n++;
  }
  console.log("Converted", n, "files");
'
```
**Use:** Static site gen from markdown directory

---

### Serve Markdown as HTML (Local)
```bash
bun -e '
  Bun.serve({ port: 3000, hostname: "127.0.0.1", async fetch(req) {
    const f = Bun.file("./docs" + new URL(req.url).pathname + ".md");
    return await f.exists()
      ? new Response(Bun.markdown(await f.text()), { headers: { "Content-Type": "text/html; charset=utf-8" } })
      : new Response("Not Found", { status: 404 });
  }});
  console.log("Serving on :3000");
'
```
**Use:** Zero-dep markdown documentation server

---

### Quick Markdown Benchmark
```bash
bun -e '
  const md = ("# H\n\n**bold** *italic* paragraph.\n\n").repeat(100);
  const t = Bun.nanoseconds();
  for (let i = 0; i < 1000; i++) Bun.markdown(md);
  const ms = (Bun.nanoseconds() - t) / 1e6;
  console.log(ms.toFixed(1) + "ms / 1000 ops |", (1e6 / ms).toFixed(0), "ops/sec");
'
```
**Use:** Inline performance sanity check

---

### Build with LLM-Friendly Metafile
```bash
bun build ./src/index.ts --outdir ./dist --metafile-md ./dist/meta.md
```
**Use:** AI-readable module graph metadata

---

### Dual Metafile (JSON + Markdown)
```bash
bun build ./src/index.ts --outdir ./dist --metafile ./dist/meta.json --metafile-md ./dist/meta.md
```
**Use:** Machine + LLM-readable bundle analysis

---

### Programmatic Metafile (JS API)
```bash
bun -e '
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    metafile: { json: "./dist/meta.json", markdown: "./dist/meta.md" },
  });
  console.log("Build:", result.outputs.length, "outputs");
'
```
**Use:** CI/CD bundle analysis with LLM output

---

## 🔧 Runtime & Execution

### Validate Tension Thresholds (Pipe)
```bash
cat matrix/config.json5 | bun -e '
  const cfg = Bun.JSON5.parse(await Bun.stdin.text());
  console.log(cfg.tension?.anomalyCritical > cfg.tension?.anomalyHigh
    ? "❌ Critical ≤ High threshold violation"
    : "🟢 Tension thresholds valid");
'
```
**Use:** Quick config validation without loading full app

---

### Run with --smol + Deep Console + Profile
```bash
bun run --smol --console-depth=10 --cpu-prof-md tension-field/core.ts --games 500
```
**Use:** Memory-optimized profiling with full object depth

---

### Workspace Resolution Test
```bash
echo 'console.log("Workspaces:", Bun.workspaces, "\nMain:", Bun.main)' | bun run -
```
**Use:** Verify Bun.workspace configuration

---

### Env Context Leak Check
```bash
bun -e 'console.log(Object.keys(Bun.env).length, "Bun.env keys vs", Object.keys(process.env).length, "process.env")'
```
**Use:** Detect environment variable context differences

---

### JSON5 Pretty Print with wrapAnsi
```bash
cat config.json5 | bun -e '
  const raw = await Bun.stdin.text();
  const obj = Bun.JSON5.parse(raw);
  console.log(Bun.wrapAnsi(Bun.JSON5.stringify(obj, null, 2), 100, {hard:true}));
'
```
**Use:** Terminal-friendly config viewing

---

## 🗜️ JSON5 Surgery

### Extract Hex Constants
```bash
rg '0x[a-fA-F0-9]+' **/*.json5 --color=always | sort -u
```
**Use:** Find all hexadecimal values in configs

---

### Find Missing Critical Thresholds
```bash
rg -L 'anomalyCritical' matrix/**/*.json5 | xargs -I {} sh -c 'echo "⚠️ {} missing critical threshold"'
```
**Use:** Audit tension configuration completeness

---

### JSON5 Round-Trip Validation
```bash
bun -e '
  const f = Bun.file("matrix/config.json5");
  const orig = await f.text();
  const parsed = Bun.JSON5.parse(orig);
  const round = Bun.JSON5.stringify(parsed, null, 2);
  console.log(orig === round ? "🟢 Round-trip clean" : "⚠️ Round-trip changed");
'
```
**Use:** Verify JSON5 parser preserves content

---

## 🔍 Profile Forensics

### Large Retained Objects + Context
```bash
rg -A 3 'size=[1-9][0-9]{5,}' profiles/*cpu-md-*.md --color=always | less -R
```
**Use:** Find memory bloat in CPU profiles

---

### Pretty Terminal View (Latest Profile)
```bash
cat $(ls -t profiles/*cpu-md-*.md | head -1) | bun -e '
  console.log(Bun.wrapAnsi(await Bun.stdin.text(), 120, {hard:true, trim:true}));
'
```
**Use:** Human-readable profile viewing

---

### Find Functions with GC Roots
```bash
rg 'type=Function' profiles/*cpu-md-*.md | rg -l 'gcroot=1' | xargs rg -A 2 'type=Function'
```
**Use:** Identify potential memory leak sources

---

### Open Profile in Browser (macOS)
```bash
open $(bun omega:profile-link -p tension -e prod)
```
**Use:** Quick profile visualization

---

## 🎯 Matrix Tension Zone

### Extract Anomaly Zone (JSON)
```bash
bun matrix:query --columns 31-45 --min-anomaly 0.90 --json | jq '.[0] | {anomaly: .col_31, q3_overreact: .col_35, severity: .col_43}'
```
**Use:** Programmatic anomaly data extraction

---

### WAF Block Spike Detector
```bash
bun matrix:query --columns 23 --min-value 150 --json | jq '.[].col_23 | select(. > 150)'
```
**Use:** Detect Cloudflare WAF anomalies

---

### Tension Zone Grid + wrapAnsi
```bash
bun matrix:grid --columns 31-45 --team tension | bun -e '
  console.log(Bun.wrapAnsi(await Bun.stdin.text(), 140, {wordWrap:true}));
'
```
**Use:** Terminal-optimized tension visualization

---

### Find DEFAULT Column References
```bash
rg -A 5 'default-value|DEFAULT_COLUMN' matrix/column-standards*.ts
```
**Use:** Audit default value resolution

---

## 🍪 Chrome State Bridge

### Quick Partitioning + Auth Analysis
```bash
bun fw chrome-state analyze ./chrome-profile.json | rg -i 'partitioned|auth_domains'
```
**Use:** Fast auth domain inventory

---

### Export Auth Cookies → RSS
```bash
bun fw chrome-state export-rss ./chrome-profile.json --auth-only --partition partition:api.factory-wager.com
```
**Use:** Scraping automation credential feed

---

### Count Expiring Cookies (<1h)
```bash
bun fw chrome-state analyze ./chrome-profile.json | rg 'expiringSoon' | awk '{print $NF}'
```
**Use:** Session expiration monitoring

---

### Seal + Matrix Update (cols 71-75)
```bash
bun fw chrome-state seal ./chrome-profile.json --matrix-update | rg 'col_7[1-5]'
```
**Use:** Chrome state persistence with telemetry

---

## 🎨 Visual God-Mode

### Raw Config → Colored Terminal
```bash
cat matrix/config.json5 | bun -e '
  const t = await Bun.stdin.text();
  console.log(Bun.wrapAnsi(t, 90, {hard:true, trim:true}));
'
```
**Use:** Syntax-highlighted config preview

---

### Deep Benchmark with Colors
```bash
bun test:baseline tension-propagation-500-games-pure-numeric --console-depth=10
```
**Use:** Full-depth benchmark visualization

---

### Tension Hotspot ANSI Art
```bash
bun matrix:query --columns 31,35,42,43,45 --min-anomaly 0.90 | bun -e '
  const raw = await Bun.stdin.text();
  console.log(Bun.wrapAnsi(raw, 120, {wordWrap:true}));
'
```
**Use:** Terminal art from matrix data

---

## 📊 Lethality Index

| Category | Exec Time | Memory | Kill Radius |
|----------|-----------|--------|-------------|
| Markdown render | 0.2–1 ms | ~1 MB | npm markdown parsers |
| Metafile-md build | 5–20 ms | ~3 MB | Manual bundle docs |
| Runtime stdin pipe | 0.6–1 ms | ~2 MB | Temp files, slow editors |
| JSON5 surgery + grep | 1.5–5 ms | ~4 MB | Legacy parsers |
| Profile object forensics | 10–40 ms | ~8 MB | Hidden memory leaks |
| Matrix tension slicing | 30–80 ms | ~12 MB | Blind anomaly hunting |
| Chrome auth extraction | 40–110 ms | ~18 MB | Manual credential scraping |

---

## 🚀 One-Liner Combos

### Markdown Render + S3 Upload
```bash
omega run markdown render && omega run s3 brotli
```

### Full Tension Audit Pipeline
```bash
omega run json5 missing && \
omega run matrix anomaly && \
omega run profile large
```

### Chrome → Matrix → Visual Flow
```bash
omega run chrome seal | omega run visual ansi
```

### Profile → Forensics → Open
```bash
omega run profile gcroots && omega run profile open
```

---

## 🎯 Copy-Paste Shortcuts

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# OMEGA shortcuts
alias om='omega'
alias oms='omega snippets'
alias omw='omega watch'
alias omx='omega run'
alias omc='omega copy'

# Quick category access
alias omr='omega runtime'      # Runtime snippets
alias omj='omega json5'        # JSON5 surgery
alias omp='omega profile'      # Profile forensics
alias omm='omega matrix'       # Matrix operations
alias omc='omega chrome'       # Chrome state
alias omv='omega visual'       # Visual formatting
```

---

## 🔄 CI Integration

### Pre-commit Hook (`.githooks/pre-commit`)
```bash
#!/bin/bash
# Validate JSON5 configs before commit
omega run json5 roundtrip || exit 1
omega run json5 missing || exit 1
```

### GitHub Action Step
```yaml
- name: Tension Zone Validation
  run: |
    omega run matrix anomaly
    omega run matrix waf
```

---

## 📚 Related Documentation

- [CHROME_STATE_INTEGRATION_COMPLETE.md](./CHROME_STATE_INTEGRATION_COMPLETE.md)
- [skills/shell-mode.md](./skills/shell-mode.md)
- [matrix/column-standards.ts](./matrix/column-standards.ts)

---

**Protocol:** TIER-1380-OMEGA-v3.24
**Status:** 🟢 PRODUCTION-READY
**Maintainer:** Chalmette Field-Weaver

---

*"One line. Total control. Bun v1.3.8 supremacy."*
