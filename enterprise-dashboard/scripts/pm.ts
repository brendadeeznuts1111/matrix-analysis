#!/usr/bin/env bun
// scripts/pm.ts
// Bun Package Manager CLI with Workspace Support + Security Gate
// [BUN][CLI][API][ASYNC][#REF:enterprise-pm][BUN-NATIVE]

import { parseArgs } from "util";
import { spawn } from "bun";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PmOptions {
  filter?: string;
  filterExclude?: string;
  workspaces?: boolean;
  strategy?: string;
  minAge?: string;
  platform?: string;
  dev?: boolean;
  optional?: boolean;
  global?: boolean;
  production?: boolean;
  frozenLockfile?: boolean;
  dryRun?: boolean;
  trust?: boolean;
  verbose?: boolean;
  silent?: boolean;
  help?: boolean;
  // Security Gate options
  force?: boolean;
  escalationToken?: string;
  noSecurityGate?: boolean;
  auditLog?: string;
  // License Policy options
  licensePolicy?: string;
  licenses?: boolean;
  sbom?: boolean;
  sbomFormat?: string;
}

interface SecurityRisk {
  package: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  tag: string;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  packages: string[];
  user: string;
  workspace?: string;
  risks: SecurityRisk[];
  escalationToken?: string;
  forced: boolean;
  tag: string;
}

interface LicensePolicy {
  whitelist: string[];
  blacklist: string[];
  requireApproval: string[];
  customMappings?: Record<string, string>;
}

interface PackageLicense {
  name: string;
  version: string;
  license: string;
  spdxId: string;
  repository?: string;
  status: "allowed" | "blocked" | "requires-approval" | "unknown";
  tag: string;
}

