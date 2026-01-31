#!/usr/bin/env bun
/**
 * Quick Bun Test Options Reference
 * Fast lookup for common test options
 */

const testOptions = {
  timeout: {
    description: "Set test timeout (glows yellow in help)",
    usage: "--timeout <ms> or --timeout-secs <secs>",
    examples: [
      "bun test --timeout 5000",
      "bun test --timeout-secs 10",
      "bun test --timeout 0 (disable)"
    ]
  },
  coverage: {
    description: "Enable code coverage reporting",
    usage: "--coverage [--coverage-reporter <type>]",
    examples: [
      "bun test --coverage",
      "bun test --coverage --coverage-reporter html",
      "bun test --coverage --coverage-reporter lcov > cov.lcov"
    ]
  },
  rerun: {
    description: "Rerun each test N times (Bun 1.3+)",
    usage: "--rerun-each <n>",
    examples: [
      "bun test --rerun-each 3",
      "bun test --rerun-each 5 --coverage"
    ]
  },
  bail: {
    description: "Stop on first failure",
    usage: "--bail",
    examples: [
      "bun test --bail",
      "bun test --bail --coverage"
    ]
  },
  only: {
    description: "Run only tests with .only",
    usage: "--only",
    examples: [
      "bun test --only",
      "bun test --only --verbose"
    ]
  },
  watch: {
    description: "Watch mode for auto-rerun",
    usage: "--watch",
    examples: [
      "bun test --watch",
      "bun test --watch --coverage"
    ]
  }
};

console.log("🧪 Bun Test Options Quick Reference");
console.log("==================================\n");

for (const [option, info] of Object.entries(testOptions)) {
  console.log(`⚡ ${option.toUpperCase()}`);
  console.log(`   Description: ${info.description}`);
  console.log(`   Usage: bun test ${info.usage}`);
  console.log(`   Examples:`);
  info.examples.forEach(ex => console.log(`     ${ex}`));
  console.log("");
}

console.log("💡 Pro Tips:");
console.log("============");
console.log("• Timeout options glow yellow in --help output");
console.log("• Use --run-in-band for accurate performance testing");
console.log("• Combine options: bun test --coverage --bail --timeout 10000");
console.log("• Version-locked options: rg -f .options.index '1.3'");
console.log("");
console.log("📚 Full guide: BUN-TEST-OPTIONS-GUIDE.md");
