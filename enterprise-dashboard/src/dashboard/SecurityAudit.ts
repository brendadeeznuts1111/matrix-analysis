// src/dashboard/SecurityAudit.ts
// Supply Chain Security Analysis Module

import { SecureRegistryClient } from "../client/RegistryClient.ts";

type RiskScore = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

interface PackageRisk {
  name: string;
  version: string;
  license: string;
  riskScore: RiskScore;
  riskLevel: "low" | "medium" | "high" | "critical";
  issues: string[];
  recommendations: string[];
  depCount: number;
  devDepCount: number;
  isPrerelease: boolean;
  hasEngines: boolean;
}

interface SecurityPolicy {
  allowedLicenses: string[];
  maxDependencies: number;
  blockPrerelease: boolean;
  requireEngines: boolean;
  minimumReleaseAgeDays: number;
}

const DEFAULT_POLICY: SecurityPolicy = {
  allowedLicenses: ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC", "BSD-2-Clause"],
  maxDependencies: 15,
  blockPrerelease: true,
  requireEngines: false,
  minimumReleaseAgeDays: 3,
};

export class SecurityAudit {
  private client: SecureRegistryClient;
  private policy: SecurityPolicy;

  private constructor(client: SecureRegistryClient, policy: SecurityPolicy) {
    this.client = client;
    this.policy = policy;
  }

  static async create(policy: Partial<SecurityPolicy> = {}): Promise<SecurityAudit> {
    const client = await SecureRegistryClient.create();
    return new SecurityAudit(client, { ...DEFAULT_POLICY, ...policy });
  }

  private isPrerelease(version: string): boolean {
    return /canary|experimental|dev|alpha|beta|rc|next|preview/i.test(version);
  }

  private calculateRiskScore(issues: string[], depCount: number, isPrerelease: boolean): RiskScore {
    let score = 100;

    // Pre-release is critical
    if (isPrerelease) score -= 50;

    // High dependency count
    if (depCount > 30) score -= 30;
    else if (depCount > 20) score -= 20;
    else if (depCount > 10) score -= 10;

    // Each issue reduces score
    score -= issues.length * 5;

    if (score >= 95) return "A+";
    if (score >= 85) return "A";
    if (score >= 75) return "B+";
    if (score >= 65) return "B";
    if (score >= 55) return "C+";
    if (score >= 45) return "C";
    if (score >= 30) return "D";
    return "F";
  }

  private getRiskLevel(score: RiskScore): PackageRisk["riskLevel"] {
    if (score === "A+" || score === "A") return "low";
    if (score === "B+" || score === "B") return "medium";
    if (score === "C+" || score === "C") return "high";
    return "critical";
  }

  async analyzePackage(packageName: string): Promise<PackageRisk> {
    const data = (await this.client.getPackageInfo(packageName)) as Record<string, unknown>;
    const latest = data["dist-tags"] as Record<string, string>;
    const latestVersion = latest?.latest ?? "unknown";
    const versions = data.versions as Record<string, Record<string, unknown>>;
    const latestData = versions?.[latestVersion] ?? {};

    const deps = latestData.dependencies as Record<string, string> | undefined;
    const devDeps = latestData.devDependencies as Record<string, string> | undefined;
    const license = (latestData.license as string) ?? "unknown";
    const engines = latestData.engines as Record<string, string> | undefined;

    const depCount = deps ? Object.keys(deps).length : 0;
    const devDepCount = devDeps ? Object.keys(devDeps).length : 0;
    const isPrerelease = this.isPrerelease(latestVersion);
    const hasEngines = !!(engines?.node || engines?.bun);

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check pre-release
    if (isPrerelease && this.policy.blockPrerelease) {
      issues.push("Pre-release version detected");
      recommendations.push("Pin to stable version");
    }

    // Check dependency count
    if (depCount > this.policy.maxDependencies) {
      issues.push(`High dependency count (${depCount})`);
      recommendations.push("Audit transitive dependencies");
    }

    // Check license
    if (!this.policy.allowedLicenses.includes(license)) {
      issues.push(`License requires review: ${license}`);
      recommendations.push("Verify license compliance with legal");
    }

    // Check engines
    if (this.policy.requireEngines && !hasEngines) {
      issues.push("No runtime engine specified");
      recommendations.push("Verify Node/Bun compatibility");
    }

    // Check devDependencies (supply chain risk)
    if (devDepCount > 50) {
      issues.push(`Large devDependency footprint (${devDepCount})`);
      recommendations.push("Review build-time dependencies");
    }

    const riskScore = this.calculateRiskScore(issues, depCount, isPrerelease);
    const riskLevel = this.getRiskLevel(riskScore);

    return {
      name: packageName,
      version: latestVersion,
      license,
      riskScore,
      riskLevel,
      issues,
      recommendations,
      depCount,
      devDepCount,
      isPrerelease,
      hasEngines,
    };
  }

