// enterprise-tenant-archiver.ts
import { readdir, writeFile, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { $ } from "bun";

// ============================================================================
// ENTERPRISE INTEGRATION CONFIGURATION
// ============================================================================

interface EnterpriseConfig {
  // R2 Configuration
  r2: {
    accountId: string;
    bucket: string;
    region: string;
    endpoint: string;
  };

  // Domain Configuration
  domain: {
    baseUrl: string;
    tenantSubdomainPattern: string;
    dnsProvider: 'cloudflare' | 'route53' | 'digitalocean';
  };

  // OpenClaw Configuration
  openclaw: {
    gatewayUrl: string;
    agentId: string;
    channelId: string;
    notifications: boolean;
  };

  // Bunx Configuration
  bunx: {
    tools: string[];
    version: string;
    registry: string;
  };
}

const ENTERPRISE_CONFIG: EnterpriseConfig = {
  r2: {
    accountId: process.env.CF_ACCOUNT_ID || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error("CF_ACCOUNT_ID environment variable is required for production deployment");
      }
      return "dev-account-id";
    })(),
    bucket: process.env.R2_BUCKET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error("R2_BUCKET environment variable is required for production deployment");
      }
      return "dev-backups";
    })(),
    region: "auto",
    endpoint: `https://${process.env.CF_ACCOUNT_ID || "dev-account-id"}.r2.cloudflarestorage.com`,
  },

  domain: {
    baseUrl: process.env.DOMAIN_BASE_URL || "https://factory-wager.com",
    tenantSubdomainPattern: "{tenant}.factory-wager.com",
    dnsProvider: 'cloudflare',
  },

  openclaw: {
    gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789",
    agentId: process.env.OPENCLAW_AGENT_ID || "tenant-archiver",
    channelId: process.env.OPENCLAW_CHANNEL_ID || "enterprise-alerts",
    notifications: process.env.OPENCLAW_NOTIFICATIONS !== "false",
  },

  bunx: {
    tools: ["wrangler", "sqlite3", "gzip", "tar", "openssl"],
    version: "latest",
    registry: "https://registry.npmjs.org",
  }
};

// ============================================================================
// ENTERPRISE CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Get enterprise credentials using Bun.secrets with multiple fallbacks
 */
