#!/usr/bin/env bun
/**
 * CI-aware Test Runner
 *
 * Automatically adjusts test behavior based on the CI environment.
 *
 * Usage:
 *   bun run scripts/ci-test-runner.ts [patterns...]
 *   bun run test:ci
 */

import { spawn } from 'bun';
import { CIDetector } from '../src/lib/ci-detector';
import { testConfig } from '../src/lib/test-config';

interface TestResult {
  passed: boolean;
  failed: number;
  total: number;
  duration: number;
  coverage?: number;
}

interface ParsedTestOutput {
  passed: number;
  failed: number;
  total: number;
  coverage?: number;
}

interface TestExecutionResult {
  passed: boolean;
  failed: number;
  total: number;
  coverage?: number;
}

class CITestRunner {
  private ci: ReturnType<CIDetector['detect']>;
  private config: ReturnType<typeof testConfig.getConfig>;

  constructor() {
    this.ci = CIDetector.getInstance().detect();
    this.config = testConfig.getConfig();

    // Configure environment
    testConfig.configureEnvironment();
  }

  /**
   * Run tests with CI-aware configuration
   */
  async run(patterns: string[] = []): Promise<TestResult> {
    this.printBanner();

    if (patterns.length === 0) {
      patterns = this.config.patterns;
    }

    // Build test command
    const args = this.buildTestCommand(patterns);

    console.log('🧪 Test Configuration:');
    console.log(`   Environment: ${this.ci.name}`);
    console.log(`   Timeout: ${this.config.timeout}ms`);
    console.log(`   Concurrency: ${this.config.concurrency}`);
    console.log(`   Coverage: ${this.config.coverage ? 'enabled' : 'disabled'}`);
    console.log(`   Retry Count: ${this.config.retryCount}`);

    if (this.ci.isPR) {
      console.log(`   Pull Request: Yes`);
    }

    console.log();
    console.log('📝 Command:', `bun ${args.join(' ')}`);
    console.log();

    // Emit start annotation
    if (this.ci.isGitHubActions) {
      CIDetector.getInstance().startGroup('Test Execution');
    }

    const startTime = Date.now();

    // Run tests
    const parsedResult = await this.executeTest(args);

    const duration = Date.now() - startTime;

    // Convert to TestResult format
    const result: TestResult = {
      passed: parsedResult.passed,
      failed: parsedResult.failed,
      total: parsedResult.total,
      duration,
      coverage: parsedResult.coverage
    };

    // Emit end annotation
    if (this.ci.isGitHubActions) {
      CIDetector.getInstance().endGroup();
    }

    // Print results
    this.printResults(result);

    // Emit annotations for failures
    if (!result.passed && this.ci.annotations.enabled) {
      this.emitFailureAnnotations(result);
    }

    return result;
  }

  /**
   * Build the test command with appropriate flags
   */
  private buildTestCommand(patterns: string[]): string[] {
    const args = ['test'];

    // Add timeout
    args.push(`--timeout=${this.config.timeout}`);

    // Add coverage if enabled
    if (this.config.coverage) {
      args.push('--coverage');

      // Configure coverage reporters for CI
      if (this.ci.isCI) {
        args.push('--coverage-reporter=text');
        args.push('--coverage-reporter=lcov');
      }
    }

    // Add concurrency limit
    args.push(`--max-concurrency=${this.config.concurrency}`);

    // Add retry for CI
    if (this.ci.isCI && this.config.retryCount > 0) {
      args.push(`--rerun-each=${this.config.retryCount + 1}`);
    }

    // Add bail for CI (stop after first failure)
    if (this.ci.isCI) {
      args.push('--bail=10'); // Stop after 10 failures
    }

    // Add patterns
    args.push(...patterns.map(p => p.startsWith('./') ? p : `./${p}`));

    return args;
  }

