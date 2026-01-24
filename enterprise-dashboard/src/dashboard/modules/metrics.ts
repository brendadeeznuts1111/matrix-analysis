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
import { TIER } from "../../utils/colors.ts";

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
  metricsLog.info(`${TIER.PRO} Advanced Metrics: Enabled`);
  metricsLog.info(`      Sampling: ${METRICS_CONFIG.samplingRate}ms`);
  metricsLog.info(`      Dimensions: ${METRICS_CONFIG.dimensions.length}`);

  // Record startup metric
  collector.record("dashboard.startup", 1, { tier: "pro" });

  // Show stats table
  metricsLog.table([collector.getStats()]);
}

/**
 * Record a custom metric.
 * @param name - Metric name (must be alphanumeric with dots/underscores)
 * @param value - Numeric value (must be finite)
 * @param tags - Optional key-value tags (keys/values must be strings)
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  // Validate metric name
  if (!name || typeof name !== "string" || name.length === 0) {
    return; // Silently skip invalid metrics
  }
  // Metric names should be alphanumeric with dots, underscores, hyphens
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(name)) {
    return;
  }
  // Validate value is a finite number
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return;
  }
  // Validate tags if provided
  if (tags) {
    for (const [key, val] of Object.entries(tags)) {
      if (typeof key !== "string" || typeof val !== "string") {
        return;
      }
    }
  }
  collector.record(name, value, tags);
}

/**
 * Get current collector stats.
 */
export function getMetricsStats() {
  return collector.getStats();
}

export default { startAdvancedMetrics, recordMetric, getMetricsStats };
