#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-dashboard.ts — A/B Metrics Dashboard (HTTP + SSE)                ║
// ║ PATH: /Users/nolarose/examples/ab-variant-dashboard.ts                      ║
// ║ TYPE: Example  CTX: Real-time stats  COMPONENTS: HTTP API + SSE streaming   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * A/B METRICS DASHBOARD
 *
 * Real-time A/B variant distribution and conversion stats via HTTP + SSE.
 * In-memory metrics store (extend to Redis/file for persistence).
 *
 * Usage:
 *   bun run ab-variant-dashboard.ts          # Start dashboard
 *   bun run ab-variant-dashboard.ts bench    # Benchmarks
 */

import { parseCookieMap, getABVariant } from "./ab-variant-cookies.ts";

// ── Types ────────────────────────────────────────────────────────────────────

interface VariantMetrics {
  variant: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  lastSeen: number;
}

interface DashboardSnapshot {
  variants: Record<string, VariantMetrics>;
  totalImpressions: number;
  totalConversions: number;
  timestamp: number;
  uptime: number;
}

// ── In-Memory Metrics Store ───────────────────────────────────────────────────

const metrics = new Map<string, VariantMetrics>();
const startTime = Date.now();
let totalImpressions = 0;
let totalConversions = 0;

const sseClients = new Set<ReadableStreamDefaultController<Uint8Array>>();

function getOrCreateVariant(variant: string): VariantMetrics {
  let m = metrics.get(variant);
  if (!m) {
    m = {
      variant,
      impressions: 0,
      conversions: 0,
      conversionRate: 0,
      lastSeen: 0,
    };
    metrics.set(variant, m);
  }
  return m;
}

function recordImpression(variant: string): void {
  const m = getOrCreateVariant(variant);
  m.impressions++;
  m.lastSeen = Date.now();
  m.conversionRate = m.impressions > 0 ? m.conversions / m.impressions : 0;
  totalImpressions++;
  broadcastSnapshot();
}

function recordConversion(variant: string): void {
  const m = getOrCreateVariant(variant);
  m.conversions++;
  m.lastSeen = Date.now();
  m.conversionRate = m.impressions > 0 ? m.conversions / m.impressions : 0;
  totalConversions++;
  broadcastSnapshot();
}

function getSnapshot(): DashboardSnapshot {
  const variants: Record<string, VariantMetrics> = {};
  for (const [k, v] of metrics) {
    variants[k] = { ...v };
  }
  return {
    variants,
    totalImpressions,
    totalConversions,
    timestamp: Date.now(),
    uptime: (Date.now() - startTime) / 1000,
  };
}

function broadcastSnapshot(): void {
  const snapshot = getSnapshot();
  const data = `data: ${JSON.stringify(snapshot)}\n\n`;
  const encoded = new TextEncoder().encode(data);

  for (const client of [...sseClients]) {
    try {
      client.enqueue(encoded);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ── Demo Server ───────────────────────────────────────────────────────────────

async function startDashboard(port = 8083): Promise<void> {
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",

    async fetch(req) {
      const url = new URL(req.url);
      const cookieHeader = req.headers.get("cookie") ?? "";

      if (url.pathname === "/") {
        const html = `<!DOCTYPE html>
<html>
<head><title>A/B Dashboard</title></head>
<body>
  <h1>A/B Metrics Dashboard</h1>
  <div id="metrics"></div>
  <script>
    const es = new EventSource('/events');
    es.onmessage = e => {
      const s = JSON.parse(e.data);
      document.getElementById('metrics').innerHTML = '<pre>' +
        JSON.stringify(s, null, 2) + '</pre>';
    };
  </script>
</body>
</html>`;
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      if (url.pathname === "/events") {
        let remove: () => void;
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              sseClients.add(controller);
              remove = () => sseClients.delete(controller);
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(getSnapshot())}\n\n`),
              );
            },
            cancel() {
              remove?.();
            },
          }),
          {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          },
        );
      }

      if (url.pathname === "/metrics") {
        return Response.json(getSnapshot());
      }

      if (url.pathname === "/impression" || url.pathname === "/") {
        const cookies = parseCookieMap(cookieHeader);
        const variant = getABVariant(cookies) || "control";
        recordImpression(variant);

        if (url.pathname === "/impression") {
          return Response.json({ ok: true, variant });
        }
      }

      if (url.pathname === "/convert") {
        const cookies = parseCookieMap(cookieHeader);
        const variant = getABVariant(cookies) || "control";
        recordConversion(variant);
        return Response.json({ ok: true, variant });
      }

      if (url.pathname === "/reset") {
        metrics.clear();
        totalImpressions = 0;
        totalConversions = 0;
        broadcastSnapshot();
        return Response.json({ ok: true, message: "Metrics reset" });
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`🚀 A/B Metrics Dashboard: http://127.0.0.1:${server.port}`);
  console.log("\nEndpoints:");
  console.log(`  GET /           - HTML dashboard (auto-refresh via SSE)`);
  console.log(`  GET /events     - SSE stream (real-time metrics)`);
  console.log(`  GET /metrics    - JSON snapshot`);
  console.log(`  GET /impression - Record impression (with Cookie)`);
  console.log(`  GET /convert    - Record conversion (with Cookie)`);
  console.log(`  GET /reset      - Reset metrics\n`);
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

async function runBenchmarks(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ A/B Dashboard Benchmarks                                          ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

  const iterations = 10_000;
  const variants = ["enabled", "disabled", "control"];

  const t1 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    recordImpression(variants[i % 3]);
  }
  const impTime = (Bun.nanoseconds() - t1) / 1e6;

  const t2 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    getSnapshot();
  }
  const snapTime = (Bun.nanoseconds() - t2) / 1e6;

  console.log(`Record impression:  ${(impTime / iterations * 1000).toFixed(3)} μs/op`);
  console.log(`Get snapshot:       ${(snapTime / iterations * 1000).toFixed(3)} μs/op`);
  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] ?? "server";

  if (cmd === "bench") {
    runBenchmarks();
  } else {
    await startDashboard(Number(process.argv[3]) || 8083);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  recordImpression,
  recordConversion,
  getSnapshot,
  broadcastSnapshot,
  startDashboard,
};

export type { VariantMetrics, DashboardSnapshot };
