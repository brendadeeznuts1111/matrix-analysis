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
  let error = "";

  try {
    pat = new URLPattern(p, "https://shop.example.com");
    m = pat.exec(testUrl);
  } catch (e: any) {
    error = e.message?.slice(0, 30) || "Error";
    pat = new URLPattern("/fallback", "https://shop.example.com");
  }

  // Generate comprehensive cookie data
  const cookieBase = {
    name: `pattern_${i}`,
    value: m ? "matched" : "unmatched",
    path: "/",
    domain: i % 4 === 0 ? "example.com" : undefined,
    expires: i % 5 === 0 ? new Date(Date.now() + i * 86400000) : undefined,
    maxAge: i * 100,
    httpOnly: i % 2 === 0,
    secure: i % 3 === 0,
    sameSite: (["strict", "lax", "none"] as const)[i % 3],
    partitioned: i % 6 === 0,
  };

  const cookie = new Bun.Cookie(cookieBase.name, cookieBase.value, cookieBase);

  // Performance measurement
  const start = performance.now();
  pat.exec(testUrl);
  const execTime = (performance.now() - start).toFixed(3) + "ms";

  // Generate additional data
  const now = Date.now();
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  return {
    // URLPattern columns
    idx: i,
    pattern: p.length > 35 ? p.slice(0, 32) + "..." : p,
    matches: m ? "✅" : "❌",
    groups: m ? Object.keys(m.pathname?.groups || {}).join(",") : "",
    hasRegExpGroups: pat.hasRegExpGroups ? "✅" : "❌",
    pathname: pat.pathname?.slice(0, 25) || "",
    testResult: pat.test(testUrl) ? "✅" : "❌",
    execTime,

    // Cookie columns
    cookieName: cookieBase.name,
    cookieMaxAge: cookieBase.maxAge,
    cookieHttpOnly: cookieBase.httpOnly ? "✅" : "❌",
    cookieSecure: cookieBase.secure ? "✅" : "❌",
    cookieSameSite: cookieBase.sameSite,
    cookiePartitioned: cookieBase.partitioned ? "✅" : "❌",
    cookieIsExpired: cookie.isExpired() ? "✅" : "❌",

    // Generated columns
    generatedUUID: crypto.randomUUID().slice(0, 8),
    generatedInt: Math.floor(Math.random() * 10000),
    generatedIP: `192.168.${i % 256}.${(i * 7) % 256}`,

    // System columns
    bunVersion: Bun.version,
    memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),

    // Calculations
    calcSquare: i * i,
    calcFib: (function fib(n: number): number {
      return n <= 1 ? n : fib(n - 1) + fib(n - 2);
    })(i),
    calcPrime: (function isPrime(n: number) {
      if (n < 2) return "❌";
      for (let j = 2; j * j <= n; j++) if (n % j === 0) return "❌";
      return "✅";
    })(i),
    calcBinary: "0b" + i.toString(2).padStart(4, "0"),
    calcHex: "0x" + i.toString(16).toUpperCase(),

    error: error || "",
  };
});

console.log("URLPattern + Cookies + Extended Columns".padEnd(80, "─"));
console.log(
  Bun.inspect.table(rows, { colors: true })
);
