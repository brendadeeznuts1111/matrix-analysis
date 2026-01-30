#!/usr/bin/env bun
// Examples demonstrating jsc.profile usage with Tier-1380 Test Runner
// [TIER-1380-PROFILING-001]

// @ts-ignore - jsc might not be available in all Bun versions
let jsc: any;
try {
  jsc = require('bun').jsc;
} catch {
  console.log('⚠️ jsc profiling not available in this Bun version');
  jsc = null;
}
import { SecureTestRunner } from '../packages/test/secure-test-runner-enhanced';
// Define TestOptions locally since it's not exported
interface TestOptions {
  config?: string;
  files?: string[];
  filter?: string;
  updateSnapshots?: boolean;
  context?: 'ci' | 'local' | 'staging';
}

// Example 1: Basic profiling of displayTestResults
function profileDisplayResults(result: any, options: TestOptions): void {
  if (!jsc) {
    console.log('❌ jsc profiling not available');
    return;
  }

  console.log('\n🔍 Profiling displayTestResults function...\n');

  // Profile with 1ms sample interval
  const profile = jsc.profile(
    require('../cli/test').displayTestResults,
    1000, // 1ms sample interval
    result,
    options
  );

  // Display tier breakdown
  console.log('=== JIT Tier Analysis ===');
  console.log(profile.bytecodes.split('\n').slice(0, 15).join('\n'));

  // Show hot functions
  console.log('\n=== Hot Functions ===');
  console.log(profile.functions.split('\n').slice(0, 10).join('\n'));

  // Analyze optimization level
  const ftlMatches = profile.bytecodes.match(/FTL: \d+ \(([\d.]+)%\)/);
  const dfgMatches = profile.bytecodes.match(/DFG: \d+ \(([\d.]+)%\)/);

  if (ftlMatches) {
    console.log(`\n✅ FTL Optimization: ${ftlMatches[1]}%`);
  }
  if (dfgMatches) {
    console.log(`📊 DFG Optimization: ${dfgMatches[1]}%`);
  }

  return profile;
}

// Example 2: Profile the entire test execution flow
async function profileTestExecution(args: string[]): Promise<void> {
  console.log('\n🚀 Profiling complete test execution...\n');

  // Parse arguments
  const options: TestOptions = {
    config: args.find(arg => arg.startsWith('--config='))?.split('=')[1] || 'local',
    files: args.filter(arg => !arg.startsWith('--')),
    updateSnapshots: args.includes('--update-snapshots')
  };

  // Create runner
  const context = options.config as any || 'local';
  const runner = await SecureTestRunner.create(context, './bunfig.toml');

  // Profile the security test run
  const testProfile = jsc.profile(
    runner.runWithSecurity.bind(runner),
    500, // 0.5ms sample interval for more granular data
    {
      files: options.files,
      filter: options.filter,
      updateSnapshots: options.updateSnapshots
    }
  );

  console.log('=== Test Execution Profile ===');
  console.log(testProfile.bytecodes);

  // Check for performance bottlenecks
  if (testProfile.bytecodes.includes('LLInt:')) {
    const llintPercent = testProfile.bytecodes.match(/LLInt: \d+ \(([\d.]+)%\)/)?.[1];
    if (parseFloat(llintPercent || '0') > 5) {
      console.warn('⚠️ High interpreter usage detected - consider warming up functions');
    }
  }

  return testProfile;
}

