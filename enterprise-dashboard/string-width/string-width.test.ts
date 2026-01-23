/**
 * String Width & V8 Type Check Test Suite
 * Tests for Bun.stringWidth and V8 type checking utilities
 */

import { describe, it, expect } from "bun:test";
import { StringWidthCalculator, stringWidth } from "./string-width";
import { V8TypeChecker, typeCheck, TypeGuards } from "./type-check";

describe("Bun.stringWidth", () => {
  describe("Basic ASCII", () => {
    it("calculates ASCII string width", () => {
      expect(Bun.stringWidth("hello")).toBe(5);
      expect(Bun.stringWidth("Hello World")).toBe(11);
      expect(Bun.stringWidth("")).toBe(0);
    });

    it("handles spaces and punctuation", () => {
      expect(Bun.stringWidth("   ")).toBe(3);
      expect(Bun.stringWidth("!@#$%")).toBe(5);
      expect(Bun.stringWidth("hello, world!")).toBe(13);
    });
  });

  describe("Emoji Sequences", () => {
    it("handles flag emoji (regional indicators)", () => {
      // Flag emoji are 2 regional indicator symbols
      expect(Bun.stringWidth("🇺🇸")).toBe(2);
      expect(Bun.stringWidth("🇬🇧")).toBe(2);
      expect(Bun.stringWidth("🇯🇵")).toBe(2);
    });

    it("handles emoji with skin tone modifiers", () => {
      // Emoji + skin tone = 2 width
      expect(Bun.stringWidth("👋")).toBe(2);
      expect(Bun.stringWidth("👋🏽")).toBe(2);
      expect(Bun.stringWidth("👋🏻")).toBe(2);
      expect(Bun.stringWidth("👋🏿")).toBe(2);
    });

    it("handles ZWJ (Zero Width Joiner) sequences", () => {
      // Family emoji joined by ZWJ
      expect(Bun.stringWidth("👨‍👩‍👧")).toBe(2);
      expect(Bun.stringWidth("👨‍👩‍👧‍👦")).toBe(2);
      // Professional emoji
      expect(Bun.stringWidth("👨‍💻")).toBe(2);
      expect(Bun.stringWidth("👩‍🔬")).toBe(2);
    });

    it("handles simple emoji", () => {
      expect(Bun.stringWidth("😀")).toBe(2);
      expect(Bun.stringWidth("🎉")).toBe(2);
      expect(Bun.stringWidth("✅")).toBe(2);
      expect(Bun.stringWidth("❌")).toBe(2);
    });

    it("handles emoji in text", () => {
      expect(Bun.stringWidth("Hello 👋")).toBe(8); // 6 + 2
      expect(Bun.stringWidth("✅ Done")).toBe(7); // 2 + 1 + 4
      expect(Bun.stringWidth("🇺🇸 USA")).toBe(6); // 2 + 1 + 3
    });
  });

  describe("Zero-Width Characters", () => {
    it("handles soft hyphen (U+00AD)", () => {
      expect(Bun.stringWidth("\u00AD")).toBe(0);
      expect(Bun.stringWidth("soft\u00ADhyphen")).toBe(10); // soft + hyphen
    });

    it("handles word joiner (U+2060)", () => {
      expect(Bun.stringWidth("\u2060")).toBe(0);
    });

    it("handles zero-width space (U+200B)", () => {
      expect(Bun.stringWidth("\u200B")).toBe(0);
      expect(Bun.stringWidth("a\u200Bb")).toBe(2);
    });

    it("handles zero-width non-joiner (U+200C)", () => {
      expect(Bun.stringWidth("\u200C")).toBe(0);
    });

    it("handles zero-width joiner (U+200D)", () => {
      expect(Bun.stringWidth("\u200D")).toBe(0);
    });

    it("handles BOM (U+FEFF)", () => {
      expect(Bun.stringWidth("\uFEFF")).toBe(0);
      expect(Bun.stringWidth("\uFEFFhello")).toBe(5);
    });
  });

  describe("ANSI Escape Sequences", () => {
    it("ignores color codes", () => {
      expect(Bun.stringWidth("\x1b[31mred\x1b[0m")).toBe(3);
      expect(Bun.stringWidth("\x1b[32mgreen\x1b[0m")).toBe(5);
      expect(Bun.stringWidth("\x1b[1mbold\x1b[0m")).toBe(4);
    });

    it("ignores complex ANSI sequences", () => {
      expect(Bun.stringWidth("\x1b[38;2;255;0;0mRGB red\x1b[0m")).toBe(7);
      expect(Bun.stringWidth("\x1b[48;5;196mBG color\x1b[0m")).toBe(8);
    });

    it("handles Bun.color output", () => {
      const colored = `${Bun.color("red", "ansi")}test${"\x1b[0m"}`;
      expect(Bun.stringWidth(colored)).toBe(4);
    });
  });

  describe("CJK Characters", () => {
    it("handles Chinese characters (full width)", () => {
      expect(Bun.stringWidth("中")).toBe(2);
      expect(Bun.stringWidth("中文")).toBe(4);
      expect(Bun.stringWidth("你好")).toBe(4);
    });

    it("handles Japanese characters", () => {
      expect(Bun.stringWidth("あ")).toBe(2);
      expect(Bun.stringWidth("こんにちは")).toBe(10);
      expect(Bun.stringWidth("日本")).toBe(4);
    });

    it("handles Korean characters", () => {
      expect(Bun.stringWidth("한")).toBe(2);
      expect(Bun.stringWidth("한글")).toBe(4);
    });

    it("handles mixed CJK and ASCII", () => {
      expect(Bun.stringWidth("Hello 世界")).toBe(10); // 5 + 1 + 4
      expect(Bun.stringWidth("Test 测试")).toBe(9); // 4 + 1 + 4
    });
  });
});

