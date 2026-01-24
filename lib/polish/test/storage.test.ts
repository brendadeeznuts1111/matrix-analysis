// lib/polish/test/storage.test.ts - Storage Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  createStorage,
  storage,
  type StorageAdapter,
} from "../core/storage.ts";

describe("storage singleton", () => {
  it("should be a StorageAdapter", () => {
    expect(typeof storage.get).toBe("function");
    expect(typeof storage.set).toBe("function");
    expect(typeof storage.has).toBe("function");
    expect(typeof storage.delete).toBe("function");
    expect(typeof storage.clear).toBe("function");
  });
});

describe("createStorage", () => {
  it("should create a StorageAdapter", () => {
    const adapter = createStorage("test-namespace");
    expect(typeof adapter.get).toBe("function");
    expect(typeof adapter.set).toBe("function");
    expect(typeof adapter.has).toBe("function");
    expect(typeof adapter.delete).toBe("function");
    expect(typeof adapter.clear).toBe("function");
  });

  it("should use default namespace if none provided", () => {
    const adapter = createStorage();
    expect(adapter).toBeDefined();
  });
});

describe("FileStorage operations", () => {
  let testStorage: StorageAdapter;
  const testNamespace = `polish-test-${Date.now()}`;

  beforeEach(() => {
    testStorage = createStorage(testNamespace);
  });

  afterEach(async () => {
    // Clean up test data
    await testStorage.clear();
  });

  describe("set/get", () => {
    it("should store and retrieve values", async () => {
      await testStorage.set("test-key", { data: "test-value" });
      const result = await testStorage.get("test-key");
      expect(result).toEqual({ data: "test-value" });
    });

    it("should return null for missing keys", async () => {
      const result = await testStorage.get("missing-key");
      expect(result).toBeNull();
    });

    it("should handle complex objects", async () => {
      const complex = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        date: "2024-01-01",
      };
      await testStorage.set("complex", complex);
      const result = await testStorage.get("complex");
      expect(result).toEqual(complex);
    });

    it("should handle string values", async () => {
      await testStorage.set("string-key", "simple string");
      const result = await testStorage.get("string-key");
      expect(result).toBe("simple string");
    });

    it("should handle number values", async () => {
      await testStorage.set("number-key", 42);
      const result = await testStorage.get("number-key");
      expect(result).toBe(42);
    });

    it("should handle boolean values", async () => {
      await testStorage.set("bool-key", true);
      const result = await testStorage.get("bool-key");
      expect(result).toBe(true);
    });

    it("should handle array values", async () => {
      const arr = [1, "two", { three: 3 }];
      await testStorage.set("array-key", arr);
      const result = await testStorage.get("array-key");
      expect(result).toEqual(arr);
    });
  });

  describe("has", () => {
    it("should return true for existing keys", async () => {
      await testStorage.set("exists", "yes");
      expect(await testStorage.has("exists")).toBe(true);
    });

    it("should return false for missing keys", async () => {
      expect(await testStorage.has("no-such-key")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should remove stored values", async () => {
      await testStorage.set("delete-me", "value");
      await testStorage.delete("delete-me");
      expect(await testStorage.has("delete-me")).toBe(false);
    });

    it("should not throw when deleting non-existent key", async () => {
      await expect(testStorage.delete("nonexistent")).resolves.toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should remove all stored values", async () => {
      await testStorage.set("a", 1);
      await testStorage.set("b", 2);
      await testStorage.clear();
      expect(await testStorage.has("a")).toBe(false);
      expect(await testStorage.has("b")).toBe(false);
    });
  });
});
