#!/usr/bin/env bun
/**
 * Bun Test Options Explorer
 * Demonstrates various test options including timeout, coverage, and version-specific features
 */

// Make this file a module to allow top-level await
export {};

console.log("🧪 Bun Test Options Explorer");
console.log("============================\n");

// Test timeout configuration
console.log("⏱️  Timeout Options:");
console.log("------------------");
console.log("Usage: bun test [--timeout <ms>] [--timeout-secs <secs>]");
console.log("");
console.log("Examples:");
console.log("  bun test --timeout 5000        # 5 second timeout");
console.log("  bun test --timeout-secs 10     # 10 second timeout");
console.log("  bun test --timeout 0           # Disable timeout");
console.log("");
console.log("Default timeout: 5 seconds (5000ms)");
console.log("Timeout options glow yellow in help text");

// Test coverage configuration
console.log("\n📊 Coverage Options:");
console.log("-------------------");
console.log("Usage: bun test --coverage [--coverage-reporter <type>]");
console.log("");
console.log("Coverage reporters:");
console.log("  - text (default)");
console.log("  - html");
console.log("  - lcov");
console.log("  - json");
console.log("");
console.log("Examples:");
console.log("  bun test --coverage");
console.log("  bun test --coverage --coverage-reporter html");
console.log("  bun test --coverage --coverage-reporter lcov > coverage.lcov");

// Version-locked options
console.log("\n🔒 Version-Locked Options (Bun 1.3):");
console.log("------------------------------------");
console.log("These options are specific to Bun version 1.3.x:");
console.log("");
console.log("Test-related options:");
console.log("  --rerun-each          # Rerun each test N times");
console.log("  --bail                # Stop on first failure");
console.log("  --only                # Run only tests with .only");
console.log("  --skip                # Skip tests with .skip");
console.log("  --todo                # Run tests with .todo");
console.log("");
console.log("Performance options:");
console.log("  --preload             # Preload modules before tests");
console.log("  --run-in-band         # Run tests in serial (not parallel)");
console.log("  --watch               # Watch mode for test changes");

// Create example test files to demonstrate options
console.log("\n📝 Creating Example Test Files...");
console.log("==================================");

// Basic test with timeout
const basicTest = `import { test, expect } from "bun:test";

test("basic test with timeout", async () => {
  // This test will fail if it takes longer than 2 seconds
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(true).toBe(true);
}, {
  timeout: 2000 // Override default timeout for this test
});

test("slow test", async () => {
  // This test uses the global timeout setting
  await new Promise(resolve => setTimeout(resolve, 3000));
  expect(true).toBe(true);
});
`;

await Bun.write("./test/basic.test.ts", basicTest);
console.log("✓ Created test/basic.test.ts");

// Test with coverage
const coverageTest = `import { test, expect } from "bun:test";

function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

function multiply(a: number, b: number): number {
  return a * b;
}

// This function is NOT tested (will show in coverage report)
function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

test("add function", () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
});

test("subtract function", () => {
  expect(subtract(5, 3)).toBe(2);
  expect(subtract(0, 5)).toBe(-5);
});

test("multiply function", () => {
  expect(multiply(3, 4)).toBe(12);
  expect(multiply(-2, 3)).toBe(-6);
});

// Test with .only (will run only this test)
test.only("exclusive test", () => {
  expect(true).toBe(true);
});

// Test with .skip (will be skipped)
test.skip("skipped test", () => {
  expect(false).toBe(true);
});

// Test with .todo (marked as TODO)
test.todo("feature not implemented", () => {
  // This test is expected to fail
  expect(false).toBe(true);
});
`;

await Bun.write("./test/coverage.test.ts", coverageTest);
console.log("✓ Created test/coverage.test.ts");

// Performance test
const perfTest = `import { test, expect, describe } from "bun:test";

describe("performance tests", () => {
  test("array operations", () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);

    // Test map performance
    const start = performance.now();
    const mapped = arr.map(x => x * 2);
    const end = performance.now();

    expect(mapped.length).toBe(1000);
    expect(end - start).toBeLessThan(10); // Should complete in < 10ms
  });

  test("async operations", async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      Promise.resolve(i)
    );

    const results = await Promise.all(promises);
    expect(results.length).toBe(100);
  });
});
`;

await Bun.write("./test/performance.test.ts", perfTest);
console.log("✓ Created test/performance.test.ts");

// Create test configuration
const testConfig = `{
  "test": {
    "timeout": 5000,
    "coverage": {
      "reporter": ["text", "html"],
      "threshold": {
        "global": {
          "branches": 80,
          "functions": 80,
          "lines": 80,
          "statements": 80
        }
      }
    }
  }
}`;

await Bun.write("./test.config.json", testConfig);
console.log("✓ Created test.config.json");

// Create a script to run various test commands
const runScript = `#!/bin/bash

echo "🧪 Running Bun Test Demonstrations"
echo "================================="
echo ""

echo "1️⃣  Basic test run:"
echo "   bun test"
echo ""

echo "2️⃣  Test with custom timeout:"
echo "   bun test --timeout 10000"
echo ""

echo "3️⃣  Test with coverage:"
echo "   bun test --coverage"
echo ""

echo "4️⃣  Test with HTML coverage report:"
echo "   bun test --coverage --coverage-reporter html"
echo ""

echo "5️⃣  Run only tests with .only:"
echo "   bun test --only"
echo ""

echo "6️⃣  Run tests in serial (not parallel):"
echo "   bun test --run-in-band"
echo ""

echo "7️⃣  Rerun each test 3 times:"
echo "   bun test --rerun-each 3"
echo ""

echo "8️⃣  Stop on first failure:"
echo "   bun test --bail"
echo ""

echo "9️⃣  Watch mode (auto-rerun on changes):"
echo "   bun test --watch"
echo ""

echo "🔟   Run with preload:"
echo "   bun test --preload ./test/setup.ts"
echo ""

echo "📊 Check coverage threshold:"
echo "   bun test --coverage --coverage-threshold 80"
echo ""

echo "📋 Show all test options:"
echo "   bun test --help | grep -E '(timeout|coverage|rerun|bail|only|skip|todo)'"
echo ""

echo "✨ Happy testing! ✨"
`;

await Bun.write("./run-tests.sh", runScript);
console.log("✓ Created run-tests.sh");

// Make the script executable
await Bun.$`chmod +x ./run-tests.sh`;

console.log("\n📋 Summary of Created Files:");
console.log("===========================");
console.log("  test/basic.test.ts      - Basic tests with timeout");
console.log("  test/coverage.test.ts   - Tests for coverage demo");
console.log("  test/performance.test.ts - Performance benchmarks");
console.log("  test.config.json        - Test configuration");
console.log("  run-tests.sh            - Script to run test demonstrations");

console.log("\n💡 Quick Start:");
console.log("==============");
console.log("  ./run-tests.sh    # See all test command examples");
console.log("  bun test --help  # Show all available options");

console.log("\n🎯 Key Options Highlight:");
console.log("========================");
console.log("  ⏱️  --timeout <ms>      | Set test timeout (glows yellow)");
console.log("  📊 --coverage          | Enable code coverage");
console.log("  🔒 --rerun-each <n>    | Version 1.3+ feature");
console.log("  🛑 --bail              | Stop on first failure");
console.log("  👁️  --watch             | Watch for changes");

console.log("\n✨ Test explorer ready! ✨");
