import { readdir, writeFile, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { $ } from "bun";

// R2 Integration with Bun.secrets
const R2_CONFIG = {
  accountId: process.env.CF_ACCOUNT_ID || "7a470541a704caaf91e71efccc78fd36",
  bucket: process.env.R2_BUCKET || "fw-backups",
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID || "7a470541a704caaf91e71efccc78fd36"}.r2.cloudflarestorage.com`,
};

/**
 * Get R2 credentials using Bun.secrets with fallback to environment variables
 */
async function getR2Credentials(): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  try {
    // Try Bun.secrets first (more secure)
    const accessKeyId = await Bun.secrets.get("com.factory-wager.r2.access-key-id");
    const secretAccessKey = await Bun.secrets.get("com.factory-wager.r2.secret-access-key");

    if (accessKeyId && secretAccessKey) {
      console.log("🔐 Using R2 credentials from Bun.secrets");
      return { accessKeyId, secretAccessKey };
    }
  } catch (error) {
    console.log("⚠️  Bun.secrets not available, falling back to environment variables");
  }

  // Fallback to environment variables
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not found. Set them using:\n" +
      "  Bun.secrets: com.factory-wager.r2.access-key-id, com.factory-wager.r2.secret-access-key\n" +
      "  Environment: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    );
  }

  console.log("🔓 Using R2 credentials from environment variables");
  return { accessKeyId, secretAccessKey };
}

export interface TenantSnapshot {
  tenantId: string;
  timestamp: string;
  filename: string;
  size: number;
  path: string;
  r2Url?: string;
  r2Key?: string;
}

export interface TenantData {
  id: string;
  name: string;
  config: Record<string, any>;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const SNAPSHOTS_DIR = "./snapshots";
const TENANTS_DIR = "./tenants";

// ============================================================================
// R2 INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Upload a file to Cloudflare R2 using Bun.s3 with Bun.secrets
 */
export async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  try {
    const credentials = await getR2Credentials();
    const file = Bun.file(localPath);
    const fileSize = file.size;

    console.log(`📤 Uploading to R2: ${r2Key} (${Math.round(fileSize / 1024)} KiB)`);

    // Set up environment variables for Bun.s3
    const originalEnv = { ...process.env };
    process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
    process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
    process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
    process.env.S3_BUCKET = R2_CONFIG.bucket;
    process.env.S3_REGION = R2_CONFIG.region;

    try {
      // Use Bun's native S3 API
      await Bun.s3.write(r2Key, file, {
        type: "application/gzip",
      });

      const r2Url = `https://pub-${R2_CONFIG.accountId}.r2.dev/${R2_CONFIG.bucket}/${r2Key}`;
      console.log(`✅ Uploaded to R2: ${r2Url}`);

      return r2Url;
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  } catch (error) {
    console.error("❌ R2 upload failed:", error);
    throw error;
  }
}

/**
 * Download a file from Cloudflare R2 using Bun.s3 with Bun.secrets
 */
