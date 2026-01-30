#!/usr/bin/env bun
// Bun.write Examples Index
// Demonstrating various write-file capabilities

import { spawn } from 'bun';

const examples = [
  { name: 'Writing to stdout', file: 'stdout.ts' }
];

console.log('📝 Bun.write Examples');
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
}

console.log('\n✅ All examples complete!');
