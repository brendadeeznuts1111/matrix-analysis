/**
 * Build & Deploy Standalone Scanner
 * Creates a zero-dependency executable with embedded config
 */

import { build } from "bun";
import { file } from "bun";
import * as path from "path";
import * as os from "os";
import { loadEmbeddedFiles, getBuildConstants, writeEmbeddedFiles } from "./scanner-build-config.ts";
import { spawn } from "bun";

interface BuildOptions {
  minify?: boolean;
  compile?: boolean;
  embedConfig?: boolean;
  embedBaseline?: boolean;
  outputDir?: string;
  binaryName?: string;
  installGlobal?: boolean;
}

/**
 * Build standalone scanner executable
 */
export async function buildScanner(options: BuildOptions = {}): Promise<string> {
  const {
    minify = true,
    compile = true,
    embedConfig = true,
    embedBaseline = true,
    outputDir = "./dist/scanner",
    binaryName = "bun-enterprise-scan"
  } = options;

  console.log("🔨 Building enterprise scanner...");

  // Load embedded files
  const embeddedFiles = await loadEmbeddedFiles();
  const embeddedFilesMap: Record<string, string> = {};
  
  for (const file of embeddedFiles) {
    if ((file.path === ".scannerrc" && embedConfig) || 
        (file.path === "scanner-baseline.json" && embedBaseline)) {
      embeddedFilesMap[file.path] = file.content;
    }
  }

  // Build configuration
  const buildResult = await build({
    entrypoints: ["enterprise-scanner.ts"],
    outdir: outputDir,
    target: "bun",
    format: "esm",
    minify,
    sourcemap: "external", // Generate sourcemap separately
    metafile: true, // For CI bundle analysis
    compile, // Create standalone executable
    compileExecArgv: compile ? [
      "--enable-crc32-hw=true"  // Enable CRC32 hardware acceleration
    ] : undefined,
    external: [
      // Don't bundle these (they're Bun built-ins)
      "bun",
      "node:fs",
      "node:path",
      "node:os",
      "node:crypto"
    ],
    define: {
      // Embed build metadata
      ...getBuildConstants(),
      "process.env.SCANNER_EMBEDDED_CONFIG": embedConfig ? "true" : "false",
      "process.env.SCANNER_CRC32_HW": "true"  // Enable CRC32 hardware acceleration
    },
    // Embed files as virtual modules
    ...(Object.keys(embeddedFiles).length > 0 && {
      // Note: Bun's build API doesn't directly support embedding files
      // We'll handle this via define or post-build step
    })
  });

  // Write embedded files to output directory
  const filesToEmbed = embeddedFiles.filter(f => 
    (f.path === ".scannerrc" && embedConfig) ||
    (f.path === "scanner-baseline.json" && embedBaseline)
  );
  await writeEmbeddedFiles(filesToEmbed, outputDir);
  for (const file of filesToEmbed) {
    console.log(`📦 Embedded: ${file.path}`);
  }

  // Write build metadata
  const metadataPath = path.join(outputDir, "build-metadata.json");
  await Bun.write(
    metadataPath,
    JSON.stringify({
      version: process.env.SCANNER_VERSION || "1.0.0",
      buildDate: new Date().toISOString(),
      platform: os.platform(),
      arch: os.arch(),
      embeddedFiles: Object.keys(embeddedFiles),
      bundleSize: buildResult.outputs?.[0]?.size || 0
    }, null, 2)
  );

  // Generate bundle analysis if metafile exists
  if (buildResult.metafile) {
    const analysisPath = path.join(outputDir, "bundle-analysis.json");
    await Bun.write(analysisPath, JSON.stringify(buildResult.metafile, null, 2));
    console.log(`📊 Bundle analysis: ${analysisPath}`);
  }

  const binaryPath = path.join(outputDir, "enterprise-scanner");
  console.log(`✅ Build complete: ${binaryPath}`);

  return binaryPath;
}

/**
 * Install scanner globally
 */
export async function installGlobal(
  binaryPath: string,
  binaryName: string = "bun-enterprise-scan"
): Promise<void> {
  const platform = os.platform();
  let installPath: string;

  if (platform === "win32") {
    // Windows: Install to AppData\Local\bin or similar
    const localBin = path.join(os.homedir(), "AppData", "Local", "bin");
    installPath = path.join(localBin, `${binaryName}.exe`);
    
    // Create directory if it doesn't exist
    await Bun.$`mkdir -p ${localBin}`.quiet();
    
    // Copy binary
    await Bun.$`cp ${binaryPath} ${installPath}`.quiet();
    
    console.log(`✅ Installed to: ${installPath}`);
    console.log(`   Add ${localBin} to your PATH`);
  } else {
    // Unix-like: Install to /usr/local/bin
    installPath = `/usr/local/bin/${binaryName}`;
    
    // Make executable
    await Bun.$`chmod +x ${binaryPath}`.quiet();
    
    // Copy to global bin (requires sudo)
    try {
      await Bun.$`sudo cp ${binaryPath} ${installPath}`.quiet();
      console.log(`✅ Installed globally: ${installPath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to install globally (requires sudo)`);
      console.log(`   Manual install: sudo cp ${binaryPath} ${installPath}`);
    }
  }

  // Verify installation
  try {
    const { stdout } = await Bun.$`which ${binaryName}`.quiet();
    if (stdout.toString().trim()) {
      console.log(`✅ Verified: ${binaryName} is in PATH`);
    }
  } catch {
    console.warn(`⚠️  ${binaryName} not found in PATH`);
  }
}

