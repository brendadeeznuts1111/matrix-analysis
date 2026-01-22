// 30-col-matrix.ts
import type { Serve } from "bun";

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

  // Fibonacci helper
  const fib = (n: number): number => n <= 1 ? n : fib(n - 1) + fib(n - 2);

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

    // 6 extras → 30 total
    randomUUID: crypto.randomUUID().slice(0, 8),
    fib: fib(i),
    isPrime: ((n: number) => {
      if (n < 2) return "❌";
      for (let j = 2; j * j <= n; j++) if (n % j === 0) return "❌";
      return "✅";
    })(i),
    memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    patternHash: ((s: string) => {
      let h = 0;
      for (let k = 0; k < s.length; k++) h = (Math.imul(31, h) + s.charCodeAt(k)) >>> 0;
      return h.toString(16).slice(0, 8);
    })(p),
    calcBinary: "0b" + i.toString(2).padStart(4, "0"),
  };
});

console.log("URLPattern + Cookie + Extras  (30 columns)".padEnd(100, "─"));
console.log(Bun.inspect.table(rows, { colors: true }));
