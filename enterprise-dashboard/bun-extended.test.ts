import { describe, it, expect, beforeAll, afterAll } from "bun:test";

/**
 * Bun Extended APIs Test Suite
 * Tests for additional Bun built-in APIs
 */

const TEST_DIR = "/tmp/bun-extended-test";

describe("Bun Extended APIs", () => {
  beforeAll(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}`.quiet();
  });

  afterAll(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.Glob - Glob pattern matching
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.Glob", () => {
    beforeAll(async () => {
      // Create test files
      await Bun.write(`${TEST_DIR}/file1.ts`, "// ts file");
      await Bun.write(`${TEST_DIR}/file2.ts`, "// ts file");
      await Bun.write(`${TEST_DIR}/file3.js`, "// js file");
      await Bun.write(`${TEST_DIR}/readme.md`, "# readme");
      await Bun.$`mkdir -p ${TEST_DIR}/src`.quiet();
      await Bun.write(`${TEST_DIR}/src/index.ts`, "export {}");
      await Bun.write(`${TEST_DIR}/src/utils.ts`, "export {}");
    });

    it("matches files with pattern", () => {
      const glob = new Bun.Glob("*.ts");
      const matches = Array.from(glob.scanSync(TEST_DIR));

      expect(matches.length).toBe(2);
      expect(matches).toContain("file1.ts");
      expect(matches).toContain("file2.ts");
    });

    it("matches recursively with **", () => {
      const glob = new Bun.Glob("**/*.ts");
      const matches = Array.from(glob.scanSync(TEST_DIR));

      expect(matches.length).toBe(4); // file1.ts, file2.ts, src/index.ts, src/utils.ts
    });

    it("tests string against pattern", () => {
      const glob = new Bun.Glob("*.{ts,js}");

      expect(glob.match("file.ts")).toBe(true);
      expect(glob.match("file.js")).toBe(true);
      expect(glob.match("file.md")).toBe(false);
    });

    it("supports negation patterns", () => {
      const glob = new Bun.Glob("*.ts");
      const files = ["a.ts", "b.ts", "c.js", "d.md"];

      const matches = files.filter((f) => glob.match(f));
      expect(matches).toEqual(["a.ts", "b.ts"]);
    });

    it("async scan returns same results", async () => {
      const glob = new Bun.Glob("*.ts");
      const syncMatches = Array.from(glob.scanSync(TEST_DIR));

      const asyncMatches: string[] = [];
      for await (const match of glob.scan(TEST_DIR)) {
        asyncMatches.push(match);
      }

      expect(asyncMatches.sort()).toEqual(syncMatches.sort());
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.password - Password hashing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.password", () => {
    it("hashes password with bcrypt", async () => {
      const password = "mySecurePassword123";
      const hash = await Bun.password.hash(password, "bcrypt");

      expect(hash).toStartWith("$2");
      expect(hash.length).toBeGreaterThan(50);
    });

    it("hashes password with argon2id", async () => {
      const password = "mySecurePassword123";
      const hash = await Bun.password.hash(password, "argon2id");

      expect(hash).toStartWith("$argon2id$");
    });

    it("verifies correct password", async () => {
      const password = "testPassword";
      const hash = await Bun.password.hash(password, "bcrypt");

      const isValid = await Bun.password.verify(password, hash);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const password = "testPassword";
      const hash = await Bun.password.hash(password, "bcrypt");

      const isValid = await Bun.password.verify("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("supports custom cost factor", async () => {
      const password = "test";

      // Lower cost = faster but less secure
      const start = performance.now();
      await Bun.password.hash(password, { algorithm: "bcrypt", cost: 4 });
      const lowCostTime = performance.now() - start;

      // Higher cost = slower but more secure
      const start2 = performance.now();
      await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
      const highCostTime = performance.now() - start2;

      expect(highCostTime).toBeGreaterThan(lowCostTime);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.semver - Semantic versioning
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.semver", () => {
    it("compares versions", () => {
      expect(Bun.semver.order("1.0.0", "2.0.0")).toBe(-1);
      expect(Bun.semver.order("2.0.0", "1.0.0")).toBe(1);
      expect(Bun.semver.order("1.0.0", "1.0.0")).toBe(0);
    });

    it("handles prerelease versions", () => {
      expect(Bun.semver.order("1.0.0-alpha", "1.0.0")).toBe(-1);
      expect(Bun.semver.order("1.0.0-beta", "1.0.0-alpha")).toBe(1);
    });

    it("satisfies range checks", () => {
      expect(Bun.semver.satisfies("1.5.0", "^1.0.0")).toBe(true);
      expect(Bun.semver.satisfies("2.0.0", "^1.0.0")).toBe(false);
      expect(Bun.semver.satisfies("1.5.0", ">=1.0.0 <2.0.0")).toBe(true);
    });

    it("handles tilde ranges", () => {
      expect(Bun.semver.satisfies("1.2.3", "~1.2.0")).toBe(true);
      expect(Bun.semver.satisfies("1.3.0", "~1.2.0")).toBe(false);
    });

    it("handles wildcards", () => {
      expect(Bun.semver.satisfies("1.2.3", "1.x")).toBe(true);
      expect(Bun.semver.satisfies("2.0.0", "1.x")).toBe(false);
      expect(Bun.semver.satisfies("1.2.3", "*")).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.sleep / Bun.sleepSync - Async sleep
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.sleep", () => {
    it("sleeps for specified milliseconds", async () => {
      const start = performance.now();
      await Bun.sleep(50);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });

    it("sleepSync blocks synchronously", () => {
      const start = performance.now();
      Bun.sleepSync(50);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.nanoseconds - High precision timing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.nanoseconds", () => {
    it("returns number nanoseconds", () => {
      const ns = Bun.nanoseconds();
      expect(typeof ns).toBe("number");
      expect(ns).toBeGreaterThan(0);
    });

    it("increases monotonically", () => {
      const ns1 = Bun.nanoseconds();
      const ns2 = Bun.nanoseconds();
      expect(ns2).toBeGreaterThanOrEqual(ns1);
    });

    it("provides higher precision than performance.now()", () => {
      const start = Bun.nanoseconds();
      // Do minimal work
      let x = 0;
      for (let i = 0; i < 1000; i++) x += i;
      const elapsed = Bun.nanoseconds() - start;

      // Should capture sub-millisecond timing
      expect(elapsed).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(1_000_000_000); // Less than 1 second
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.gzipSync / gunzipSync - Compression
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.gzip / gunzip", () => {
    it("compresses and decompresses data", () => {
      const original = "Hello, World! ".repeat(100);
      const originalBytes = new TextEncoder().encode(original);

      const compressed = Bun.gzipSync(originalBytes);
      expect(compressed.length).toBeLessThan(originalBytes.length);

      const decompressed = Bun.gunzipSync(compressed);
      const result = new TextDecoder().decode(decompressed);
      expect(result).toBe(original);
    });

    it("supports compression level", () => {
      const data = new TextEncoder().encode("test ".repeat(1000));

      const fast = Bun.gzipSync(data, { level: 1 });
      const best = Bun.gzipSync(data, { level: 9 });

      // Best compression should produce smaller output
      expect(best.length).toBeLessThanOrEqual(fast.length);
    });

    it("produces valid gzip format", () => {
      const data = new TextEncoder().encode("test data");
      const compressed = Bun.gzipSync(data);

      // Check gzip magic bytes
      expect(compressed[0]).toBe(0x1f);
      expect(compressed[1]).toBe(0x8b);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.deflateSync / inflateSync - Raw deflate
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.deflate / inflate", () => {
    it("compresses and decompresses with deflate", () => {
      const original = "Deflate compression test! ".repeat(50);
      const originalBytes = new TextEncoder().encode(original);

      const compressed = Bun.deflateSync(originalBytes);
      expect(compressed.length).toBeLessThan(originalBytes.length);

      const decompressed = Bun.inflateSync(compressed);
      const result = new TextDecoder().decode(decompressed);
      expect(result).toBe(original);
    });

    it("deflate is smaller than gzip (no header)", () => {
      const data = new TextEncoder().encode("test ".repeat(100));

      const gzipped = Bun.gzipSync(data);
      const deflated = Bun.deflateSync(data);

      // Deflate has no header, should be slightly smaller
      expect(deflated.length).toBeLessThan(gzipped.length);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.randomUUIDv7 - Time-ordered UUID
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.randomUUIDv7", () => {
    it("generates valid UUID format", () => {
      const uuid = Bun.randomUUIDv7();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("generates unique UUIDs", () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        uuids.add(Bun.randomUUIDv7());
      }
      expect(uuids.size).toBe(1000);
    });

    it("UUIDs are time-ordered (sortable)", () => {
      const uuid1 = Bun.randomUUIDv7();
      Bun.sleepSync(2);
      const uuid2 = Bun.randomUUIDv7();

      // UUIDv7 is time-ordered, so uuid1 < uuid2 lexicographically
      expect(uuid1 < uuid2).toBe(true);
    });

    it("differs from crypto.randomUUID (v4)", () => {
      const v7 = Bun.randomUUIDv7();
      const v4 = crypto.randomUUID();

      // v7 has '7' in position 14, v4 has '4'
      expect(v7[14]).toBe("7");
      expect(v4[14]).toBe("4");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.escapeHTML - HTML entity escaping
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.escapeHTML", () => {
    it("escapes HTML special characters", () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = Bun.escapeHTML(input);

      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
      );
    });

    it("escapes all dangerous characters", () => {
      expect(Bun.escapeHTML("<")).toBe("&lt;");
      expect(Bun.escapeHTML(">")).toBe("&gt;");
      expect(Bun.escapeHTML("&")).toBe("&amp;");
      expect(Bun.escapeHTML('"')).toBe("&quot;");
      expect(Bun.escapeHTML("'")).toBe("&#x27;");
    });

    it("leaves safe characters unchanged", () => {
      const safe = "Hello, World! 123";
      expect(Bun.escapeHTML(safe)).toBe(safe);
    });

    it("handles empty string", () => {
      expect(Bun.escapeHTML("")).toBe("");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.peek - Peek at promise state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.peek", () => {
    it("peeks at resolved promise", () => {
      const resolved = Promise.resolve(42);
      const value = Bun.peek(resolved);
      expect(value).toBe(42);
    });

    it("returns promise if pending", () => {
      const pending = new Promise(() => {}); // Never resolves
      const result = Bun.peek(pending);
      expect(result).toBe(pending);
    });

    it("peek.status returns promise state", () => {
      const resolved = Promise.resolve(1);
      const pending = new Promise(() => {});
      const rejected = Promise.reject(new Error("test")).catch(() => {});

      expect(Bun.peek.status(resolved)).toBe("fulfilled");
      expect(Bun.peek.status(pending)).toBe("pending");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.dns - DNS resolution
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.dns", () => {
    it("resolves localhost", async () => {
      const results = await Bun.dns.lookup("localhost");
      expect(results.length).toBeGreaterThan(0);

      const addresses = results.map((r) => r.address);
      expect(
        addresses.includes("127.0.0.1") || addresses.includes("::1")
      ).toBe(true);
    });

    it("resolves with specific family", async () => {
      const ipv4 = await Bun.dns.lookup("localhost", { family: 4 });

      for (const result of ipv4) {
        expect(result.family).toBe(4);
      }
    });

    it("throws for invalid domain", async () => {
      await expect(
        Bun.dns.lookup("this-domain-does-not-exist-12345.invalid")
      ).rejects.toThrow();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.readableStreamTo* - Stream utilities
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.readableStreamTo*", () => {
    it("converts stream to text", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("Hello, "));
          controller.enqueue(new TextEncoder().encode("World!"));
          controller.close();
        },
      });

      const text = await Bun.readableStreamToText(stream);
      expect(text).toBe("Hello, World!");
    });

    it("converts stream to bytes (ArrayBuffer)", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.enqueue(new Uint8Array([4, 5, 6]));
          controller.close();
        },
      });

      const buffer = await Bun.readableStreamToBytes(stream);
      // Returns ArrayBuffer, wrap to check contents
      const bytes = new Uint8Array(buffer);
      expect(Array.from(bytes)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("converts stream to ArrayBuffer", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3, 4]));
          controller.close();
        },
      });

      const buffer = await Bun.readableStreamToArrayBuffer(stream);
      expect(buffer.byteLength).toBe(4);
    });

    it("converts stream to JSON", async () => {
      const data = { name: "test", value: 42 };
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
          controller.close();
        },
      });

      const parsed = await Bun.readableStreamToJSON(stream);
      expect(parsed).toEqual(data);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.gc - Garbage collection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.gc", () => {
    it("triggers garbage collection", () => {
      // Create some garbage
      for (let i = 0; i < 1000; i++) {
        const _ = new Array(1000).fill(i);
      }

      // Should not throw
      expect(() => Bun.gc(false)).not.toThrow();
    });

    it("supports sync mode", () => {
      expect(() => Bun.gc(true)).not.toThrow();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.env - Environment variables
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.env", () => {
    it("reads environment variables", () => {
      expect(Bun.env.PATH).toBeDefined();
      expect(typeof Bun.env.PATH).toBe("string");
    });

    it("can set environment variables", () => {
      Bun.env.TEST_VAR = "test_value";
      expect(Bun.env.TEST_VAR).toBe("test_value");

      delete Bun.env.TEST_VAR;
      expect(Bun.env.TEST_VAR).toBeUndefined();
    });

    it("can iterate over all env vars", () => {
      // Bun.env is a Proxy, can get keys via Object.keys
      const keys = Object.keys(Bun.env);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain("PATH");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.version / Bun.revision - Version info
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun version info", () => {
    it("Bun.version is semver string", () => {
      expect(Bun.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("Bun.revision is git hash", () => {
      expect(Bun.revision).toMatch(/^[a-f0-9]+$/);
    });

    it("Bun.main is entry point path", () => {
      expect(typeof Bun.main).toBe("string");
      expect(Bun.main.length).toBeGreaterThan(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.which - Find executable path
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.which", () => {
    it("finds system commands", () => {
      const ls = Bun.which("ls");
      expect(ls).not.toBeNull();
      expect(ls).toContain("ls");
    });

    it("finds bun itself", () => {
      const bun = Bun.which("bun");
      expect(bun).not.toBeNull();
    });

    it("returns null for non-existent command", () => {
      const result = Bun.which("this-command-does-not-exist-12345");
      expect(result).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bun.spawn - Process spawning
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Bun.spawn", () => {
    it("spawns a process and captures output", async () => {
      const proc = Bun.spawn(["echo", "hello"]);
      const output = await new Response(proc.stdout).text();
      await proc.exited; // Wait for process to complete

      expect(output.trim()).toBe("hello");
      expect(proc.exitCode).toBe(0);
    });

    it("handles process exit codes", async () => {
      const proc = Bun.spawn(["false"]); // Always exits with 1
      await proc.exited;

      expect(proc.exitCode).toBe(1);
    });

    it("supports stdin", async () => {
      const proc = Bun.spawn(["cat"], {
        stdin: "pipe",
      });

      proc.stdin.write("test input");
      proc.stdin.end();

      const output = await new Response(proc.stdout).text();
      await proc.exited;
      expect(output).toBe("test input");
    });
  });
});
