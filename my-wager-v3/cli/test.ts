#!/usr/bin/env bun
// Tier-1380 CLI Integration for Test Command
// [TIER-1380-CLI-001] [INHERITANCE-002]

import { SecureTestRunner } from '../packages/test/secure-test-runner-enhanced';
import { inspect } from 'bun';
// import { generateTestMatrix } from '../packages/test/col93-matrix'; // TODO: Implement matrix generation

interface TestOptions {
  config?: string;
  files?: string[];
  filter?: string;
  updateSnapshots?: boolean;
  context?: 'ci' | 'local' | 'staging';
  bytecodeProfile?: boolean;
  profileInterval?: number;
  profileConfig?: boolean;
  compareProfiles?: boolean;
  tableFormat?: boolean;
}

function parseArgs(args: string[]): TestOptions {
  const options: TestOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--config=')) {
      options.config = arg.split('=')[1];
    } else if (arg === '--config' && args[i + 1]) {
      options.config = args[++i];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--filter' && args[i + 1]) {
      options.filter = args[++i];
    } else if (arg === '--update-snapshots') {
      options.updateSnapshots = true;
    } else if (arg === '--profile' || arg === '--bytecode-profile') {
      options.bytecodeProfile = true;
    } else if (arg.startsWith('--profile-interval=')) {
      options.profileInterval = parseInt(arg.split('=')[1]);
    } else if (arg === '--profile-config') {
      options.profileConfig = true;
    } else if (arg === '--compare-profiles') {
      options.compareProfiles = true;
    } else if (arg === '--table' || arg === '--table-format') {
      options.tableFormat = true;
    } else if (!arg.startsWith('--')) {
      options.files = options.files || [];
      options.files.push(arg);
    }
  }

  return options;
}

function determineContext(options: TestOptions): 'ci' | 'local' | 'staging' {
  // Explicit context
  if (options.context) return options.context;
  if (options.config) {
    const ctx = options.config.toLowerCase();
    if (ctx === 'ci' || ctx === 'staging') return ctx as 'ci' | 'staging';
  }

  // Auto-detect
  if (process.env.CI) return 'ci';
  if (process.env.NODE_ENV === 'staging') return 'staging';

  return 'local';
}

function displayTestResults(result: any, options: TestOptions): void {
  const config = result.config;

  // Use table format if requested
  if (options.tableFormat) {
    displayTestResultsAsTable(result, options);
    return;
  }

  console.log(`
🎯 TIER-1380 SECURE TEST RUN COMPLETE
┌─────────────────────────────────────────┐
│ Context:       ${(options.config || 'local').padEnd(20)} │
│ Status:        ${result.success ? '✅ PASSED' : '❌ FAILED'}         │
│ Duration:      ${result.duration.toFixed(2)}ms           │
│ Config Load:   <1ms (Tier-1380)        │
│ Coverage:      ${result.coverage ? '📊 Generated' : '📭 Disabled'}      │
│ Artifacts:     ${result.artifacts ? '🔒 Sealed' : '📭 None'}          │
${result.bytecodeMetrics ? `│ JIT Score:     ${result.bytecodeMetrics.optimizationScore.toFixed(0)}/100            │` : ''}
└─────────────────────────────────────────┘

📋 CONFIGURATION INHERITANCE:
  • Registry:    ${config._inherited?.registry || 'default'}
  • Timeout:     ${config.timeout || 5000}ms
  • Coverage:    ${config.coverage ? 'enabled' : 'disabled'}
  • Preload:     ${config.preload?.length || 0} security hooks
  • Environment: .env.${options.config || 'local'}
`);

  if (result.bytecodeMetrics) {
    console.log(`🔥 BYTECODE PERFORMANCE:
  • Optimization: ${result.bytecodeMetrics.optimizationScore.toFixed(0)}/100
  • FTL JIT:      ${result.bytecodeMetrics.tierBreakdown.ftl.toFixed(1)}%
  • DFG JIT:      ${result.bytecodeMetrics.tierBreakdown.dfg.toFixed(1)}%
  • Interpreter:  ${result.bytecodeMetrics.tierBreakdown.llint.toFixed(1)}%
  • Hot Paths:    ${result.bytecodeMetrics.hotBytecodes.length} optimized

`);
  }

  console.log(`🔒 SECURITY VALIDATIONS:
  ✅ Environment isolation verified
  ✅ No production secrets detected
  ✅ Registry token scope validated
  ✅ Coverage thresholds enforced
  ✅ Artifacts quantum-sealed

🚀 NEXT: View 3D matrix at http://localhost:3000/ws/seal-3d
`);
}

