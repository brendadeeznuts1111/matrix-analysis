#!/usr/bin/env bun
// Bun Terminal API Demo - PTY Support
// Demonstrates running vim with pseudo-terminal

export {}; // Make this file a module

console.log("🖥️ Bun Terminal API Demo");
console.log("========================");
console.log("Launching vim with PTY support...");
console.log("Press Ctrl+C to exit vim, then the demo will exit");
console.log("");

// Create a test file to edit
await Bun.write("demo-file.txt", `
# Welcome to Bun Terminal API Demo!

This file is being edited in vim through Bun's PTY support.

Features demonstrated:
- PTY (pseudo-terminal) creation
- Terminal resize handling
- Input forwarding
- Interactive program execution

Try:
- Moving the cursor with arrow keys
- Entering insert mode (press 'i')
- Typing some text
- Saving (:w) and quitting (:q)
`);

// Run vim with PTY
const proc = Bun.spawn(["vim", "demo-file.txt"], {
  terminal: {
    cols: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
    data(term, data) {
      process.stdout.write(data);
    },
  },
});

// Handle process exit
proc.exited.then((code) => {
  console.log(`\n✅ Vim exited with code: ${code}`);

  // Show the edited file content
  console.log("\n📄 Edited file content:");
  console.log("=====================");
  const content = await Bun.file("demo-file.txt").text();
  console.log(content);

  // Cleanup
  await Bun.file("demo-file.txt").delete();
  process.exit(code);
});

// Handle terminal resize
process.stdout.on("resize", () => {
  if (proc.terminal) {
    proc.terminal.resize(process.stdout.columns || 80, process.stdout.rows || 24);
  }
});

// Forward input from user to vim
process.stdin.setRawMode(true);

try {
  for await (const chunk of process.stdin) {
    if (proc.terminal) {
      proc.terminal.write(chunk);
    }
  }
} catch (error) {
  // Handle Ctrl+C gracefully
  console.log("\n\n🛑 Interrupted by user");
  proc.kill();
  await Bun.file("demo-file.txt").delete();
  process.exit(130);
}
