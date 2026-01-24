#!/usr/bin/env bun
/**
 * Terminal UI Width Verification Tool
 *
 * Usage:
 *   bun run tools/verify-ui.ts "Your test string"
 *   bun run tools/verify-ui.ts --demo
 *   bun run tools/verify-ui.ts --check "string1" "string2" ...
 */

const args = Bun.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
  console.log(`
Terminal UI Width Verification Tool

Usage:
  bun run tools/verify-ui.ts "string"     Test a single string
  bun run tools/verify-ui.ts --demo       Run demo with common cases
  bun run tools/verify-ui.ts --check ...  Check multiple strings

Examples:
  bun run tools/verify-ui.ts "🇺🇸 Hello"
  bun run tools/verify-ui.ts --demo
`);
  process.exit(0);
}

interface WidthResult {
  string: string;
  jsLength: number;
  visualWidth: number;
  difference: number;
}

function analyzeString(str: string): WidthResult {
  const jsLength = str.length;
  const visualWidth = Bun.stringWidth(str);
  return {
    string: str.length > 30 ? str.slice(0, 27) + "..." : str,
    jsLength,
    visualWidth,
    difference: jsLength - visualWidth,
  };
}

function printResult(result: WidthResult): void {
  const status = result.difference === 0 ? "=" : result.difference > 0 ? ">" : "<";
  console.log(`"${result.string}"`);
  console.log(`  .length:        ${result.jsLength}`);
  console.log(`  stringWidth:    ${result.visualWidth}`);
  console.log(`  difference:     ${result.difference} (length ${status} visual)`);
  console.log();
}

if (args[0] === "--demo") {
  const demos = [
    // Emoji
    { label: "Flag emoji", value: "🇺🇸" },
    { label: "Family ZWJ", value: "👨‍👩‍👧" },
    { label: "Skin tone", value: "👋🏽" },
    { label: "Simple emoji", value: "🚀" },

    // ANSI
    { label: "ANSI green", value: "\x1b[32mGreen\x1b[0m" },
    { label: "ANSI bold red", value: "\x1b[1;31mBold Red\x1b[0m" },
    { label: "ANSI 256 color", value: "\x1b[38;5;208mOrange\x1b[0m" },

    // CJK
    { label: "Japanese", value: "日本語" },
    { label: "Korean", value: "한국어" },
    { label: "Chinese", value: "中文" },

    // Mixed
    { label: "Mixed content", value: "Hello 🌍 世界!" },
    { label: "Status line", value: "✅ Build passed in 2.3s" },
    { label: "Full example", value: "🇺🇸 \x1b[32mSuccess\x1b[0m 日本" },
  ];

  console.log("=== Bun.stringWidth Demo ===\n");

  const results = demos.map(d => ({
    Label: d.label,
    String: d.value.length > 20 ? d.value.slice(0, 17) + "..." : d.value,
    ".length": d.value.length,
    "Visual": Bun.stringWidth(d.value),
    "Diff": d.value.length - Bun.stringWidth(d.value),
  }));

  console.log(Bun.inspect.table(results, undefined, { colors: true }));

  console.log("\nKey insights:");
  console.log("- Emoji flags: 4 chars → 2 columns (regional indicators)");
  console.log("- ZWJ sequences: 8 chars → 2 columns (joined emoji)");
  console.log("- ANSI codes: invisible (stripped from count)");
  console.log("- CJK: 1 char → 2 columns (full-width)");

  process.exit(0);
}

if (args[0] === "--check") {
  const strings = args.slice(1);
  if (strings.length === 0) {
    console.error("Error: --check requires at least one string");
    process.exit(1);
  }

  console.log("=== Width Check ===\n");

  const results = strings.map(s => ({
    String: s.length > 30 ? s.slice(0, 27) + "..." : s,
    ".length": s.length,
    "Visual": Bun.stringWidth(s),
  }));

  console.log(Bun.inspect.table(results, undefined, { colors: true }));
  process.exit(0);
}

// Single string analysis
const testString = args.join(" ");
console.log("=== String Width Analysis ===\n");
printResult(analyzeString(testString));

// Show character breakdown for complex strings
if (testString.length !== Bun.stringWidth(testString)) {
  console.log("Character breakdown:");
  let pos = 0;
  for (const char of testString) {
    const width = Bun.stringWidth(char);
    const hex = [...char].map(c => c.codePointAt(0)?.toString(16).padStart(4, "0")).join(" ");
    console.log(`  [${pos}] "${char}" → ${width} col(s) (U+${hex})`);
    pos++;
  }
}
