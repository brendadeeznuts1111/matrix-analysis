#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-omega-pools.ts — Omega Pools with A/B Cookie Variants            ║
// ║ PATH: /Users/nolarose/examples/ab-variant-omega-pools.ts                    ║
// ║ TYPE: Example  CTX: Omega pools + A/B  COMPONENTS: Pool management          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * OMEGA POOLS WITH A/B COOKIE VARIANTS
 *
 * Demonstrates:
 * - Build-time inline A/B variants (bunfig.toml [define])
 * - Dynamic pool sizing based on A/B cookies
 * - Col-89 enforcement for audit logs
 * - Session management with prefixed cookies
 * - HMAC-signed variant cookies (optional)
 *
 * Usage:
 *   bun run ab-variant-omega-pools.ts                  # Start server
 *   bun run ab-variant-omega-pools.ts --port=3000      # Custom port
 *   bun run ab-variant-omega-pools.ts --hmac-secret=xyz # HMAC signing
 */

import {
  parseCookieMap,
  getABVariant,
  getPoolSize,
  formatABCookie,
  exceedsCol89,
  wrapToCol89,
} from "./ab-variant-cookies.ts";

// ── Build-Time Constants ──────────────────────────────────────────────────────

declare const AB_VARIANT_A: string | undefined;
declare const AB_VARIANT_B: string | undefined;
declare const AB_VARIANT_POOL_A: string | undefined;
declare const AB_VARIANT_POOL_B: string | undefined;
declare const ENABLE_ANALYTICS: string | undefined;
declare const STRICT_COL89: string | undefined;

// ── Native Pool Interface ─────────────────────────────────────────────────────

interface PoolStats {
  size: number;
  active: number;
  idle: number;
  waiting: number;
  created: number;
  destroyed: number;
}

interface PoolConfig {
  size: number;
  maxWaitingClients?: number;
  autoResize?: boolean;
}

/**
 * Simulated Native Pool (Bun native in production)
 */
class NativePool {
  private config: PoolConfig;
  private stats: PoolStats;

  constructor(config: PoolConfig) {
    this.config = config;
    this.stats = {
      size: config.size,
      active: 0,
      idle: config.size,
      waiting: 0,
      created: config.size,
      destroyed: 0,
    };
  }

  acquire(): Promise<any> {
    this.stats.active++;
    this.stats.idle--;
    return Promise.resolve({});
  }

  release(conn: any): void {
    this.stats.active--;
    this.stats.idle++;
  }

  getStats(): PoolStats {
    return { ...this.stats };
  }

  resize(newSize: number): void {
    const diff = newSize - this.config.size;
    this.config.size = newSize;
    this.stats.size = newSize;
    this.stats.idle += diff;
    if (diff > 0) {
      this.stats.created += diff;
    } else {
      this.stats.destroyed += Math.abs(diff);
    }
  }

  destroy(): void {
    this.stats.destroyed += this.stats.size;
    this.stats.size = 0;
    this.stats.idle = 0;
  }
}

// ── Pool Registry ──────────────────────────────────────────────────────────────

const pools = new Map<string, NativePool>();

function getOrCreatePool(variant: string, size: number): NativePool {
  let pool = pools.get(variant);
  if (!pool) {
    pool = new NativePool({ size, maxWaitingClients: 10, autoResize: true });
    pools.set(variant, pool);
    console.log(`[POOL] Created pool for variant "${variant}" (size: ${size})`);
  } else if (pool.getStats().size !== size) {
    pool.resize(size);
    console.log(`[POOL] Resized pool for variant "${variant}" (size: ${size})`);
  }
  return pool;
}

// ── HMAC Signing (Optional) ────────────────────────────────────────────────────

