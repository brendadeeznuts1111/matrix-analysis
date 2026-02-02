import { describe, it, expect } from "bun:test";
import {
  satisfies,
  order,
  gt,
  lt,
  eq,
  gte,
  lte,
  requireVersion,
} from "../semver.ts";

describe("semver", () => {
  describe("BN-104: Semver Comparison", () => {
    it("should satisfy range", () => {
      expect(satisfies("1.3.8", ">=1.3.0")).toBe(true);
    });

    it("should not satisfy range", () => {
      expect(satisfies("1.2.0", ">=1.3.0")).toBe(false);
    });

    it("should return false for invalid semver", () => {
      expect(satisfies("not-a-version", ">=1.0.0")).toBe(false);
    });

    it("should order versions", () => {
      expect(order("2.0.0", "1.0.0")).toBe(1);
      expect(order("1.0.0", "2.0.0")).toBe(-1);
      expect(order("1.0.0", "1.0.0")).toBe(0);
    });

    it("should compare gt/lt/eq", () => {
      expect(gt("2.0.0", "1.0.0")).toBe(true);
      expect(lt("1.0.0", "2.0.0")).toBe(true);
      expect(eq("1.0.0", "1.0.0")).toBe(true);
    });

    it("should compare gte/lte", () => {
      expect(gte("1.0.0", "1.0.0")).toBe(true);
      expect(gte("2.0.0", "1.0.0")).toBe(true);
      expect(lte("1.0.0", "1.0.0")).toBe(true);
      expect(lte("1.0.0", "2.0.0")).toBe(true);
    });

    it("should check requireVersion against current Bun", () => {
      expect(requireVersion("1.0.0")).toBe(true);
    });
  });
});
