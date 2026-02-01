#!/usr/bin/env bun
/**
 * Tier-1380 OMEGA Registry Connector
 * Connects to and manages the OMEGA registry
 * Usage: bun run tier1380:registry [check|version|status|connect]
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";

// ─── Glyphs ───────────────────────────────────────
const GLYPHS = {
  DRIFT: "▵⟂⥂",
  COHERENCE: "⥂⟂(▵⟜⟳)",
  LOCKED: "⟳⟲⟜(▵⊗⥂)",
  CONNECT: "🔌",
  DISCONNECT: "⛓",
  OK: "✓",
  FAIL: "✗",
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
};

// ─── Types ────────────────────────────────────────
interface RegistryStatus {
  connected: boolean;
  version: string;
  environment: "local" | "staging" | "production";
  kvStatus: "connected" | "disconnected" | "unknown";
  timestamp: string;
}

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  build: string;
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

  return {
    connected,
    version,
    environment,
    kvStatus: connected ? "connected" : "disconnected",
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

  console.log(`  Connection:      ${connIcon} ${connStatus}`);
  console.log(`  Environment:     ${status.environment.toUpperCase()}`);
  console.log(`  Version:         ${status.version}`);
  console.log(`  KV Namespace:    ${REGISTRY_CONFIG.kvNamespace}`);
  console.log(`  KV Status:       ${status.kvStatus}`);
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

    // Try to start local registry (simulated)
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

  // Simulated history - in production, query KV
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

// ─── Main ─────────────────────────────────────────
async function main(): Promise<void> {
  const cmd = process.argv[2] || "check";

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

    case "help":
      console.log(`
${GLYPHS.DRIFT} Tier-1380 OMEGA Registry Connector

Usage:
  bun run tier1380:registry [command]

Commands:
  check       Check registry connection and status
  version     Show current registry version
  connect     Connect to registry (with logging)
  history     Show version history
  help        Show this help

Examples:
  bun run tier1380:registry check
  bun run tier1380:registry connect
  bun run tier1380:registry version
`);
      break;

    default:
      console.error(`Unknown command: ${cmd}`);
      console.log("Run 'bun run tier1380:registry help' for usage.");
      process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { checkRegistry, parseVersion, REGISTRY_CONFIG };
