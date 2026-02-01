#!/usr/bin/env bun
/**
 * Demonstrate Buffer swap methods
 */

// Create a 64 KiB buffer
const demoBuf = Buffer.alloc(64 * 1024);

// Fill with some pattern to see the swapping effect
for (let i = 0; i < demoBuf.length; i++) {
  demoBuf[i] = i % 256;
}

console.log('Buffer size:', demoBuf.length, 'bytes');
console.log('First 16 bytes before swap:', Array.from(demoBuf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));

// Perform swap16 - swaps every pair of bytes
console.log('\nPerforming demoBuf.swap16()...');
demoBuf.swap16();
console.log('First 16 bytes after swap16:', Array.from(demoBuf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));

// Reset buffer
for (let i = 0; i < demoBuf.length; i++) {
  demoBuf[i] = i % 256;
}

// Perform swap64 - swaps every 8-byte chunk
console.log('\nResetting buffer...');
console.log('First 16 bytes before swap64:', Array.from(demoBuf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));

console.log('\nPerforming demoBuf.swap64()...');
try {
  demoBuf.swap64();
  console.log('First 16 bytes after swap64:', Array.from(demoBuf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log('✅ swap64() is available in this Bun version');
} catch (error: any) {
  console.log('❌ swap64() is not available:', error.message);
  console.log('💡 Buffer.swap64 requires Bun v1.3.7 or later');
}

// Show Bun version
console.log('\nCurrent Bun version:', process.version);