async function signVariant(variant: string, secret?: string): Promise<string> {
  if (!secret) return variant;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const data = encoder.encode(variant);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${variant}.${hex}`;
}

async function verifyVariant(
  signedVariant: string,
  secret?: string,
): Promise<string | null> {
  if (!secret) return signedVariant;

  const [variant, sig] = signedVariant.split(".");
  if (!sig) return null;

  const expected = await signVariant(variant, secret);
  return expected === signedVariant ? variant : null;
}

// ── Col-89 Audit Logger ────────────────────────────────────────────────────────

function logAudit(line: string): void {
  const strictMode = typeof STRICT_COL89 !== "undefined" && STRICT_COL89 === "true";

  if (exceedsCol89(line)) {
    if (strictMode) {
      console.error(`[COL-89 VIOLATION] ${line.length} chars`);
      console.log(wrapToCol89(line));
    } else {
      console.warn(`[COL-89 WARNING] ${line.length} chars`);
      console.log(line);
    }
  } else {
    console.log(line);
  }
}

// ── Omega Server ───────────────────────────────────────────────────────────────

interface ServerOptions {
  port?: number;
  hostname?: string;
  hmacSecret?: string;
}

async function startOmegaServer(options: ServerOptions = {}): Promise<void> {
  const { port = 8080, hostname = "127.0.0.1", hmacSecret } = options;

  const server = Bun.serve({
    port,
    hostname,

    async fetch(req) {
      const url = new URL(req.url);

      // Parse A/B cookies (23ns!)
      const cookies = parseCookieMap(req.headers.get("cookie") || "");
      let variant = getABVariant(cookies);

      // HMAC verification (if enabled)
      if (hmacSecret && variant !== "control") {
        const verified = await verifyVariant(variant, hmacSecret);
        if (!verified) {
          return new Response("Invalid variant signature", { status: 403 });
        }
        variant = verified;
      }

      // Dynamic pool sizing
      const poolSize = getPoolSize(variant, cookies);
      const pool = getOrCreatePool(variant, poolSize);

      // Acquire connection
      const conn = await pool.acquire();
      const stats = pool.getStats();

      // Generate session ID
      const sessionId = cookies.get("sessionId") || crypto.randomUUID();

      // Col-89 audit log
      const logLine = `Variant: ${variant} | Pool: ${poolSize} (${stats.active}/${stats.size} active) | Session: ${sessionId.slice(0, 8)}...`;
      logAudit(logLine);

      // Response data
      const data = {
        variant,
        poolSize,
        poolStats: stats,
        sessionId,
        buildDefines: {
          AB_VARIANT_A: typeof AB_VARIANT_A !== "undefined" ? AB_VARIANT_A : null,
          AB_VARIANT_B: typeof AB_VARIANT_B !== "undefined" ? AB_VARIANT_B : null,
          AB_VARIANT_POOL_A: typeof AB_VARIANT_POOL_A !== "undefined" ? AB_VARIANT_POOL_A : null,
          AB_VARIANT_POOL_B: typeof AB_VARIANT_POOL_B !== "undefined" ? AB_VARIANT_POOL_B : null,
          ENABLE_ANALYTICS: typeof ENABLE_ANALYTICS !== "undefined" ? ENABLE_ANALYTICS : null,
          STRICT_COL89: typeof STRICT_COL89 !== "undefined" ? STRICT_COL89 : null,
        },
        hmacEnabled: !!hmacSecret,
        timestamp: new Date().toISOString(),
      };

      // Release connection
      pool.release(conn);

      // Set-Cookie headers
      const setCookies = [
        formatABCookie(variant, { secure: false, httpOnly: true }),
        `sessionId=${sessionId};Path=/;Max-Age=86400;HttpOnly;SameSite=Lax`,
      ];

      if (hmacSecret) {
        const signed = await signVariant(variant, hmacSecret);
        setCookies.push(`ab-variant-signed=${signed};Path=/;Max-Age=86400;HttpOnly`);
      }

      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setCookies.join(", "),
          "Cache-Control": "public, max-age=60",
          "X-Pool-Size": poolSize.toString(),
          "X-Pool-Active": stats.active.toString(),
        },
      });
    },
  });

  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ Omega Pools + A/B Variant Cookies                                 ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");
  console.log(`🚀 Server: http://${hostname}:${server.port}`);
  console.log(`📊 HMAC:   ${hmacSecret ? "Enabled ✓" : "Disabled"}`);
  console.log(`📏 Col-89: ${typeof STRICT_COL89 !== "undefined" && STRICT_COL89 === "true" ? "STRICT" : "WARNING"}`);
  console.log(`🔧 Define: ${typeof AB_VARIANT_A !== "undefined" ? `AB_VARIANT_A="${AB_VARIANT_A}"` : "Runtime"}\n`);

  console.log("Test commands:");
  console.log(`  curl -H "Cookie: ab-variant-a=enabled" http://${hostname}:${server.port}`);
  console.log(`  curl -H "Cookie: ab-variant-b=disabled;poolSize=10" http://${hostname}:${server.port}`);
  console.log(`  curl http://${hostname}:${server.port}  # Fallback to define\n`);
}

// ── CLI Entry Point ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const options: ServerOptions = {};

  for (const arg of args) {
    if (arg.startsWith("--port=")) {
      options.port = Number.parseInt(arg.slice(7), 10);
    } else if (arg.startsWith("--hostname=")) {
      options.hostname = arg.slice(11);
    } else if (arg.startsWith("--hmac-secret=")) {
      options.hmacSecret = arg.slice(14);
    }
  }

  await startOmegaServer(options);
}

// Run if executed directly
if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// ── Exports ────────────────────────────────────────────────────────────────────

export { NativePool, getOrCreatePool, signVariant, verifyVariant, logAudit, startOmegaServer };
export type { PoolStats, PoolConfig, ServerOptions };
