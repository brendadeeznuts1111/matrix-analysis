#!/usr/bin/env bun
// Advanced Test Discovery - Git Integration & Pattern Matching
// Demonstrating the specific commands you requested

// Make this a module
export {};

import { $ } from 'bun';

console.log('🎯 Advanced Test Discovery - Git & Pattern Matching');
console.log('==================================================\n');

// Create sample test files to demonstrate
console.log('📁 Creating test scenarios...');

await $`mkdir -p examples/advanced-tests/{bug-fixes,features,regression}`.quiet();

// Bug fix tests
const bugFixTests = [
  {
    path: 'examples/advanced-tests/bug-fixes/memory-leak-fix.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Memory Leak Bug Fix', () => {
  it('should not leak memory on repeated operations', () => {
    const items: any[] = [];
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate operations
    for (let i = 0; i < 1000; i++) {
      items.push({ id: i, data: new Array(100).fill(0) });
    }
    
    // Clear items
    items.length = 0;
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (< 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });
  
  it('should fix buffer overflow bug', () => {
    const buffer = new ArrayBuffer(100);
    const view = new DataView(buffer);
    
    // This should not throw after fix
    expect(() => {
      view.setUint8(99, 255);
    }).not.toThrow();
  });
});`
  },
  {
    path: 'examples/advanced-tests/bug-fixes/race-condition-fix.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Race Condition Bug Fix', () => {
  it('should handle concurrent access safely', async () => {
    let counter = 0;
    const promises = [];
    
    // Simulate concurrent operations
    for (let i = 0; i < 100; i++) {
      promises.push(
        new Promise(resolve => {
          setTimeout(() => {
            counter++;
            resolve(counter);
          }, Math.random() * 10);
        })
      );
    }
    
    await Promise.all(promises);
    expect(counter).toBe(100);
  });
});`
  }
];

// Feature tests
const featureTests = [
  {
    path: 'examples/advanced-tests/features/new-cache-feature.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('New Cache Feature', () => {
  it('should cache results efficiently', () => {
    const cache = new Map();
    const expensiveOperation = (n: number) => n * n;
    
    // First call
    const result1 = cache.get(1) || expensiveOperation(1);
    cache.set(1, result1);
    
    // Second call (cached)
    const result2 = cache.get(1) || expensiveOperation(1);
    
    expect(result1).toBe(result2);
    expect(result1).toBe(1);
  });
});`
  }
];

// Regression tests
const regressionTests = [
  {
    path: 'examples/advanced-tests/regression/performance-regression.test.ts',
    content: `import { describe, it, expect } from 'bun:test';

