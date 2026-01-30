#!/usr/bin/env bun
// Bun.color - Flexible Input Formats
// Demonstrating various color input formats and conversions

// Make this a module
export {};

console.log('🎨 Bun.color - Flexible Input');
console.log('============================\n');

// Demo 1: Basic color to number conversion
console.log('1️⃣ Color to Number Conversion:');
console.log('------------------------------');

const colorTests = [
  { input: 'red', expected: 16711680 },
  { input: 'green', expected: 65280 },
  { input: 'blue', expected: 255 },
  { input: 'white', expected: 16777215 },
  { input: 'black', expected: 0 }
];

colorTests.forEach(test => {
  const number = Bun.color(test.input, 'number');
  const match = number === test.expected ? '✅' : '❌';
  console.log(`${match} ${test.input.padEnd(10)} → ${number} (expected: ${test.expected})`);
});

// Demo 2: Different input formats
console.log('\n2️⃣ Various Input Formats:');
console.log('-------------------------');

const redColor = 16711680; // 0xFF0000

const formats = [
  { input: 0xff0000, desc: 'Hex number' },
  { input: { r: 255, g: 0, b: 0 }, desc: 'RGB object' },
  { input: [255, 0, 0], desc: 'RGB array' },
  { input: 'rgb(255, 0, 0)', desc: 'RGB string' },
  { input: 'rgba(255, 0, 0, 1)', desc: 'RGBA string' },
  { input: 'hsl(0, 100%, 50%)', desc: 'HSL string' },
  { input: 'hsla(0, 100%, 50%, 1)', desc: 'HSLA string' }
];

formats.forEach(format => {
  try {
    const number = Bun.color(format.input as any, 'number');
    const match = number === redColor ? '✅' : '❌';
    console.log(`${match} ${format.desc.padEnd(20)} → ${number}`);
  } catch (e) {
    console.log(`❌ ${format.desc.padEnd(20)} → Error: ${(e as Error).message}`);
  }
});

// Demo 3: Color format conversions
console.log('\n3️⃣ Color Format Conversions:');
console.log('---------------------------');

const baseColor = 'purple';

const outputFormats = ['hex', 'css', 'hsl', 'rgb', 'number'] as const;

outputFormats.forEach(format => {
  try {
    const result = Bun.color(baseColor, format);
    console.log(`${baseColor.padEnd(10)} → ${format.padEnd(6)} → ${result}`);
  } catch (e) {
    console.log(`${baseColor.padEnd(10)} → ${format.padEnd(6)} → Error`);
  }
});

// Demo 4: Tension Field System - Color Coding for Status
console.log('\n4️⃣ Tension Field Status Colors:');
console.log('------------------------------');

interface StatusColor {
  status: string;
  color: string;
  description: string;
}

const statusColors: StatusColor[] = [
  { status: 'operational', color: '#22c55e', description: 'System running normally' },
  { status: 'warning', color: '#f59e0b', description: 'Elevated tension detected' },
  { status: 'critical', color: '#ef4444', description: 'Critical tension levels' },
  { status: 'maintenance', color: '#6b7280', description: 'System under maintenance' },
  { status: 'unknown', color: '#8b5cf6', description: 'Status unknown' }
];

console.log('Status Color Mapping (for database storage):');
statusColors.forEach(status => {
  const colorNumber = Bun.color(status.color, 'number');
  if (colorNumber === null) return;
  console.log(`  ${status.status.padEnd(12)} | ${status.color.padEnd(8)} | ${colorNumber.toString().padEnd(10)} | ${status.description}`);
});

// Demo 5: Database Integration Example
console.log('\n5️⃣ Database Integration Example:');
console.log('---------------------------------');

interface NodeRecord {
  id: string;
  name: string;
  tension: number;
  status: 'operational' | 'warning' | 'critical' | 'elevated';
  colorCode: number; // Stored as number
  lastUpdate: Date;
}

