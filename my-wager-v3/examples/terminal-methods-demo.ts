#!/usr/bin/env bun
// examples/terminal-methods-demo.ts
// Terminal API Methods Demonstration (Non-interactive)

export {}; // Make this file a module

console.log('🔧 Bun Terminal API - Methods Demo');
console.log('===============================\n');

// Check platform
if (process.platform === 'win32') {
  console.log('⚠️ Terminal API requires POSIX (Linux/macOS)');
  console.log('   This demo will show the API structure but not run PTY commands\n');
}

// Demo 1: Terminal Methods Overview
console.log('1️⃣ Terminal Methods Overview');
console.log('=============================');

const methods = [
  { name: 'write()', desc: 'Send data to terminal', example: 'terminal.write("ls\\n")' },
  { name: 'resize()', desc: 'Change terminal dimensions', example: 'terminal.resize(cols, rows)' },
  { name: 'setRawMode()', desc: 'Control raw mode', example: 'terminal.setRawMode(true)' },
  { name: 'ref()', desc: 'Keep event loop running', example: 'terminal.ref()' },
  { name: 'unref()', desc: 'Allow process exit', example: 'terminal.unref()' },
  { name: 'close()', desc: 'Close terminal', example: 'terminal.close()' }
];

methods.forEach(method => {
  console.log(`• ${method.name.padEnd(15)} - ${method.desc}`);
  console.log(`  Example: ${method.example}\n`);
});

// Demo 2: Create and use a reusable terminal (if POSIX)
if (process.platform !== 'win32') {
  console.log('2️⃣ Reusable Terminal in Action');
  console.log('===============================\n');

  // Create reusable terminal with await using
  await using terminal = new Bun.Terminal({
    cols: 80,
    rows: 24,
    data(term, data) {
      // Process output
      const output = data.toString();
      if (output.trim()) {
        process.stdout.write(`[TERM] ${output}`);
      }
    },
  });

  console.log('✅ Created reusable terminal\n');

  // Execute multiple commands
  const commands = [
    { cmd: ['echo', 'Hello from reusable terminal!'], desc: 'Simple echo' },
    { cmd: ['date'], desc: 'Current date/time' },
    { cmd: ['pwd'], desc: 'Current directory' },
    { cmd: ['uname', '-a'], desc: 'System information' }
  ];

  for (const { cmd, desc } of commands) {
    console.log(`Running: ${desc}`);
    const proc = Bun.spawn(cmd, { terminal });
    await proc.exited;
    console.log('');
  }

  // Demo 3: Terminal resize
  console.log('3️⃣ Terminal Resize Demo');
  console.log('======================\n');

  console.log('Resizing terminal to 60x10...');
  terminal.resize(60, 10);

  const resizeProc = Bun.spawn(['bash'], { terminal });
  setTimeout(() => {
    terminal.write("echo 'Terminal resized!'\n");
    terminal.write("stty size\n");
    terminal.write("exit\n");
  }, 200);

  await resizeProc.exited;

  // Demo 4: Terminal with custom environment
  console.log('\n4️⃣ Custom Environment Terminal');
  console.log('==============================\n');

  const customTerminal = new Bun.Terminal({
    cols: 80,
    rows: 24,
    data(term, data) {
      const output = data.toString();
      if (output.includes('CUSTOM_VAR') || output.includes('TERMINAL_TYPE')) {
        process.stdout.write(`[CUSTOM] ${output}`);
      }
    },
  });

  const envProc = Bun.spawn(['bash'], {
    terminal: customTerminal,
    env: {
      ...process.env,
      CUSTOM_VAR: 'Tier-1380',
      TERMINAL_TYPE: 'demo'
    }
  });
  setTimeout(() => {
    customTerminal.write("echo 'Custom variables:'\n");
    customTerminal.write("echo \"CUSTOM_VAR: \$CUSTOM_VAR\"\n");
    customTerminal.write("echo \"TERMINAL_TYPE: \$TERMINAL_TYPE\"\n");
    customTerminal.write("exit\n");
  }, 200);

  await envProc.exited;
  customTerminal.close();

  console.log('\n✅ Custom terminal demo complete');

} else {
  console.log('2️⃣ Windows Note');
  console.log('===============\n');
  console.log('On Windows, you can still create Terminal objects but PTY');
  console.log('functionality is not available. Request Windows support at:');
  console.log('https://github.com/oven-sh/bun/issues\n');
}

// Demo 5: Best Practices
console.log('5️⃣ Best Practices');
console.log('================\n');

const practices = [
  'Always use await using for automatic cleanup',
  'Check process.platform before using PTY features',
  'Handle resize events for responsive terminals',
  'Validate input before writing to terminals',
  'Use restricted shells for security (bash --restricted)',
  'Set HISTFILE=/dev/null to disable history',
  'Scan terminal output for sensitive data',
  'Close terminals when done to free resources'
];

practices.forEach((practice, i) => {
  console.log(`${i + 1}. ${practice}`);
});

console.log('\n🎯 Terminal API Summary');
console.log('=======================');
console.log('✅ Native PTY support (POSIX only)');
console.log('✅ Interactive program execution');
console.log('✅ Reusable terminals');
console.log('✅ Full terminal control methods');
console.log('✅ Environment variable support');
console.log('✅ Automatic cleanup with await using');
console.log('✅ Security features available');

// Build instructions
console.log('\n📦 Build Requirements');
console.log('====================');
console.log('Minimum Bun version: 1.3.5');
console.log('Required platforms: Linux, macOS');
console.log('TypeScript: Enabled with top-level await');

console.log('\n🚀 Demo Complete!');
