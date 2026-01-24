/**
 * Advanced Metrics Module (PRO + ENTERPRISE Tier)
 *
 * Heavy analytics and performance monitoring.
 * Physically removed from Free tier bundles.
 */

import { nanoseconds, inspect } from "bun";
import {
  METRICS_SAMPLING_RATE_MS,
  METRICS_FLUSH_INTERVAL_MS,
  METRICS_MAX_BUFFER_SIZE,
  METRICS_ENDPOINT_TIMEOUT_MS,
} from "../../config/constants.ts";
import { metricsLog } from "../../utils/logger.ts";

// Metrics configuration (uses centralized constants)
const METRICS_CONFIG = {
  samplingRate: METRICS_SAMPLING_RATE_MS,
  flushInterval: METRICS_FLUSH_INTERVAL_MS,
  maxBufferSize: METRICS_MAX_BUFFER_SIZE,
  endpointTimeout: METRICS_ENDPOINT_TIMEOUT_MS,
  endpoints: [
    "https://metrics.internal/v1/ingest",
    "https://analytics.internal/v2/events",
    "https://telemetry.internal/v1/spans",
  ],
  dimensions: [
    "environment", "region", "instance", "version", "tenant",
    "feature_flags", "experiment_id", "user_cohort", "build_hash",
  ],
};

interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

class MetricsCollector {
  private buffer: MetricPoint[] = [];
  private startTime = nanoseconds();

  record(name: string, value: number, tags: Record<string, string> = {}) {
    this.buffer.push({
      name,
      value,
      timestamp: Date.now(),
      tags: { ...tags, uptime_ns: String(nanoseconds() - this.startTime) },
    });

    if (this.buffer.length >= METRICS_CONFIG.maxBufferSize) {
      // Fire-and-forget flush, log errors but don't block
      this.flush().catch((e) => metricsLog.error("Flush error:", e));
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const payload = JSON.stringify(this.buffer);
    const pointCount = this.buffer.length;

    // Clear buffer before sending to avoid double-flush
    this.buffer = [];

    metricsLog.info(`Flushing ${pointCount} points to ${METRICS_CONFIG.endpoints.length} endpoints`);

    // Send to all configured endpoints in parallel
    const results = await Promise.allSettled(
      METRICS_CONFIG.endpoints.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: AbortSignal.timeout(METRICS_CONFIG.endpointTimeout),
        });
        if (!response.ok) {
          throw new Error(`${endpoint} returned ${response.status}`);
        }
        return endpoint;
      })
    );

    // Log failures (don't throw - metrics should not crash the app)
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failures.length > 0) {
      metricsLog.error(`${failures.length}/${METRICS_CONFIG.endpoints.length} endpoints failed:`,
        failures.map(f => f.reason?.message || "Unknown error").join(", ")
      );
    }
  }

  getStats() {
    return {
      buffered: this.buffer.length,
      uptime: ((nanoseconds() - this.startTime) / 1e9).toFixed(2) + "s",
      endpoints: METRICS_CONFIG.endpoints.length,
    };
  }
}

const collector = new MetricsCollector();

/**
 * Start advanced metrics collection.
 * PRO/ENTERPRISE feature.
 */
export function startAdvancedMetrics() {
  metricsLog.info("\x1b[35m[PRO]\x1b[0m Advanced Metrics: Enabled");
  metricsLog.info(`      Sampling: ${METRICS_CONFIG.samplingRate}ms`);
  metricsLog.info(`      Dimensions: ${METRICS_CONFIG.dimensions.length}`);

  // Record startup metric
  collector.record("dashboard.startup", 1, { tier: "pro" });

  // Show stats table
  metricsLog.table([collector.getStats()]);
}

/**
 * Record a custom metric.
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  collector.record(name, value, tags);
}

/**
 * Get current collector stats.
 */
export function getMetricsStats() {
  return collector.getStats();
}

export default { startAdvancedMetrics, recordMetric, getMetricsStats };