describe('Performance Regression Tests', () => {
  it('should maintain sorting performance', () => {
    const data = Array.from({ length: 10000 }, (_, i) => Math.random());
    
    const start = performance.now();
    data.sort();
    const duration = performance.now() - start;
    
    // Should sort in under 100ms
    expect(duration).toBeLessThan(100);
  });
});`
  }
];

// Write all test files
[...bugFixTests, ...featureTests, ...regressionTests].forEach(file => {
  Bun.write(file.path, file.content);
});

console.log('✅ Created test files for demonstration\n');

// Initialize git repo if not exists
await $`git init examples/advanced-tests`.quiet().catch(() => {});
await $`cd examples/advanced-tests && git add . && git commit -m "Initial test commit" 2>/dev/null`.quiet().catch(() => {});

// Demonstrate Command 1: Test changed files
console.log('📋 Command 1: bun test $(git diff --name-only HEAD~1 | grep "\.test\\.")');
console.log('─'.repeat(60));

// Make a change to simulate file modification
await Bun.write(
  'examples/advanced-tests/bug-fixes/memory-leak-fix.test.ts',
  bugFixTests[0].content.replace('expect(memoryIncrease).toBeLessThan(1024 * 1024);', 
                               'expect(memoryIncrease).toBeLessThan(512 * 1024); // Tighter limit')
);

// Stage the change
await $`cd examples/advanced-tests && git add -A && git commit -m "Fix memory leak test threshold" 2>/dev/null`.quiet().catch(() => {});

// Show what files changed
const changedFiles = await $`cd examples/advanced-tests && git diff --name-only HEAD~1 HEAD | grep "\.test\\." || echo "No .test files changed"`.text();
console.log('Changed test files:');
if (changedFiles.trim() && changedFiles !== 'No .test files changed') {
  changedFiles.split('\n').filter(f => f.trim()).forEach(file => {
    console.log(`  📝 ${file}`);
  });
  
  console.log('\nRunning tests on changed files:');
  // Simulate running tests on changed files
  const testCommand = `cd examples/advanced-tests && bun test $(git diff --name-only HEAD~1 HEAD | grep "\.test\\." || echo "no-files")`;
  console.log(`$ ${testCommand}`);
  
  // Execute the command
  const result = await $`cd examples/advanced-tests && bun test $(git diff --name-only HEAD~1 HEAD | grep "\.test\\." || echo "no-files")`.text();
  console.log(result);
} else {
  console.log('  No test files changed in last commit');
}

// Demonstrate Command 2: Test by pattern matching
console.log('\n📋 Command 2: bun test --test-name-pattern "bug|fix"');
console.log('─'.repeat(60));

console.log('Running tests matching "bug|fix" pattern:');
console.log('$ bun test --test-name-pattern "bug|fix"');

// Execute pattern-based test
const patternResult = await $`cd examples/advanced-tests && bun test --test-name-pattern "bug|fix"`.text();
console.log(patternResult);

// Show additional pattern examples
console.log('\n🎯 Additional Pattern Examples:');
console.log('─'.repeat(40));

console.log('\n1️⃣ Test with "regression" pattern:');
console.log('$ bun test --test-name-pattern "regression"');
const regressionResult = await $`cd examples/advanced-tests && bun test --test-name-pattern "regression"`.text();
console.log(regressionResult);

console.log('\n2️⃣ Test with "cache" pattern:');
console.log('$ bun test --test-name-pattern "cache"');
const cacheResult = await $`cd examples/advanced-tests && bun test --test-name-pattern "cache"`.text();
console.log(cacheResult);

console.log('\n3️⃣ Test with "performance|memory" pattern (OR):');
console.log('$ bun test --test-name-pattern "performance|memory"');
const perfResult = await $`cd examples/advanced-tests && bun test --test-name-pattern "performance|memory"`.text();
console.log(perfResult);

// Show practical usage scenarios
console.log('\n💡 Practical Usage Scenarios:');
console.log('─'.repeat(40));

console.log(`
🔧 Before committing a bug fix:
   bun test --test-name-pattern "bug|fix"

🚀 After implementing a feature:
   bun test --test-name-pattern "feature|new"

📊 Performance optimization:
   bun test --test-name-pattern "performance|perf|benchmark"

🐛 Debugging specific issues:
   bun test --test-name-pattern "memory.*leak"
   bun test --test-name-pattern "race.*condition"

🔄 During refactoring:
   bun test --test-name-pattern "regression"
   bun test $(git diff --name-only main | grep "\.test\\.")
`);

// Git workflow integration
console.log('\n🔄 Git Workflow Integration:');
console.log('─'.repeat(40));

console.log(`
# Pre-commit hook (run only changed tests)
#!/bin/sh
bun test $(git diff --cached --name-only | grep "\.test\\.")

# Pre-push hook (run all bug-fix related tests)
#!/bin/sh
bun test --test-name-pattern "bug|fix|regression"

# CI/CD - Run tests for changed components
#!/bin/sh
CHANGED=$(git diff --name-only origin/main...HEAD | grep "\.test\\.")
if [ -n "$CHANGED" ]; then
  bun test $CHANGED
else
  echo "No test files changed"
fi

# Local development - Quick feedback loop
#!/bin/sh
# Watch for changes and run relevant tests
while true; do
  bun test $(git diff --name-only HEAD~1 | grep "\.test\\.")
  sleep 5
done
`);

// Cleanup
console.log('\n🧹 Cleaning up demo...');
await $`rm -rf examples/advanced-tests`.quiet();

console.log('\n✅ Advanced test discovery demo complete!');
console.log('\n🎯 Key Benefits:');
console.log('• Git integration saves time by testing only what changed');
console.log('• Pattern matching provides focused test execution');
console.log('• Perfect for bug fixes, feature development, and regression testing');
console.log('• Integrates seamlessly with CI/CD pipelines');
