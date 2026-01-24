/**
 * Prometheus Metrics Server for Scanner
 * Exposes metrics for observability integration
 */

import { serve } from "bun";

export class MetricsServer {
  private port: number;
  private metricsCollector: any;

  constructor(port: number, metricsCollector: any) {
    this.port = port;
    this.metricsCollector = metricsCollector;
  }

  start(): void {
    serve({
      port: this.port,
      fetch: async (req) => {
        const url = new URL(req.url);
        
        if (url.pathname === "/metrics") {
          const metrics = this.metricsCollector.getMetrics();
          const prometheusFormat = this.formatPrometheus(metrics);
          
          return new Response(prometheusFormat, {
            headers: {
              "Content-Type": "text/plain; version=0.0.4"
            }
          });
        }

        if (url.pathname === "/health") {
          return new Response(JSON.stringify({ status: "healthy" }), {
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response("Not Found", { status: 404 });
      }
    });

    console.log(`📊 Metrics server started on port ${this.port}`);
    console.log(`   http://localhost:${this.port}/metrics`);
  }

  private formatPrometheus(metrics: Record<string, number>): string {
    const lines: string[] = [];
    
    for (const [key, value] of Object.entries(metrics)) {
      lines.push(`# HELP ${key} Scanner metric`);
      lines.push(`# TYPE ${key} gauge`);
      lines.push(`${key} ${value}`);
    }

    return lines.join("\n") + "\n";
  }
}
