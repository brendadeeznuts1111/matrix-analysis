// src/dashboard/index.ts
// Enterprise Dashboard - Security & Registry Management

export { KeychainViewer } from "./KeychainViewer.ts";
export { RegistryViewer } from "./RegistryViewer.ts";
export { SecurityAudit } from "./SecurityAudit.ts";
export { SecureRegistryClient } from "../client/RegistryClient.ts";

import { KeychainViewer } from "./KeychainViewer.ts";
import { RegistryViewer } from "./RegistryViewer.ts";
import { SecurityAudit } from "./SecurityAudit.ts";

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
  console.log(
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
