#!/usr/bin/env bun
/**
 * Bun Terminal API Demo
 * Demonstrates pseudo-terminal (PTY) support for interactive applications
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO 1: Basic PTY with Command Automation
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO 1: Basic PTY with Command Automation
// ═══════════════════════════════════════════════════════════════════════════════

const demoBasicPTY = async () => {
  console.log("🖥️  Demo 1: Basic PTY with Automated Commands\n");

  const commands = ["echo Hello from PTY!", "pwd", "exit"];
  
  const proc = Bun.spawn(["bash"], {
    terminal: {
      cols: 80,
      rows: 24,
      data(terminal, data) {
        process.stdout.write(data);

        // Auto-respond to shell prompt
        if (data.includes("$") && commands.length > 0) {
          const cmd = commands.shift();
          if (cmd) {
            setTimeout(() => terminal.write(cmd + "\n"), 100);
          }
        }
      },
    },
  });

  await proc.exited;
  proc.terminal?.close();
  console.log("\n✓ PTY session complete\n");
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO 2: Interactive Program (htop-style simulation)
// ═══════════════════════════════════════════════════════════════════════════════

const demoInteractiveProgram = async () => {
  console.log("🖥️  Demo 2: Running Interactive Program\n");

  // Example: Run a command that expects TTY
  const proc = Bun.spawn(["ls", "-la", "--color=auto"], {
    terminal: {
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
      data(term, data) {
        process.stdout.write(data);
      },
    },
  });

  const code = await proc.exited;
  console.log(`\n✓ Process exited with code ${code}\n`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO 3: Reusable Terminal
// ═══════════════════════════════════════════════════════════════════════════════

const demoReusableTerminal = async () => {
  console.log("🖥️  Demo 3: Reusable Terminal Across Multiple Commands\n");

  // Create standalone terminal
  const terminal = new Bun.Terminal({
    cols: 80,
    rows: 24,
    data(term, data) {
      process.stdout.write(data);
    },
  });

  try {
    // First command
    console.log("Running first command...");
    const proc1 = Bun.spawn(["echo", "First command output"], { terminal });
    await proc1.exited;

    // Second command (reuse same terminal)
    console.log("Running second command...");
    const proc2 = Bun.spawn(["echo", "Second command output"], { terminal });
    await proc2.exited;

    console.log("✓ Reusable terminal demo complete\n");
  } finally {
    terminal.close();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO 4: Terminal with Resize Support
// ═══════════════════════════════════════════════════════════════════════════════

const demoResizableTerminal = async () => {
  console.log("🖥️  Demo 4: Resizable Terminal\n");

  const terminal = new Bun.Terminal({
    cols: 80,
    rows: 24,
    data(term, data) {
      process.stdout.write(data);
    },
  });

  // Simulate resize
  console.log("Initial size: 80x24");
  
  setTimeout(() => {
    terminal.resize(120, 30);
    console.log("Resized to: 120x30");
  }, 500);

  const proc = Bun.spawn(["echo", "Terminal supports dynamic resizing"], { terminal });
  await proc.exited;
  
  terminal.close();
  console.log("✓ Resizable terminal demo complete\n");
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO 5: Raw Mode Input Forwarding
// ═══════════════════════════════════════════════════════════════════════════════

const demoRawModeInput = async () => {
  console.log("🖥️  Demo 5: Raw Mode Input (simulated)\n");
  console.log("Note: This would forward stdin to PTY in a real interactive app\n");

  const terminal = new Bun.Terminal({
    cols: 80,
    rows: 24,
    data(term, data) {
      process.stdout.write(data);
    },
  });

  const proc = Bun.spawn(["echo", "Raw mode ready (simulated)"], { terminal });
  await proc.exited;
  
  terminal.close();
  console.log("✓ Raw mode demo complete\n");
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

const main = async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BUN TERMINAL API DEMO                                     ║
║                    Pseudo-Terminal (PTY) Support                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

Platform: ${process.platform}
Note: Terminal support is POSIX-only (Linux, macOS)
`);

  if (process.platform === "win32") {
    console.log("⚠️  Terminal API not available on Windows\n");
    return;
  }

  // Run demos
  await demoBasicPTY();
  await demoInteractiveProgram();
  await demoReusableTerminal();
  await demoResizableTerminal();
  await demoRawModeInput();

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         DEMO COMPLETE                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Features Demonstrated:                                                       ║
║   ✓ Bun.spawn() with terminal option                                         ║
║   ✓ Automated command sequences                                              ║
║   ✓ Reusable Bun.Terminal() instances                                        ║
║   ✓ Terminal resize operations                                               ║
║   ✓ Raw mode input forwarding pattern                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ API Methods:                                                                 ║
║   • terminal.write(data)    - Send data to PTY                               ║
║   • terminal.resize(cols, rows) - Resize terminal                            ║
║   • terminal.setRawMode(mode) - Set raw mode                                 ║
║   • terminal.ref()/unref()  - Reference counting                             ║
║   • terminal.close()        - Close terminal                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
};

main().catch(console.error);

