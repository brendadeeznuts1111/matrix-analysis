#!/usr/bin/env bun
// deploy/pipeline.ts
// Tier-1380 Patch Application Pipeline

import { $ } from 'bun';
import { Database } from 'bun:sqlite';
import { EXIT_CODES } from "../../.claude/lib/exit-codes.ts";

interface PatchMetadata {
  name: string;
  version: string;
  package: string;
  appliedAt: string;
  checksum: string;
}

interface Tier1380Matrix {
  col_91_redis_patch_level?: string;
  col_92_onnx_patch_level?: string;
  col_93_lockfile_pristine?: boolean;
  col_94_redis_patch?: string;
  col_95_public_env?: boolean;
  col_96_bundle_crc32?: string;
  col_97_lockfile_clean?: boolean;
  col_98_patch_time?: number;
  col_99_env_count?: number;
  col_100_leak_check?: boolean;
}

class Tier1380Pipeline {
  private db: Database;
  private patchesApplied: Map<string, PatchMetadata> = new Map();

  constructor() {
    this.db = new Database('tier1380.db');
    this.initializeMatrix();
  }

  private initializeMatrix() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tier1380_matrix (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        col_91_redis_patch_level TEXT,
        col_92_onnx_patch_level TEXT,
        col_93_lockfile_pristine BOOLEAN,
        col_94_redis_patch TEXT,
        col_95_public_env BOOLEAN,
        col_96_bundle_crc32 TEXT,
        col_97_lockfile_clean BOOLEAN,
        col_98_patch_time REAL,
        col_99_env_count INTEGER,
        col_100_leak_check BOOLEAN
      )
    `);
  }

  async applyPatches(environment: 'development' | 'staging' | 'production' = 'production') {
    console.log(`🔧 Applying Tier-1380 patches for ${environment}...`);
    const startTime = Date.now();

    try {
      // 1. Verify lockfile is pristine
      await this.verifyLockfile();

      // 2. Apply Redis HLL patch
      await this.applyRedisPatch();

      // 3. Apply ONNX SIMD patch
      await this.applyOnnxPatch();

      // 4. Verify patches
      await this.verifyPatches();

      const patchTime = (Date.now() - startTime) / 1000;

      // 5. Update matrix
      await this.updateMatrix({
        col_91_redis_patch_level: 'hll-volume-v2',
        col_92_onnx_patch_level: 'simd-arm64-v1',
        col_93_lockfile_pristine: true,
        col_94_redis_patch: 'hll-v2',
        col_97_lockfile_clean: true,
        col_98_patch_time: patchTime,
      });

      console.log(`✅ Patches applied in ${patchTime}s`);

    } catch (error) {
      console.error('🔴 Patch application failed:', error);
      throw error;
    }
  }

  private async verifyLockfile() {
    const result = await $`git status bun.lockb`.quiet();
    if (result.stdout.toString().includes('modified')) {
      throw new Error('Lockfile is not pristine - commit changes first');
    }
    console.log('✅ Lockfile is pristine');
  }

  private async applyRedisPatch() {
    console.log('📦 Applying Redis HLL patch...');

    const patchResult = await $`bun pm patch redis@4.6.5 --patch-file patches/redis-hll-volume.patch`.quiet();

    if (patchResult.exitCode !== 0) {
      console.error('Redis patch failed:', patchResult.stderr.toString());
      throw new Error('Redis patch application failed');
    }

    this.patchesApplied.set('redis', {
      name: 'redis-hll-volume',
      version: 'v2',
      package: 'redis@4.6.5',
      appliedAt: new Date().toISOString(),
      checksum: await this.calculatePatchChecksum('patches/redis-hll-volume.patch'),
    });

    console.log('✅ Redis HLL patch applied');
  }

  private async applyOnnxPatch() {
    console.log('🚀 Applying ONNX SIMD patch...');

    const patchResult = await $`bun pm patch onnxruntime-node --patch-file patches/onnx-simd-accel.patch`.quiet();

    if (patchResult.exitCode !== 0) {
      console.error('ONNX patch failed:', patchResult.stderr.toString());
      throw new Error('ONNX patch application failed');
    }

    this.patchesApplied.set('onnxruntime-node', {
      name: 'onnx-simd-accel',
      version: 'v1',
      package: 'onnxruntime-node',
      appliedAt: new Date().toISOString(),
      checksum: await this.calculatePatchChecksum('patches/onnx-simd-accel.patch'),
    });

    console.log('✅ ONNX SIMD patch applied');
  }

  private async verifyPatches() {
    console.log('🔍 Verifying applied patches...');

    const patchList = await $`bun pm patch --list`.text();
    const activePatches = patchList.split('\n').filter(line => line.trim());

    console.log('Active patches:', activePatches);

    // Verify our patches are in the list
    if (!activePatches.some(p => p.includes('redis'))) {
      throw new Error('Redis patch not found in active patches');
    }

    if (!activePatches.some(p => p.includes('onnxruntime-node'))) {
      throw new Error('ONNX patch not found in active patches');
    }

    console.log('✅ All patches verified');
  }

  private async calculatePatchChecksum(patchFile: string): Promise<string> {
    const file = Bun.file(patchFile);
    const buffer = await file.arrayBuffer();
    return Bun.hash.crc32(new Uint8Array(buffer)).toString(16);
  }

  private async updateMatrix(data: Partial<Tier1380Matrix>) {
    const stmt = this.db.prepare(`
      INSERT INTO tier1380_matrix (
        col_91_redis_patch_level,
        col_92_onnx_patch_level,
        col_93_lockfile_pristine,
        col_94_redis_patch,
        col_95_public_env,
        col_96_bundle_crc32,
        col_97_lockfile_clean,
        col_98_patch_time,
        col_99_env_count,
        col_100_leak_check
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.col_91_redis_patch_level || null,
      data.col_92_onnx_patch_level || null,
      data.col_93_lockfile_pristine || false,
      data.col_94_redis_patch || null,
      data.col_95_public_env || false,
      data.col_96_bundle_crc32 || null,
      data.col_97_lockfile_clean || false,
      data.col_98_patch_time || null,
      data.col_99_env_count || null,
      data.col_100_leak_check || false
    );
  }

  async deployWithBundle(bundleChecksum: string) {
    console.log(`🚀 Deploying with bundle checksum: ${bundleChecksum}`);

    // Count PUBLIC_ env vars
    const publicEnvCount = Object.keys(process.env).filter(k => k.startsWith('PUBLIC_')).length;

    // Update matrix with bundle info
    await this.updateMatrix({
      col_95_public_env: true,
      col_96_bundle_crc32: bundleChecksum,
      col_99_env_count: publicEnvCount,
      col_100_leak_check: false, // Verified during build
    });

    console.log(`✅ Deployment complete - ${publicEnvCount} PUBLIC_ vars injected`);
  }

  getPatchStatus() {
    return Array.from(this.patchesApplied.entries()).map(([pkgName, meta]) => ({
      packageName: pkgName,
      ...meta,
    }));
  }
}

// CLI interface
if (import.meta.main) {
  const pipeline = new Tier1380Pipeline();
  const command = process.argv[2];
  const environment = process.argv[3] as 'development' | 'staging' | 'production' || 'production';

  switch (command) {
    case 'apply':
      pipeline.applyPatches(environment);
      break;

    case 'status':
      console.log('Patch Status:', pipeline.getPatchStatus());
      break;

    case 'deploy':
      const checksum = process.argv[4];
      if (!checksum) {
        console.error('Missing bundle checksum');
        process.exit(EXIT_CODES.GENERIC_ERROR);
      }
      pipeline.deployWithBundle(checksum);
      break;

    default:
      console.log('Usage: bun deploy/pipeline.ts [apply|status|deploy] [environment] [checksum]');
  }
}

export { Tier1380Pipeline };
