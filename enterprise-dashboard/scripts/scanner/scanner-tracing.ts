/**
 * Distributed Tracing Support
 * Propagates traceId through the entire toolchain
 */

import * as crypto from "crypto";

export class TracingContext {
  private traceId: string;
  private spanId: string;
  private parentSpanId?: string;
  private baggage: Map<string, string> = new Map();

  constructor(traceId?: string, parentSpanId?: string) {
    this.traceId = traceId || this.generateTraceId();
    this.spanId = this.generateSpanId();
    this.parentSpanId = parentSpanId;
  }

  /**
   * Generate new trace ID
   */
  generateTraceId(): string {
    return crypto.randomBytes(8).toString("hex");
  }

  /**
   * Generate new span ID
   */
  generateSpanId(): string {
    return crypto.randomBytes(4).toString("hex");
  }

  /**
   * Create child span
   */
  createChildSpan(): TracingContext {
    return new TracingContext(this.traceId, this.spanId);
  }

  /**
   * Get trace ID for propagation
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Get span ID
   */
  getSpanId(): string {
    return this.spanId;
  }

  /**
   * Get parent span ID
   */
  getParentSpanId(): string | undefined {
    return this.parentSpanId;
  }

  /**
   * Set baggage (key-value pairs for context)
   */
  setBaggage(key: string, value: string): void {
    this.baggage.set(key, value);
  }

  /**
   * Get baggage
   */
  getBaggage(key: string): string | undefined {
    return this.baggage.get(key);
  }

  /**
   * Export for propagation (e.g., HTTP headers)
   */
  export(): Record<string, string> {
    return {
      "trace-id": this.traceId,
      "span-id": this.spanId,
      ...(this.parentSpanId && { "parent-span-id": this.parentSpanId }),
      ...Object.fromEntries(this.baggage.entries())
    };
  }

  /**
   * Import from propagation (e.g., HTTP headers)
   */
  static import(headers: Record<string, string>): TracingContext {
    const traceId = headers["trace-id"] || headers["x-trace-id"];
    const parentSpanId = headers["span-id"] || headers["x-span-id"];
    const context = new TracingContext(traceId, parentSpanId);

    // Import baggage
    for (const [key, value] of Object.entries(headers)) {
      if (key.startsWith("baggage-") || key.startsWith("x-baggage-")) {
        const baggageKey = key.replace(/^(baggage-|x-baggage-)/, "");
        context.setBaggage(baggageKey, value);
      }
    }

    return context;
  }

  /**
   * Inject into SARIF output
   */
  injectIntoResult(result: any): void {
    result.traceId = this.traceId;
    result.spanId = this.spanId;
    if (this.parentSpanId) {
      result.parentSpanId = this.parentSpanId;
    }
    if (this.baggage.size > 0) {
      result.baggage = Object.fromEntries(this.baggage.entries());
    }
  }
}

/**
 * Get or create tracing context from environment
 */
export function getTracingContext(): TracingContext {
  const traceId = process.env.TRACE_ID;
  const parentSpanId = process.env.PARENT_SPAN_ID;
  
  return new TracingContext(traceId, parentSpanId);
}

/**
 * Propagate trace ID to child processes
 */
export function propagateTraceId(context: TracingContext): Record<string, string> {
  return {
    TRACE_ID: context.getTraceId(),
    PARENT_SPAN_ID: context.getSpanId()
  };
}
