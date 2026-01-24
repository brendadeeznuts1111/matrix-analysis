// src/dashboard/index.ts
// Enterprise Dashboard - Security & Registry Management

import { feature } from "bun:bundle";
import { dns } from "bun";
import { dashboardLog } from "../utils/logger.ts";
import { TIER, dim } from "../utils/colors.ts";

export { KeychainViewer } from "./KeychainViewer.ts";
export { RegistryViewer } from "./RegistryViewer.ts";
export { SecurityAudit } from "./SecurityAudit.ts";
export { SecureRegistryClient } from "../client/RegistryClient.ts";

import { KeychainViewer } from "./KeychainViewer.ts";
import { RegistryViewer } from "./RegistryViewer.ts";
import { SecurityAudit } from "./SecurityAudit.ts";

// ============================================================================
// DNS Prefetch (warm cache before network requests)
// ============================================================================

import { NPM_REGISTRY_URL } from "../config/constants.ts";

const REGISTRY_HOST = new URL(NPM_REGISTRY_URL).hostname;
dns.prefetch(REGISTRY_HOST, 443);
dns.prefetch("api.github.com", 443);

// ============================================================================
// Tier-Gated Features (Compile-Time Dead Code Elimination)
// ============================================================================

dashboardLog.info("🚀 Starting Enterprise Dashboard...");

// 1. FREE TIER: Standard Monitoring (always included)
dashboardLog.info(`${TIER.FREE} System Monitor: Active`);

// 2. PRO TIER: Advanced Metrics (removed from Free bundle)
if (feature("TIER_PRO") || feature("TIER_ENTERPRISE")) {
  const { startAdvancedMetrics } = await import("./modules/metrics");
  startAdvancedMetrics();
}

// 3. ENTERPRISE TIER: PTY Shell & Debug (removed from Free/Pro bundles)
if (feature("TIER_ENTERPRISE")) {
  const { enableShellAccess } = await import("./modules/terminal");
  enableShellAccess();
}

// 4. DEBUG LOGGING (removed from production bundles)
if (feature("DEBUG_LOGGING")) {
  dashboardLog.debug(dim("[DEBUG] Internal state initialized"));
  dashboardLog.debug(dim("[DEBUG] Build includes DEBUG_LOGGING feature"));
}

dashboardLog.info("");

// ============================================================================

// Default packages to display
const DEFAULT_PACKAGES = [
  "zod",
  "lodash",
  "typescript",
  "react",
  "express",
  "axios",
];

interface DashboardOptions {
  showKeychain?: boolean;
  showRegistry?: boolean;
  packages?: string[];
  detailed?: boolean;
  showSummary?: boolean;
  showSecurity?: boolean;
}

export class EnterpriseDashboard {
  private keychainViewer: KeychainViewer | null = null;
  private registryViewer: RegistryViewer | null = null;
  private securityAudit: SecurityAudit | null = null;

  static async create(): Promise<EnterpriseDashboard> {
    const dashboard = new EnterpriseDashboard();
    dashboard.keychainViewer = await KeychainViewer.create();

    try {
      dashboard.registryViewer = await RegistryViewer.create();
      dashboard.securityAudit = await SecurityAudit.create();
    } catch {
      // Registry viewer requires secrets - may not be configured
    }

    return dashboard;
  }

  async render(options: DashboardOptions = {}): Promise<string> {
    const {
      showKeychain = true,
      showRegistry = true,
      packages = DEFAULT_PACKAGES,
      detailed = false,
      showSummary = false,
      showSecurity = false,
    } = options;
    const sections: string[] = [];

    const title = showSecurity ? "ENTERPRISE DASHBOARD - SECURITY VIEW" : "ENTERPRISE DASHBOARD";
    sections.push(Bun.inspect.table([{ [title]: "Security & Registry Management" }], undefined, { colors: true }));

    if (showKeychain && this.keychainViewer) {
      sections.push("\n## Keychain Status\n");
      sections.push(this.keychainViewer.render());
    }

    // Security view takes precedence
    if (showSecurity && this.securityAudit) {
      const risks = await this.securityAudit.analyzePackages(packages);
      sections.push(this.securityAudit.renderSecurityReport(risks));
    } else if (showRegistry && this.registryViewer) {
      sections.push("\n## Registry Packages\n");
      if (detailed) {
        sections.push(await this.registryViewer.renderDetailed(packages));
      } else {
        sections.push(await this.registryViewer.renderMultiple(packages));
      }

      if (showSummary) {
        sections.push(await this.registryViewer.renderSummary());
      }
    } else if (showRegistry) {
      sections.push("\n## Registry Packages\n");
      sections.push("Registry viewer unavailable - secrets not configured");
      sections.push("Run: bun scripts/setup-secrets.ts");
    }

    return sections.join("\n");
  }

  getKeychainViewer(): KeychainViewer | null {
    return this.keychainViewer;
  }

  getRegistryViewer(): RegistryViewer | null {
    return this.registryViewer;
  }
}

// CLI usage
if (import.meta.main) {
  const args = process.argv.slice(2);
  const showKeychain = !args.includes("--no-keychain");
  const showRegistry = !args.includes("--no-registry");
  const detailed = args.includes("--detailed") || args.includes("-d");
  const showSummary = args.includes("--summary") || args.includes("-s");
  const showSecurity = args.includes("--security") || args.includes("--audit");
  const packages = args.filter((a) => !a.startsWith("--") && !a.startsWith("-"));

  const dashboard = await EnterpriseDashboard.create();
  dashboardLog.info(
    await dashboard.render({
      showKeychain,
      showRegistry,
      detailed,
      showSummary,
      showSecurity,
      packages: packages.length > 0 ? packages : undefined,
    })
  );
}
