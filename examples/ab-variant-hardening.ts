#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-hardening.ts — Tier-1380 Hardening Utilities                     ║
// ║ PATH: /Users/nolarose/examples/ab-variant-hardening.ts                      ║
// ║ TYPE: Example  CTX: Production hardening  COMPONENTS: Cache, RateLimit, Log ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * TIER-1380 HARDENING UTILITIES
 *
 * - Memoized tenant parser (LRU ~10, cache hit ~2–4ns)
 * - Tenant rate-limit guard (per-tenant isolation)
 * - Col-89 safe tenant log (truncation + escapeHTML)
 *
 * Usage: import from ab-variant-multi-tenant.ts or ab-variant-omega-pools.ts
 */

// Optional build-time override (bunfig [define])
declare const TENANT_DEFAULT_POOL_SIZE: string | undefined;
const DEFAULT_POOL = typeof TENANT_DEFAULT_POOL_SIZE !== "undefined"
  ? Number(TENANT_DEFAULT_POOL_SIZE) || 2
  : 2;

const TENANT_CACHE_MAX = 10;
const tenantCache = new Map<string, { tenant: string; variant: string; poolSize: number }>();

export interface TenantAB {
  tenant: string;
  variant: string;
  poolSize: number;
}

/**
 * Memoized tenant parser – cache hit ~2–4ns (Map lookup)
 */
export function getTenantAB(cookiesHeader: string | null): TenantAB {
  if (!cookiesHeader) return { tenant: "default", variant: "control", poolSize: 2 };

  const cached = tenantCache.get(cookiesHeader);
  if (cached) return cached;

  const cookies = new Map<string, string>();
  for (const pair of decodeURIComponent(cookiesHeader).split(";")) {
    const trimmed = pair.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (key) cookies.set(key, value);
  }

  let tenant = "default";
  let variant = "control";
  let poolSize = DEFAULT_POOL;

  for (const [key, value] of cookies) {
    if (key.startsWith("tenant-") && key.includes("-ab-")) {
      const parts = key.split("-");
      tenant = parts[1] ?? "default";
      variant = value ?? "control";
      const poolKey = `tenant-${tenant}-ab-pool`;
      poolSize = Number(cookies.get(poolKey)) || DEFAULT_POOL;
      break;
    }
  }

  const result: TenantAB = { tenant, variant, poolSize };

  if (tenantCache.size >= TENANT_CACHE_MAX) {
    const first = tenantCache.keys().next().value;
    if (first) tenantCache.delete(first);
  }
  tenantCache.set(cookiesHeader, result);

  return result;
}

// ── Rate Limit ─────────────────────────────────────────────────────────────────

const tenantRateLimit = new Map<string, { count: number; reset: number }>();

export interface RateLimitOptions {
  maxPerMinute?: number;
  windowMs?: number;
}

/**
 * Check tenant rate limit. Returns null if OK, Response if exceeded.
 */
export function checkTenantRateLimit(
  tenant: string,
  options: RateLimitOptions = {},
): Response | null {
  const { maxPerMinute = 500, windowMs = 60000 } = options;

  const now = Date.now();
  let rl = tenantRateLimit.get(tenant) ?? { count: 0, reset: now + windowMs };

  if (now > rl.reset) {
    rl = { count: 0, reset: now + windowMs };
  }

  rl.count++;
  tenantRateLimit.set(tenant, rl);

  if (rl.count > maxPerMinute) {
    return new Response(`Rate limit exceeded for tenant ${tenant}`, {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  return null;
}

// ── Col-89 Safe Tenant Log ─────────────────────────────────────────────────────

const COL89_MAX = 89;
const COL89_TRUNCATE = 86;

/**
 * Col-89 safe tenant log (truncation + escapeHTML for emoji/Indic safety)
 */
export function logTenantAccess(
  tenant: string,
  variant: string,
  poolSize: number,
  timeSlice?: string,
): void {
  const time = timeSlice ?? new Date().toISOString().slice(11, 19);
  const line = `Tenant:${tenant.padEnd(12)} Variant:${variant.padEnd(10)} Pool:${poolSize} ${time}`;

  const width =
    typeof Bun !== "undefined"
      ? Bun.stringWidth(line, { countAnsiEscapeCodes: false })
      : line.length;

  if (width <= COL89_MAX) {
    console.log(line);
    return;
  }

  const slice = line.slice(0, COL89_TRUNCATE);
  const lastSpace = slice.lastIndexOf(" ");
  const truncated = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  const safe = typeof Bun !== "undefined" ? Bun.escapeHTML(truncated) : truncated;

  console.log(safe + "…");
}

// ── Cache Management ───────────────────────────────────────────────────────────

export function clearTenantCache(): void {
  tenantCache.clear();
}

export function getTenantCacheSize(): number {
  return tenantCache.size;
}