// Insert nodes with dynamic color based on tension
const nodes = [
  { id: 'node-001', name: 'Alpha Node', tension: 0.23 },
  { id: 'node-042', name: 'Beta Node', tension: 0.78 },
  { id: 'node-123', name: 'Gamma Node', tension: 0.95 },
  { id: 'node-456', name: 'Delta Node', tension: 0.45 },
  { id: 'node-789', name: 'Epsilon Node', tension: 0.12 }
];

// Function to determine color based on tension
function getTensionColor(tension: number): number {
  // Map tension (0-1) to color gradient (green → yellow → red)
  if (tension < 0.5) {
    // Green to yellow
    const ratio = tension * 2;
    const r = Math.round(255 * ratio);
    const g = 255;
    const color = Bun.color({ r, g, b: 0 }, 'number');
    return color || 0;
  } else {
    // Yellow to red
    const ratio = (tension - 0.5) * 2;
    const r = 255;
    const g = Math.round(255 * (1 - ratio));
    const color = Bun.color({ r, g, b: 0 }, 'number');
    return color || 0;
  }
}

// Function to determine status based on tension
function getTensionStatus(tension: number): 'operational' | 'warning' | 'critical' | 'elevated' {
  if (tension < 0.3) return 'operational';
  if (tension < 0.6) return 'warning';
  if (tension < 0.8) return 'elevated';
  return 'critical';
}

// Insert nodes
const nodeRecords: NodeRecord[] = nodes.map(node => ({
  id: node.id,
  name: node.name,
  tension: node.tension,
  status: getTensionStatus(node.tension),
  colorCode: getTensionColor(node.tension),
  lastUpdate: new Date()
}));

console.log('Simulated Database Records:');
console.log('ID        | Tension | Status     | Color Code | Color');
console.log('----------|---------|------------|------------|------');

nodeRecords.forEach(record => {
  const colorCode = record.colorCode || 0;
  const colorHex = Bun.color(colorCode, 'hex') || '#000000';
  console.log(`${record.id.padEnd(9)} | ${record.tension.toFixed(2).padEnd(7)} | ${record.status.padEnd(10)} | ${colorCode.toString().padEnd(10)} | ${colorHex}`);
});


// Demo 6: Color Analysis for Tension Levels
console.log('\n6️⃣ Tension Level Color Mapping:');
console.log('-------------------------------');

// Generate tension color samples
const tensionLevels = [0.0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1.0];

console.log('Tension | Color Number | Hex Color | Visual');
console.log('--------|--------------|----------|--------');

tensionLevels.forEach(tension => {
  const colorNumber = getTensionColor(tension);
  const colorHex = Bun.color(colorNumber, 'hex') || '#000000';
  const colorBlock = '\x1b[48;2;' +
    ((colorNumber >> 16) & 255) + ';' +
    ((colorNumber >> 8) & 255) + ';' +
    (colorNumber & 255) + 'm    \x1b[0m';

  console.log(`${tension.toFixed(1).padEnd(7)} | ${colorNumber.toString().padEnd(12)} | ${colorHex.padEnd(9)} | ${colorBlock}`);
});

// Demo 7: MCP Server Color Integration
console.log('\n7️⃣ MCP Server Color Integration:');
console.log('--------------------------------');

interface MCPTool {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  colorCode: number;
}

const mcpTools: MCPTool[] = [
  { id: 'analyze_tension', name: 'Analyze Tension', category: 'analysis', color: '#3b82f6', description: 'Analyze tension in graph' },
  { id: 'propagate_tension', name: 'Propagate Tension', category: 'propagation', color: '#10b981', description: 'Propagate tension values' },
  { id: 'assess_risk', name: 'Assess Risk', category: 'analysis', color: '#f59e0b', description: 'Assess risk levels' },
  { id: 'query_history', name: 'Query History', category: 'data', color: '#8b5cf6', description: 'Query historical data' },
  { id: 'get_system_status', name: 'Get System Status', category: 'system', color: '#06b6d4', description: 'Get system status' },
  { id: 'get_errors', name: 'Get Errors', category: 'system', color: '#ef4444', description: 'Retrieve error logs' }
].map(tool => ({
  ...tool,
  colorCode: Bun.color(tool.color, 'number') || 0
}));

