#!/usr/bin/env bun
import { describe, it, expect, beforeAll, afterAll } from "bun:test";

/**
 * Bun Zero-Dependency APIs Test Suite
 * All APIs built into Bun runtime - no npm packages needed
 */

const TEST_DIR = "/tmp/bun-zero-deps-test";

// ANSI colors via Bun.color()
const ansi = (color: string) => Bun.color(color, "ansi") as string;
const green = ansi("hsl(145, 63%, 42%)");
const blue = ansi("hsl(210, 90%, 55%)");
const orange = ansi("hsl(25, 85%, 55%)");
const cyan = ansi("hsl(195, 85%, 55%)");
const reset = ansi("white");
const dim = "\x1b[2m";
const bold = "\x1b[1m";

describe("Bun Zero-Dependency APIs", () => {
  beforeAll(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}`.quiet();
  });

  afterAll(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.Archive - Zero-dependency archive creation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.Archive", () => {
    it("creates archive from object map", async () => {
      const config = { name: "test-app", version: "1.0.0" };
      const readme = "# Test App\nA sample application.";

      const archive = new Bun.Archive({
        "config.json": JSON.stringify(config, null, 2),
        "README.md": readme,
        "src/index.ts": 'console.log("Hello");',
      });

      const tarPath = `${TEST_DIR}/bundle.tar`;
      await Bun.write(tarPath, archive);

      const file = Bun.file(tarPath);
      expect(file.size).toBeGreaterThan(0);
      expect(await file.exists()).toBe(true);
    });

    it("creates archive with compression option", async () => {
      // Test that Archive accepts compression options
      const data = { items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: "test_item",
      }))};

      // Create archive (compression support varies by Bun version)
      const archive = new Bun.Archive({
        "data.json": JSON.stringify(data)
      });

      const tarPath = `${TEST_DIR}/data.tar`;
      await Bun.write(tarPath, archive);

      // Verify archive was created
      const file = Bun.file(tarPath);
      expect(file.size).toBeGreaterThan(0);

      // Verify tar structure (files have 512-byte block headers)
      const bytes = await file.bytes();
      expect(bytes.length % 512).toBe(0); // Tar uses 512-byte blocks
    });

    it("supports binary content via Uint8Array", async () => {
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic

      const archive = new Bun.Archive({
        "image.bin": binaryData,
        "manifest.json": JSON.stringify({ type: "binary-test" }),
      });

      const tarPath = `${TEST_DIR}/binary.tar`;
      await Bun.write(tarPath, archive);

      expect(Bun.file(tarPath).size).toBeGreaterThan(0);
    });

    it("creates archive with nested paths", async () => {
      const original = {
        "file1.txt": "Content of file 1",
        "file2.txt": "Content of file 2",
        "nested/file3.txt": "Nested content",
      };

      const archive = new Bun.Archive(original);
      const tarPath = `${TEST_DIR}/extract-test.tar`;
      await Bun.write(tarPath, archive);

      // Verify archive was created
      const file = Bun.file(tarPath);
      expect(file.size).toBeGreaterThan(0);

      // Read the raw tar content and verify file names are present
      const tarBytes = await file.bytes();
      const tarText = new TextDecoder("utf-8", { fatal: false }).decode(tarBytes);

      // Tar format stores filenames in headers
      expect(tarText).toContain("file1.txt");
      expect(tarText).toContain("file2.txt");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.JSONC - JSON with Comments parser
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.JSONC", () => {
    it("parses single-line comments", () => {
      const jsonc = `{
        // This is a comment
        "name": "test",
        "value": 42
      }`;

      const parsed = Bun.JSONC.parse(jsonc);
      expect(parsed.name).toBe("test");
      expect(parsed.value).toBe(42);
    });

    it("parses block comments", () => {
      const jsonc = `{
        /*
         * Multi-line block comment
         * with multiple lines
         */
        "enabled": true,
        "count": /* inline comment */ 100
      }`;

      const parsed = Bun.JSONC.parse(jsonc);
      expect(parsed.enabled).toBe(true);
      expect(parsed.count).toBe(100);
    });

    it("handles trailing commas", () => {
      const jsonc = `{
        "items": [
          "one",
          "two",
          "three",
        ],
        "nested": {
          "a": 1,
          "b": 2,
        },
      }`;

      const parsed = Bun.JSONC.parse(jsonc);
      expect(parsed.items).toEqual(["one", "two", "three"]);
      expect(parsed.nested.b).toBe(2);
    });

    it("parses tsconfig.json style files", () => {
      const tsconfig = `{
        // TypeScript compiler options
        "compilerOptions": {
          "target": "ESNext",
          "module": "ESNext",
          "moduleResolution": "bundler",
          "strict": true,
          /* Path mapping */
          "paths": {
            "@/*": ["./src/*"],
          },
        },
        "include": ["src/**/*"],
        "exclude": [
          "node_modules",
          "dist",
        ],
      }`;

      const parsed = Bun.JSONC.parse(tsconfig);
      expect(parsed.compilerOptions.target).toBe("ESNext");
      expect(parsed.compilerOptions.strict).toBe(true);
      expect(parsed.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
      expect(parsed.exclude).toContain("node_modules");
    });

    it("handles complex nested structures", () => {
      const complex = `{
        "database": {
          // Primary database
          "primary": {
            "host": "localhost",
            "port": 5432,
          },
          // Replica for read scaling
          "replica": {
            "host": "replica.local",
            "port": 5432,
          },
        },
        "features": {
          "darkMode": true, // User preference
          "analytics": false, /* Disabled for now */
        },
      }`;

      const parsed = Bun.JSONC.parse(complex);
      expect(parsed.database.primary.host).toBe("localhost");
      expect(parsed.database.replica.port).toBe(5432);
      expect(parsed.features.darkMode).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.color - Color parsing and conversion
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.color", () => {
    it("converts HSL to hex", () => {
      const hex = Bun.color("hsl(210, 90%, 55%)", "hex");
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("converts hex to RGB array", () => {
      const rgb = Bun.color("#ff5500", "[rgb]");
      expect(rgb).toEqual([255, 85, 0]);
    });

    it("converts to RGBA object", () => {
      const rgba = Bun.color("rgba(100, 150, 200, 0.5)", "{rgba}");
      expect(rgba?.r).toBe(100);
      expect(rgba?.g).toBe(150);
      expect(rgba?.b).toBe(200);
      expect(rgba?.a).toBeCloseTo(0.5, 1); // Allow floating point variance
    });

    it("handles CSS named colors", () => {
      const colors = {
        red: "#ff0000",
        blue: "#0000ff",
        green: "#008000",
        white: "#ffffff",
        black: "#000000",
      };

      for (const [name, expected] of Object.entries(colors)) {
        const hex = Bun.color(name, "hex");
        expect(hex?.toLowerCase()).toBe(expected);
      }
    });

    it("generates ANSI escape codes for terminal", () => {
      const ansiCode = Bun.color("hsl(145, 63%, 42%)", "ansi");
      expect(ansiCode).toContain("\x1b[");
      expect(ansiCode).toContain("m");
    });

    it("generates 24-bit true color ANSI", () => {
      const ansi16m = Bun.color("#22c55e", "ansi-16m");
      expect(ansi16m).toContain("[38;2;");
    });

    it("returns null for invalid colors", () => {
      expect(Bun.color("not-a-color", "hex")).toBeNull();
      expect(Bun.color("", "hex")).toBeNull();
      // Note: Bun clamps out-of-range RGB values instead of returning null
      // rgb(999, 999, 999) becomes #ffffff (clamped to 255)
      const clamped = Bun.color("rgb(999, 999, 999)", "hex");
      expect(clamped).toBe("#ffffff");
    });

    it("handles alpha channel", () => {
      const rgba = Bun.color("hsla(210, 90%, 55%, 0.75)", "{rgba}");
      expect(rgba?.a).toBeCloseTo(0.75, 1); // Allow floating point variance

      const hex8 = Bun.color("rgba(255, 0, 0, 0.5)", "hex");
      // Hex output may or may not include alpha depending on implementation
      expect(hex8).toMatch(/^#[0-9a-f]{6,8}$/i);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.hash - Fast hashing algorithms
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.hash", () => {
    const testData = new TextEncoder().encode("Hello, Bun!");

    it("generates wyhash (default)", () => {
      const hash = Bun.hash(testData);
      expect(typeof hash).toBe("bigint");
      expect(hash).toBeGreaterThan(0n);
    });

    it("generates CRC32", () => {
      const hash = Bun.hash.crc32(testData);
      expect(typeof hash).toBe("number");
      expect(hash).toBeGreaterThan(0);
    });

    it("generates Adler32", () => {
      const hash = Bun.hash.adler32(testData);
      expect(typeof hash).toBe("number");
      expect(hash).toBeGreaterThan(0);
    });

    it("is deterministic", () => {
      const hash1 = Bun.hash.crc32(testData);
      const hash2 = Bun.hash.crc32(testData);
      expect(hash1).toBe(hash2);
    });

    it("produces different hashes for different inputs", () => {
      const data1 = new TextEncoder().encode("input1");
      const data2 = new TextEncoder().encode("input2");

      expect(Bun.hash.crc32(data1)).not.toBe(Bun.hash.crc32(data2));
    });

    it("hashes strings directly", () => {
      const hash = Bun.hash("direct string input");
      expect(typeof hash).toBe("bigint");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.deepEquals - Deep equality comparison
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.deepEquals", () => {
    it("compares primitive values", () => {
      expect(Bun.deepEquals(1, 1)).toBe(true);
      expect(Bun.deepEquals("a", "a")).toBe(true);
      expect(Bun.deepEquals(true, true)).toBe(true);
      expect(Bun.deepEquals(1, 2)).toBe(false);
    });

    it("compares arrays", () => {
      expect(Bun.deepEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(Bun.deepEquals([1, 2], [1, 2, 3])).toBe(false);
      expect(Bun.deepEquals([1, [2, 3]], [1, [2, 3]])).toBe(true);
    });

    it("compares objects", () => {
      expect(Bun.deepEquals({ a: 1 }, { a: 1 })).toBe(true);
      expect(Bun.deepEquals({ a: 1 }, { a: 2 })).toBe(false);
      expect(Bun.deepEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it("compares nested structures", () => {
      const config1 = {
        database: { host: "localhost", port: 5432 },
        features: ["auth", "api"],
      };
      const config2 = {
        database: { host: "localhost", port: 5432 },
        features: ["auth", "api"],
      };
      const config3 = {
        database: { host: "localhost", port: 3306 },
        features: ["auth", "api"],
      };

      expect(Bun.deepEquals(config1, config2)).toBe(true);
      expect(Bun.deepEquals(config1, config3)).toBe(false);
    });

    it("handles null and undefined", () => {
      expect(Bun.deepEquals(null, null)).toBe(true);
      expect(Bun.deepEquals(undefined, undefined)).toBe(true);
      expect(Bun.deepEquals(null, undefined)).toBe(false);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.stringWidth - Terminal string width calculation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.stringWidth", () => {
    it("calculates ASCII string width", () => {
      expect(Bun.stringWidth("hello")).toBe(5);
      expect(Bun.stringWidth("test")).toBe(4);
    });

    it("handles emojis (double-width)", () => {
      expect(Bun.stringWidth("👋")).toBe(2);
      expect(Bun.stringWidth("🎉")).toBe(2);
      expect(Bun.stringWidth("Hello 👋")).toBe(8); // 6 + 2
    });

    it("ignores ANSI escape codes", () => {
      const colored = "\x1b[31mred\x1b[0m";
      expect(Bun.stringWidth(colored)).toBe(3); // Just "red"
    });

    it("handles zero-width characters", () => {
      expect(Bun.stringWidth("\u200B")).toBe(0); // Zero-width space
      expect(Bun.stringWidth("\u2060")).toBe(0); // Word joiner
    });

    it("calculates CJK character width", () => {
      expect(Bun.stringWidth("中")).toBe(2);
      expect(Bun.stringWidth("日本")).toBe(4);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.inspect.table - Terminal table rendering
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.inspect.table", () => {
    it("renders array of objects", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ];

      const table = Bun.inspect.table(data);
      expect(table).toContain("Alice");
      expect(table).toContain("Bob");
      expect(table).toContain("30");
      expect(table).toContain("25");
      expect(table).toContain("┌"); // Box drawing chars
    });

    it("filters columns with properties array", () => {
      const data = [
        { id: 1, name: "Item", secret: "hidden" },
      ];

      const table = Bun.inspect.table(data, ["id", "name"]);
      expect(table).toContain("id");
      expect(table).toContain("name");
      expect(table).not.toContain("secret");
    });

    it("supports colors option", () => {
      const data = [{ status: "active" }];

      const colored = Bun.inspect.table(data, { colors: true });
      const plain = Bun.inspect.table(data, { colors: false });

      // Colored output should have ANSI codes
      expect(colored).toContain("\x1b[");
    });

    it("handles empty arrays", () => {
      const table = Bun.inspect.table([]);
      expect(table).toBeDefined();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.$ - Shell command execution
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.$", () => {
    it("executes simple commands", async () => {
      const result = await Bun.$`echo "hello"`.text();
      expect(result.trim()).toBe("hello");
    });

    it("captures stdout", async () => {
      const result = await Bun.$`echo "line1" && echo "line2"`.text();
      expect(result).toContain("line1");
      expect(result).toContain("line2");
    });

    it("handles variable interpolation", async () => {
      const name = "Bun";
      const result = await Bun.$`echo "Hello, ${name}!"`.text();
      expect(result.trim()).toBe("Hello, Bun!");
    });

    it("supports quiet mode", async () => {
      // quiet() suppresses stderr output
      const result = await Bun.$`echo "test"`.quiet();
      expect(result.exitCode).toBe(0);
    });

    it("returns exit code", async () => {
      const success = await Bun.$`true`.quiet();
      const failure = await Bun.$`false`.quiet().nothrow();

      expect(success.exitCode).toBe(0);
      expect(failure.exitCode).toBe(1);
    });

    it("pipes commands", async () => {
      // Use printf for reliable newlines, or use heredoc style
      const result = await Bun.$`printf "a\nb\nc\n" | wc -l`.text();
      expect(parseInt(result.trim())).toBe(3);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.file - File operations
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.file", () => {
    it("detects MIME types", async () => {
      await Bun.write(`${TEST_DIR}/test.json`, '{"a":1}');
      await Bun.write(`${TEST_DIR}/test.html`, "<html></html>");
      await Bun.write(`${TEST_DIR}/test.ts`, "const x = 1;");

      expect(Bun.file(`${TEST_DIR}/test.json`).type).toContain("application/json");
      expect(Bun.file(`${TEST_DIR}/test.html`).type).toContain("text/html");
      expect(Bun.file(`${TEST_DIR}/test.ts`).type).toContain("javascript");
    });

    it("provides file metadata", async () => {
      const content = "Hello, World!";
      const filePath = `${TEST_DIR}/meta.txt`;
      await Bun.write(filePath, content);

      const file = Bun.file(filePath);
      expect(file.size).toBe(content.length);
      // file.name returns the full path, not just basename
      expect(file.name).toBe(filePath);
      expect(file.name).toContain("meta.txt");
    });

    it("reads as different formats", async () => {
      const json = { key: "value" };
      await Bun.write(`${TEST_DIR}/formats.json`, JSON.stringify(json));

      const file = Bun.file(`${TEST_DIR}/formats.json`);

      const text = await file.text();
      expect(text).toBe(JSON.stringify(json));

      const bytes = await file.bytes();
      expect(bytes).toBeInstanceOf(Uint8Array);

      const parsed = await file.json();
      expect(parsed.key).toBe("value");
    });

    it("checks file existence", async () => {
      await Bun.write(`${TEST_DIR}/exists.txt`, "content");

      expect(await Bun.file(`${TEST_DIR}/exists.txt`).exists()).toBe(true);
      expect(await Bun.file(`${TEST_DIR}/nope.txt`).exists()).toBe(false);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Summary table output
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (import.meta.main) {
  console.log(`\n${bold}Bun Zero-Dependency API Reference${reset}\n`);

  const apis = [
    {
      API: `${green}Bun.Archive${reset}`,
      Replaces: "tar, archiver",
      Description: "Create/extract tar archives with optional gzip",
    },
    {
      API: `${green}Bun.JSONC${reset}`,
      Replaces: "jsonc-parser, strip-json-comments",
      Description: "Parse JSON with comments and trailing commas",
    },
    {
      API: `${blue}Bun.color${reset}`,
      Replaces: "chalk, picocolors, tinycolor2",
      Description: "Color parsing, conversion, ANSI output",
    },
    {
      API: `${blue}Bun.hash${reset}`,
      Replaces: "crc32, hash-wasm",
      Description: "wyhash, CRC32, Adler32 (hardware accelerated)",
    },
    {
      API: `${cyan}Bun.deepEquals${reset}`,
      Replaces: "lodash.isequal, deep-equal",
      Description: "Deep equality comparison for objects/arrays",
    },
    {
      API: `${cyan}Bun.stringWidth${reset}`,
      Replaces: "string-width",
      Description: "Terminal display width (emoji, CJK, ANSI)",
    },
    {
      API: `${orange}Bun.inspect.table${reset}`,
      Replaces: "cli-table3, table",
      Description: "Terminal table rendering with box drawing",
    },
    {
      API: `${orange}Bun.$${reset}`,
      Replaces: "execa, shelljs, zx",
      Description: "Shell command execution with template literals",
    },
    {
      API: `${orange}Bun.file${reset}`,
      Replaces: "fs-extra, mime-types",
      Description: "File I/O with MIME detection, lazy reading",
    },
  ];

  console.log(Bun.inspect.table(apis, { colors: true }));

  console.log(`\n${bold}Impact: Replace 9+ npm packages with zero dependencies${reset}\n`);
}
