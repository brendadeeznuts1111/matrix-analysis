#!/usr/bin/env bun
// Bun ANSI Color Demo - Terminal Color Formatting
// Demonstrating ANSI color output for beautiful terminal interfaces

// Make this a module
export {};

console.log('🎨 Bun ANSI Color Demo');
console.log('=====================\n');

// Demo 1: Basic ANSI-16 color conversion
console.log('1️⃣ Basic ANSI-16 Colors:');
console.log('------------------------');

const basicColors = [
  'black', 'red', 'green', 'yellow',
  'blue', 'magenta', 'cyan', 'white'
];

console.log('Standard Colors:');
basicColors.forEach(color => {
  const ansi = Bun.color(color, 'ansi-16');
  process.stdout.write(`${ansi}${color.padEnd(10)}\x1b[0m`);
});
console.log('\n');

// Bright colors
console.log('Bright Colors:');
basicColors.forEach(color => {
  const brightColor = `bright${color.charAt(0).toUpperCase() + color.slice(1)}`;
  const ansi = Bun.color(brightColor, 'ansi-16');
  process.stdout.write(`${ansi}${brightColor.padEnd(12)}\x1b[0m`);
});
console.log('\n');

// Demo 2: Color format comparison
console.log('\n2️⃣ Color Format Comparison:');
console.log('---------------------------');

const testColor = '#ff5733';
const formats = ['hex', 'rgb', 'hsl', 'number', 'ansi-16', 'ansi-256', 'ansi-16m'];

console.log(`Converting "${testColor}" to different formats:`);
formats.forEach(format => {
  try {
    const result = Bun.color(testColor, format as any);
    if (format.startsWith('ansi')) {
      // Show ANSI codes visually
      process.stdout.write(`${format.padEnd(10)}: ${result}${result}Sample Text\x1b[0m\n`);
    } else {
      console.log(`${format.padEnd(10)}: ${result}`);
    }
  } catch (e) {
    console.log(`${format.padEnd(10)}: Error - ${(e as Error).message}`);
  }
});

// Demo 3: ANSI-256 color palette
console.log('\n3️⃣ ANSI-256 Color Palette:');
console.log('-------------------------');

// Show a sample of ANSI-256 colors
console.log('System Colors (0-15):');
for (let i = 0; i < 16; i++) {
  const colorCode = i.toString();
  const ansi = Bun.color(colorCode, 'ansi-256');
  process.stdout.write(`${ansi}  ${i.toString().padStart(2)}  \x1b[0m`);
  if ((i + 1) % 8 === 0) console.log();
}

console.log('\nColor Cube (16-231) - Sample:');
// Show every 8th color from the cube
for (let i = 16; i < 232; i += 8) {
  const ansi = Bun.color(i.toString(), 'ansi-256');
  const block = `${ansi}██\x1b[0m`;
  process.stdout.write(block);
  if ((i - 16) % 48 === 40) console.log();
}

console.log('\nGrayscale (232-255):');
for (let i = 232; i < 256; i++) {
  const ansi = Bun.color(i.toString(), 'ansi-256');
  const block = `${ansi}██\x1b[0m`;
  process.stdout.write(block);
}
console.log();

// Demo 4: ANSI-16m (True Color) demonstration
console.log('\n4️⃣ True Color (ANSI-16m) Demonstration:');
console.log('--------------------------------------');

const trueColors = [
  '#ff0000', '#ff7f00', '#ffff00', '#00ff00',
  '#0000ff', '#4b0082', '#9400d3', '#ff1493'
];

console.log('Rainbow with True Color:');
trueColors.forEach(color => {
  const ansi = Bun.color(color, 'ansi-16m');
  process.stdout.write(`${ansi}████\x1b[0m`);
});
console.log('  Rainbow Gradient');

// Custom gradient
console.log('\nCustom Gradient (Red → Blue):');
for (let i = 0; i <= 20; i++) {
  const ratio = i / 20;
  const r = Math.round(255 * (1 - ratio));
  const b = Math.round(255 * ratio);
  const color = `#${r.toString(16).padStart(2, '0')}00${b.toString(16).padStart(2, '0')}`;
  const ansi = Bun.color(color, 'ansi-16m');
  process.stdout.write(`${ansi}██\x1b[0m`);
}
console.log('  Red to Blue Gradient');