describe("StringWidthCalculator", () => {
  const calc = new StringWidthCalculator();

  describe("formatTableCell()", () => {
    it("pads left-aligned cells", () => {
      expect(calc.formatTableCell("hi", 5)).toBe("hi   ");
      expect(calc.formatTableCell("hello", 5)).toBe("hello");
      expect(calc.formatTableCell("✅", 4)).toBe("✅  ");
    });

    it("pads right-aligned cells", () => {
      expect(calc.formatTableCell("hi", 5, "right")).toBe("   hi");
      expect(calc.formatTableCell("123", 6, "right")).toBe("   123");
    });

    it("pads center-aligned cells", () => {
      expect(calc.formatTableCell("hi", 6, "center")).toBe("  hi  ");
      expect(calc.formatTableCell("x", 5, "center")).toBe("  x  ");
    });

    it("handles emoji in cells", () => {
      const padded = calc.formatTableCell("🇺🇸", 4);
      expect(Bun.stringWidth(padded)).toBe(4);
    });
  });

  describe("truncateToWidth()", () => {
    it("truncates long strings", () => {
      expect(calc.truncateToWidth("hello world", 8)).toBe("hello...");
      expect(calc.truncateToWidth("testing", 5)).toBe("te...");
    });

    it("returns original if within width", () => {
      expect(calc.truncateToWidth("hi", 5)).toBe("hi");
      expect(calc.truncateToWidth("hello", 5)).toBe("hello");
    });

    it("handles emoji truncation", () => {
      const result = calc.truncateToWidth("Hello 🌍 World", 10);
      expect(Bun.stringWidth(result)).toBeLessThanOrEqual(10);
    });

    it("uses custom ellipsis", () => {
      expect(calc.truncateToWidth("hello world", 8, "…")).toBe("hello w…");
    });
  });

  describe("validateTerminalWidth()", () => {
    it("validates lines within width", () => {
      expect(calc.validateTerminalWidth(["hello", "world"], 10)).toBe(true);
      expect(calc.validateTerminalWidth(["hi"], 2)).toBe(true);
    });

    it("detects overflow", () => {
      expect(calc.validateTerminalWidth(["hello world"], 5)).toBe(false);
      expect(calc.validateTerminalWidth(["ok", "this is too long"], 10)).toBe(false);
    });
  });

  describe("getOverflowingLines()", () => {
    it("returns overflowing lines", () => {
      const lines = ["short", "this is a very long line", "ok"];
      const overflow = calc.getOverflowingLines(lines, 10);

      expect(overflow.length).toBe(1);
      expect(overflow[0].index).toBe(1);
      expect(overflow[0].width).toBe(24);
    });

    it("returns empty for valid lines", () => {
      const lines = ["hi", "ok"];
      expect(calc.getOverflowingLines(lines, 10)).toEqual([]);
    });
  });

  describe("hasEmojiSequences()", () => {
    it("detects emoji", () => {
      expect(calc.hasEmojiSequences("hello 👋")).toBe(true);
      expect(calc.hasEmojiSequences("🇺🇸")).toBe(true);
      expect(calc.hasEmojiSequences("hello")).toBe(false);
    });
  });

  describe("hasZeroWidthChars()", () => {
    it("detects zero-width characters", () => {
      expect(calc.hasZeroWidthChars("a\u200Bb")).toBe(true);
      expect(calc.hasZeroWidthChars("\u2060")).toBe(true);
      expect(calc.hasZeroWidthChars("hello")).toBe(false);
    });
  });

  describe("countZeroWidthChars()", () => {
    it("counts zero-width characters", () => {
      expect(calc.countZeroWidthChars("a\u200Bb\u200Cc")).toBe(2);
      expect(calc.countZeroWidthChars("hello")).toBe(0);
    });
  });

  describe("formatColoredCell()", () => {
    it("formats with color and padding", () => {
      const result = calc.formatColoredCell("test", "red", 8);
      // Should have ANSI codes but visual width of 8
      expect(result.includes("test")).toBe(true);
      expect(result.includes("\x1b[0m")).toBe(true);
    });
  });

  describe("createProgressBar()", () => {
    it("creates progress bars", () => {
      expect(calc.createProgressBar(0, 10)).toBe("░░░░░░░░░░");
      expect(calc.createProgressBar(0.5, 10)).toBe("█████░░░░░");
      expect(calc.createProgressBar(1, 10)).toBe("██████████");
    });

    it("clamps progress to 0-1", () => {
      expect(calc.createProgressBar(-0.5, 10)).toBe("░░░░░░░░░░");
      expect(calc.createProgressBar(1.5, 10)).toBe("██████████");
    });
  });

  describe("wrapText()", () => {
    it("wraps long text", () => {
      const result = calc.wrapText("hello world foo bar", 10);
      expect(result).toEqual(["hello", "world foo", "bar"]);
    });

    it("handles single long word", () => {
      const result = calc.wrapText("superlongword", 5);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(line => {
        expect(Bun.stringWidth(line)).toBeLessThanOrEqual(5);
      });
    });
  });
});

