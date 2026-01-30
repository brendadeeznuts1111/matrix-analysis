#!/usr/bin/env bun
// Tension Field ANSI UI Components
// Using Bun.wrapAnsi for beautiful terminal interfaces

// Make this a module
export {};

console.log('🎨 Tension Field ANSI UI Components');
console.log('=================================\n');

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// UI Component: Status Card
function createStatusCard(title: string, status: string, value: string, width: number = 40): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  const statusColor = status === 'OK' ? COLORS.green : 
                      status === 'WARN' ? COLORS.yellow : 
                      status === 'ERROR' ? COLORS.red : COLORS.blue;
  
  const line = '─'.repeat(width - 2);
  const wrappedTitle = Bun.wrapAnsi(`${COLORS.bright}${title}${COLORS.reset}`, width - 4);
  const wrappedStatus = Bun.wrapAnsi(`${statusColor}${status}${COLORS.reset}`, width - 4);
  const wrappedValue = Bun.wrapAnsi(value, width - 4);
  
  return `┌─${line}─┐
│ ${wrappedTitle.padEnd(width - 4)} │
│ ${wrappedStatus.padEnd(width - 4)} │
│ ${wrappedValue.padEnd(width - 4)} │
└─${line}─┘`;
}

// UI Component: Progress Bar
function createProgressBar(label: string, progress: number, width: number = 50): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  const barWidth = width - 15;
  const filled = Math.round(barWidth * progress / 100);
  const empty = barWidth - filled;
  
  const bar = COLORS.bgGreen + ' '.repeat(filled) + 
              COLORS.bgRed + ' '.repeat(empty) + 
              COLORS.reset;
  
  const wrappedLabel = Bun.wrapAnsi(label, width - 15, { trim: true });
  const percent = progress.toString().padStart(3) + '%';
  
  return `${wrappedLabel.padEnd(width - 15)} ${bar} ${percent}`;
}

// UI Component: Node List
function createNodeList(nodes: Array<{id: string, tension: number, status: string}>, width: number = 60): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  let output = '';
  
  nodes.forEach((node, index) => {
    const tensionColor = node.tension > 0.8 ? COLORS.red :
                        node.tension > 0.6 ? COLORS.yellow :
                        node.tension > 0.4 ? COLORS.blue : COLORS.green;
    
    const statusIcon = node.status === 'active' ? '🟢' :
                       node.status === 'warning' ? '🟡' :
                       node.status === 'error' ? '🔴' : '⚪';
    
    const line = index < nodes.length - 1 ? '├──' : '└──';
    const nodeText = `${statusIcon} ${node.id} - ${tensionColor}${node.tension.toFixed(2)}${COLORS.reset}`;
    const wrapped = Bun.wrapAnsi(nodeText, width - 4, { trim: true });
    
    output += `${line} ${wrapped}\n`;
  });
  
  return output;
}

// UI Component: Metrics Dashboard
function createMetricsDashboard(metrics: Record<string, any>, width: number = 80): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  const title = `${COLORS.bright}${COLORS.cyan}TENSION FIELD METRICS${COLORS.reset}`;
  const border = '═'.repeat(width - 2);
  
  let output = `╔${border}╗\n`;
  output += `║ ${title.padEnd(width - 4)} ║\n`;
  output += `╠${border.replace(/═/g, '═')}╣\n`;
  
  Object.entries(metrics).forEach(([key, value]) => {
    const wrappedKey = Bun.wrapAnsi(`${COLORS.yellow}${key}:${COLORS.reset}`, Math.floor(width / 2 - 2));
    const wrappedValue = Bun.wrapAnsi(`${COLORS.green}${value}${COLORS.reset}`, Math.floor(width / 2 - 2));
    output += `║ ${wrappedKey.padEnd(Math.floor(width / 2 - 2))} │ ${wrappedValue.padEnd(Math.floor(width / 2 - 2))} ║\n`;
  });
  
  output += `╚${border}╝`;
  
  return output;
}

