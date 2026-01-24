// src/dashboard/security-enhanced.ts
// Enhanced Security Dashboard with Shell-based Analysis

import { $ } from "bun";

interface PackageRisk {
  name: string;
  version: string;
  riskScore: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  issues: string[];
  depCount: number;
  hasEngines: boolean;
}

class SecurityDashboard {
  async analyzePackage(name: string, version: string): Promise<PackageRisk> {
    const issues: string[] = [];
    let depCount = 0;
    let hasEngines = false;

    // Helper to check if score should be downgraded
    const isHighScore = (s: PackageRisk["riskScore"]) => s === "A+" || s === "A";

    // Start with best score
    let score: PackageRisk["riskScore"] = "A+";

    // Check for pre-release (worst case)
    if (version.includes("canary") || version.includes("experimental") || version.includes("dev")) {
      issues.push("Pre-release version in production");
      return { name, version, riskScore: "D", issues, depCount, hasEngines };
    }

    // Check dependency count via npm view
    try {
      const depsResult = await $`npm view ${name}@${version} dependencies --json`.quiet().nothrow();
      if (depsResult.exitCode === 0) {
        const pkgJson = JSON.parse(depsResult.stdout.toString() || "{}");
        depCount = Object.keys(pkgJson || {}).length;
        if (depCount > 20) {
          issues.push(`High dependency count (${depCount})`);
          if (isHighScore(score)) score = "C+";
        } else if (depCount > 10) {
          issues.push(`Moderate dependencies (${depCount})`);
          if (isHighScore(score)) score = "B+";
        }
      }
    } catch {
      // npm view may fail for some packages
    }

    // Check engine requirements
    try {
      const enginesResult = await $`npm view ${name}@${version} engines --json`.quiet().nothrow();
      if (enginesResult.exitCode === 0) {
        const engines = JSON.parse(enginesResult.stdout.toString() || "null");
        hasEngines = !!(engines?.node || engines?.bun);
        if (!hasEngines) {
          issues.push("No runtime engine specified");
          if (score === "A+") score = "B+";
        }
      }
    } catch {
      issues.push("No runtime engine specified");
      if (score === "A+") score = "B+";
    }

    return { name, version, riskScore: score, issues, depCount, hasEngines };
  }

  renderSecurityTable(packages: PackageRisk[]): void {
    const riskEmoji = (score: PackageRisk["riskScore"]) => {
      if (score === "A+" || score === "A") return "OK";
      if (score === "B+" || score === "B") return "~~";
      if (score === "C+" || score === "C") return "??";
      return "XX";
    };

    const rows = packages.map((pkg) => ({
      Package: pkg.name,
      Version: pkg.version,
      Risk: `${riskEmoji(pkg.riskScore)} ${pkg.riskScore}`,
      Deps: pkg.depCount,
      Engines: pkg.hasEngines ? "Yes" : "No",
      Issues: pkg.issues.length > 0 ? pkg.issues.join("; ").slice(0, 40) : "-",
    }));

    console.log("\n=== Supply Chain Security Report ===\n");
    console.log(Bun.inspect.table(rows, undefined, { colors: true }));

    // Summary
    const summary = {
      "Total Packages": packages.length,
      "A/A+ Rating": packages.filter((p) => p.riskScore.startsWith("A")).length,
      "B/B+ Rating": packages.filter((p) => p.riskScore.startsWith("B")).length,
      "C+ or Lower": packages.filter((p) => !p.riskScore.startsWith("A") && !p.riskScore.startsWith("B")).length,
      "Total Dependencies": packages.reduce((sum, p) => sum + p.depCount, 0),
      "With Engines": packages.filter((p) => p.hasEngines).length,
    };

    console.log("\n=== Summary ===\n");
    const summaryRows = Object.entries(summary).map(([Metric, Value]) => ({ Metric, Value }));
    console.log(Bun.inspect.table(summaryRows, undefined, { colors: true }));
  }
}

// Default packages
const DEFAULT_PACKAGES = [
  { name: "zod", version: "latest" },
  { name: "lodash", version: "latest" },
  { name: "typescript", version: "latest" },
  { name: "react", version: "latest" },
  { name: "express", version: "latest" },
  { name: "axios", version: "latest" },
];

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);

  // Parse package@version args or use defaults
  const packages = args.length > 0
    ? args.map((arg) => {
        const [name, version = "latest"] = arg.split("@");
        return { name, version };
      })
    : DEFAULT_PACKAGES;

  const dashboard = new SecurityDashboard();

  console.log("Analyzing packages...\n");
  const results = await Promise.all(
    packages.map((p) => dashboard.analyzePackage(p.name, p.version))
  );

  dashboard.renderSecurityTable(results);
}

export { SecurityDashboard };
