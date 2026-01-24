/**
 * Health Check Server
 * Provides /health, /ready, and /live endpoints for K8s probes
 */

import { getMetricsStats } from "../dashboard/modules/metrics.ts";

interface HealthStatus {
  status: "ok" | "degraded" | "unhealthy";
  uptime: number;
  timestamp: string;
  version: string;
  checks: {
    name: string;
    status: "pass" | "fail" | "warn";
    message?: string;
  }[];
}

// Cache for expensive health checks (refresh every 10s)
let cachedHealth: HealthStatus | null = null;
let lastHealthCheck = 0;
const HEALTH_CACHE_MS = 10_000;

async function performHealthChecks(): Promise<HealthStatus> {
  const now = Date.now();

  // Return cached result if fresh
  if (cachedHealth && now - lastHealthCheck < HEALTH_CACHE_MS) {
    return cachedHealth;
  }

  const checks: HealthStatus["checks"] = [];
  let overallStatus: HealthStatus["status"] = "ok";

  // Check 1: Metrics collector
  try {
    const metricsStats = getMetricsStats();
    checks.push({
      name: "metrics",
      status: "pass",
      message: `${metricsStats.buffered} buffered, ${metricsStats.uptime} uptime`,
    });
  } catch (error: unknown) {
    checks.push({
      name: "metrics",
      status: "warn",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    overallStatus = "degraded";
  }

  // Check 2: Memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  if (heapPercent > 90) {
    checks.push({
      name: "memory",
      status: "fail",
      message: `Heap ${heapPercent}% used (${heapUsedMB}/${heapTotalMB}MB)`,
    });
    overallStatus = "unhealthy";
  } else if (heapPercent > 75) {
    checks.push({
      name: "memory",
      status: "warn",
      message: `Heap ${heapPercent}% used (${heapUsedMB}/${heapTotalMB}MB)`,
    });
    if (overallStatus === "ok") overallStatus = "degraded";
  } else {
    checks.push({
      name: "memory",
      status: "pass",
      message: `Heap ${heapPercent}% used (${heapUsedMB}/${heapTotalMB}MB)`,
    });
  }

  // Check 3: Event loop responsiveness (simple check)
  const eventLoopStart = Date.now();
  await new Promise((resolve) => setImmediate(resolve));
  const eventLoopLag = Date.now() - eventLoopStart;

  if (eventLoopLag > 100) {
    checks.push({
      name: "eventloop",
      status: "warn",
      message: `${eventLoopLag}ms lag`,
    });
    if (overallStatus === "ok") overallStatus = "degraded";
  } else {
    checks.push({
      name: "eventloop",
      status: "pass",
      message: `${eventLoopLag}ms lag`,
    });
  }

  cachedHealth = {
    status: overallStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks,
  };
  lastHealthCheck = now;

  return cachedHealth;
}

/**
 * Start health check server on specified port
 */
export function startHealthServer(port = 3001): ReturnType<typeof Bun.serve> {
  const server = Bun.serve({
    port,
    fetch: async (req) => {
      const url = new URL(req.url);
      const path = url.pathname;

      // CORS headers for monitoring tools
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      };

      switch (path) {
        case "/health": {
          const health = await performHealthChecks();
          const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;
          return Response.json(health, { status: statusCode, headers });
        }

        case "/ready": {
          // Readiness: can we accept traffic?
          const health = await performHealthChecks();
          if (health.status === "unhealthy") {
            return Response.json({ ready: false }, { status: 503, headers });
          }
          return Response.json({ ready: true }, { status: 200, headers });
        }

        case "/live": {
          // Liveness: is the process alive? (cheap check)
          return Response.json({ alive: true, uptime: process.uptime() }, { status: 200, headers });
        }

        case "/metrics": {
          // Simple metrics endpoint (not Prometheus format, just JSON)
          const health = await performHealthChecks();
          const mem = process.memoryUsage();
          return Response.json({
            uptime_seconds: process.uptime(),
            memory_heap_used_bytes: mem.heapUsed,
            memory_heap_total_bytes: mem.heapTotal,
            memory_rss_bytes: mem.rss,
            health_status: health.status,
            health_checks: health.checks.length,
          }, { status: 200, headers });
        }

        default:
          return Response.json({ error: "Not Found" }, { status: 404, headers });
      }
    },
  });

  console.log(`Health server listening on http://localhost:${server.port}`);
  return server;
}

export { performHealthChecks };
