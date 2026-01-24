/**
 * Lockfile Annotation Bridge
 *
 * Injects scanner findings into bun.lock metadata, creating immutable
 * provenance where every dependency carries its security profile.
 *
 * Features:
 * - Annotate packages with [DOMAIN][SCOPE] tags
 * - Track scan timestamps and trace IDs
 * - Merge with existing lockfile without corruption
 * - Support for bun.lock (text) format
 *
 * Usage:
 *   bun lockfile-bridge.ts annotate           # Annotate current lockfile
 *   bun lockfile-bridge.ts verify             # Verify annotations exist
 *   bun lockfile-bridge.ts query lodash       # Query package annotations
 */

import { Database } from "bun:sqlite";
import { randomUUIDv7 } from "bun";

// ============================================================================
// Types
// ============================================================================

interface PackageAnnotation {
  name: string;
  version: string;
  annotations: string[];
  scannedAt: string;
  traceId: string;
  integrity?: string;
  license?: string;
  securityStatus: "pass" | "warn" | "fail" | "unknown";
}

interface LockfileMetadata {
  version: string;
  annotatedAt: string;
  scannerVersion: string;
  packages: Record<string, PackageAnnotation>;
}

interface ScanResult {
  package: string;
  version: string;
  annotations: string[];
  severity: "error" | "warning" | "info";
}

// ============================================================================
// Constants
// ============================================================================

const SCANNER_DIR = new URL(".", import.meta.url).pathname;
const RULES_DB_PATH = `${SCANNER_DIR}assets/rules.db`;
const METADATA_FILE = ".bun-scanner-metadata.json";

