#!/usr/bin/env bun
// Examples Index - Tension Field System
// Organized examples aligned with Bun documentation

import { spawn } from 'bun';

const categories = [
  { 
    name: 'Color Formatting', 
    dir: 'color',
    description: 'Bun.color API demonstrations'
  },
  { 
    name: 'File Writing', 
    dir: 'write-file',
    description: 'Bun.write API demonstrations'
  }
];

console.log('📚 Tension Field System Examples');
console.log('================================\n');

console.log('Available example categories:\n');

categories.forEach((cat, index) => {
  console.log(`${index + 1}. ${cat.name}`);
  console.log(`   ${cat.description}`);
   console.log(`   Run: bun ${cat.dir}/index.ts\n`);
});

// If arguments provided, run specific category
const args = process.argv.slice(2);
if (args.length > 0) {
  const category = categories.find(c => c.dir === args[0]);
  if (category) {
    console.log(`🚀 Running ${category.name} examples...\n`);
    
    const proc = spawn({
      cmd: ['bun', 'index.ts'],
      cwd: `${import.meta.dir}/${category.dir}`,
      stdout: 'inherit',
      stderr: 'inherit'
    });
    
    await proc.exited;
    
    if (proc.exitCode !== 0) {
      console.error(`❌ Examples failed with exit code ${proc.exitCode}`);
      process.exit(proc.exitCode);
    }
  } else {
    console.error(`❌ Unknown category: ${args[0]}`);
    console.log('Available categories:', categories.map(c => c.dir).join(', '));
    process.exit(1);
  }
} else {
  console.log('💡 Usage: bun index.ts [category]');
  console.log('   Example: bun index.ts color');
}