// Demo 5: Tension Field System - Status Indicators
console.log('\n5️⃣ Tension Field Status Indicators:');
console.log('------------------------------------');

interface StatusConfig {
  status: string;
  color: string;
  ansiFormat: string;
  description: string;
}

const statusConfigs: StatusConfig[] = [
  {
    status: 'operational',
    color: '#22c55e',
    ansiFormat: 'ansi-16m',
    description: 'All systems正常运行'
  },
  {
    status: 'warning',
    color: '#f59e0b',
    ansiFormat: 'ansi-16m',
    description: 'Elevated tension detected'
  },
  {
    status: 'critical',
    color: '#ef4444',
    ansiFormat: 'ansi-16m',
    description: 'Critical tension levels'
  },
  {
    status: 'maintenance',
    color: '#6b7280',
    ansiFormat: 'ansi-16m',
    description: 'System under maintenance'
  }
];

console.log('System Status Dashboard:');
statusConfigs.forEach(config => {
  const ansi = Bun.color(config.color, config.ansiFormat as any);
  const icon = config.status === 'operational' ? '✅' :
               config.status === 'warning' ? '⚠️' :
               config.status === 'critical' ? '🔴' : '🔧';

  console.log(`${ansi}${icon} ${config.status.toUpperCase()}\x1b[0m`);
  console.log(`   ${config.description}\n`);
});

// Demo 6: Tension Level Visualization
console.log('6️⃣ Tension Level Visualization:');
console.log('--------------------------------');

function getTensionAnsiColor(tension: number, format: 'ansi-16' | 'ansi-256' | 'ansi-16m' = 'ansi-16m'): string {
  let color: string;

  if (tension < 0.3) {
    color = '#22c55e'; // Green
  } else if (tension < 0.6) {
    color = '#f59e0b'; // Yellow
  } else if (tension < 0.8) {
    color = '#fb923c'; // Orange
  } else {
    color = '#ef4444'; // Red
  }

  return Bun.color(color, format) || '';
}

const tensionLevels = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0];

console.log('Tension Bar Visualization:');
tensionLevels.forEach(tension => {
  const ansi = getTensionAnsiColor(tension);
  const barLength = Math.round(tension * 20);
  const bar = '█'.repeat(barLength).padEnd(20);

  console.log(`${ansi}[${bar}] ${tension.toFixed(2)}\x1b[0m`);
});

// Demo 7: MCP Tool Categories with ANSI colors
console.log('\n7️⃣ MCP Tool Categories:');
console.log('-----------------------');

interface MCPToolCategory {
  category: string;
  color: string;
  tools: string[];
}

const toolCategories: MCPToolCategory[] = [
  {
    category: 'analysis',
    color: '#3b82f6',
    tools: ['analyze_tension', 'assess_risk']
  },
  {
    category: 'propagation',
    color: '#10b981',
    tools: ['propagate_tension']
  },
  {
    category: 'data',
    color: '#8b5cf6',
    tools: ['query_history']
  },
  {
    category: 'system',
    color: '#06b6d4',
    tools: ['get_system_status', 'get_errors']
  }
];

toolCategories.forEach(cat => {
  const ansi = Bun.color(cat.color, 'ansi-16m');
  console.log(`\n${ansi}${cat.category.toUpperCase()}\x1b[0m:`);
  cat.tools.forEach(tool => {
    console.log(`  • ${tool}`);
  });
});

// Demo 8: Progress Bar with ANSI colors
console.log('\n8️⃣ Animated Progress Bar:');
console.log('-------------------------');

async function coloredProgressBar() {
  const total = 50;

  for (let i = 0; i <= total; i++) {
    const percent = i / total;
    let bar = '';

    // Create gradient bar
    for (let j = 0; j < 20; j++) {
      const position = j / 20;
      if (position <= percent) {
        const hue = (1 - position) * 120; // Green to red
        const color = `hsl(${hue}, 70%, 50%)`;
        const ansi = Bun.color(color, 'ansi-16m');
        bar += `${ansi}█\x1b[0m`;
      } else {
        bar += '░';
      }
    }

    const percentAnsi = getTensionAnsiColor(percent);
    process.stdout.write(`\rProgress: [${bar}] ${percentAnsi}${(percent * 100).toFixed(1)}%\x1b[0m`);
    await Bun.sleep(50);
  }
  console.log('\n');
}

