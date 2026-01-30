#!/usr/bin/env bun
// Working Test Pattern Demo
// Demonstrating actual pattern matching that works

// Make this a module
export {};

import { $ } from 'bun';

console.log('🎯 Working Test Pattern Demo');
console.log('==========================\n');

// Create test files with matching patterns
await $`mkdir -p examples/pattern-demo`.quiet();

const testFiles = [
  {
    name: 'bug-fix.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('bug fix', () => {
  it('should fix the issue', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'memory-bug.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('memory bug', () => {
  it('should not leak memory', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'performance-fix.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('performance fix', () => {
  it('should be faster', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'regression-test.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('regression test', () => {
  it('should not regress', () => {
    expect(true).toBe(true);
  });
});`
  },
  {
    name: 'new-feature.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('new feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});`
  }
];

// Write test files
for (const file of testFiles) {
  await Bun.write(`examples/pattern-demo/${file.name}`, file.content);
}

console.log(`✅ Created ${testFiles.length} test files\n`);

// Test pattern matching
console.log('📋 Testing Pattern Matching:');
console.log('─'.repeat(40));

// Pattern 1: "bug"
console.log('\n1️⃣ Pattern: "bug"');
console.log('$ bun test examples/pattern-demo --test-name-pattern "bug"');
const bugResult = await $`bun test examples/pattern-demo --test-name-pattern "bug"`.text();
console.log(bugResult);

// Pattern 2: "fix"
console.log('\n2️⃣ Pattern: "fix"');
console.log('$ bun test examples/pattern-demo --test-name-pattern "fix"');
const fixResult = await $`bun test examples/pattern-demo --test-name-pattern "fix"`.text();
console.log(fixResult);

// Pattern 3: "bug|fix" (OR pattern)
console.log('\n3️⃣ Pattern: "bug|fix"');
console.log('$ bun test examples/pattern-demo --test-name-pattern "bug|fix"');
const bugOrFixResult = await $`bun test examples/pattern-demo --test-name-pattern "bug|fix"`.text();
console.log(bugOrFixResult);

// Pattern 4: "performance"
console.log('\n4️⃣ Pattern: "performance"');
console.log('$ bun test examples/pattern-demo --test-name-pattern "performance"');
const perfResult = await $`bun test examples/pattern-demo --test-name-pattern "performance"`.text();
console.log(perfResult);

// Pattern 5: "regression"
console.log('\n5️⃣ Pattern: "regression"');
console.log('$ bun test examples/pattern-demo --test-name-pattern "regression"');
const regressionResult = await $`bun test examples/pattern-demo --test-name-pattern "regression"`.text();
console.log(regressionResult);

// Pattern 6: "feature"
console.log('\n6️⃣ Pattern: "feature"');
console.log('$ bun test examples/pattern-demo --test-name-pattern "feature"');
const featureResult = await $`bun test examples/pattern-demo --test-name-pattern "feature"`.text();
console.log(featureResult);

// Show summary
console.log('\n📊 Pattern Matching Summary:');
console.log('─'.repeat(30));
console.log('• "bug"      → Matches: bug-fix.test.ts, memory-bug.test.ts');
console.log('• "fix"      → Matches: bug-fix.test.ts, performance-fix.test.ts');
console.log('• "bug|fix"  → Matches: All bug and fix related tests');
console.log('• "performance" → Matches: performance-fix.test.ts');
console.log('• "regression" → Matches: regression-test.test.ts');
console.log('• "feature"  → Matches: new-feature.test.ts');

// Git integration example
console.log('\n🔄 Git Integration Example:');
console.log('─'.repeat(30));
console.log(`
# After fixing bugs, run only bug-related tests:
bun test --test-name-pattern "bug|fix"

# After performance optimization:
bun test --test-name-pattern "performance"

# Before releasing (regression check):
bun test --test-name-pattern "regression"

# Testing new features:
bun test --test-name-pattern "feature"

# Combining with git diff:
bun test $(git diff --name-only HEAD~1 | grep "\.test\\.") --test-name-pattern "bug|fix"
`);

// Cleanup
console.log('\n🧹 Cleaning up...');
await $`rm -rf examples/pattern-demo`.quiet();

console.log('\n✅ Pattern matching demo complete!');
console.log('\n💡 Key Points:');
console.log('• Patterns match against test descriptions (describe blocks)');
console.log('• Use | for OR logic in patterns');
console.log('• Patterns are case-sensitive by default');
console.log('• Combine with file paths for precise control');