/**
 * Create platform-specific packages
 */
export async function createPackages(
  binaryPath: string,
  outputDir: string = "./dist/packages"
): Promise<void> {
  const platform = os.platform();
  const arch = os.arch();

  console.log(`📦 Creating packages for ${platform}-${arch}...`);

  // Create package directory
  const packageDir = path.join(outputDir, `${platform}-${arch}`);
  await Bun.$`mkdir -p ${packageDir}`.quiet();

  // Copy binary
  const packageBinary = path.join(packageDir, "bun-enterprise-scan");
  await Bun.$`cp ${binaryPath} ${packageBinary}`.quiet();
  await Bun.$`chmod +x ${packageBinary}`.quiet();

  // Create README
  const readme = `# Enterprise Scanner - ${platform}-${arch}

## Installation

### Unix/Linux/macOS
\`\`\`bash
sudo cp bun-enterprise-scan /usr/local/bin/
\`\`\`

### Windows
Copy \`bun-enterprise-scan.exe\` to a directory in your PATH.

## Usage

\`\`\`bash
bun-enterprise-scan .
bun-enterprise-scan --mode=audit
bun-enterprise-scan --generate-baseline
\`\`\`

## Build Info

- Platform: ${platform}
- Architecture: ${arch}
- Build Date: ${new Date().toISOString()}
`;

  await Bun.write(path.join(packageDir, "README.md"), readme);

  // Create archive
  const archiveName = `bun-enterprise-scan-${platform}-${arch}.tar.gz`;
  const archivePath = path.join(outputDir, archiveName);

  if (platform !== "win32") {
    await Bun.$`tar -czf ${archivePath} -C ${packageDir} .`.quiet();
    console.log(`✅ Created archive: ${archivePath}`);
  } else {
    // Windows: Create zip instead
    const zipName = `bun-enterprise-scan-${platform}-${arch}.zip`;
    const zipPath = path.join(outputDir, zipName);
    // Note: Would need zip utility or use Node.js zlib
    console.log(`📦 Package ready: ${packageDir}`);
  }
}

/**
 * Main deployment function
 */
export async function deploy(options: BuildOptions = {}): Promise<void> {
  const {
    outputDir = "./dist/scanner",
    binaryName = "bun-enterprise-scan",
    installGlobal: shouldInstall = false
  } = options;

  console.log("🚀 Deploying Enterprise Scanner\n");

  // Build
  const binaryPath = await buildScanner({
    ...options,
    outputDir,
    binaryName
  });

  // Install globally if requested
  if (shouldInstall) {
    await installGlobal(binaryPath, binaryName);
  }

  // Create packages
  await createPackages(binaryPath, "./dist/packages");

  console.log("\n✨ Deployment complete!");
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Test: ${binaryPath} --help`);
  if (!shouldInstall) {
    console.log(`   2. Install: bun deploy-scanner.ts --install`);
  }
  console.log(`   3. Distribute: ./dist/packages/`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  
  const options: BuildOptions = {
    minify: !args.includes("--no-minify"),
    compile: !args.includes("--no-compile"),
    embedConfig: !args.includes("--no-embed-config"),
    embedBaseline: !args.includes("--no-embed-baseline"),
    installGlobal: args.includes("--install") || args.includes("-i"),
    outputDir: args.includes("--outdir") 
      ? args[args.indexOf("--outdir") + 1]
      : "./dist/scanner",
    binaryName: args.includes("--name")
      ? args[args.indexOf("--name") + 1]
      : "bun-enterprise-scan"
  };

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🔨 Enterprise Scanner Deployment

Usage:
  bun deploy-scanner.ts [options]

Options:
  --install, -i              Install globally after build
  --no-minify                Disable minification
  --no-compile               Don't create standalone executable
  --no-embed-config          Don't embed .scannerrc
  --no-embed-baseline        Don't embed baseline
  --outdir <path>            Output directory (default: ./dist/scanner)
  --name <name>              Binary name (default: bun-enterprise-scan)
  --help, -h                 Show this help

Examples:
  bun deploy-scanner.ts
  bun deploy-scanner.ts --install
  bun deploy-scanner.ts --outdir ./build --name scanner
    `);
    process.exit(0);
  }

  await deploy(options).catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
}
