/**
 * Example: Using CI Detection in Your Tests
 *
 * This file demonstrates how to use the CI detection system
 * to adapt test behavior based on the environment.
 */

import { CIDetector } from '../src/lib/ci-detector';
import { testConfig } from '../src/lib/test-config';

// Example 1: Basic CI detection
console.log('=== Example 1: Basic CI Detection ===');

const detector = CIDetector.getInstance();
const ci = detector.detect();

console.log(`Environment: ${ci.name}`);
console.log(`Is CI: ${ci.isCI}`);
console.log(`Is GitHub Actions: ${ci.isGitHubActions}`);
console.log(`Is Pull Request: ${ci.isPR ?? false}`);

if (ci.branch) {
  console.log(`Branch: ${ci.branch}`);
}

if (ci.tag) {
  console.log(`Tag: ${ci.tag}`);
}

// Example 2: GitHub Actions detection
console.log('\n=== Example 2: GitHub Actions Integration ===');

if (ci.isGitHubActions) {
  console.log('✅ Running in GitHub Actions');

  // Emit annotations
  detector.emitAnnotation('notice', 'Starting test suite', {
    title: 'Test Start'
  });

  // Group related tests
  detector.startGroup('Unit Tests');
  console.log('Running unit tests...');
  detector.endGroup();

  detector.startGroup('Integration Tests');
  console.log('Running integration tests...');
  detector.endGroup();

} else {
  console.log('ℹ️ Not running in GitHub Actions');
}

// Example 3: CI-aware test configuration
console.log('\n=== Example 3: CI-Aware Configuration ===');

const config = testConfig.getConfig();

console.log(`Timeout: ${config.timeout}ms`);
console.log(`Concurrency: ${config.concurrency}`);
console.log(`Coverage enabled: ${config.coverage}`);
console.log(`Retry count: ${config.retryCount}`);

// Example 4: Environment-specific behavior
console.log('\n=== Example 4: Adaptive Behavior ===');

// Simulate a test that behaves differently in CI
function runExpensiveTest() {
  if (ci.isCI) {
    console.log('⚡ Running in optimized mode for CI');
    // Use cached results, skip expensive computations
  } else {
    console.log('🔬 Running full test suite locally');
    // Run comprehensive tests with detailed output
  }
}

runExpensiveTest();

// Example 5: Conditional annotations
console.log('\n=== Example 5: Conditional Annotations ===');

// Simulate test results
const testResults = {
  passed: true,
  coverage: 75,
  slowTests: ['test-1', 'test-2']
};

if (!testResults.passed) {
  detector.emitAnnotation('error', 'Some tests failed', {
    title: 'Test Failure'
  });
}

if (testResults.coverage < 80) {
  detector.emitAnnotation('warning', `Coverage is ${testResults.coverage}% (target: 80%)`, {
    title: 'Low Coverage'
  });
}

if (testResults.slowTests.length > 0 && ci.isCI) {
  detector.emitAnnotation('notice', `Found ${testResults.slowTests.length} slow tests`, {
    title: 'Performance Warning'
  });
}

// Example 6: Build information
console.log('\n=== Example 6: Build Information ===');

if (ci.buildNumber) {
  console.log(`Build #${ci.buildNumber}`);
}

if (ci.buildUrl) {
  console.log(`Build URL: ${ci.buildUrl}`);
}

if (ci.commit) {
  console.log(`Commit: ${ci.commit.substring(0, 7)}`);
}

// Example 7: Custom environment detection
console.log('\n=== Example 7: Custom Detection Logic ===');

// You can create your own detection logic
function isProductionCI(): boolean {
  return ci.isCI && ci.branch === 'main' && !ci.isPR;
}

function isPreRelease(): boolean {
  return ci.isCI && ci.tag?.includes('rc') || ci.tag?.includes('beta');
}

console.log(`Is Production CI: ${isProductionCI()}`);
console.log(`Is Pre-release: ${isPreRelease()}`);

// Example 8: Test filtering based on environment
console.log('\n=== Example 8: Smart Test Filtering ===');

function getTestPatterns(): string[] {
  const patterns = ['src/__tests__'];

  if (ci.isPR) {
    // In PRs, focus on changed areas
    console.log('🔍 PR detected - focusing on relevant tests');
    patterns.push('src/__tests__/pr-*.test.ts');
  }

  if (ci.isCI) {
    // In CI, skip integration tests unless on main
    if (ci.branch !== 'main') {
      console.log('⚡ Skipping integration tests on feature branch');
    }
  } else {
    // Locally, run everything
    console.log('🔬 Running all tests locally');
    patterns.push('integration/__tests__');
  }

  return patterns;
}

const testPatterns = getTestPatterns();
console.log(`Test patterns: ${testPatterns.join(', ')}`);

console.log('\n✅ Examples complete!');
