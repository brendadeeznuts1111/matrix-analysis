#!/usr/bin/env bun
/**
 * 🚀 Enhanced Test Command with Transpiler Integration
 *
 * This is a drop-in replacement for your test.ts that uses Bun.Transpiler
 * Usage: bun run test-enhanced.ts [options] [files...]
 */

import { TranspiledTestRunner } from './test-transpiler-integration';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  config: 'local',
  filter: undefined as string | undefined,
  updateSnapshots: false,
  transpile: false,
  optimize: false,
  bundle: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--config':
      options.config = args[++i];
      break;
    case '--filter':
      options.filter = args[++i];
      break;
    case '--update-snapshots':
      options.updateSnapshots = true;
      break;
    case '--transpile':
      options.transpile = true;
      break;
    case '--optimize':
      options.optimize = true;
      break;
    case '--bundle':
      options.bundle = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Enhanced Test Command with Bun.Transpiler

USAGE:
  bun run test-enhanced.ts [options] [files...]

OPTIONS:
  --config <name>        Test configuration context (ci, local, staging)
  --filter <pattern>     Filter test files by pattern
  --update-snapshots     Update test snapshots
  --transpile            Use transpiler (default: false)
  --optimize             Enable minification (default: false)
  --bundle               Create test bundle (default: false)
  --help, -h             Show this help message

NEW OPTIONS:
  --transpile            Transform TypeScript with Bun.Transpiler
  --optimize             Minify transpiled code for production
  --bundle               Create a bundled test file

EXAMPLES:
  bun run test-enhanced.ts --config=ci --transpile
  bun run test-enhanced.ts --transpile --optimize --bundle
  bun run test-enhanced.ts --filter="smoke" --transpile
`);
      process.exit(0);
  }
}

async function main() {
  console.log('🚀 Enhanced Test Runner with Transpiler');
  console.log('======================================\n');

  const testFile = './my-wager-v3/cli/test.ts';

  if (options.transpile || options.optimize || options.bundle) {
    // Create transpiler-aware runner
    const runner = new TranspiledTestRunner({
      environment: options.config === 'ci' ? 'production' : 'test',
      optimize: options.optimize,
      target: 'bun'
    });

    console.log('📝 Using Bun.Transpiler with options:');
    console.log(`   Environment: ${options.config}`);
    console.log(`   Transpile: ${options.transpile}`);
    console.log(`   Optimize: ${options.optimize}`);
    console.log(`   Bundle: ${options.bundle}\n`);

    if (options.bundle) {
      // Create test bundle
      console.log('📦 Creating test bundle...');
      runner.createTestBundle(testFile, './test-bundle.js');
      console.log('✅ Bundle created: ./test-bundle.js\n');

      // Run the bundle
      console.log('🏃 Running bundled test...');
      const { exec } = await import('child_process');
      await new Promise((resolve, reject) => {
        exec(`bun run test-bundle.js ${args.join(' ')}`, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
          }
          console.log(stdout);
          resolve(stdout);
        });
      });
    } else {
      // Run transpiled test directly
      console.log('⚡ Running transpiled test...');
      try {
        await runner.runTranspiledTest(testFile);
      } catch (error: any) {
        console.error('❌ Test failed:', error);
        process.exit(1);
      }
    }
  } else {
    // Run original test without transpiler
    console.log('📋 Running original test (no transpiler)...\n');

    // Import and run the original test
    const testModule = await import('./my-wager-v3/cli/test.ts');

    // The test module exports its main function, check if it exists
    const testFunction = (testModule as any).testCommand;
    if (testFunction && typeof testFunction === 'function') {
      try {
        await testFunction(args);
      } catch (error: any) {
        console.error('❌ Test failed:', error);
        process.exit(1);
      }
    } else {
      console.error('❌ testCommand function not found');
      process.exit(1);
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  console.error('❌ Failed to run tests:', error);
  process.exit(1);
});