// Known risky patterns in dependencies
const SUPPLY_CHAIN_RULES = [
  { pattern: /postinstall|preinstall|install/i, tag: "[LIFECYCLE][SCRIPT]", severity: "warn" as const },
  { pattern: /eval\s*\(|Function\s*\(/i, tag: "[SECURITY][EVAL]", severity: "error" as const },
  { pattern: /child_process|spawn|exec/i, tag: "[SECURITY][SHELL]", severity: "warn" as const },
  { pattern: /https?:\/\/|fetch\s*\(/i, tag: "[NETWORK][OUTBOUND]", severity: "info" as const },
  { pattern: /fs\.write|writeFile/i, tag: "[FS][WRITE]", severity: "warn" as const },
  { pattern: /process\.env/i, tag: "[ENV][ACCESS]", severity: "info" as const },
];

// License classifications
const LICENSE_STATUS: Record<string, "approved" | "review" | "blocked"> = {
  "MIT": "approved",
  "ISC": "approved",
  "Apache-2.0": "approved",
  "BSD-2-Clause": "approved",
  "BSD-3-Clause": "approved",
  "0BSD": "approved",
  "Unlicense": "approved",
  "CC0-1.0": "approved",
  "WTFPL": "approved",
  "GPL-2.0": "review",
  "GPL-3.0": "review",
  "LGPL-2.1": "review",
  "LGPL-3.0": "review",
  "AGPL-3.0": "blocked",
  "SSPL-1.0": "blocked",
  "BSL-1.0": "review",
  "BUSL-1.1": "blocked",
};

// ============================================================================
// Lockfile Parser
// ============================================================================

interface ParsedLockfile {
  lockfileVersion: number;
  packages: Map<string, {
    name: string;
    version: string;
    resolved?: string;
    integrity?: string;
    dependencies?: Record<string, string>;
  }>;
  raw: string;
}

async function parseBunLock(lockfilePath: string): Promise<ParsedLockfile | null> {
  try {
    const content = await Bun.file(lockfilePath).text();
    const packages = new Map<string, {
      name: string;
      version: string;
      resolved?: string;
      integrity?: string;
      dependencies?: Record<string, string>;
    }>();

    // Parse bun.lock TOML-like format
    // Format: "package@version": { resolved: "...", integrity: "..." }
    const lines = content.split("\n");
    let currentPackage: string | null = null;
    let currentData: Record<string, string> = {};

    for (const line of lines) {
      // Package header: "lodash@4.17.21":
      const pkgMatch = line.match(/^"([^@]+)@([^"]+)":/);
      if (pkgMatch) {
        if (currentPackage) {
          const [name, version] = currentPackage.split("@");
          packages.set(currentPackage, {
            name,
            version,
            ...currentData,
          });
        }
        currentPackage = `${pkgMatch[1]}@${pkgMatch[2]}`;
        currentData = {};
        continue;
      }

      // Property: resolved = "..."
      const propMatch = line.match(/^\s+(\w+)\s*=\s*"([^"]+)"/);
      if (propMatch && currentPackage) {
        currentData[propMatch[1]] = propMatch[2];
      }
    }

    // Don't forget last package
    if (currentPackage) {
      const [name, version] = currentPackage.split("@");
      packages.set(currentPackage, {
        name,
        version,
        ...currentData,
      });
    }

    return {
      lockfileVersion: 1,
      packages,
      raw: content,
    };
  } catch (err) {
    console.error(`[LockfileBridge] Failed to parse lockfile: ${err}`);
    return null;
  }
}

// ============================================================================
// Package Scanner
// ============================================================================

async function scanPackageSource(
  packageName: string,
  packagePath: string
): Promise<ScanResult> {
  const annotations: string[] = [];
  type Severity = "error" | "warning" | "info";
  let maxSeverity: Severity = "info";

  try {
    // Read package.json
    const pkgJsonPath = `${packagePath}/package.json`;
    const pkgJson = await Bun.file(pkgJsonPath).json();

    // Check for lifecycle scripts
    const scripts = pkgJson.scripts || {};
    for (const [scriptName, scriptCmd] of Object.entries(scripts)) {
      if (/^(pre|post)?(install|uninstall)$/.test(scriptName)) {
        annotations.push(`[LIFECYCLE][${scriptName.toUpperCase()}]`);
        if ((maxSeverity as Severity) !== "error") maxSeverity = "warning";
      }
    }

    // Check license
    const license = pkgJson.license || "UNKNOWN";
    const licenseStatus = LICENSE_STATUS[license] || "review";
    annotations.push(`[LICENSE][${licenseStatus.toUpperCase()}]`);
    if (licenseStatus === "blocked") {
      annotations.push(`[LICENSE][BLOCKED][${license}]`);
      maxSeverity = "error";
    }

    // Check for native bindings
    if (pkgJson.gypfile || pkgJson.binary) {
      annotations.push("[NATIVE][BINDING]");
    }

    // Scan main entry point for patterns
    const mainFile = pkgJson.main || "index.js";
    try {
      const mainContent = await Bun.file(`${packagePath}/${mainFile}`).text();

      for (const rule of SUPPLY_CHAIN_RULES) {
        if (rule.pattern.test(mainContent)) {
          annotations.push(rule.tag);
          if (rule.severity === "error") maxSeverity = "error";
          else if (rule.severity === "warn" && maxSeverity !== "error") {
            maxSeverity = "warning";
          }
        }
      }
    } catch {
      // Main file not readable, skip
    }

    // Check for Bun compatibility
    if (pkgJson.engines?.bun || pkgJson.devDependencies?.bun || pkgJson.peerDependencies?.bun) {
      annotations.push("[COMPAT][BUN-NATIVE]");
    }

    // Check for types
    if (pkgJson.types || pkgJson.typings) {
      annotations.push("[TYPES][INCLUDED]");
    }

    // Security audit placeholder
    annotations.push("[SECURITY][AUDIT][PENDING]");

  } catch (err) {
    annotations.push("[SCAN][ERROR]");
    maxSeverity = "warning";
  }

  return {
    package: packageName,
    version: packagePath.split("@").pop() || "unknown",
    annotations,
    severity: maxSeverity,
  };
}

// ============================================================================
// Annotation Manager
// ============================================================================

class AnnotationManager {
  private metadata: LockfileMetadata;
  private metadataPath: string;

  constructor(projectDir: string) {
    this.metadataPath = `${projectDir}/${METADATA_FILE}`;
    this.metadata = {
      version: "1.0.0",
      annotatedAt: new Date().toISOString(),
      scannerVersion: "3.0.0",
      packages: {},
    };
  }

  async load(): Promise<void> {
    try {
      const content = await Bun.file(this.metadataPath).json();
      this.metadata = content as LockfileMetadata;
    } catch {
      // No existing metadata
    }
  }

  async save(): Promise<void> {
    this.metadata.annotatedAt = new Date().toISOString();
    await Bun.write(this.metadataPath, JSON.stringify(this.metadata, null, 2));
  }

  annotate(pkg: string, result: ScanResult, traceId: string): void {
    const [name, version] = pkg.split("@");
    this.metadata.packages[pkg] = {
      name,
      version,
      annotations: result.annotations,
      scannedAt: new Date().toISOString(),
      traceId,
      securityStatus: result.severity === "error" ? "fail" :
                      result.severity === "warning" ? "warn" : "pass",
    };
  }

  getAnnotation(pkg: string): PackageAnnotation | null {
    return this.metadata.packages[pkg] || null;
  }

  getAllAnnotations(): Record<string, PackageAnnotation> {
    return this.metadata.packages;
  }

  hasBlockedPackages(): boolean {
    return Object.values(this.metadata.packages).some(
      (p) => p.securityStatus === "fail" ||
             p.annotations.some((a) => a.includes("[BLOCKED]"))
    );
  }

  getBlockedPackages(): PackageAnnotation[] {
    return Object.values(this.metadata.packages).filter(
      (p) => p.securityStatus === "fail" ||
             p.annotations.some((a) => a.includes("[BLOCKED]"))
    );
  }

  query(pattern: string): PackageAnnotation[] {
    const regex = new RegExp(pattern, "i");
    return Object.values(this.metadata.packages).filter(
      (p) => regex.test(p.name) || p.annotations.some((a) => regex.test(a))
    );
  }
}

// ============================================================================
// CLI Commands
// ============================================================================

async function annotateCommand(projectDir: string): Promise<number> {
  const traceId = randomUUIDv7().slice(0, 8);
  console.log(`\x1b[1m[LockfileBridge] Annotating lockfile...\x1b[0m`);
  console.log(`\x1b[90mTrace ID: ${traceId}\x1b[0m\n`);

  // Parse lockfile
  const lockfilePath = `${projectDir}/bun.lock`;
  const lockfile = await parseBunLock(lockfilePath);

  if (!lockfile) {
    // Try bun.lockb
    const lockbPath = `${projectDir}/bun.lockb`;
    const lockbExists = await Bun.file(lockbPath).exists();
    if (lockbExists) {
      console.log(`\x1b[33m[Warning] Found bun.lockb (binary). Run 'bun install --save-text-lockfile' first.\x1b[0m`);
      return 1;
    }
    console.log(`\x1b[31m[Error] No lockfile found.\x1b[0m`);
    return 1;
  }

  // Load existing annotations
  const manager = new AnnotationManager(projectDir);
  await manager.load();

  // Scan each package
  const nodeModulesDir = `${projectDir}/node_modules`;
  let scanned = 0;
  let errors = 0;
  let warnings = 0;

  for (const [pkgKey, pkgData] of lockfile.packages) {
    const pkgPath = `${nodeModulesDir}/${pkgData.name}`;

    try {
      const result = await scanPackageSource(pkgData.name, pkgPath);
      manager.annotate(pkgKey, result, traceId);
      scanned++;

      if (result.severity === "error") errors++;
      else if (result.severity === "warning") warnings++;

      // Log blocked packages immediately
      if (result.annotations.some((a) => a.includes("[BLOCKED]"))) {
        console.log(`\x1b[31m✗ ${pkgData.name}@${pkgData.version}\x1b[0m`);
        result.annotations.forEach((a) => console.log(`  ${a}`));
      }
    } catch {
      // Skip packages not in node_modules
    }
  }

  // Save annotations
  await manager.save();

  // Summary
  console.log(`\n\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
  console.log(Bun.inspect.table([
    { Metric: "Packages Scanned", Value: scanned },
    { Metric: "Errors", Value: errors },
    { Metric: "Warnings", Value: warnings },
    { Metric: "Metadata File", Value: METADATA_FILE },
  ], undefined, { colors: true }));

  if (manager.hasBlockedPackages()) {
    console.log(`\n\x1b[31m[BLOCKED] ${manager.getBlockedPackages().length} package(s) require attention.\x1b[0m`);
    return 1;
  }

  console.log(`\n\x1b[32m[OK] Lockfile annotated successfully.\x1b[0m`);
  return 0;
}

async function verifyCommand(projectDir: string): Promise<number> {
  const manager = new AnnotationManager(projectDir);
  await manager.load();

  const annotations = manager.getAllAnnotations();
  const count = Object.keys(annotations).length;

  if (count === 0) {
    console.log(`\x1b[33m[Warning] No annotations found. Run 'annotate' first.\x1b[0m`);
    return 1;
  }

  console.log(`\x1b[32m[OK] ${count} package(s) annotated.\x1b[0m`);

  // Check for blocked packages
  const blocked = manager.getBlockedPackages();
  if (blocked.length > 0) {
    console.log(`\n\x1b[31m[BLOCKED] ${blocked.length} package(s):\x1b[0m`);
    for (const pkg of blocked) {
      console.log(`  • ${pkg.name}@${pkg.version}`);
      pkg.annotations.filter((a) => a.includes("[BLOCKED]") || a.includes("[SECURITY]"))
        .forEach((a) => console.log(`    ${a}`));
    }
    return 1;
  }

  return 0;
}

async function queryCommand(projectDir: string, pattern: string): Promise<number> {
  const manager = new AnnotationManager(projectDir);
  await manager.load();

  const results = manager.query(pattern);

  if (results.length === 0) {
    console.log(`\x1b[33mNo packages matching "${pattern}".\x1b[0m`);
    return 0;
  }

  console.log(`\x1b[1mPackages matching "${pattern}":\x1b[0m\n`);

  for (const pkg of results) {
    const statusColor = pkg.securityStatus === "pass" ? "\x1b[32m" :
                       pkg.securityStatus === "warn" ? "\x1b[33m" : "\x1b[31m";
    console.log(`${statusColor}● ${pkg.name}@${pkg.version}\x1b[0m`);
    console.log(`  Scanned: ${pkg.scannedAt}`);
    console.log(`  Trace: ${pkg.traceId}`);
    console.log(`  Annotations:`);
    pkg.annotations.forEach((a) => console.log(`    ${a}`));
    console.log();
  }

  return 0;
}

async function exportCommand(projectDir: string, format: "json" | "sarif"): Promise<number> {
  const manager = new AnnotationManager(projectDir);
  await manager.load();

  const annotations = manager.getAllAnnotations();

  if (format === "json") {
    console.log(JSON.stringify(annotations, null, 2));
  } else if (format === "sarif") {
    // Convert to SARIF format
    const results = Object.values(annotations).flatMap((pkg) =>
      pkg.annotations
        .filter((a) => a.includes("[SECURITY]") || a.includes("[BLOCKED]"))
        .map((annotation) => ({
          ruleId: annotation.replace(/\[|\]/g, "").replace(/\]\[/g, "-").toLowerCase(),
          level: pkg.securityStatus === "fail" ? "error" : "warning",
          message: { text: `${pkg.name}@${pkg.version}: ${annotation}` },
          locations: [{
            physicalLocation: {
              artifactLocation: { uri: `node_modules/${pkg.name}/package.json` },
              region: { startLine: 1, startColumn: 1 },
            },
          }],
        }))
    );

    const sarif = {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [{
        tool: {
          driver: {
            name: "Bun Lockfile Bridge",
            version: "1.0.0",
            informationUri: "https://github.com/example/bun-scanner",
            rules: [],
          },
        },
        results,
      }],
    };

    console.log(JSON.stringify(sarif, null, 2));
  }

  return 0;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const projectDir = process.cwd();

  switch (command) {
    case "annotate":
      process.exit(await annotateCommand(projectDir));
      break;

    case "verify":
      process.exit(await verifyCommand(projectDir));
      break;

    case "query":
      const pattern = args[1] || "";
      if (!pattern) {
        console.log("Usage: bun lockfile-bridge.ts query <pattern>");
        process.exit(1);
      }
      process.exit(await queryCommand(projectDir, pattern));
      break;

    case "export":
      const format = (args[1] as "json" | "sarif") || "json";
      process.exit(await exportCommand(projectDir, format));
      break;

    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
Bun Lockfile Bridge - Supply Chain Annotation

Commands:
  annotate              Scan packages and inject annotations into metadata
  verify                Verify annotations exist and check for blocked packages
  query <pattern>       Query packages by name or annotation pattern
  export [json|sarif]   Export annotations in specified format

Examples:
  bun lockfile-bridge.ts annotate
  bun lockfile-bridge.ts verify
  bun lockfile-bridge.ts query lodash
  bun lockfile-bridge.ts query "[SECURITY]"
  bun lockfile-bridge.ts export sarif > supply-chain.sarif
`);
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(`\x1b[31m[Fatal] ${err.message}\x1b[0m`);
  process.exit(1);
});

// ============================================================================
// Exports for programmatic use
// ============================================================================

export {
  AnnotationManager,
  parseBunLock,
  scanPackageSource,
  LICENSE_STATUS,
  SUPPLY_CHAIN_RULES,
  type PackageAnnotation,
  type LockfileMetadata,
  type ScanResult,
};
