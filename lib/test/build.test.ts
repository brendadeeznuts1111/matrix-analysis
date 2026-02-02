import { describe, it, expect } from "bun:test";
import { build, bundleToString } from "../build.ts";

describe("build", () => {
  describe("BN-107: Build/Bundle", () => {
    it("should bundle a simple entrypoint", async () => {
      const tmpFile = "/tmp/test-build-entry.ts";
      await Bun.write(tmpFile, 'export const x = 42;\nconsole.log(x);\n');
      const result = await build({ entrypoints: [tmpFile] });
      expect(result.success).toBe(true);
      expect(result.outputs.length).toBeGreaterThan(0);
    });

    it("should return failure for missing file", async () => {
      const result = await build({ entrypoints: ["/tmp/nonexistent-build-test.ts"] });
      expect(result.success).toBe(false);
    });

    it("should bundle to string", async () => {
      const tmpFile = "/tmp/test-build-string.ts";
      await Bun.write(tmpFile, 'export const msg = "hello";\n');
      const output = await bundleToString(tmpFile);
      expect(output).not.toBeNull();
      expect(output).toContain("hello");
    });
  });
});
