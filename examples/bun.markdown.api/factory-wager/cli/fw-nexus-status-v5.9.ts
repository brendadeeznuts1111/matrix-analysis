#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager Nexus Status v5.9 — Enhanced Validation & Monitoring
 * Bun.markdown reporting | UTI secrets | Enterprise persistence | Drift detection
 * ═══════════════════════════════════════════════════════════════════════════════
 */

declare module "bun" {
  interface Env {
    FW_NEXUS_VERSION: string;
    FW_HEALTH_THRESHOLD: string;
    FW_DRIFT_TOLERANCE: string;
  }
}

import { Database } from "bun:sqlite";

const GLYPH = {
  NEXUS: "🔌",
  HEALTHY: "🟢",
  WARNING: "🟡",
  CRITICAL: "🔴",
  SYNC: "▵⟂⥂",
  DRIFT: "⥂⟂(▵⟜⟳)",
  VALIDATE: "✓",
  ENTERPRISE: "🏢"
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Enhanced Endpoint Configuration (From Your Session)
// ═══════════════════════════════════════════════════════════════════════════════

interface EndpointConfig {
  doc: number;
  key: string;
  url: string;
  environment: "development" | "staging" | "production";
  expectedStatus: number;
  timeout: number;
}

const ENDPOINT_REGISTRY: EndpointConfig[] = [
  { doc: 0, key: "dev.api.url", url: "http://dev.factory-wager.localhost:3000", environment: "development", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "dev.registry.url", url: "http://dev.registry.factory-wager.localhost:3000", environment: "development", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "dev.r2.endpoint", url: "http://dev.r2.factory-wager.localhost:3000", environment: "development", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "dev.cdn.url", url: "http://dev.cdn.factory-wager.localhost:3000", environment: "development", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "dev.monitoring.url", url: "http://dev.status.factory-wager.localhost:3000", environment: "development", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "development.api.url", url: "http://localhost:3000", environment: "development", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "staging.api.url", url: "http://localhost:3001", environment: "staging", expectedStatus: 200, timeout: 5000 },
  { doc: 0, key: "production.api.url", url: "http://localhost:3002", environment: "production", expectedStatus: 200, timeout: 5000 }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Health Probe with Bun-native Performance
// ═══════════════════════════════════════════════════════════════════════════════

interface HealthProbe {
  key: string;
  url: string;
  status: "up" | "down" | "warning";
  latency: number;
  httpStatus?: number;
  drift: "match" | "mismatch" | "unknown";
  timestamp: string;
  error?: string;
}

class NexusProber {
  private driftTolerance = parseInt(Bun.env.FW_DRIFT_TOLERANCE || "100"); // ms

  async probeEndpoint(config: EndpointConfig): Promise<HealthProbe> {
    const start = performance.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(config.url, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);
      
      // Check for drift (latency variance)
      const expectedLatency = 20; // baseline
      const drift = Math.abs(latency - expectedLatency) > this.driftTolerance 
        ? "mismatch" 
        : "match";

      return {
        key: config.key,
        url: config.url,
        status: response.ok ? "up" : "warning",
        latency,
        httpStatus: response.status,
        drift,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        key: config.key,
        url: config.url,
        status: "down",
        latency: 9999,
        drift: "unknown",
        timestamp: new Date().toISOString(),
        error: (error as Error).name
      };
    }
  }

  async probeAll(endpoints: EndpointConfig[]): Promise<HealthProbe[]> {
    console.log(`${GLYPH.NEXUS} Probing ${endpoints.length} endpoints...\n`);
    
    // Parallel probing with Bun's async I/O
    const probes = await Promise.all(
      endpoints.map(e => this.probeEndpoint(e))
    );
    
    return probes.sort((a, b) => a.latency - b.latency);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Bun.markdown Report Generator
// ═══════════════════════════════════════════════════════════════════════════════

class NexusReporter {
  /**
   * Generate ANSI terminal table (enhanced from your output)
   */
  generateTable(probes: HealthProbe[]): string {
    const rows = probes.map(p => {
      const statusIcon = p.status === "up" ? "✓" : p.status === "warning" ? "⚠" : "✗";
      const statusColor = p.status === "up" ? "\x1b[32m" : p.status === "warning" ? "\x1b[33m" : "\x1b[31m";
      const reset = "\x1b[0m";
      
      return `${statusColor}${statusIcon}${reset}  │ ${p.key.padEnd(24)} │ ${p.url.slice(0, 28).padEnd(28)} │ ${p.latency.toString().padStart(5)}ms │ ${p.drift}`;
    }).join('\n');

    return `
${GLYPH.NEXUS} **FactoryWager Nexus Status v5.9**
${"█".repeat(64)}

| Status | Endpoint Key | URL | Latency | Drift |
|--------|--------------|-----|---------|-------|
${rows}
`;
  }

  /**
   * Generate HTML report with Bun.markdown
   */
  generateHTML(probes: HealthProbe[], healthScore: number): string {
    const up = probes.filter(p => p.status === "up").length;
    const down = probes.filter(p => p.status === "down").length;
    
    const markdown = `
# ${GLYPH.NEXUS} FactoryWager Nexus Status Report

## Executive Summary
| Metric | Value |
|--------|-------|
| Health Score | ${healthScore}/100 |
| Endpoints Up | ${up}/${probes.length} |
| Endpoints Down | ${down} |
| Average Latency | ${Math.round(probes.reduce((a, p) => a + p.latency, 0) / probes.length)}ms |
| Drift Status | ${probes.every(p => p.drift === "match") ? "✅ Aligned" : "⚠️ Variance detected"} |

## Endpoint Details
| Endpoint | Status | Latency | HTTP | Drift |
|----------|--------|---------|------|-------|
${probes.map(p => `| ${p.key} | ${p.status} | ${p.latency}ms | ${p.httpStatus || 'N/A'} | ${p.drift} |`).join('\n')}

## Recommendations
${healthScore < 90 ? `- ⚠️ Health score below threshold (${healthScore} < 90)\n- Run: \`bun run fw:deploy --sync\`` : "- ✅ All systems operational"}

${GLYPH.SYNC} **Generated:** ${new Date().toISOString()}
`;

    return Bun.markdown.html(markdown, { headingIds: true, gfm: true });
  }

  /**
   * Calculate health score with weighted metrics
   */
  calculateHealthScore(probes: HealthProbe[]): number {
    const up = probes.filter(p => p.status === "up").length;
    const warning = probes.filter(p => p.status === "warning").length;
    const down = probes.filter(p => p.status === "down").length;
    
    // Weighted scoring
    const upWeight = 100 / probes.length;
    const warningWeight = upWeight * 0.5;
    
    let score = (up * upWeight) + (warning * warningWeight);
    
    // Penalty for down endpoints
    score -= (down * 10);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Drift Detection & SQLite Persistence
// ═══════════════════════════════════════════════════════════════════════════════

class DriftAnalyzer {
  private db: Database;

  constructor() {
    this.db = new Database(".factory-wager/nexus-history.db");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS probes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        key TEXT,
        url TEXT,
        status TEXT,
        latency INTEGER,
        drift TEXT,
        health_score INTEGER
      )
    `);
  }

  recordProbe(probe: HealthProbe, healthScore: number): void {
    this.db.run(`
      INSERT INTO probes (timestamp, key, url, status, latency, drift, health_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [probe.timestamp, probe.key, probe.url, probe.status, probe.latency, probe.drift, healthScore]);
  }

  getDriftTrend(key: string, hours: number = 24): Array<{ hour: string; avgLatency: number }> {
    return this.db.query(`
      SELECT strftime('%H', timestamp) as hour, AVG(latency) as avgLatency
      FROM probes
      WHERE key = ? AND timestamp > datetime('now', '-${hours} hours')
      GROUP BY hour
      ORDER BY hour
    `).all() as any[];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Enterprise Secrets Integration
// ═══════════════════════════════════════════════════════════════════════════════

class NexusSecrets {
  async getMonitoringToken(): Promise<string | null> {
    try {
      // UTI format: com.factory-wager.nexus.prod/monitoring-token
      const token = await Bun.secrets.get({
        service: "com.factory-wager.nexus",
        name: "monitoring-token"
      });
      return token;
    } catch {
      // Fallback to env for CI
      return Bun.env.NEXUS_MONITORING_TOKEN || null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: CLI Interface
// ═══════════════════════════════════════════════════════════════════════════════

class NexusCLI {
  private prober = new NexusProber();
  private reporter = new NexusReporter();
  private driftAnalyzer = new DriftAnalyzer();
  private secrets = new NexusSecrets();

  async run(args: string[]): Promise<void> {
    const configPath = args.find(a => a.startsWith("--config="))?.split("=")[1] || "config.yaml";
    const strict = args.includes("--strict");
    const env = args.find(a => a.startsWith("--env="))?.split("=")[1] || "development";

    console.log(`${GLYPH.NEXUS} FactoryWager Nexus Status v5.9`);
    console.log(`Mode: ${strict ? "strict" : "standard"} | Environment: ${env}\n`);

    // Load endpoints from config (simplified - would parse YAML)
    const endpoints = ENDPOINT_REGISTRY.filter(e => 
      env === "development" ? e.environment === "development" : true
    );

    // Probe all endpoints
    const probes = await this.prober.probeAll(endpoints);
    
    // Calculate health
    const healthScore = this.reporter.calculateHealthScore(probes);
    
    // Record to SQLite
    for (const probe of probes) {
      this.driftAnalyzer.recordProbe(probe, healthScore);
    }

    // Generate reports
    const table = this.reporter.generateTable(probes);
    console.log(table);

    // Summary
    const up = probes.filter(p => p.status === "up").length;
    const down = probes.filter(p => p.status === "down").length;
    
    console.log(`\n${"─".repeat(64)}`);
    console.log(`Summary:`);
    console.log(`  Endpoints: ${up} up, ${probes.length - up - down} warning, ${down} down (total: ${probes.length})`);
    console.log(`  Avg Latency: ${(probes.reduce((a, p) => a + p.latency, 0) / probes.length).toFixed(1)}ms`);
    console.log(`  Config Drift: ${probes.filter(p => p.drift === "mismatch").length} mismatches`);
    console.log(`  Health Score: ${healthScore}/100 ${healthScore >= 90 ? "[GREEN]" : healthScore >= 70 ? "[YELLOW]" : "[RED]"}`);

    // Recommendations
    if (healthScore < 90) {
      console.log(`\n⚠️ RECOMMENDATION: Health score ${healthScore} (< 90)`);
      console.log(`  Run: bun run fw:deploy --sync`);
      console.log(`  Check failed endpoint accessibility`);
    }

    // Generate HTML report
    const html = this.reporter.generateHTML(probes, healthScore);
    await Bun.write(".factory-wager/reports/nexus-status.html", html);
    console.log(`\n📄 Report: .factory-wager/reports/nexus-status.html`);

    // Exit code for CI
    if (strict && healthScore < 90) {
      process.exit(1);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Execution
// ═══════════════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  const cli = new NexusCLI();
  await cli.run(Bun.argv.slice(2));
}

export { NexusProber, NexusReporter, DriftAnalyzer, NexusCLI };