export async function downloadFromR2(r2Key: string, localPath: string): Promise<void> {
  try {
    const credentials = await getR2Credentials();
    console.log(`📥 Downloading from R2: ${r2Key}`);

    // Set up environment variables for Bun.s3
    const originalEnv = { ...process.env };
    process.env.S3_ACCESS_KEY_ID = credentials.accessKeyId;
    process.env.S3_SECRET_ACCESS_KEY = credentials.secretAccessKey;
    process.env.S3_ENDPOINT = R2_CONFIG.endpoint;
    process.env.S3_BUCKET = R2_CONFIG.bucket;
    process.env.S3_REGION = R2_CONFIG.region;

    try {
      // Use Bun's native S3 API
      const s3File = Bun.s3.file(r2Key);
      const data = await s3File.arrayBuffer();

      if (!data) {
        throw new Error("No data received from R2");
      }

      await mkdir(dirname(localPath), { recursive: true });
      await Bun.write(localPath, data);

      console.log(`✅ Downloaded from R2: ${localPath}`);
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  } catch (error) {
    console.error("❌ R2 download failed:", error);
    throw error;
  }
}

/**
 * List objects in R2 bucket with prefix (using wrangler for full functionality)
 */
export async function listR2Objects(prefix: string = ""): Promise<Array<{key: string, size: number, lastModified: string}>> {
  try {
    // Try wrangler first for full functionality
    return await listR2ObjectsWithWrangler(prefix);
  } catch (error) {
    console.warn("⚠️  Wrangler not available, using limited Bun.s3 listing");
    // Fallback to empty array since Bun.s3 doesn't have listObjects
    return [];
  }
}

/**
 * Delete object from R2 (using wrangler for full functionality)
 */
export async function deleteFromR2(r2Key: string): Promise<void> {
  try {
    // Try wrangler first for full functionality
    await deleteFromR2WithWrangler(r2Key);
  } catch (error) {
    console.warn("⚠️  Wrangler not available, deletion not supported with Bun.s3 alone");
    console.log(`ℹ️  Would delete from R2: ${r2Key}`);
  }
}

/**
 * Create a snapshot for a specific tenant
 */
export async function createTenantSnapshot(tenantId: string, shouldUploadToR2: boolean = false): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${tenantId}-${timestamp}.tar.gz`;
  const snapshotPath = join(SNAPSHOTS_DIR, filename);
  const tenantPath = join(TENANTS_DIR, tenantId);

  // Ensure directories exist
  await mkdir(dirname(snapshotPath), { recursive: true });

  // Check if tenant directory exists
  try {
    await stat(tenantPath);
  } catch {
    // Create sample tenant data if directory doesn't exist
    await createSampleTenantData(tenantId);
  }

  // Create tar.gz snapshot using system tar command
  await $`tar -czf ${snapshotPath} -C ${TENANTS_DIR} ${tenantId}`;

  // Get file size
  const fileStat = await stat(snapshotPath);
  const sizeBytes = fileStat.size;

  // Log snapshot info
  console.log(`✅ Created snapshot: ${filename}`);
  console.log(`📁 Size: ${Math.round(sizeBytes / 1024)} KiB`);
  console.log(`📍 Path: ${snapshotPath}`);

  // Upload to R2 if requested
  if (shouldUploadToR2) {
    try {
      const r2Key = `tenant-snapshots/${tenantId}/${filename}`;
      const r2Url = await uploadToR2(snapshotPath, r2Key);
      console.log(`☁️  R2 URL: ${r2Url}`);
    } catch (error) {
      console.warn(`⚠️  R2 upload failed, keeping local copy only:`, error);
    }
  }

  return snapshotPath;
}

/**
 * Create and upload tenant snapshot to R2
 */
export async function createAndUploadTenantSnapshot(tenantId: string): Promise<{localPath: string, r2Url: string, r2Key: string}> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${tenantId}-${timestamp}.tar.gz`;
  const snapshotPath = join(SNAPSHOTS_DIR, filename);
  const r2Key = `tenant-snapshots/${tenantId}/${filename}`;

  // Create local snapshot first
  await createTenantSnapshot(tenantId, false);

  // Upload to R2
  const r2Url = await uploadToR2(snapshotPath, r2Key);

  return {
    localPath: snapshotPath,
    r2Url,
    r2Key,
  };
}

/**
 * List the most recent snapshots (local + R2)
 */
export async function listRecentSnapshots(limit: number = 5, includeR2: boolean = false): Promise<TenantSnapshot[]> {
  try {
    await mkdir(SNAPSHOTS_DIR, { recursive: true });
    const files = await readdir(SNAPSHOTS_DIR);

    const snapshots: TenantSnapshot[] = [];

    // Local snapshots
    for (const file of files) {
      if (file.endsWith(".tar.gz")) {
        const filePath = join(SNAPSHOTS_DIR, file);
        const fileStat = await stat(filePath);

        // Parse filename: tenantId-timestamp.tar.gz
        const match = file.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.tar\.gz$/);
        if (match) {
          const [, tenantId, timestamp] = match;

          snapshots.push({
            tenantId,
            timestamp: timestamp.replace(/-/g, ":").replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, "T$1:$2:$3.$4Z"),
            filename: file,
            size: fileStat.size,
            path: filePath,
          });
        }
      }
    }

    // R2 snapshots (if requested)
    if (includeR2 && R2_CONFIG.accessKeyId && R2_CONFIG.secretAccessKey) {
      try {
        const r2Objects = await listR2Objects("tenant-snapshots/");

        for (const obj of r2Objects) {
          // Parse R2 key: tenant-snapshots/tenantId/filename
          const keyParts = obj.key.split("/");
          if (keyParts.length >= 3) {
            const tenantId = keyParts[1];
            const filename = keyParts[2];

            // Extract timestamp from filename
            const match = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.tar\.gz$/);
            if (match) {
              const [, , timestamp] = match;

              snapshots.push({
                tenantId,
                timestamp: timestamp.replace(/-/g, ":").replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, "T$1:$2:$3.$4Z"),
                filename: `[R2] ${filename}`,
                size: obj.size,
                path: obj.key,
                r2Url: `https://pub-${R2_CONFIG.accountId}.r2.dev/${R2_CONFIG.bucket}/${obj.key}`,
                r2Key: obj.key,
              });
            }
          }
        }
      } catch (error) {
        console.warn("⚠️  Failed to fetch R2 snapshots:", error);
      }
    }

    // Sort by timestamp (newest first) and limit
    return snapshots
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error listing snapshots:", error);
    return [];
  }
}

