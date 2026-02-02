import { describe, it, expect } from "bun:test";
import { run, lines, jsonOut, which } from "../shell.ts";
import type { RunResult } from "../shell.ts";

describe("shell", () => {
  describe("BN-020: run", () => {
    it("should capture stdout from a successful command", async () => {
      const result: RunResult = await run(["echo", "hello"]);
      expect(result.stdout.trim()).toBe("hello");
      expect(result.stderr).toBe("");
      expect(result.exitCode).toBe(0);
      expect(result.ok).toBe(true);
    });

    it("should capture stderr and non-zero exit code", async () => {
      const result = await run(["ls", "/nonexistent-path-xyz-12345"]);
      expect(result.ok).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });

    it("should not throw on invalid command", async () => {
      const result = await run(["__nonexistent_binary_xyz__"]);
      expect(result.ok).toBe(false);
    });
  });

  describe("BN-022: lines", () => {
    it("should split output into non-empty trimmed lines", () => {
      const output = "  foo  \nbar\n\n  baz  \n";
      expect(lines(output)).toEqual(["foo", "bar", "baz"]);
    });

    it("should return empty array for empty string", () => {
      expect(lines("")).toEqual([]);
    });

    it("should handle single line without newline", () => {
      expect(lines("hello")).toEqual(["hello"]);
    });
  });

  describe("BN-022: jsonOut", () => {
    it("should parse valid JSON", () => {
      const result = jsonOut<{ a: number }>('{"a": 1}');
      expect(result).toEqual({ a: 1 });
    });

    it("should return null for invalid JSON", () => {
      expect(jsonOut("not json")).toBeNull();
    });

    it("should parse arrays", () => {
      expect(jsonOut<number[]>("[1,2,3]")).toEqual([1, 2, 3]);
    });
  });

  describe("BN-023: which", () => {
    it("should find a known binary", () => {
      const path = which("bun");
      expect(path).not.toBeNull();
      expect(typeof path).toBe("string");
    });

    it("should return null for unknown binary", () => {
      expect(which("__nonexistent_binary_xyz__")).toBeNull();
    });
  });
});
