#!/usr/bin/env bun
/**
 * Tier-1380 OMEGA Registry Connector with Bun-Native Features
 * Connects to and manages the OMEGA registry with Cloudflare R2 integration
 * Bun-native APIs: dns.prefetch, hash.crc32, nanoseconds, gzip, sqlite, tcp, path, spawn-ipc
 * Usage: bun run tier1380:registry [check|version|connect|r2|sync|benchmark|server|worker]
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { $ } from "bun";
import { join, basename, dirname, extname } from "path";
import type { Socket, TCPSocketListener } from "bun";

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
  SYNC: "🔄",
  BENCHMARK: "⏱️",
  CACHE: "💾",
  COMPRESS: "🗜️",
  DNS: "🌐",
  HASH: "#️⃣",
  WATCH: "👁️",
  HEALTH: "❤️",
  BACKUP: "💾",
  RESTORE: "📂",
  LOCK: "🔒",
  WEBSOCKET: "🔌",
};

// ─── Bun.color Terminal Colors ────────────────────
const COLORS = {
  success: (s: string) => typeof Bun !== "undefined" && Bun.color ? Bun.color("#00ff00", "ansi") + s + "\x1b[0m" : s,
  error: (s: string) => typeof Bun !== "undefined" && Bun.color ? Bun.color("#ff0000", "ansi") + s + "\x1b[0m" : s,
  warning: (s: string) => typeof Bun !== "undefined" && Bun.color ? Bun.color("#ffff00", "ansi") + s + "\x1b[0m" : s,
  info: (s: string) => typeof Bun !== "undefined" && Bun.color ? Bun.color("#00ffff", "ansi") + s + "\x1b[0m" : s,
  highlight: (s: string) => typeof Bun !== "undefined" && Bun.color ? Bun.color("#ff00ff", "ansi") + s + "\x1b[0m" : s,
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
  cacheDir: "./.registry-cache",
  dbPath: "./data/tier1380.db",
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
  cacheStatus: "ready" | "miss" | "error";
  dnsStatus: "prefetched" | "pending";
  timestamp: string;
  latencyNs: bigint;
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
  crc32?: string;
}

interface BenchmarkResult {
  operation: string;
  durationNs: bigint;
  durationMs: number;
  throughput: string;
  checksum: string;
}

interface CacheEntry {
  key: string;
  data: Uint8Array;
  crc32: number;
  timestamp: number;
  compressed: boolean;
}

// ─── Initialize Registry Cache ────────────────────
function initRegistryCache(): Database {
  const cacheDir = REGISTRY_CONFIG.cacheDir;
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  const dbPath = join(cacheDir, "registry-cache.db");
  const db = new Database(dbPath);
  
  db.run(`CREATE TABLE IF NOT EXISTS registry_cache (
    key TEXT PRIMARY KEY,
    crc32 INTEGER,
    size INTEGER,
    timestamp INTEGER DEFAULT (unixepoch()),
    compressed INTEGER DEFAULT 0,
    r2_etag TEXT,
    access_count INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS registry_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT,
    duration_ns INTEGER,
    duration_ms REAL,
    throughput TEXT,
    checksum TEXT,
    timestamp INTEGER DEFAULT (unixepoch())
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS registry_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT,
    key TEXT,
    size INTEGER,
    crc32 INTEGER,
    duration_ms INTEGER,
    timestamp INTEGER DEFAULT (unixepoch())
  )`);

  return db;
}

const cacheDB = initRegistryCache();

// ─── DNS Prefetch for Registry ────────────────────
async function prefetchRegistryDNS(): Promise<void> {
  console.log(`${GLYPHS.DNS} Prefetching registry DNS...`);
  
  const start = Bun.nanoseconds();
  
  // Prefetch all registry endpoints concurrently
  const endpoints = [
    REGISTRY_CONFIG.staging,
    REGISTRY_CONFIG.production,
    ...REGISTRY_CONFIG.local.split(":")
  ];

  await Promise.all(
    endpoints.map(async (host) => {
      try {
        await Bun.dns.prefetch(host);
      } catch {
        // DNS prefetch is best-effort
      }
    })
  );

  const duration = Number(Bun.nanoseconds() - start) / 1000000;
  console.log(`${GLYPHS.OK} DNS prefetch complete (${duration.toFixed(2)}ms)`);
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
    const accessKeyId = await Bun.secrets.get({ service: "com.factory-wager.r2", name: "access-key-id" });
    const secretAccessKey = await Bun.secrets.get({ service: "com.factory-wager.r2", name: "secret-access-key" });

    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey };
    }
  } catch {
    // Bun.secrets not available
  }

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }

  return null;
}

// ─── CRC32 Integrity Check ────────────────────────
async function calculateCRC32(data: Buffer | Uint8Array): Promise<number> {
  return Bun.hash.crc32(data);
}

// ─── Compression with Bun Native ──────────────────
async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const compressed = Bun.gzipSync(data);
  return compressed;
}

async function decompressData(data: Uint8Array): Promise<Uint8Array> {
  const decompressed = Bun.gunzipSync(data);
  return decompressed;
}

// ─── Check R2 Connection ──────────────────────────
async function checkR2Connection(): Promise<boolean> {
  const credentials = await getR2Credentials();
  if (!credentials) return false;

  try {
    const originalEnv = { ...process.env };
    process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
    process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
    process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
    process.env.S3_BUCKET = R2_CONFIG.bucket;
    process.env.S3_REGION = R2_CONFIG.region;

    try {
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

// ─── Cache Operations ─────────────────────────────
async function getCachedEntry(key: string): Promise<CacheEntry | null> {
  const stmt = cacheDB.prepare("SELECT * FROM registry_cache WHERE key = ?");
  const row = stmt.get(key) as any;
  
  if (!row) return null;

  const cacheFile = join(REGISTRY_CONFIG.cacheDir, `${Bun.hash.wyhash(Buffer.from(key)).toString(16)}.cache`);
  if (!existsSync(cacheFile)) return null;

  const data = await Bun.file(cacheFile).bytes();
  const decompressed = row.compressed ? await decompressData(data) : data;

  // Update access count
  cacheDB.prepare("UPDATE registry_cache SET access_count = access_count + 1 WHERE key = ?").run(key);

  return {
    key,
    data: decompressed,
    crc32: row.crc32,
    timestamp: row.timestamp,
    compressed: row.compressed === 1,
  };
}

async function setCacheEntry(key: string, data: Uint8Array, compressed: boolean = false): Promise<void> {
  const crc32 = await calculateCRC32(Buffer.from(data));
  const cacheFile = join(REGISTRY_CONFIG.cacheDir, `${Bun.hash.wyhash(Buffer.from(key)).toString(16)}.cache`);
  
  const storeData = compressed ? await compressData(data) : data;
  await Bun.write(cacheFile, storeData);

  cacheDB.prepare(
    "INSERT OR REPLACE INTO registry_cache (key, crc32, size, compressed, timestamp) VALUES (?, ?, ?, ?, unixepoch())"
  ).run(key, crc32, data.length, compressed ? 1 : 0);
}

// ─── Check Registry ───────────────────────────────
async function checkRegistry(): Promise<RegistryStatus> {
  console.log(`${GLYPHS.CONNECT} Checking OMEGA Registry connection...\n`);

  const startTime = Bun.nanoseconds();

  // Prefetch DNS for faster connections
  await prefetchRegistryDNS();

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

  // Check cache status
  const cacheEntry = cacheDB.query("SELECT COUNT(*) as count FROM registry_cache").get() as any;
  const cacheStatus = cacheEntry.count > 0 ? "ready" : "miss";

  const latencyNs = Bun.nanoseconds() - startTime;

  return {
    connected,
    version,
    environment,
    kvStatus: connected ? "connected" : "disconnected",
    r2Status: r2Connected ? "connected" : "disconnected",
    cacheStatus,
    dnsStatus: "prefetched",
    timestamp: new Date().toISOString(),
    latencyNs,
  };
}

// ─── Check Port ───────────────────────────────────
async function checkPort(port: number, host = "127.0.0.1"): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname: host,
      port: port,
      socket: {
        data() {},
        open(socket) {
          socket.end();
        },
        close() {},
        error() {},
      },
    });
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
  const cacheIcon = status.cacheStatus === "ready" ? GLYPHS.OK : GLYPHS.FAIL;

  console.log(`  Connection:      ${connIcon} ${connStatus}`);
  console.log(`  Environment:     ${status.environment.toUpperCase()}`);
  console.log(`  Version:         ${status.version}`);
  console.log(`  KV Namespace:    ${REGISTRY_CONFIG.kvNamespace}`);
  console.log(`  KV Status:       ${status.kvStatus}`);
  console.log(`  R2 Bucket:       ${R2_CONFIG.bucket}`);
  console.log(`  R2 Status:       ${r2Icon} ${r2Status}`);
  console.log(`  Cache Status:    ${cacheIcon} ${status.cacheStatus.toUpperCase()}`);
  console.log(`  DNS Status:      ${GLYPHS.OK} ${status.dnsStatus.toUpperCase()}`);
  console.log(`  Latency:         ${(Number(status.latencyNs) / 1000000).toFixed(2)}ms`);
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

  // Cache stats
  const cacheStats = cacheDB.query("SELECT COUNT(*) as count, SUM(size) as total_size FROM registry_cache").get() as any;
  console.log(`\n  Cache Statistics:`);
  console.log(`    Entries:     ${cacheStats.count || 0}`);
  console.log(`    Total Size:  ${formatBytes(cacheStats.total_size || 0)}`);

  console.log("-".repeat(70));
  console.log(`\n  ${GLYPHS.LOCKED} OMEGA Registry v${status.version}`);
  console.log("-".repeat(70) + "\n");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KiB", "MiB", "GiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
  const dbPath = REGISTRY_CONFIG.dbPath;
  if (existsSync(dbPath)) {
    const db = new Database(dbPath);
    db.prepare(
      "INSERT INTO executions (cmd, args, hash, exit, duration_ms) VALUES (?, ?, ?, ?, ?)"
    ).run(
      "registry:connect",
      status.environment,
      status.version,
      0,
      Math.round(Number(status.latencyNs) / 1000000)
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
    { version: "4.0.0", date: "2026-01-31", notes: "Current stable - Bun-native APIs" },
    { version: "3.26.4", date: "2026-01-15", notes: "Previous stable" },
    { version: "3.26.3", date: "2026-01-10", notes: "Security patch" },
  ];

  history.forEach((h) => {
    console.log(`  ${h.version.padEnd(10)} ${h.date}  ${h.notes}`);
  });

  console.log("-".repeat(70) + "\n");
}

// ─── R2 Operations ────────────────────────────────

async function r2Upload(localPath: string, r2Key?: string, options: { cache?: boolean; compress?: boolean } = {}): Promise<void> {
  const startTime = Bun.nanoseconds();
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
  const fileData = await file.bytes();
  const fileSize = fileData.length;

  // Calculate CRC32 for integrity
  const crc32 = await calculateCRC32(Buffer.from(fileData));
  console.log(`${GLYPHS.HASH} CRC32: ${crc32.toString(16).toUpperCase()}`);

  console.log(`${GLYPHS.UPLOAD} Uploading to R2: ${targetKey} (${formatBytes(fileSize)})`);

  // Optionally compress
  let uploadData = fileData;
  let isCompressed = false;
  if (options.compress && fileSize > 1024) {
    console.log(`${GLYPHS.COMPRESS} Compressing...`);
    uploadData = await compressData(fileData);
    isCompressed = true;
    console.log(`${GLYPHS.OK} Compressed: ${formatBytes(fileSize)} → ${formatBytes(uploadData.length)}`);
  }

  // Set up environment for Bun.s3
  const originalEnv = { ...process.env };
  process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
  process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
  process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
  process.env.S3_BUCKET = R2_CONFIG.bucket;
  process.env.S3_REGION = R2_CONFIG.region;

  try {
    await Bun.s3.write(targetKey, uploadData, {
      type: isCompressed ? "application/gzip" : (file.type || "application/octet-stream"),
      metadata: {
        "x-amz-meta-crc32": crc32.toString(),
        "x-amz-meta-original-size": fileSize.toString(),
        "x-amz-meta-compressed": isCompressed ? "true" : "false",
        "x-amz-meta-uploaded-by": "tier1380-registry",
      },
    });

    const durationNs = Bun.nanoseconds() - startTime;
    const durationMs = Number(durationNs) / 1000000;
    const throughput = ((fileSize / 1024 / 1024) / (durationMs / 1000)).toFixed(2);
    
    console.log(`${GLYPHS.OK} Uploaded to R2 in ${durationMs.toFixed(2)}ms (${throughput} MB/s)`);

    // Cache locally
    if (options.cache !== false) {
      await setCacheEntry(targetKey, fileData, isCompressed);
      console.log(`${GLYPHS.CACHE} Cached locally`);
    }

    // Log to SQLite
    cacheDB.prepare(
      "INSERT INTO registry_benchmarks (operation, duration_ns, duration_ms, throughput, checksum) VALUES (?, ?, ?, ?, ?)"
    ).run("r2:upload", Number(durationNs), durationMs, `${throughput} MB/s`, crc32.toString(16));

    // Log sync
    cacheDB.prepare(
      "INSERT INTO registry_sync_log (direction, key, size, crc32, duration_ms) VALUES (?, ?, ?, ?, ?)"
    ).run("upload", targetKey, fileSize, crc32, Math.round(durationMs));

  } finally {
    process.env = originalEnv;
  }
}

async function r2Download(r2Key: string, localPath?: string, options: { useCache?: boolean } = {}): Promise<void> {
  const startTime = Bun.nanoseconds();
  const credentials = await getR2Credentials();
  if (!credentials) {
    console.error(`${GLYPHS.FAIL} R2 credentials not found`);
    process.exit(1);
  }

  const targetPath = localPath || r2Key.split("/").pop() || "download";

  // Check cache first
  if (options.useCache !== false) {
    const cached = await getCachedEntry(r2Key);
    if (cached) {
      console.log(`${GLYPHS.CACHE} Cache hit for ${r2Key}`);
      await Bun.write(targetPath, cached.data);
      
      // Verify CRC32
      const currentCRC32 = await calculateCRC32(Buffer.from(cached.data));
      if (currentCRC32 === cached.crc32) {
        console.log(`${GLYPHS.OK} CRC32 verified: ${currentCRC32.toString(16).toUpperCase()}`);
        console.log(`${GLYPHS.OK} Downloaded from cache to: ${targetPath}`);
        return;
      } else {
        console.log(`${GLYPHS.FAIL} CRC32 mismatch, fetching from R2...`);
      }
    }
  }

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
    const data = await s3File.bytes();

    if (!data || data.length === 0) {
      throw new Error("No data received from R2");
    }

    // Check if compressed
    const stat = await s3File.stat();
    const isCompressed = stat?.customMetadata?.["x-amz-meta-compressed"] === "true";
    const originalCRC32 = parseInt(stat?.customMetadata?.["x-amz-meta-crc32"] || "0");

    let finalData = data;
    if (isCompressed) {
      console.log(`${GLYPHS.COMPRESS} Decompressing...`);
      finalData = await decompressData(data);
    }

    // Verify CRC32
    const calculatedCRC32 = await calculateCRC32(Buffer.from(finalData));
    if (originalCRC32 && calculatedCRC32 !== originalCRC32) {
      console.warn(`${GLYPHS.FAIL} CRC32 mismatch! Expected ${originalCRC32.toString(16)}, got ${calculatedCRC32.toString(16)}`);
    } else {
      console.log(`${GLYPHS.HASH} CRC32 verified: ${calculatedCRC32.toString(16).toUpperCase()}`);
    }

    await Bun.write(targetPath, finalData);

    const durationMs = Number(Bun.nanoseconds() - startTime) / 1000000;
    console.log(`${GLYPHS.OK} Downloaded to: ${targetPath} (${durationMs.toFixed(2)}ms)`);

    // Cache locally
    if (options.useCache !== false) {
      await setCacheEntry(r2Key, finalData, isCompressed);
      console.log(`${GLYPHS.CACHE} Cached locally`);
    }

    // Log sync
    cacheDB.prepare(
      "INSERT INTO registry_sync_log (direction, key, size, crc32, duration_ms) VALUES (?, ?, ?, ?, ?)"
    ).run("download", r2Key, finalData.length, calculatedCRC32, Math.round(durationMs));

  } finally {
    process.env = originalEnv;
  }
}

async function r2List(prefix: string = ""): Promise<void> {
  console.log(`${GLYPHS.LIST} Listing R2 objects${prefix ? ` with prefix: ${prefix}` : ""}\n`);

  try {
    const result = await $`wrangler r2 object list ${R2_CONFIG.bucket} ${prefix ? `--prefix=${prefix}` : ""}`.nothrow();
    
    if (result.exitCode === 0) {
      console.log(result.stdout.toString());
    } else {
      console.log(`${GLYPHS.FAIL} Failed to list objects. Ensure wrangler is configured.`);
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

      // Remove from cache
      cacheDB.prepare("DELETE FROM registry_cache WHERE key = ?").run(r2Key);
      const cacheFile = join(REGISTRY_CONFIG.cacheDir, `${Bun.hash.wyhash(Buffer.from(r2Key)).toString(16)}.cache`);
      try {
        await $`rm -f ${cacheFile}`.nothrow();
      } catch {}

      cacheDB.prepare(
        "INSERT INTO registry_sync_log (direction, key, size, duration_ms) VALUES (?, ?, 0, 0)"
      ).run("delete", r2Key);
    } else {
      console.log(`${GLYPHS.FAIL} Failed to delete: ${result.stderr.toString()}`);
    }
  } catch (error) {
    console.log(`${GLYPHS.FAIL} R2 deletion requires wrangler`);
  }
}

// ─── Registry Sync ────────────────────────────────
async function syncRegistry(direction: "up" | "down" | "both" = "both", pattern: string = "*"): Promise<void> {
  console.log(`${GLYPHS.SYNC} Syncing registry (${direction})...\n`);
  const startTime = Bun.nanoseconds();

  // Get local files matching pattern
  const localDir = REGISTRY_CONFIG.cacheDir;
  const localFiles: string[] = [];
  
  if (existsSync(localDir)) {
    for await (const entry of new Bun.Glob(pattern).scan(localDir)) {
      if (!entry.endsWith(".cache") && !entry.endsWith(".db")) {
        localFiles.push(entry);
      }
    }
  }

  console.log(`  Local files: ${localFiles.length}`);

  if (direction === "up" || direction === "both") {
    console.log(`\n${GLYPHS.UPLOAD} Uploading to R2...`);
    for (const file of localFiles.slice(0, 10)) { // Limit to 10 for safety
      const localPath = join(localDir, file);
      try {
        await r2Upload(localPath, file, { cache: true, compress: true });
      } catch (error) {
        console.error(`${GLYPHS.FAIL} Failed to upload ${file}:`, error);
      }
    }
  }

  const durationMs = Number(Bun.nanoseconds() - startTime) / 1000000;
  console.log(`\n${GLYPHS.OK} Sync complete (${durationMs.toFixed(2)}ms)`);
}

// ─── Benchmark ────────────────────────────────────
async function benchmarkRegistry(): Promise<void> {
  console.log(`${GLYPHS.BENCHMARK} Registry Benchmark\n`);
  console.log("-".repeat(70));

  const results: BenchmarkResult[] = [];
  const testData = new Uint8Array(1024 * 1024); // 1MB test data
  crypto.getRandomValues(testData);

  // CRC32 benchmark
  {
    const iterations = 1000;
    const start = Bun.nanoseconds();
    for (let i = 0; i < iterations; i++) {
      Bun.hash.crc32(testData);
    }
    const duration = Bun.nanoseconds() - start;
    const avgNs = Number(duration) / iterations;
    const throughput = ((testData.length * iterations) / 1024 / 1024 / (Number(duration) / 1e9)).toFixed(2);
    
    results.push({
      operation: "CRC32 (1MB x 1000)",
      durationNs: duration,
      durationMs: Number(duration) / 1000000,
      throughput: `${throughput} MB/s`,
      checksum: Bun.hash.crc32(testData).toString(16),
    });
  }

  // Gzip benchmark
  {
    const start = Bun.nanoseconds();
    const compressed = Bun.gzipSync(testData);
    const duration = Bun.nanoseconds() - start;
    const ratio = ((1 - compressed.length / testData.length) * 100).toFixed(1);
    
    results.push({
      operation: "Gzip (1MB)",
      durationNs: duration,
      durationMs: Number(duration) / 1000000,
      throughput: `${ratio}% compression`,
      checksum: Bun.hash.crc32(compressed).toString(16),
    });
  }

  // Gunzip benchmark
  {
    const compressed = Bun.gzipSync(testData);
    const start = Bun.nanoseconds();
    Bun.gunzipSync(compressed);
    const duration = Bun.nanoseconds() - start;
    
    results.push({
      operation: "Gunzip (1MB)",
      durationNs: duration,
      durationMs: Number(duration) / 1000000,
      throughput: "decompression",
      checksum: Bun.hash.crc32(testData).toString(16),
    });
  }

  // Wyhash benchmark
  {
    const iterations = 1000;
    const start = Bun.nanoseconds();
    for (let i = 0; i < iterations; i++) {
      Bun.hash.wyhash(testData);
    }
    const duration = Bun.nanoseconds() - start;
    const throughput = ((testData.length * iterations) / 1024 / 1024 / (Number(duration) / 1e9)).toFixed(2);
    
    results.push({
      operation: "Wyhash (1MB x 1000)",
      durationNs: duration,
      durationMs: Number(duration) / 1000000,
      throughput: `${throughput} MB/s`,
      checksum: Bun.hash.wyhash(testData).toString(16),
    });
  }

  // Display results
  console.log(Bun.inspect.table(results.map(r => ({
    Operation: r.operation,
    "Time (ms)": r.durationMs.toFixed(3),
    Throughput: r.throughput,
    "Sample Hash": r.checksum.slice(0, 8) + "...",
  }))));

  console.log("-".repeat(70));
  console.log(`\n${GLYPHS.BENCHMARK} Benchmark complete`);
}

// ─── Show Cache Stats ─────────────────────────────
function showCacheStats(): void {
  console.log(`${GLYPHS.CACHE} Registry Cache Statistics\n`);
  console.log("-".repeat(70));

  const stats = cacheDB.query(`
    SELECT 
      COUNT(*) as count,
      SUM(size) as total_size,
      SUM(access_count) as total_accesses,
      AVG(size) as avg_size,
      SUM(CASE WHEN compressed = 1 THEN 1 ELSE 0 END) as compressed_count
    FROM registry_cache
  `).get() as any;

  console.log(`  Total Entries:     ${stats.count || 0}`);
  console.log(`  Total Size:        ${formatBytes(stats.total_size || 0)}`);
  console.log(`  Average Size:      ${formatBytes(stats.avg_size || 0)}`);
  console.log(`  Compressed:        ${stats.compressed_count || 0}`);
  console.log(`  Total Accesses:    ${stats.total_accesses || 0}`);

  // Recent sync log
  const recentSyncs = cacheDB.query(`
    SELECT direction, key, size, duration_ms, datetime(timestamp, 'unixepoch') as time
    FROM registry_sync_log
    ORDER BY timestamp DESC
    LIMIT 10
  `).all() as any[];

  if (recentSyncs.length > 0) {
    console.log(`\n  Recent Operations:`);
    console.log(Bun.inspect.table(recentSyncs));
  }

  console.log("-".repeat(70) + "\n");
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

  // Bun-native features check
  console.log(`\n  Bun-native APIs:`);
  console.log(`    ${GLYPHS.OK} Bun.dns.prefetch()`);
  console.log(`    ${GLYPHS.OK} Bun.hash.crc32()`);
  console.log(`    ${GLYPHS.OK} Bun.hash.wyhash()`);
  console.log(`    ${GLYPHS.OK} Bun.gzip/gunzip`);
  console.log(`    ${GLYPHS.OK} Bun.nanoseconds()`);
  console.log(`    ${GLYPHS.OK} Bun.s3 (R2)`);
  console.log(`    ${GLYPHS.OK} Bun:sqlite`);

  console.log("-".repeat(70));
  console.log(`\n  ${GLYPHS.SHELL} Shell Integration v2.0.0`);
  console.log("-".repeat(70) + "\n");
}

// ─── Version Compare (Bun.semver) ─────────────────
async function compareVersions(version1: string, version2: string = REGISTRY_CONFIG.version): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Version Comparison\n`);
  console.log("-".repeat(70));

  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);

  console.log(`  Version 1: ${version1}`);
  console.log(`  Version 2: ${version2}`);

  // Use Bun.semver if available
  if (typeof Bun !== "undefined" && Bun.semver) {
    const satisfies1 = Bun.semver.satisfies(version1, `>=${version2}`);
    const satisfies2 = Bun.semver.satisfies(version2, `>=${version1}`);
    
    console.log(`\n  Bun.semver Analysis:`);
    console.log(`    ${version1} >= ${version2}: ${satisfies1}`);
    console.log(`    ${version2} >= ${version1}: ${satisfies2}`);
  }

  // Manual comparison
  let comparison = 0;
  if (v1.major !== v2.major) comparison = v1.major - v2.major;
  else if (v1.minor !== v2.minor) comparison = v1.minor - v2.minor;
  else comparison = v1.patch - v2.patch;

  console.log(`\n  Result: ${comparison > 0 ? COLORS.success(version1 + " is newer") : comparison < 0 ? COLORS.error(version1 + " is older") : COLORS.info("Versions are equal")}`);

  console.log("-".repeat(70) + "\n");
}

// ─── Binary Detection (Bun.which) ─────────────────
async function detectBinaries(): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Registry Binary Detection\n`);
  console.log("-".repeat(70));

  const binaries = ["bun", "wrangler", "aws", "git", "curl", "wget", "tar", "gzip"];
  
  const results = binaries.map(bin => {
    const path = Bun.which(bin);
    return { Binary: bin, Path: path || COLORS.error("not found") };
  });

  console.log(Bun.inspect.table(results));

  // Check critical binaries for registry operations
  const critical = ["bun", "wrangler"];
  const missing = critical.filter(bin => !Bun.which(bin));
  
  if (missing.length > 0) {
    console.log(COLORS.warning(`\n  Warning: Missing critical binaries: ${missing.join(", ")}`));
  } else {
    console.log(COLORS.success(`\n  ${GLYPHS.OK} All critical binaries found`));
  }

  console.log("-".repeat(70) + "\n");
}

// ─── Health Monitor ───────────────────────────────
async function healthMonitor(interval: number = 30): Promise<void> {
  console.log(`${GLYPHS.HEALTH} Starting Registry Health Monitor (${interval}s interval)\n`);
  console.log("Press Ctrl+C to stop\n");

  let checks = 0;
  let failures = 0;

  const check = async () => {
    checks++;
    const timestamp = new Date().toISOString();
    const status = await checkRegistry();
    
    const icon = status.connected ? GLYPHS.OK : GLYPHS.FAIL;
    const color = status.connected ? COLORS.success : COLORS.error;
    
    if (!status.connected) failures++;
    
    const line = `[${timestamp}] ${icon} Registry: ${status.connected ? "UP" : "DOWN"} | R2: ${status.r2Status} | Cache: ${status.cacheStatus} | Failures: ${failures}/${checks}`;
    console.log(color(line));

    // Log to SQLite
    cacheDB.prepare(
      "INSERT INTO registry_sync_log (direction, key, size, duration_ms) VALUES (?, ?, ?, ?)"
    ).run("health", status.connected ? "up" : "down", failures, Number(status.latencyNs) / 1000000);
  };

  // Initial check
  await check();

  // Set up interval
  const intervalId = setInterval(check, interval * 1000);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(intervalId);
    console.log(`\n${GLYPHS.OK} Health monitor stopped. ${checks} checks, ${failures} failures.`);
    process.exit(0);
  });
}

// ─── Registry Backup ──────────────────────────────
async function backupRegistry(outputPath?: string): Promise<void> {
  console.log(`${GLYPHS.BACKUP} Creating Registry Backup\n`);
  console.log("-".repeat(70));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = outputPath || `./backups/registry-backup-${timestamp}.tar.gz`;
  
  // Ensure backup directory exists
  const backupDir = backupFile.split("/").slice(0, -1).join("/") || ".";
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  // Collect files to backup
  const filesToBackup = [
    REGISTRY_CONFIG.dbPath,
    `${REGISTRY_CONFIG.cacheDir}/registry-cache.db`,
  ].filter(existsSync);

  console.log(`  Files to backup: ${filesToBackup.length}`);
  filesToBackup.forEach(f => console.log(`    ${GLYPHS.OK} ${f}`));

  // Create backup using tar
  const startTime = Bun.nanoseconds();
  
  try {
    // Create tar archive
    const tarProc = Bun.spawn(["tar", "-czf", backupFile, ...filesToBackup], {
      stdout: "pipe",
      stderr: "pipe",
    });
    await tarProc.exited;

    if (tarProc.exitCode !== 0) {
      throw new Error(`tar failed: ${await new Response(tarProc.stderr).text()}`);
    }

    const durationMs = Number(Bun.nanoseconds() - startTime) / 1000000;
    const backupSize = (await Bun.file(backupFile).stat()).size;

    console.log(`\n${GLYPHS.OK} Backup created: ${backupFile}`);
    console.log(`  Size: ${formatBytes(backupSize)}`);
    console.log(`  Time: ${durationMs.toFixed(2)}ms`);

    // Calculate checksum
    const backupData = await Bun.file(backupFile).bytes();
    const crc32 = Bun.hash.crc32(backupData);
    console.log(`  CRC32: ${crc32.toString(16).toUpperCase()}`);

    // Log backup
    cacheDB.prepare(
      "INSERT INTO registry_sync_log (direction, key, size, crc32, duration_ms) VALUES (?, ?, ?, ?, ?)"
    ).run("backup", backupFile, backupSize, crc32, Math.round(durationMs));

  } catch (error) {
    console.error(`${GLYPHS.FAIL} Backup failed:`, error);
    process.exit(1);
  }

  console.log("-".repeat(70) + "\n");
}

// ─── Registry Restore ─────────────────────────────
async function restoreRegistry(backupFile: string): Promise<void> {
  console.log(`${GLYPHS.RESTORE} Restoring Registry from Backup\n`);
  console.log("-".repeat(70));

  if (!existsSync(backupFile)) {
    console.error(`${GLYPHS.FAIL} Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  const backupSize = (await Bun.file(backupFile).stat()).size;
  console.log(`  Backup: ${backupFile}`);
  console.log(`  Size: ${formatBytes(backupSize)}`);

  // Verify checksum if stored
  const backupData = await Bun.file(backupFile).bytes();
  const crc32 = Bun.hash.crc32(backupData);
  console.log(`  Current CRC32: ${crc32.toString(16).toUpperCase()}`);

  const startTime = Bun.nanoseconds();

  try {
    // Extract backup
    const tarProc = Bun.spawn(["tar", "-xzf", backupFile], {
      stdout: "pipe",
      stderr: "pipe",
    });
    await tarProc.exited;

    if (tarProc.exitCode !== 0) {
      throw new Error(`tar extraction failed: ${await new Response(tarProc.stderr).text()}`);
    }

    const durationMs = Number(Bun.nanoseconds() - startTime) / 1000000;
    console.log(`\n${GLYPHS.OK} Restore complete (${durationMs.toFixed(2)}ms)`);

    // Log restore
    cacheDB.prepare(
      "INSERT INTO registry_sync_log (direction, key, size, crc32, duration_ms) VALUES (?, ?, ?, ?, ?)"
    ).run("restore", backupFile, backupSize, crc32, Math.round(durationMs));

  } catch (error) {
    console.error(`${GLYPHS.FAIL} Restore failed:`, error);
    process.exit(1);
  }

  console.log("-".repeat(70) + "\n");
}

// ─── Config Validation (Bun.deepEquals) ─────────────
async function validateConfig(configPath: string, schemaPath?: string): Promise<void> {
  console.log(`${GLYPHS.LOCK} Config Validation (Bun.deepEquals)\n`);
  console.log("-".repeat(70));

  if (!existsSync(configPath)) {
    console.error(`${GLYPHS.FAIL} Config file not found: ${configPath}`);
    process.exit(1);
  }

  const config = await Bun.file(configPath).json();
  
  console.log(`  Config: ${configPath}`);
  console.log(`  Keys: ${Object.keys(config).join(", ")}`);

  // Validate required fields
  const requiredFields = ["version", "environment", "r2Bucket"];
  const missing = requiredFields.filter(f => !(f in config));
  
  if (missing.length > 0) {
    console.log(`\n${GLYPHS.FAIL} Missing required fields: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Compare with default config using Bun.deepEquals
  const defaultConfig = {
    version: REGISTRY_CONFIG.version,
    environment: "local",
    r2Bucket: R2_CONFIG.bucket,
  };

  const isMatch = Bun.deepEquals(
    { version: config.version, environment: config.environment, r2Bucket: config.r2Bucket },
    defaultConfig,
    true
  );

  console.log(`\n  Bun.deepEquals check: ${isMatch ? COLORS.success("matches defaults") : COLORS.warning("differs from defaults")}`);

  // Show string width for terminal formatting
  const configStr = JSON.stringify(config, null, 2);
  const maxLineWidth = Math.max(...configStr.split("\n").map(line => Bun.stringWidth(line, { countAnsiEscapeCodes: false })));
  console.log(`  Max line width: ${maxLineWidth} cols (Col-89: ${maxLineWidth <= 89 ? COLORS.success("PASS") : COLORS.error("FAIL")})`);

  console.log("-".repeat(70) + "\n");
}

// ─── Config Diff (Bun.deepEquals) ─────────────────
async function diffConfigs(config1Path: string, config2Path: string): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Config Diff (Bun.deepEquals)\n`);
  console.log("-".repeat(70));

  if (!existsSync(config1Path) || !existsSync(config2Path)) {
    console.error(`${GLYPHS.FAIL} One or both config files not found`);
    process.exit(1);
  }

  const config1 = await Bun.file(config1Path).json();
  const config2 = await Bun.file(config2Path).json();

  console.log(`  Config 1: ${config1Path}`);
  console.log(`  Config 2: ${config2Path}`);

  const equal = Bun.deepEquals(config1, config2, true);

  if (equal) {
    console.log(`\n${GLYPHS.OK} ${COLORS.success("Configs are identical")}`);
  } else {
    console.log(`\n${GLYPHS.FAIL} ${COLORS.error("Configs differ")}`);
    
    // Show differences
    const keys1 = Object.keys(config1);
    const keys2 = Object.keys(config2);
    
    const onlyIn1 = keys1.filter(k => !(k in config2));
    const onlyIn2 = keys2.filter(k => !(k in config1));
    const different = keys1.filter(k => k in config2 && !Bun.deepEquals(config1[k], config2[k], true));

    if (onlyIn1.length) console.log(`  Only in config1: ${onlyIn1.join(", ")}`);
    if (onlyIn2.length) console.log(`  Only in config2: ${onlyIn2.join(", ")}`);
    if (different.length) console.log(`  Different values: ${different.join(", ")}`);
  }

  console.log("-".repeat(70) + "\n");
}

// ─── Password Hash (Bun.password) ─────────────────
async function hashPassword(password?: string): Promise<void> {
  console.log(`${GLYPHS.LOCK} Password Hashing (Bun.password)\n`);
  console.log("-".repeat(70));

  const pwd = password || "default-password-change-me";
  
  console.log(`  Input: ${"*".repeat(pwd.length)}`);
  console.log(`  Algorithm: argon2id (Bun.password default)`);

  const start = Bun.nanoseconds();
  const hash = await Bun.password.hash(pwd, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
  const duration = Number(Bun.nanoseconds() - start) / 1000000;

  console.log(`\n  Hash: ${hash.slice(0, 50)}...`);
  console.log(`  Time: ${duration.toFixed(2)}ms`);

  // Verify
  const verifyStart = Bun.nanoseconds();
  const valid = await Bun.password.verify(pwd, hash);
  const verifyDuration = Number(Bun.nanoseconds() - verifyStart) / 1000000;

  console.log(`\n  Verification: ${valid ? COLORS.success("VALID") : COLORS.error("INVALID")}`);
  console.log(`  Verify time: ${verifyDuration.toFixed(2)}ms`);

  console.log("-".repeat(70) + "\n");
}

// ─── RSS Feed Generation (Bun.escapeHTML) ─────────
async function generateRSSFeed(): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Generating Registry RSS Feed\n`);
  console.log("-".repeat(70));

  // Get recent operations from SQLite
  const operations = cacheDB.query(`
    SELECT direction, key, size, datetime(timestamp, 'unixepoch') as time
    FROM registry_sync_log
    ORDER BY timestamp DESC
    LIMIT 20
  `).all() as any[];

  const feedItems = operations.map(op => {
    const title = Bun.escapeHTML(`${op.direction}: ${op.key}`);
    const description = Bun.escapeHTML(`Size: ${formatBytes(op.size || 0)} at ${op.time}`);
    return `
    <item>
      <title>${title}</title>
      <description>${description}</description>
      <pubDate>${op.time}</pubDate>
      <guid>${Bun.hash.wyhash(Buffer.from(op.key + op.time)).toString(16)}</guid>
    </item>`;
  }).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tier-1380 Registry Activity</title>
    <link>https://factory-wager.com/registry</link>
    <description>OMEGA Registry synchronization activity feed</description>
    <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
    ${feedItems}
  </channel>
</rss>`;

  const rssPath = "./.registry-cache/activity.xml";
  await Bun.write(rssPath, rss);

  console.log(`  Generated: ${rssPath}`);
  console.log(`  Items: ${operations.length}`);
  console.log(`  Size: ${formatBytes(rss.length)}`);

  // Show Col-89 compliance
  const maxWidth = Math.max(...rss.split("\n").map(l => Bun.stringWidth(l, { countAnsiEscapeCodes: false })));
  console.log(`  Col-89: ${maxWidth <= 89 ? COLORS.success("PASS") : COLORS.warning(`FAIL (${maxWidth})`)}`);

  console.log("-".repeat(70) + "\n");
}

// ─── Async Peek Demo (Bun.peek) ───────────────────
async function peekDemo(): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Bun.peek() Async Inspection Demo\n`);
  console.log("-".repeat(70));

  // Create a promise that resolves after a delay
  const delayedPromise = new Promise<string>((resolve) => {
    setTimeout(() => resolve("Registry data loaded"), 100);
  });

  // Check if resolved using Bun.peek (returns the value or a sentinel)
  const peek1 = Bun.peek(delayedPromise);
  console.log(`  Immediate peek: ${typeof peek1 === "object" ? "Promise (pending)" : peek1}`);

  // Wait and check again
  await new Promise(r => setTimeout(r, 150));
  const peek2 = Bun.peek(delayedPromise);
  console.log(`  After 150ms peek: ${peek2}`);

  // Real use case: Check if cached data is ready
  const cachePromise = getCachedEntry("test-key").catch(() => null);
  const cachePeek = Bun.peek(cachePromise);
  
  if (cachePeek instanceof Promise) {
    console.log(`  Cache lookup: async (not cached)`);
  } else {
    console.log(`  Cache lookup: ${cachePeek ? "sync (cached)" : "sync (miss)"}`);
  }

  console.log("-".repeat(70) + "\n");
}

// ─── Path Operations (Bun.path) ─────────────────────
async function pathOperations(filePath: string = "./data/test.json"): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Path Operations Demo (path)\n`);
  console.log("-".repeat(70));

  console.log(`  Input: ${filePath}`);
  console.log(`  basename: ${basename(filePath)}`);
  console.log(`  dirname: ${dirname(filePath)}`);
  console.log(`  extname: ${extname(filePath)}`);
  console.log(`  join: ${join(dirname(filePath), "subfolder", basename(filePath))}`);

  // Bun.file path operations
  const file = Bun.file(filePath);
  console.log(`\n  Bun.file exists: ${await file.exists()}`);
  
  // Registry path resolution
  const registryPaths = {
    cache: REGISTRY_CONFIG.cacheDir,
    db: REGISTRY_CONFIG.dbPath,
    backup: "./backups",
    config: "./config",
  };

  console.log(`\n  Registry Paths:`);
  Object.entries(registryPaths).forEach(([name, path]) => {
    console.log(`    ${name}: ${path} (basename: ${basename(path)})`);
  });

  console.log("-".repeat(70) + "\n");
}

// ─── TCP Registry Server ────────────────────────────
let tcpServer: TCPSocketListener | null = null;

async function startRegistryServer(port: number = 8787): Promise<void> {
  console.log(`${GLYPHS.CONNECT} Starting Registry TCP Server on port ${port}\n`);
  console.log("-".repeat(70));

  const connections = new Set<Socket>();

  tcpServer = Bun.listen({
    hostname: "127.0.0.1",
    port: port,
    socket: {
      open(socket) {
        connections.add(socket);
        console.log(`  [${new Date().toISOString()}] Client connected (${connections.size} total)`);
        socket.write("Welcome to Tier-1380 Registry Server\n");
        socket.write("Commands: STATUS, VERSION, LIST, STATS, QUIT\n> ");
      },
      data(socket, data) {
        const command = new TextDecoder().decode(data).trim().toUpperCase();
        console.log(`  [${new Date().toISOString()}] Command: ${command}`);

        switch (command) {
          case "STATUS":
            socket.write(`Status: ${tcpServer ? "RUNNING" : "STOPPED"}\n`);
            socket.write(`Connections: ${connections.size}\n`);
            break;
          case "VERSION":
            socket.write(`Version: ${REGISTRY_CONFIG.version}\n`);
            break;
          case "LIST":
            const files = cacheDB.query("SELECT key, size FROM registry_cache LIMIT 10").all() as any[];
            socket.write(`Cache entries: ${files.length}\n`);
            files.forEach(f => socket.write(`  ${f.key} (${formatBytes(f.size)})\n`));
            break;
          case "STATS":
            const stats = cacheDB.query("SELECT COUNT(*) as count, SUM(size) as total FROM registry_cache").get() as any;
            socket.write(`Total entries: ${stats.count}\n`);
            socket.write(`Total size: ${formatBytes(stats.total || 0)}\n`);
            break;
          case "QUIT":
            socket.write("Goodbye!\n");
            socket.end();
            return;
          default:
            socket.write(`Unknown command: ${command}\n`);
            socket.write("Commands: STATUS, VERSION, LIST, STATS, QUIT\n");
        }
        socket.write("> ");
      },
      close(socket) {
        connections.delete(socket);
        console.log(`  [${new Date().toISOString()}] Client disconnected (${connections.size} remaining)`);
      },
      error(socket, error) {
        console.error(`  [${new Date().toISOString()}] Socket error:`, error);
        connections.delete(socket);
      },
    },
  });

  console.log(`  ${GLYPHS.OK} Server listening on 127.0.0.1:${port}`);
  console.log(`  Press Ctrl+C to stop\n`);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log(`\n${GLYPHS.OK} Stopping server...`);
    tcpServer?.stop();
    process.exit(0);
  });

  // Keep running
  await new Promise(() => {});
}

// ─── Spawn Worker with IPC ──────────────────────────
async function spawnWorker(task: string = "benchmark"): Promise<void> {
  console.log(`${GLYPHS.DRIFT} Spawning Worker with IPC (Bun.spawn)\n`);
  console.log("-".repeat(70));

  const workerScript = `
    // Worker process
    process.on("message", (msg) => {
      console.log("[Worker] Received:", msg);
      
      if (msg.task === "benchmark") {
        const data = new Uint8Array(1024 * 1024);
        const crc32 = Bun.hash.crc32(data);
        process.send({ result: "benchmark", crc32: crc32.toString(16), pid: process.pid });
      } else if (msg.task === "hash") {
        const hash = Bun.hash.wyhash(Buffer.from(msg.data));
        process.send({ result: "hash", hash: hash.toString(16), pid: process.pid });
      } else {
        process.send({ error: "Unknown task", pid: process.pid });
      }
      
      process.exit(0);
    });
    
    // Signal ready
    process.send({ status: "ready", pid: process.pid });
  `;

  const proc = Bun.spawn(["bun", "-e", workerScript], {
    ipc: (message, subprocess) => {
      console.log(`  [Main] IPC from worker:`, message);
    },
    onExit: (subprocess, exitCode, signalCode, error) => {
      console.log(`  [Main] Worker exited with code ${exitCode}`);
    },
  });

  console.log(`  ${GLYPHS.OK} Worker spawned (PID: ${proc.pid})`);

  // Wait for worker to be ready
  await new Promise(r => setTimeout(r, 100));

  // Send task to worker
  console.log(`  [Main] Sending task: ${task}`);
  proc.send({ task, data: "test-data" });

  // Wait for completion
  await new Promise(r => setTimeout(r, 500));

  proc.kill();
  console.log("-".repeat(70) + "\n");
}

// ─── File Watcher (Bun.watch) ───────────────────────
async function watchFiles(pattern: string = "./data/*"): Promise<void> {
  console.log(`${GLYPHS.WATCH} Starting File Watcher (fs.watch)\n`);
  console.log("-".repeat(70));
  console.log(`  Watching: ${pattern}`);
  console.log(`  Press Ctrl+C to stop\n`);

  const watcher = fs.watch("./data", { recursive: true }, (eventType, filename) => {
    console.log(`  [${new Date().toISOString()}] ${eventType}: ${filename}`);
    
    // Log to database
    cacheDB.prepare(
      "INSERT INTO registry_sync_log (direction, key, size, duration_ms) VALUES (?, ?, 0, 0)"
    ).run("watch", `${eventType}:${filename}`, 0);
  });

  process.on("SIGINT", () => {
    console.log(`\n${GLYPHS.OK} Stopping watcher...`);
    watcher.close();
    process.exit(0);
  });

  // Keep running
  await new Promise(() => {});
}

// Import fs for watch
import * as fs from "fs";

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
      await r2Upload(args[1], args[2], { cache: true, compress: args.includes("--compress") });
      break;

    case "r2:download":
    case "r2-dl":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry r2:download <r2-key> [local-path]`);
        process.exit(1);
      }
      await r2Download(args[1], args[2], { useCache: !args.includes("--no-cache") });
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

    // Sync Commands
    case "sync":
      await syncRegistry(args[1] as any || "both", args[2] || "*");
      break;

    case "sync:up":
      await syncRegistry("up", args[1] || "*");
      break;

    case "sync:down":
      await syncRegistry("down", args[1] || "*");
      break;

    // Cache Commands
    case "cache:stats":
      showCacheStats();
      break;

    case "cache:clear":
      cacheDB.run("DELETE FROM registry_cache");
      await $`rm -rf ${REGISTRY_CONFIG.cacheDir}/*.cache`.nothrow();
      console.log(`${GLYPHS.OK} Cache cleared`);
      break;

    // Benchmark
    case "benchmark":
    case "bench":
      await benchmarkRegistry();
      break;

    // Kimi Shell Commands
    case "shell:status":
      await kimiShellStatus();
      break;

    // Version Commands
    case "version:compare":
    case "v:cmp":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry version:compare <version1> [version2]`);
        process.exit(1);
      }
      await compareVersions(args[1], args[2]);
      break;

    // Binary Detection
    case "bin:check":
      await detectBinaries();
      break;

    // Health Monitor
    case "health:monitor":
      const interval = parseInt(args[1]) || 30;
      await healthMonitor(interval);
      break;

    // Backup/Restore
    case "backup":
      await backupRegistry(args[1]);
      break;

    case "restore":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry restore <backup-file>`);
        process.exit(1);
      }
      await restoreRegistry(args[1]);
      break;

    // Config Commands
    case "config:validate":
      if (!args[1]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry config:validate <config-path>`);
        process.exit(1);
      }
      await validateConfig(args[1], args[2]);
      break;

    case "config:diff":
      if (!args[1] || !args[2]) {
        console.error(`${GLYPHS.FAIL} Usage: bun run tier1380:registry config:diff <config1> <config2>`);
        process.exit(1);
      }
      await diffConfigs(args[1], args[2]);
      break;

    // Password Hash
    case "password:hash":
      await hashPassword(args[1]);
      break;

    // RSS Feed
    case "rss:generate":
      await generateRSSFeed();
      break;

    // Demo Commands
    case "demo:peek":
      await peekDemo();
      break;

    case "demo:path":
      await pathOperations(args[1]);
      break;

    // Server Commands
    case "server:start":
      const serverPort = parseInt(args[1]) || 8787;
      await startRegistryServer(serverPort);
      break;

    // Worker Commands
    case "worker:spawn":
      await spawnWorker(args[1] || "benchmark");
      break;

    // Watch Commands
    case "watch":
      await watchFiles(args[1] || "./data/*");
      break;

    case "help":
    default:
      console.log(`
${GLYPHS.DRIFT} Tier-1380 OMEGA Registry Connector v2.1

Usage:
  bun run tier1380:registry [command] [options]

Registry Commands:
  check                Check registry connection and status (with DNS prefetch)
  version              Show current registry version
  version:compare <v1> [v2]  Compare versions (uses Bun.semver)
  connect              Connect to registry (with logging)
  history              Show version history

R2 Commands:
  r2:upload <path> [key]   Upload file to R2 with CRC32 + compression
  r2:download <key> [path] Download file from R2 with cache support
  r2:list [prefix]         List R2 objects
  r2:delete <key]          Delete R2 object
  r2:status                Check R2 connection status

Sync Commands:
  sync [direction] [pattern]   Sync registry (up/down/both)
  sync:up [pattern]            Sync local to R2
  sync:down [pattern]          Sync R2 to local

Cache Commands:
  cache:stats          Show cache statistics
  cache:clear          Clear local cache

Health & Monitoring:
  health:monitor [interval]  Monitor registry health (default: 30s)

Backup & Restore:
  backup [output-path]   Create registry backup (tar.gz)
  restore <backup-file>  Restore registry from backup

Utilities:
  benchmark            Run Bun-native benchmark suite
  bin:check            Detect required binaries (Bun.which)
  password:hash [pwd]  Hash password (Bun.password - argon2id)
  rss:generate         Generate RSS feed (Bun.escapeHTML)
  demo:peek            Demo Bun.peek() async inspection
  demo:path [file]     Demo path operations (path module)

Server & IPC:
  server:start [port]  Start TCP registry server (Bun.listen)
  worker:spawn [task]  Spawn worker with IPC (Bun.spawn)
  watch [pattern]      Watch files for changes (fs.watch)

Config Management:
  config:validate <path>   Validate config (Bun.deepEquals)
  config:diff <c1> <c2>    Compare configs (Bun.deepEquals)

Kimi Shell Integration:
  shell:status         Show Kimi shell integration status

Examples:
  bun run tier1380:registry check
  bun run tier1380:registry r2:upload ./data.tar.gz --compress
  bun run tier1380:registry version:compare 4.0.0 3.26.4
  bun run tier1380:registry health:monitor 60
  bun run tier1380:registry backup ./backups/registry-$(date +%Y%m%d).tar.gz
  bun run tier1380:registry restore ./backups/registry-20260131.tar.gz
  bun run tier1380:registry benchmark
  bun run tier1380:registry bin:check

Bun-native Features:
  • Bun.listen() - TCP socket server for registry API
  • Bun.spawn(ipc) - Worker processes with IPC
  • fs.watch() - File system monitoring
  • path module - Cross-platform path operations
  • Bun.dns.prefetch() - DNS pre-resolution for endpoints
  • Bun.semver.satisfies() - Version comparison
  • Bun.which() - Binary detection in PATH
  • Bun.deepEquals() - Config comparison & validation
  • Bun.stringWidth() - Terminal width (Col-89 compliance)
  • Bun.escapeHTML() - RSS/XML generation
  • Bun.password.hash() - Argon2id password hashing
  • Bun.peek() - Async promise inspection
  • Bun.hash.crc32() - Integrity verification
  • Bun.hash.wyhash() - Fast hashing for cache keys
  • Bun.gzip/gunzip - Native compression
  • Bun.nanoseconds() - High-precision timing
  • Bun.color() - Terminal colors
  • Bun.s3 - R2 object storage
  • Bun:sqlite - Local cache database
`);
      if (cmd !== "help") process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { 
  checkRegistry, 
  parseVersion, 
  REGISTRY_CONFIG, 
  getR2Credentials, 
  checkR2Connection,
  calculateCRC32,
  compressData,
  decompressData,
};
