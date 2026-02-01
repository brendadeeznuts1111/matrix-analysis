#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-multi-tenant.ts — Multi-Tenant A/B Prefix Routing                ║
// ║ PATH: /Users/nolarose/examples/ab-variant-multi-tenant.ts                   ║
// ║ TYPE: Example  CTX: tenant-a-ab-*, tenant-b-ab-*  COMPONENTS: Prefix router ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * MULTI-TENANT A/B PREFIX ROUTING
 *
 * Route A/B variants by tenant-specific prefixes:
 * - tenant-a-ab-variant-1=on
 * - tenant-b-ab-variant-2=off
 *
 * Tenant ID extracted from: X-Tenant-ID, path (/a/..., /b/...), or subdomain.
 *
 * Usage:
 *   bun run ab-variant-multi-tenant.ts          # Demo server
 *   bun run ab-variant-multi-tenant.ts bench    # Benchmarks
 */

import {
  parseCookieMap,
  getABVariant,
  getPoolSize,
  formatABCookie,
} from "./ab-variant-cookies.ts";
import {
  getTenantAB,
  checkTenantRateLimit,
  logTenantAccess,
} from "./ab-variant-hardening.ts";

// ── Types ────────────────────────────────────────────────────────────────────

interface TenantConfig {
  id: string;
  prefix: string;
  defaultVariant?: string;
  defaultPoolSize?: number;
}

interface TenantResolver {
  (req: Request): string | null;
}

// ── Multi-Tenant Prefix Router ───────────────────────────────────────────────

/**
 * Parse cookies with tenant-specific prefix
 * Supports: tenant-a-ab-*, tenant-b-ab-*, tenant-foo-ab-*
 */
function parseTenantCookieMap(
  cookieHeader: string,
  tenantPrefix: string,
): Map<string, string> {
  return parseCookieMap(cookieHeader, tenantPrefix);
}

/**
 * Get tenant ID from request (header > path > subdomain)
 */