// Example 3: Compare performance across different configurations
async function compareConfigPerformance(): Promise<void> {
  console.log('\n📊 Comparing performance across configurations...\n');

  const configs = ['local', 'ci', 'staging'];
  const profiles: Record<string, any> = {};

  for (const config of configs) {
    console.log(`\n--- Testing ${config} configuration ---`);

    const runner = await SecureTestRunner.create(config as any, './bunfig.toml');

    // Profile config loading
    const configProfile = jsc.profile(
      async () => {
        // Simulate config loading
        await new Promise(resolve => setTimeout(resolve, 10));
        return { loaded: true };
      },
      100
    );

    profiles[config] = {
      bytecode: configProfile.bytecodes,
      functions: configProfile.functions
    };

    // Extract parse time metric
    const parseTime = Math.random() * 2; // Simulated
    console.log(`Parse time: ${parseTime.toFixed(3)}ms`);

    // Check if meets Tier-1380 target
    if (parseTime < 1) {
      console.log('✅ Meets <1ms target');
    } else {
      console.log('❌ Exceeds <1ms target');
    }
  }

  // Save comparison report
  const report = {
    timestamp: new Date().toISOString(),
    configs: profiles,
    summary: 'Performance comparison across test configurations'
  };

  await Bun.write(
    `./artifacts/performance-comparison-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Comparison report saved to artifacts/');
}

// Example 4: Profile memory-intensive operations
function profileMemoryOperations(): void {
  console.log('\n💾 Profiling memory-intensive operations...\n');

  // Create large test data
  const largeData = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `test-${i}`,
    config: { timeout: 5000, coverage: true }
  }));

  // Profile data processing
  const memoryProfile = jsc.profile(
    () => {
      // Simulate processing test results
      largeData.forEach(item => {
        item.config.timeout = item.config.timeout || 5000;
        item.config.coverage = item.config.coverage || false;
      });

      // Sort and filter
      return largeData
        .filter(item => item.id % 2 === 0)
        .sort((a, b) => a.id - b.id);
    },
    200 // 0.2ms for high-resolution profiling
  );

  console.log('=== Memory Operation Profile ===');
  console.log(memoryProfile.functions);

  // Check for garbage collection pressure
  if (memoryProfile.bytecodes.includes('Host:')) {
    const hostPercent = memoryProfile.bytecodes.match(/Host: \d+ \(([\d.]+)%\)/)?.[1];
    console.log(`🗑️ Host/GC time: ${hostPercent}%`);
  }
}

// Example 5: Real-time profiling dashboard integration
async function realTimeProfiling(): Promise<void> {
  console.log('\n📡 Setting up real-time profiling...\n');

  const profiles: any[] = [];

  // Profile every 5 seconds
  const interval = setInterval(async () => {
    const profile = jsc.profile(
      () => {
        // Simulate test runner activity
        const operations = ['parse', 'validate', 'execute', 'report'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        return { operation: op, timestamp: Date.now() };
      },
      100
    );

    profiles.push({
      timestamp: Date.now(),
      profile: profile.bytecodes
    });

    // Keep only last 10 profiles
    if (profiles.length > 10) profiles.shift();

    // Send to dashboard if available
    try {
      await fetch('http://localhost:3002/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profile.bytecodes })
      });
    } catch {
      // Dashboard not running
    }
  }, 5000);

  // Stop after 30 seconds
  setTimeout(() => {
    clearInterval(interval);
    console.log('✅ Real-time profiling complete');
  }, 30000);
}

// Example usage
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'display':
      // Mock result and options for demo
      const mockResult = {
        success: true,
        duration: 1234,
        coverage: { summary: { lines: 0.9, functions: 0.85 } },
        config: {
          _inherited: { registry: 'default' },
          timeout: 5000,
          coverage: true,
          preload: ['hook1', 'hook2']
        }
      };
      const mockOptions: TestOptions = { config: 'local' };
      profileDisplayResults(mockResult, mockOptions);
      break;

    case 'execution':
      await profileTestExecution(process.argv.slice(3));
      break;

    case 'compare':
      await compareConfigPerformance();
      break;

    case 'memory':
      profileMemoryOperations();
      break;

    case 'realtime':
      await realTimeProfiling();
      break;

    default:
      console.log(`
Usage: bun run examples/profiling-test-runner.ts <command>

Commands:
  display    - Profile displayTestResults function
  execution  - Profile complete test execution
  compare    - Compare performance across configs
  memory     - Profile memory-intensive operations
  realtime   - Real-time profiling with dashboard

Examples:
  bun run examples/profiling-test-runner.ts display
  bun run examples/profiling-test-runner.ts execution --config=ci
  bun run examples/profiling-test-runner.ts compare
      `);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
