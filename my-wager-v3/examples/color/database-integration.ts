#!/usr/bin/env bun
// Color Database Integration for Tension Field System
// Practical example of storing and retrieving colors as numbers

// Make this a module
export {};

console.log('🗄️  Color Database Integration');
console.log('=============================\n');

// Import SQLite (Bun native)
import { Database } from 'bun:sqlite';

// Create in-memory database for demo
const db = new Database(':memory:');

// Initialize tables
console.log('1️⃣ Database Schema Setup:');
console.log('------------------------');

// Create nodes table with color storage
db.run(`
  CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    name TEXT,
    tension REAL,
    status TEXT,
    color_code INTEGER,  -- Stored as 24-bit number
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create color_themes table
db.run(`
  CREATE TABLE color_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    colors TEXT,  -- JSON array of color numbers
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create mcp_tools table with color coding
db.run(`
  CREATE TABLE mcp_tools (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    color_code INTEGER,
    description TEXT,
    enabled BOOLEAN DEFAULT 1
  )
`);

console.log('✅ Database tables created successfully');

// Demo 2: Insert sample data with color numbers
console.log('\n2️⃣ Inserting Sample Data:');
console.log('------------------------');

// Prepare statements
const insertNode = db.prepare(`
  INSERT INTO nodes (id, name, tension, status, color_code)
  VALUES (?, ?, ?, ?, ?)
`);

const insertTheme = db.prepare(`
  INSERT INTO color_themes (name, description, colors)
  VALUES (?, ?, ?)
`);

const insertTool = db.prepare(`
  INSERT INTO mcp_tools (id, name, category, color_code, description)
  VALUES (?, ?, ?, ?, ?)
`);

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
  if (tension < 0.3) return Bun.color('#22c55e', 'number'); // Green
  if (tension < 0.6) return Bun.color('#f59e0b', 'number'); // Yellow
  if (tension < 0.8) return Bun.color('#fb923c', 'number'); // Orange
  return Bun.color('#ef4444', 'number'); // Red
}

// Function to determine status based on tension
function getTensionStatus(tension: number): string {
  if (tension < 0.3) return 'operational';
  if (tension < 0.6) return 'warning';
  if (tension < 0.8) return 'elevated';
  return 'critical';
}

// Insert nodes
nodes.forEach(node => {
  const colorCode = getTensionColor(node.tension);
  const status = getTensionStatus(node.tension);
  insertNode.run(node.id, node.name, node.tension, status, colorCode);
});

// Insert color themes
const themes = [
  {
    name: 'tension_gradient',
    description: 'Gradient colors for tension levels',
    colors: JSON.stringify([
      Bun.color('#22c55e', 'number'), // Green
      Bun.color('#84cc16', 'number'), // Lime
      Bun.color('#f59e0b', 'number'), // Yellow
      Bun.color('#fb923c', 'number'), // Orange
      Bun.color('#ef4444', 'number')  // Red
    ])
  },
  {
    name: 'node_types',
    description: 'Colors for different node types',
    colors: JSON.stringify([
      Bun.color('#3b82f6', 'number'), // Blue
      Bun.color('#8b5cf6', 'number'), // Purple
      Bun.color('#06b6d4', 'number'), // Cyan
      Bun.color('#10b981', 'number')  // Green
    ])
  }
];

themes.forEach(theme => {
  insertTheme.run(theme.name, theme.description, theme.colors);
});

// Insert MCP tools with colors
const mcpTools = [
  { id: 'analyze_tension', name: 'Analyze Tension', category: 'analysis', color: '#3b82f6' },
  { id: 'propagate_tension', name: 'Propagate Tension', category: 'propagation', color: '#10b981' },
  { id: 'assess_risk', name: 'Assess Risk', category: 'analysis', color: '#f59e0b' },
  { id: 'query_history', name: 'Query History', category: 'data', color: '#8b5cf6' },
  { id: 'get_system_status', name: 'Get System Status', category: 'system', color: '#06b6d4' },
  { id: 'get_errors', name: 'Get Errors', category: 'system', color: '#ef4444' }
];

mcpTools.forEach(tool => {
  const colorCode = Bun.color(tool.color, 'number');
  insertTool.run(tool.id, tool.name, tool.category, colorCode, tool.description);
});

console.log(`✅ Inserted ${nodes.length} nodes, ${themes.length} themes, ${mcpTools.length} tools`);

// Demo 3: Query and display with color conversion
console.log('\n3️⃣ Querying Data with Color Display:');
console.log('----------------------------------');

// Query all nodes
const nodesQuery = db.prepare('SELECT * FROM nodes ORDER BY tension');
const allNodes = nodesQuery.all() as Array<{
  id: string;
  name: string;
  tension: number;
  status: string;
  color_code: number;
}>;

console.log('Node Status Dashboard:');
console.log('ID       | Name        | Tension | Status     | Color');
console.log('---------|-------------|---------|------------|-------');

allNodes.forEach(node => {
  const colorHex = Bun.color(node.color_code, 'hex');
  const colorBlock = '\x1b[48;2;' + 
    ((node.color_code >> 16) & 255) + ';' + 
    ((node.color_code >> 8) & 255) + ';' + 
    (node.color_code & 255) + 'm    \x1b[0m';
  
  console.log(`${node.id.padEnd(8)} | ${node.name.padEnd(11)} | ${node.tension.toFixed(2).padEnd(7)} | ${node.status.padEnd(10)} | ${colorBlock} ${colorHex}`);
});

// Demo 4: Color theme management
console.log('\n4️⃣ Color Theme Management:');
console.log('---------------------------');

