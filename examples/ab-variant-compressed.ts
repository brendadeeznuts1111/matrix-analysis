#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-compressed.ts — Zstd-Compressed A/B Cookie Snapshots             ║
// ║ PATH: /Users/nolarose/examples/ab-variant-compressed.ts                     ║
// ║ TYPE: Example  CTX: Large payload compression  COMPONENTS: Zstd + Base64    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * ZSTD-COMPRESSED A/B COOKIE SNAPSHOTS
 *
 * Compress large A/B state for cookie transport (4KB limit).
 * Uses Bun.zstdCompressSync (2x gzip, ~228μs for 212KB).
 * Fallback: Bun.deflateSync (native, no zstd).
 *
 * Usage:
 *   bun run ab-variant-compressed.ts          # Demo
 *   bun run ab-variant-compressed.ts bench    # Benchmarks
 */

import {
  parseCookieMap,
  getABVariant,
  getPoolSize,
} from "./ab-variant-cookies.ts";

// ── Types ────────────────────────────────────────────────────────────────────

interface ABStateSnapshot {
  variant: string;
  poolSize: number;
  experiments: Record<string, string>;
  metadata: { ts: number; version: string };
}

type CompressionFormat = "zstd" | "deflate" | "gzip";

interface CompressOptions {
  format?: CompressionFormat;
  level?: number; // 1-22 for zstd
}

// ── Compression (Zstd > Deflate > Gzip) ───────────────────────────────────────

function compressState(
  state: ABStateSnapshot,
  options: CompressOptions = {},
): { data: Uint8Array; format: CompressionFormat } {
  const json = JSON.stringify(state);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json);

  const format = options.format ?? "zstd";

  switch (format) {
    case "zstd": {
      const compressed = Bun.zstdCompressSync(bytes, {
        level: options.level ?? 3,
      });
      return { data: compressed, format: "zstd" };
    }
    case "deflate": {
      const compressed = Bun.deflateSync(bytes);
      return { data: compressed, format: "deflate" };
    }
    case "gzip": {
      const compressed = Bun.gzipSync(bytes);
      return { data: compressed, format: "gzip" };
    }
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

function decompressState(
  compressed: Uint8Array,
  format: CompressionFormat,
): ABStateSnapshot {
  let bytes: Uint8Array;

  switch (format) {
    case "zstd":
      bytes = Bun.zstdDecompressSync(compressed);
      break;
    case "deflate":
      bytes = Bun.inflateSync(compressed);
      break;
    case "gzip":
      bytes = Bun.gunzipSync(compressed);
      break;
    default:
      throw new Error(`Unknown format: ${format}`);
  }

  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as ABStateSnapshot;
}

// ── Cookie Helpers ────────────────────────────────────────────────────────────

const SNAPSHOT_PREFIX = "ab-snapshot-";

function stateToCookieValue(state: ABStateSnapshot, format: CompressionFormat): string {
  const { data } = compressState(state, { format });
  const b64 = btoa(String.fromCharCode(...data));
  return `${format}:${b64}`;
}

function cookieValueToState(value: string): ABStateSnapshot | null {
  try {
    const colon = value.indexOf(":");
    const format = value.slice(0, colon) as CompressionFormat;
    const b64 = value.slice(colon + 1);
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return decompressState(bytes, format);
  } catch {
    return null;
  }
}

function parseSnapshotCookie(cookieHeader: string): ABStateSnapshot | null {
  const cookies = parseCookieMap(cookieHeader, SNAPSHOT_PREFIX);

  for (const [, value] of cookies) {
    const state = cookieValueToState(value);
    if (state) return state;
  }

  return null;
}

function formatSnapshotCookie(
  state: ABStateSnapshot,
  options: { format?: CompressionFormat; maxAge?: number } = {},
): string {
  const format = options.format ?? "zstd";
  const maxAge = options.maxAge ?? 86400;

  const value = stateToCookieValue(state, format);
  return `${SNAPSHOT_PREFIX}${format}=${encodeURIComponent(value)};Path=/;Max-Age=${maxAge};HttpOnly;SameSite=Lax`;
}

// ── Integration ───────────────────────────────────────────────────────────────

function createSnapshotFromCookies(
  cookieHeader: string,
  defaultVariant = "control",
  defaultPoolSize = 5,
): ABStateSnapshot {
  const cookies = parseCookieMap(cookieHeader, "ab-variant-");
  const variant = getABVariant(cookies) || defaultVariant;
  const poolSize = getPoolSize(variant, cookies) || defaultPoolSize;

  const experiments: Record<string, string> = {};
  for (const [key, value] of cookies) {
    experiments[key] = value;
  }

  return {
    variant,
    poolSize,
    experiments,
    metadata: {
      ts: Date.now(),
      version: "1.0",
    },
  };
}

// ── Demo Server ───────────────────────────────────────────────────────────────

async function startDemoServer(port = 8081): Promise<void> {
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",

    async fetch(req) {
      const url = new URL(req.url);
      const cookieHeader = req.headers.get("cookie") ?? "";

      if (url.pathname === "/snapshot") {
        const state = createSnapshotFromCookies(cookieHeader);
        const compressed = compressState(state);
        const b64 = btoa(String.fromCharCode(...compressed.data));

        return Response.json({
          raw: state,
          compressed: {
            format: compressed.format,
            size: compressed.data.byteLength,
            base64Length: b64.length,
            ratio: ((1 - compressed.data.byteLength / JSON.stringify(state).length) * 100).toFixed(1) + "%",
          },
        });
      }

      if (url.pathname === "/cookie") {
        const state = createSnapshotFromCookies(cookieHeader);
        const setCookie = formatSnapshotCookie(state);

        return new Response(JSON.stringify({ state, setCookie }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": setCookie,
          },
        });
      }

      if (url.pathname === "/restore") {
        const snapshot = parseSnapshotCookie(cookieHeader);

        if (!snapshot) {
          return Response.json({ error: "No snapshot cookie found" }, { status: 400 });
        }

        return Response.json(snapshot);
      }

      return new Response("OK", { status: 200 });
    },
  });

  console.log(`🚀 Compressed Snapshot Server: http://127.0.0.1:${server.port}`);
  console.log("\nEndpoints:");
  console.log(`  GET /snapshot   - Compress current state (with Cookie header)`);
  console.log(`  GET /cookie     - Create Set-Cookie with compressed snapshot`);
  console.log(`  GET /restore    - Decompress and return snapshot from cookie\n`);
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

