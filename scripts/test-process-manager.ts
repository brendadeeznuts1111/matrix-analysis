#!/usr/bin/env bun
/**
 * Test Process Manager
 *
 * Provides utilities for managing test processes with graceful and immediate termination.
 *
 * Usage:
 *   bun run scripts/test-process-manager.ts kill <pid> [--signal=SIGTERM|SIGKILL]
 *   bun run scripts/test-process-manager.ts list [--tests-only]
 *   bun run scripts/test-process-manager.ts monitor
 */

import { spawn } from 'bun';
import { execSync } from 'child_process';

type Signal = 'SIGTERM' | 'SIGKILL' | 'SIGINT' | 'SIGHUP';

interface ProcessInfo {
  pid: number;
  ppid: number;
  command: string;
  args: string[];
  isTest: boolean;
}

class TestProcessManager {
  /**
   * Kill a process with specified signal
   */
  static async kill(pid: number, signal: Signal = 'SIGTERM'): Promise<boolean> {
    try {
      // Check if process exists
      execSync(`kill -0 ${pid}`, { stdio: 'ignore' });

      console.log(`🔪 Sending ${signal} to process ${pid}`);

      // Send the signal
      process.kill(pid, signal);

      // Wait a moment and check if process is still running
      if (signal === 'SIGTERM') {
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
          console.log(`⚠️  Process ${pid} still running after SIGTERM`);
          console.log(`💡 Use SIGKILL for immediate termination: kill -SIGKILL ${pid}`);
          return false;
        } catch {
          console.log(`✅ Process ${pid} terminated gracefully`);
          return true;
        }
      }

      console.log(`✅ Signal ${signal} sent to process ${pid}`);
      return true;
    } catch (error: any) {
      if (error.code === 'ESRCH') {
        console.log(`❌ Process ${pid} not found`);
      } else {
        console.log(`❌ Failed to kill process ${pid}: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Find test-related processes
   */
  static findTestProcesses(): ProcessInfo[] {
    try {
      const output = execSync('ps aux', { encoding: 'utf8' });
      const lines = output.split('\n').slice(1); // Skip header

      const testProcesses: ProcessInfo[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[1]);
        const ppid = parseInt(parts[2]);
        const command = parts.slice(10).join(' ');

        // Check if it's a test process
        const isTest = this.isTestProcess(command);

        if (isTest) {
          testProcesses.push({
            pid,
            ppid,
            command,
            args: parts.slice(10),
            isTest
          });
        }
      }

      return testProcesses;
    } catch (error) {
      console.error('❌ Failed to list processes:', error);
      return [];
    }
  }

  /**
   * Check if a command is test-related
   */
  private static isTestProcess(command: string): boolean {
    const testPatterns = [
      'bun test',
      'bun.*test',
      'npm test',
      'yarn test',
      'pnpm test',
      'jest',
      'vitest',
      'mocha',
      'jasmine'
    ];

    return testPatterns.some(pattern =>
      new RegExp(pattern).test(command.toLowerCase())
    );
  }

  /**
   * List running processes
   */
  static list(testsOnly: boolean = false): void {
    try {
      const output = execSync('ps aux', { encoding: 'utf8' });
      const lines = output.split('\n').slice(1); // Skip header

      console.log('📋 Running Processes:');
      console.log();

      let foundAny = false;

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const command = parts.slice(10).join(' ');

        const isTest = this.isTestProcess(command);

        if (!testsOnly || isTest) {
          const icon = isTest ? '🧪' : '📄';
          console.log(`${icon} PID: ${pid.padEnd(8)} ${command}`);
          foundAny = true;
        }
      }

      if (!foundAny) {
        if (testsOnly) {
          console.log('🧪 No test processes found');
        } else {
          console.log('📄 No processes found');
        }
      }
    } catch (error) {
      console.error('❌ Failed to list processes:', error);
    }
  }

  /**
   * Monitor test processes
   */
  static async monitor(): Promise<void> {
    console.log('👀 Monitoring test processes... (Ctrl+C to stop)');
    console.log();

    const interval = setInterval(() => {
      const testProcesses = this.findTestProcesses();

      if (testProcesses.length === 0) {
        console.log('🧪 No test processes running');
      } else {
        console.log(`🧪 Found ${testProcesses.length} test process(es):`);
        testProcesses.forEach(p => {
          console.log(`   PID ${p.pid}: ${p.command}`);
        });
      }

      console.log('─'.repeat(50));
    }, 3000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 Stopped monitoring');
      process.exit(0);
    });
  }

  /**
   * Graceful shutdown with timeout
   */
  static async gracefulShutdown(pid: number, timeout: number = 5000): Promise<boolean> {
    console.log(`🔄 Attempting graceful shutdown of process ${pid} (timeout: ${timeout}ms)`);

    // Send SIGTERM
    const terminated = await this.kill(pid, 'SIGTERM');

    if (!terminated) {
      console.log(`⏱️  Waiting ${timeout}ms for process to terminate...`);

      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        try {
          execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch {
          console.log(`✅ Process ${pid} terminated gracefully`);
          return true;
        }
      }

      // Process didn't terminate, force kill
      console.log(`⚡ Process didn't terminate, forcing shutdown...`);
      return this.kill(pid, 'SIGKILL');
    }

    return true;
  }

  /**
   * Kill all test processes
   */
  static async killAllTests(signal: Signal = 'SIGTERM'): Promise<void> {
    const testProcesses = this.findTestProcesses();

    if (testProcesses.length === 0) {
      console.log('🧪 No test processes found');
      return;
    }

    console.log(`🧪 Found ${testProcesses.length} test process(es):`);
    testProcesses.forEach(p => console.log(`   PID ${p.pid}: ${p.command}`));
    console.log();

    for (const process of testProcesses) {
      await this.kill(process.pid, signal);
    }
  }
}

function printBanner() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║           Test Process Manager - Process Control for Tests              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log();
}

