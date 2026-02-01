#!/usr/bin/env bun
/**
 * Tier-1380 OMEGA Registry Connector with R2 Support
 * Connects to and manages the OMEGA registry with Cloudflare R2 integration
 * Usage: bun run tier1380:registry [check|version|status|connect|r2]
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { $ } from "bun";

// ─── Glyphs ───────────────────────────────────────
const GLYPHS = {
  DRIFT: "▵⟂⥂",
  COHERENCE: "⥂⟂(▵⟜⟳)",
  LOCKED: "⟳⟲⟜(▵⊗⥂)",
  CONNECT: "🔌",
  DISCONNECT: "⛓",
  OK: "✓",
  FAIL: "✗",
  R2: "☁️",
  SHELL: "🐚",
  UPLOAD: "📤",
  DOWNLOAD: "📥",
  LIST: "📋",
  DELETE: "🗑️",
};

// ─── Registry Configuration ───────────────────────
const REGISTRY_CONFIG = {
  version: "4.0.0",
  kvNamespace: "OMEGA_REGISTRY",
  kvKey: "version:current",
  kvHistoryKey: "version:history",
  staging: "omega-staging.factory-wager.com",
  production: "omega.factory-wager.com",
  local: "127.0.0.1:8787",
  r2Bucket: "fw-registry",
  r2Endpoint: `https://${process.env.CF_ACCOUNT_ID || "7a470541a704caaf91e71efccc78fd36"}.r2.cloudflarestorage.com`,
};

// ─── R2 Configuration ─────────────────────────────
const R2_CONFIG = {
  accountId: process.env.CF_ACCOUNT_ID || "7a470541a704caaf91e71efccc78fd36",
  bucket: process.env.R2_BUCKET || "fw-registry",
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID || "7a470541a704caaf91e71efccc78fd36"}.r2.cloudflarestorage.com`,
};

// ─── Types ────────────────────────────────────────
interface RegistryStatus {
  connected: boolean;
  version: string;
  environment: "local" | "staging" | "production";
  kvStatus: "connected" | "disconnected" | "unknown";
  r2Status: "connected" | "disconnected" | "unknown";
  timestamp: string;
}

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  build: string;
}

interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
}

// ─── Parse Version ────────────────────────────────
function parseVersion(version: string): VersionInfo {
  const [major, minor, patchBuild] = version.split(".");
  const [patch, build] = patchBuild?.split("-") || [patchBuild, ""];
  return {
    major: parseInt(major) || 0,
    minor: parseInt(minor) || 0,
    patch: parseInt(patch) || 0,
    build: build || "",
  };
}

// ─── Get R2 Credentials ───────────────────────────
async function getR2Credentials(): Promise<{ accessKeyId: string; secretAccessKey: string } | null> {
  try {
    // Try Bun.secrets first (more secure)
    const accessKeyId = await Bun.secrets.get("com.factory-wager.r2.access-key-id");
    const secretAccessKey = await Bun.secrets.get("com.factory-wager.r2.secret-access-key");

    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey };
    }
  } catch {
    // Bun.secrets not available
  }

  // Fallback to environment variables
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }

  return null;
}

// ─── Check R2 Connection ──────────────────────────
async function checkR2Connection(): Promise<boolean> {
  const credentials = await getR2Credentials();
  if (!credentials) return false;

  try {
    // Set up environment for Bun.s3
    const originalEnv = { ...process.env };
    process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
    process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
    process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
    process.env.S3_BUCKET = R2_CONFIG.bucket;
    process.env.S3_REGION = R2_CONFIG.region;

    try {
      // Try to read a test file (this will fail if bucket doesn't exist, but confirms connection)
      const testFile = Bun.s3.file(".registry-check");
      await testFile.exists();
      return true;
    } finally {
      process.env = originalEnv;
    }
  } catch {
    return false;
  }
}

// ─── Check Registry ───────────────────────────────
async function checkRegistry(): Promise<RegistryStatus> {
  console.log(`${GLYPHS.CONNECT} Checking OMEGA Registry connection...\n`);

  // Try to connect to local registry first
  const localConnected = await checkPort(8787);
  const stagingConnected = await checkPort(443, REGISTRY_CONFIG.staging);

  let environment: RegistryStatus["environment"] = "local";
  let connected = localConnected;

  if (!connected && stagingConnected) {
    environment = "staging";
    connected = true;
  }

  // Get version from omega binary
  let version = REGISTRY_CONFIG.version;
  try {
    const proc = Bun.spawn(["./bin/omega", "registry", "version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    if (output.trim()) version = output.trim();
  } catch {
    // Use default version
  }

  // Check R2 connection
  const r2Connected = await checkR2Connection();

  return {
    connected,
    version,
    environment,
    kvStatus: connected ? "connected" : "disconnected",
    r2Status: r2Connected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  };
}

// ─── Check Port ───────────────────────────────────
async function checkPort(port: number, host = "127.0.0.1"): Promise<boolean> {
  try {
    const conn = await Bun.connect({ hostname: host, port });
    conn.end();
    return true;
  } catch {
    return false;
  }
}

// ─── Display Status ───────────────────────────────
function displayStatus(status: RegistryStatus): void {
  console.log(`${GLYPHS.DRIFT} Tier-1380 OMEGA Registry Status\n`);
  console.log("-".repeat(70));

  const connIcon = status.connected ? GLYPHS.OK : GLYPHS.FAIL;
  const connStatus = status.connected ? "CONNECTED" : "DISCONNECTED";
  const r2Icon = status.r2Status === "connected" ? GLYPHS.OK : GLYPHS.FAIL;
  const r2Status = status.r2Status === "connected" ? "CONNECTED" : "DISCONNECTED";

  console.log(`  Connection:      ${connIcon} ${connStatus}`);
  console.log(`  Environment:     ${status.environment.toUpperCase()}`);
  console.log(`  Version:         ${status.version}`);
  console.log(`  KV Namespace:    ${REGISTRY_CONFIG.kvNamespace}`);
  console.log(`  KV Status:       ${status.kvStatus}`);
  console.log(`  R2 Bucket:       ${R2_CONFIG.bucket}`);
  console.log(`  R2 Status:       ${r2Icon} ${r2Status}`);
  console.log(`  Timestamp:       ${status.timestamp}`);

  console.log("-".repeat(70));

  // Parse version
  const v = parseVersion(status.version);
  console.log(`\n  Version Breakdown:`);
  console.log(`    Major: ${v.major}`);
  console.log(`    Minor: ${v.minor}`);
  console.log(`    Patch: ${v.patch}`);
  if (v.build) console.log(`    Build: ${v.build}`);

  // Registry endpoints
  console.log(`\n  Registry Endpoints:`);
  console.log(`    Local:       ${REGISTRY_CONFIG.local}`);
  console.log(`    Staging:     ${REGISTRY_CONFIG.staging}`);
  console.log(`    Production:  ${REGISTRY_CONFIG.production}`);

  // R2 Configuration
  console.log(`\n  R2 Configuration:`);
  console.log(`    Bucket:      ${R2_CONFIG.bucket}`);
  console.log(`    Endpoint:    ${R2_CONFIG.endpoint}`);
  console.log(`    Region:      ${R2_CONFIG.region}`);

  console.log("-".repeat(70));
  console.log(`\n  ${GLYPHS.LOCKED} OMEGA Registry v${status.version}`);
  console.log("-".repeat(70) + "\n");
}

// ─── Connect to Registry ──────────────────────────
async function connectRegistry(): Promise<void> {
  console.log(`${GLYPHS.CONNECT} Connecting to OMEGA Registry...\n`);

  const status = await checkRegistry();

  if (!status.connected) {
    console.log(`${GLYPHS.FAIL} Failed to connect to registry`);
    console.log(`\nAttempting local registry connection...`);

    console.log(`\n${GLYPHS.DRIFT} Local registry not available`);
    console.log(`To start the registry, run:`);
    console.log(`  bun run omega:registry:start`);
    process.exit(1);
  }

  displayStatus(status);

  // Log connection to SQLite
  const dbPath = "./data/tier1380.db";
  if (existsSync(dbPath)) {
    const db = new Database(dbPath);
    db.prepare(
      "INSERT INTO executions (cmd, args, hash, exit, duration_ms) VALUES (?, ?, ?, ?, ?)"
    ).run(
      "registry:connect",
      status.environment,
      status.version,
      0,
      0
    );
    db.close();
  }

  console.log(`${GLYPHS.OK} Successfully connected to ${status.environment} registry`);
}

// ─── Show Version History ─────────────────────────
function showVersionHistory(): void {
  console.log(`${GLYPHS.DRIFT} Tier-1380 OMEGA Version History\n`);
  console.log("-".repeat(70));

  const history = [
    { version: "4.0.0", date: "2026-01-31", notes: "Current stable" },
    { version: "3.26.4", date: "2026-01-15", notes: "Previous stable" },
    { version: "3.26.3", date: "2026-01-10", notes: "Security patch" },
  ];

  history.forEach((h) => {
    console.log(`  ${h.version.padEnd(10)} ${h.date}  ${h.notes}`);
  });

  console.log("-".repeat(70) + "\n");
}

// ─── R2 Operations ────────────────────────────────

async function r2Upload(localPath: string, r2Key?: string): Promise<void> {
  const credentials = await getR2Credentials();
  if (!credentials) {
    console.error(`${GLYPHS.FAIL} R2 credentials not found`);
    console.log("Set them using:");
    console.log("  Bun.secrets: com.factory-wager.r2.access-key-id, com.factory-wager.r2.secret-access-key");
    console.log("  Environment: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  const targetKey = r2Key || localPath.split("/").pop() || "upload";
  const file = Bun.file(localPath);
  const fileSize = file.size;

  console.log(`${GLYPHS.UPLOAD} Uploading to R2: ${targetKey} (${Math.round(fileSize / 1024)} KiB)`);

  // Set up environment for Bun.s3
  const originalEnv = { ...process.env };
  process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
  process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
  process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
  process.env.S3_BUCKET = R2_CONFIG.bucket;
  process.env.S3_REGION = R2_CONFIG.region;

  try {
    await Bun.s3.write(targetKey, file, {
      type: file.type || "application/octet-stream",
    });

    const r2Url = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/${targetKey}`;
    console.log(`${GLYPHS.OK} Uploaded to R2: ${r2Url}`);

    // Log to SQLite
    const dbPath = "./data/tier1380.db";
    if (existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.prepare(
        "INSERT INTO executions (ts, cmd, args, hash, exit) VALUES (?, ?, ?, ?, ?)"
      ).run(Date.now(), "r2:upload", targetKey, Bun.hash.wyhash(Buffer.from(targetKey)).toString(16), 0);
      db.close();
    }
  } finally {
    process.env = originalEnv;
  }
}

async function r2Download(r2Key: string, localPath?: string): Promise<void> {
  const credentials = await getR2Credentials();
  if (!credentials) {
    console.error(`${GLYPHS.FAIL} R2 credentials not found`);
    process.exit(1);
  }

  const targetPath = localPath || r2Key.split("/").pop() || "download";
  console.log(`${GLYPHS.DOWNLOAD} Downloading from R2: ${r2Key}`);

  // Set up environment for Bun.s3
  const originalEnv = { ...process.env };
  process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
  process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
  process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
  process.env.S3_BUCKET = R2_CONFIG.bucket;
  process.env.S3_REGION = R2_CONFIG.region;

  try {
    const s3File = Bun.s3.file(r2Key);
    const data = await s3File.arrayBuffer();

    if (!data) {
      throw new Error("No data received from R2");
    }

    await Bun.write(targetPath, data);
    console.log(`${GLYPHS.OK} Downloaded to: ${targetPath}`);

    // Log to SQLite
    const dbPath = "./data/tier1380.db";
    if (existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.prepare(
        "INSERT INTO executions (ts, cmd, args, hash, exit) VALUES (?, ?, ?, ?, ?)"
      ).run(Date.now(), "r2:download", r2Key, Bun.hash.wyhash(Buffer.from(r2Key)).toString(16), 0);
      db.close();
    }
  } finally {
    process.env = originalEnv;
  }
}

async function r2List(prefix: string = ""): Promise<void> {
  console.log(`${GLYPHS.LIST} Listing R2 objects${prefix ? ` with prefix: ${prefix}` : ""}\n`);

  // Use wrangler for listing
  try {
    const result = await $`wrangler r2 object list ${R2_CONFIG.bucket} ${prefix ? `--prefix=${prefix}` : ""}`.nothrow();
    
    if (result.exitCode === 0) {
      console.log(result.stdout.toString());
    } else {
      console.log(`${GLYPHS.FAIL} Failed to list objects. Ensure wrangler is configured.`);
      console.log(`Alternative: Use AWS CLI with R2 credentials`);
    }
  } catch (error) {
    console.log(`${GLYPHS.FAIL} R2 listing requires wrangler or AWS CLI`);
    console.log(`\nTo list objects, run:`);
    console.log(`  wrangler r2 object list ${R2_CONFIG.bucket}`);
  }
}

async function r2Delete(r2Key: string): Promise<void> {
  console.log(`${GLYPHS.DELETE} Deleting from R2: ${r2Key}`);

  try {
    const result = await $`wrangler r2 object delete ${R2_CONFIG.bucket} ${r2Key}`.nothrow();
    
    if (result.exitCode === 0) {
      console.log(`${GLYPHS.OK} Deleted: ${r2Key}`);

      // Log to SQLite
      const dbPath = "./data/tier1380.db";
      if (existsSync(dbPath)) {
        const db = new Database(dbPath);
        db.prepare(
          "INSERT INTO executions (ts, cmd, args, hash, exit) VALUES (?, ?, ?, ?, ?)"
        ).run(Date.now(), "r2:delete", r2Key, Bun.hash.wyhash(Buffer.from(r2Key)).toString(16), 0);
        db.close();
      }
    } else {
      console.log(`${GLYPHS.FAIL} Failed to delete: ${result.stderr.toString()}`);
    }
  } catch (error) {
    console.log(`${GLYPHS.FAIL} R2 deletion requires wrangler`);
    console.log(`\nTo delete, run:`);
    console.log(`  wrangler r2 object delete ${R2_CONFIG.bucket} ${r2Key}`);
  }
}

// ─── Kimi Shell Integration ───────────────────────

async function kimiShellStatus(): Promise<void> {
  console.log(`${GLYPHS.SHELL} Kimi Shell Integration Status\n`);
  console.log("-".repeat(70));

  // Check shell bridge
  const bridgePath = `${process.env.HOME}/.kimi/tools/unified-shell-bridge.ts`;
  const bridgeExists = existsSync(bridgePath);
  console.log(`  Unified Bridge:    ${bridgeExists ? GLYPHS.OK + " Found" : GLYPHS.FAIL + " Not found"}`);

  // Check Kimi CLI
  const kimiPath = `${process.env.HOME}/.kimi/bin/kimi`;
  const kimiExists = existsSync(kimiPath);
  console.log(`  Kimi CLI:          ${kimiExists ? GLYPHS.OK + " Found" : GLYPHS.FAIL + " Not found"}`);

  // Check skills
  const skillsPath = `${process.env.HOME}/.kimi/skills`;
  const skillsExist = existsSync(skillsPath);
  console.log(`  Skills Registry:   ${skillsExist ? GLYPHS.OK + " Found" : GLYPHS.FAIL + " Not found"}`);

  // List Tier-1380 skills
  if (skillsExist) {
    try {
      const result = await $`ls ${skillsPath}/tier1380-* 2>/dev/null`.nothrow();
      const skills = result.stdout.toString().trim().split("\n").filter(Boolean);
      console.log(`\n  Tier-1380 Skills:`);
      skills.forEach((skill) => {
        const name = skill.split("/").pop();
        console.log(`    ${GLYPHS.OK} ${name}`);
      });
    } catch {
      console.log(`\n  Tier-1380 Skills:  None found`);
    }
  }

  // Check OpenClaw integration
  const openclawToken = await (async () => {
    try {
      return await Bun.secrets.get({ service: "com.openclaw.gateway", name: "gateway_token" });
    } catch {
      return null;
    }
  })();
  console.log(`\n  OpenClaw Token:    ${openclawToken ? GLYPHS.OK + " Configured" : GLYPHS.FAIL + " Not set"}`);

  // Check R2 credentials in Kimi context
  const r2Creds = await getR2Credentials();
  console.log(`  R2 Credentials:    ${r2Creds ? GLYPHS.OK + " Available" : GLYPHS.FAIL + " Not configured"}`);

  console.log("-".repeat(70));
  console.log(`\n  ${GLYPHS.SHELL} Shell Integration v1.0.0`);
  console.log("-".repeat(70) + "\n");
}

async function kimiShellExec(command: string): Promise<void> {
  console.log(`${GLYPHS.SHELL} Executing via Kimi Shell: ${command}\n`);

  const bridgePath = `${process.env.HOME}/.kimi/tools/unified-shell-bridge.ts`;
  if (!existsSync(bridgePath)) {
    console.error(`${GLYPHS.FAIL} Unified shell bridge not found`);
    process.exit(1);
  }

  try {
    const result = await $`bun run ${bridgePath}`.nothrow();
    console.log(result.stdout.toString());
    if (result.stderr.toString()) {
      console.error(result.stderr.toString());
    }
  } catch (error) {
    console.error(`${GLYPHS.FAIL} Shell execution failed:`, error);
  }
}

// ─── Main ─────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] || "check";

  switch (cmd) {
    case "check":
      const status = await checkRegistry();
      displayStatus(status);
      process.exit(status.connected ? 0 : 1);

    case "version":
      console.log(REGISTRY_CONFIG.version);
      break;

    case "connect":
      await connectRegistry();
      break;

    case "history":
      showVersionHistory();
      break;

    // R2 Commands
    case "r2:upload":
    case "r2-up":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry r2:upload <local-path> [r2-key]`);
        process.exit(1);
      }
      await r2Upload(args[1], args[2]);
      break;

    case "r2:download":
    case "r2-dl":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry r2:download <r2-key> [local-path]`);
        process.exit(1);
      }
      await r2Download(args[1], args[2]);
      break;

    case "r2:list":
    case "r2-ls":
      await r2List(args[1]);
      break;

    case "r2:delete":
    case "r2-rm":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry r2:delete <r2-key>`);
        process.exit(1);
      }
      await r2Delete(args[1]);
      break;

    case "r2:status":
      const r2Connected = await checkR2Connection();
      console.log(`${GLYPHS.R2} R2 Status: ${r2Connected ? "CONNECTED" : "DISCONNECTED"}`);
      process.exit(r2Connected ? 0 : 1);

    // Kimi Shell Commands
    case "shell:status":
      await kimiShellStatus();
      break;

    case "shell:exec":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry shell:exec <command>`);
        process.exit(1);
      }
      await kimiShellExec(args.slice(1).join(" "));
      break;

    case "help":
    default:
      console.log(`
${GLYPHS.DRIFT} Tier-1380 OMEGA Registry Connector

Usage:
  bun run tier1380:registry [command] [options]

Registry Commands:
  check                Check registry connection and status
  version              Show current registry version
  connect              Connect to registry (with logging)
  history              Show version history

R2 Commands:
  r2:upload <path> [key]   Upload file to R2 (alias: r2-up)
  r2:download <key> [path] Download file from R2 (alias: r2-dl)
  r2:list [prefix]         List R2 objects (alias: r2-ls)
  r2:delete <key>          Delete R2 object (alias: r2-rm)
  r2:status                Check R2 connection status

Kimi Shell Integration:
  shell:status         Show Kimi shell integration status
  shell:exec <cmd>     Execute command via Kimi shell

Examples:
  bun run tier1380:registry check
  bun run tier1380:registry connect
  bun run tier1380:registry r2:upload ./backup.tar.gz backups/backup.tar.gz
  bun run tier1380:registry r2:download config.json ./config.json
  bun run tier1380:registry r2:list registry/
  bun run tier1380:registry shell:status

Environment Variables:
  CF_ACCOUNT_ID        Cloudflare account ID
  R2_BUCKET            R2 bucket name (default: fw-registry)
  R2_ACCESS_KEY_ID     R2 access key (or Bun.secrets)
  R2_SECRET_ACCESS_KEY R2 secret key (or Bun.secrets)
`);
      if (cmd !== "help") process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { checkRegistry, parseVersion, REGISTRY_CONFIG, getR2Credentials, checkR2Connection };