async function runBenchmarks(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ Zstd-Compressed A/B Snapshot Benchmarks                           ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

  const state: ABStateSnapshot = {
    variant: "enabled",
    poolSize: 5,
    experiments: Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`ab-variant-v${i}`, i % 2 ? "on" : "off"]),
    ),
    metadata: { ts: Date.now(), version: "1.0" },
  };

  const jsonSize = JSON.stringify(state).length;
  const iterations = 1000;

  for (const format of ["zstd", "deflate", "gzip"] as CompressionFormat[]) {
    const t0 = Bun.nanoseconds();
    let compressedSize = 0;

    for (let i = 0; i < iterations; i++) {
      const { data } = compressState(state, { format });
      compressedSize = data.byteLength;
    }

    const elapsed = (Bun.nanoseconds() - t0) / 1e6;
    const ratio = ((1 - compressedSize / jsonSize) * 100).toFixed(1);

    console.log(`${format.toUpperCase()}:`);
    console.log(`  Raw:       ${jsonSize} B`);
    console.log(`  Compressed: ${compressedSize} B (${ratio}% reduction)`);
    console.log(`  Time:      ${(elapsed / iterations).toFixed(3)} ms/op (${iterations} iters)`);
    console.log(`  Ops/sec:   ${Math.floor(iterations / (elapsed / 1000)).toLocaleString()}\n`);
  }

  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] ?? "server";

  if (cmd === "bench") {
    await runBenchmarks();
  } else {
    await startDemoServer(Number(process.argv[3]) || 8081);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  compressState,
  decompressState,
  stateToCookieValue,
  cookieValueToState,
  parseSnapshotCookie,
  formatSnapshotCookie,
  createSnapshotFromCookies,
};

export type { ABStateSnapshot, CompressionFormat, CompressOptions };
