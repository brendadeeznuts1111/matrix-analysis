#!/usr/bin/env bun
// examples/terminal-interactive-demo.ts
// Interactive Programs & Reusable Terminals with Bun v1.3.5

export {}; // Make this file a module

console.log('🖥️ Bun Terminal API - Interactive Programs Demo');
console.log('==============================================\n');

// Demo 1: Interactive vim with full PTY support
console.log('1️⃣ Interactive Vim Demo');
console.log('-----------------------');
console.log('Opening vim with PTY support...');
console.log('Controls: i (insert), Esc (command), :wq (save & quit)\n');

// Create a test file for vim
await Bun.write('interactive-demo.txt', `
# Interactive Terminal Demo

This file will open in vim through Bun's PTY support.

Try these commands:
- Move with arrow keys
- Press 'i' to enter insert mode
- Type some text
- Press Esc to exit insert mode
- Type :wq to save and quit

The PTY provides full terminal functionality including:
- Colors and syntax highlighting
- Cursor movement
- Interactive prompts
- Proper TTY detection
`);

// Interactive vim example
const proc = Bun.spawn(["vim", "interactive-demo.txt"], {
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
  
  // Show the edited file
  console.log('\n📄 Edited file content:');
  console.log('=======================');
  const content = await Bun.file('interactive-demo.txt').text();
  console.log(content);
  
  // Cleanup
  Bun.file('interactive-demo.txt').delete();
  runReusableTerminalDemo();
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
  Bun.file('interactive-demo.txt').delete();
  process.exit(130);
}

// Demo 2: Reusable terminals
async function runReusableTerminalDemo() {
  console.log('\n\n2️⃣ Reusable Terminal Demo');
  console.log('=========================');
  
  // Create a standalone terminal to reuse across multiple subprocesses
  await using terminal = new Bun.Terminal({
    cols: 80,
    rows: 24,
    data(term, data) {
      // Add timestamp to distinguish output
      const timestamp = new Date().toLocaleTimeString().split(' ')[0];
      const prefixed = data.toString()
        .split('\n')
        .map(line => `[${timestamp}] ${line}`)
        .join('\n');
      process.stdout.write(prefixed);
    },
  });
  
  console.log('Created reusable terminal, running multiple commands...\n');
  
  // First process
  console.log('Running: echo "First command"');
  const proc1 = Bun.spawn(["echo", "First command"], { terminal });
  await proc1.exited;
  
  // Second process
  console.log('\nRunning: date');
  const proc2 = Bun.spawn(["date"], { terminal });
  await proc2.exited;
  
  // Third process - interactive
  console.log('\nRunning: bash with multiple commands');
  const proc3 = Bun.spawn(["bash"], { terminal });
  
  // Send commands to bash via terminal
  setTimeout(() => {
    terminal.write("echo 'Hello from reusable terminal!'\n");
    terminal.write("pwd\n");
    terminal.write("whoami\n");
    terminal.write("exit\n");
  }, 500);
  
  await proc3.exited;
  
  // Fourth process - show environment
  console.log('\nRunning: env | grep BUN');
  const proc4 = Bun.spawn(["env"], { terminal });
  
  // Filter for BUN variables
  setTimeout(() => {
    terminal.write("grep BUN\n");
  }, 100);
  
  await proc4.exited;
  
  console.log('\n✅ All processes completed!');
  console.log('Terminal will be automatically closed by await using');
  
  // Demo 3: Terminal methods showcase
  await demonstrateTerminalMethods();
}

// Demo 3: Terminal API methods
async function demonstrateTerminalMethods() {
  console.log('\n\n3️⃣ Terminal API Methods');
  console.log('=======================');
  
  const terminal = new Bun.Terminal({
    cols: 60,
    rows: 10,
    data(term, data) {
      process.stdout.write(data);
    },
  });
  
  console.log('Created terminal for method demonstration...\n');
  
  // Write method
  console.log('1. terminal.write() - Send data to terminal');
  terminal.write('echo "Testing write method"\n');
  
  // Resize method
  console.log('2. terminal.resize() - Change terminal dimensions');
  terminal.resize(70, 15);
  terminal.write('echo "Terminal resized to 70x15"\n');
  
  // Run a command to show the new size
  const proc = Bun.spawn(["bash"], { terminal });
  setTimeout(() => {
    terminal.write("echo 'Current terminal size:'\n");
    terminal.write("stty size\n");
    terminal.write("exit\n");
  }, 200);
  
  await proc.exited;
  
  // ref/unref methods (event loop control)
  console.log('\n3. terminal.ref()/unref() - Event loop control');
  console.log('   ref() keeps the event loop running');
  console.log('   unref() allows the process to exit');
  
  // Close method
  console.log('\n4. terminal.close() - Manual cleanup');
  terminal.close();
  console.log('✅ Terminal closed manually');
  
  // Final demo: Platform check
  console.log('\n📋 Platform Information');
  console.log('=======================');
  console.log(`Platform: ${process.platform}`);
  console.log(`PTY Support: ${process.platform !== 'win32' ? '✅ Available' : '❌ Not available (Windows)'}`);
  console.log(`Bun Version: ${process.version}`);
  
  if (process.platform === 'win32') {
    console.log('\n⚠️ Note: Terminal API requires POSIX (Linux/macOS)');
    console.log('   Windows support can be requested at: https://github.com/oven-sh/bun/issues');
  }
  
  console.log('\n🎉 Terminal API Demo Complete!');
  console.log('===============================');
  console.log('✅ Interactive programs with full PTY support');
  console.log('✅ Reusable terminals with await using');
  console.log('✅ Terminal methods: write, resize, ref/unref, close');
  console.log('✅ Cross-platform compatibility (POSIX only)');
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Cleaning up...');
  Bun.file('interactive-demo.txt').delete().catch(() => {});
  process.exit(0);
});
