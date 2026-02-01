#!/usr/bin/env bun
/**
 * FactoryWager Reality Configuration
 * Distinguishes simulated vs. live modes for transparent infrastructure
 */

import { s3 } from "bun";

export const RealityCheck = {
  r2: {
    isReal: (): boolean => {
      const id = process.env.R2_ACCESS_KEY_ID;
      const secret = process.env.R2_SECRET_ACCESS_KEY;
      const endpoint = process.env.R2_ENDPOINT;
      
      return id && !id.includes("demo") && id.length >= 20 &&
             secret && !secret.includes("demo") && secret.length >= 20 &&
             endpoint && !endpoint.includes("demo");
    },
    
    endpoint: (): string => {
      return RealityCheck.r2.isReal() 
        ? (process.env.R2_ENDPOINT || "https://api.cloudflare.com/client/v4/accounts")
        : "file://./.factory-wager/simulated-r2";
    },
    
    mode: (): "LIVE" | "SIMULATED" => {
      return RealityCheck.r2.isReal() ? "LIVE" : "SIMULATED";
    },
    
    async testConnection(): Promise<{ connected: boolean; error?: string; latency?: number }> {
      if (!RealityCheck.r2.isReal()) {
        return { connected: false, error: "Simulated mode - no real connection" };
      }
      
      try {
        const startTime = Bun.nanoseconds();
        const creds = {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          bucket: process.env.R2_BUCKET_NAME || "factory-wager",
          endpoint: process.env.R2_ENDPOINT!
        };
        
        const list = await s3(creds).listObjects({ maxKeys: 1 });
        const endTime = Bun.nanoseconds();
        
        return { 
          connected: true, 
          latency: Math.round((endTime - startTime) / 1_000_000) // Convert to ms
        };
      } catch (error) {
        return { connected: false, error: (error as Error).message };
      }
    }
  },
  
  mcp: {
    servers: [
      "filesystem",
      "github", 
      "git",
      "fetch",
      "context7",
      "sequential-thinking"
    ],
    
    async installed(server: string): Promise<boolean> {
      try {
        const proc = Bun.spawn(["bunx", "--yes", `@modelcontextprotocol/server-${server}`, "--version"], {
          stdio: "pipe",
          timeout: 3000
        });
        const exit = await proc.exited;
        return exit === 0;
      } catch {
        return false;
      }
    },
    
    async checkAll(): Promise<Array<{ server: string; installed: boolean; latency?: number }>> {
      const checks = await Promise.all(
        RealityCheck.mcp.servers.map(async (server) => {
          const startTime = Bun.nanoseconds();
          const installed = await RealityCheck.mcp.installed(server);
          const endTime = Bun.nanoseconds();
          
          return {
            server,
            installed,
            latency: installed ? Math.round((endTime - startTime) / 1_000_000) : undefined
          };
        })
      );
      
      return checks;
    }
  },

  secrets: {
    criticalKeys: [
      "com.factory-wager.r2.access_key_id",
      "com.factory-wager.r2.secret_access_key",
      "com.factory-wager.r2.account_id",
      "com.factory-wager.prod.PROD_DB_PASSWORD",
      "com.factory-wager.prod.API_KEY"
    ],
    
    async source(key: string): Promise<{ source: string; real: boolean; value?: string }> {
      try {
        // Try Bun.secrets first
        try {
          const fromBunSecrets = await Bun.secrets.get("r2", key);
          if (fromBunSecrets) {
            return { 
              source: "BUN_SECRETS", 
              real: !String(fromBunSecrets).includes("demo") && String(fromBunSecrets).length > 5,
              value: String(fromBunSecrets)
            };
          }
        } catch {
          // Bun.secrets not available or failed
        }
        
        // Try environment variables
        const envKey = key.replace(/\./g, "_").toUpperCase();
        const fromEnv = process.env[envKey];
        if (fromEnv) {
          return { 
            source: "ENVIRONMENT", 
            real: !fromEnv.includes("demo") && fromEnv.length > 5,
            value: fromEnv
          };
        }
        
        return { source: "NONE", real: false };
      } catch (error) {
        return { source: "ERROR", real: false };
      }
    },
    
    async auditAll(): Promise<Array<{ key: string; source: string; real: boolean; isDemo: boolean }>> {
      const audit = await Promise.all(
        RealityCheck.secrets.criticalKeys.map(async (key) => {
          const result = await RealityCheck.secrets.source(key);
          return {
            key: key.split(".").pop(),
            source: result.source,
            real: result.real,
            isDemo: result.value ? result.value.includes("demo") : false
          };
        })
      );
      
      return audit;
    }
  },
  
  overall: {
    async getRealityStatus(): Promise<{
      r2: { mode: string; connected: boolean; error?: string };
      mcp: { installed: number; total: number; servers: Array<{ server: string; installed: boolean }> };
      secrets: { real: number; total: number; missing: number };
      overall: "LIVE" | "MIXED" | "SIMULATED";
    }> {
      const r2Test = await RealityCheck.r2.testConnection();
      const mcpCheck = await RealityCheck.mcp.checkAll();
      const secretsAudit = await RealityCheck.secrets.auditAll();
      
      const r2Live = RealityCheck.r2.isReal() && r2Test.connected;
      const mcpLive = mcpCheck.filter(s => s.installed).length >= 3;
      const secretsLive = secretsAudit.filter(s => s.real).length >= 2;
      
      let overall: "LIVE" | "MIXED" | "SIMULATED";
      if (r2Live && mcpLive && secretsLive) {
        overall = "LIVE";
      } else if (r2Live || mcpLive || secretsLive) {
        overall = "MIXED";
      } else {
        overall = "SIMULATED";
      }
      
      return {
        r2: {
          mode: RealityCheck.r2.mode(),
          connected: r2Test.connected,
          error: r2Test.error
        },
        mcp: {
          installed: mcpCheck.filter(s => s.installed).length,
          total: mcpCheck.length,
          servers: mcpCheck
        },
        secrets: {
          real: secretsAudit.filter(s => s.real).length,
          total: secretsAudit.length,
          missing: secretsAudit.filter(s => s.source === "NONE").length
        },
        overall
      };
    }
  }
};

// CLI integration
if (import.meta.main) {
  console.log("🔍 FactoryWager Reality Audit");
  console.log("=" .repeat(40));
  
  const status = await RealityCheck.overall.getRealityStatus();
  
  // R2 Status
  console.log(`🌐 R2 Storage: ${status.r2.mode}`);
  if (status.r2.connected) {
    console.log(`   ✅ Connected and responsive`);
  } else {
    console.log(`   ❌ ${status.r2.error || "Not connected"}`);
  }
  
  // MCP Status  
  console.log(`🔄 MCP Servers: ${status.mcp.installed}/${status.mcp.total} installed`);
  status.mcp.servers.forEach(server => {
    console.log(`   ${server.installed ? "✅" : "❌"} ${server.server}`);
  });
  
  // Secrets Status
  console.log(`🔐 Secrets: ${status.secrets.real}/${status.secrets.total} real`);
  console.log(`   Missing: ${status.secrets.missing} secrets`);
  
  // Overall Status
  const overallIcon = status.overall === "LIVE" ? "🌐" : 
                     status.overall === "MIXED" ? "🔄" : "💾";
  console.log(`\n${overallIcon} Overall Mode: ${status.overall}`);
  
  // Security Warning
  if (status.overall === "MIXED") {
    console.log("⚠️ WARNING: Mixed reality configuration - some components simulated");
  }
}

export default RealityCheck;
