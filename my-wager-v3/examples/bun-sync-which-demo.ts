#!/usr/bin/env bun
// examples/bun-sync-which-demo.ts
// Demonstrating Bun.sleepSync and Bun.which

// Make this file a module
export {};

console.log("Bun.sleepSync & Bun.which Demo");
console.log("==============================");

// 1. Bun.which - Find executable paths
console.log("\n1. Bun.which (Executable Path Resolution):");

// Find common executables
const executables = ['bun', 'node', 'npm', 'git', 'ls', 'curl'];
executables.forEach(exec => {
  const path = Bun.which(exec);
  console.log(`${exec}: ${path || 'not found'}`);
});

// Custom PATH example
console.log("\nCustom PATH example:");
const customPath = Bun.which('bun', {
  PATH: '/usr/local/bin:/usr/bin:/bin'
});
console.log(`bun with custom PATH: ${customPath}`);

// Current working directory example
console.log("\nCurrent working directory example:");
const cwdExample = Bun.which('bun', {
  cwd: '/tmp',
  PATH: ''
});
console.log(`bun from /tmp with empty PATH: ${cwdExample}`);

// 2. Bun.sleepSync - Blocking sleep
console.log("\n2. Bun.sleepSync (Blocking Sleep):");

console.log("Starting synchronous sleep demo...");
const start = Date.now();

console.log("Before sleepSync");
Bun.sleepSync(1000); // Blocks for 1 second
const afterSleep = Date.now();

console.log(`After sleepSync (actual delay: ${afterSleep - start}ms)`);

// Multiple sequential sleeps
console.log("\nSequential sleepSync calls:");
for (let i = 3; i > 0; i--) {
  console.log(`${i}...`);
  Bun.sleepSync(300); // Block for 300ms
}
console.log("Done!");

// 3. Practical usage examples
console.log("\n3. Practical Usage Examples:");

// Check if required tools are available
const requiredTools = ['bun', 'git'];
const missingTools = requiredTools.filter(tool => !Bun.which(tool));

if (missingTools.length === 0) {
  console.log("✅ All required tools are available");
} else {
  console.log(`❌ Missing tools: ${missingTools.join(', ')}`);
}

// Use sleepSync for rate limiting in sync operations
console.log("\nRate limiting with sleepSync:");
const messages = ['Message 1', 'Message 2', 'Message 3'];
messages.forEach((msg, index) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  if (index < messages.length - 1) {
    Bun.sleepSync(200); // Wait 200ms between messages
  }
});

// 4. Performance comparison
console.log("\n4. Performance Comparison:");

// Async vs Sync sleep
const asyncStart = performance.now();
await Bun.sleep(100);
const asyncEnd = performance.now();

const syncStart = performance.now();
Bun.sleepSync(100);
const syncEnd = performance.now();

console.log(`Async sleep 100ms: ${(asyncEnd - asyncStart).toFixed(2)}ms`);
console.log(`Sync sleep 100ms: ${(syncEnd - syncStart).toFixed(2)}ms`);

// 5. Environment detection
console.log("\n5. Environment Detection:");
const bunPath = Bun.which('bun');
if (bunPath) {
  console.log(`Bun located at: ${bunPath}`);

  // Check if it's the expected version
  const versionCheck = Bun.spawn({
    cmd: [bunPath, '--version'],
    stdout: 'pipe'
  });

  const text = await new Response(versionCheck.stdout).text();
  console.log(`Version: ${text.trim()}`);
}

// 6. PATH validation utility
console.log("\n6. PATH Validation:");
const pathEntries = (Bun.env.PATH || '').split(':');
console.log(`PATH has ${pathEntries.length} entries`);
console.log("First 3 entries:", pathEntries.slice(0, 3));

// Check if directories in PATH exist
const existingDirs = pathEntries.filter(dir => {
  try {
    const stats = Bun.file(dir);
    return stats.exists();
  } catch {
    return false;
  }
});

console.log(`${existingDirs.length}/${pathEntries.length} PATH directories exist`);

console.log("\n✅ Demo completed successfully!");