const themesQuery = db.prepare('SELECT * FROM color_themes');
const allThemes = themesQuery.all() as Array<{
  id: number;
  name: string;
  description: string;
  colors: string;
}>;

allThemes.forEach(theme => {
  console.log(`\nTheme: ${theme.name}`);
  console.log(`Description: ${theme.description}`);
  
  const colorNumbers = JSON.parse(theme.colors) as number[];
  console.log('Colors:');
  
  colorNumbers.forEach((colorNum, index) => {
    const hex = Bun.color(colorNum, 'hex');
    const block = '\x1b[48;2;' + 
      ((colorNum >> 16) & 255) + ';' + 
      ((colorNum >> 8) & 255) + ';' + 
      (colorNum & 255) + 'm    \x1b[0m';
    console.log(`  ${index + 1}. ${hex} ${block} (${colorNum})`);
  });
});

// Demo 5: Dynamic color updates
console.log('\n5️⃣ Dynamic Color Updates:');
console.log('------------------------');

// Update node colors based on new tension values
const updateNodeColor = db.prepare(`
  UPDATE nodes 
  SET tension = ?, status = ?, color_code = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

// Simulate tension changes
const tensionUpdates = [
  { id: 'node-001', newTension: 0.67 },
  { id: 'node-042', newTension: 0.34 },
  { id: 'node-123', newTension: 0.88 }
];

console.log('Updating node tensions and colors:');
tensionUpdates.forEach(update => {
  const newColor = getTensionColor(update.newTension);
  const newStatus = getTensionStatus(update.newTension);
  
  updateNodeColor.run(update.newTension, newStatus, newColor, update.id);
  
  const oldNode = allNodes.find(n => n.id === update.id);
  const oldColorHex = oldNode ? Bun.color(oldNode.color_code, 'hex') : 'N/A';
  const newColorHex = Bun.color(newColor, 'hex');
  
  console.log(`  ${update.id}: ${update.tension} → ${update.newTension} | ${oldColorHex} → ${newColorHex}`);
});

// Demo 6: Color-based queries
console.log('\n6️⃣ Color-based Queries:');
console.log('-----------------------');

// Query nodes by color range (e.g., all red/warning nodes)
const redNodesQuery = db.prepare(`
  SELECT * FROM nodes 
  WHERE color_code >= ? AND color_code <= ?
  ORDER BY tension DESC
`);

// Red colors typically have high values (0xFF0000 = 16711680)
const redNodes = redNodesQuery.all(16000000, 16777215) as typeof allNodes;

console.log(`\nCritical/Red Nodes (${redNodes.length}):`);
redNodes.forEach(node => {
  const colorHex = Bun.color(node.color_code, 'hex');
  console.log(`  ${node.id}: tension=${node.tension}, color=${colorHex}`);
});

// Demo 7: MCP tool color visualization
console.log('\n7️⃣ MCP Tool Color Visualization:');
console.log('---------------------------------');

const toolsQuery = db.prepare('SELECT * FROM mcp_tools ORDER BY category, name');
const allTools = toolsQuery.all() as Array<{
  id: string;
  name: string;
  category: string;
  color_code: number;
  description: string;
}>;

// Group by category
const toolsByCategory = allTools.reduce((acc, tool) => {
  if (!acc[tool.category]) acc[tool.category] = [];
  acc[tool.category].push(tool);
  return acc;
}, {} as Record<string, typeof allTools>);

Object.entries(toolsByCategory).forEach(([category, tools]) => {
  console.log(`\n${category.toUpperCase()}:`);
  tools.forEach(tool => {
    const colorHex = Bun.color(tool.color_code, 'hex');
    const colorDot = '\x1b[38;2;' + 
      ((tool.color_code >> 16) & 255) + ';' + 
      ((tool.color_code >> 8) & 255) + ';' + 
      (tool.color_code & 255) + 'm●\x1b[0m';
    
    console.log(`  ${colorDot} ${tool.name.padEnd(20)} ${colorHex}`);
  });
});

// Demo 8: Export/Import color data
console.log('\n8️⃣ Export/Import Color Data:');
console.log('----------------------------');

// Export color configuration
const exportData = {
  version: '1.0',
  timestamp: new Date().toISOString(),
  themes: allThemes.map(theme => ({
    name: theme.name,
    description: theme.description,
    colors: JSON.parse(theme.colors)
  })),
  mcp_tools: allTools.map(tool => ({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    color: Bun.color(tool.color_code, 'hex')
  }))
};

console.log('Export configuration (JSON):');
console.log(JSON.stringify(exportData, null, 2).substring(0, 500) + '...');

// Demo 9: Performance analysis
console.log('\n9️⃣ Database Performance with Colors:');
console.log('-----------------------------------');

// Test query performance with color conversion
const iterations = 10000;

console.log(`Testing ${iterations} color conversions from database...`);

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  const node = allNodes[i % allNodes.length];
  Bun.color(node.color_code, 'hex');
}
const time = performance.now() - start;

console.log(`Database color conversion: ${time.toFixed(2)}ms`);
console.log(`Performance: ${(iterations / time * 1000).toFixed(0)} conversions/sec`);

// Close database
db.close();

console.log('\n✅ Database integration demo complete!');
console.log('\n💡 Benefits of storing colors as numbers:');
console.log('   • Compact storage (4 bytes vs 7+ bytes for hex)');
console.log('   • Fast indexing and queries');
console.log('   • Language-independent format');
console.log('   • Easy conversion to any format');
console.log('   • Perfect for database storage');
console.log('   • Enables efficient color-based queries');
