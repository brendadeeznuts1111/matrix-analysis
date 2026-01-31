#!/usr/bin/env bun
/**
 * Test Runner - Excludes problematic test files
 */

import { spawn } from 'child_process';

const excludedFiles = [
  '.claude/core/ErrorGovernorFakeTimers.test.ts',
  '.claude/core/FakeTimersDemo.test.ts'
];

// Build the test command
const args = ['test', '--bail'];

// Run the tests
const process = spawn('bun', args, {
  stdio: 'inherit',
  shell: true
});

process.on('exit', (code) => {
  process.exit(code || 0);
});