async function getEnterpriseCredentials(): Promise<{
  r2: { accessKeyId: string; secretAccessKey: string };
  domain: { apiKey: string; zoneId: string };
  openclaw: { authToken: string };
}> {
  const credentials = {
    r2: { accessKeyId: "", secretAccessKey: "" },
    domain: { apiKey: "", zoneId: "" },
    openclaw: { authToken: "" }
  };

  try {
    // Try Bun.secrets first (most secure)
    credentials.r2.accessKeyId = await Bun.secrets.get({ service: "bun", name: "com.factory-wager.r2.access-key-id" }) || "";
    credentials.r2.secretAccessKey = await Bun.secrets.get({ service: "bun", name: "com.factory-wager.r2.secret-access-key" }) || "";
    credentials.domain.apiKey = await Bun.secrets.get({ service: "bun", name: "com.factory-wager.cloudflare.api-key" }) || "";
    credentials.domain.zoneId = await Bun.secrets.get({ service: "bun", name: "com.factory-wager.cloudflare.zone-id" }) || "";
    credentials.openclaw.authToken = await Bun.secrets.get({ service: "bun", name: "com.factory-wager.openclaw.auth-token" }) || "";
  } catch (error) {
    console.log("⚠️  Bun.secrets not available, using environment variables");
  }

  // Fallback to environment variables
  credentials.r2.accessKeyId ||= process.env.R2_ACCESS_KEY_ID || "";
  credentials.r2.secretAccessKey ||= process.env.R2_SECRET_ACCESS_KEY || "";
  credentials.domain.apiKey ||= process.env.CLOUDFLARE_API_KEY || "";
  credentials.domain.zoneId ||= process.env.CLOUDFLARE_ZONE_ID || "";
  credentials.openclaw.authToken ||= process.env.OPENCLAW_AUTH_TOKEN || "";

  // Validate critical credentials
  if (!credentials.r2.accessKeyId || !credentials.r2.secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return credentials;
}

// ============================================================================
// DOMAIN MANAGEMENT INTEGRATION
// ============================================================================

/**
 * Create tenant subdomain via DNS provider with input validation
 */
export async function createTenantDomain(tenantId: string): Promise<string> {
  // Validate tenant ID to prevent injection and ensure valid format
  if (!tenantId || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}. Must be 3-63 characters, alphanumeric with hyphens/underscores, no leading/trailing hyphens/underscores.`);
  }

  if (tenantId.length < 3 || tenantId.length > 63) {
    throw new Error(`Tenant ID must be between 3 and 63 characters: ${tenantId}`);
  }

  const credentials = await getEnterpriseCredentials();
  const subdomain = ENTERPRISE_CONFIG.domain.tenantSubdomainPattern.replace("{tenant}", tenantId);

  try {
    console.log(`🌐 Creating tenant domain: ${subdomain}`);

    switch (ENTERPRISE_CONFIG.domain.dnsProvider) {
      case 'cloudflare':
        return await createCloudflareRecord(subdomain, credentials.domain);
      case 'route53':
        return await createRoute53Record(subdomain, credentials.domain);
      case 'digitalocean':
        return await createDigitalOceanRecord(subdomain, credentials.domain);
      default:
        throw new Error(`Unsupported DNS provider: ${ENTERPRISE_CONFIG.domain.dnsProvider}`);
    }
  } catch (error) {
    console.error("❌ Domain creation failed:", error);
    throw error;
  }
}

/**
 * Create Cloudflare DNS record with proper security
 */
async function createCloudflareRecord(subdomain: string, domainConfig: { apiKey: string; zoneId: string }): Promise<string> {
  try {
    // Validate inputs to prevent command injection
    if (!/^[a-zA-Z0-9.-]+$/.test(subdomain)) {
      throw new Error(`Invalid subdomain format: ${subdomain}`);
    }
    if (!/^[a-f0-9]{32}$/.test(domainConfig.zoneId)) {
      throw new Error(`Invalid zone ID format: ${domainConfig.zoneId}`);
    }
    if (!/^[a-zA-Z0-9_-]{36,}$/.test(domainConfig.apiKey)) {
      throw new Error(`Invalid API key format`);
    }

    // Use environment variable for API token to avoid command line exposure
    const env = { ...process.env, CLOUDFLARE_API_TOKEN: domainConfig.apiKey };

    const result = await $`bunx wrangler dns record create ${domainConfig.zoneId} A --name=${subdomain} --content="192.168.1.1" --ttl=3600`.env(env).text();

    console.log(`✅ Cloudflare DNS record created for ${subdomain}`);
    return subdomain;
  } catch (error) {
    console.error("❌ Cloudflare DNS creation failed:", error);
    throw error;
  }
}

/**
 * Create Route53 DNS record with proper implementation
 */
async function createRoute53Record(subdomain: string, domainConfig: { apiKey: string; zoneId: string }): Promise<string> {
  console.log(`🔧 Creating Route53 record for ${subdomain}`);

  // Validate inputs
  if (!/^[a-zA-Z0-9.-]+$/.test(subdomain)) {
    throw new Error(`Invalid subdomain format: ${subdomain}`);
  }

  try {
    // Implementation would use AWS CLI or SDK
    // For now, throw NotImplementedError to indicate this needs implementation
    throw new Error(`Route53 DNS provider not yet implemented. Please use Cloudflare provider or implement Route53 integration.`);

    // Future implementation:
    // const awsEnv = { ...process.env, AWS_ACCESS_KEY_ID: domainConfig.apiKey };
    // await $`aws route53 change-resource-record-sets --hosted-zone-id ${domainConfig.zoneId} --change-batch file://<(cat <<EOF
    // {
    //   "Changes": [{
    //     "Action": "CREATE",
    //     "ResourceRecordSet": {
    //       "Name": "${subdomain}",
    //       "Type": "A",
    //       "TTL": 3600,
    //       "ResourceRecords": [{"Value": "192.168.1.1"}]
    //     }
    //   }]
    // }
    // EOF)`.env(awsEnv);

  } catch (error) {
    console.error("❌ Route53 DNS creation failed:", error);
    throw error;
  }
}

/**
 * Create DigitalOcean DNS record with proper implementation
 */
async function createDigitalOceanRecord(subdomain: string, domainConfig: { apiKey: string; zoneId: string }): Promise<string> {
  console.log(`🌊 Creating DigitalOcean record for ${subdomain}`);

  // Validate inputs
  if (!/^[a-zA-Z0-9.-]+$/.test(subdomain)) {
    throw new Error(`Invalid subdomain format: ${subdomain}`);
  }

  try {
    // Implementation would use DigitalOcean API
    // For now, throw NotImplementedError to indicate this needs implementation
    throw new Error(`DigitalOcean DNS provider not yet implemented. Please use Cloudflare provider or implement DigitalOcean integration.`);

    // Future implementation:
    // const response = await fetch(`https://api.digitalocean.com/v2/domains/${domainConfig.zoneId}/records`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${domainConfig.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     type: 'A',
    //     name: subdomain,
    //     data: '192.168.1.1',
    //     ttl: 3600
    //   })
    // });

  } catch (error) {
    console.error("❌ DigitalOcean DNS creation failed:", error);
    throw error;
  }
}

