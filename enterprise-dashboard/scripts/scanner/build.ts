/**
 * Bun Enterprise Scanner - Build Script
 *
 * Creates standalone executables with embedded assets.
 * Supports Linux, macOS, and Windows targets.
 *
 * Usage:
 *   bun scripts/scanner/build.ts                    # Build for current platform
 *   bun scripts/scanner/build.ts --target=windows   # Cross-compile
 *   bun scripts/scanner/build.ts --all              # Build all platforms
 */

import { $ } from "bun";

// ============================================================================
// Build Configuration
// ============================================================================

interface BuildTarget {
  name: string;
  target: string;
  outfile: string;
  icon?: string;
  metadata?: {
    title?: string;
    publisher?: string;
    version?: string;
    description?: string;
  };
}

const VERSION = "3.0.0";
const SCANNER_DIR = new URL(".", import.meta.url).pathname;
const OUT_DIR = `${SCANNER_DIR}dist`;

const TARGETS: BuildTarget[] = [
  {
    name: "macOS (arm64)",
    target: "bun-darwin-arm64",
    outfile: "bun-scanner-macos-arm64",
  },
  {
    name: "macOS (x64)",
    target: "bun-darwin-x64",
    outfile: "bun-scanner-macos-x64",
  },
  {
    name: "Linux (x64)",
    target: "bun-linux-x64",
    outfile: "bun-scanner-linux-x64",
  },
  {
    name: "Linux (arm64)",
    target: "bun-linux-arm64",
    outfile: "bun-scanner-linux-arm64",
  },
  {
    name: "Windows (x64)",
    target: "bun-windows-x64",
    outfile: "bun-scanner-windows-x64.exe",
    metadata: {
      title: "Bun Enterprise Scanner",
      publisher: "Enterprise Tools",
      version: VERSION,
      description: "Production-grade code analyzer with embedded rules database",
    },
  },
];

// ============================================================================
// Build Functions
// ============================================================================

async function ensureOutDir(): Promise<void> {
  await $`mkdir -p ${OUT_DIR}`.quiet();
}

async function buildTarget(target: BuildTarget): Promise<boolean> {
  console.log(`\n\x1b[1mBuilding: ${target.name}\x1b[0m`);

  const cmd = [
    "bun",
    "build",
    "--compile",
    "--bytecode",
    "--minify",
    `--target=${target.target}`,
    `--outfile=${OUT_DIR}/${target.outfile}`,
    `${SCANNER_DIR}production.ts`,
  ];

  // Add Windows metadata if applicable
  if (target.metadata && target.target.includes("windows")) {
    if (target.metadata.title) cmd.push(`--windows-title=${target.metadata.title}`);
    if (target.metadata.publisher) cmd.push(`--windows-publisher=${target.metadata.publisher}`);
    if (target.metadata.version) cmd.push(`--windows-version=${target.metadata.version}`);
    if (target.metadata.description) cmd.push(`--windows-description=${target.metadata.description}`);
  }

  try {
    const result = await $`${cmd}`.quiet().nothrow();

    if (result.exitCode === 0) {
      const stats = await Bun.file(`${OUT_DIR}/${target.outfile}`).exists();
      if (stats) {
        const size = (await Bun.file(`${OUT_DIR}/${target.outfile}`).arrayBuffer()).byteLength;
        const sizeMB = (size / 1024 / 1024).toFixed(2);
        console.log(`  \x1b[32mOK\x1b[0m ${target.outfile} (${sizeMB} MB)`);
        return true;
      }
    }

    console.log(`  \x1b[31mFailed\x1b[0m ${result.stderr.toString()}`);
    return false;
  } catch (err) {
    console.log(`  \x1b[31mError\x1b[0m ${err}`);
    return false;
  }
}

async function buildCurrentPlatform(): Promise<void> {
  const platform = process.platform;
  const arch = process.arch;

  let targetName: string;
  if (platform === "darwin") {
    targetName = arch === "arm64" ? "bun-darwin-arm64" : "bun-darwin-x64";
  } else if (platform === "linux") {
    targetName = arch === "arm64" ? "bun-linux-arm64" : "bun-linux-x64";
  } else if (platform === "win32") {
    targetName = "bun-windows-x64";
  } else {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
  }

  const target = TARGETS.find((t) => t.target === targetName);
  if (!target) {
    console.error(`No build target found for: ${targetName}`);
    process.exit(1);
  }

  await ensureOutDir();
  const success = await buildTarget(target);

  if (success) {
    console.log(`\n\x1b[32mBuild complete!\x1b[0m`);
    console.log(`Output: ${OUT_DIR}/${target.outfile}`);
  } else {
    process.exit(1);
  }
}

async function buildSpecificTarget(targetArg: string): Promise<void> {
  const target = TARGETS.find(
    (t) => t.target.includes(targetArg) || t.name.toLowerCase().includes(targetArg.toLowerCase())
  );

  if (!target) {
    console.error(`Unknown target: ${targetArg}`);
    console.log("Available targets:");
    TARGETS.forEach((t) => console.log(`  - ${t.target}`));
    process.exit(1);
  }

  await ensureOutDir();
  const success = await buildTarget(target);

  if (!success) process.exit(1);
}

async function buildAll(): Promise<void> {
  await ensureOutDir();

  console.log("\x1b[1mBuilding all targets...\x1b[0m");

  const results: Array<{ target: string; success: boolean }> = [];

  for (const target of TARGETS) {
    const success = await buildTarget(target);
    results.push({ target: target.name, success });
  }

  console.log("\n\x1b[1mBuild Summary:\x1b[0m");
  console.log(Bun.inspect.table(results.map((r) => ({
    Target: r.target,
    Status: r.success ? "\x1b[32mOK\x1b[0m" : "\x1b[31mFailed\x1b[0m",
  })), undefined, { colors: true }));

  const failed = results.filter((r) => !r.success).length;
  if (failed > 0) {
    console.log(`\n\x1b[33m${failed} build(s) failed\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n\x1b[32mAll builds complete!\x1b[0m`);
  console.log(`Output directory: ${OUT_DIR}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  console.log("\x1b[1mBun Enterprise Scanner - Build Tool\x1b[0m");
  console.log(`\x1b[90mVersion: ${VERSION}\x1b[0m\n`);

  if (args.includes("--all") || args.includes("-a")) {
    await buildAll();
    return;
  }

  const targetArg = args.find((a) => a.startsWith("--target="));
  if (targetArg) {
    const target = targetArg.split("=")[1];
    await buildSpecificTarget(target);
    return;
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage:");
    console.log("  bun build.ts              Build for current platform");
    console.log("  bun build.ts --all        Build all platforms");
    console.log("  bun build.ts --target=X   Build specific target");
    console.log("\nTargets:");
    TARGETS.forEach((t) => console.log(`  ${t.target.padEnd(20)} ${t.name}`));
    return;
  }

  // Default: build for current platform
  await buildCurrentPlatform();
}

main().catch((err) => {
  console.error("\x1b[31mBuild failed:\x1b[0m", err.message);
  process.exit(1);
});
