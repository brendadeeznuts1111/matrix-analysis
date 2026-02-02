import { describe, it, expect } from "bun:test";
import { json, json5, toml, jsonl, jsonlChunk, loadFile, toJsonl } from "../parse.ts";

describe("parse", () => {
  describe("BN-030: json", () => {
    it("should parse valid JSON", () => {
      expect(json<{ a: number }>('{"a": 1}')).toEqual({ a: 1 });
    });

    it("should return null for invalid JSON", () => {
      expect(json("not json")).toBeNull();
    });

    it("should parse arrays", () => {
      expect(json<number[]>("[1,2,3]")).toEqual([1, 2, 3]);
    });
  });

  describe("BN-030: json5", () => {
    it("should parse JSON5 with comments", () => {
      const input = '{ "a": 1, /* comment */ "b": 2 }';
      expect(json5<{ a: number; b: number }>(input)).toEqual({ a: 1, b: 2 });
    });

    it("should parse JSON5 with trailing commas", () => {
      expect(json5<{ a: number }>('{ "a": 1, }')).toEqual({ a: 1 });
    });

    it("should return null for invalid input", () => {
      expect(json5(":::")).toBeNull();
    });
  });

  describe("BN-030: toml", () => {
    it("should parse valid TOML", () => {
      const input = '[section]\nkey = "value"';
      expect(toml<{ section: { key: string } }>(input)).toEqual({
        section: { key: "value" },
      });
    });

    it("should parse TOML numbers", () => {
      expect(toml<{ port: number }>("port = 3000")).toEqual({ port: 3000 });
    });

    it("should return null for invalid TOML", () => {
      expect(toml("= = = invalid")).toBeNull();
    });
  });

  describe("BN-030: jsonl", () => {
    it("should parse newline-delimited JSON", () => {
      const input = '{"a":1}\n{"a":2}\n';
      expect(jsonl<{ a: number }>(input)).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it("should return null for invalid JSONL", () => {
      expect(jsonl("not\nvalid\njsonl")).toBeNull();
    });
  });

  describe("BN-030: jsonlChunk", () => {
    it("should parse a chunk of JSONL", () => {
      const chunk = '{"x":1}\n{"x":2}\n';
      const result = jsonlChunk<{ x: number }>(chunk);
      expect(result.values.length).toBe(2);
      expect(result.values[0]).toEqual({ x: 1 });
      expect(result.done).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("BN-031: loadFile", () => {
    it("should return null for nonexistent file", async () => {
      expect(await loadFile("/nonexistent/file.json")).toBeNull();
    });

    it("should return null for unsupported extension", async () => {
      const tmpPath = "/tmp/test-parse-unsupported.txt";
      await Bun.write(tmpPath, "hello");
      expect(await loadFile(tmpPath)).toBeNull();
    });

    it("should load and parse a JSON file", async () => {
      const tmpPath = "/tmp/test-parse-load.json";
      await Bun.write(tmpPath, '{"loaded": true}');
      const result = await loadFile<{ loaded: boolean }>(tmpPath);
      expect(result).toEqual({ loaded: true });
    });

    it("should load and parse a TOML file", async () => {
      const tmpPath = "/tmp/test-parse-load.toml";
      await Bun.write(tmpPath, 'name = "test"');
      const result = await loadFile<{ name: string }>(tmpPath);
      expect(result).toEqual({ name: "test" });
    });
  });

  describe("BN-032: toJsonl", () => {
    it("should serialize array to newline-delimited JSON", () => {
      const result = toJsonl([{ a: 1 }, { a: 2 }]);
      expect(result).toBe('{"a":1}\n{"a":2}\n');
    });

    it("should handle empty array", () => {
      expect(toJsonl([])).toBe("\n");
    });

    it("should handle mixed types", () => {
      const result = toJsonl([1, "two", true]);
      expect(result).toBe('1\n"two"\ntrue\n');
    });
  });
});
