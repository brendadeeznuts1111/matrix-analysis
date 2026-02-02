import { describe, it, expect } from "bun:test";
import { createSink, buildBuffer, buildString } from "../sink.ts";

describe("sink", () => {
  describe("BN-110: ArrayBufferSink", () => {
    it("should create and use a sink", () => {
      const sink = createSink();
      sink.write("hello ");
      sink.write("world");
      const result = sink.end() as Uint8Array;
      expect(new TextDecoder().decode(result)).toBe("hello world");
    });

    it("should build buffer from chunks", () => {
      const buf = buildBuffer(["one", " ", "two"]);
      expect(buf).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(buf)).toBe("one two");
    });

    it("should build string from chunks", () => {
      expect(buildString(["a", "b", "c"])).toBe("abc");
    });

    it("should handle Uint8Array input", () => {
      const a = new TextEncoder().encode("hello ");
      const b = new TextEncoder().encode("world");
      const result = buildString([a, b]);
      expect(result).toBe("hello world");
    });

    it("should handle empty input", () => {
      expect(buildString([])).toBe("");
    });
  });
});