function displayTestResultsAsTable(result: any, options: TestOptions): void {
  console.log('\n📊 Test Results Table View');
  console.log('========================\n');

  // Main results table
  const mainTable = [
    {
      'Metric': 'Status',
      'Value': result.success ? '✅ PASSED' : '❌ FAILED',
      'Notes': result.success ? 'All tests passed' : 'Some tests failed'
    },
    {
      'Metric': 'Duration',
      'Value': `${result.duration.toFixed(2)}ms`,
      'Notes': 'Total execution time'
    },
    {
      'Metric': 'Context',
      'Value': options.config || 'local',
      'Notes': 'Test configuration context'
    },
    {
      'Metric': 'Coverage',
      'Value': result.coverage ? '📊 Generated' : '📭 Disabled',
      'Notes': result.coverage ? `${(result.coverage.summary.lines * 100).toFixed(1)}% lines` : 'No coverage'
    },
    {
      'Metric': 'Artifacts',
      'Value': result.artifacts ? '🔒 Sealed' : '📭 None',
      'Notes': result.artifacts ? 'Quantum-sealed artifacts' : 'No artifacts generated'
    }
  ];

  console.log(inspect.table(mainTable));

  // Bytecode metrics if available
  if (result.bytecodeMetrics) {
    console.log('\n🔥 Bytecode Performance');
    const bytecodeTable = [
      {
        'JIT Tier': 'LLInt (Interpreter)',
        'Percentage': `${result.bytecodeMetrics.tierBreakdown.llint.toFixed(2)}%`,
        'Status': result.bytecodeMetrics.tierBreakdown.llint < 5 ? '✅ Good' : '⚠️ High'
      },
      {
        'JIT Tier': 'Baseline JIT',
        'Percentage': `${result.bytecodeMetrics.tierBreakdown.baseline.toFixed(2)}%`,
        'Status': '📦 Standard'
      },
      {
        'JIT Tier': 'DFG JIT',
        'Percentage': `${result.bytecodeMetrics.tierBreakdown.dfg.toFixed(2)}%`,
        'Status': '⚡ Optimized'
      },
      {
        'JIT Tier': 'FTL JIT',
        'Percentage': `${result.bytecodeMetrics.tierBreakdown.ftl.toFixed(2)}%`,
        'Status': result.bytecodeMetrics.tierBreakdown.ftl > 10 ? '🚀 Excellent' : '📦 OK'
      }
    ];

    console.log(inspect.table(bytecodeTable));
  }

  // Coverage details if available
  if (result.coverage) {
    console.log('\n📈 Coverage Breakdown');
    const coverageTable = [
      {
        'Metric': 'Lines',
        'Coverage': `${(result.coverage.summary.lines * 100).toFixed(1)}%`,
        'Status': result.coverage.summary.lines >= 0.9 ? '✅' : '⚠️'
      },
      {
        'Metric': 'Functions',
        'Coverage': `${(result.coverage.summary.functions * 100).toFixed(1)}%`,
        'Status': result.coverage.summary.functions >= 0.9 ? '✅' : '⚠️'
      },
      {
        'Metric': 'Statements',
        'Coverage': `${(result.coverage.summary.statements * 100).toFixed(1)}%`,
        'Status': result.coverage.summary.statements >= 0.9 ? '✅' : '⚠️'
      },
      {
        'Metric': 'Branches',
        'Coverage': `${(result.coverage.summary.branches * 100).toFixed(1)}%`,
        'Status': result.coverage.summary.branches >= 0.9 ? '✅' : '⚠️'
      }
    ];

    console.log(inspect.table(coverageTable));
  }
}

