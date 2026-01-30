#!/usr/bin/env bun
// Test Discovery Commands - Direct Demonstration
// Showing the specific commands you requested

// Make this a module
export {};

import { $ } from 'bun';

console.log('🎯 Test Discovery Commands - Direct Demo');
console.log('=====================================\n');

// Create test files with different patterns
console.log('📁 Creating test files with various patterns...');

await $`mkdir -p examples/test-commands`.quiet();

const testFiles = [
  {
    name: 'bug-fix-memory-leak.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Bug Fix - Memory Leak', () => {
  it('should fix memory allocation bug', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'bug-fix-race-condition.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Bug Fix - Race Condition', () => {
  it('should fix concurrency bug', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'performance-regression-fix.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Performance Regression Fix', () => {
  it('should fix slow query bug', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'feature-new-cache.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Feature - New Cache', () => {
  it('should implement caching', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'integration-api.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Integration - API', () => {
  it('should integrate with external API', () => {
    expect(true).toBe(true);
  });
});`
  }
];

// Write test files
for (const file of testFiles) {
  await Bun.write(`examples/test-commands/${file.name}`, file.content);
}

console.log(`✅ Created ${testFiles.length} test files\n`);

// Command 1: Pattern matching for bug/fix
console.log('📋 Command 1: bun test --test-name-pattern "bug|fix"');
console.log('─'.repeat(50));
console.log('$ bun test --test-name-pattern "bug|fix"\n');

const patternResult = await $`bun test examples/test-commands --test-name-pattern "bug|fix"`.text();
console.log(patternResult);

// Command 2: Multiple patterns
console.log('\n📋 Command 2: Multiple patterns (performance|regression)');
console.log('─'.repeat(50));
console.log('$ bun test --test-name-pattern "performance|regression"\n');

const perfResult = await $`bun test examples/test-commands --test-name-pattern "performance|regression"`.text();
console.log(perfResult);

// Command 3: Feature pattern
console.log('\n📋 Command 3: Feature pattern');
console.log('─'.repeat(50));
console.log('$ bun test --test-name-pattern "feature"\n');

const featureResult = await $`bun test examples/test-commands --test-name-pattern "feature"`.text();
console.log(featureResult);

// Command 4: Integration pattern
console.log('\n📋 Command 4: Integration pattern');
console.log('─'.repeat(50));
console.log('$ bun test --test-name-pattern "integration"\n');

const integrationResult = await $`bun test examples/test-commands --test-name-pattern "integration"`.text();
console.log(integrationResult);

// Show git diff simulation
console.log('\n📋 Command 5: Simulating git diff for changed files');
console.log('─'.repeat(50));
console.log('# When you have changed test files in git:\n');
console.log('$ git diff --name-only HEAD~1 | grep "\.test\."');
console.log('bug-fix-memory-leak.test.ts');
console.log('performance-regression-fix.test.ts\n');
console.log('# Then run tests only on changed files:');
console.log('$ bun test $(git diff --name-only HEAD~1 | grep "\.test\.")');
console.log('# This would run only the 2 changed test files\n');

// Show practical combinations
console.log('🎯 Practical Command Combinations:');
console.log('─'.repeat(40));

console.log(`
# During bug fixing:
bun test --test-name-pattern "bug|fix"

# After performance optimization:
bun test --test-name-pattern "performance|perf|benchmark"

# Testing new features:
bun test --test-name-pattern "feature|new"

# Regression testing:
bun test --test-name-pattern "regression|fix"

# Combined with file filtering:
bun test examples/test-commands --test-name-pattern "bug|fix"

# Exclude certain patterns:
bun test --test-name-pattern ".*" --exclude "integration"

# Multiple specific patterns:
bun test --test-name-pattern "memory|race|concurrency"
`);

// Advanced regex patterns
console.log('\n🔍 Advanced Regex Patterns:');
console.log('─'.repeat(30));

console.log(`
# Tests starting with "bug":
bun test --test-name-pattern "^bug"

# Tests ending with "fix":
bun test --test-name-pattern "fix$"

# Tests with "memory" OR "leak":
bun test --test-name-pattern "memory|leak"

# Tests with "bug" followed by anything then "fix":
bun test --test-name-pattern "bug.*fix"

# Case-insensitive matching (using -i flag in some shells):
bun test --test-name-pattern "[Bb]ug|[Ff]ix"
`);

// Cleanup
console.log('\n🧹 Cleaning up...');
await $`rm -rf examples/test-commands`.quiet();

console.log('\n✅ Test discovery commands demo complete!');
console.log('\n💡 Remember:');
console.log('• Use --test-name-pattern for flexible test filtering');
console.log('• Combine with git diff for efficient testing');
console.log('• Patterns support full regex syntax');
console.log('• Chain multiple patterns with | (OR)');
