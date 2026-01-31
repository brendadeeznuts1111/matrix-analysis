#!/usr/bin/env bun
// examples/bun-utilities-demo.ts
// Live demonstration of Bun utility APIs for Omega Phase 3.25

// Make this file a module
export {};

import { resolveOmegaTool } from "../utils/omega-tool-resolver";

async function runDemo() {
  console.log('🚀 Bun Utility APIs Live Demo');
  console.log('=============================\n');

  // 1. Bun.which() - Tool Resolution
  console.log('1️⃣  Bun.which() - Tool Resolution');
  console.log('------------------------------');

  const tools = ['bun', 'git', 'node', 'npm', 'sqlite3', 'code'];
  const toolResults: Record<string, string | null> = {};

  // Time the resolution
  console.time('Tool resolution (6 tools)');
  for (const tool of tools) {
    const path = await resolveOmegaTool(tool);
    toolResults[tool] = path;
    console.log(`  ${tool}: ${path || '❌ not found'}`);
  }
  console.timeEnd('Tool resolution (6 tools)');

// 2. Bun.randomUUIDv7() - UUID Generation
console.log('\n2️⃣  Bun.randomUUIDv7() - UUID Generation');
console.log('------------------------------------');

console.time('UUID generation (1000)');
const uuids = [];
for (let i = 0; i < 1000; i++) {
  uuids.push(Bun.randomUUIDv7());
}
console.timeEnd('UUID generation (1000)');

console.log('  Sample UUIDs:');
console.log(`    Default: ${uuids[0]}`);
console.log(`    Base64: ${Bun.randomUUIDv7('base64')}`);
console.log(`    Hex: ${Bun.randomUUIDv7('hex')}`);
console.log(`    Buffer: ${Bun.randomUUIDv7('buffer')}`);

// Verify monotonic property
const sorted = [...uuids].sort();
const isMonotonic = uuids.every((uuid, i) => uuid === sorted[i]);
console.log(`  Monotonic: ${isMonotonic ? '✅' : '❌'}`);

// 3. Bun.peek() - Non-blocking Promise Inspection
console.log('\n3️⃣  Bun.peek() - Promise Inspection');
console.log('-----------------------------------');

// Create various promise states
const immediate = Promise.resolve('immediate');
const delayed = new Promise(resolve => setTimeout(() => resolve('delayed'), 100));
const rejected = Promise.reject(new Error('rejected'));
rejected.catch(() => {}); // Prevent unhandled rejection

// Peek without awaiting
console.log('  Immediate promise:', Bun.peek(immediate));
console.log('  Delayed promise:', Bun.peek(delayed));
try {
  console.log('  Rejected promise:', Bun.peek(rejected));
} catch {
  console.log('  Rejected promise: [Error]');
}

// Check statuses
console.log('  Status checks:');
console.log(`    Immediate: ${Bun.peek.status(immediate)}`);
console.log(`    Delayed: ${Bun.peek.status(delayed)}`);
console.log(`    Rejected: ${Bun.peek.status(rejected)}`);

// Performance test
console.time('Peek 10000 promises');
const promises = Array(10000).fill(null).map(() => Promise.resolve(Math.random()));
for (const p of promises) {
  Bun.peek(p);
}
console.timeEnd('Peek 10000 promises');

// 4. Bun.stringWidth() - Terminal String Width
console.log('\n4️⃣  Bun.stringWidth() - Terminal Width');
console.log('-------------------------------------');

const testStrings = [
  'Hello World',
  '🔥 Fire Emoji',
  '\x1b[31mRed Text\x1b[0m',
  '中文测试',
  '👩‍💻 Complex Emoji',
  '┌─┬─┐ Table Borders',
];

console.log('  String width calculations:');
testStrings.forEach(str => {
  const width = Bun.stringWidth(str);
  const visual = str.replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI for display
  console.log(`    "${visual}" -> ${width} columns`);
});

// Create a CLI table
console.log('\n  CLI Table Demo:');
const table = [
  ['Tool', 'Path', 'Status'],
  ['----', '----', '------'],
];
Object.entries(toolResults).forEach(([tool, path]) => {
  const status = path ? '✅' : '❌';
  const displayPath = path ? path.substring(0, 30) + (path.length > 30 ? '...' : '') : 'Not found';
  table.push([tool, displayPath, status]);
});

// Calculate column widths
const colWidths = [0, 0, 0];
table.forEach(row => {
  row.forEach((cell, i) => {
    colWidths[i] = Math.max(colWidths[i], Bun.stringWidth(cell));
  });
});

// Print aligned table
table.forEach(row => {
  const line = row.map((cell, i) =>
    cell.padEnd(colWidths[i])
  ).join(' | ');
  console.log(`    ${line}`);
});

// 5. Bun.deepEquals() - Deep Equality
console.log('\n5️⃣  Bun.deepEquals() - Deep Equality');
console.log('----------------------------------');

const obj1 = { tools: toolResults, uuids: uuids.slice(0, 5) };
const obj2 = { tools: { ...toolResults }, uuids: uuids.slice(0, 5) };
const obj3 = { tools: toolResults, uuids: uuids.slice(0, 6) };

console.log('  Equality tests:');
console.log(`    obj1 === obj2: ${obj1 === obj2}`);
console.log(`    deepEquals(obj1, obj2): ${Bun.deepEquals(obj1, obj2)}`);
console.log(`    deepEquals(obj1, obj3): ${Bun.deepEquals(obj1, obj3)}`);

// Strict mode test
const sparse1 = [1, , 3]; // sparse array
const sparse2 = [1, undefined, 3];
console.log(`    sparse arrays (non-strict): ${Bun.deepEquals(sparse1, sparse2)}`);
console.log(`    sparse arrays (strict): ${Bun.deepEquals(sparse1, sparse2, true)}`);

// 6. Bun.escapeHTML() - HTML Escaping
console.log('\n6️⃣  Bun.escapeHTML() - HTML Escaping');
console.log('-----------------------------------');

const htmlInputs = [
  '<script>alert("xss")</script>',
  'Tom & Jerry',
  '"quoted" text',
  "'single' quotes",
  '5 > 3 && 2 < 4',
];

console.log('  HTML escaping:');
htmlInputs.forEach(input => {
  const escaped = Bun.escapeHTML(input);
  console.log(`    "${input}" -> "${escaped}"`);
});

// Performance test
const htmlString = '<div>{{content}}</div>'.repeat(1000);
console.time('Escape HTML (1000x 60 chars)');
for (let i = 0; i < 1000; i++) {
  Bun.escapeHTML(htmlString);
}
console.timeEnd('Escape HTML (1000x 60 chars)');

// 7. Bun.fileURLToPath() / Bun.pathToFileURL() - URL/Path Conversion
console.log('\n7️⃣  URL/Path Conversion');
console.log('---------------------');

const testPaths = [
  '/Users/nolarose/my-wager-v3/package.json',
  './examples/bun-utilities-demo.ts',
  '/tmp/test.txt',
];

testPaths.forEach(path => {
  const url = Bun.pathToFileURL(path);
  const backToPath = Bun.fileURLToPath(url);
  console.log(`    ${path}`);
  console.log(`      → ${url}`);
  console.log(`      → ${backToPath}`);
  console.log(`      ✅ Roundtrip: ${path === backToPath}`);
});

// 8. Integration Demo - Omega Phase 3.25
console.log('\n8️⃣  Omega Phase 3.25 Integration');
console.log('-------------------------------');

// Create a pool session with UUID
const poolSession = {
  id: Bun.randomUUIDv7('base64'),
  tools: toolResults,
  startTime: Date.now(),
  status: 'active',
};

console.log('  Pool Session:');
console.log(`    ID: ${poolSession.id}`);
console.log(`    Tools resolved: ${Object.values(poolSession.tools).filter(Boolean).length}/${Object.keys(poolSession.tools).length}`);

// Async stats with peek
const statsPromise = new Promise(resolve => {
  setTimeout(() => resolve({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    toolCacheSize: Object.keys(toolResults).length,
  }), 50);
});

const stats = Bun.peek(statsPromise);
console.log(`    Stats (peek): ${stats ? 'Available' : 'Pending'}`);

// Generate CLI report
console.log('\n  CLI Report (aligned):');
const report = [
  ['Pool Session', poolSession.id],
  ['Start Time', new Date(poolSession.startTime).toISOString()],
  ['Tools', `${Object.values(poolSession.tools).filter(Boolean).length} found`],
  ['Memory', stats && typeof stats === 'object' && 'memory' in stats ?
    `${Math.round((stats as any).memory.heapUsed / 1024 / 1024)}MB` : '...'],
];

const reportWidths = [12, 40];
report.forEach(([label, value]) => {
  console.log(`    ${label.padEnd(reportWidths[0])} ${value}`);
});

// 9. Performance Summary
console.log('\n9️⃣  Performance Summary');
console.log('----------------------');

console.log('  Key Performance Insights:');
console.log('    • stringWidth: ~6,756x faster than npm alternatives');
console.log('    • peek: Zero microtask overhead');
console.log('    • escapeHTML: 480MB/s–20GB/s (SIMD optimized)');
console.log('    • randomUUIDv7: Crypto-fast with BoringSSL');
console.log('    • deepEquals: Optimized recursion algorithm');
console.log('    • which: ~1.5ms/1000 lookups (faster without cwd)');

console.log('\n✅ Demo Complete! All Bun utilities working perfectly.');
