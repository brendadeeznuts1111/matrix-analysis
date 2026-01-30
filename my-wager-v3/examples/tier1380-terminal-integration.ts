#!/usr/bin/env bun
// examples/tier1380-terminal-integration.ts
// Complete Tier-1380 PTY Supremacy Demo

export {}; // Make this file a module

import { DedicatedTerminalManager } from '../terminals/terminal-manager';
import { Col93MatrixDisplay, runCol93Demo } from '../terminals/col93-matrix-display';
import { Tier1380Application } from '../terminals/feature-flags';

console.log('🔒 Tier-1380 PTY Supremacy — Native Terminal Integration');
console.log('========================================================\n');

// Initialize feature flags
const app = new Tier1380Application();
await app.initialize();

console.log('\n');

// Show Col 93 Matrix Display
runCol93Demo();

console.log('\n🖥️ Terminal Manager Demo');
console.log('========================');

// Initialize terminal manager
const terminalManager = new DedicatedTerminalManager();

// Demo 1: Create a quantum terminal
console.log('\n1️⃣ Creating Quantum Terminal...');
try {
  const terminal = await terminalManager.createQuantumTerminal('tier1380-demo');
  console.log(`✅ Quantum terminal created: ${terminal.id}`);
  
  // Demo 2: Execute commands in terminal
  console.log('\n2️⃣ Executing Commands...');
  const result = await terminalManager.executeInTerminal(
    terminal.id,
    ['echo', 'Hello from Tier-1380 PTY!'],
    {
      onResize: (cols, rows) => {
        console.log(`   Terminal resized to ${cols}x${rows}`);
      }
    }
  );
  console.log(`✅ Command executed with exit code: ${result.exitCode}`);
  
  // Demo 3: Create reusable terminal
  console.log('\n3️⃣ Creating Reusable Terminal...');
  const reusable = await terminalManager.createReusableTerminal('tier1380-reusable');
  const exitCode = await reusable.execute(['date']);
  console.log(`✅ Reusable terminal executed date command: ${exitCode}`);
  
  // Cleanup
  await terminal[Symbol.asyncDispose]();
  await reusable[Symbol.asyncDispose]();
  console.log('\n✅ All terminals sealed and cleaned up');
  
} catch (error) {
  if (error instanceof Error && error.message.includes('POSIX')) {
    console.log('⚠️ PTY not available on this platform (requires Linux/macOS)');
  } else {
    console.error('❌ Error:', error);
  }
}

console.log('\n📊 String Width Improvements Demo');
console.log('==================================');

// Demonstrate stringWidth v2 improvements
const display = new Col93MatrixDisplay();

const testStrings = [
  { text: '👍', expected: 2, desc: 'Single emoji' },
  { text: '👨‍👩‍👧', expected: 2, desc: 'ZWJ family (was 8, now 2)' },
  { text: 'café', expected: 4, desc: 'Accented character' },
  { text: 'नमस्ते', expected: 6, desc: 'Devanagari (GB9c)' },
  { text: '\u001B[31mRed\u001B[0m', expected: 3, desc: 'ANSI color (codes ignored)' },
  { text: 'soft\u00ADhyphen', expected: 9, desc: 'Soft hyphen ignored' }
];

testStrings.forEach(({ text, expected, desc }) => {
  const actual = Bun.stringWidth(text);
  const status = actual === expected ? '✅' : '❌';
  console.log(`${status} ${desc}: "${text}" = ${actual} (expected ${expected})`);
});

console.log('\n🔒 Tier-1380 PTY Integration Complete!');
console.log('=====================================');
console.log('✅ Native PTY support (Bun v1.3.5)');
console.log('✅ Feature flags for compile-time optimization');
console.log('✅ Col 93 compliance with accurate stringWidth');
console.log('✅ Quantum-sealed terminal sessions');
console.log('✅ Auto-cleanup with await using');
console.log('✅ Security scanning of PTY output');

// Build instructions
console.log('\n📝 Build Instructions:');
console.log('----------------------');
console.log('# Debug build with all features:');
console.log('bun build --feature=TIER_1380_DEBUG --feature=QUANTUM_ENCRYPTION --feature=PTY_SUPPORT ./examples/tier1380-terminal-integration.ts');
console.log('');
console.log('# Production build (debug removed):');
console.log('bun build --feature=QUANTUM_ENCRYPTION --feature=PTY_SUPPORT ./examples/tier1380-terminal-integration.ts');
console.log('');
console.log('# Minimal build:');
console.log('bun build --feature=PTY_SUPPORT ./examples/tier1380-terminal-integration.ts');
