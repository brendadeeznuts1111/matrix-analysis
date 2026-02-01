#!/usr/bin/env bun
/**
 * Test Organizer Demo
 * 
 * Demonstrates different test groups with variables
 */

console.log('🎯 Test Organizer Demo');
console.log('====================\n');

// Demo 1: Smoke tests
console.log('1️⃣ Running Smoke Tests (High Priority, Fast)');
process.env.TEST_GROUP = 'smoke';
process.env.TEST_PRIORITY = 'high';
process.env.TEST_TAGS = 'smoke,critical,fast';
process.env.TEST_MODE = 'smoke';
process.env.FAIL_FAST = '1';

console.log(`   Group: ${process.env.TEST_GROUP}`);
console.log(`   Priority: ${process.env.TEST_PRIORITY}`);
console.log(`   Tags: ${process.env.TEST_TAGS}`);
console.log(`   Mode: ${process.env.TEST_MODE}`);
console.log(`   Fail Fast: ${process.env.FAIL_FAST}\n`);

// Demo 2: Unit tests
console.log('2️⃣ Running Unit Tests (High Priority, Isolated)');
process.env.TEST_GROUP = 'unit';
process.env.TEST_PRIORITY = 'high';
process.env.TEST_TAGS = 'unit,fast,isolated';
process.env.TEST_MODE = 'unit';
process.env.ISOLATED = '1';

console.log(`   Group: ${process.env.TEST_GROUP}`);
console.log(`   Priority: ${process.env.TEST_PRIORITY}`);
console.log(`   Tags: ${process.env.TEST_TAGS}`);
console.log(`   Mode: ${process.env.TEST_MODE}`);
console.log(`   Isolated: ${process.env.ISOLATED}\n`);

// Demo 3: Integration tests
console.log('3️⃣ Running Integration Tests (Medium Priority)');
process.env.TEST_GROUP = 'integration';
process.env.TEST_PRIORITY = 'medium';
process.env.TEST_TAGS = 'integration,api';
process.env.TEST_MODE = 'integration';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

console.log(`   Group: ${process.env.TEST_GROUP}`);
console.log(`   Priority: ${process.env.TEST_PRIORITY}`);
console.log(`   Tags: ${process.env.TEST_TAGS}`);
console.log(`   Mode: ${process.env.TEST_MODE}`);
console.log(`   Database: ${process.env.DATABASE_URL}\n`);

// Demo 4: Performance tests
console.log('4️⃣ Running Performance Tests (Low Priority, Slow)');
process.env.TEST_GROUP = 'performance';
process.env.TEST_PRIORITY = 'low';
process.env.TEST_TAGS = 'performance,benchmark,slow';
process.env.TEST_MODE = 'performance';
process.env.BENCHMARK = '1';
process.env.PERFORMANCE_THRESHOLD = '1000';

console.log(`   Group: ${process.env.TEST_GROUP}`);
console.log(`   Priority: ${process.env.TEST_PRIORITY}`);
console.log(`   Tags: ${process.env.TEST_TAGS}`);
console.log(`   Mode: ${process.env.TEST_MODE}`);
console.log(`   Benchmark: ${process.env.BENCHMARK}`);
console.log(`   Threshold: ${process.env.PERFORMANCE_THRESHOLD}ms\n`);

// Demo 5: Show how to use variables in tests
console.log('5️⃣ Example Test Logic Using Variables');
console.log('```typescript');
console.log(`
// Access variables in tests
const testGroup = process.env.TEST_GROUP;
const testPriority = process.env.TEST_PRIORITY;
const testTags = process.env.TEST_TAGS?.split(',') || [];

// Conditional test execution
if (testTags.includes('smoke')) {
  // Run only critical tests
  test('should verify critical path', () => {
    expect(true).toBe(true);
  });
}

if (testPriority === 'high') {
  // Use shorter timeout
  test.setTimeout(3000);
}

if (testTags.includes('integration')) {
  // Setup database
  beforeAll(async () => {
    await setupDatabase(process.env.DATABASE_URL);
  });
}

// Group-specific behavior
switch (testGroup) {
  case 'smoke':
    // Quick checks only
    break;
  case 'unit':
    // Mock all dependencies
    break;
  case 'integration':
    // Use real services
    break;
  case 'performance':
    // Measure execution time
    break;
}
`);
console.log('```');

// Demo 6: Show command examples
console.log('6️⃣ Command Examples');
console.log('');
console.log('# List all groups');
console.log('bun run test:groups');
console.log('');
console.log('# Run specific groups');
console.log('bun run test:smoke      # High priority, fast');
console.log('bun run test:unit       # High priority, isolated');
console.log('bun run test:integration # Medium priority, with DB');
console.log('bun run test:e2e        # Low priority, browser');
console.log('');
console.log('# Run by tags');
console.log('bun run test:fast        # All fast tests');
console.log('bun run test:critical    # All critical tests');
console.log('bun run test:slow        # All slow tests');
console.log('');
console.log('# Run with options');
console.log('bun run test:unit --coverage');
console.log('bun run test:unit --watch');
console.log('bun run test:unit --verbose');
console.log('');

console.log('✅ Demo complete! Try running the actual test groups.');
console.log('');
console.log('Example:');
console.log('TEST_GROUP=smoke TEST_PRIORITY=high TEST_TAGS=smoke,critical,fast \\');
console.log('  TEST_MODE=smoke FAIL_FAST=1 bun test ./src/__tests__/test-organizer-example.test.ts');
