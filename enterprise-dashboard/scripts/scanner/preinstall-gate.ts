/**
 * Pre-Install Security Gate
 *
 * Intercepts `bun add` / `bun install` to scan packages BEFORE installation.
 * Blocks packages with security issues, license violations, or supply chain risks.
 *
 * Features:
 * - Pre-download scanning via npm registry metadata
 * - License policy enforcement
 * - Supply chain risk assessment
 * - Cached results to avoid re-scanning same versions
 * - Integration with lockfile annotations
 *
 * Usage:
 *   bun preinstall-gate.ts check lodash@4.17.21
 *   bun preinstall-gate.ts check lodash --allow-prerelease
 *   bun preinstall-gate.ts policy                         # Show policy
 *   bun preinstall-gate.ts cache-clear                    # Clear scan cache
 *
 * Integration (add to package.json):
 *   "scripts": {
 *     "preinstall": "bun scripts/scanner/preinstall-gate.ts guard"
 *   }
 */

import { randomUUIDv7 } from "bun";
import { LICENSE_STATUS, type ScanResult } from "./lockfile-bridge";

// ============================================================================
// Types
// ============================================================================

interface NpmPackageMetadata {
  name: string;
  version: string;
  description?: string;
  license?: string;
  repository?: { url: string };
  homepage?: string;
  maintainers?: Array<{ name: string; email: string }>;
  dist: {
    tarball: string;
    integrity: string;
    shasum: string;
  };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  deprecated?: string;
}

interface PackageAssessment {
  package: string;
  version: string;
  allowed: boolean;
  reason?: string;
  annotations: string[];
  risks: Array<{
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    description: string;
  }>;
  license: {
    name: string;
    status: "approved" | "review" | "blocked";
  };
  metadata: {
    deprecated: boolean;
    hasLifecycleScripts: boolean;
    maintainerCount: number;
    age?: string;
  };
  traceId: string;
  cachedAt?: string;
}

interface PolicyConfig {
  allowedLicenses: string[];
  blockedLicenses: string[];
  blockDeprecated: boolean;
  blockLifecycleScripts: boolean;
  requireMinMaintainers: number;
  maxDependencyDepth: number;
  trustedScopes: string[];
  blockedPackages: string[];
  allowPrerelease: boolean;
}

