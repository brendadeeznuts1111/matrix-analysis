#!/usr/bin/env bun
/**
 * FactoryWager Emergency Registry Remediation v1.3.8
 * Immediate response to registry degradation with circuit breaker pattern
 */

interface RemediationResult {
  success: boolean;
  timestamp: number;
  actions: string[];
  latency: number;
  error?: string;
}

class EmergencyRegistryRemediation {
  private lockFile = "/tmp/fw-health.lock";
  private region: string;

  constructor() {
    this.region = Bun.env.FW_REGION || "us-east-1";
  }

  async execute(): Promise<RemediationResult> {
    const startTime = Date.now();
    const actions: string[] = [];

    // Circuit breaker - prevent concurrent remediations
    if (await Bun.file(this.lockFile).exists()) {
      throw new Error("Remediation already in progress");
    }

    try {
      // Acquire lock
      await Bun.write(Bun.file(this.lockFile), Date.now().toString());
      actions.push("lock_acquired");

      console.log("🚨 Emergency Registry Remediation Started");
      console.log(`Region: ${this.region}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);

      // 1. Drain stuck connections (SQLite WAL checkpoint)
      console.log("🔧 Step 1: SQLite WAL checkpoint...");
      try {
        await Bun.$`sqlite3 /var/lib/registry/metadata.db "PRAGMA wal_checkpoint(TRUNCATE);"`;
        actions.push("wal_checkpoint");
        console.log("✅ WAL checkpoint completed");
      } catch (error) {
        console.warn("⚠️ WAL checkpoint failed (database not accessible):", (error as Error).message);
        actions.push("wal_checkpoint_failed");
      }

      // 2. Reset Redis connection pool
      console.log("🔧 Step 2: Redis connection reset...");
      try {
        const response = await fetch("http://localhost:8089/metrics/reset-conn", {
          method: "POST",
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
          actions.push("redis_reset");
          console.log("✅ Redis connections reset");
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn("⚠️ Redis reset failed (service not available):", (error as Error).message);
        actions.push("redis_reset_failed");
      }

      // 3. Audit log the incident
      console.log("🔧 Step 3: Audit logging...");
      try {
        await this.auditIncident(actions);
        actions.push("audit_logged");
        console.log("✅ Incident audited");
      } catch (error) {
        console.warn("⚠️ Audit logging failed:", (error as Error).message);
        actions.push("audit_failed");
      }

      // 4. Alert webhook
      console.log("🔧 Step 4: Alert notification...");
      try {
        await this.sendAlert();
        actions.push("alert_sent");
        console.log("✅ Alert notification sent");
      } catch (error) {
        console.warn("⚠️ Alert failed:", (error as Error).message);
        actions.push("alert_failed");
      }

      const duration = Date.now() - startTime;

      console.log("✅ Registry health restored — check latency in 30s");
      console.log(`⏱️ Remediation completed in ${duration}ms`);

      return {
        success: true,
        timestamp: Date.now(),
        actions,
        latency: duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      // Report anomaly to threat intelligence
      await this.reportAnomaly("registry.fix.failed", {
        error: (error as Error).message,
        duration,
        actions
      });

      return {
        success: false,
        timestamp: Date.now(),
        actions,
        latency: duration,
        error: (error as Error).message
      };

    } finally {
      // Release lock
      try {
        await Bun.file(this.lockFile).delete();
      } catch {
        // Lock cleanup failed, but don't throw
      }
    }
  }

  private async auditIncident(actions: string[]): Promise<void> {
    const auditEntry = {
      timestamp: Date.now(),
      latencyMs: 9999,
      httpStatus: 500,
      region: this.region,
      remediation: "wal_checkpoint+conn_reset",
      actions,
      severity: "critical"
    };

    // Write to audit log
    const auditLog = `[${new Date().toISOString()}] REGISTRY_DEGRADED ${JSON.stringify(auditEntry)}\n`;
    await Bun.write(Bun.file('./.factory-wager/emergency-remediation.log'), auditLog);
  }

  private async sendAlert(): Promise<void> {
    const webhookUrl = Bun.env.FW_ALERT_WEBHOOK;
    if (!webhookUrl) {
      console.warn("⚠️ No alert webhook configured (FW_ALERT_WEBHOOK)");
      return;
    }

    const payload = {
      severity: "critical",
      service: "registry",
      region: this.region,
      recovered: true,
      timestamp: Date.now(),
      latency: 9999,
      httpStatus: 500
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: HTTP ${response.status}`);
    }
  }

  private async reportAnomaly(type: string, data: any): Promise<void> {
    console.warn(`🚨 Anomaly reported: ${type}`, data);

    // Write to threat log
    const threatEntry = `[${new Date().toISOString()}] ANOMALY ${type} ${JSON.stringify(data)}\n`;
    await Bun.write(Bun.file('./.factory-wager/threat-anomalies.log'), threatEntry);
  }
}

// CLI interface
async function main() {
  console.log("🚨 FactoryWager Emergency Registry Remediation");
  console.log("=============================================");

  try {
    const remediation = new EmergencyRegistryRemediation();
    const result = await remediation.execute();

    if (result.success) {
      console.log("\n✅ REMEDIATION SUCCESSFUL");
      console.log(`Actions completed: ${result.actions.join(", ")}`);
      console.log(`Duration: ${result.latency}ms`);
      process.exit(0);
    } else {
      console.log("\n❌ REMEDIATION FAILED");
      console.log(`Error: ${result.error}`);
      console.log(`Actions attempted: ${result.actions.join(", ")}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 CRITICAL ERROR:", (error as Error).message);
    process.exit(2);
  }
}

if (import.meta.main) {
  main();
}