console.log('MCP Tools with Color Coding:');
console.log('Tool              | Category   | Color Code | Color');
console.log('------------------|------------|------------|------');

mcpTools.forEach(tool => {
  const colorHex = Bun.color(tool.colorCode, 'hex') || '#000000';
  const colorBlock = '\x1b[38;2;' +
    ((tool.colorCode >> 16) & 255) + ';' +
    ((tool.colorCode >> 8) & 255) + ';' +
    (tool.colorCode & 255) + 'm●\x1b[0m';

  console.log(`${tool.name.padEnd(16)} | ${tool.category.padEnd(10)} | ${tool.colorCode.toString().padEnd(10)} | ${colorBlock} ${colorHex}`);
});

// Demo 8: Performance Test - Color Conversion
console.log('\n8️⃣ Color Conversion Performance:');
console.log('-------------------------------');

const iterations = 100000;
const testColor = '#ff5733';

console.log(`Testing ${iterations.toLocaleString()} color conversions...`);

// Test string to number
const start1 = performance.now();
for (let i = 0; i < iterations; i++) {
  Bun.color(testColor, 'number');
}
const time1 = performance.now() - start1;

// Test number to hex
const colorNumber = Bun.color(testColor, 'number');
if (colorNumber === null) {
  console.log('❌ Failed to convert color to number');
  process.exit(1);
}
const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
  Bun.color(colorNumber, 'hex');
}
const time2 = performance.now() - start2;

console.log(`String → Number: ${time1.toFixed(2)}ms (${(iterations / time1 * 1000).toFixed(0)} ops/sec)`);
console.log(`Number → Hex:    ${time2.toFixed(2)}ms (${(iterations / time2 * 1000).toFixed(0)} ops/sec)`);

// Demo 9: Color Palette Generator
console.log('\n9️⃣ Color Palette Generator:');
console.log('---------------------------');

function generatePalette(baseHue: number, count: number): number[] {
  const palette: number[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360 / count)) % 360;
    const color = Bun.color(`hsl(${hue}, 70%, 50%)`, 'number');
    if (color !== null) {
      palette.push(color);
    }
  }
  return palette;
}

const palettes = {
  'Tension Levels': generatePalette(0, 5),
  'Node Types': generatePalette(120, 4),
  'Tool Categories': generatePalette(240, 6)
};

Object.entries(palettes).forEach(([name, colors]) => {
  console.log(`\n${name}:`);
  colors.forEach((color, index) => {
    const hex = Bun.color(color, 'hex');
    const block = '\x1b[48;2;' +
      ((color >> 16) & 255) + ';' +
      ((color >> 8) & 255) + ';' +
      (color & 255) + 'm    \x1b[0m';
    console.log(`  ${index + 1}. ${hex} ${block} (${color})`);
  });
});

// Demo 10: Color Validation and Error Handling
console.log('\n🔟 Color Validation:');
console.log('-------------------');

const invalidColors = [
  'notacolor',
  '#gggggg',
  'rgb(300, 0, 0)',
  { r: 256, g: 0, b: 0 },
  [255, 255, 255, 255, 255]
];

console.log('Testing invalid color inputs:');
invalidColors.forEach(color => {
  try {
    const result = Bun.color(color as any, 'number');
    if (result === null) {
      console.log(`✅ ${JSON.stringify(color)} → Correctly rejected (null)`);
    } else {
      console.log(`❌ ${JSON.stringify(color)} → Should have failed but got ${result}`);
    }
  } catch (e) {
    console.log(`✅ ${JSON.stringify(color)} → Correctly rejected`);
  }
});

console.log('\n✅ Color demo complete!');
console.log('\n💡 Key takeaways:');
console.log('   • "number" format stores colors as 24-bit integers');
console.log('   • Perfect for database storage (0-16777215)');
console.log('   • Supports all major color formats');
console.log('   • Fast conversion (>1M ops/sec)');
console.log('   • Enables consistent color theming');
console.log('   • Great for tension field visualization!');
