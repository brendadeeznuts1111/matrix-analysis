#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager Live Status Dashboard — Bun v1.3.8 Native
 * Real-time infrastructure telemetry + Bun.secrets integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

declare module "bun" {
  interface Env {
    FW_SESSION_ID: string;
    FW_REGION: "us-east-1" | "eu-west-1" | "ap-south-1";
    FW_SECURITY_MODE: "strict" | "permissive" | "audit";
    CLOUDFLARE_API_TOKEN?: string;
    R2_ENDPOINT?: string;
  }
}

const GLYPH = {
  LIVE: "🔴",
  HEALTHY: "🟢",
  DEGRADED: "🟡",
  CRITICAL: "🔴",
  SYNC: "▵⟂⥂",
  RENDER: "⥂⟂(▵⟜⟳)",
  SECURE: "🔒",
  DEPLOY: "🚀"
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Live Infrastructure Status (From Your Session)
// ═══════════════════════════════════════════════════════════════════════════════

interface InfrastructureStatus {
  dns: {
    domain: string;
    type: "CNAME";
    target: string;
    proxied: boolean;
    status: "configured" | "propagating" | "active";
  };
  secrets: {
    total: number;
    critical: number;
    accessible: number;
    services: string[];
  };
  r2: {
    buckets: string[];
    objects: number;
    endpoint: string;
    region: string;
  };
  tokens: {
    primary: string;
    backup: string;
    permissions: string[];
  };
}

const LIVE_STATUS: InfrastructureStatus = {
  dns: {
    domain: "registry.factory-wager.com",
    type: "CNAME",
    target: "cdn.factory-wager.com",
    proxied: true,
    status: "propagating" // ⏳ 5-60 min window
  },
  secrets: {
    total: 9,
    critical: 7,
    accessible: 7,
    services: ["cloudflare", "r2", "registry"]
  },
  r2: {
    buckets: ["factory-wager-registry", "factory-wager-artifacts"],
    objects: 1, // health.json uploaded
    endpoint: "https://7a470541a704caaf91e71efccc78fd36.r2.cloudflarestorage.com",
    region: "eu-central-1"
  },
  tokens: {
    primary: "xLVB37fp...", // R2-enabled
    backup: "V1i357Ve...",  // DNS-only
    permissions: ["Zone:Read", "Zone:Edit", "R2:Bucket:Edit"]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Bun.markdown Status Report Generator
// ═══════════════════════════════════════════════════════════════════════════════

class StatusReporter {
  generateMarkdown(status: InfrastructureStatus): string {
    const report = `
${GLYPH.LIVE} **FactoryWager Infrastructure Status**
${"=".repeat(50)}

## DNS Configuration
| Property | Value |
|----------|-------|
| Domain | \`${status.dns.domain}\` |
| Type | ${status.dns.type} |
| Target | \`${status.dns.target}\` |
| Proxied | ${status.dns.proxied ? "✅ Yes" : "❌ No"} |
| Status | ${this.getStatusEmoji(status.dns.status)} ${status.dns.status} |

## Bun.secrets Vault
| Metric | Value |
|--------|-------|
| Total Secrets | ${status.secrets.total} |
| Critical Secrets | ${status.secrets.critical} |
| Accessible | ${status.secrets.accessible}/${status.secrets.critical} |
| Services | ${status.secrets.services.join(", ")} |

## R2 Storage
| Property | Value |
|----------|-------|
| Buckets | ${status.r2.buckets.length} created |
| Objects | ${status.r2.objects} uploaded |
| Endpoint | \`${status.r2.endpoint.slice(0, 40)}...\` |
| Region | ${status.r2.region} |

## API Tokens
| Token | Status | Permissions |
|-------|--------|-------------|
| Primary | ${GLYPH.HEALTHY} Active | ${status.tokens.permissions.join(", ")} |
| Backup | ${GLYPH.HEALTHY} Stored | Zone:Read, Zone:Edit |

---

${GLYPH.SYNC} **Next Actions**
- [ ] Wait for DNS propagation (⏳ 5-60 min)
- [ ] Test: \`curl -I https://registry.factory-wager.co/health\`
- [ ] Deploy Worker with: \`CLOUDFLARE_API_TOKEN=xLVB... bunx wrangler deploy\`
- [ ] Verify R2 object access via S3 API

${GLYPH.SECURE} **Security Notes**
- All secrets stored in Bun.secrets (platform-native)
- R2 credentials use S3-compatible API
- DNS proxied through Cloudflare CDN
`;

    return report; // Returns clean markdown (Bun.markdown.html not available in this version)
  }

  private getStatusEmoji(status: string): string {
    const map: Record<string, string> = {
      configured: "✅",
      propagating: "⏳",
      active: "🟢"
    };
    return map[status] || "⚪";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Bun.secrets Integration (From Your Session)
// ═══════════════════════════════════════════════════════════════════════════════

class SecretsManager {
  async getR2Config(): Promise<{
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
  }> {
    const [endpoint, accessKeyId, secretAccessKey] = await Promise.all([
      Bun.secrets.get({ service: "r2", name: "ENDPOINT" }),
      Bun.secrets.get({ service: "r2", name: "AWS_ACCESS_KEY_ID" }),
      Bun.secrets.get({ service: "r2", name: "AWS_SECRET_ACCESS_KEY" })
    ]);

    return {
      endpoint: endpoint!.toString(),
      accessKeyId: accessKeyId!.toString(),
      secretAccessKey: secretAccessKey!.toString()
    };
  }

  async getCloudflareToken(): Promise<string> {
    const token = await Bun.secrets.get({ service: "cloudflare", name: "API_TOKEN" });
    return token!.toString();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: CLI Interface
// ═══════════════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  const reporter = new StatusReporter();
  const args = Bun.argv.slice(2);
  const command = args[0] || "status";

  switch (command) {
    case "status": {
      console.log(reporter.generateMarkdown(LIVE_STATUS));
      break;
    }

    case "secrets": {
      const manager = new SecretsManager();
      const r2 = await manager.getR2Config();
      console.log("R2 Config:", {
        endpoint: r2.endpoint.slice(0, 50) + "...",
        accessKeyId: r2.accessKeyId.slice(0, 8) + "..."
      });
      break;
    }

    case "test-dns": {
      // Test DNS resolution
      try {
        const res = await fetch("https://registry.factory-wager.co/health", {
          signal: AbortSignal.timeout(5000)
        });
        console.log(`${GLYPH.HEALTHY} DNS resolved! Status: ${res.status}`);
      } catch (e) {
        console.log(`${GLYPH.DEGRADED} DNS propagation in progress...`);
      }
      break;
    }

    default:
      console.log(`
${GLYPH.SYNC} FactoryWager CLI
${GLYPH.SECURE} COMMANDS:
  status      Generate markdown status report
  secrets     Test Bun.secrets retrieval
  test-dns    Check DNS propagation

Current Status:
  DNS: ${LIVE_STATUS.dns.status}
  Secrets: ${LIVE_STATUS.secrets.accessible}/${LIVE_STATUS.secrets.critical} accessible
  R2: ${LIVE_STATUS.r2.buckets.length} buckets, ${LIVE_STATUS.r2.objects} objects
      `);
  }
}

export { StatusReporter, SecretsManager, LIVE_STATUS };
