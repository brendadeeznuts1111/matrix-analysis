/**
 * Enhanced Scanner Metrics with Distributed Tracing
 * Provides observability and performance tracking
 */

import type { ScanResult, ScanIssue } from "./enterprise-scanner.ts";

export interface MetricSpan {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class ScannerMetrics {
  private traceId: string;
  private spans: Map<string, MetricSpan> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(traceId: string) {
    this.traceId = traceId;
  }

  /**
   * Start a metric span
   */
  span(name: string, metadata?: Record<string, unknown>): () => void {
    const spanId = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const span: MetricSpan = {
      name,
      startTime: Date.now(),
      metadata
    };
    this.spans.set(spanId, span);

    // Return end function
    return () => {
      const endTime = Date.now();
      const span = this.spans.get(spanId);
      if (span) {
        span.endTime = endTime;
        span.duration = endTime - span.startTime;
        this.recordHistogram(`${name}_duration_ms`, span.duration);
      }
    };
  }

  /**
   * Increment counter
   */
  increment(name: string, value: number = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) + value);
  }

  /**
   * Set gauge value
   */
  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(value);
  }

  /**
   * Get all metrics
   */
  getMetrics(): {
    traceId: string;
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, { count: number; min: number; max: number; avg: number; p50: number; p95: number; p99: number }>;
    spans: MetricSpan[];
  } {
    const histogramStats: Record<string, any> = {};
    
    for (const [name, values] of this.histograms.entries()) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      
      histogramStats[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }

    return {
      traceId: this.traceId,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramStats,
      spans: Array.from(this.spans.values())
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Counters
    for (const [name, value] of Object.entries(metrics.counters)) {
      lines.push(`# HELP scanner_${name} Scanner counter metric`);
      lines.push(`# TYPE scanner_${name} counter`);
      lines.push(`scanner_${name}{trace_id="${metrics.traceId}"} ${value}`);
    }

    // Gauges
    for (const [name, value] of Object.entries(metrics.gauges)) {
      lines.push(`# HELP scanner_${name} Scanner gauge metric`);
      lines.push(`# TYPE scanner_${name} gauge`);
      lines.push(`scanner_${name}{trace_id="${metrics.traceId}"} ${value}`);
    }

    // Histograms
    for (const [name, stats] of Object.entries(metrics.histograms)) {
      lines.push(`# HELP scanner_${name} Scanner histogram metric`);
      lines.push(`# TYPE scanner_${name} histogram`);
      lines.push(`scanner_${name}_count{trace_id="${metrics.traceId}"} ${stats.count}`);
      lines.push(`scanner_${name}_min{trace_id="${metrics.traceId}"} ${stats.min}`);
      lines.push(`scanner_${name}_max{trace_id="${metrics.traceId}"} ${stats.max}`);
      lines.push(`scanner_${name}_avg{trace_id="${metrics.traceId}"} ${stats.avg}`);
      lines.push(`scanner_${name}_p50{trace_id="${metrics.traceId}"} ${stats.p50}`);
      lines.push(`scanner_${name}_p95{trace_id="${metrics.traceId}"} ${stats.p95}`);
      lines.push(`scanner_${name}_p99{trace_id="${metrics.traceId}"} ${stats.p99}`);
    }

    return lines.join("\n") + "\n";
  }
}
