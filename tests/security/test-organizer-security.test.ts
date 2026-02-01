#!/usr/bin/env bun
/**
 * Security Tests for Test Organizer
 *
 * Tests security aspects of the test organizer functionality.
 */

import { test, expect } from 'bun:test';
import { TestHelpers } from '../utils/test-helpers';
import { join } from 'path';

test('should handle malicious file paths safely', async () => {
  const { tempDir, cleanup } = await TestHelpers.createTempDir('security-test-');

  try {
    // Test path traversal attempts
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '/etc/passwd',
      'C:\\windows\\system32\\config\\sam',
      'file:///etc/passwd',
      'http://localhost/etc/passwd'
    ];

    for (const path of maliciousPaths) {
      const result = await TestHelpers.runCommand(`test-organizer --config="${path}"`, {
        cwd: tempDir,
        timeout: 5000
      });

      // Should not crash or expose sensitive files
      expect(result.exitCode).not.toBe(0); // Should fail safely
      expect(result.stderr).not.toContain('permission denied');
      expect(result.stderr).not.toContain('access denied');
    }
  } finally {
    await cleanup();
  }
});

test('should validate configuration file content', async () => {
  const { tempDir, cleanup } = await TestHelpers.createTempDir('config-validation-');

  try {
    // Test malicious configuration
    const maliciousConfig = {
      groups: {
        'malicious': {
          name: 'Malicious Group',
          patterns: ['../../../etc/passwd'], // Path traversal
          command: 'rm -rf /', // Command injection attempt
          environment: {
            'PATH': '/etc/passwd' // Environment poisoning
          }
        }
      }
    };

    await TestHelpers.createFixtureFile(tempDir, 'malicious-config.json', JSON.stringify(maliciousConfig));

    const result = await TestHelpers.runCommand('test-organizer --config=malicious-config.json', {
      cwd: tempDir,
      timeout: 5000
    });

    // Should reject malicious configuration
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('invalid');
  } finally {
    await cleanup();
  }
});

test('should sanitize environment variables', async () => {
  const { tempDir, cleanup } = await TestHelpers.createTempDir('env-sanitization-');

  try {
    // Test environment variable injection
    const maliciousEnv = {
      ...process.env,
      'TEST_PATH': '../../../etc/passwd',
      'TEST_COMMAND': 'rm -rf /',
      'TEST_CONFIG': '/etc/passwd'
    };

    const result = await TestHelpers.runCommand('test-organizer --list', {
      cwd: tempDir,
      env: maliciousEnv,
      timeout: 5000
    });

    // Should sanitize environment variables
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('permission denied');
  } finally {
    await cleanup();
  }
});

test('should handle large input safely', async () => {
  const { tempDir, cleanup } = await TestHelpers.createTempDir('large-input-');

  try {
    // Create a very large configuration file
    const largeConfig: { groups: Record<string, any> } = {
      groups: {}
    };

    // Add many groups with large names and patterns
    for (let i = 0; i < 1000; i++) {
      largeConfig.groups[`group-${'x'.repeat(1000)}-${i}`] = {
        name: 'x'.repeat(10000),
        description: 'x'.repeat(10000),
        patterns: ['x'.repeat(1000)],
        priority: 'medium',
        tags: ['x'.repeat(1000)]
      };
    }

    await TestHelpers.createFixtureFile(tempDir, 'large-config.json', JSON.stringify(largeConfig));

    const result = await TestHelpers.runCommand('test-organizer --config=large-config.json', {
      cwd: tempDir,
      timeout: 10000
    });

    // Should handle large input without crashing
    expect(result.exitCode).toBe(0);
  } finally {
    await cleanup();
  }
});

test('should prevent command injection', async () => {
  const { tempDir, cleanup } = await TestHelpers.createTempDir('command-injection-');

  try {
    // Test command injection in arguments
    const maliciousArgs = [
      '--config="; rm -rf /"',
      '--group="; cat /etc/passwd"',
      '--tag="; echo vulnerable"',
      '--priority="; ls -la /"'
    ];

    for (const arg of maliciousArgs) {
      const result = await TestHelpers.runCommand(`test-organizer ${arg}`, {
        cwd: tempDir,
        timeout: 5000
      });

      // Should not execute injected commands
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).not.toContain('permission denied');
    }
  } finally {
    await cleanup();
  }
});

test('should validate file permissions', async () => {
  const { tempDir, cleanup } = await TestHelpers.createTempDir('file-permissions-');

  try {
    // Create a file with restricted permissions
    const restrictedFile = join(tempDir, 'restricted.json');
    await TestHelpers.createFixtureFile(tempDir, 'restricted.json', '{}');

    // Set restrictive permissions (read-only for owner)
    await TestHelpers.runCommand(`chmod 400 ${restrictedFile}`, {
      cwd: tempDir,
      timeout: 1000
    });

    const result = await TestHelpers.runCommand('test-organizer --config=restricted.json', {
      cwd: tempDir,
      timeout: 5000
    });

    // Should handle permission errors gracefully
    expect(result.exitCode).toBe(0); // Should not crash
  } finally {
    await cleanup();
  }
});
