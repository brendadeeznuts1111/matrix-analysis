import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { tmpdir } from "os";

const TEST_DIR = join(tmpdir(), `bun-build-test-${process.pid}`);

describe("Bun.build() - Virtual Files & Metafile", () => {
  beforeAll(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}/src`.quiet();
  });

  afterAll(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  describe("Virtual Files", () => {
    it("creates modules from virtual file content", async () => {
      const entryPath = join(TEST_DIR, "src/entry.ts");
      const libPath = join(TEST_DIR, "src/lib.ts");

      const result = await Bun.build({
        entrypoints: [entryPath],
        files: {
          [entryPath]: `
            import { greeting } from "./lib.ts";
            export const message = greeting("Bun");
          `,
          [libPath]: `
            export const greeting = (name: string) => \`Hello, \${name}!\`;
          `,
        },
        outdir: join(TEST_DIR, "out1"),
      });

      expect(result.success).toBe(true);
      expect(result.outputs.length).toBeGreaterThan(0);

      const code = await result.outputs[0].text();
      expect(code).toContain("Hello");
    });

    it("virtual files override real files on disk", async () => {
      // Create a real file on disk
      const realPath = join(TEST_DIR, "src/config.ts");
      await Bun.write(realPath, 'export const CONFIG = "from-disk";');

      const mainPath = join(TEST_DIR, "src/main.ts");

      const result = await Bun.build({
        entrypoints: [mainPath],
        files: {
          [mainPath]: `
            import { CONFIG } from "./config.ts";
            console.log(CONFIG);
          `,
          [realPath]: 'export const CONFIG = "from-virtual";', // Override!
        },
        outdir: join(TEST_DIR, "out2"),
      });

      expect(result.success).toBe(true);
      const code = await result.outputs[0].text();
      expect(code).toContain("from-virtual");
      expect(code).not.toContain("from-disk");
    });

    it("injects build-time constants via virtual files", async () => {
      const buildId = crypto.randomUUID();
      const buildTime = Date.now();

      const appPath = join(TEST_DIR, "src/app.ts");
      const infoPath = join(TEST_DIR, "src/build-info.ts");

      const result = await Bun.build({
        entrypoints: [appPath],
        files: {
          [appPath]: `
            import { BUILD_INFO } from "./build-info.ts";
            export { BUILD_INFO };
          `,
          [infoPath]: `
            export const BUILD_INFO = {
              id: "${buildId}",
              timestamp: ${buildTime},
              bunVersion: "${Bun.version}",
            } as const;
          `,
        },
        outdir: join(TEST_DIR, "out3"),
      });

      expect(result.success).toBe(true);
      const code = await result.outputs[0].text();
      expect(code).toContain(buildId);
      expect(code).toContain(buildTime.toString());
      expect(code).toContain(Bun.version);
    });

    it("generates theme colors at build time with Bun.color()", async () => {
      const primary = Bun.color("hsl(210, 90%, 55%)", "hex");
      const success = Bun.color("hsl(145, 63%, 42%)", "hex");

      const themePath = join(TEST_DIR, "src/theme.ts");

      const result = await Bun.build({
        entrypoints: [themePath],
        files: {
          [themePath]: `
            export const THEME = {
              primary: "${primary}",
              success: "${success}",
            } as const;
          `,
        },
        outdir: join(TEST_DIR, "out4"),
      });

      expect(result.success).toBe(true);
      const code = await result.outputs[0].text();
      expect(code).toContain(primary!);
      expect(code).toContain(success!);
    });

    it("handles conditional virtual content based on environment", async () => {
      const isDev = process.env.NODE_ENV !== "production";
      const featuresPath = join(TEST_DIR, "src/features.ts");

      const result = await Bun.build({
        entrypoints: [featuresPath],
        files: {
          [featuresPath]: isDev
            ? `export const FEATURES = { debug: true, hmr: true };`
            : `export const FEATURES = { debug: false, hmr: false };`,
        },
        outdir: join(TEST_DIR, "out5"),
      });

      expect(result.success).toBe(true);
      const code = await result.outputs[0].text();
      // In test environment, NODE_ENV is usually not "production"
      expect(code).toContain("debug");
    });
  });

  describe("Metafile Analysis", () => {
    it("generates metafile with input/output info", async () => {
      const mainPath = join(TEST_DIR, "src/meta-main.ts");
      const utilsPath = join(TEST_DIR, "src/meta-utils.ts");

      const result = await Bun.build({
        entrypoints: [mainPath],
        files: {
          [mainPath]: `
            import { helper } from "./meta-utils.ts";
            export const result = helper(42);
          `,
          [utilsPath]: `
            export const helper = (n: number) => n * 2;
          `,
        },
        outdir: join(TEST_DIR, "out-meta"),
        metafile: true,
      });

      expect(result.success).toBe(true);
      expect(result.metafile).toBeDefined();
      expect(result.metafile!.inputs).toBeDefined();
      expect(result.metafile!.outputs).toBeDefined();

      // Check outputs exist
      const outputKeys = Object.keys(result.metafile!.outputs);
      expect(outputKeys.length).toBeGreaterThan(0);

      // Each output should have bytes
      for (const [, meta] of Object.entries(result.metafile!.outputs)) {
        expect(meta.bytes).toBeGreaterThan(0);
      }
    });

    it("tracks bundle size in metafile", async () => {
      const largePath = join(TEST_DIR, "src/large.ts");

      // Create a larger bundle
      const largeData = JSON.stringify(
        Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: "x".repeat(50),
        }))
      );

      const result = await Bun.build({
        entrypoints: [largePath],
        files: {
          [largePath]: `export const DATA = ${largeData};`,
        },
        outdir: join(TEST_DIR, "out-large"),
        metafile: true,
      });

      expect(result.success).toBe(true);

      const totalSize = Object.values(result.metafile!.outputs).reduce(
        (sum, out) => sum + out.bytes,
        0
      );

      expect(totalSize).toBeGreaterThan(1000); // Should be >1KB with all that data
      console.log(`  Bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    });

    it("minification reduces bundle size", async () => {
      const codePath = join(TEST_DIR, "src/minify-test.ts");
      const source = `
        export function calculateTotalPrice(items) {
          let totalPrice = 0;
          for (const item of items) {
            totalPrice += item.price * item.quantity;
          }
          return totalPrice;
        }
      `;

      const [unminified, minified] = await Promise.all([
        Bun.build({
          entrypoints: [codePath],
          files: { [codePath]: source },
          outdir: join(TEST_DIR, "out-unmin"),
          metafile: true,
          minify: false,
        }),
        Bun.build({
          entrypoints: [codePath],
          files: { [codePath]: source },
          outdir: join(TEST_DIR, "out-min"),
          metafile: true,
          minify: true,
        }),
      ]);

      const unminSize = Object.values(unminified.metafile!.outputs)[0].bytes;
      const minSize = Object.values(minified.metafile!.outputs)[0].bytes;

      expect(minSize).toBeLessThan(unminSize);
      console.log(`  Unminified: ${unminSize} bytes`);
      console.log(`  Minified: ${minSize} bytes`);
      console.log(`  Savings: ${((1 - minSize / unminSize) * 100).toFixed(1)}%`);
    });
  });

  describe("Build Options", () => {
    it("supports define for compile-time constants", async () => {
      const definePath = join(TEST_DIR, "src/defined.ts");

      const result = await Bun.build({
        entrypoints: [definePath],
        files: {
          [definePath]: `
            declare const __VERSION__: string;
            declare const __BUILD_TIME__: number;
            export const info = { version: __VERSION__, time: __BUILD_TIME__ };
          `,
        },
        outdir: join(TEST_DIR, "out-define"),
        define: {
          __VERSION__: JSON.stringify("1.2.3"),
          __BUILD_TIME__: Date.now().toString(),
        },
      });

      expect(result.success).toBe(true);
      const code = await result.outputs[0].text();
      expect(code).toContain("1.2.3");
    });

    it("generates source maps", async () => {
      const mappedPath = join(TEST_DIR, "src/mapped.ts");

      const result = await Bun.build({
        entrypoints: [mappedPath],
        files: {
          [mappedPath]: `
            export function add(a: number, b: number): number {
              return a + b;
            }
          `,
        },
        outdir: join(TEST_DIR, "out-sourcemap"),
        sourcemap: "external",
      });

      expect(result.success).toBe(true);

      // Check for .map file in outputs
      const hasSourceMap = result.outputs.some((o) =>
        o.path.endsWith(".map")
      );
      expect(hasSourceMap).toBe(true);
    });

    it("supports naming patterns with hash", async () => {
      const namedPath = join(TEST_DIR, "src/named.ts");

      const result = await Bun.build({
        entrypoints: [namedPath],
        files: {
          [namedPath]: `export const x = 1;`,
        },
        outdir: join(TEST_DIR, "out-named"),
        naming: "[name]-[hash].js",
      });

      expect(result.success).toBe(true);

      // Output should have hash in filename (Bun uses full hash, not truncated)
      const outputPath = result.outputs[0].path;
      expect(outputPath).toMatch(/named-[a-z0-9]+\.js$/);
    });
  });

  describe("Error Handling", () => {
    it("reports syntax errors in virtual files", async () => {
      const brokenPath = join(TEST_DIR, "src/broken.ts");

      const result = await Bun.build({
        entrypoints: [brokenPath],
        files: {
          [brokenPath]: `
            export const x = {
              missing: "closing brace"
            // Missing }
          `,
        },
        outdir: join(TEST_DIR, "out-error"),
        throw: false, // Don't throw on error, return result with success=false
      });

      expect(result.success).toBe(false);
      expect(result.logs.length).toBeGreaterThan(0);
    });

    it("reports missing imports", async () => {
      const missingPath = join(TEST_DIR, "src/missing.ts");

      const result = await Bun.build({
        entrypoints: [missingPath],
        files: {
          [missingPath]: `
            import { nonexistent } from "./does-not-exist.ts";
            export { nonexistent };
          `,
        },
        outdir: join(TEST_DIR, "out-missing"),
        throw: false, // Don't throw on error, return result with success=false
      });

      expect(result.success).toBe(false);
      expect(result.logs.length).toBeGreaterThan(0);
    });
  });
});

describe("Build-time Utilities", () => {
  it("Bun.color() generates valid hex at build time", () => {
    const colors = [
      "hsl(210, 90%, 55%)", // Blue
      "hsl(145, 63%, 42%)", // Green
      "hsl(25, 85%, 55%)", // Orange
      "hsl(0, 75%, 60%)", // Red
    ];

    for (const color of colors) {
      const hex = Bun.color(color, "hex");
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("Bun.JSONC.parse() handles config with comments", () => {
    const tsconfig = `{
      // TypeScript configuration
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        /* Strict mode */
        "strict": true,
      },
      "include": ["src/**/*"],
    }`;

    const parsed = Bun.JSONC.parse(tsconfig);
    expect(parsed.compilerOptions.target).toBe("ESNext");
    expect(parsed.compilerOptions.strict).toBe(true);
    expect(parsed.include).toEqual(["src/**/*"]);
  });

  it("Bun.hash.crc32() generates checksums for integrity", () => {
    const content = "Bundle content for checksum verification";
    const bytes = new TextEncoder().encode(content);

    const checksum1 = Bun.hash.crc32(bytes);
    const checksum2 = Bun.hash.crc32(bytes);

    expect(checksum1).toBe(checksum2); // Deterministic
    expect(typeof checksum1).toBe("number");

    // Different content = different checksum
    const modified = new TextEncoder().encode(content + "!");
    const checksum3 = Bun.hash.crc32(modified);
    expect(checksum3).not.toBe(checksum1);
  });

  it("Bun.deepEquals() compares build configs", () => {
    const config1 = {
      entrypoints: ["./src/index.ts"],
      outdir: "./dist",
      minify: true,
    };

    const config2 = {
      entrypoints: ["./src/index.ts"],
      outdir: "./dist",
      minify: true,
    };

    const config3 = {
      entrypoints: ["./src/index.ts"],
      outdir: "./dist",
      minify: false, // Different
    };

    expect(Bun.deepEquals(config1, config2)).toBe(true);
    expect(Bun.deepEquals(config1, config3)).toBe(false);
  });
});
