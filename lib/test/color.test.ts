import { describe, it, expect } from "bun:test";
import {
  noColor,
  colorize,
  bold,
  dim,
  PALETTE,
  success,
  error,
  warning,
  info,
  muted,
  convert,
  toHex,
  toRgb,
  toHsl,
  toHex8,
  OK,
  FAIL,
  WARN,
  INFO,
} from "../color.ts";

describe("color", () => {
  describe("BN-060: NO_COLOR Detection", () => {
    it("should return a boolean", () => {
      expect(typeof noColor()).toBe("boolean");
    });
  });

  describe("BN-061: Colorize", () => {
    it("should return string containing the text", () => {
      const result = colorize("hello", "#ff0000");
      expect(result).toContain("hello");
    });

    it("should return string for bold", () => {
      const result = bold("strong");
      expect(result).toContain("strong");
    });

    it("should return string for dim", () => {
      const result = dim("faded");
      expect(result).toContain("faded");
    });
  });

  describe("BN-062: Semantic Presets", () => {
    it("should have correct palette values", () => {
      expect(PALETTE.success).toBe("#22c55e");
      expect(PALETTE.error).toBe("#ef4444");
      expect(PALETTE.warning).toBe("#eab308");
      expect(PALETTE.info).toBe("#3b82f6");
      expect(PALETTE.muted).toBe("#6b7280");
    });

    it("should wrap text with semantic colors", () => {
      expect(success("ok")).toContain("ok");
      expect(error("fail")).toContain("fail");
      expect(warning("warn")).toContain("warn");
      expect(info("note")).toContain("note");
      expect(muted("quiet")).toContain("quiet");
    });
  });

  describe("BN-063: Hex Conversion", () => {
    it("should convert named color to hex", () => {
      expect(toHex("red")).toBe("#ff0000");
    });

    it("should convert number to hex", () => {
      expect(toHex(0xff0000)).toBe("#ff0000");
    });

    it("should convert array to hex", () => {
      expect(toHex([255, 0, 0])).toBe("#ff0000");
    });

    it("should convert hex to rgb", () => {
      const rgb = toRgb("#ff0000");
      expect(rgb).toBeString();
      expect(rgb).toContain("255");
    });

    it("should convert hex to hsl", () => {
      const hsl = toHsl("#ff0000");
      expect(hsl).toBeString();
    });

    it("should return null for invalid input", () => {
      expect(toHex("notacolor")).toBeNull();
    });

    it("should support explicit format", () => {
      const result = convert("red", "HEX");
      expect(result).toBe("#FF0000");
    });

    it("should convert to hex8 with full alpha", () => {
      const result = toHex8("red");
      expect(result).toBeString();
      expect(result!.startsWith("#")).toBe(true);
      expect(result!.length).toBe(9);
      expect(result!.slice(0, 7)).toBe("#ff0000");
    });

    it("should return null for invalid hex8 input", () => {
      expect(toHex8("notacolor")).toBeNull();
    });
  });

  describe("BN-064: Status Symbols", () => {
    it("should prefix with check mark", () => {
      expect(OK("done")).toContain("\u2713");
      expect(OK("done")).toContain("done");
    });

    it("should prefix with X mark", () => {
      expect(FAIL("broken")).toContain("\u2717");
      expect(FAIL("broken")).toContain("broken");
    });

    it("should prefix with warning symbol", () => {
      expect(WARN("caution")).toContain("\u26A0");
      expect(WARN("caution")).toContain("caution");
    });

    it("should prefix with info symbol", () => {
      expect(INFO("fyi")).toContain("\u2139");
      expect(INFO("fyi")).toContain("fyi");
    });
  });
});
