#!/usr/bin/env bun
// Practical Test Discovery Examples
// Real-world scenarios for using Bun's test discovery

// Make this a module
export {};

import { $ } from 'bun';

console.log('🎯 Practical Test Discovery Examples');
console.log('==================================\n');

// Example 1: Run tests for specific module
console.log('1️⃣ Module-specific testing:');
console.log('   # Test only color module');
console.log('   bun test color');
console.log('   # Test only database-related tests');
console.log('   bun test database');
console.log('   # Test MCP server functionality');
console.log('   bun test mcp\n');

// Example 2: CI/CD pipeline stages
console.log('2️⃣ CI/CD Pipeline Stages:');
console.log('   # Stage 1: Unit tests only');
console.log('   bun test --test-name-pattern "unit|test" --exclude integration');
console.log('   # Stage 2: Integration tests');
console.log('   bun test integration');
console.log('   # Stage 3: E2E tests');
console.log('   bun test e2e --timeout 30000\n');

// Example 3: Performance testing
console.log('3️⃣ Performance Testing:');
console.log('   # Run only performance benchmarks');
console.log('   bun test performance --test-name-pattern "benchmark|perf"');
console.log('   # Run with increased timeout for slow tests');
console.log('   bun test performance --timeout 60000\n');

// Example 4: Development workflow
console.log('4️⃣ Development Workflow:');
console.log('   # Run tests for current feature');
console.log('   bun test features/auth');
console.log('   # Run tests you just modified');
console.log('   bun test $(git diff --name-only HEAD~1 | grep "\\.test\\.")');
console.log('   # Run related tests when fixing a bug');
console.log('   bun test --test-name-pattern "bug|fix"\n');

// Example 5: Pre-commit hooks
console.log('5️⃣ Pre-commit Hooks:');
console.log('   # Quick test run before commit');
console.log('   bun test --reporter=dot');
console.log('   # Only run changed tests');
console.log('   bun test --bail $(git diff --cached --name-only | grep "\\.test\\.")\n');

// Example 6: Debugging specific tests
console.log('6️⃣ Debugging Tests:');
console.log('   # Run single test file with verbose output');
console.log('   bun test specific-test.test.ts --reporter=verbose');
console.log('   # Run tests matching pattern');
console.log('   bun test --test-name-pattern "should.*error"');
console.log('   # Run with Node inspector');
console.log('   bun test --inspect-brk debug-test.test.ts\n');

// Example 7: Matrix testing
console.log('7️⃣ Matrix Testing:');
console.log('   # Test different configurations');
console.log('   NODE_ENV=test bun test --test-name-pattern config');
console.log('   # Test with different databases');
console.log('   DB=sqlite bun test --test-name-pattern database');
console.log('   # Test with feature flags');
console.log('   FEATURE_FLAG=new-ui bun test --test-name-pattern ui\n');

// Example 8: Coverage reporting
console.log('8️⃣ Coverage Reporting:');
console.log('   # Generate coverage for specific modules');
console.log('   bun test --coverage src/utils');
console.log('   # Coverage with thresholds');
console.log('   bun test --coverage --coverage-thresholds 80');
console.log('   # Coverage report in HTML');
console.log('   bun test --coverage --coverage-reporter=html\n');

// Create a sample bunfig.toml for the project
console.log('9️⃣ Sample bunfig.toml Configuration:');
console.log(`
[test]
# Test configuration for Tension Field System
root = "src"
timeout = 5000
parallel = true
reporter = "verbose"

# Include all test files
include = [
  "**/*.test.ts",
  "**/*.test.js",
  "**/*.spec.ts",
  "**/*.spec.js"
]

# Exclude dependencies and build artifacts
exclude = [
  "node_modules/**",
  "dist/**",
  "build/**",
  ".next/**",
  "coverage/**"
]

# Environment variables for tests
preload = ["./test/setup.ts"]

# Coverage configuration
[coverage]
thresholds = {
  statements = 80,
  branches = 75,
  functions = 80,
  lines = 80
}
reporter = ["text", "html"]
`);

// Example 10: Test scripts for package.json
console.log('📦 Package.json Test Scripts:');
console.log(`
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test --test-name-pattern unit --exclude integration",
    "test:integration": "bun test integration",
    "test:e2e": "bun test e2e --timeout 30000",
    "test:performance": "bun test performance --test-name-pattern benchmark",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage --coverage-thresholds 80",
    "test:ci": "bun test --reporter=tap --bail",
    "test:changed": "bun test $(git diff --name-only HEAD~1 | grep '\\.test\\.')",
    "test:debug": "bun test --inspect-brk"
  }
}
`);

// Show actual usage with existing tests
console.log('🔍 Current Project Test Structure:');
console.log('');

// Find and display test files
const findTests = await $`find . -name "*.test.ts" -o -name "*.test.js" | head -10`.text();
if (findTests.trim()) {
  console.log('Found test files:');
  findTests.split('\n').filter(f => f.trim()).forEach(file => {
    console.log(`  ${file}`);
  });
  
  console.log('\nExample commands for this project:');
  console.log('  bun test src/__tests__          # Run all src tests');
  console.log('  bun test --test-name-pattern mcp  # Run MCP-related tests');
  console.log('  bun test examples               # Run example tests');
} else {
  console.log('No test files found in current directory');
}

console.log('\n✅ Practical test discovery examples complete!');
console.log('\n💡 Key Takeaways:');
console.log('• Position arguments provide powerful filtering');
console.log('• Combine filters for precise test selection');
console.log('• Use bunfig.toml for project-wide defaults');
console.log('• Integrate with git for efficient workflows');
console.log('• Leverage test name patterns for focused testing');
