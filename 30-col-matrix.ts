// 30-col-matrix.ts
import type { Serve } from "bun";

// ═══════════════════════════════════════════════════════════════════════════════
// HOISTED HELPERS (Bun-native optimizations)
// ═══════════════════════════════════════════════════════════════════════════════

// BN-001: Memoized Fibonacci O(n) instead of O(2^n)
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);
const fib = (n: number): number => {
  if (fibCache.has(n)) return fibCache.get(n)!;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  fibCache.set(n, b);
  return b;
};

// BN-004: Hoisted helpers with Bun.hash.crc32
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let j = 2; j * j <= n; j++) if (n % j === 0) return false;
  return true;
};

const hash = (s: string): string => Bun.hash.crc32(s).toString(16).padStart(8, "0");

// ═══════════════════════════════════════════════════════════════════════════════

const testUrl = "https://shop.example.com/items/42?color=red&ref=abc";

const rows = Array.from({ length: 15 }, (_, i) => {
  const p = [
    "https://shop.example.com/items/:id",
    "https://shop.example.com/items/(\\d+)",
    "https://shop.example.com/items/:id(\\d+)",
    "https://:subdomain.example.com/:path*",
    "/items/:id",
    "/items/:id/details",
    "https://shop.example.com/items/:id?*",
    "/api/v1/users/(\\w+)",
    "/api/v1/users/:id",
    "/files/*/:name.:ext",
    "/blog/:year(\\d{4})/:month(\\d{2})",
    "/items/(\\d+)",
    "/:category/:id",
    "/:category/:id/:slug",
    "/(items|products)/:id",
  ][i];

  let pat: URLPattern;
  let m: URLPatternResult | null = null;

  try {
    pat = new URLPattern(p, "https://shop.example.com");
    m = pat.exec(testUrl);
  } catch {
    pat = new URLPattern("/fallback", "https://shop.example.com");
  }

  const execStart = performance.now();
  pat.exec(testUrl);
  const execTime = (performance.now() - execStart).toFixed(3) + "ms";

  // base cookie
  const cookie = new Bun.Cookie(`pattern_${i}`, m ? "matched" : "unmatched", {
    path: "/",
    httpOnly: i % 2 === 0,
    secure: i % 3 === 0,
    sameSite: (["strict", "lax", "none"] as const)[i % 3],
    maxAge: i * 100,
    partitioned: i % 6 === 0,
  });

  return {
    // 18 URLPattern
    idx: i,
    pattern: p.length > 30 ? p.slice(0, 27) + "..." : p,
    matches: m ? "✅" : "❌",
    groups: m ? Object.keys(m.pathname?.groups || {}).join(",") : "",
    hasRegExpGroups: pat.hasRegExpGroups ? "✅" : "❌",
    protocol: pat.protocol,
    hostname: pat.hostname?.slice(0, 15) || "",
    port: pat.port || "",
    pathname: pat.pathname?.slice(0, 20) || "",
    search: pat.search || "*",
    hash: pat.hash || "*",
    testResult: pat.test(testUrl) ? "✅" : "❌",
    execTime,

    // 8 Cookie
    cookieName: cookie.name,
    cookieValue: cookie.value,
    cookieHttpOnly: cookie.httpOnly ? "✅" : "❌",
    cookieSecure: cookie.secure ? "✅" : "❌",
    cookieSameSite: cookie.sameSite,
    cookieMaxAge: cookie.maxAge,
    cookieSerialized: cookie.serialize().slice(0, 40) + "...",
    cookiePartitioned: cookie.partitioned ? "✅" : "❌",

    // 6 extras → 30 total (Bun-native)
    randomUUID: Bun.randomUUIDv7().slice(0, 8),
    fib: fib(i),
    isPrime: isPrime(i) ? "✅" : "❌",
    memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    patternHash: hash(p).slice(0, 8),
    calcBinary: "0b" + i.toString(2).padStart(4, "0"),
  };
});

console.log("URLPattern + Cookie + Extras  (30 columns)".padEnd(100, "─"));
console.log(Bun.inspect.table(rows, { colors: true }));