await coloredProgressBar();

// Demo 9: Terminal Color Support Detection
console.log('9️⃣ Terminal Color Support:');
console.log('---------------------------');

// Test different ANSI formats
const testFormats = [
  { name: 'ANSI-16', format: 'ansi-16' as const },
  { name: 'ANSI-256', format: 'ansi-256' as const },
  { name: 'True Color (16m)', format: 'ansi-16m' as const }
];

console.log('Testing color format support:');
testFormats.forEach(({ name, format }) => {
  const colors = ['#ff0000', '#00ff00', '#0000ff'];
  const output = colors.map(c => Bun.color(c, format)).join('');
  console.log(`${name}: ${output}RGB Test\x1b[0m`);
});

// Demo 10: Performance Comparison
console.log('\n🔟 Color Format Performance:');
console.log('----------------------------');

const iterations = 100000;
const testColors = ['#ff5733', '#33ff57', '#3357ff'];

console.log(`Testing ${iterations.toLocaleString()} conversions...`);

testFormats.forEach(({ name, format }) => {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const color = testColors[i % testColors.length];
    Bun.color(color, format);
  }
  const time = performance.now() - start;

  console.log(`${name.padEnd(20)}: ${time.toFixed(2)}ms (${(iterations / time * 1000).toFixed(0)} ops/sec)`);
});

// Demo 11: Creating a Color Palette Helper
console.log('\n1️⃣1️⃣ Color Palette Helper:');
console.log('---------------------------');

class ANSIColorPalette {
  private colors: Map<string, string> = new Map();

  constructor() {
    // Initialize with tension field colors
    this.addColor('success', '#22c55e');
    this.addColor('warning', '#f59e0b');
    this.addColor('error', '#ef4444');
    this.addColor('info', '#3b82f6');
    this.addColor('muted', '#6b7280');
  }

  addColor(name: string, hex: string) {
    this.colors.set(name, Bun.color(hex, 'ansi-16m') || '');
  }

  colorize(text: string, colorName: string): string {
    const color = this.colors.get(colorName);
    return color ? `${color}${text}\x1b[0m` : text;
  }

  getAnsiCode(colorName: string): string {
    return this.colors.get(colorName) || '';
  }
}

const palette = new ANSIColorPalette();

console.log('Using Color Palette Helper:');
console.log(palette.colorize('✅ Success message', 'success'));
console.log(palette.colorize('⚠️  Warning message', 'warning'));
console.log(palette.colorize('❌ Error message', 'error'));
console.log(palette.colorize('ℹ️  Info message', 'info'));

// Demo 12: Real-time Log with Colors
console.log('\n1️⃣2️⃣ Real-time Log Example:');
console.log('----------------------------');

async function simulateColoredLogs() {
  const logTypes = [
    { type: 'INFO', color: '#3b82f6', message: 'System initialized' },
    { type: 'WARN', color: '#f59e0b', message: 'High tension detected in node-42' },
    { type: 'ERROR', color: '#ef4444', message: 'Connection timeout to node-123' },
    { type: 'SUCCESS', color: '#22c55e', message: 'Tension propagation completed' },
    { type: 'DEBUG', color: '#8b5cf6', message: 'Debug: Processing node-456' }
  ];

  console.log('Simulated Log Output:');
  for (const log of logTypes) {
    const timestamp = new Date().toLocaleTimeString();
    const color = Bun.color(log.color, 'ansi-16m');
    console.log(`${color}[${timestamp}] ${log.type}: ${log.message}\x1b[0m`);
    await Bun.sleep(200);
  }
}

await simulateColoredLogs();

console.log('\n✅ ANSI Color demo complete!');
console.log('\n💡 Key takeaways:');
console.log('   • ansi-16: Basic 16-color terminal support');
console.log('   • ansi-256: Extended 256-color palette');
console.log('   • ansi-16m: True color (16 million colors)');
console.log('   • Perfect for terminal UI and CLI tools');
console.log('   • Enables beautiful tension field visualization');
console.log('   • Cross-platform terminal color support');
