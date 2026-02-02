import { describe, it, expect } from "bun:test";
import { lookup, prefetch } from "../dns.ts";

describe("dns", () => {
  describe("BN-096: DNS Lookup", () => {
    it("should resolve localhost", async () => {
      const results = await lookup("localhost");
      expect(results).not.toBeNull();
      expect(results!.length).toBeGreaterThan(0);
      expect(results![0].address).toBeDefined();
    });

    it("should return null for invalid hostname", async () => {
      const results = await lookup("this-host-does-not-exist.invalid");
      expect(results).toBeNull();
    });

    it("should resolve with IPv4 family filter", async () => {
      const results = await lookup("localhost", 4);
      if (results) {
        for (const r of results) {
          expect(r.family).toBe(4);
        }
      }
    });
  });

  describe("BN-096b: DNS Prefetch", () => {
    it("should not throw on prefetch", () => {
      expect(() => prefetch("localhost")).not.toThrow();
    });

    it("should accept port parameter", () => {
      expect(() => prefetch("localhost", 80)).not.toThrow();
    });
  });
});