interface SBOMEntry {
  name: string;
  version: string;
  spdxId: string;
  repository?: string;
  supplier?: string;
  downloadLocation?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LICENSE POLICY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

// Default enterprise license policy
const DEFAULT_LICENSE_POLICY: LicensePolicy = {
  // Permissive licenses - always allowed
  whitelist: [
    "MIT",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "0BSD",
    "Unlicense",
    "CC0-1.0",
    "WTFPL",
    "BlueOak-1.0.0",
  ],
  // Copyleft licenses - blocked by default
  blacklist: [
    "GPL-2.0",
    "GPL-2.0-only",
    "GPL-2.0-or-later",
    "GPL-3.0",
    "GPL-3.0-only",
    "GPL-3.0-or-later",
    "AGPL-3.0",
    "AGPL-3.0-only",
    "AGPL-3.0-or-later",
    "SSPL-1.0",
    "BUSL-1.1",
  ],
  // Weak copyleft - requires legal review
  requireApproval: [
    "LGPL-2.0",
    "LGPL-2.1",
    "LGPL-3.0",
    "MPL-2.0",
    "EPL-1.0",
    "EPL-2.0",
    "CDDL-1.0",
    "CC-BY-SA-4.0",
  ],
  // Normalize common license variations
  customMappings: {
    "Apache 2.0": "Apache-2.0",
    "Apache License 2.0": "Apache-2.0",
    "Apache-2": "Apache-2.0",
    "BSD": "BSD-3-Clause",
    "BSD-2": "BSD-2-Clause",
    "BSD-3": "BSD-3-Clause",
    "ISC License": "ISC",
    "The MIT License": "MIT",
    "MIT License": "MIT",
    "Public Domain": "Unlicense",
  },
};

// Load custom license policy from file
async function loadLicensePolicy(policyPath?: string): Promise<LicensePolicy> {
  if (!policyPath) return DEFAULT_LICENSE_POLICY;

  const file = Bun.file(policyPath);
  if (!(await file.exists())) {
    console.error(`⚠️  License policy file not found: ${policyPath}`);
    console.error("   Using default policy");
    return DEFAULT_LICENSE_POLICY;
  }

  try {
    const custom = await file.json() as Partial<LicensePolicy>;
    return {
      whitelist: custom.whitelist || DEFAULT_LICENSE_POLICY.whitelist,
      blacklist: custom.blacklist || DEFAULT_LICENSE_POLICY.blacklist,
      requireApproval: custom.requireApproval || DEFAULT_LICENSE_POLICY.requireApproval,
      customMappings: { ...DEFAULT_LICENSE_POLICY.customMappings, ...custom.customMappings },
    };
  } catch {
    console.error(`⚠️  Failed to parse license policy: ${policyPath}`);
    return DEFAULT_LICENSE_POLICY;
  }
}

// Normalize license string to SPDX identifier
function normalizeLicense(license: string, policy: LicensePolicy): string {
  if (!license) return "UNKNOWN";
  const trimmed = license.trim();
  return policy.customMappings?.[trimmed] || trimmed;
}

// Fetch license info from npm registry
async function fetchPackageLicense(pkg: string): Promise<{ license: string; repository?: string } | null> {
  // Strip version specifier
  const pkgName = pkg.replace(/@[\d^~<>=.*]+$/, "").replace(/^@/, "").replace(/\//, "%2F");
  const actualName = pkg.replace(/@[\d^~<>=.*]+$/, "");

  try {
    const res = await fetch(`https://registry.npmjs.org/${actualName}/latest`, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) return null;

    const data = await res.json() as { license?: string; repository?: { url?: string } };
    return {
      license: data.license || "UNKNOWN",
      repository: data.repository?.url?.replace(/^git\+/, "").replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

// Check license against policy
function checkLicense(license: string, policy: LicensePolicy): PackageLicense["status"] {
  const spdxId = normalizeLicense(license, policy);

  if (policy.whitelist.includes(spdxId)) return "allowed";
  if (policy.blacklist.includes(spdxId)) return "blocked";
  if (policy.requireApproval.includes(spdxId)) return "requires-approval";

  // Check for compound licenses (e.g., "MIT OR Apache-2.0")
  if (spdxId.includes(" OR ")) {
    const parts = spdxId.split(" OR ").map(p => p.trim());
    if (parts.some(p => policy.whitelist.includes(p))) return "allowed";
  }

  return "unknown";
}

// Format license check results
function formatLicenseResults(results: PackageLicense[]): string {
  const blocked = results.filter(r => r.status === "blocked");
  const needsApproval = results.filter(r => r.status === "requires-approval");
  const unknown = results.filter(r => r.status === "unknown");
  const allowed = results.filter(r => r.status === "allowed");

  const lines: string[] = [];

  if (blocked.length > 0) {
    lines.push("\n🚫 BLOCKED LICENSES:");
    blocked.forEach(r => lines.push(`   ✗ ${r.name}: ${r.spdxId} ${r.tag}`));
  }

  if (needsApproval.length > 0) {
    lines.push("\n⚖️  REQUIRES LEGAL APPROVAL:");
    needsApproval.forEach(r => lines.push(`   ⚠ ${r.name}: ${r.spdxId} ${r.tag}`));
  }

  if (unknown.length > 0) {
    lines.push("\n❓ UNKNOWN LICENSES:");
    unknown.forEach(r => lines.push(`   ? ${r.name}: ${r.spdxId || "NO LICENSE"} ${r.tag}`));
  }

  if (allowed.length > 0 && (blocked.length > 0 || needsApproval.length > 0 || unknown.length > 0)) {
    lines.push("\n✅ ALLOWED:");
    allowed.forEach(r => lines.push(`   ✓ ${r.name}: ${r.spdxId}`));
  }

  return lines.join("\n");
}

// Check multiple packages against license policy
async function checkPackageLicenses(packages: string[], policy: LicensePolicy): Promise<PackageLicense[]> {
  const results: PackageLicense[] = [];

  for (const pkg of packages) {
    const info = await fetchPackageLicense(pkg);
    const spdxId = info ? normalizeLicense(info.license, policy) : "UNKNOWN";
    const status = checkLicense(spdxId, policy);

    let tag: string;
    switch (status) {
      case "blocked": tag = "[LEGAL][RESTRICTED][BLOCKED]"; break;
      case "requires-approval": tag = "[LEGAL][RESTRICTED][REVIEW]"; break;
      case "unknown": tag = "[LEGAL][UNKNOWN]"; break;
      default: tag = "[LEGAL][ALLOWED]";
    }

    results.push({
      name: pkg.replace(/@[\d^~<>=.*]+$/, ""),
      version: pkg.match(/@([\d^~<>=.*]+)$/)?.[1] || "latest",
      license: info?.license || "UNKNOWN",
      spdxId,
      repository: info?.repository,
      status,
      tag,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLY CHAIN RISK PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const SUPPLY_CHAIN_RISKS: Array<{
  pattern: RegExp;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  tag: string;
}> = [
  // Critical: Known compromised packages
  { pattern: /^event-stream$/, category: "COMPROMISED", severity: "critical", message: "Known compromised package (CVE-2018-16489)", tag: "[SECURITY][COMPROMISED][CRITICAL]" },
  { pattern: /^flatmap-stream$/, category: "COMPROMISED", severity: "critical", message: "Malicious package injected into event-stream", tag: "[SECURITY][COMPROMISED][CRITICAL]" },
  { pattern: /^ua-parser-js@0\.7\.(29|30|31)/, category: "COMPROMISED", severity: "critical", message: "Supply chain attack version", tag: "[SECURITY][COMPROMISED][CRITICAL]" },
  { pattern: /^node-ipc@(10\.1\.1|10\.1\.2|10\.1\.3)/, category: "COMPROMISED", severity: "critical", message: "Protestware with destructive payload", tag: "[SECURITY][COMPROMISED][CRITICAL]" },
  { pattern: /^colors@1\.4\.1/, category: "COMPROMISED", severity: "critical", message: "Protestware version", tag: "[SECURITY][COMPROMISED][CRITICAL]" },
  { pattern: /^faker@6\.6\.6/, category: "COMPROMISED", severity: "critical", message: "Sabotaged version", tag: "[SECURITY][COMPROMISED][CRITICAL]" },

  // High: Typosquatting patterns
  { pattern: /^loadsh$/, category: "TYPOSQUAT", severity: "high", message: "Typosquat of 'lodash'", tag: "[SECURITY][TYPOSQUAT][HIGH]" },
  { pattern: /^lodashs$/, category: "TYPOSQUAT", severity: "high", message: "Typosquat of 'lodash'", tag: "[SECURITY][TYPOSQUAT][HIGH]" },
  { pattern: /^expresss$/, category: "TYPOSQUAT", severity: "high", message: "Typosquat of 'express'", tag: "[SECURITY][TYPOSQUAT][HIGH]" },
  { pattern: /^cross-env-.+/, category: "TYPOSQUAT", severity: "high", message: "Potential typosquat of 'cross-env'", tag: "[SECURITY][TYPOSQUAT][HIGH]" },
  { pattern: /^electorn/, category: "TYPOSQUAT", severity: "high", message: "Typosquat of 'electron'", tag: "[SECURITY][TYPOSQUAT][HIGH]" },

  // High: Install scripts from unknown sources
  { pattern: /^install-/, category: "INSTALL_SCRIPT", severity: "high", message: "Package with install- prefix may run arbitrary code", tag: "[SECURITY][INSTALL_SCRIPT][HIGH]" },

  // Medium: Deprecated/unmaintained
  { pattern: /^request$/, category: "DEPRECATED", severity: "medium", message: "Deprecated: use 'fetch' or 'undici'", tag: "[DEPS][DEPRECATED][MEDIUM]" },
  { pattern: /^moment$/, category: "DEPRECATED", severity: "medium", message: "Deprecated: use 'date-fns' or 'dayjs'", tag: "[DEPS][DEPRECATED][MEDIUM]" },
  { pattern: /^node-uuid$/, category: "DEPRECATED", severity: "medium", message: "Deprecated: use 'uuid' or 'crypto.randomUUID()'", tag: "[DEPS][DEPRECATED][MEDIUM]" },

  // Medium: Bun anti-patterns
  { pattern: /^express$/, category: "BUN_ANTIPATTERN", severity: "medium", message: "Use Bun.serve() instead of Express", tag: "[BUN][ANTIPATTERN][MEDIUM]" },
  { pattern: /^axios$/, category: "BUN_ANTIPATTERN", severity: "medium", message: "Use native fetch() instead of axios", tag: "[BUN][ANTIPATTERN][MEDIUM]" },
  { pattern: /^chalk$/, category: "BUN_ANTIPATTERN", severity: "medium", message: "Use Bun.color() instead of chalk", tag: "[BUN][ANTIPATTERN][MEDIUM]" },
  { pattern: /^node-fetch$/, category: "BUN_ANTIPATTERN", severity: "medium", message: "Use native fetch() - Bun has built-in support", tag: "[BUN][ANTIPATTERN][MEDIUM]" },
  { pattern: /^fs-extra$/, category: "BUN_ANTIPATTERN", severity: "medium", message: "Use Bun.file()/Bun.write() instead", tag: "[BUN][ANTIPATTERN][MEDIUM]" },

  // Low: Size concerns
  { pattern: /^lodash$/, category: "BUNDLE_SIZE", severity: "low", message: "Consider lodash-es or individual imports", tag: "[PERF][BUNDLE_SIZE][LOW]" },
  { pattern: /^@aws-sdk\/client-/, category: "BUNDLE_SIZE", severity: "low", message: "Large SDK - ensure tree-shaking", tag: "[PERF][BUNDLE_SIZE][LOW]" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY SCANNER
// ═══════════════════════════════════════════════════════════════════════════════

function scanPackages(packages: string[]): SecurityRisk[] {
  const risks: SecurityRisk[] = [];

  for (const pkg of packages) {
    // Normalize: strip version specifiers for pattern matching
    const pkgName = pkg.replace(/@[\d^~<>=.*]+$/, "");

    for (const rule of SUPPLY_CHAIN_RISKS) {
      if (rule.pattern.test(pkg) || rule.pattern.test(pkgName)) {
        risks.push({
          package: pkg,
          severity: rule.severity,
          category: rule.category,
          message: rule.message,
          tag: rule.tag,
        });
      }
    }
  }

  return risks;
}

function formatRisks(risks: SecurityRisk[]): string {
  const critical = risks.filter(r => r.severity === "critical");
  const high = risks.filter(r => r.severity === "high");
  const medium = risks.filter(r => r.severity === "medium");
  const low = risks.filter(r => r.severity === "low");

  const lines: string[] = [];

  if (critical.length > 0) {
    lines.push("\n🚨 CRITICAL RISKS:");
    critical.forEach(r => lines.push(`   ✗ ${r.package}: ${r.message} ${r.tag}`));
  }

  if (high.length > 0) {
    lines.push("\n⚠️  HIGH RISKS:");
    high.forEach(r => lines.push(`   ✗ ${r.package}: ${r.message} ${r.tag}`));
  }

  if (medium.length > 0) {
    lines.push("\n⚡ MEDIUM RISKS:");
    medium.forEach(r => lines.push(`   ⚠ ${r.package}: ${r.message} ${r.tag}`));
  }

  if (low.length > 0) {
    lines.push("\nℹ️  LOW RISKS:");
    low.forEach(r => lines.push(`   ℹ ${r.package}: ${r.message} ${r.tag}`));
  }

  return lines.join("\n");
}

function shouldBlock(risks: SecurityRisk[]): boolean {
  // Block on critical or high severity
  return risks.some(r => r.severity === "critical" || r.severity === "high");
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

const AUDIT_LOG_PATH = ".bunpm/audit.ndjson";

async function logAudit(entry: AuditEntry): Promise<void> {
  const logDir = ".bunpm";
  const logFile = Bun.file(AUDIT_LOG_PATH);

  // Ensure directory exists
  await Bun.spawn(["mkdir", "-p", logDir]).exited;

  // Append to audit log (NDJSON format)
  const line = JSON.stringify(entry) + "\n";
  const existingContent = await logFile.exists() ? await logFile.text() : "";
  await Bun.write(AUDIT_LOG_PATH, existingContent + line);
}

function getUser(): string {
  return process.env.USER || process.env.USERNAME || "unknown";
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI PARSING
// ═══════════════════════════════════════════════════════════════════════════════

export async function pmCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      "filter": { type: "string", short: "f" },
      "filter-exclude": { type: "string" },
      "workspaces": { type: "boolean", short: "w" },
      "strategy": { type: "string", short: "s" },
      "min-age": { type: "string" },
      "platform": { type: "string" },
      "dev": { type: "boolean", short: "d" },
      "optional": { type: "boolean" },
      "global": { type: "boolean", short: "g" },
      "production": { type: "boolean", short: "p" },
      "frozen-lockfile": { type: "boolean" },
      "dry-run": { type: "boolean" },
      "trust": { type: "boolean" },
      "verbose": { type: "boolean" },
      "silent": { type: "boolean" },
      "help": { type: "boolean", short: "h" },
      // Security Gate options
      "force": { type: "boolean", short: "F" },
      "escalation-token": { type: "string" },
      "no-security-gate": { type: "boolean" },
      "audit-log": { type: "string" },
      // License Policy options
      "license-policy": { type: "string" },
      "licenses": { type: "boolean", short: "L" },
      "sbom": { type: "boolean" },
      "sbom-format": { type: "string" },
    },
    allowPositionals: true,
  });

  const opts: PmOptions = {
    filter: values.filter,
    filterExclude: values["filter-exclude"],
    workspaces: values.workspaces,
    strategy: values.strategy,
    minAge: values["min-age"],
    platform: values.platform,
    dev: values.dev,
    optional: values.optional,
    global: values.global,
    production: values.production,
    frozenLockfile: values["frozen-lockfile"],
    dryRun: values["dry-run"],
    trust: values.trust,
    verbose: values.verbose,
    silent: values.silent,
    help: values.help,
    // Security Gate options
    force: values.force,
    escalationToken: values["escalation-token"],
    noSecurityGate: values["no-security-gate"],
    auditLog: values["audit-log"],
    // License Policy options
    licensePolicy: values["license-policy"],
    licenses: values.licenses,
    sbom: values.sbom,
    sbomFormat: values["sbom-format"],
  };

  if (opts.help || positionals.length === 0) {
    showPmHelp();
    return;
  }

  const [action, ...packages] = positionals;

  switch (action) {
    case "install":
    case "i":
      await handleInstall(opts);
      break;
    case "add":
    case "a":
      await handleAdd(packages, opts);
      break;
    case "remove":
    case "rm":
      await handleRemove(packages, opts);
      break;
    case "run":
    case "r":
      await handleRun(packages[0], opts);
      break;
    case "test":
    case "t":
      await handleTest(opts);
      break;
    case "ls":
    case "list":
      await handleList(opts);
      break;
    case "outdated":
      await handleOutdated();
      break;
    case "update":
      await handleUpdate(packages, opts);
      break;
    case "why":
      await handleWhy(packages[0]);
      break;
    default:
      console.error(`❌ Unknown action: ${action}`);
      showPmHelp();
      process.exit(1);
  }
}

async function handleInstall(opts: PmOptions) {
  const bunArgs = ["install"];

  // Workspace filters (MUST come after 'install')
  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  // Installation options
  if (opts.strategy) bunArgs.push("--linker", opts.strategy);
  if (opts.minAge) bunArgs.push("--minimum-release-age", parseMinAge(opts.minAge));
  if (opts.production) bunArgs.push("--production");
  if (opts.frozenLockfile) bunArgs.push("--frozen-lockfile");
  if (opts.dryRun) bunArgs.push("--dry-run");
  if (opts.verbose) bunArgs.push("--verbose");
  if (opts.silent) bunArgs.push("--silent");

  await runBun(bunArgs);
}

async function handleAdd(packages: string[], opts: PmOptions) {
  if (packages.length === 0 && !opts.workspaces) {
    console.error("❌ No packages specified (use --workspaces for all)");
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY GATE: Pre-install risk analysis
  // ═══════════════════════════════════════════════════════════════════════════
  if (!opts.noSecurityGate && packages.length > 0) {
    console.log("🔒 Security Gate: Scanning packages...");
    const risks = scanPackages(packages);

    if (risks.length > 0) {
      console.log(formatRisks(risks));

      const blocked = shouldBlock(risks);

      if (blocked) {
        if (opts.force) {
          // Force requires escalation token for critical/high risks
          if (!opts.escalationToken) {
            console.error("\n❌ BLOCKED: Critical/high risks detected");
            console.error("   --force requires --escalation-token for audit trail");
            console.error("   Example: --force --escalation-token=SEC-2026-001");
            process.exit(1);
          }

          console.log(`\n⚠️  FORCED INSTALL: Escalation token ${opts.escalationToken}`);
          console.log("   This action will be logged to the audit trail.");

          // Log the forced install
          await logAudit({
            timestamp: new Date().toISOString(),
            action: "add",
            packages,
            user: getUser(),
            workspace: opts.filter,
            risks,
            escalationToken: opts.escalationToken,
            forced: true,
            tag: "[AUDIT][PKG_INSTALL][META:forced=true]",
          });
        } else {
          console.error("\n❌ BLOCKED: Critical/high risks detected");
          console.error("   Use --force --escalation-token=<ticket> to override");
          console.error("   Or use --no-security-gate to skip (not recommended)");
          process.exit(1);
        }
      } else {
        // Medium/low risks - warn but allow
        console.log("\n⚠️  Proceeding with warnings (medium/low severity)");

        // Log the install with warnings
        await logAudit({
          timestamp: new Date().toISOString(),
          action: "add",
          packages,
          user: getUser(),
          workspace: opts.filter,
          risks,
          forced: false,
          tag: "[AUDIT][PKG_INSTALL][META:warnings=true]",
        });
      }
    } else {
      console.log("✅ Security Gate: No risks detected");

      // Log clean install
      await logAudit({
        timestamp: new Date().toISOString(),
        action: "add",
        packages,
        user: getUser(),
        workspace: opts.filter,
        risks: [],
        forced: false,
        tag: "[AUDIT][PKG_INSTALL]",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LICENSE POLICY: Check package licenses against policy
  // ═══════════════════════════════════════════════════════════════════════════
  if (packages.length > 0) {
    console.log("⚖️  License Policy: Checking licenses...");
    const policy = await loadLicensePolicy(opts.licensePolicy);
    const licenseResults = await checkPackageLicenses(packages, policy);

    const blocked = licenseResults.filter(r => r.status === "blocked");
    const needsApproval = licenseResults.filter(r => r.status === "requires-approval");

    if (blocked.length > 0 || needsApproval.length > 0) {
      console.log(formatLicenseResults(licenseResults));

      if (blocked.length > 0) {
        if (opts.force) {
          if (!opts.escalationToken) {
            console.error("\n❌ BLOCKED: Restricted license detected");
            console.error("   --force requires --escalation-token for legal audit trail");
            process.exit(1);
          }

          console.log(`\n⚠️  FORCED (LICENSE): Escalation token ${opts.escalationToken}`);
          console.log("   Legal review required - logged to audit trail");

          await logAudit({
            timestamp: new Date().toISOString(),
            action: "add-license-override",
            packages,
            user: getUser(),
            workspace: opts.filter,
            risks: blocked.map(b => ({
              package: b.name,
              severity: "high" as const,
              category: "LICENSE",
              message: `Blocked license: ${b.spdxId}`,
              tag: b.tag,
            })),
            escalationToken: opts.escalationToken,
            forced: true,
            tag: "[AUDIT][LICENSE_OVERRIDE][META:forced=true]",
          });
        } else {
          console.error("\n❌ BLOCKED: Restricted license detected");
          console.error("   Use --force --escalation-token=<ticket> with legal approval");
          process.exit(1);
        }
      } else if (needsApproval.length > 0) {
        console.log("\n⚠️  Proceeding - packages require legal review before production use");
      }
    } else {
      console.log("✅ License Policy: All licenses allowed");
    }
  }

  const bunArgs = ["add"];

  // Workspace filters
  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  // Dependency type
  if (opts.dev) bunArgs.push("--dev");
  if (opts.optional) bunArgs.push("--optional");
  if (opts.global) bunArgs.push("--global");
  if (opts.trust) bunArgs.push("--trust");

  // Supply chain protection
  if (opts.minAge) bunArgs.push("--minimum-release-age", parseMinAge(opts.minAge));

  // Add packages
  bunArgs.push(...packages);

  await runBun(bunArgs);
}

async function handleRemove(packages: string[], opts: PmOptions) {
  if (packages.length === 0) {
    console.error("❌ No packages specified");
    process.exit(1);
  }

  const bunArgs = ["remove"];

  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.global) bunArgs.push("--global");

  bunArgs.push(...packages);

  await runBun(bunArgs);
}

async function handleRun(script: string, opts: PmOptions) {
  if (!script) {
    console.error("❌ No script specified");
    process.exit(1);
  }

  const bunArgs = ["run"];

  // Workspace filters
  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  bunArgs.push(script);

  await runBun(bunArgs);
}

async function handleTest(opts: PmOptions) {
  const bunArgs = ["test"];

  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  await runBun(bunArgs);
}

async function handleList(opts: PmOptions) {
  // License report mode
  if (opts.licenses || opts.sbom) {
    await handleLicenseReport(opts);
    return;
  }

  const bunArgs = ["pm", "ls"];

  if (opts.global) bunArgs.push("-g");

  await runBun(bunArgs);
}

async function handleLicenseReport(opts: PmOptions) {
  console.log("📋 Scanning installed packages for license information...\n");

  // Get installed packages from bun pm ls
  const proc = Bun.spawn(["bun", "pm", "ls", "--json"], { stdout: "pipe" });
  const output = await new Response(proc.stdout).text();

  let packages: string[] = [];
  try {
    // Parse the output - bun pm ls --json returns package tree
    const lines = output.trim().split("\n");
    for (const line of lines) {
      const match = line.match(/^[├└─│\s]*([a-z@][\w\-./]*@[\d.]+)/i);
      if (match) packages.push(match[1].split("@")[0]);
    }
    // Deduplicate
    packages = [...new Set(packages)];
  } catch {
    // Fallback: parse package.json
    const pkgFile = Bun.file("package.json");
    if (await pkgFile.exists()) {
      const pkg = await pkgFile.json() as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      packages = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
      ];
    }
  }

  if (packages.length === 0) {
    console.log("No packages found.");
    return;
  }

  console.log(`Found ${packages.length} packages. Fetching license info...\n`);

  const policy = await loadLicensePolicy(opts.licensePolicy);
  const results = await checkPackageLicenses(packages, policy);

  if (opts.sbom) {
    // Generate SPDX SBOM
    const sbom = generateSBOM(results, opts.sbomFormat || "spdx-json");
    console.log(sbom);
    return;
  }

  // Standard license report
  const allowed = results.filter(r => r.status === "allowed");
  const blocked = results.filter(r => r.status === "blocked");
  const needsApproval = results.filter(r => r.status === "requires-approval");
  const unknown = results.filter(r => r.status === "unknown");

  console.log("📊 License Summary:");
  console.log(`   ✅ Allowed: ${allowed.length}`);
  console.log(`   🚫 Blocked: ${blocked.length}`);
  console.log(`   ⚖️  Needs Approval: ${needsApproval.length}`);
  console.log(`   ❓ Unknown: ${unknown.length}`);

  if (blocked.length > 0 || needsApproval.length > 0 || unknown.length > 0) {
    console.log(formatLicenseResults(results));
  }

  // License distribution
  const licenseCounts: Record<string, number> = {};
  for (const r of results) {
    licenseCounts[r.spdxId] = (licenseCounts[r.spdxId] || 0) + 1;
  }

  console.log("\n📈 License Distribution:");
  const sorted = Object.entries(licenseCounts).sort((a, b) => b[1] - a[1]);
  for (const [license, count] of sorted.slice(0, 10)) {
    const bar = "█".repeat(Math.min(count, 30));
    console.log(`   ${license.padEnd(15)} ${bar} ${count}`);
  }
  if (sorted.length > 10) {
    console.log(`   ... and ${sorted.length - 10} more`);
  }
}

function generateSBOM(packages: PackageLicense[], format: string): string {
  const timestamp = new Date().toISOString();

  if (format === "spdx-json" || format === "json") {
    const sbom = {
      spdxVersion: "SPDX-2.3",
      dataLicense: "CC0-1.0",
      SPDXID: "SPDXRef-DOCUMENT",
      name: "enterprise-dashboard-sbom",
      documentNamespace: `https://enterprise.local/sbom/${Date.now()}`,
      creationInfo: {
        created: timestamp,
        creators: ["Tool: bunpm-license-scanner"],
      },
      packages: packages.map((p, i) => ({
        SPDXID: `SPDXRef-Package-${i}`,
        name: p.name,
        versionInfo: p.version,
        downloadLocation: p.repository || "NOASSERTION",
        licenseConcluded: p.spdxId || "NOASSERTION",
        licenseDeclared: p.license || "NOASSERTION",
        copyrightText: "NOASSERTION",
        externalRefs: [{
          referenceCategory: "PACKAGE-MANAGER",
          referenceType: "npm",
          referenceLocator: `npm:${p.name}@${p.version}`,
        }],
      })),
    };
    return JSON.stringify(sbom, null, 2);
  }

  // SARIF format (for scanner integration)
  if (format === "sarif") {
    const blocked = packages.filter(p => p.status === "blocked" || p.status === "requires-approval");
    const sarif = {
      $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [{
        tool: {
          driver: {
            name: "bunpm-license-scanner",
            version: "1.0.0",
            rules: blocked.map(p => ({
              id: `LICENSE-${p.spdxId.replace(/[^a-zA-Z0-9]/g, "-")}`,
              shortDescription: { text: `Restricted license: ${p.spdxId}` },
              fullDescription: { text: `Package ${p.name} uses ${p.spdxId} which is restricted by policy` },
              defaultConfiguration: { level: p.status === "blocked" ? "error" : "warning" },
            })),
          },
        },
        results: blocked.map(p => ({
          ruleId: `LICENSE-${p.spdxId.replace(/[^a-zA-Z0-9]/g, "-")}`,
          level: p.status === "blocked" ? "error" : "warning",
          message: { text: `${p.name}@${p.version}: ${p.spdxId} ${p.tag}` },
          locations: [{
            physicalLocation: {
              artifactLocation: { uri: "package.json" },
            },
          }],
        })),
      }],
    };
    return JSON.stringify(sarif, null, 2);
  }

  // Default: simple text format
  return packages.map(p => `${p.name}@${p.version}\t${p.spdxId}\t${p.status}`).join("\n");
}

async function handleOutdated() {
  await runBun(["outdated"]);
}

async function handleUpdate(packages: string[], opts: PmOptions) {
  const bunArgs = ["update"];

  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (packages.length > 0) bunArgs.push(...packages);

  await runBun(bunArgs);
}

async function handleWhy(pkg: string) {
  if (!pkg) {
    console.error("❌ No package specified");
    process.exit(1);
  }

  // bun pm why <pkg> - shows why a package is installed
  await runBun(["pm", "why", pkg]);
}

function parseMinAge(duration: string): string {
  // Convert human-readable duration to seconds
  const match = duration.match(/^(\d+)(s|m|h|d|w)$/);
  if (!match) return duration; // Already in seconds

  const [, num, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  return String(parseInt(num) * multipliers[unit]);
}

async function runBun(args: string[]) {
  console.log(`$ bun ${args.join(" ")}`);

  const proc = spawn(["bun", ...args], {
    stdio: ["inherit", "inherit", "inherit"],
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function showPmHelp() {
  console.log(`
📦 Package Management Commands (Bun 1.3.6 + Workspaces + Security Gate + License Policy)

Usage: bun scripts/pm.ts <action> [packages...] [options]

Actions:
  install, i          Install dependencies
  add, a              Add packages (with security scan)
  remove, rm          Remove packages
  run, r              Run a script
  test, t             Run tests
  ls, list            List installed packages
  outdated            Show outdated packages
  update              Update packages
  why <pkg>           Show why a package is installed

Workspace Options:
  -f, --filter <pkg>  Filter to specific workspace (@enterprise/dataview)
  --filter-exclude    Exclude pattern (!@enterprise/pkg)
  -w, --workspaces    Run in all workspaces

Dependency Options:
  -d, --dev           Add as devDependency
  --optional          Add as optionalDependency
  -g, --global        Global install/remove
  --trust             Add to trustedDependencies

Installation Options:
  -s, --strategy      Linker: hoisted | isolated
  --min-age <dur>     Minimum release age (3d, 1w, etc.)
  -p, --production    Skip devDependencies
  --frozen-lockfile   Error if lockfile changes (CI)
  --dry-run           Show what would be done
  --verbose           Debug logging
  --silent            No logging

🔒 Security Gate Options:
  --no-security-gate        Skip security scanning (not recommended)
  -F, --force               Force install despite risks (requires token)
  --escalation-token <id>   Audit token for forced installs (e.g. SEC-2026-001)

  Risk Levels:
    CRITICAL  Compromised packages (event-stream, protestware) → BLOCKED
    HIGH      Typosquatting, install scripts                   → BLOCKED
    MEDIUM    Deprecated, Bun anti-patterns                    → WARNING
    LOW       Bundle size concerns                             → INFO

  Audit logs written to: .bunpm/audit.ndjson

⚖️  License Policy Options:
  --license-policy <file>   Custom license policy JSON (default: built-in)
  -L, --licenses            Show license report for installed packages
  --sbom                    Generate SPDX SBOM
  --sbom-format <fmt>       SBOM format: spdx-json, sarif, text (default: spdx-json)

  Policy Levels:
    ALLOWED         MIT, Apache-2.0, BSD, ISC, etc.     → ✓ ALLOWED
    BLOCKED         GPL, AGPL, SSPL, BUSL               → ✗ BLOCKED
    REQUIRES-REVIEW LGPL, MPL, EPL                      → ⚠ WARNING

  License checks run automatically during 'add' command.

Examples:
  # Install in specific workspace
  bun scripts/pm.ts install --filter @enterprise/dataview

  # Add package (auto-scanned for security risks)
  bun scripts/pm.ts add zod --filter @enterprise/dataview

  # Blocked package - requires escalation token to override
  bun scripts/pm.ts add event-stream --force --escalation-token=SEC-2026-001

  # Skip security gate (CI with pre-vetted lockfile)
  bun scripts/pm.ts add lodash --no-security-gate

  # Supply chain protection: only packages 3+ days old
  bun scripts/pm.ts add zod --min-age 3d

  # CI install (frozen lockfile, production only)
  bun scripts/pm.ts install --frozen-lockfile --production

  # Show license report for installed packages
  bun scripts/pm.ts ls --licenses

  # Generate SBOM in SPDX format
  bun scripts/pm.ts ls --sbom > sbom.json

  # Generate SARIF SBOM for GitHub/Azure DevOps
  bun scripts/pm.ts ls --sbom --sbom-format sarif > sbom.sarif

  # Use custom license policy
  bun scripts/pm.ts add some-pkg --license-policy ./license-policy.json
`);
}

// CLI entry point
if (import.meta.main) {
  await pmCommand(process.argv.slice(2));
}