describe("V8TypeChecker", () => {
  const checker = new V8TypeChecker();

  describe("Primitive checks", () => {
    it("isString()", () => {
      expect(checker.isString("hello")).toBe(true);
      expect(checker.isString("")).toBe(true);
      expect(checker.isString(123)).toBe(false);
      expect(checker.isString(null)).toBe(false);
    });

    it("isNumber()", () => {
      expect(checker.isNumber(123)).toBe(true);
      expect(checker.isNumber(0)).toBe(true);
      expect(checker.isNumber(-1.5)).toBe(true);
      expect(checker.isNumber(NaN)).toBe(false);
      expect(checker.isNumber("123")).toBe(false);
    });

    it("isSafeInteger()", () => {
      expect(checker.isSafeInteger(123)).toBe(true);
      expect(checker.isSafeInteger(0)).toBe(true);
      expect(checker.isSafeInteger(-999)).toBe(true);
      expect(checker.isSafeInteger(1.5)).toBe(false);
      expect(checker.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    });

    it("isBigInt()", () => {
      expect(checker.isBigInt(123n)).toBe(true);
      expect(checker.isBigInt(0n)).toBe(true);
      expect(checker.isBigInt(123)).toBe(false);
    });

    it("isBoolean()", () => {
      expect(checker.isBoolean(true)).toBe(true);
      expect(checker.isBoolean(false)).toBe(true);
      expect(checker.isBoolean(0)).toBe(false);
      expect(checker.isBoolean("true")).toBe(false);
    });

    it("isUndefined()", () => {
      expect(checker.isUndefined(undefined)).toBe(true);
      expect(checker.isUndefined(null)).toBe(false);
      expect(checker.isUndefined(0)).toBe(false);
    });

    it("isNull()", () => {
      expect(checker.isNull(null)).toBe(true);
      expect(checker.isNull(undefined)).toBe(false);
      expect(checker.isNull(0)).toBe(false);
    });

    it("isSymbol()", () => {
      expect(checker.isSymbol(Symbol())).toBe(true);
      expect(checker.isSymbol(Symbol.for("test"))).toBe(true);
      expect(checker.isSymbol("symbol")).toBe(false);
    });
  });

  describe("Object checks", () => {
    it("isObject()", () => {
      expect(checker.isObject({})).toBe(true);
      expect(checker.isObject({ a: 1 })).toBe(true);
      expect(checker.isObject(null)).toBe(false);
      expect(checker.isObject([])).toBe(false);
    });

    it("isArray()", () => {
      expect(checker.isArray([])).toBe(true);
      expect(checker.isArray([1, 2, 3])).toBe(true);
      expect(checker.isArray({})).toBe(false);
      expect(checker.isArray("array")).toBe(false);
    });

    it("isFunction()", () => {
      expect(checker.isFunction(() => {})).toBe(true);
      expect(checker.isFunction(function() {})).toBe(true);
      expect(checker.isFunction(async () => {})).toBe(true);
      expect(checker.isFunction({})).toBe(false);
    });
  });

  describe("V8 native checks via util.types", () => {
    it("isDate()", () => {
      expect(checker.isDate(new Date())).toBe(true);
      expect(checker.isDate(Date.now())).toBe(false);
      expect(checker.isDate("2024-01-01")).toBe(false);
    });

    it("isRegExp()", () => {
      expect(checker.isRegExp(/test/)).toBe(true);
      expect(checker.isRegExp(new RegExp("test"))).toBe(true);
      expect(checker.isRegExp("test")).toBe(false);
    });

    it("isMap()", () => {
      expect(checker.isMap(new Map())).toBe(true);
      expect(checker.isMap(new Map([["a", 1]]))).toBe(true);
      expect(checker.isMap({})).toBe(false);
    });

    it("isSet()", () => {
      expect(checker.isSet(new Set())).toBe(true);
      expect(checker.isSet(new Set([1, 2, 3]))).toBe(true);
      expect(checker.isSet([])).toBe(false);
    });

    it("isWeakMap()", () => {
      expect(checker.isWeakMap(new WeakMap())).toBe(true);
      expect(checker.isWeakMap(new Map())).toBe(false);
    });

    it("isWeakSet()", () => {
      expect(checker.isWeakSet(new WeakSet())).toBe(true);
      expect(checker.isWeakSet(new Set())).toBe(false);
    });

    it("isPromise()", () => {
      expect(checker.isPromise(Promise.resolve())).toBe(true);
      expect(checker.isPromise(new Promise(() => {}))).toBe(true);
      expect(checker.isPromise({ then: () => {} })).toBe(false); // thenable but not Promise
    });

    it("isAsyncFunction()", () => {
      expect(checker.isAsyncFunction(async () => {})).toBe(true);
      expect(checker.isAsyncFunction(() => {})).toBe(false);
    });

    it("isGeneratorFunction()", () => {
      expect(checker.isGeneratorFunction(function* () {})).toBe(true);
      expect(checker.isGeneratorFunction(() => {})).toBe(false);
    });

    it("isNativeError()", () => {
      expect(checker.isNativeError(new Error())).toBe(true);
      expect(checker.isNativeError(new TypeError())).toBe(true);
      expect(checker.isNativeError({ message: "error" })).toBe(false);
    });
  });

  describe("ArrayBuffer and TypedArray checks", () => {
    it("isArrayBuffer()", () => {
      expect(checker.isArrayBuffer(new ArrayBuffer(8))).toBe(true);
      expect(checker.isArrayBuffer(new Uint8Array(8).buffer)).toBe(true);
      expect(checker.isArrayBuffer(new Uint8Array(8))).toBe(false);
    });

    it("isDataView()", () => {
      expect(checker.isDataView(new DataView(new ArrayBuffer(8)))).toBe(true);
      expect(checker.isDataView(new ArrayBuffer(8))).toBe(false);
    });

    it("isTypedArray()", () => {
      expect(checker.isTypedArray(new Uint8Array(8))).toBe(true);
      expect(checker.isTypedArray(new Int32Array(8))).toBe(true);
      expect(checker.isTypedArray(new Float64Array(8))).toBe(true);
      expect(checker.isTypedArray([])).toBe(false);
    });

    it("isUint8Array()", () => {
      expect(checker.isUint8Array(new Uint8Array(8))).toBe(true);
      expect(checker.isUint8Array(new Int8Array(8))).toBe(false);
    });
  });

  describe("getTypeName()", () => {
    it("returns correct type names", () => {
      expect(checker.getTypeName(null)).toBe("null");
      expect(checker.getTypeName(undefined)).toBe("undefined");
      expect(checker.getTypeName([])).toBe("array");
      expect(checker.getTypeName({})).toBe("object");
      expect(checker.getTypeName(123)).toBe("number");
      expect(checker.getTypeName("str")).toBe("string");
      expect(checker.getTypeName(123n)).toBe("bigint");
      expect(checker.getTypeName(new Date())).toBe("date");
      expect(checker.getTypeName(/test/)).toBe("regexp");
      expect(checker.getTypeName(new Map())).toBe("map");
      expect(checker.getTypeName(new Set())).toBe("set");
      expect(checker.getTypeName(Promise.resolve())).toBe("promise");
      expect(checker.getTypeName(new ArrayBuffer(8))).toBe("arraybuffer");
      expect(checker.getTypeName(new DataView(new ArrayBuffer(8)))).toBe("dataview");
      expect(checker.getTypeName(new Uint8Array(8))).toBe("typedarray");
    });
  });

  describe("validateShape()", () => {
    it("validates object shapes", () => {
      const shape = {
        id: (v: unknown) => typeof v === "number",
        name: (v: unknown) => typeof v === "string",
        tags: (v: unknown) => Array.isArray(v),
      };

      expect(checker.validateShape({ id: 1, name: "test", tags: [] }, shape)).toBe(true);
      expect(checker.validateShape({ id: "1", name: "test", tags: [] }, shape)).toBe(false);
      expect(checker.validateShape({ id: 1, name: "test" }, shape)).toBe(false);
      expect(checker.validateShape(null, shape)).toBe(false);
    });
  });
});

describe("TypeGuards", () => {
  it("isNonEmptyString()", () => {
    expect(TypeGuards.isNonEmptyString("hello")).toBe(true);
    expect(TypeGuards.isNonEmptyString("")).toBe(false);
    expect(TypeGuards.isNonEmptyString(123)).toBe(false);
  });

  it("isPositiveNumber()", () => {
    expect(TypeGuards.isPositiveNumber(1)).toBe(true);
    expect(TypeGuards.isPositiveNumber(0.1)).toBe(true);
    expect(TypeGuards.isPositiveNumber(0)).toBe(false);
    expect(TypeGuards.isPositiveNumber(-1)).toBe(false);
    expect(TypeGuards.isPositiveNumber(NaN)).toBe(false);
  });

  it("isNonNegativeInteger()", () => {
    expect(TypeGuards.isNonNegativeInteger(0)).toBe(true);
    expect(TypeGuards.isNonNegativeInteger(5)).toBe(true);
    expect(TypeGuards.isNonNegativeInteger(-1)).toBe(false);
    expect(TypeGuards.isNonNegativeInteger(1.5)).toBe(false);
  });

  it("isValidArrayIndex()", () => {
    expect(TypeGuards.isValidArrayIndex(0, 5)).toBe(true);
    expect(TypeGuards.isValidArrayIndex(4, 5)).toBe(true);
    expect(TypeGuards.isValidArrayIndex(5, 5)).toBe(false);
    expect(TypeGuards.isValidArrayIndex(-1, 5)).toBe(false);
  });

  it("isNonEmptyArray()", () => {
    expect(TypeGuards.isNonEmptyArray([1])).toBe(true);
    expect(TypeGuards.isNonEmptyArray([])).toBe(false);
    expect(TypeGuards.isNonEmptyArray("array")).toBe(false);
  });

  it("isStringArray()", () => {
    expect(TypeGuards.isStringArray(["a", "b"])).toBe(true);
    expect(TypeGuards.isStringArray([])).toBe(true);
    expect(TypeGuards.isStringArray([1, 2])).toBe(false);
    expect(TypeGuards.isStringArray(["a", 1])).toBe(false);
  });

  it("isNumberArray()", () => {
    expect(TypeGuards.isNumberArray([1, 2, 3])).toBe(true);
    expect(TypeGuards.isNumberArray([])).toBe(true);
    expect(TypeGuards.isNumberArray(["a"])).toBe(false);
  });

  it("isURLString()", () => {
    expect(TypeGuards.isURLString("https://example.com")).toBe(true);
    expect(TypeGuards.isURLString("http://localhost:3000/path")).toBe(true);
    expect(TypeGuards.isURLString("not a url")).toBe(false);
    expect(TypeGuards.isURLString(123)).toBe(false);
  });

  it("isISODateString()", () => {
    expect(TypeGuards.isISODateString("2024-01-15T10:30:00Z")).toBe(true);
    expect(TypeGuards.isISODateString("2024-01-15T10:30:00.000Z")).toBe(true);
    expect(TypeGuards.isISODateString("2024-01-15")).toBe(false); // No T
    expect(TypeGuards.isISODateString("not a date")).toBe(false);
  });
});

describe("Integration with Bun APIs", () => {
  it("stringWidth works with Bun.color output", () => {
    const colors = ["red", "green", "blue", "yellow"];

    for (const color of colors) {
      const ansi = Bun.color(color, "ansi") || "";
      const colored = `${ansi}test\x1b[0m`;
      expect(Bun.stringWidth(colored)).toBe(4);
    }
  });

  it("stringWidth works with Bun.inspect.table concepts", () => {
    const data = [
      { name: "Alice", status: "✅ Active", region: "🇺🇸 US" },
      { name: "Bob", status: "❌ Inactive", region: "🇬🇧 UK" },
    ];

    // Calculate column widths
    const nameWidth = Math.max(...data.map(d => Bun.stringWidth(d.name)));
    const statusWidth = Math.max(...data.map(d => Bun.stringWidth(d.status)));
    const regionWidth = Math.max(...data.map(d => Bun.stringWidth(d.region)));

    expect(nameWidth).toBe(5); // "Alice"
    expect(statusWidth).toBe(11); // "❌ Inactive" = 2 + 1 + 8 = 11
    expect(regionWidth).toBe(5); // "🇺🇸 US" = 2 + 1 + 2 = 5
  });

  it("typeCheck works with Bun.file output", async () => {
    const tempPath = `/tmp/test-typecheck-${Date.now()}.txt`;
    await Bun.write(tempPath, "hello");

    const file = Bun.file(tempPath);
    const bytes = await file.bytes();

    expect(typeCheck.isUint8Array(bytes)).toBe(true);
    expect(typeCheck.isTypedArray(bytes)).toBe(true);
    expect(typeCheck.isNumber(file.size)).toBe(true);
    expect(typeCheck.isString(file.type)).toBe(true);

    await Bun.$`rm -f ${tempPath}`.quiet();
  });

  it("typeCheck works with Bun.hash output", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);

    const wyhash = Bun.hash(data);
    expect(typeCheck.isBigInt(wyhash)).toBe(true);

    const crc32 = Bun.hash.crc32(data);
    expect(typeCheck.isNumber(crc32)).toBe(true);
    expect(typeCheck.isSafeInteger(crc32)).toBe(true);
  });

  it("works with Bun.deepEquals for validation", () => {
    const obj1 = { id: 1, tags: ["a", "b"] };
    const obj2 = { id: 1, tags: ["a", "b"] };

    expect(typeCheck.isObject(obj1)).toBe(true);
    expect(typeCheck.isArray(obj1.tags)).toBe(true);
    expect(Bun.deepEquals(obj1, obj2)).toBe(true);
  });
});

describe("Performance", () => {
  it("stringWidth is fast for large strings", () => {
    const longString = "Hello 🌍 World! ".repeat(1000);

    const start = performance.now();
    const width = Bun.stringWidth(longString);
    const duration = performance.now() - start;

    expect(width).toBeGreaterThan(0);
    expect(duration).toBeLessThan(10); // Should be < 10ms
  });

  it("type checks are fast", () => {
    const testData = {
      str: "test",
      num: 123,
      arr: [1, 2, 3],
      obj: { a: 1 },
      date: new Date(),
      map: new Map(),
    };

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      typeCheck.isString(testData.str);
      typeCheck.isNumber(testData.num);
      typeCheck.isArray(testData.arr);
      typeCheck.isObject(testData.obj);
      typeCheck.isDate(testData.date);
      typeCheck.isMap(testData.map);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // 10k iterations should be < 50ms
  });
});