// ============================================================================
// OPENCLAW INTEGRATION
// ============================================================================

/**
 * Send notification via OpenClaw with secure credential handling
 */
export async function sendOpenClawNotification(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
  if (!ENTERPRISE_CONFIG.openclaw.notifications) {
    console.log("🔕 OpenClaw notifications disabled");
    return;
  }

  try {
    const credentials = await getEnterpriseCredentials();

    // Validate inputs
    if (!message || message.length > 1000) {
      throw new Error("Message must be between 1 and 1000 characters");
    }
    if (!['low', 'medium', 'high'].includes(priority)) {
      throw new Error("Priority must be one of: low, medium, high");
    }

    const payload = {
      agentId: ENTERPRISE_CONFIG.openclaw.agentId,
      channelId: ENTERPRISE_CONFIG.openclaw.channelId,
      message: `[${priority.toUpperCase()}] ${message}`,
      timestamp: new Date().toISOString(),
      source: "enterprise-tenant-archiver"
    };

    // Use environment variable for auth token to avoid command line exposure
    const env = { ...process.env, OPENCLAW_AUTH_TOKEN: credentials.openclaw.authToken };

    // Use POST with JSON body instead of curl command line
    const response = await fetch(`${ENTERPRISE_CONFIG.openclaw.gatewayUrl}/api/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.openclaw.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`OpenClaw API error: ${response.status} ${response.statusText}`);
    }

    console.log("📨 OpenClaw notification sent");
  } catch (error) {
    console.warn("⚠️  OpenClaw notification failed:", error);
  }
}

/**
 * Report tenant operation status to OpenClaw
 */
export async function reportTenantOperation(
  operation: 'create' | 'update' | 'delete' | 'backup' | 'restore',
  tenantId: string,
  status: 'success' | 'failed',
  details?: string
): Promise<void> {
  const message = `Tenant ${operation} for ${tenantId} ${status}${details ? `: ${details}` : ''}`;
  const priority = status === 'failed' ? 'high' : 'medium';

  await sendOpenClawNotification(message, priority);
}

// ============================================================================
// BUNX INTEGRATION
// ============================================================================

/**
 * Install and manage bunx tools for enterprise operations
 */
export class BunxManager {
  private tools: Set<string> = new Set(ENTERPRISE_CONFIG.bunx.tools);

  /**
   * Ensure all required bunx tools are available
   */
  async ensureTools(): Promise<void> {
    console.log("🔧 Checking bunx tools...");

    for (const tool of this.tools) {
      try {
        await $`bunx ${tool} --version`.quiet();
        console.log(`✅ ${tool} available`);
      } catch (error) {
        console.log(`📦 Installing ${tool}...`);
        await $`bunx ${tool}@${ENTERPRISE_CONFIG.bunx.version} --version`.quiet();
        console.log(`✅ ${tool} installed`);
      }
    }
  }

  /**
   * Run enterprise backup with compression and path validation
   */
  async runEnterpriseBackup(source: string, destination: string): Promise<string> {
    await this.ensureTools();

    // Validate and sanitize paths
    if (!source || !destination) {
      throw new Error("Source and destination paths are required");
    }

    // Prevent path traversal
    if (source.includes('..') || destination.includes('..')) {
      throw new Error("Path traversal detected in backup paths");
    }

    // Ensure paths are absolute or relative to safe directories
    const allowedSourceDirs = ['./tenants', './data', './config'];
    const isSourceAllowed = allowedSourceDirs.some(dir => source.startsWith(dir));
    if (!isSourceAllowed && !source.startsWith('/')) {
      throw new Error(`Source path not in allowed directories: ${source}`);
    }

    console.log(`🗄️  Running enterprise backup: ${source} → ${destination}`);

    // Create compressed archive with enterprise tools
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `${basename(source)}-enterprise-${timestamp}.tar.gz`;
    const archivePath = join(destination, archiveName);

    await mkdir(destination, { recursive: true });

    let archiveCreated = false;
    try {
      // Use tar with gzip for maximum compatibility
      await $`tar -czf ${archivePath} -C ${dirname(source)} ${basename(source)}`;
      archiveCreated = true;

      // Verify archive integrity
      await $`bunx gzip -t ${archivePath}`;

      console.log(`✅ Enterprise backup created: ${archivePath}`);
      return archivePath;
    } catch (error) {
      // Cleanup on failure
      if (archiveCreated) {
        try {
          await $`rm -f ${archivePath}`;
          console.log(`🧹 Cleaned up failed archive: ${archivePath}`);
        } catch (cleanupError) {
          console.warn(`⚠️  Failed to cleanup archive: ${cleanupError}`);
        }
      }
      throw error;
    }
  }

  /**
   * Run enterprise restore with verification
   */
  async runEnterpriseRestore(archivePath: string, destination: string): Promise<void> {
    await this.ensureTools();

    console.log(`📂 Running enterprise restore: ${archivePath} → ${destination}`);

    // Verify archive before extraction
    await $`bunx gzip -t ${archivePath}`;

    await mkdir(destination, { recursive: true });

    // Extract with verification
    await $`tar -xzf ${archivePath} -C ${destination}`;

    console.log(`✅ Enterprise restore completed: ${destination}`);
  }

  /**
   * Generate enterprise checksums for integrity verification
   */
  async generateChecksums(filePath: string): Promise<{ sha256: string; md5: string }> {
    await this.ensureTools();

    const sha256 = await $`bunx openssl dgst -sha256 -r ${filePath}`.text();
    const md5 = await $`bunx openssl dgst -md5 -r ${filePath}`.text();

    return {
      sha256: sha256.split(' ')[0],
      md5: md5.split(' ')[0]
    };
  }
}

// ============================================================================
// ENHANCED TENANT ARCHIVER WITH ENTERPRISE FEATURES
// ============================================================================

export interface EnterpriseTenantSnapshot {
  tenantId: string;
  timestamp: string;
  filename: string;
  size: number;
  path: string;
  r2Url?: string;
  r2Key?: string;
  domain?: string;
  checksums?: { sha256: string; md5: string };
  openclawNotified: boolean;
}

/**
 * Enterprise tenant snapshot with full integration
 */
export async function createEnterpriseTenantSnapshot(
  tenantId: string,
  options: {
    uploadToR2?: boolean;
    createDomain?: boolean;
    notifyOpenClaw?: boolean;
    generateChecksums?: boolean;
  } = {}
): Promise<EnterpriseTenantSnapshot> {
  const {
    uploadToR2 = true,
    createDomain = true,
    notifyOpenClaw: shouldNotifyOpenClaw = true,
    generateChecksums = true
  } = options;

  const bunxManager = new BunxManager();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${tenantId}-enterprise-${timestamp}.tar.gz`;
  const snapshotPath = join("./enterprise-snapshots", filename);

  try {
    console.log(`🏢 Creating enterprise tenant snapshot: ${tenantId}`);

    // Create enterprise snapshot
    await mkdir("./enterprise-snapshots", { recursive: true });
    await bunxManager.runEnterpriseBackup(`./tenants/${tenantId}`, "./enterprise-snapshots");

    // Generate checksums
    let checksums: { sha256: string; md5: string } | undefined;
    if (generateChecksums) {
      checksums = await bunxManager.generateChecksums(snapshotPath);
    }

    // Create tenant domain
    let domain: string | undefined;
    if (createDomain) {
      domain = await createTenantDomain(tenantId);
    }

    // Upload to R2
    let r2Url: string | undefined;
    let r2Key: string | undefined;
    if (uploadToR2) {
      r2Key = `enterprise-tenant-snapshots/${tenantId}/${filename}`;
      r2Url = await uploadToR2(snapshotPath, r2Key);
    }

    // Get file size
    const fileStat = await stat(snapshotPath);
    const sizeBytes = fileStat.size;

    // Notify OpenClaw
    let openclawNotified = false;
    if (shouldNotifyOpenClaw) {
      await reportTenantOperation('backup', tenantId, 'success', `Size: ${Math.round(sizeBytes / 1024)} KiB`);
      openclawNotified = true;
    }

    const snapshot: EnterpriseTenantSnapshot = {
      tenantId,
      timestamp,
      filename,
      size: sizeBytes,
      path: snapshotPath,
      r2Url,
      r2Key,
      domain,
      checksums,
      openclawNotified
    };

    console.log(`✅ Enterprise tenant snapshot created: ${filename}`);
    console.log(`📊 Size: ${Math.round(sizeBytes / 1024)} KiB`);
    if (domain) console.log(`🌐 Domain: ${domain}`);
    if (r2Url) console.log(`☁️  R2: ${r2Url}`);
    if (checksums) console.log(`🔐 SHA256: ${checksums.sha256}`);

    return snapshot;
  } catch (error) {
    console.error("❌ Enterprise snapshot creation failed:", error);

    if (shouldNotifyOpenClaw) {
      await reportTenantOperation('backup', tenantId, 'failed', error instanceof Error ? error.message : String(error));
    }

    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function basename(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Upload to R2 with enterprise configuration and proper isolation
 */
async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  // Validate inputs
  if (!localPath || !r2Key) {
    throw new Error("Local path and R2 key are required");
  }

  // Prevent path traversal
  if (localPath.includes('..') || r2Key.includes('..')) {
    throw new Error("Path traversal detected");
  }

  const credentials = await getEnterpriseCredentials();
  const file = Bun.file(localPath);

  console.log(`📤 Uploading to enterprise R2: ${r2Key}`);

  // Use atomic environment variable operations to prevent race conditions
  const originalEnv = { ...process.env };
  const envSnapshot = { ...originalEnv };

  try {
    // Set up environment variables for Bun.s3
    process.env.S3_ACCESS_KEY_ID = credentials.r2.accessKeyId;
    process.env.S3_SECRET_ACCESS_KEY = credentials.r2.secretAccessKey;
    process.env.S3_ENDPOINT = ENTERPRISE_CONFIG.r2.endpoint;
    process.env.S3_BUCKET = ENTERPRISE_CONFIG.r2.bucket;
    process.env.S3_REGION = ENTERPRISE_CONFIG.r2.region;

    await Bun.s3.write(r2Key, file, {
      type: "application/gzip",
    });

    const r2Url = `https://pub-${ENTERPRISE_CONFIG.r2.accountId}.r2.dev/${ENTERPRISE_CONFIG.r2.bucket}/${r2Key}`;
    console.log(`✅ Uploaded to enterprise R2: ${r2Url}`);

    return r2Url;
  } finally {
    // Atomic environment restoration
    process.env = envSnapshot;
  }
}

// ============================================================================
// ENTERPRISE CLI
// ============================================================================

export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "enterprise-create":
        const tenantId = args[1] || "enterprise-tenant";
        const snapshot = await createEnterpriseTenantSnapshot(tenantId);
        console.log("🎯 Enterprise snapshot created:", snapshot);
        break;

      case "domain-create":
        const domainTenantId = args[1] || "test-tenant";
        const domain = await createTenantDomain(domainTenantId);
        console.log("🌐 Domain created:", domain);
        break;

      case "openclaw-notify":
        const message = args.slice(1).join(' ') || "Test notification";
        await sendOpenClawNotification(message);
        console.log("📨 Notification sent");
        break;

      case "bunx-check":
        const manager = new BunxManager();
        await manager.ensureTools();
        console.log("🔧 All bunx tools ready");
        break;

      default:
        console.log(`
Enterprise Tenant Archiver CLI
🏢 Integrates: bunx + R2 + Domain + OpenClaw

Usage:
  bun enterprise-tenant-archiver.ts enterprise-create <tenant-id>     Create enterprise snapshot
  bun enterprise-tenant-archiver.ts domain-create <tenant-id>        Create tenant domain
  bun enterprise-tenant-archiver.ts openclaw-notify <message>        Send OpenClaw notification
  bun enterprise-tenant-archiver.ts bunx-check                       Verify bunx tools

Enterprise Features:
  🔐 Bun.secrets for secure credential management
  ☁️  Cloudflare R2 for enterprise storage
  🌐 Automatic domain provisioning
  📨 OpenClaw notifications and monitoring
  🔧 Bunx tools for enterprise operations
  🔐 Checksums for integrity verification

Configuration:
  Set environment variables or use Bun.secrets:
  • R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
  • CLOUDFLARE_API_KEY, CLOUDFLARE_ZONE_ID
  • OPENCLAW_AUTH_TOKEN, OPENCLAW_GATEWAY_URL
  • DOMAIN_BASE_URL

Examples:
  bun enterprise-tenant-archiver.ts enterprise-create production-tenant
  bun enterprise-tenant-archiver.ts domain-create staging-tenant
  bun enterprise-tenant-archiver.ts openclaw-notify "Backup completed successfully"
        `);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (import.meta.main) {
  main();
}
