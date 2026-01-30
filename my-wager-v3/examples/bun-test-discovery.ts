#!/usr/bin/env bun
// Bun Test Discovery Demo
// Demonstrates position arguments as filters and test discovery features

// Make this a module
export {};

import { $ } from 'bun';

console.log('🔍 Bun Test Discovery Demo');
console.log('========================\n');

// Create test directory structure
console.log('📁 Creating test directory structure...');

await $`mkdir -p examples/test-discovery/{utils,components,integration}`.quiet();

// Create various test files
const testFiles = [
  {
    path: 'examples/test-discovery/utils/math.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Math Utils', () => {
  describe('addition', () => {
    it('should add two positive numbers', () => {
      expect(2 + 2).toBe(4);
    });

    it('should add negative numbers', () => {
      expect(-2 + -3).toBe(-5);
    });
  });

  describe('subtraction', () => {
    it('should subtract correctly', () => {
      expect(10 - 5).toBe(5);
    });
  });
});`
  },
  {
    path: 'examples/test-discovery/utils/string.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('String Utils', () => {
  it('should concatenate strings', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });

  it('should get string length', () => {
    expect('test'.length).toBe(4);
  });
});`
  },
  {
    path: 'examples/test-discovery/components/button.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Button Component', () => {
  it('should render with text', () => {
    const button = { text: 'Click me', onClick: () => {} };
    expect(button.text).toBe('Click me');
  });

  it('should handle click events', () => {
    let clicked = false;
    const button = { text: 'Click', onClick: () => { clicked = true; } };
    button.onClick();
    expect(clicked).toBe(true);
  });
});`
  },
  {
    path: 'examples/test-discovery/integration/api.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('API Integration', () => {
  it('should fetch user data', async () => {
    // Mock API call
    const userData = { id: 1, name: 'John Doe' };
    expect(userData.id).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    // Mock error handling
    const error = new Error('API Error');
    expect(error.message).toBe('API Error');
  });
});`
  },
  {
    path: 'examples/test-discovery/performance.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Performance Tests', () => {
  it('should complete operations quickly', () => {
    const start = performance.now();
    // Simulate work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);
  });
});`
  }
];

// Write test files
for (const file of testFiles) {
  await Bun.write(file.path, file.content);
}

console.log('✅ Created 5 test files in different directories\n');

// Demonstrate test discovery patterns
console.log('📋 Test Discovery Examples:\n');

console.log('1️⃣ Run all tests:');
console.log('   bun test\n');

console.log('\n2️⃣ Filter by directory (position argument):');
console.log('   bun test utils');
console.log('   → Runs: math.test.ts, string.test.ts\n');

console.log('\n3️⃣ Filter by specific file:');
console.log('   bun test examples/test-discovery/utils/math.test.ts');
console.log('   → Runs only math tests\n');

console.log('\n4️⃣ Filter by test name pattern:');
console.log('   bun test --test-name-pattern addition');
console.log('   → Runs all tests with "addition" in the name\n');

console.log('\n5️⃣ Multiple filters:');
console.log('   bun test utils components');
console.log('   → Runs tests in both utils and components directories\n');

console.log('\n6️⃣ Wildcard patterns:');
console.log('   bun test **/*.test.ts');
console.log('   → Runs all .test.ts files recursively\n');

// Actually run some examples to demonstrate
console.log('\n🚀 Running Examples:\n');

console.log('\n--- Running tests in "utils" directory ---');
await $`bun test examples/test-discovery/utils`.quiet();

console.log('\n--- Running tests with "addition" in name ---');
await $`bun test examples/test-discovery --test-name-pattern addition`.quiet();

console.log('\n--- Running specific test file ---');
await $`bun test examples/test-discovery/performance.test.ts`.quiet();

// Show bunfig.toml configuration
console.log('\n⚙️  Configuration Options (bunfig.toml):');
console.log(`
[test]
# Change root directory for tests
root = "src"

# Test timeout in milliseconds
timeout = 5000

# Exclude patterns
exclude = ["*.spec.ts", "node_modules/**"]

# Include patterns (overrides exclude)
include = ["**/*.test.ts", "**/*.spec.js"]

# Run tests in parallel (default: true)
parallel = true

# Test reporter
reporter = "verbose" # "verbose", "dot", "bunit", "tap"
`);

// Advanced filtering examples
console.log('\n🎯 Advanced Filtering Examples:');

console.log('\n7️⃣ Filter by multiple patterns:');
console.log('   bun test --test-name-pattern "addition|subtraction"');
console.log('   → Runs tests matching either pattern\n');

console.log('\n8️⃣ Exclude tests:');
console.log('   bun test --exclude "integration"');
console.log('   → Excludes integration tests\n');

console.log('\n9️⃣ Run only changed files (with git):');
console.log('   bun test $(git diff --name-only --diff-filter=ACM | grep "\\.test\\.")');
console.log('   → Runs only tests in changed files\n');

console.log('\n🔍 Discovery Rules:');
console.log('• Default: scans **/*.{test,spec}.{js,ts,jsx,tsx}');
console.log('• Excludes: node_modules, .git, dist, build');
console.log('• Position arguments act as filters');
console.log('• Filters match file paths and directory names');
console.log('• Use --test-name-pattern for test name filtering');

// Cleanup
console.log('\n🧹 Cleaning up demo files...');
await $`rm -rf examples/test-discovery`.quiet();

console.log('\n✅ Test discovery demo complete!');
console.log('\n💡 Pro Tips:');
console.log('• Use descriptive directory names for better filtering');
console.log('• Group related tests in subdirectories');
console.log('• Use --test-name-pattern for focused testing');
console.log('• Configure bunfig.toml for project-specific settings');