/**
 * List only R2 snapshots
 */
export async function listR2Snapshots(limit: number = 10): Promise<TenantSnapshot[]> {
  if (!R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
    console.warn("⚠️  R2 credentials not configured");
    return [];
  }

  try {
    const r2Objects = await listR2Objects("tenant-snapshots/");
    const snapshots: TenantSnapshot[] = [];

    for (const obj of r2Objects) {
      const keyParts = obj.key.split("/");
      if (keyParts.length >= 3) {
        const tenantId = keyParts[1];
        const filename = keyParts[2];

        const match = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.tar\.gz$/);
        if (match) {
          const [, , timestamp] = match;

          snapshots.push({
            tenantId,
            timestamp: timestamp.replace(/-/g, ":").replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, "T$1:$2:$3.$4Z"),
            filename: filename,
            size: obj.size,
            path: obj.key,
            r2Url: `https://pub-${R2_CONFIG.accountId}.r2.dev/${R2_CONFIG.bucket}/${obj.key}`,
            r2Key: obj.key,
          });
        }
      }
    }

    return snapshots
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error listing R2 snapshots:", error);
    return [];
  }
}

/**
 * Extract a snapshot to a specified directory (local or R2)
 */
export async function extractSnapshot(snapshotPath: string, extractPath: string): Promise<void> {
  try {
    await mkdir(extractPath, { recursive: true });

    // Check if this is an R2 snapshot (starts with tenant-snapshots/)
    if (snapshotPath.startsWith("tenant-snapshots/")) {
      // Download from R2 first
      const tempPath = join(extractPath, ".temp_snapshot.tar.gz");
      await downloadFromR2(snapshotPath, tempPath);

      // Extract the downloaded file
      await $`tar -xzf ${tempPath} -C ${extractPath}`;

      // Clean up temp file
      await Bun.file(tempPath).delete();

      console.log(`✅ Extracted R2 snapshot to: ${extractPath}`);
    } else {
      // Extract local snapshot using system tar command
      await $`tar -xzf ${snapshotPath} -C ${extractPath}`;
      console.log(`✅ Extracted local snapshot to: ${extractPath}`);
    }
  } catch (error) {
    console.error("Error extracting snapshot:", error);
    throw error;
  }
}

/**
 * Extract R2 snapshot by key
 */
export async function extractR2Snapshot(r2Key: string, extractPath: string): Promise<void> {
  await extractSnapshot(r2Key, extractPath);
}

/**
 * Get total storage used by all snapshots
 */