function printUsage() {
  console.log('Usage: bun run scripts/test-process-manager.ts <command> [options]');
  console.log();
  console.log('Commands:');
  console.log('  kill <pid> [--signal=<signal>]    Kill a specific process');
  console.log('  list [--tests-only]              List running processes');
  console.log('  monitor                          Monitor test processes continuously');
  console.log('  graceful <pid> [--timeout=<ms>]  Graceful shutdown with timeout');
  console.log('  kill-all [--signal=<signal>]     Kill all test processes');
  console.log();
  console.log('Signals:');
  console.log('  SIGTERM   (default)  Graceful termination');
  console.log('  SIGKILL               Immediate termination');
  console.log('  SIGINT                Interrupt (Ctrl+C)');
  console.log('  SIGHUP                Hang up signal');
  console.log();
  console.log('Examples:');
  console.log('  bun run scripts/test-process-manager.ts kill 12345');
  console.log('  bun run scripts/test-process-manager.ts kill 12345 --signal=SIGKILL');
  console.log('  bun run scripts/test-process-manager.ts list --tests-only');
  console.log('  bun run scripts/test-process-manager.ts graceful 12345 --timeout=3000');
  console.log('  bun run scripts/test-process-manager.ts kill-all --signal=SIGTERM');
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  printBanner();

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  switch (command) {
    case 'kill': {
      const pid = parseInt(args[1]);
      if (!pid) {
        console.error('❌ Please provide a valid PID');
        process.exit(1);
      }

      const signalArg = args.find(arg => arg.startsWith('--signal=')) || '--signal=SIGTERM';
      const signal = signalArg.split('=')[1] as Signal;

      await TestProcessManager.kill(pid, signal);
      break;
    }

    case 'list': {
      const testsOnly = args.includes('--tests-only');
      TestProcessManager.list(testsOnly);
      break;
    }

    case 'monitor': {
      await TestProcessManager.monitor();
      break;
    }

    case 'graceful': {
      const pid = parseInt(args[1]);
      if (!pid) {
        console.error('❌ Please provide a valid PID');
        process.exit(1);
      }

      const timeoutArg = args.find(arg => arg.startsWith('--timeout='));
      const timeout = timeoutArg ? parseInt(timeoutArg.split('=')[1]) : 5000;

      await TestProcessManager.gracefulShutdown(pid, timeout);
      break;
    }

    case 'kill-all': {
      const signalArg = args.find(arg => arg.startsWith('--signal=')) || '--signal=SIGTERM';
      const signal = signalArg.split('=')[1] as Signal;

      await TestProcessManager.killAllTests(signal);
      break;
    }

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log();
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

// Export for testing
export { TestProcessManager };
