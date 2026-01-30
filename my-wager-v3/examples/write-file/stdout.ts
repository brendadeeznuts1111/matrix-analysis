#!/usr/bin/env bun
// Bun.stdout Demo - Simple Version
// Demonstrating stdout writing capabilities

// Make this a module
export {};

console.log('📤 Bun.stdout Demo');
console.log('==================\n');

// Demo 1: Basic Bun.write
console.log('1️⃣ Basic Bun.write:');
console.log('-------------------');

async function basicWrite() {
  await Bun.write(Bun.stdout, 'Hello from Bun.write() ');
  await Bun.write(Bun.stdout, 'continuing on same line.\n');
}

await basicWrite();

// Demo 2: Progress bar
console.log('\n2️⃣ Progress Bar:');
console.log('----------------');

async function progressBar() {
  for (let i = 0; i <= 50; i++) {
    const filled = Math.round((i / 50) * 20);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    const percent = Math.round((i / 50) * 100);
    
    await Bun.write(Bun.stdout, `\rProgress: [${bar}] ${percent}%`);
    await Bun.sleep(30);
  }
  await Bun.write(Bun.stdout, '\n');
}

await progressBar();

// Demo 3: Real-time status
console.log('\n3️⃣ Real-time Status:');
console.log('-------------------');

async function realTimeStatus() {
  const nodes = [
    { name: 'node-alpha', status: '🟢 Online', tension: 0.45 },
    { name: 'node-beta', status: '🟡 Warning', tension: 0.78 },
    { name: 'node-gamma', status: '🔴 Critical', tension: 0.92 }
  ];
  
  await Bun.write(Bun.stdout, 'System Status:\n');
  await Bun.write(Bun.stdout, '─'.repeat(30) + '\n');
  
  for (const node of nodes) {
    await Bun.write(Bun.stdout, `${node.name.padEnd(12)} | ${node.status} | ${node.tension.toFixed(2)}\n`);
    await Bun.sleep(200);
  }
}

await realTimeStatus();

// Demo 4: Colored output
console.log('\n4️⃣ Colored Output:');
console.log('-----------------');

async function coloredOutput() {
  const red = '\x1b[31m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const reset = '\x1b[0m';
  
  await Bun.write(Bun.stdout, green + '✅ Success: Operation completed' + reset + '\n');
  await Bun.write(Bun.stdout, yellow + '⚠️  Warning: Tension elevated' + reset + '\n');
  await Bun.write(Bun.stdout, red + '❌ Error: Node timeout' + reset + '\n');
}

await coloredOutput();

// Demo 5: Table output
console.log('\n5️⃣ Table Output:');
console.log('----------------');

async function tableOutput() {
  const data = [
    ['Metric', 'Value', 'Status'],
    ['Throughput', '9,344 req/s', '✅'],
    ['Latency', '0.11ms', '✅'],
    ['Memory', '45.67 MB', '✅']
  ];
  
  for (const row of data) {
    await Bun.write(Bun.stdout, `│${row[0].padEnd(12)}│${row[1].padEnd(12)}│${row[2].padEnd(8)}│\n`);
  }
}

await tableOutput();

// Demo 6: Performance test
console.log('\n6️⃣ Performance Test:');
console.log('--------------------');

async function performanceTest() {
  const iterations = 1000;
  const message = 'Test message';
  
  // Test console.log
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    console.log(message);
  }
  const time1 = performance.now() - start1;
  
  // Test Bun.write
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    await Bun.write(Bun.stdout, message + '\n');
  }
  const time2 = performance.now() - start2;
  
  console.log('Results:');
  console.log('console.log: ' + time1.toFixed(2) + 'ms');
  console.log('Bun.write:  ' + time2.toFixed(2) + 'ms');
  console.log('Speed difference: ' + (time1 / time2).toFixed(2) + 'x');
}

await performanceTest();

// Demo 7: MCP response formatting
console.log('\n7️⃣ MCP Response Format:');
console.log('-----------------------');

async function mcpResponse() {
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const reset = '\x1b[0m';
  
  await Bun.write(Bun.stdout, cyan + '╭─ Tool: get_system_status' + reset + '\n');
  await Bun.write(Bun.stdout, cyan + '│' + reset + '\n');
  await Bun.write(Bun.stdout, cyan + '│' + reset + ' Status: ' + green + '✅ Success' + reset + '\n');
  await Bun.write(Bun.stdout, cyan + '│' + reset + ' Nodes: 1,247\n');
  await Bun.write(Bun.stdout, cyan + '│' + reset + ' Memory: 45.67 MB\n');
  await Bun.write(Bun.stdout, cyan + '│' + reset + '\n');
  await Bun.write(Bun.stdout, cyan + '╰─ End of response' + reset + '\n');
}

await mcpResponse();

console.log('\n✅ Demo complete!');
console.log('\nKey features:');
console.log('  • Fine-grained output control');
console.log('  • No automatic line breaks');
console.log('  • Real-time updates');
console.log('  • Color support');
console.log('  • Binary data handling');
console.log('  • Better performance for bulk writes');
