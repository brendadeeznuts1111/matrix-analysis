---
name: stdin-quantum
description: "Zero-copy stdin analysis with RGBA tension gradients, Bun.inspect.table, gzip artifacts"
user-invocable: false
version: 1.5.2
---

# Stdin Quantum Analyzer

Zero-copy stdin processing with per-line tension visualization and compressed artifacts.

---

## Quick Reference

- **Zero-copy stdin** (`Bun.stdin.arrayBuffer()`) — No intermediate string allocation
- **RGBA gradients** (`Bun.color(hsl, "rgba")`) — HSL to RGBA conversion
- **Table output** (`Bun.inspect.table()`) — Formatted console tables
- **Snapshot guard** (`JSON.stringify()`) — Strict equality check
- **Gzip artifact** (`Bun.gzipSync()`) — Level 9 compression

---

## Usage

```bash
# Pipe any text
echo -e "multi\nline\ntext" | bun stdin-quantum-final.ts

# Analyze a file
cat README.md | bun stdin-quantum-final.ts

# From curl
curl -s https://example.com | bun stdin-quantum-final.ts
```

---

## Output Format

```
┌───┬───┬────────┬─────────┬─────────┬────────────────┬──────┐
│   │ # │ length │ tension │ preview │ rgb            │ ansi │
├───┼───┼────────┼─────────┼─────────┼────────────────┼──────┤
│ 0 │ 1 │ 5      │ 6.3%    │ multi   │ [255, 16, 0]   │ ███  │
└───┴───┴────────┴─────────┴─────────┴────────────────┴──────┘
```

- `length` - Character count
- `tension` - Length / 80, capped at 100%
- `preview` - First 20 characters (XSS-safe truncation)
- `rgb` - Color array from tension gradient
- `ansi` - Visual bar with ANSI 24-bit color

---

## Tension Gradient

Maps line length to HSL color (red → yellow → green):

```typescript
const tension = Math.min(1, len / 80);  // 0.0 - 1.0
const hsl = `hsl(${tension * 120} 100% 50%)`;
// tension 0.0 → hsl(0 100% 50%)   → red
// tension 0.5 → hsl(60 100% 50%)  → yellow
// tension 1.0 → hsl(120 100% 50%) → green
```

---

## Core Patterns

### 1. Zero-Copy Stdin

```typescript
// ArrayBuffer avoids string allocation overhead
const raw = await Bun.stdin.arrayBuffer();
const text = new TextDecoder().decode(raw);
```

### 2. RGBA Color Parsing

```typescript
function parseRgba(rgbaStr: string): [number, number, number] {
  const match = rgbaStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
  return match ? [+match[1], +match[2], +match[3]] : [255, 255, 255];
}

const rgba = Bun.color(`hsl(60 100% 50%)`, "rgba");  // "rgba(255, 255, 0, 1)"
const [r, g, b] = parseRgba(rgba);  // [255, 255, 0]
```

### 3. ANSI 24-bit Color

```typescript
const bar = '█'.repeat(Math.max(1, Math.round(tension * 10)));
const ansi = `\x1b[38;2;${r};${g};${b}m${bar}\x1b[0m`;
```

### 4. Strict Snapshot Guard

```typescript
const snap = { lines: stats.length, bytes: raw.byteLength };
const prev = await Bun.file('/tmp/stdin-snapshot.json').json().catch(() => ({}));

if (!Bun.deepEquals(snap, prev)) {
  await Bun.write('/tmp/stdin-snapshot.json', JSON.stringify(snap));
}
```

### 5. Gzipped Artifact

```typescript
const report = {
  meta: { ts: new Date().toISOString(), bytes: raw.byteLength },
  lines: stats
};
const gz = Bun.gzipSync(
  new TextEncoder().encode(JSON.stringify(report)),
  { level: 9 }
);
await Bun.write('/tmp/stdin-quantum.json.gz', gz);
```

---

## Artifacts

- **`/tmp/stdin-snapshot.json`** — `{ lines: N, bytes: N }`
- **`/tmp/stdin-quantum.json.gz`** — Full report with metadata

### Read Gzipped Report

```bash
gunzip -c /tmp/stdin-quantum.json.gz | jq .
```

---

## Integration Examples

### CI Log Analysis

```bash
# Analyze build log tension
cat build.log | bun stdin-quantum-final.ts

# Find high-tension (long) lines
gunzip -c /tmp/stdin-quantum.json.gz | jq '.lines[] | select(.length > 80)'
```

### Webhook Payload

```typescript
import { gunzipSync } from "bun";

const gz = await Bun.file("/tmp/stdin-quantum.json.gz").bytes();
const json = JSON.parse(new TextDecoder().decode(gunzipSync(gz)));

await fetch("https://webhook.site/xxx", {
  method: "POST",
  body: JSON.stringify(json),
  headers: { "Content-Type": "application/json" }
});
```

### Telegram Alert

```typescript
const snap = await Bun.file("/tmp/stdin-snapshot.json").json();
const msg = `📊 Analyzed ${snap.lines} lines (${snap.bytes} bytes)`;

await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
});
```

---

## File Location

```
~/.claude/stdin-quantum-final.ts
```

---

## Version History

- **v1.5.2** (2026-01-18): Fixed Bun API imports, added parseRgba helper
- **v1.5.1** (2026-01-18): Initial release with zero-copy, RGBA gradient, snapshot guard