  /**
   * Execute tests and parse output
   */
  private async executeTest(args: string[]): Promise<TestExecutionResult> {
    const proc = spawn({
      cmd: ['bun', ...args],
      stdout: 'pipe',
      stderr: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    // Collect output
    if (proc.stdout) {
      for await (const chunk of proc.stdout) {
        stdout += new TextDecoder().decode(chunk);
      }
    }

    if (proc.stderr) {
      for await (const chunk of proc.stderr) {
        stderr += new TextDecoder().decode(chunk);
      }
    }

    const exitCode = await proc.exited;

    // Parse the output
    const parsed = this.parseTestOutput(stdout + stderr);

    // If parsing failed, use fallback values
    if (parsed.total === 0) {
      return {
        passed: exitCode === 0,
        failed: exitCode === 0 ? 0 : 1,
        total: 1
      };
    }

    return {
      passed: parsed.failed === 0,
      failed: parsed.failed,
      total: parsed.total,
      coverage: parsed.coverage
    };
  }

  /**
   * Parse test output to extract metrics
   */
  private parseTestOutput(output: string): ParsedTestOutput {
    const result: ParsedTestOutput = {
      passed: 0,
      failed: 0,
      total: 0
    };

    // Parse test summary
    const summaryMatch = output.match(/(\d+) pass(?:ed)?[\s,]*(\d+) fail(?:ed)?/i);
    if (summaryMatch) {
      result.passed = parseInt(summaryMatch[1]);
      result.failed = parseInt(summaryMatch[2]);
      result.total = result.passed + result.failed;
    } else {
      // Try alternative format
      const altMatch = output.match(/Ran (\d+) tests?[^\d]* (\d+) fail/);
      if (altMatch) {
        result.total = parseInt(altMatch[1]);
        result.failed = parseInt(altMatch[2]);
        result.passed = result.total - result.failed;
      }
    }

    // Parse coverage if available
    const coverageMatch = output.match(/coverage:?\s*(\d+)%/i);
    if (coverageMatch) {
      result.coverage = parseInt(coverageMatch[1]);
    }

    return result;
  }

  /**
   * Print execution banner
   */
  private printBanner(): void {
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              CI-aware Test Runner - Environment Detection               ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log();
  }

  /**
   * Print test results
   */
  private printResults(results: TestResult): void {
    console.log();
    console.log('📊 Test Results:');
    console.log('══════════════════════════════════════════════════════════════════════════════');

    const status = results.passed ? '✅ PASSED' : '❌ FAILED';
    const statusColor = results.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`   Status: ${statusColor}${status}${reset}`);
    console.log(`   Total:  ${results.total} tests`);
    console.log(`   Passed: ${results.passed} tests`);
    console.log(`   Failed: ${results.failed} tests`);
    console.log(`   Time:   ${(results.duration / 1000).toFixed(2)}s`);

    if (results.coverage !== undefined) {
      const coverageColor = results.coverage >= 80 ? '\x1b[32m' :
                           results.coverage >= 60 ? '\x1b[33m' : '\x1b[31m';
      console.log(`   Coverage: ${coverageColor}${results.coverage}%${reset}`);
    }

    console.log('══════════════════════════════════════════════════════════════════════════════');
    console.log();

    // Emit GitHub Actions summary
    if (this.ci.isGitHubActions) {
      console.log('## Test Summary');
      console.log(`- **Status**: ${results.passed ? '✅ Passed' : '❌ Failed'}`);
      console.log(`- **Duration**: ${(results.duration / 1000).toFixed(2)}s`);

      if (results.coverage) {
        console.log(`- **Coverage**: ${results.coverage}%`);
      }

      if (this.ci.branch) {
        console.log(`- **Branch**: ${this.ci.branch}`);
      }

      if (this.ci.commit) {
        console.log(`- **Commit**: ${this.ci.commit.substring(0, 7)}`);
      }
    }
  }

  /**
   * Emit failure annotations for CI
   */
  private emitFailureAnnotations(result: Omit<TestResult, 'duration'>): void {
    if (!this.ci.annotations.enabled || result.passed) {
      return;
    }

    const detector = CIDetector.getInstance();

    detector.emitAnnotation('error', `${result.failed} test(s) failed`, {
      title: 'Test Failure'
    });

    if (result.coverage && result.coverage < 80) {
      detector.emitAnnotation('warning', `Coverage is ${result.coverage}% (target: 80%)`, {
        title: 'Low Coverage'
      });
    }
  }
}

// CLI interface
async function main() {
  const patterns = process.argv.slice(2);
  const runner = new CITestRunner();

  try {
    const result = await runner.run(patterns);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

// Export for testing
export { CITestRunner };