export async function getSnapshotStorageSize(): Promise<number> {
  try {
    await mkdir(SNAPSHOTS_DIR, { recursive: true });
    const files = await readdir(SNAPSHOTS_DIR);

    let totalSize = 0;
    for (const file of files) {
      if (file.endsWith(".tar.gz")) {
        const filePath = join(SNAPSHOTS_DIR, file);
        const fileStat = await stat(filePath);
        totalSize += fileStat.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Error calculating storage size:", error);
    return 0;
  }
}

/**
 * List all snapshots with detailed information
 */
export async function listAllSnapshots(): Promise<TenantSnapshot[]> {
  return listRecentSnapshots(1000); // Get all snapshots
}

/**
 * Delete old snapshots (keep only the most recent N per tenant)
 */
export async function cleanupOldSnapshots(keepPerTenant: number = 3): Promise<void> {
  const snapshots = await listAllSnapshots();

  // Group by tenant
  const tenantGroups = new Map<string, TenantSnapshot[]>();
  for (const snapshot of snapshots) {
    if (!tenantGroups.has(snapshot.tenantId)) {
      tenantGroups.set(snapshot.tenantId, []);
    }
    tenantGroups.get(snapshot.tenantId)!.push(snapshot);
  }

  // Delete old snapshots
  for (const [tenantId, tenantSnapshots] of tenantGroups) {
    const sortedSnapshots = tenantSnapshots
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const snapshotsToDelete = sortedSnapshots.slice(keepPerTenant);

    for (const snapshot of snapshotsToDelete) {
      try {
        await Bun.write(snapshot.path, ""); // Clear file
        console.log(`🗑️  Deleted old snapshot: ${snapshot.filename}`);
      } catch (error) {
        console.error(`Error deleting snapshot ${snapshot.filename}:`, error);
      }
    }
  }
}

/**
 * Delete old R2 snapshots (keep only the most recent N per tenant)
 */
export async function cleanupR2Snapshots(keepPerTenant: number = 3): Promise<void> {
  if (!R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
    console.warn("⚠️  R2 credentials not configured");
    return;
  }

  const snapshots = await listR2Snapshots(1000); // Get all R2 snapshots

  // Group by tenant
  const tenantGroups = new Map<string, TenantSnapshot[]>();
  for (const snapshot of snapshots) {
    if (!tenantGroups.has(snapshot.tenantId)) {
      tenantGroups.set(snapshot.tenantId, []);
    }
    tenantGroups.get(snapshot.tenantId)!.push(snapshot);
  }

  // Delete old R2 snapshots
  for (const [tenantId, tenantSnapshots] of tenantGroups) {
    const sortedSnapshots = tenantSnapshots
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const snapshotsToDelete = sortedSnapshots.slice(keepPerTenant);

    for (const snapshot of snapshotsToDelete) {
      try {
        if (snapshot.r2Key) {
          await deleteFromR2(snapshot.r2Key);
          console.log(`🗑️  Deleted old R2 snapshot: ${snapshot.filename}`);
        }
      } catch (error) {
        console.error(`Error deleting R2 snapshot ${snapshot.filename}:`, error);
      }
    }
  }
}

/**
 * Get R2 bucket info using bunx wrangler
 */
export async function getR2BucketInfo(): Promise<{size: number, objectCount: number}> {
  try {
    console.log(`📊 Getting R2 bucket info for: ${R2_CONFIG.bucket}`);

    const result = await $`bunx wrangler r2 bucket info ${R2_CONFIG.bucket}`.text();

    // Parse wrangler output for size and object count
    let size = 0;
    let objectCount = 0;

    const lines = result.split('\n');
    for (const line of lines) {
      if (line.includes('Objects:')) {
        objectCount = parseInt(line.split(':')[1].trim()) || 0;
      } else if (line.includes('Size:')) {
        const sizeStr = line.split(':')[1].trim();
        // Parse size like "1.2 GiB" to bytes
        const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
        if (match) {
          const [, num, unit] = match;
          const value = parseFloat(num);
          switch (unit.toUpperCase()) {
            case 'B': size = value; break;
            case 'KB': size = value * 1024; break;
            case 'MB': size = value * 1024 * 1024; break;
            case 'GB': size = value * 1024 * 1024 * 1024; break;
            case 'TB': size = value * 1024 * 1024 * 1024 * 1024; break;
          }
        }
      }
    }

    console.log(`📊 Bucket info: ${objectCount} objects, ${Math.round(size / 1024 / 1024)} MiB`);
    return { size, objectCount };
  } catch (error) {
    console.error("❌ Wrangler bucket info failed:", error);
    return { size: 0, objectCount: 0 };
  }
}

/**
 * Test R2 connection and permissions (using both Bun.s3 and wrangler)
 */
export async function testR2Connection(): Promise<void> {
  try {
    console.log("🔍 Testing R2 connection...");

    // Test 1: Bun.secrets credential access
    try {
      const credentials = await getR2Credentials();
      console.log("✅ Credentials loaded successfully");
    } catch (error) {
      console.error("❌ Credential test failed:", error);
      return;
    }

    // Test 2: Wrangler availability and bucket info
    try {
      const bucketInfo = await getR2BucketInfo();
      console.log(`✅ Wrangler connection successful`);
      console.log(`📊 Bucket: ${R2_CONFIG.bucket}`);
      console.log(`📁 Objects: ${bucketInfo.objectCount}`);
      console.log(`💾 Size: ${Math.round(bucketInfo.size / 1024 / 1024)} MiB`);
    } catch (error) {
      console.warn("⚠️  Wrangler test failed:", error);
    }

    // Test 3: List objects
    try {
      const objects = await listR2Objects("tenant-snapshots/");
      console.log(`� Found ${objects.length} tenant snapshots in R2`);

      if (objects.length > 0) {
        console.log("\nRecent R2 objects:");
        const recent = objects
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, 5);

        for (const obj of recent) {
          const sizeKB = Math.round(obj.size / 1024);
          console.log(`  • ${obj.key} (${sizeKB} KB, ${new Date(obj.lastModified).toLocaleString()})`);
        }
      }
    } catch (error) {
      console.warn("⚠️  R2 listing test failed:", error);
    }

    console.log("\n🎯 R2 integration test completed");
  } catch (error) {
    console.error("❌ R2 connection test failed:", error);
  }
}

/**
 * Create sample tenant data for demonstration
 */
async function createSampleTenantData(tenantId: string): Promise<void> {
  const tenantPath = join(TENANTS_DIR, tenantId);
  await mkdir(tenantPath, { recursive: true });

  const tenantData: TenantData = {
    id: tenantId,
    name: `Tenant ${tenantId}`,
    config: {
      theme: "dark",
      timezone: "UTC",
      features: ["analytics", "reporting", "api-access"],
    },
    data: {
      users: Math.floor(Math.random() * 1000),
      projects: Math.floor(Math.random() * 100),
      storage: Math.floor(Math.random() * 1000000),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write tenant data files
  await writeFile(
    join(tenantPath, "tenant.json"),
    JSON.stringify(tenantData, null, 2)
  );

  await writeFile(
    join(tenantPath, "config.yaml"),
    `tenant:
  id: ${tenantId}
  name: ${tenantData.name}
  created: ${tenantData.createdAt}

settings:
  theme: ${tenantData.config.theme}
  timezone: ${tenantData.config.timezone}
`
  );

  await writeFile(
    join(tenantPath, "README.md"),
    `# ${tenantData.name}

This directory contains data for tenant **${tenantId}**.

## Configuration
- Theme: ${tenantData.config.theme}
- Timezone: ${tenantData.config.timezone}
- Features: ${tenantData.config.features.join(", ")}

## Statistics
- Users: ${tenantData.data.users}
- Projects: ${tenantData.data.projects}
- Storage Used: ${tenantData.data.storage} bytes

---
*Snapshot created on ${new Date().toISOString()}*
`
  );

  console.log(`📝 Created sample tenant data for: ${tenantId}`);
}

// CLI helper functions for direct execution
export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "create":
        const tenantId = args[1] || "default";
        const uploadToR2Flag = args.includes("--r2") || args.includes("-r");
        await createTenantSnapshot(tenantId, uploadToR2Flag);
        break;

      case "upload":
        const uploadTenantId = args[1];
        if (!uploadTenantId) {
          console.error("Please provide tenant ID");
          process.exit(1);
        }
        const result = await createAndUploadTenantSnapshot(uploadTenantId);
        console.log(`🎯 Created and uploaded: ${result.r2Url}`);
        break;

      case "list":
        const listLimit = parseInt(args[1]) || 5;
        const includeR2 = args.includes("--r2") || args.includes("-r");
        const snapshots = await listRecentSnapshots(listLimit, includeR2);
        console.table(snapshots);
        break;

      case "list-r2":
        const r2Limit = parseInt(args[1]) || 10;
        const r2Snapshots = await listR2Snapshots(r2Limit);
        console.table(r2Snapshots);
        break;

      case "extract":
        const snapshotPath = args[1];
        const extractPath = args[2] || "./extracted";
        if (!snapshotPath) {
          console.error("Please provide snapshot path");
          process.exit(1);
        }
        await extractSnapshot(snapshotPath, extractPath);
        break;

      case "download":
        const r2Key = args[1];
        const downloadPath = args[2] || "./downloaded";
        if (!r2Key) {
          console.error("Please provide R2 key");
          process.exit(1);
        }
        await downloadFromR2(r2Key, downloadPath);
        break;

      case "storage":
        const totalSize = await getSnapshotStorageSize();
        console.log(`Total local storage: ${Math.round(totalSize / 1024 / 1024)} MiB`);

        if (R2_CONFIG.accessKeyId && R2_CONFIG.secretAccessKey) {
          try {
            const r2Objects = await listR2Objects("tenant-snapshots/");
            const r2TotalSize = r2Objects.reduce((sum, obj) => sum + obj.size, 0);
            console.log(`Total R2 storage: ${Math.round(r2TotalSize / 1024 / 1024)} MiB`);
            console.log(`Total combined: ${Math.round((totalSize + r2TotalSize) / 1024 / 1024)} MiB`);
          } catch (error) {
            console.warn("⚠️  Could not fetch R2 storage info:", error);
          }
        }
        break;

      case "cleanup":
        const keepCount = parseInt(args[1]) || 3;
        await cleanupOldSnapshots(keepCount);
        break;

      case "cleanup-r2":
        const r2KeepCount = parseInt(args[1]) || 3;
        await cleanupR2Snapshots(r2KeepCount);
        break;

      case "test-r2":
        await testR2Connection();
        break;

      case "bucket-info":
        const bucketInfo = await getR2BucketInfo();
        console.log(`📊 Bucket: ${R2_CONFIG.bucket}`);
        console.log(`📁 Objects: ${bucketInfo.objectCount}`);
        console.log(`💾 Size: ${Math.round(bucketInfo.size / 1024 / 1024)} MiB`);
        break;

      default:
        console.log(`
Tenant Archiver CLI with Cloudflare R2 Integration
🔐 Uses Bun.secrets for secure credential management
🔧 Uses bunx wrangler for full R2 functionality

Usage:
  bun tenant-archiver.ts create <tenant-id> [--r2]     Create snapshot (optionally upload to R2)
  bun tenant-archiver.ts upload <tenant-id>            Create and upload to R2
  bun tenant-archiver.ts list [limit] [--r2]           List snapshots (include R2 with --r2)
  bun tenant-archiver.ts list-r2 [limit]               List only R2 snapshots
  bun tenant-archiver.ts extract <path> [dest]         Extract snapshot (local or R2)
  bun tenant-archiver.ts download <r2-key> [dest]      Download from R2
  bun tenant-archiver.ts storage                       Show storage usage (local + R2)
  bun tenant-archiver.ts cleanup [keep]                Delete old local snapshots
  bun tenant-archiver.ts cleanup-r2 [keep]             Delete old R2 snapshots
  bun tenant-archiver.ts test-r2                       Test R2 connection (Bun.secrets + wrangler)
  bun tenant-archiver.ts bucket-info                   Show R2 bucket information

Credential Management (Priority Order):
  1. Bun.secrets (most secure)
     • com.factory-wager.r2.access-key-id
     • com.factory-wager.r2.secret-access-key
  2. Environment Variables (fallback)
     • R2_ACCESS_KEY_ID
     • R2_SECRET_ACCESS_KEY

Optional Configuration:
  CF_ACCOUNT_ID       Your Cloudflare account ID
  R2_BUCKET           Bucket name (default: fw-backups)

Examples:
  bun tenant-archiver.ts create tenant-a --r2
  bun tenant-archiver.ts upload tenant-b
  bun tenant-archiver.ts list 10 --r2
  bun tenant-archiver.ts download "tenant-snapshots/tenant-a/filename.tar.gz" ./restored/
  bun tenant-archiver.ts test-r2
  bun tenant-archiver.ts bucket-info

Setup Bun.secrets:
  bunx secrets set com.factory-wager.r2.access-key-id "your-access-key"
  bunx secrets set com.factory-wager.r2.secret-access-key "your-secret-key"
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
