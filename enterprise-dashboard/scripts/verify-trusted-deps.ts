#!/usr/bin/env bun
/**
 * Verify Trusted Dependencies
 * Audits package.json for security issues with trustedDependencies
 */

const pkg = await Bun.file("../package.json").json().catch(() => null);
const rootPkg = await Bun.file(Bun.env.HOME + "/package.json").json().catch(() => null);

const targetPkg = pkg || rootPkg;

if (!targetPkg) {
  console.error("No package.json found");
  process.exit(1);
}

interface AuditResult {
  package: string;
  source: string;
  issue: string;
  severity: "high" | "medium" | "low";
}

const issues: AuditResult[] = [];
const trusted = new Set(targetPkg.trustedDependencies || []);

// Check all dependency types
const depTypes = ["dependencies", "devDependencies", "optionalDependencies"] as const;

for (const depType of depTypes) {
  const deps = targetPkg[depType] || {};

  for (const [name, version] of Object.entries(deps)) {
    const ver = version as string;

    // Check for non-npm sources that need explicit trust
    const isGit = ver.startsWith("git") || ver.startsWith("github:") || ver.includes("git@");
    const isFile = ver.startsWith("file:") || ver.startsWith("link:");
    const isTarball = ver.startsWith("http://") || ver.startsWith("https://");

    if ((isGit || isFile) && !trusted.has(name)) {
      issues.push({
        package: name,
        source: ver,
        issue: `Non-npm dependency without explicit trust. Add to trustedDependencies if it has lifecycle scripts.`,
        severity: "high",
      });
    }

    if (isTarball && !ver.includes("registry.npmjs.org")) {
      issues.push({
        package: name,
        source: ver,
        issue: `Tarball from non-npm registry. Verify source is trusted.`,
        severity: "medium",
      });
    }
  }
}

// Report results
console.log("\n=== Trusted Dependencies Audit ===\n");

if (trusted.size > 0) {
  console.log(`Trusted packages (${trusted.size}):`);
  for (const pkg of trusted) {
    console.log(`  - ${pkg}`);
  }
  console.log();
}

if (issues.length === 0) {
  console.log("No security issues found.");
  process.exit(0);
}

console.log(`Found ${issues.length} issue(s):\n`);

for (const issue of issues) {
  const icon = issue.severity === "high" ? "[HIGH]" : issue.severity === "medium" ? "[MED]" : "[LOW]";
  console.log(`${icon} ${issue.package}`);
  console.log(`  Source: ${issue.source}`);
  console.log(`  Issue: ${issue.issue}`);
  console.log();
}

process.exit(issues.some(i => i.severity === "high") ? 1 : 0);

export {};
