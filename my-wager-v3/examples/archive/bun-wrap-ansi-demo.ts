#!/usr/bin/env bun
// Bun.wrapAnsi Demo
// Demonstrates ANSI text wrapping with color preservation

console.log('🎨 Bun.wrapAnsi Demo');
console.log('====================\n');

// Sample texts with ANSI colors
const texts = [
  {
    title: "Simple Red Text",
    text: "\x1b[31mThis is a long red text that needs wrapping\x1b[0m",
    columns: 20
  },
  {
    title: "Multi-colored Text",
    text: "\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[34mBlue\x1b[0m text with multiple colors that should wrap properly",
    columns: 25
  },
  {
    title: "Background Color",
    text: "\x1b[43m\x1b[30mYellow background with black text that spans multiple lines\x1b[0m",
    columns: 30
  },
  {
    title: "Complex Formatting",
    text: "\x1b[1m\x1b[31mBold Red\x1b[0m \x1b[4m\x1b[32mUnderline Green\x1b[0m \x1b[3m\x1b[34mItalic Blue\x1b[0m with various styles",
    columns: 35
  },
  {
    title: "Tension Field Status",
    text: "\x1b[32m✅ System Operational\x1b[0m - \x1b[33m⚠️ 3 nodes with elevated tension\x1b[0m - \x1b[34m📊 Average: 0.73\x1b[0m",
    columns: 40
  }
];

// Demo 1: Basic wrapping
console.log('1️⃣ Basic ANSI Wrapping:');
console.log('=======================\n');

texts.forEach(({ title, text, columns }) => {
  console.log(`${title} (${columns} columns):`);
  console.log(`Original: ${text}`);
  
  if (Bun?.wrapAnsi) {
    const wrapped = Bun.wrapAnsi(text, columns);
    console.log(`Wrapped:\n${wrapped}`);
  } else {
    console.log('Bun.wrapAnsi not available in this version');
  }
  console.log('');
});

// Demo 2: With options
console.log('2️⃣ Wrapping with Options:');
console.log('========================\n');

const longText = "\x1b[36mSupercalifragilisticexpialidocious is a very long word that demonstrates hard wrapping\x1b[0m";

if (Bun?.wrapAnsi) {
  console.log('Soft wrap (default):');
  console.log(Bun.wrapAnsi(longText, 20));
  console.log('');
  
  console.log('Hard wrap (break words):');
  console.log(Bun.wrapAnsi(longText, 20, { hard: true }));
  console.log('');
  
  console.log('No word wrap:');
  console.log(Bun.wrapAnsi(longText, 20, { wordWrap: false }));
  console.log('');
  
  console.log('No trim:');
  console.log(Bun.wrapAnsi(`  ${longText}  `, 20, { trim: false }));
} else {
  console.log('Bun.wrapAnsi not available');
}

// Demo 3: Integration with Tension Field logs
console.log('3️⃣ Tension Field Log Integration:');
console.log('=================================\n');

const tensionLogs = [
  {
    level: 'ERROR',
    color: '\x1b[31m',
    message: 'TENSION_001: Propagation failed due to node timeout in cluster alpha-bravo-charlie-delta'
  },
  {
    level: 'WARN',
    color: '\x1b[33m',
    message: 'TENSION_201: Memory usage approaching threshold in processing-unit-12345'
  },
  {
    level: 'INFO',
    color: '\x1b[36m',
    message: 'TENSION_301: Successfully propagated tension across 1,247 nodes in 0.11ms'
  },
  {
    level: 'SUCCESS',
    color: '\x1b[32m',
    message: 'MCP_SERVER: All 6 tools operational with 9,344 req/s throughput'
  }
];