  async analyzePackages(packages: string[]): Promise<PackageRisk[]> {
    return Promise.all(packages.map((p) => this.analyzePackage(p).catch(() => ({
      name: p,
      version: "unknown",
      license: "unknown",
      riskScore: "F" as RiskScore,
      riskLevel: "critical" as const,
      issues: ["Failed to fetch package info"],
      recommendations: ["Verify package exists"],
      depCount: 0,
      devDepCount: 0,
      isPrerelease: false,
      hasEngines: false,
    }))));
  }

  async detectPrereleases(packageName: string, limit = 10): Promise<string[]> {
    const data = (await this.client.getPackageInfo(packageName)) as Record<string, unknown>;
    const versions = data.versions as Record<string, Record<string, unknown>>;

    if (!versions) return [];

    return Object.keys(versions)
      .slice(-limit)
      .reverse()
      .filter((v) => this.isPrerelease(v));
  }

  renderSecurityReport(risks: PackageRisk[]): string {
    const riskEmoji = (level: PackageRisk["riskLevel"]) => {
      switch (level) {
        case "low": return "L";
        case "medium": return "M";
        case "high": return "H";
        case "critical": return "!";
      }
    };

    const scoreEmoji = (score: RiskScore) => {
      if (score === "A+" || score === "A") return "OK";
      if (score === "B+" || score === "B") return "~~";
      if (score === "C+" || score === "C") return "??";
      return "XX";
    };

    const rows = risks.map((r) => ({
      Package: r.name,
      Version: r.version,
      License: r.license,
      Risk: `${scoreEmoji(r.riskScore)} ${r.riskScore}`,
      Level: `[${riskEmoji(r.riskLevel)}] ${r.riskLevel}`,
      Deps: r.depCount,
      DevDeps: r.devDepCount,
      Engines: r.hasEngines ? "Yes" : "No",
      Issues: r.issues.length > 0 ? r.issues[0].slice(0, 30) + (r.issues[0].length > 30 ? "..." : "") : "-",
    }));

    const sections = [
      "\n=== Supply Chain Security Report ===\n",
      Bun.inspect.table(rows, undefined, { colors: true }),
    ];

    // Critical findings
    const critical = risks.filter((r) => r.riskLevel === "critical" || r.riskLevel === "high");
    if (critical.length > 0) {
      sections.push("\n=== Critical Findings ===\n");
      const findings = critical.flatMap((r) =>
        r.issues.map((issue) => ({
          Package: r.name,
          Issue: issue,
          Action: r.recommendations[0] ?? "Review required",
        }))
      );
      sections.push(Bun.inspect.table(findings, undefined, { colors: true }));
    }

    // Prerelease warnings
    const prereleases = risks.filter((r) => r.isPrerelease);
    if (prereleases.length > 0) {
      sections.push("\n=== Pre-release Warnings ===\n");
      const preRows = prereleases.map((r) => ({
        Package: r.name,
        Version: r.version,
        Status: "BLOCKED for production",
        Action: "Pin to stable version",
      }));
      sections.push(Bun.inspect.table(preRows, undefined, { colors: true }));
    }

    // Summary stats
    const stats = {
      "Total Packages": risks.length,
      "Low Risk": risks.filter((r) => r.riskLevel === "low").length,
      "Medium Risk": risks.filter((r) => r.riskLevel === "medium").length,
      "High Risk": risks.filter((r) => r.riskLevel === "high").length,
      "Critical Risk": risks.filter((r) => r.riskLevel === "critical").length,
      "Pre-releases": prereleases.length,
      "Total Dependencies": risks.reduce((sum, r) => sum + r.depCount, 0),
    };

    sections.push("\n=== Security Summary ===\n");
    const summaryRows = Object.entries(stats).map(([Metric, Value]) => ({ Metric, Value }));
    sections.push(Bun.inspect.table(summaryRows, undefined, { colors: true }));

    return sections.join("\n");
  }
}

// Default packages for security audit
const DEFAULT_PACKAGES = ["zod", "lodash", "typescript", "react", "express", "axios"];

// CLI usage
if (import.meta.main) {
  const args = process.argv.slice(2);
  const packages = args.length > 0 ? args : DEFAULT_PACKAGES;

  const audit = await SecurityAudit.create();
  const risks = await audit.analyzePackages(packages);
  console.log(audit.renderSecurityReport(risks));
}
