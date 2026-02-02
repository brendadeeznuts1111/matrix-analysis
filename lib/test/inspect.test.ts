import { describe, it, expect } from "bun:test";
import {
  inspect,
  inspectColor,
  inspectCompact,
  inspectDeep,
  table,
  safeInspect,
  CUSTOM,
} from "../inspect.ts";

describe("inspect", () => {
  describe("BN-102: Inspect", () => {
    it("should inspect a simple object", () => {
      const result = inspect({ a: 1, b: "two" });
      expect(result).toContain("a");
      expect(result).toContain("1");
    });

    it("should inspect with colors", () => {
      const result = inspectColor({ a: 1 });
      expect(result.length).toBeGreaterThan(0);
    });

    it("should inspect compact", () => {
      const result = inspectCompact({ a: 1 });
      expect(result).toContain("a");
    });

    it("should inspect deep nested objects", () => {
      const obj = { a: { b: { c: { d: { e: 1 } } } } };
      const result = inspectDeep(obj);
      expect(result).toContain("e");
      expect(result).toContain("1");
    });

    it("should respect depth limit", () => {
      const obj = { a: { b: { c: 1 } } };
      const shallow = inspect(obj, { depth: 1 });
      const deep = inspect(obj, { depth: 3 });
      expect(deep.length).toBeGreaterThanOrEqual(shallow.length);
    });

    it("should inspect arrays", () => {
      const result = inspect([1, 2, 3]);
      expect(result).toContain("1");
      expect(result).toContain("3");
    });
  });

  describe("BN-102b: Table", () => {
    it("should format data as table", () => {
      const result = table([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
      expect(result).toContain("a");
      expect(result).toContain("b");
    });

    it("should filter table columns", () => {
      const result = table([{ a: 1, b: 2, c: 3 }], ["a", "b"]);
      expect(result).toContain("a");
      expect(result).toContain("b");
    });
  });

  describe("BN-102c: Safe Inspect", () => {
    it("should wrap long output to Col-89", () => {
      const wide = { data: "x".repeat(200) };
      const result = safeInspect(wide);
      for (const line of result.split("\n")) {
        expect(Bun.stringWidth(line)).toBeLessThanOrEqual(89);
      }
    });
  });

  describe("BN-102d: Custom Symbol", () => {
    it("should export custom inspect symbol", () => {
      expect(typeof CUSTOM).toBe("symbol");
    });

    it("should use custom inspect on class", () => {
      class Foo {
        [CUSTOM]() {
          return "CustomFoo";
        }
      }
      const result = inspect(new Foo());
      expect(result).toBe("CustomFoo");
    });
  });
});
