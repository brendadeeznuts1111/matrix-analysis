import { describe, it, expect } from "bun:test";
import {
  hash,
  wyhash,
  crc32,
  adler32,
  cityHash32,
  cityHash64,
  murmur32v3,
  murmur64v2,
  hashHex,
  crc32Hex,
} from "../hash.ts";

describe("hash", () => {
  describe("BN-094: Hash Algorithms", () => {
    it("should compute default hash (wyhash) as bigint", () => {
      const h = hash("test");
      expect(typeof h).toBe("bigint");
      expect(h).toBeGreaterThan(0n);
    });

    it("should return same hash for same input", () => {
      expect(hash("hello")).toBe(hash("hello"));
    });

    it("should return different hash for different input", () => {
      expect(hash("foo")).not.toBe(hash("bar"));
    });

    it("should compute wyhash", () => {
      const h = wyhash("test");
      expect(typeof h).toBe("bigint");
      expect(h).toBe(hash("test"));
    });

    it("should compute crc32", () => {
      const h = crc32("test");
      expect(typeof h).toBe("number");
      expect(h).toBeGreaterThan(0);
    });

    it("should compute deterministic crc32", () => {
      expect(crc32("hello")).toBe(crc32("hello"));
    });

    it("should compute adler32", () => {
      const h = adler32("test");
      expect(typeof h).toBe("number");
      expect(h).toBeGreaterThan(0);
    });

    it("should compute cityHash32", () => {
      const h = cityHash32("test");
      expect(typeof h).toBe("number");
      expect(h).toBeGreaterThan(0);
    });

    it("should compute cityHash64", () => {
      const h = cityHash64("test");
      expect(typeof h).toBe("bigint");
      expect(h).toBeGreaterThan(0n);
    });

    it("should compute murmur32v3", () => {
      const h = murmur32v3("test");
      expect(typeof h).toBe("number");
      expect(h).toBeGreaterThan(0);
    });

    it("should compute murmur64v2", () => {
      const h = murmur64v2("test");
      expect(typeof h).toBe("bigint");
      expect(h).toBeGreaterThan(0n);
    });

    it("should accept Uint8Array input", () => {
      const buf = new TextEncoder().encode("test");
      expect(crc32(buf)).toBe(crc32("test"));
    });

    it("should accept seed parameter", () => {
      const a = crc32("test", 0);
      const b = crc32("test", 42);
      expect(a).not.toBe(b);
    });
  });

  describe("BN-094b: Hex Output", () => {
    it("should return hex string from hashHex", () => {
      const h = hashHex("test");
      expect(typeof h).toBe("string");
      expect(h).toMatch(/^[0-9a-f]+$/);
    });

    it("should return zero-padded crc32 hex", () => {
      const h = crc32Hex("test");
      expect(h.length).toBe(8);
      expect(h).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});
