#!/usr/bin/env bun
// Bun.color Examples Index
// Run all color-related examples

import { spawn } from 'bun';

const examples = [
  { name: 'Flexible Input Formats', file: 'flexible-input.ts' },
  { name: 'Database Integration', file: 'database-integration.ts' },
  { name: 'ANSI Output', file: 'ansi-output.ts' },
  { name: 'MCP Integration', file: 'mcp-integration.ts' }
];

console.log('🎨 Bun.color Examples');
console.log('====================\n');

for (const example of examples) {
  console.log(`\n📂 ${example.name}:`);
  console.log('─'.repeat(40));
  
  const proc = spawn({
    cmd: ['bun', example.file],
    cwd: import.meta.dir,
    stdout: 'pipe',
    stderr: 'pipe'
  });
  
  const text = await new Response(proc.stdout).text();
  console.log(text);
  
  if (proc.exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    console.error(`Error: ${error}`);
  }
  
  if (example !== examples[examples.length - 1]) {
    console.log('\n' + '='.repeat(50));
    await Bun.sleep(1000);
  }
}

console.log('\n✅ All examples complete!');
