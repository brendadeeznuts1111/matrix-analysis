#!/usr/bin/env bun

import { bench, group, run } from "mitata";

/**
 * Bun.semver Benchmark Suite
 * Comprehensive benchmarks for semver operations
 */

const ansi = (color: string) => Bun.color(color, "ansi") as string;
const green = ansi("hsl(145, 63%, 42%)");
const blue = ansi("hsl(210, 90%, 55%)");
const orange = ansi("hsl(25, 85%, 55%)");
const cyan = ansi("hsl(195, 85%, 55%)");
const reset = ansi("white");
const bold = "\x1b[1m";
const dim = "\x1b[2m";

console.log(`\n${bold}Bun.semver Benchmark Suite${reset}\n`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const simpleVersions = [
  ["1.0.0", "2.0.0"],
  ["1.2.3", "1.2.4"],
  ["0.0.1", "0.0.2"],
  ["10.20.30", "10.20.31"],
];

const prereleaseVersions = [
  ["1.0.0-alpha", "1.0.0-beta"],
  ["1.0.0-alpha.1", "1.0.0-alpha.2"],
  ["2.0.0-rc.1", "2.0.0"],
  ["1.0.0-beta.11", "1.0.0-beta.2"],
];

const buildMetadata = [
  ["1.0.0+build.123", "1.0.0+build.456"],
  ["1.0.0-alpha+001", "1.0.0-alpha+002"],
];

const caretRanges = [
  ["1.5.0", "^1.0.0"],
  ["1.9.9", "^1.0.0"],
  ["2.0.0", "^1.0.0"],
  ["0.2.3", "^0.2.0"],
  ["0.3.0", "^0.2.0"],
];

const tildeRanges = [
  ["1.2.3", "~1.2.0"],
  ["1.2.9", "~1.2.0"],
  ["1.3.0", "~1.2.0"],
  ["0.2.5", "~0.2.3"],
];

const hyphenRanges = [
  ["1.5.0", "1.0.0 - 2.0.0"],
  ["2.5.0", "1.0.0 - 2.0.0"],
  ["0.9.0", "1.0.0 - 2.0.0"],
];

const orRanges = [
  ["1.5.0", "^1.0.0 || ^2.0.0"],
  ["2.5.0", "^1.0.0 || ^2.0.0"],
  ["3.0.0", "^1.0.0 || ^2.0.0"],
];

const complexRanges = [
  ["1.5.0", ">=1.0.0 <2.0.0"],
  ["1.5.0", ">=1.2.0 <=1.8.0"],
  ["1.5.0", ">1.0.0 <1.6.0"],
  ["2.0.0", ">=1.0.0 <2.0.0 || >=3.0.0"],
];

const wildcardRanges = [
  ["1.2.3", "1.x"],
  ["1.5.9", "1.x.x"],
  ["2.0.0", "1.x"],
  ["1.2.3", "*"],
  ["0.0.1", "x"],
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bun.semver.order() Benchmarks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

group("semver.order() - Version Comparison", () => {
  bench("Simple versions (1.0.0 vs 2.0.0)", () => {
    for (const [a, b] of simpleVersions) {
      Bun.semver.order(a, b);
    }
  });

  bench("Prerelease versions (alpha, beta, rc)", () => {
    for (const [a, b] of prereleaseVersions) {
      Bun.semver.order(a, b);
    }
  });

  bench("Build metadata versions", () => {
    for (const [a, b] of buildMetadata) {
      Bun.semver.order(a, b);
    }
  });

  bench("Equal version check", () => {
    Bun.semver.order("1.2.3", "1.2.3");
    Bun.semver.order("0.0.0", "0.0.0");
    Bun.semver.order("99.99.99", "99.99.99");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bun.semver.satisfies() Benchmarks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

group("semver.satisfies() - Range Matching", () => {
  bench("Caret ranges (^1.0.0)", () => {
    for (const [ver, range] of caretRanges) {
      Bun.semver.satisfies(ver, range);
    }
  });

  bench("Tilde ranges (~1.2.0)", () => {
    for (const [ver, range] of tildeRanges) {
      Bun.semver.satisfies(ver, range);
    }
  });

  bench("Hyphen ranges (1.0.0 - 2.0.0)", () => {
    for (const [ver, range] of hyphenRanges) {
      Bun.semver.satisfies(ver, range);
    }
  });

  bench("OR ranges (^1.0.0 || ^2.0.0)", () => {
    for (const [ver, range] of orRanges) {
      Bun.semver.satisfies(ver, range);
    }
  });

  bench("Complex ranges (>=1.0.0 <2.0.0)", () => {
    for (const [ver, range] of complexRanges) {
      Bun.semver.satisfies(ver, range);
    }
  });

  bench("Wildcard ranges (1.x, *)", () => {
    for (const [ver, range] of wildcardRanges) {
      Bun.semver.satisfies(ver, range);
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Real-world Scenarios
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Simulate package.json dependency resolution
const dependencies = [
  { name: "react", installed: "18.2.0", range: "^18.0.0" },
  { name: "typescript", installed: "5.3.3", range: "~5.3.0" },
  { name: "vite", installed: "5.0.12", range: "^5.0.0" },
  { name: "eslint", installed: "8.56.0", range: ">=8.0.0" },
  { name: "prettier", installed: "3.2.4", range: "^3.0.0 || ^2.0.0" },
  { name: "lodash", installed: "4.17.21", range: ">=4.0.0 <5.0.0" },
  { name: "axios", installed: "1.6.5", range: "^1.0.0" },
  { name: "zod", installed: "3.22.4", range: "^3.20.0" },
];

group("Real-world: Dependency Resolution", () => {
  bench("Check 8 dependencies against ranges", () => {
    for (const dep of dependencies) {
      Bun.semver.satisfies(dep.installed, dep.range);
    }
  });

  bench("Sort versions (package updates)", () => {
    const versions = [
      "1.0.0", "1.0.1", "1.1.0", "1.2.0", "2.0.0-alpha",
      "2.0.0-beta", "2.0.0-rc.1", "2.0.0", "2.1.0",
    ];
    versions.sort((a, b) => Bun.semver.order(a, b));
  });

  bench("Find latest compatible (^1.0.0)", () => {
    const available = ["1.0.0", "1.1.0", "1.2.0", "1.3.0", "2.0.0", "2.1.0"];
    const range = "^1.0.0";
    let latest = "";
    for (const v of available) {
      if (Bun.semver.satisfies(v, range)) {
        if (!latest || Bun.semver.order(v, latest) > 0) {
          latest = v;
        }
      }
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Comparison with Manual Implementation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function manualSemverCompare(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const [main, pre] = v.split("-");
    const [major, minor, patch] = main.split(".").map(Number);
    return { major, minor, patch, pre };
  };

  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  if (va.patch !== vb.patch) return va.patch - vb.patch;

  // Prerelease comparison (simplified)
  if (va.pre && !vb.pre) return -1;
  if (!va.pre && vb.pre) return 1;
  if (va.pre && vb.pre) return va.pre.localeCompare(vb.pre);

  return 0;
}

function manualSatisfiesCaret(version: string, range: string): boolean {
  const [major, minor, patch] = version.split(".").map(Number);
  const rangeMatch = range.match(/\^(\d+)\.(\d+)\.(\d+)/);
  if (!rangeMatch) return false;

  const [, rMajor, rMinor, rPatch] = rangeMatch.map(Number);

  if (major !== rMajor) return false;
  if (rMajor === 0) {
    if (minor !== rMinor) return false;
    return patch >= rPatch;
  }
  if (minor < rMinor) return false;
  if (minor === rMinor && patch < rPatch) return false;
  return true;
}

group("Bun.semver vs Manual JS Implementation", () => {
  bench("Bun.semver.order (simple)", () => {
    for (const [a, b] of simpleVersions) {
      Bun.semver.order(a, b);
    }
  });

  bench("Manual JS compare (simple)", () => {
    for (const [a, b] of simpleVersions) {
      manualSemverCompare(a, b);
    }
  });

  bench("Bun.semver.satisfies (caret)", () => {
    Bun.semver.satisfies("1.5.0", "^1.0.0");
    Bun.semver.satisfies("1.9.9", "^1.0.0");
    Bun.semver.satisfies("2.0.0", "^1.0.0");
  });

  bench("Manual JS satisfies (caret)", () => {
    manualSatisfiesCaret("1.5.0", "^1.0.0");
    manualSatisfiesCaret("1.9.9", "^1.0.0");
    manualSatisfiesCaret("2.0.0", "^1.0.0");
  });
});

// Run benchmarks
await run({
  colors: true,
  percentiles: true,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Summary Table
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log(`\n${bold}Bun.semver API Reference${reset}\n`);

const apiRef = [
  {
    Method: `${green}Bun.semver.order(v1, v2)${reset}`,
    Returns: "number",
    Description: "Compare two versions: -1 (v1 < v2), 0 (equal), 1 (v1 > v2)",
  },
  {
    Method: `${blue}Bun.semver.satisfies(ver, range)${reset}`,
    Returns: "boolean",
    Description: "Check if version satisfies a semver range",
  },
];

console.log(Bun.inspect.table(apiRef, { colors: true }));

console.log(`\n${bold}Supported Range Syntax${reset}\n`);

const rangeRef = [
  { Syntax: `${cyan}^1.2.3${reset}`, Name: "Caret", Matches: ">=1.2.3 <2.0.0 (compatible changes)" },
  { Syntax: `${cyan}~1.2.3${reset}`, Name: "Tilde", Matches: ">=1.2.3 <1.3.0 (patch-level changes)" },
  { Syntax: `${cyan}1.2.x${reset}`, Name: "X-Range", Matches: ">=1.2.0 <1.3.0" },
  { Syntax: `${cyan}*${reset}`, Name: "Any", Matches: ">=0.0.0 (any version)" },
  { Syntax: `${cyan}1.0.0 - 2.0.0${reset}`, Name: "Hyphen", Matches: ">=1.0.0 <=2.0.0" },
  { Syntax: `${cyan}>=1.0.0 <2.0.0${reset}`, Name: "Comparators", Matches: "Explicit range" },
  { Syntax: `${cyan}^1.0.0 || ^2.0.0${reset}`, Name: "OR", Matches: "Either range matches" },
];

console.log(Bun.inspect.table(rangeRef, { colors: true }));

console.log(`\n${bold}Version Precedence Rules${reset}`);
console.log(`${dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
console.log(`  ${orange}1.0.0-alpha${reset} < ${orange}1.0.0-alpha.1${reset} < ${orange}1.0.0-beta${reset} < ${orange}1.0.0-rc.1${reset} < ${green}1.0.0${reset}`);
console.log(`  ${dim}Build metadata (+build) is ignored in precedence${reset}\n`);
