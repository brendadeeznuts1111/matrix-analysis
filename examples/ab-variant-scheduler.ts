#!/usr/bin/env bun
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ab-variant-scheduler.ts — Variant Rollout Scheduler (Time-Based)            ║
// ║ PATH: /Users/nolarose/examples/ab-variant-scheduler.ts                      ║
// ║ TYPE: Example  CTX: Time-based rollout  COMPONENTS: Cron + percentage       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * VARIANT ROLLOUT SCHEDULER
 *
 * Time-based rollout control:
 * - Cron-like windows: 9am-5pm = variant A, else control
 * - Percentage: 10% traffic to variant A during window
 * - Day-of-week: Mon-Fri vs weekend
 * - Gradual ramp: 5% → 25% → 50% → 100% over days
 *
 * Usage:
 *   bun run ab-variant-scheduler.ts          # Demo server
 *   bun run ab-variant-scheduler.ts bench    # Benchmarks
 */

import { parseCookieMap, getABVariant } from "./ab-variant-cookies.ts";

// ── Types ────────────────────────────────────────────────────────────────────

interface TimeWindow {
  start: string; // "09:00" (HH:mm)
  end: string;   // "17:00" (HH:mm)
  timezone?: string; // "America/New_York"
  days?: number[];   // 0-6 (Sun-Sat), e.g. [1,2,3,4,5] = Mon-Fri
}

interface RolloutRule {
  variant: string;
  percentage?: number; // 0-100, default 100 when in window
  window?: TimeWindow;
  priority: number; // higher = evaluated first
}

interface SchedulerConfig {
  rules: RolloutRule[];
  defaultVariant: string;
}

// ── Scheduler Logic ───────────────────────────────────────────────────────────

function parseTimeHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

function isInWindow(window: TimeWindow, now: Date): boolean {
  const { start, end, days } = window;

  if (days && days.length > 0) {
    const day = now.getDay();
    if (!days.includes(day)) return false;
  }

  const { h: sh, m: sm } = parseTimeHHMM(start);
  const { h: eh, m: em } = parseTimeHHMM(end);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  if (startMins <= endMins) {
    return nowMins >= startMins && nowMins < endMins;
  }
  return nowMins >= startMins || nowMins < endMins; // overnight
}

function hashToPercent(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h % 100);
}

/**
 * Resolve variant from scheduler rules + cookie override
 */
function resolveScheduledVariant(
  config: SchedulerConfig,
  cookies: Map<string, string>,
  sessionId: string,
  now: Date = new Date(),
): { variant: string; reason: string } {
  const cookieVariant = getABVariant(cookies);
  if (cookieVariant && cookieVariant !== "control") {
    return { variant: cookieVariant, reason: "cookie" };
  }

  const sorted = [...config.rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (!rule.window || isInWindow(rule.window, now)) {
      const pct = rule.percentage ?? 100;
      if (pct >= 100) {
        return { variant: rule.variant, reason: "schedule" };
      }
      const bucket = hashToPercent(sessionId + rule.variant);
      if (bucket < pct) {
        return { variant: rule.variant, reason: "schedule" };
      }
    }
  }

  return { variant: config.defaultVariant, reason: "default" };
}

// ── Demo Config ───────────────────────────────────────────────────────────────

const DEMO_CONFIG: SchedulerConfig = {
  defaultVariant: "control",
  rules: [
    {
      variant: "enabled",
      percentage: 50,
      window: { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
      priority: 10,
    },
    {
      variant: "disabled",
      percentage: 25,
      window: { start: "17:00", end: "09:00", days: [1, 2, 3, 4, 5] },
      priority: 5,
    },
    {
      variant: "control",
      window: { start: "00:00", end: "23:59", days: [0, 6] },
      priority: 1,
    },
  ],
};

// ── Demo Server ───────────────────────────────────────────────────────────────

async function startDemoServer(port = 8084): Promise<void> {
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",

    async fetch(req) {
      const url = new URL(req.url);
      const cookieHeader = req.headers.get("cookie") ?? "";

      const cookies = parseCookieMap(cookieHeader);
      const sessionId = cookies.get("sessionId") ?? crypto.randomUUID();

      const { variant, reason } = resolveScheduledVariant(
        DEMO_CONFIG,
        cookies,
        sessionId,
      );

      if (url.pathname === "/schedule") {
        const now = new Date();
        const activeRules = DEMO_CONFIG.rules
          .filter((r) => !r.window || isInWindow(r.window, now))
          .map((r) => ({ variant: r.variant, percentage: r.percentage ?? 100 }));

        return Response.json({
          variant,
          reason,
          sessionId: sessionId.slice(0, 8),
          activeRules,
          currentTime: now.toISOString(),
          config: DEMO_CONFIG,
        });
      }

      return Response.json({
        variant,
        reason,
        sessionId: sessionId.slice(0, 8),
      }, {
        headers: {
          "Set-Cookie": [
            `ab-variant-${variant.toLowerCase()}=${variant};Path=/;Max-Age=86400;HttpOnly`,
            `sessionId=${sessionId};Path=/;Max-Age=86400;HttpOnly`,
          ].join(", "),
        },
      });
    },
  });

  console.log(`🚀 Variant Rollout Scheduler: http://127.0.0.1:${server.port}`);
  console.log("\nSchedule:");
  console.log("  Mon-Fri 9am-5pm: 50% enabled");
  console.log("  Mon-Fri 5pm-9am: 25% disabled");
  console.log("  Weekend: control");
  console.log("\nEndpoints:");
  console.log(`  GET /         - Resolve variant (cookie > schedule > default)`);
  console.log(`  GET /schedule - Full schedule status\n`);
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

async function runBenchmarks(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║ Variant Scheduler Benchmarks                                      ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

  const iterations = 50_000;
  const cookies = new Map<string, string>();
  const sessionId = crypto.randomUUID();

  const t1 = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    resolveScheduledVariant(
      DEMO_CONFIG,
      cookies,
      sessionId + i,
      new Date("2026-01-31T14:00:00Z"),
    );
  }
  const elapsed = (Bun.nanoseconds() - t1) / 1e6;

  console.log(`Resolve variant:   ${(elapsed / iterations * 1000).toFixed(3)} μs/op`);
  console.log(`Ops/sec:           ${Math.floor(iterations / (elapsed / 1000)).toLocaleString()}`);
  console.log("═══════════════════════════════════════════════════════════════════\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] ?? "server";

  if (cmd === "bench") {
    runBenchmarks();
  } else {
    await startDemoServer(Number(process.argv[3]) || 8084);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  isInWindow,
  resolveScheduledVariant,
  hashToPercent,
  parseTimeHHMM,
};

export type { TimeWindow, RolloutRule, SchedulerConfig };
