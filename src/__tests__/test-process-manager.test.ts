import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { spawn } from 'bun';

// Import the TestProcessManager from the scripts directory
const testProcessManagerModule = await import('../../scripts/test-process-manager');
const TestProcessManager = testProcessManagerModule.TestProcessManager;

describe('Test Process Manager', () => {
  let testProcess: any;
  let testPid: number | null = null;

  beforeEach(async () => {
    // Start a long-running test process
    testProcess = spawn({
      cmd: ['bun', 'test', '--timeout', '30000', './src/__tests__/network-control.test.ts'],
      stdout: 'ignore',
      stderr: 'ignore'
    });

    // Wait a moment for process to start
    await new Promise(resolve => setTimeout(resolve, 100));
    testPid = testProcess.pid;
  });

  afterEach(async () => {
    // Clean up any remaining processes
    if (testPid) {
      try {
        process.kill(testPid, 'SIGKILL');
      } catch {
        // Process might already be dead
      }
    }

    if (testProcess) {
      await testProcess.exited;
    }
  });

  describe('Process Detection', () => {
    it('should find test processes', () => {
      const processes = TestProcessManager.findTestProcesses();
      expect(Array.isArray(processes)).toBe(true);

      if (testPid) {
        const found = processes.find((p: any) => p.pid === testPid);
        expect(found).toBeDefined();
        expect(found?.isTest).toBe(true);
      }
    });

    it('should identify test processes correctly', () => {
      const command = 'bun test --timeout 30000 ./src/__tests__/network-control.test.ts';
      const isTest = (TestProcessManager as any).isTestProcess(command);
      expect(isTest).toBe(true);
    });

    it('should reject non-test processes', () => {
      const command = 'bun run src/cli.ts';
      const isTest = (TestProcessManager as any).isTestProcess(command);
      expect(isTest).toBe(false);
    });
  });

  describe('Process Termination', () => {
    it('should gracefully terminate with SIGTERM', async () => {
      if (!testPid) {
        expect(true).toBe(true); // Skip if no process
        return;
      }

      const result = await TestProcessManager.kill(testPid, 'SIGTERM');
      expect(result).toBe(true);

      // Process should terminate within reasonable time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify process is dead
      expect(() => process.kill(testPid!, 0)).toThrow();
    });

    it('should immediately terminate with SIGKILL', async () => {
      if (!testPid) {
        expect(true).toBe(true); // Skip if no process
        return;
      }

      const result = await TestProcessManager.kill(testPid, 'SIGKILL');
      expect(result).toBe(true);

      // Process should terminate immediately
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify process is dead
      expect(() => process.kill(testPid!, 0)).toThrow();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully with timeout', async () => {
      if (!testPid) {
        expect(true).toBe(true); // Skip if no process
        return;
      }

      const result = await TestProcessManager.gracefulShutdown(testPid, 1000);
      expect(result).toBe(true);

      // Verify process is dead
      expect(() => process.kill(testPid!, 0)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent process', async () => {
      const fakePid = 99999;
      const result = await TestProcessManager.kill(fakePid);
      expect(result).toBe(false);
    });

    it('should handle invalid PID gracefully', async () => {
      const invalidPid = -1;
      // Should not throw
      await expect(TestProcessManager.kill(invalidPid)).resolves.toBe(false);
    });
  });

  describe('Process Listing', () => {
    it('should list processes without errors', () => {
      // Should not throw
      expect(() => TestProcessManager.list()).not.toThrow();
      expect(() => TestProcessManager.list(true)).not.toThrow();
    });
  });
});
