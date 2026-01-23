import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// Simple CookieManager for testing
class CookieManager extends Map<string, string> {
  constructor(cookies?: string[] | string | null) {
    super();
    if (typeof cookies === "string") {
      this.parse(cookies);
    } else if (Array.isArray(cookies)) {
      cookies.forEach(c => this.parse(c));
    }
  }

  private parse(cookie: string) {
    const parts = cookie.split(";")[0].split("=");
    if (parts.length >= 2) {
      this.set(parts[0].trim(), parts.slice(1).join("=").trim());
    }
  }

  setSession(id: string) {
    this.set("sessionId", id);
    return this;
  }

  getSession() {
    return this.get("sessionId");
  }

  hasSession() {
    return this.has("sessionId");
  }

  toHeaderString() {
    return Array.from(this.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  toJSON() {
    return Object.fromEntries(this.entries());
  }

  serialize() {
    return JSON.stringify(this.toJSON());
  }

  static deserialize(data: string) {
    const obj = JSON.parse(data);
    const manager = new CookieManager();
    Object.entries(obj).forEach(([k, v]) => manager.set(k, v as string));
    return manager;
  }
}

// Test fixtures
const TEST_USER = "admin";
const TEST_PASS = "test123";

// Global state
let server: ReturnType<typeof Bun.serve>;

describe("🚀 Bun v1.3.6+ APIs Integration", () => {
  beforeAll(async () => {
    // Start test server
    server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/api/auth/login" && req.method === "POST") {
          return (async () => {
            const body = await req.json();
            if (body.username === TEST_USER && body.password === TEST_PASS) {
              const sessionId = crypto.randomUUID();
              return new Response(JSON.stringify({ success: true }), {
                headers: {
                  "Content-Type": "application/json",
                  "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Path=/`,
                },
              });
            }
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
          })();
        }

        if (url.pathname === "/api/auth/logout" && req.method === "POST") {
          return new Response(JSON.stringify({ success: true }), {
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": "sessionId=; HttpOnly; Path=/; Max-Age=0",
            },
          });
        }

        if (url.pathname === "/api/files/analyze" && req.method === "POST") {
          const cookie = req.headers.get("cookie") || "";
          if (!cookie.includes("sessionId=") || cookie.includes("sessionId=;")) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          return Response.json({ analyzed: true, files: [] });
        }

        if (url.pathname === "/api/perf/compare") {
          const largeObj = { items: Array.from({ length: 100 }, (_, i) => ({ id: i })) };

          const start1 = performance.now();
          for (let i = 0; i < 100; i++) new Response(JSON.stringify(largeObj));
          const time1 = performance.now() - start1;

          const start2 = performance.now();
          for (let i = 0; i < 100; i++) Response.json(largeObj);
          const time2 = performance.now() - start2;

          return Response.json({
            stringify_ms: time1.toFixed(2),
            response_json_ms: time2.toFixed(2),
            speedup: (time1 / Math.max(time2, 0.001)).toFixed(2) + "x faster",
            winner: time2 < time1 ? "Response.json()" : "JSON.stringify()",
          });
        }

        if (url.pathname.startsWith("/api/debug/colors/")) {
          const format = url.pathname.split("/").pop() || "hex";
          const input = "hsl(210, 90%, 55%)";
          const result = Bun.color(input, format as any);
          return Response.json({ format, input, result });
        }

        return new Response("Not Found", { status: 404 });
      },
    });