function formatLogEntry(level: string, color: string, message: string, width: number = 60): string {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `${color}[${timestamp}] ${level}\x1b[0m`;
  
  if (Bun?.wrapAnsi) {
    const wrappedMessage = Bun.wrapAnsi(message, width - prefix.length - 2, {
      wordWrap: true,
      trim: true
    });
    
    // Add prefix to first line, indent subsequent lines
    const lines = wrappedMessage.split('\n');
    return lines[0] ? `${prefix} ${lines[0]}` : prefix + 
           (lines.slice(1).map(line => ' '.repeat(prefix.length + 1) + line).join('\n'));
  }
  
  return `${prefix} ${message}`;
}

console.log('Formatted log entries (60 columns):\n');
tensionLogs.forEach(({ level, color, message }) => {
  console.log(formatLogEntry(level, color, message));
});

// Demo 4: Table formatting with ANSI
console.log('\n4️⃣ Table with ANSI Colors:');
console.log('==========================\n');

const tableData = [
  { 
    node: 'node-001', 
    status: '\x1b[32m✅ Active\x1b[0m', 
    tension: '\x1b[32m0.45\x1b[0m',
    lastUpdate: '2s ago'
  },
  { 
    node: 'node-042', 
    status: '\x1b[33m⚠️ Warning\x1b[0m', 
    tension: '\x1b[33m0.89\x1b[0m',
    lastUpdate: '1s ago'
  },
  { 
    node: 'node-123', 
    status: '\x1b[31m❌ Critical\x1b[0m', 
    tension: '\x1b[31m0.95\x1b[0m',
    lastUpdate: 'now'
  }
];

function formatTable(data: any[], width: number = 80): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  const headers = ['Node', 'Status', 'Tension', 'Last Update'];
  const colWidths = [15, 15, 10, 20];
  
  // Helper to wrap cell content
  const wrapCell = (text: string, width: number): string[] => {
    return Bun.wrapAnsi(text, width, { trim: true }).split('\n');
  };
  
  // Format header
  let output = '';
  output += headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + '\n';
  output += '-'.repeat(Math.min(width, colWidths.reduce((a, b) => a + b + 3, 0))) + '\n';
  
  // Format rows
  data.forEach(row => {
    const cells = [
      wrapCell(row.node, colWidths[0]),
      wrapCell(row.status, colWidths[1]),
      wrapCell(row.tension, colWidths[2]),
      wrapCell(row.lastUpdate, colWidths[3])
    ];
    
    const maxLines = Math.max(...cells.map(c => c.length));
    
    for (let i = 0; i < maxLines; i++) {
      output += cells.map(cell => (cell[i] || '').padEnd(colWidths[cells.indexOf(cell)])).join(' | ') + '\n';
    }
  });
  
  return output;
}

if (Bun?.wrapAnsi) {
  console.log(formatTable(tableData, 80));
} else {
  console.log('Bun.wrapAnsi not available');
}

// Demo 5: Progress bar with wrapping
console.log('\n5️⃣ Progress Bar with Text:');
console.log('=========================\n');

function createProgressBar(progress: number, width: number = 50, label?: string): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  const filled = Math.round(width * progress / 100);
  const empty = width - filled;
  
  const bar = '\x1b[42m' + ' '.repeat(filled) + '\x1b[41m' + ' '.repeat(empty) + '\x1b[0m';
  
  if (label) {
    const wrappedLabel = Bun.wrapAnsi(label, width - 10);
    return `${wrappedLabel.padEnd(width - 10)} ${progress.toString().padStart(3)}%\n${bar}`;
  }
  
  return `${bar} ${progress.toString().padStart(3)}%`;
}

if (Bun?.wrapAnsi) {
  console.log(createProgressBar(75, 40, 'Processing nodes...'));
  console.log(createProgressBar(45, 40, 'Memory usage optimization'));
  console.log(createProgressBar(90, 40, 'Database synchronization'));
} else {
  console.log('Bun.wrapAnsi not available');
}

console.log('\n✅ wrapAnsi demo complete!');
console.log('\n💡 Use cases:');
console.log('   - Terminal UI with colored text');
console.log('   - Log formatting with line wrapping');
console.log('   - Table rendering with ANSI colors');
console.log('   - Progress bars with labels');
console.log('   - CLI help text with highlighting');