// UI Component: Alert Box
function createAlertBox(message: string, type: 'info' | 'warn' | 'error' | 'success', width: number = 60): string {
  if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
  
  const colors = {
    info: { bg: COLORS.bgBlue, fg: COLORS.blue, icon: 'ℹ️' },
    warn: { bg: COLORS.bgYellow, fg: COLORS.yellow, icon: '⚠️' },
    error: { bg: COLORS.bgRed, fg: COLORS.red, icon: '❌' },
    success: { bg: COLORS.bgGreen, fg: COLORS.green, icon: '✅' }
  };
  
  const { bg, fg, icon } = colors[type];
  const wrappedMessage = Bun.wrapAnsi(message, width - 6, { trim: true });
  const lines = wrappedMessage.split('\n');
  
  let output = `${bg} ${icon} ${' '.repeat(width - 6)} ${COLORS.reset}\n`;
  
  lines.forEach(line => {
    output += `${bg} ${COLORS.white}${line.padEnd(width - 6)} ${COLORS.reset}\n`;
  });
  
  output += `${bg} ${' '.repeat(width - 6)} ${COLORS.reset}`;
  
  return output;
}

// Demo: Complete Dashboard
console.log('📊 Complete Tension Field Dashboard:');
console.log('===================================\n');

// Sample data
const systemStatus = createStatusCard(
  'System Status',
  'OK',
  `${COLORS.green}All systems operational${COLORS.reset}\n${COLORS.dim}Uptime: 72.5 hours${COLORS.reset}`,
  50
);

const progressBars = [
  createProgressBar('Node Processing', 85, 60),
  createProgressBar('Memory Usage', 42, 60),
  createProgressBar('Network I/O', 67, 60),
  createProgressBar('Error Rate', 5, 60)
].join('\n');

const nodes = [
  { id: 'node-alpha-001', tension: 0.45, status: 'active' },
  { id: 'node-beta-042', tension: 0.89, status: 'warning' },
  { id: 'node-gamma-123', tension: 0.95, status: 'error' },
  { id: 'node-delta-456', tension: 0.23, status: 'active' }
];

const nodeList = createNodeList(nodes, 70);

const metrics = {
  'Total Nodes': '1,247',
  'Active Edges': '3,892',
  'Avg Tension': '0.73',
  'Throughput': '9,344 req/s',
  'Latency': '0.11ms',
  'Error Rate': '0.00%',
  'Memory': '45.67 MB',
  'Uptime': '72.5 hours'
};

const metricsDashboard = createMetricsDashboard(metrics, 80);

const alerts = [
  createAlertBox('High tension detected in node-beta-042 and node-gamma-123', 'warn', 70),
  createAlertBox('MCP server successfully integrated with 6 tools operational', 'success', 70),
  createAlertBox('Database optimization scheduled for maintenance window', 'info', 70)
];

// Render dashboard
console.log(systemStatus);
console.log('\n');
console.log(progressBars);
console.log('\n');
console.log(`${COLORS.bright}Node Status:${COLORS.reset}`);
console.log(nodeList);
console.log('\n');
console.log(metricsDashboard);
console.log('\n');
console.log(alerts.join('\n\n'));

// Interactive component: Real-time monitor simulation
console.log('\n🔄 Real-time Monitor Simulation:');
console.log('===============================\n');

function simulateRealTimeUpdate() {
  if (!Bun?.wrapAnsi) return;
  
  const updates = [
    { node: 'node-epsilon-789', tension: Math.random(), status: 'active' },
    { node: 'node-zeta-012', tension: Math.random(), status: 'warning' },
    { node: 'node-eta-345', tension: Math.random(), status: 'active' }
  ];
  
  const timestamp = new Date().toLocaleTimeString();
  const update = updates[Math.floor(Math.random() * updates.length)];
  
  const tensionColor = update.tension > 0.8 ? COLORS.red :
                      update.tension > 0.6 ? COLORS.yellow :
                      update.tension > 0.4 ? COLORS.blue : COLORS.green;
  
  const statusIcon = update.status === 'active' ? '🟢' :
                     update.status === 'warning' ? '🟡' :
                     update.status === 'error' ? '🔴' : '⚪';
  
  const message = `${COLORS.dim}[${timestamp}]${COLORS.reset} ${statusIcon} ${update.node} - ${tensionColor}${update.tension.toFixed(2)}${COLORS.reset}`;
  
  // Clear line and print update
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
  process.stdout.write(Bun.wrapAnsi(message, 78, { trim: true }));
}

// Simulate updates
console.log('Simulating real-time updates (3 seconds)...');
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    simulateRealTimeUpdate();
    if (i === 2) {
      console.log('\n\n✅ Simulation complete!');
    }
  }, (i + 1) * 1000);
}

console.log('\n💡 ANSI UI Benefits:');
console.log('   - Beautiful terminal interfaces');
console.log('   - Color-coded information');
console.log('   - Responsive text wrapping');
console.log('   - Cross-platform compatibility');
console.log('   - No external dependencies');