interface ScanCache {
  version: string;
  entries: Record<string, PackageAssessment>;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_DIR = ".bunpm/scan-cache";
const CACHE_FILE = `${CACHE_DIR}/packages.json`;
const POLICY_FILE = ".scanner-policy.json";
const NPM_REGISTRY = "https://registry.npmjs.org";

const DEFAULT_POLICY: PolicyConfig = {
  allowedLicenses: ["MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD", "Unlicense", "CC0-1.0"],
  blockedLicenses: ["AGPL-3.0", "SSPL-1.0", "BUSL-1.1"],
  blockDeprecated: true,
  blockLifecycleScripts: false, // Warn only by default
  requireMinMaintainers: 1,
  maxDependencyDepth: 10,
  trustedScopes: ["@types", "@babel", "@eslint"],
  blockedPackages: [],
  allowPrerelease: false,
};

// Suspicious patterns in package metadata
const RISK_PATTERNS = [
  {
    check: (meta: NpmPackageMetadata) => meta.deprecated,
    type: "DEPRECATED",
    severity: "high" as const,
    description: (meta: NpmPackageMetadata) => `Package is deprecated: ${meta.deprecated}`,
  },
  {
    check: (meta: NpmPackageMetadata) => {
      const scripts = meta.scripts || {};
      return !!(scripts.preinstall || scripts.postinstall || scripts.install);
    },
    type: "LIFECYCLE_SCRIPT",
    severity: "medium" as const,
    description: () => "Package has install lifecycle scripts",
  },
  {
    check: (meta: NpmPackageMetadata) => (meta.maintainers?.length || 0) === 0,
    type: "NO_MAINTAINERS",
    severity: "high" as const,
    description: () => "Package has no listed maintainers",
  },
  {
    check: (meta: NpmPackageMetadata) => !meta.repository,
    type: "NO_REPOSITORY",
    severity: "low" as const,
    description: () => "Package has no linked repository",
  },
  {
    check: (meta: NpmPackageMetadata) => {
      const name = meta.name.toLowerCase();
      // Check for typosquatting patterns (simplified)
      const popular = ["lodash", "express", "react", "axios", "moment", "webpack"];
      for (const pkg of popular) {
        if (name !== pkg && levenshteinDistance(name, pkg) <= 2) {
          return true;
        }
      }
      return false;
    },
    type: "TYPOSQUATTING_RISK",
    severity: "critical" as const,
    description: (meta: NpmPackageMetadata) => `Package name "${meta.name}" is similar to a popular package`,
  },
  {
    check: (meta: NpmPackageMetadata) => {
      // Check if published very recently (< 7 days)
      // Note: This would require additional API call to get publish time
      return false;
    },
    type: "NEW_PACKAGE",
    severity: "medium" as const,
    description: () => "Package was published less than 7 days ago",
  },
];

// ============================================================================
// Utilities
// ============================================================================

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ============================================================================
// Registry Client
// ============================================================================

async function fetchPackageMetadata(
  packageName: string,
  version?: string
): Promise<NpmPackageMetadata | null> {
  try {
    const url = version
      ? `${NPM_REGISTRY}/${packageName}/${version}`
      : `${NPM_REGISTRY}/${packageName}/latest`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Registry returned ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`[PreinstallGate] Failed to fetch metadata: ${err}`);
    return null;
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

class PreinstallCache {
  private cache: ScanCache;
  private cacheFile: string;

  constructor(projectDir: string) {
    this.cacheFile = `${projectDir}/${CACHE_FILE}`;
    this.cache = { version: "1", entries: {} };
  }

  async load(): Promise<void> {
    try {
      const content = await Bun.file(this.cacheFile).json();
      this.cache = content as ScanCache;
    } catch {
      // No cache
    }
  }

  async save(): Promise<void> {
    const { mkdir } = await import("fs/promises");
    await mkdir(`${process.cwd()}/${CACHE_DIR}`, { recursive: true });
    await Bun.write(this.cacheFile, JSON.stringify(this.cache, null, 2));
  }

  get(packageSpec: string): PackageAssessment | null {
    return this.cache.entries[packageSpec] || null;
  }

  set(packageSpec: string, assessment: PackageAssessment): void {
    assessment.cachedAt = new Date().toISOString();
    this.cache.entries[packageSpec] = assessment;
  }

  clear(): void {
    this.cache = { version: "1", entries: {} };
  }

  getStats(): { count: number; size: string } {
    const count = Object.keys(this.cache.entries).length;
    const size = JSON.stringify(this.cache).length;
    return {
      count,
      size: size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`,
    };
  }
}

// ============================================================================
// Policy Manager
// ============================================================================

async function loadPolicy(projectDir: string): Promise<PolicyConfig> {
  const policy = { ...DEFAULT_POLICY };

  try {
    const policyPath = `${projectDir}/${POLICY_FILE}`;
    const content = await Bun.file(policyPath).json();
    Object.assign(policy, content);
  } catch {
    // Use defaults
  }

  return policy;
}

// ============================================================================
// Assessment Engine
// ============================================================================

async function assessPackage(
  packageSpec: string,
  policy: PolicyConfig,
  cache: PreinstallCache
): Promise<PackageAssessment> {
  const traceId = randomUUIDv7().slice(0, 8);

  // Parse package spec
  const atIndex = packageSpec.lastIndexOf("@");
  let packageName: string;
  let version: string | undefined;

  if (atIndex > 0) {
    packageName = packageSpec.slice(0, atIndex);
    version = packageSpec.slice(atIndex + 1);
  } else {
    packageName = packageSpec;
  }

  // Check cache first
  const cacheKey = `${packageName}@${version || "latest"}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, cachedAt: cached.cachedAt };
  }

  // Fetch metadata
  const metadata = await fetchPackageMetadata(packageName, version);

  if (!metadata) {
    return {
      package: packageName,
      version: version || "unknown",
      allowed: false,
      reason: "Package not found in registry",
      annotations: ["[REGISTRY][NOT_FOUND]"],
      risks: [{
        type: "NOT_FOUND",
        severity: "critical",
        description: "Package does not exist in npm registry",
      }],
      license: { name: "UNKNOWN", status: "blocked" },
      metadata: {
        deprecated: false,
        hasLifecycleScripts: false,
        maintainerCount: 0,
      },
      traceId,
    };
  }

  // Build assessment
  const annotations: string[] = [];
  const risks: PackageAssessment["risks"] = [];
  let allowed = true;
  let reason: string | undefined;

  // Check if package is explicitly blocked
  if (policy.blockedPackages.includes(packageName)) {
    allowed = false;
    reason = "Package is explicitly blocked by policy";
    annotations.push("[POLICY][BLOCKED]");
    risks.push({
      type: "POLICY_BLOCKED",
      severity: "critical",
      description: "Package is on the blocklist",
    });
  }

  // Check license
  const licenseName = metadata.license || "UNKNOWN";
  const licenseStatus = LICENSE_STATUS[licenseName] || "review";

  if (policy.blockedLicenses.includes(licenseName)) {
    allowed = false;
    reason = `License "${licenseName}" is blocked by policy`;
    annotations.push(`[LICENSE][BLOCKED][${licenseName}]`);
    risks.push({
      type: "LICENSE_BLOCKED",
      severity: "critical",
      description: `License ${licenseName} is not allowed`,
    });
  } else if (!policy.allowedLicenses.includes(licenseName)) {
    annotations.push(`[LICENSE][REVIEW][${licenseName}]`);
    risks.push({
      type: "LICENSE_REVIEW",
      severity: "medium",
      description: `License ${licenseName} requires review`,
    });
  } else {
    annotations.push(`[LICENSE][APPROVED][${licenseName}]`);
  }

  // Check for prerelease
  if (!policy.allowPrerelease && version?.includes("-")) {
    allowed = false;
    reason = "Prerelease versions are not allowed";
    annotations.push("[VERSION][PRERELEASE]");
    risks.push({
      type: "PRERELEASE",
      severity: "medium",
      description: "Prerelease versions require --allow-prerelease flag",
    });
  }

  // Check for deprecated
  if (metadata.deprecated && policy.blockDeprecated) {
    allowed = false;
    reason = `Package is deprecated: ${metadata.deprecated}`;
    annotations.push("[DEPRECATED]");
  }

  // Run risk pattern checks
  for (const pattern of RISK_PATTERNS) {
    if (pattern.check(metadata)) {
      risks.push({
        type: pattern.type,
        severity: pattern.severity,
        description: pattern.description(metadata),
      });
      annotations.push(`[RISK][${pattern.type}]`);

      if (pattern.severity === "critical") {
        allowed = false;
        reason = reason || pattern.description(metadata);
      }
    }
  }

  // Check trusted scopes
  const scope = packageName.startsWith("@") ? packageName.split("/")[0] : null;
  if (scope && policy.trustedScopes.includes(scope)) {
    annotations.push(`[SCOPE][TRUSTED][${scope}]`);
  }

  // Check for lifecycle scripts
  const scripts = metadata.scripts || {};
  const hasLifecycle = !!(scripts.preinstall || scripts.postinstall || scripts.install);
  if (hasLifecycle) {
    annotations.push("[LIFECYCLE][SCRIPT]");
    if (policy.blockLifecycleScripts) {
      allowed = false;
      reason = reason || "Package has lifecycle scripts which are blocked by policy";
    }
  }

  const assessment: PackageAssessment = {
    package: packageName,
    version: metadata.version,
    allowed,
    reason,
    annotations,
    risks,
    license: {
      name: licenseName,
      status: licenseStatus,
    },
    metadata: {
      deprecated: !!metadata.deprecated,
      hasLifecycleScripts: hasLifecycle,
      maintainerCount: metadata.maintainers?.length || 0,
    },
    traceId,
  };

  // Cache the result
  cache.set(cacheKey, assessment);

  return assessment;
}

// ============================================================================
// CLI Commands
// ============================================================================

async function checkCommand(
  packageSpec: string,
  options: { allowPrerelease?: boolean; force?: boolean }
): Promise<number> {
  const projectDir = process.cwd();
  const policy = await loadPolicy(projectDir);

  if (options.allowPrerelease) {
    policy.allowPrerelease = true;
  }

  const cache = new PreinstallCache(projectDir);
  await cache.load();

  console.log(`\x1b[1m[PreinstallGate] Checking ${packageSpec}...\x1b[0m\n`);

  const assessment = await assessPackage(packageSpec, policy, cache);
  await cache.save();

  // Display results
  const statusColor = assessment.allowed ? "\x1b[32m" : "\x1b[31m";
  const statusIcon = assessment.allowed ? "✓" : "✗";

  console.log(`${statusColor}${statusIcon} ${assessment.package}@${assessment.version}\x1b[0m`);
  console.log(`  Trace ID: ${assessment.traceId}`);
  console.log(`  License: ${assessment.license.name} (${assessment.license.status})`);
  console.log(`  Maintainers: ${assessment.metadata.maintainerCount}`);
  console.log(`  Deprecated: ${assessment.metadata.deprecated ? "Yes" : "No"}`);
  console.log(`  Lifecycle Scripts: ${assessment.metadata.hasLifecycleScripts ? "Yes" : "No"}`);

  if (assessment.annotations.length > 0) {
    console.log(`\n  Annotations:`);
    assessment.annotations.forEach((a) => console.log(`    ${a}`));
  }

  if (assessment.risks.length > 0) {
    console.log(`\n  Risks:`);
    for (const risk of assessment.risks) {
      const riskColor = risk.severity === "critical" ? "\x1b[31m" :
                       risk.severity === "high" ? "\x1b[33m" :
                       risk.severity === "medium" ? "\x1b[33m" : "\x1b[90m";
      console.log(`    ${riskColor}[${risk.severity.toUpperCase()}]\x1b[0m ${risk.description}`);
    }
  }

  if (!assessment.allowed) {
    console.log(`\n\x1b[31m[BLOCKED] ${assessment.reason}\x1b[0m`);

    if (options.force) {
      console.log(`\x1b[33m[FORCE] Proceeding despite block (--force flag)\x1b[0m`);
      return 0;
    }

    return 1;
  }

  console.log(`\n\x1b[32m[ALLOWED] Package passed security gate.\x1b[0m`);
  return 0;
}

async function guardCommand(): Promise<number> {
  // This runs as a preinstall hook
  // Check npm_config_argv or similar to get the packages being installed
  const npmArgv = process.env.npm_config_argv;

  if (!npmArgv) {
    // Not running via npm/bun install, skip
    return 0;
  }

  try {
    const argv = JSON.parse(npmArgv);
    const packages = argv.remain || [];

    if (packages.length === 0) {
      return 0;
    }

    const projectDir = process.cwd();
    const policy = await loadPolicy(projectDir);
    const cache = new PreinstallCache(projectDir);
    await cache.load();

    let blocked = false;

    for (const pkg of packages) {
      if (pkg.startsWith("-")) continue; // Skip flags

      const assessment = await assessPackage(pkg, policy, cache);

      if (!assessment.allowed) {
        console.error(`\x1b[31m[BLOCKED] ${pkg}: ${assessment.reason}\x1b[0m`);
        blocked = true;
      }
    }

    await cache.save();

    if (blocked) {
      console.error(`\n\x1b[31mInstallation blocked by security gate.\x1b[0m`);
      console.error(`Use --force-install to bypass (not recommended).`);
      return 1;
    }

    return 0;
  } catch {
    // Fail open on parse errors
    return 0;
  }
}

async function policyCommand(): Promise<number> {
  const projectDir = process.cwd();
  const policy = await loadPolicy(projectDir);

  console.log(`\x1b[1mCurrent Security Policy\x1b[0m\n`);

  console.log(`Allowed Licenses: ${policy.allowedLicenses.join(", ")}`);
  console.log(`Blocked Licenses: ${policy.blockedLicenses.join(", ")}`);
  console.log(`Block Deprecated: ${policy.blockDeprecated}`);
  console.log(`Block Lifecycle Scripts: ${policy.blockLifecycleScripts}`);
  console.log(`Min Maintainers: ${policy.requireMinMaintainers}`);
  console.log(`Trusted Scopes: ${policy.trustedScopes.join(", ")}`);
  console.log(`Blocked Packages: ${policy.blockedPackages.length > 0 ? policy.blockedPackages.join(", ") : "(none)"}`);
  console.log(`Allow Prerelease: ${policy.allowPrerelease}`);

  console.log(`\nTo customize, create ${POLICY_FILE} in your project root.`);

  return 0;
}

async function cacheClearCommand(): Promise<number> {
  const projectDir = process.cwd();
  const cache = new PreinstallCache(projectDir);
  await cache.load();

  const stats = cache.getStats();
  cache.clear();
  await cache.save();

  console.log(`\x1b[32m[OK] Cleared ${stats.count} cached entries (${stats.size}).\x1b[0m`);
  return 0;
}

async function cacheStatsCommand(): Promise<number> {
  const projectDir = process.cwd();
  const cache = new PreinstallCache(projectDir);
  await cache.load();

  const stats = cache.getStats();
  console.log(`Cache: ${stats.count} entries, ${stats.size}`);
  return 0;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "check": {
      const packageSpec = args[1];
      if (!packageSpec) {
        console.log("Usage: bun preinstall-gate.ts check <package[@version]>");
        process.exit(1);
      }
      const options = {
        allowPrerelease: args.includes("--allow-prerelease"),
        force: args.includes("--force"),
      };
      process.exit(await checkCommand(packageSpec, options));
      break;
    }

    case "guard":
      process.exit(await guardCommand());
      break;

    case "policy":
      process.exit(await policyCommand());
      break;

    case "cache-clear":
      process.exit(await cacheClearCommand());
      break;

    case "cache-stats":
      process.exit(await cacheStatsCommand());
      break;

    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
Bun Pre-Install Security Gate

Commands:
  check <package>       Check if a package is allowed by policy
    --allow-prerelease  Allow prerelease versions
    --force             Proceed despite block (not recommended)
  guard                 Run as preinstall hook (auto-detects packages)
  policy                Show current security policy
  cache-clear           Clear the scan cache
  cache-stats           Show cache statistics

Examples:
  bun preinstall-gate.ts check lodash
  bun preinstall-gate.ts check lodash@4.17.21
  bun preinstall-gate.ts check react@19.0.0-beta.1 --allow-prerelease
  bun preinstall-gate.ts policy

Integration (package.json):
  "scripts": {
    "preinstall": "bun scripts/scanner/preinstall-gate.ts guard"
  }
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
  assessPackage,
  fetchPackageMetadata,
  PreinstallCache,
  loadPolicy,
  DEFAULT_POLICY,
  type PackageAssessment,
  type PolicyConfig,
  type NpmPackageMetadata,
};
