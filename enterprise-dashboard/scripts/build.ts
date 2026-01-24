#!/usr/bin/env bun
/**
 * Enterprise Dashboard Build Script
 *
 * Creates tier-specific bundles using Bun's compile-time feature flags.
 * Dead code for disabled features is physically removed from the bundle.
 *
 * Usage:
 *   bun scripts/build.ts           # Build all tiers
 *   bun scripts/build.ts free      # Build free tier only
 *   bun scripts/build.ts pro       # Build pro tier only
 *   bun scripts/build.ts enterprise # Build enterprise tier only
 */

import { $ } from "bun";

// ============================================================================
// Configuration
// ============================================================================

interface TierConfig {
  name: string;
  features: string[];
  outfile: string;
  description: string;
}

const TIERS: Record<string, TierConfig> = {
  free: {
    name: "Free",
    features: ["TIER_FREE"],
    outfile: "dist/dashboard-free.js",
    description: "Basic dashboard features",
  },
  pro: {
    name: "Pro",
    features: ["TIER_PRO"],
    outfile: "dist/dashboard-pro.js",
    description: "Pro features + Security Audit",
  },
  enterprise: {
    name: "Enterprise",
    features: ["TIER_ENTERPRISE", "DEBUG_LOGGING"],
    outfile: "dist/dashboard-enterprise.js",
    description: "Full features + Debug logging",
  },
};

const ENTRY_POINT = "src/dashboard/index.ts";

// ============================================================================
// Build Functions
// ============================================================================

async function buildTier(tier: TierConfig): Promise<{ success: boolean; size: number }> {
  const startTime = performance.now();

  // Build args array to avoid shell interpolation issues
  const args = [
    "build",
    ENTRY_POINT,
    ...tier.features.map((f) => `--feature=${f}`),
    "--target=bun",
    "--minify",
    `--outfile=${tier.outfile}`,
  ];

  try {
    const proc = Bun.spawn(["bun", ...args], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(stderr);
    }

    const file = Bun.file(tier.outfile);
    const size = file.size;
    const duration = (performance.now() - startTime).toFixed(0);

    console.log(`  ✓ ${tier.name.padEnd(12)} ${formatBytes(size).padStart(10)}  (${duration}ms)`);

    return { success: true, size };
  } catch (error) {
    console.log(`  ✗ ${tier.name.padEnd(12)} Build failed`);
    return { success: false, size: 0 };
  }
}

async function buildAll(): Promise<void> {
  console.log("\n🏗️  Building Enterprise Dashboard\n");
  console.log("─".repeat(50));

  // Ensure dist directory exists
  await $`mkdir -p dist`.quiet();

  const results: Array<{ tier: string; success: boolean; size: number }> = [];

  for (const [key, tier] of Object.entries(TIERS)) {
    const result = await buildTier(tier);
    results.push({ tier: key, ...result });
  }

  console.log("─".repeat(50));

  // Summary
  const successful = results.filter((r) => r.success);
  const totalSize = successful.reduce((sum, r) => sum + r.size, 0);

  console.log(`\n📊 Summary: ${successful.length}/${results.length} builds successful`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);

  // Size comparison
  if (successful.length > 1) {
    const sorted = [...successful].sort((a, b) => a.size - b.size);
    const smallest = sorted[0];
    const largest = sorted[sorted.length - 1];
    const savings = ((1 - smallest.size / largest.size) * 100).toFixed(0);

    console.log(`   Size reduction: ${savings}% (${smallest.tier} vs ${largest.tier})`);
  }

  console.log("");
}

async function buildSingle(tierName: string): Promise<void> {
  const tier = TIERS[tierName.toLowerCase()];

  if (!tier) {
    console.error(`Unknown tier: ${tierName}`);
    console.log(`Available tiers: ${Object.keys(TIERS).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🏗️  Building ${tier.name} Tier\n`);
  console.log(`   ${tier.description}`);
  console.log(`   Features: ${tier.features.join(", ")}`);
  console.log("");

  await $`mkdir -p dist`.quiet();
  await buildTier(tier);
  console.log("");
}

// ============================================================================
// Utilities
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function showHelp(): void {
  console.log(`
Enterprise Dashboard Build Script

Usage:
  bun scripts/build.ts [tier]

Tiers:
${Object.entries(TIERS)
  .map(([key, tier]) => `  ${key.padEnd(12)} ${tier.description}`)
  .join("\n")}

Examples:
  bun scripts/build.ts           # Build all tiers
  bun scripts/build.ts free      # Build free tier only
  bun scripts/build.ts pro       # Build pro tier only

Feature Flags:
  Each tier includes different compile-time features.
  Disabled features are physically removed from the bundle.
`);
}

// ============================================================================
// Main
// ============================================================================

const args = Bun.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  showHelp();
} else if (args.length === 0) {
  await buildAll();
} else {
  await buildSingle(args[0]);
}
