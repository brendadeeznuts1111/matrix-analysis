import { bench, group, run } from "mitata";

/**
 * Bun APIs Benchmark Suite
 * Uses mitata for benchmarking (compatible with bun bench)
 *
 * Run with: bun run test/bun-apis.bench.ts
 */

// ANSI colors
const green = Bun.color("hsl(145, 63%, 42%)", "ansi") as string;
const blue = Bun.color("hsl(210, 90%, 55%)", "ansi") as string;
const reset = Bun.color("white", "ansi") as string;

console.log(`\n${green}Bun APIs Benchmark Suite${reset}\n`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hash Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const hashData = new Uint8Array(1024 * 1024); // 1MB
crypto.getRandomValues(hashData);

group("Hash Functions (1MB)", () => {
  bench("Bun.hash (wyhash)", () => {
    Bun.hash(hashData);
  });

  bench("Bun.hash.crc32", () => {
    Bun.hash.crc32(hashData);
  });

  bench("Bun.hash.adler32", () => {
    Bun.hash.adler32(hashData);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Compression
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const compressData = new TextEncoder().encode("Hello, World! ".repeat(10000));

group("Compression (150KB text)", () => {
  bench("Bun.gzipSync", () => {
    Bun.gzipSync(compressData);
  });

  bench("Bun.deflateSync", () => {
    Bun.deflateSync(compressData);
  });

  const gzipped = Bun.gzipSync(compressData);
  bench("Bun.gunzipSync", () => {
    Bun.gunzipSync(gzipped);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JSON Serialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const jsonData = {
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    active: i % 2 === 0,
  })),
};

group("JSON Serialization", () => {
  bench("JSON.stringify", () => {
    JSON.stringify(jsonData);
  });

  bench("Response.json().text()", async () => {
    await Response.json(jsonData).text();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UUID Generation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

group("UUID Generation", () => {
  bench("crypto.randomUUID (v4)", () => {
    crypto.randomUUID();
  });

  bench("Bun.randomUUIDv7", () => {
    Bun.randomUUIDv7();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// String Operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const testStrings = [
  "Hello, World!",
  "こんにちは世界",
  "👋🌍🎉",
  "\x1b[31mColored\x1b[0m text",
];

group("String Width Calculation", () => {
  bench("string.length", () => {
    for (const s of testStrings) s.length;
  });

  bench("Bun.stringWidth", () => {
    for (const s of testStrings) Bun.stringWidth(s);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HTML Escaping
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const htmlInput = '<script>alert("XSS")</script><div class="test">&nbsp;</div>';

function manualEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

group("HTML Escaping", () => {
  bench("Manual replace chain", () => {
    manualEscape(htmlInput);
  });

  bench("Bun.escapeHTML", () => {
    Bun.escapeHTML(htmlInput);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Color Conversion
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colors = [
  "hsl(210, 90%, 55%)",
  "rgb(255, 128, 0)",
  "#ff5500",
  "rebeccapurple",
];

group("Color Conversion", () => {
  bench("Bun.color → hex", () => {
    for (const c of colors) Bun.color(c, "hex");
  });

  bench("Bun.color → [rgb]", () => {
    for (const c of colors) Bun.color(c, "[rgb]");
  });

  bench("Bun.color → ansi-16m", () => {
    for (const c of colors) Bun.color(c, "ansi-16m");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Deep Equals
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const obj1 = { a: 1, b: { c: [1, 2, 3], d: { e: "test" } } };
const obj2 = { a: 1, b: { c: [1, 2, 3], d: { e: "test" } } };

function manualDeepEquals(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

group("Deep Equality Check", () => {
  bench("JSON.stringify comparison", () => {
    manualDeepEquals(obj1, obj2);
  });

  bench("Bun.deepEquals", () => {
    Bun.deepEquals(obj1, obj2);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Glob Matching
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const glob = new Bun.Glob("**/*.{ts,js}");
const testPaths = [
  "src/index.ts",
  "src/utils/helper.ts",
  "lib/main.js",
  "test/app.test.ts",
  "README.md",
  "package.json",
];

function manualGlobMatch(pattern: string, path: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*")
        .replace(/\./g, "\\.")
        .replace(/\{([^}]+)\}/g, "($1)")
        .replace(/,/g, "|") +
      "$"
  );
  return regex.test(path);
}

group("Glob Pattern Matching", () => {
  bench("RegExp-based matching", () => {
    for (const p of testPaths) manualGlobMatch("**/*.{ts,js}", p);
  });

  bench("Bun.Glob.match", () => {
    for (const p of testPaths) glob.match(p);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Semver Comparison
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const versions = [
  ["1.0.0", "2.0.0"],
  ["1.2.3", "1.2.4"],
  ["2.0.0-beta", "2.0.0"],
];

group("Semver Comparison", () => {
  bench("Bun.semver.order", () => {
    for (const [a, b] of versions) Bun.semver.order(a, b);
  });

  bench("Bun.semver.satisfies", () => {
    Bun.semver.satisfies("1.5.0", "^1.0.0");
    Bun.semver.satisfies("2.0.0", ">=1.0.0 <3.0.0");
    Bun.semver.satisfies("1.2.3", "~1.2.0");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JSONC Parsing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const jsonc = `{
  // Comment
  "name": "test",
  "version": "1.0.0",
  /* Block comment */
  "dependencies": {
    "foo": "^1.0.0",
  },
}`;

const jsonClean = `{
  "name": "test",
  "version": "1.0.0",
  "dependencies": {
    "foo": "^1.0.0"
  }
}`;

group("JSON Parsing", () => {
  bench("JSON.parse (clean)", () => {
    JSON.parse(jsonClean);
  });

  bench("Bun.JSONC.parse (with comments)", () => {
    Bun.JSONC.parse(jsonc);
  });
});

// Run all benchmarks
await run({
  colors: true,
  percentiles: true,
});