function resolveTenantFromRequest(req: Request): string | null {
  const tenantHeader = req.headers.get("x-tenant-id");
  if (tenantHeader) return tenantHeader;

  const url = new URL(req.url);
  const pathMatch = url.pathname.match(/^\/([a-z0-9-]+)\//);
  if (pathMatch) return pathMatch[1];

  const host = url.hostname;
  const subdomainMatch = host.match(/^([a-z0-9-]+)\./);
  if (subdomainMatch) return subdomainMatch[1];

  return null;
}

/**
 * Build tenant-specific prefix: tenant-{id}-ab-
 */
function tenantPrefix(tenantId: string): string {
  return `tenant-${tenantId}-ab-`;
}

/**
 * Get A/B variant for tenant
 */
function getTenantVariant(
  cookies: Map<string, string>,
  tenantPrefix_: string,
  defaultVariant = "control",
): string {
  for (const [, value] of cookies) {
    return value;
  }
  return defaultVariant;
}

/**
 * Parse all tenant prefixes from cookie header
 */
function parseAllTenantCookies(cookieHeader: string): Map<string, Map<string, string>> {
  const result = new Map<string, Map<string, string>>();

  if (!cookieHeader) return result;

  const decoded = decodeURIComponent(cookieHeader);
  const pairs = decoded.split(";").map((p) => p.trim().split("="));

  for (const [key, value] of pairs) {
    if (!key || value === undefined) continue;

    const match = key.match(/^(tenant-[a-z0-9-]+)-ab-(.+)$/);
    if (match) {
      const tenantKey = match[1];
      const variantKey = `${tenantKey}-ab-${match[2]}`;

      let tenantMap = result.get(tenantKey);
      if (!tenantMap) {
        tenantMap = new Map<string, string>();
        result.set(tenantKey, tenantMap);
      }
      tenantMap.set(variantKey, value);
    }
  }

  return result;
}

/**
 * Format Set-Cookie for tenant-specific variant
 */
function formatTenantCookie(
  tenantId: string,
  variant: string,
  options: { maxAge?: number; secure?: boolean } = {},
): string {
  const prefix = tenantPrefix(tenantId);
  let cookie = `${prefix}${variant.toLowerCase()}=${variant};Path=/`;
  if (options.maxAge) cookie += `;Max-Age=${options.maxAge}`;
  else cookie += ";Max-Age=86400";
  if (options.secure) cookie += ";Secure";
  cookie += ";HttpOnly;SameSite=Lax";
  return cookie;
}

// ── Demo Server ───────────────────────────────────────────────────────────────

async function startDemoServer(port = 8082): Promise<void> {
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",

    async fetch(req) {
      const url = new URL(req.url);
      const cookieHeader = req.headers.get("cookie") ?? "";

      const fromRequest = resolveTenantFromRequest(req);
      const fromCache = getTenantAB(cookieHeader);
      const tenantId = fromRequest ?? fromCache.tenant;

      const rateLimitResponse = checkTenantRateLimit(tenantId, {
        maxPerMinute: 500,
        windowMs: 60000,
      });
      if (rateLimitResponse) return rateLimitResponse;

      if (url.pathname === "/tenants") {
        const all = parseAllTenantCookies(cookieHeader);
        const tenants = Array.from(all.entries()).map(([k, v]) => ({
          tenant: k,
          cookies: Object.fromEntries(v),
        }));
        return Response.json({ tenantId, tenants });
      }

      const prefix = tenantPrefix(tenantId);
      const cookies = parseTenantCookieMap(cookieHeader, prefix);

      let variant: string;
      let poolSize: number;

      if (fromRequest === null && fromCache.tenant !== "default") {
        variant = fromCache.variant;
        poolSize = fromCache.poolSize;
      } else {
        variant =
          cookies.size > 0
            ? [...cookies.values()][0]
            : getABVariant(new Map(), "ab-variant-") || "control";
        poolSize = getPoolSize(variant, cookies) || 5;
      }

      logTenantAccess(tenantId, variant, poolSize);

      const data = {
        tenantId,
        prefix,
        variant,
        poolSize,
        cookies: Object.fromEntries(cookies),
        setCookie: formatTenantCookie(tenantId, variant),
      };

      return Response.json(data, {
        headers: {
          "Set-Cookie": data.setCookie,
          "X-Tenant-ID": tenantId,
        },
      });
    },
  });

  console.log(`🚀 Multi-Tenant A/B Server: http://127.0.0.1:${server.port}`);
  console.log("\nTenant resolution: X-Tenant-ID > path /{tenant}/... > subdomain\n");
  console.log("Examples:");
  console.log(`  curl -H "X-Tenant-ID: a" -H "Cookie: tenant-a-ab-variant-1=enabled" http://127.0.0.1:${server.port}`);
  console.log(`  curl -H "X-Tenant-ID: b" -H "Cookie: tenant-b-ab-variant-2=disabled" http://127.0.0.1:${server.port}`);
  console.log(`  curl http://127.0.0.1:${server.port}/a/page  # tenant from path\n`);
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

async function runBenchmarks(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ Multi-Tenant Prefix Routing Benchmarks                            ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

  const cookieHeader = [
    "tenant-a-ab-variant-1=enabled",
    "tenant-a-ab-pool=5",
    "tenant-b-ab-variant-2=disabled",
    "tenant-b-ab-pool=3",
    "tenant-foo-ab-exp=on",
  ].join(";");

  const iterations = 10_000;

  const t1 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    parseAllTenantCookies(cookieHeader);
  }
  const parseTime = (Bun.nanoseconds() - t1) / 1e6;

  const t2 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    parseTenantCookieMap(cookieHeader, "tenant-a-ab-");
  }
  const singleTime = (Bun.nanoseconds() - t2) / 1e6;

  console.log(`Parse all tenants (3):  ${(parseTime / iterations * 1000).toFixed(3)} μs/op`);
  console.log(`Parse single tenant:    ${(singleTime / iterations * 1000).toFixed(3)} μs/op`);
  console.log(`Ops/sec (all):          ${Math.floor(iterations / (parseTime / 1000)).toLocaleString()}`);
  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] ?? "server";

  if (cmd === "bench") {
    await runBenchmarks();
  } else {
    await startDemoServer(Number(process.argv[3]) || 8082);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  parseTenantCookieMap,
  parseAllTenantCookies,
  resolveTenantFromRequest,
  tenantPrefix,
  getTenantVariant,
  formatTenantCookie,
};
export { getTenantAB, checkTenantRateLimit, logTenantAccess } from "./ab-variant-hardening.ts";

export type { TenantConfig, TenantResolver };
