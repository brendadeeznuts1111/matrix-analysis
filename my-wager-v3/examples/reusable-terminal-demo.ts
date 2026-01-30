#!/usr/bin/env bun
// Reusable Terminal Demo - Bun v1.3.5
// Shows how to create and reuse a terminal across multiple processes

export {}; // Make this file a module

console.log("🔄 Reusable Terminal Demo");
console.log("=========================");

// Create a reusable terminal
await using terminal = new Bun.Terminal({
  cols: 80,
  rows: 24,
  data(term, data) {
    // Convert data to string if it's a Buffer
    const dataStr = Buffer.isBuffer(data) ? data.toString() : data;
    // Add prefix to distinguish output
    const prefixed = dataStr.split('\n').map((line: string) => `[TERM] ${line}`).join('\n');
    process.stdout.write(prefixed);
  },
});

console.log("Created reusable terminal, running multiple commands...\n");

// First process: echo
console.log("1️⃣ Running: echo 'Hello from first process'");
const proc1 = Bun.spawn(["echo", "Hello from first process"], { terminal });
await proc1.exited;

// Second process: date
console.log("\n2️⃣ Running: date");
const proc2 = Bun.spawn(["date"], { terminal });
await proc2.exited;

// Third process: interactive bash
console.log("\n3️⃣ Running: bash with commands");
const proc3 = Bun.spawn(["bash"], { terminal });

// Send commands to bash via terminal
setTimeout(() => {
  terminal.write("echo 'Running in bash via PTY'\n");
  terminal.write("pwd\n");
  terminal.write("ls -la | head -5\n");
  terminal.write("exit\n");
}, 100);

await proc3.exited;

// Fourth process: top (built-in command)
console.log("\n4️⃣ Running top for 3 seconds");
const proc4 = Bun.spawn(["top"], {
  terminal,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit"
});

// Let top run for 3 seconds, then close
setTimeout(() => {
  proc4.kill();
}, 3000);

await proc4.exited;

console.log("\n✅ All processes completed!");
console.log("Terminal will be automatically closed by 'await using'");

// Demonstrate terminal methods
console.log("\n🔧 Terminal API Methods:");
console.log("- write(): Send data to terminal");
console.log("- resize(): Change terminal dimensions");
console.log("- setRawMode(): Control raw mode");
console.log("- ref()/unref(): Event loop control");
console.log("- close(): Manual close (auto-closed here)");