    console.log(`🧪 Test server started at ${server.url}`);
  });

  afterAll(() => {
    server.stop();
    console.log("🧪 Test server stopped");
  });

  describe("🔐 Cookie Authentication Flow", () => {
    it("login → protected route → logout flow", async () => {
      // 1️⃣ Login
      const loginRes = await fetch(`${server.url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
      });

      expect(loginRes.ok).toBe(true);
      expect(loginRes.status).toBe(200);

      // Extract cookies
      const setCookies = loginRes.headers.getSetCookie();
      expect(setCookies.length).toBeGreaterThan(0);

      const cookies = new CookieManager(setCookies);
      expect(cookies.hasSession()).toBe(true);
      expect(cookies.getSession()).toMatch(/^[0-9a-f-]{36}$/);

      // 2️⃣ Access protected route
      const protectedRes = await fetch(`${server.url}/api/files/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookies.toHeaderString(),
        },
        body: JSON.stringify({ fileIds: [] }),
      });

      expect(protectedRes.ok).toBe(true);
      const data = await protectedRes.json();
      expect(data.analyzed).toBe(true);

      // 3️⃣ Logout
      const logoutRes = await fetch(`${server.url}/api/auth/logout`, {
        method: "POST",
        headers: { "Cookie": cookies.toHeaderString() },
      });

      expect(logoutRes.ok).toBe(true);

      // Verify cookie cleared
      const clearedCookies = logoutRes.headers.getSetCookie();
      expect(clearedCookies.some(c => c.includes("sessionId=;"))).toBe(true);
    });

    it("rejects unauthenticated requests", async () => {
      const res = await fetch(`${server.url}/api/files/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [] }),
      });

      expect(res.status).toBe(401);
      const error = await res.json();
      expect(error.error).toContain("Unauthorized");
    });

    it("CookieManager methods work correctly", () => {
      const jar = new CookieManager();

      jar.setSession("test-session-123");
      jar.set("theme", "dark");

      expect(jar.size).toBe(2);
      expect(jar.getSession()).toBe("test-session-123");
      expect(jar.hasSession()).toBe(true);

      const entries = Array.from(jar.entries());
      expect(entries).toContainEqual(["sessionId", "test-session-123"]);

      expect(jar.toJSON()).toEqual({
        sessionId: "test-session-123",
        theme: "dark",
      });

      // Serialization
      const serialized = jar.serialize();
      const restored = CookieManager.deserialize(serialized);
      expect(restored.getSession()).toBe("test-session-123");
    });
  });

  describe("🎨 Bun.color() Integration", () => {
    it("converts HSL to various formats", () => {
      const input = "hsl(210, 90%, 55%)";

      const hex = Bun.color(input, "hex");
      const rgb = Bun.color(input, "[rgb]");
      const rgba = Bun.color(input, "{rgba}");
      const ansi = Bun.color(input, "ansi-16m");

      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(rgb).toBeArray();
      expect(rgb?.length).toBe(3);
      expect(rgba).toHaveProperty("r");
      expect(rgba).toHaveProperty("g");
      expect(rgba).toHaveProperty("b");
      expect(ansi).toContain("[38;2;");
    });

    it("returns null for invalid colors", () => {
      const invalid = Bun.color("not-a-color", "hex");
      expect(invalid).toBeNull();
    });

    it("handles named colors", () => {
      const red = Bun.color("red", "hex");
      const blue = Bun.color("blue", "[rgb]");

      expect(red).toBe("#ff0000");
      expect(blue).toEqual([0, 0, 255]);
    });
  });

  describe("📄 Bun.JSONC.parse", () => {
    it("parses JSON with comments", () => {
      const jsonc = `
        {
          // This is a comment
          "name": "test",
          "value": 42,
          /* Block comment */
          "enabled": true,
        }
      `;

      const parsed = Bun.JSONC.parse(jsonc);
      expect(parsed.name).toBe("test");
      expect(parsed.value).toBe(42);
      expect(parsed.enabled).toBe(true);
    });

    it("handles nested objects with trailing commas", () => {
      const jsonc = `
        {
          "level1": {
            "level2": {
              "value": 123,
            },
          },
        }
      `;

      const parsed = Bun.JSONC.parse(jsonc);
      expect(parsed.level1.level2.value).toBe(123);
    });
  });

  describe("⚡ Response.json() Performance", () => {
    it("compares performance via API", async () => {
      const res = await fetch(`${server.url}/api/perf/compare`);
      expect(res.ok).toBe(true);

      const data = await res.json();
      expect(data.speedup).toContain("x");
      expect(data.winner).toBeDefined();

      console.log(`  📊 JSON.stringify: ${data.stringify_ms}ms`);
      console.log(`  📊 Response.json:  ${data.response_json_ms}ms`);
      console.log(`  📊 Result: ${data.winner} is ${data.speedup}`);
    });

    it("handles large objects efficiently", async () => {
      const largeObject = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: "x".repeat(50),
        })),
      };

      const start = performance.now();
      const response = Response.json(largeObject);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      const parsed = await response.json();
      expect(parsed.items.length).toBe(1000);
    });
  });

  describe("📦 Bun.file() MIME Detection", () => {
    it("detects JSON MIME type", async () => {
      await Bun.write("/tmp/test.json", '{"test": true}');
      const file = Bun.file("/tmp/test.json");
      expect(file.type).toContain("application/json");
    });

    it("detects HTML MIME type", async () => {
      await Bun.write("/tmp/test.html", "<html></html>");
      const file = Bun.file("/tmp/test.html");
      expect(file.type).toContain("text/html");
    });

    it("detects JavaScript/TypeScript MIME type", async () => {
      await Bun.write("/tmp/test.ts", "const x: number = 1;");
      const file = Bun.file("/tmp/test.ts");
      // Bun treats .ts as JavaScript for MIME purposes
      expect(file.type).toContain("javascript");
    });
  });

  describe("🔧 Bun.deepEquals()", () => {
    it("compares objects deeply", () => {
      const a = { foo: { bar: [1, 2, 3] } };
      const b = { foo: { bar: [1, 2, 3] } };
      const c = { foo: { bar: [1, 2, 4] } };

      expect(Bun.deepEquals(a, b)).toBe(true);
      expect(Bun.deepEquals(a, c)).toBe(false);
    });

    it("handles arrays", () => {
      expect(Bun.deepEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(Bun.deepEquals([1, 2], [1, 2, 3])).toBe(false);
    });

    it("handles nested structures", () => {
      const config1 = { db: { host: "localhost", port: 5432 } };
      const config2 = { db: { host: "localhost", port: 5432 } };
      const config3 = { db: { host: "localhost", port: 3306 } };

      expect(Bun.deepEquals(config1, config2)).toBe(true);
      expect(Bun.deepEquals(config1, config3)).toBe(false);
    });
  });

  describe("📏 Bun.stringWidth()", () => {
    it("handles ASCII strings", () => {
      expect(Bun.stringWidth("hello")).toBe(5);
      expect(Bun.stringWidth("test")).toBe(4);
    });

    it("handles emojis correctly", () => {
      expect(Bun.stringWidth("👋")).toBe(2);
      expect(Bun.stringWidth("🎉")).toBe(2);
    });

    it("handles ANSI escape codes", () => {
      const colored = "\x1b[31mred\x1b[0m";
      expect(Bun.stringWidth(colored)).toBe(3); // Just "red"
    });
  });

  describe("🔐 Bun.hash", () => {
    it("generates CRC32 checksums", () => {
      const data = new TextEncoder().encode("Hello, World!");
      const hash = Bun.hash.crc32(data);

      expect(typeof hash).toBe("number");
      expect(hash).toBeGreaterThan(0);
    });

    it("generates consistent hashes", () => {
      const data = new TextEncoder().encode("test");
      const hash1 = Bun.hash.crc32(data);
      const hash2 = Bun.hash.crc32(data);

      expect(hash1).toBe(hash2);
    });
  });
});
