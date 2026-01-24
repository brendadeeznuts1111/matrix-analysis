# Terminal UI & Internationalization (I18n) Guidelines

As of Bun v1.3.6, we officially deprecate the use of `.length` for calculating terminal layouts. All CLI tools must use `Bun.stringWidth` to ensure visual alignment.

## Why .length is Forbidden

Standard JavaScript string length counts UTF-16 code units, not visual columns:

| String | `.length` | `Bun.stringWidth` | Why |
|--------|-----------|-------------------|-----|
| `🇺🇸` | 4 | 2 | Flag = 2 regional indicators |
| `👨‍👩‍👧` | 8 | 2 | Family = ZWJ sequence |
| `\x1b[32mText\x1b[0m` | 13 | 4 | ANSI codes are invisible |
| `日本語` | 3 | 6 | CJK = 2 columns each |
| `café` | 4 | 4 | Combining marks vary |

## Implementation Standards

### Table Alignment

Do not use `String.prototype.padEnd()` - it relies on `.length`:

```typescript
// WRONG: Uses .length internally
cell.padEnd(20);

// CORRECT: Visual width alignment
function alignCell(content: string, targetWidth: number): string {
  const visibleWidth = Bun.stringWidth(content);
  const padding = Math.max(0, targetWidth - visibleWidth);
  return content + " ".repeat(padding);
}

// For tables, calculate column widths first
function getColumnWidths(rows: string[][]): number[] {
  return rows[0].map((_, colIdx) =>
    Math.max(...rows.map(row => Bun.stringWidth(row[colIdx] ?? "")))
  );
}
```

### Progress Bars

Calculate available width dynamically:

```typescript
function renderProgress(percent: number, label: string): string {
  const termWidth = process.stdout.columns || 80;
  const labelWidth = Bun.stringWidth(label);
  const barWidth = termWidth - labelWidth - 10; // margins

  const filled = Math.floor(barWidth * percent);
  const empty = barWidth - filled;

  return `${label} [${"█".repeat(filled)}${"░".repeat(empty)}] ${(percent * 100).toFixed(0)}%`;
}
```

### Truncation

Truncate by visual width, not character count:

```typescript
function truncate(text: string, maxWidth: number, ellipsis = "…"): string {
  if (Bun.stringWidth(text) <= maxWidth) return text;

  const ellipsisWidth = Bun.stringWidth(ellipsis);
  let result = "";
  let width = 0;

  for (const char of text) {
    const charWidth = Bun.stringWidth(char);
    if (width + charWidth + ellipsisWidth > maxWidth) break;
    result += char;
    width += charWidth;
  }

  return result + ellipsis;
}
```

## Performance

`Bun.stringWidth` is implemented in native C++:

- **O(n) single pass** through string
- **Zero-width detection** via Unicode bitmaps
- **Grapheme clustering** for emoji sequences
- **ANSI state machine** for escape codes
- **~50-100x faster** than npm `string-width`

```typescript
// Benchmark: 10,000 iterations of complex string
const str = "Hello \x1b[32mWorld\x1b[0m 👨‍👩‍👧🇺🇸";

console.time("Bun.stringWidth");
for (let i = 0; i < 10000; i++) Bun.stringWidth(str);
console.timeEnd("Bun.stringWidth"); // ~5ms
```

## International Text Support

`Bun.stringWidth` correctly handles all scripts:

```typescript
const scripts = {
  arabic: "مُبَرْمَج",      // Programmer (RTL, combining marks)
  hindi: "प्रोग्रामर",       // Programmer (Devanagari clusters)
  thai: "โปรแกรมเมอร์",    // Programmer (no spaces, marks)
  japanese: "プログラマー",  // Programmer (full-width katakana)
  korean: "프로그래머",      // Programmer (Hangul)
};

// All return accurate column counts for terminal display
```

## Migration from string-width

```typescript
// BEFORE
import stringWidth from "string-width";
const width = stringWidth(text);

// AFTER
const width = Bun.stringWidth(text);

// Benefits:
// - No dependency
// - Native speed
// - Unicode 15.0 support
// - Built into runtime
```

## CI Verification

Run the verification script before merging UI changes:

```bash
bun run tools/verify-ui.ts "Your test string here"
```

## Related

- [Bun Windows Compatibility](./bun-windows-compat.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - CLI output standards