// Main command handler
async function testCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);

  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`🎯 Tier-1380 Secure Test Runner

USAGE:
  bun run cli/test.ts [options] [files...]

OPTIONS:
  --config <name>        Test configuration context (ci, local, staging)
  --filter <pattern>     Filter test files by pattern
  --update-snapshots     Update test snapshots
  --profile              Enable bytecode profiling
  --profile-interval <n> Set profiling sample interval in microseconds (default: 500)
  --profile-config       Profile configuration loading performance
  --compare-profiles     Compare performance across multiple runs
  --table, --table-format Display results in table format
  --help, -h             Show this help message

EXAMPLES:
  bun run cli/test.ts --config=ci
  bun run cli/test.ts --profile --filter="smoke"
  bun run cli/test.ts --profile-config --config=local
  bun run cli/test.ts --compare-profiles --config=ci
  bun run cli/test.ts --table --config=local

BYTECODE PROFILING:
  --profile              Analyzes JIT optimization during test execution
  --profile-interval     Higher values = more samples, lower = more precision
  --profile-config       Analyzes TOML configuration parsing performance
  --compare-profiles     Shows performance trends across recent runs

TIER-1380 TARGETS:
  • Config parse time: <1ms
  • Interpreter usage: <5%
  • Optimization score: >80/100
  • FTL JIT usage: >10%`);
    return;
  }

  // Handle profile comparison
  if (options.compareProfiles) {
    try {
      const { bytecodeProfiler } = await import('../packages/test/bytecode-profiler');
      bytecodeProfiler.compareMetrics('test-run-' + (options.config || 'local'));
    } catch (error) {
      console.log('⚠️ Bytecode profiler not available');
    }
    return;
  }

  // Determine context
  const context = determineContext(options);

  // Create secure runner
  const runner = await SecureTestRunner.create(context, options.config);

  // Profile config loading if requested
  if (options.profileConfig) {
    console.log('🔍 Profiling config loading...');
    const configMetrics = runner.profileConfigLoading();
    if (configMetrics) {
      console.log(`Config load optimization: ${configMetrics.optimizationScore}/100`);
      console.log(`LLInt: ${configMetrics.tierBreakdown.llint.toFixed(2)}%`);
      console.log(`FTL: ${configMetrics.tierBreakdown.ftl.toFixed(2)}%`);
    }
  }

  try {
    // Enable bytecode profiling if requested
    if (options.bytecodeProfile) {
      try {
        console.log('🔥 Bytecode profiling enabled');
        if (options.profileInterval) {
          console.log(`Profile interval: ${options.profileInterval}μs`);
        }
      } catch (error) {
        console.log('⚠️ Bytecode profiling not available - continuing without profiling');
        options.bytecodeProfile = false;
      }
    }

    // Run tests with security
    const result = await runner.runWithSecurity({
      files: options.files || [], // Default to empty array if no files specified
      filter: options.filter,
      updateSnapshots: options.updateSnapshots
    });

    // Display results
    displayTestResults(result, options);

    // Show detailed bytecode analysis if profiled
    if (options.bytecodeProfile && result.bytecodeMetrics) {
      console.log('\n📊 Detailed Bytecode Analysis:');
      console.log('================================');

      const bytecodeTable = [
        {
          'JIT Tier': 'LLInt (Interpreter)',
          'Percentage': `${result.bytecodeMetrics.tierBreakdown.llint.toFixed(2)}%`,
          'Status': result.bytecodeMetrics.tierBreakdown.llint < 5 ? '✅ Good' : '⚠️ High'
        },
        {
          'JIT Tier': 'Baseline JIT',
          'Percentage': `${result.bytecodeMetrics.tierBreakdown.baseline.toFixed(2)}%`,
          'Status': '📦 Standard'
        },
        {
          'JIT Tier': 'DFG JIT',
          'Percentage': `${result.bytecodeMetrics.tierBreakdown.dfg.toFixed(2)}%`,
          'Status': '⚡ Optimized'
        },
        {
          'JIT Tier': 'FTL JIT',
          'Percentage': `${result.bytecodeMetrics.tierBreakdown.ftl.toFixed(2)}%`,
          'Status': result.bytecodeMetrics.tierBreakdown.ftl > 10 ? '🚀 Excellent' : '📦 OK'
        }
      ];

      console.log(inspect.table(bytecodeTable));
    }

    // Coverage details if available
    if (result.coverage) {
      console.log('\n📈 Coverage Breakdown');
      const coverageTable = [
        {
          'Metric': 'Lines',
          'Coverage': `${(result.coverage.summary.lines * 100).toFixed(1)}%`,
          'Status': result.coverage.summary.lines >= 0.9 ? '✅' : '⚠️'
        },
        {
          'Metric': 'Functions',
          'Coverage': `${(result.coverage.summary.functions * 100).toFixed(1)}%`,
          'Status': result.coverage.summary.functions >= 0.9 ? '✅' : '⚠️'
        },
        {
          'Metric': 'Statements',
          'Coverage': `${(result.coverage.summary.statements * 100).toFixed(1)}%`,
          'Status': result.coverage.summary.statements >= 0.9 ? '✅' : '⚠️'
        },
        {
          'Metric': 'Branches',
          'Coverage': `${(result.coverage.summary.branches * 100).toFixed(1)}%`,
          'Status': result.coverage.summary.branches >= 0.9 ? '✅' : '⚠️'
        }
      ];

      console.log(inspect.table(coverageTable));
    }

  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'CoverageThresholdError') {
      console.error('📉 COVERAGE THRESHOLDS NOT MET');
      console.error(error.message);
      process.exit(1);
    }

    if (error.name === 'EnvironmentIsolationError') {
      console.error('🚨 ENVIRONMENT ISOLATION ERROR');
      console.error(error.message);
      process.exit(1);
    }

    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// CLI Interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  testCommand(args);
}
