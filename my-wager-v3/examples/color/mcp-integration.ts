#!/usr/bin/env bun
// MCP Server with ANSI Color Output
// Beautiful terminal responses for the Tension Field System

// Make this a module
export {};

console.log('🌈 MCP Server ANSI Color Output');
console.log('===============================\n');

// ANSI Color utility class for MCP responses
class MCPANSIColors {
  private static colors = {
    // Status colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    muted: '#6b7280',

    // Tool category colors
    analysis: '#3b82f6',
    propagation: '#10b981',
    data: '#8b5cf6',
    system: '#06b6d4',

    // Tension level colors
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#fb923c',
    critical: '#ef4444'
  };

  static get(colorName: keyof typeof MCPANSIColors.colors, format: 'ansi-16' | 'ansi-256' | 'ansi-16m' = 'ansi-16m'): string {
    const hex = this.colors[colorName];
    return Bun.color(hex, format) || '';
  }

  static colorize(text: string, colorName: keyof typeof MCPANSIColors.colors): string {
    const color = this.get(colorName);
    return `${color}${text}\x1b[0m`;
  }

  static getTensionColor(tension: number): string {
    if (tension < 0.3) return this.get('low');
    if (tension < 0.6) return this.get('medium');
    if (tension < 0.8) return this.get('high');
    return this.get('critical');
  }
}

// MCP Response formatter with ANSI colors
class MCPResponseFormatter {
  private useColors: boolean;

  constructor(useColors: boolean = true) {
    this.useColors = useColors;
  }

  formatToolResponse(toolName: string, result: any, duration?: number): string {
    const lines: string[] = [];

    // Determine tool category for color
    const category = this.getToolCategory(toolName);
    const categoryColor = MCPANSIColors.get(category as any);

    if (this.useColors) {
      lines.push(`${categoryColor}┌─ Tool: ${toolName}\x1b[0m`);
      lines.push(`${categoryColor}│\x1b[0m`);
    } else {
      lines.push(`┌─ Tool: ${toolName}`);
      lines.push('│');
    }

    // Status
    const status = result.success !== false ?
      MCPANSIColors.colorize('✅ Success', 'success') :
      MCPANSIColors.colorize('❌ Error', 'error');

    lines.push(`│ Status: ${status}`);

    if (duration) {
      const durationText = duration < 10 ?
        MCPANSIColors.colorize(`${duration.toFixed(2)}ms`, 'success') :
        MCPANSIColors.colorize(`${duration.toFixed(2)}ms`, 'warning');
      lines.push(`│ Duration: ${durationText}`);
    }

    lines.push('│');

    // Result content
    if (result.result) {
      lines.push('│ Result:');
      lines.push('│');

      const formattedResult = this.formatResult(result.result);
      formattedResult.split('\n').forEach(line => {
        lines.push(`│ ${line}`);
      });
    }

    if (result.error) {
      lines.push('│ Error:');
      lines.push('│');
      const errorText = MCPANSIColors.colorize(result.error, 'error');
      lines.push(`│ ${errorText}`);
    }

    lines.push('│');
    lines.push(`${categoryColor}└─ End of ${toolName}\x1b[0m`);

    return lines.join('\n');
  }

  private formatResult(result: any): string {
    if (typeof result === 'string') {
      return result;
    }

    if (Array.isArray(result)) {
      if (result.length === 0) return MCPANSIColors.colorize('No results', 'muted');

      return result.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          if ('tension' in item) {
            // Node with tension - add color indicator
            const tension = (item as any).tension;
            const color = MCPANSIColors.getTensionColor(tension);
            const tensionText = `${color}●\x1b[0m ${tension}`;
            return `${index + 1}. ${(item as any).id || 'Unknown'} - Tension: ${tensionText}`;
          }
          return `${index + 1}. ${JSON.stringify(item, null, 2)}`;
        }
        return `${index + 1}. ${item}`;
      }).join('\n');
    }

    if (typeof result === 'object' && result !== null) {
      const lines: string[] = [];
      Object.entries(result).forEach(([key, value]) => {
        if (key === 'tension' && typeof value === 'number') {
          // Special handling for tension values
          const color = MCPANSIColors.getTensionColor(value);
          lines.push(`${key}: ${color}${value}\x1b[0m`);
        } else if (key === 'status') {
          // Colorize status
          const statusColor = value === 'operational' ? 'success' :
                            value === 'warning' ? 'warning' :
                            value === 'critical' ? 'error' : 'muted';
          lines.push(`${key}: ${MCPANSIColors.colorize(String(value), statusColor)}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      });
      return lines.join('\n');
    }

    return String(result);
  }

  private getToolCategory(toolName: string): string {
    if (toolName.includes('analyze') || toolName.includes('assess')) return 'analysis';
    if (toolName.includes('propagate')) return 'propagation';
    if (toolName.includes('history') || toolName.includes('query')) return 'data';
    return 'system';
  }
}

// Demo: Simulated MCP tool responses
console.log('1️⃣ Simulated MCP Tool Responses:');
console.log('---------------------------------\n');

const formatter = new MCPResponseFormatter(true);

// Response 1: System status
const systemStatusResponse = {
  success: true,
  result: {
    uptime: 72.5,
    nodes: {
      total: 1247,
      active: 1245,
      critical: 2
    },
    tension: {
      average: 0.73,
      highest: 0.95,
      lowest: 0.12
    },
    status: 'operational'
  }
};

console.log(formatter.formatToolResponse('get_system_status', systemStatusResponse, 12.5));

// Response 2: Analyze tension
const analyzeTensionResponse = {
  success: true,
  result: [
    { id: 'node-001', tension: 0.23, status: 'operational' },
    { id: 'node-042', tension: 0.78, status: 'warning' },
    { id: 'node-123', tension: 0.95, status: 'critical' },
    { id: 'node-456', tension: 0.45, status: 'operational' }
  ]
};

console.log('\n' + formatter.formatToolResponse('analyze_tension', analyzeTensionResponse, 8.3));

// Response 3: Error response
const errorResponse = {
  success: false,
  error: 'TENSION_001: Propagation failed - Node timeout exceeded'
};

console.log('\n' + formatter.formatToolResponse('propagate_tension', errorResponse, 25.7));

// Demo 2: Real-time monitoring with colors
console.log('\n2️⃣ Real-time Monitoring Dashboard:');
console.log('----------------------------------\n');

async function monitoringDashboard() {
  const nodes = [
    { id: 'node-alpha', tension: 0.23 },
    { id: 'node-beta', tension: 0.78 },
    { id: 'node-gamma', tension: 0.95 },
    { id: 'node-delta', tension: 0.45 }
  ];

  console.log(MCPANSIColors.colorize('╭─ Real-time Node Monitor', 'system'));
  console.log(MCPANSIColors.colorize('│', 'system'));

  for (const node of nodes) {
    const color = MCPANSIColors.getTensionColor(node.tension);
    const status = node.tension < 0.3 ? 'operational' :
                  node.tension < 0.6 ? 'warning' :
                  node.tension < 0.8 ? 'elevated' : 'critical';

    const statusColor = status === 'operational' ? 'success' :
                       status === 'warning' ? 'warning' :
                       status === 'elevated' ? 'warning' : 'error';

    console.log(`${MCPANSIColors.colorize('│', 'system')} ${color}●\x1b[0m ${node.id.padEnd(12)} | Tension: ${color}${node.tension.toFixed(2)}\x1b[0m | ${MCPANSIColors.colorize(status, statusColor)}`);
    await Bun.sleep(300);
  }

  console.log(MCPANSIColors.colorize('│', 'system'));
  console.log(MCPANSIColors.colorize('╰─ Monitor Complete', 'system'));
}

await monitoringDashboard();

// Demo 3: Color configuration options
console.log('\n3️⃣ Color Configuration Options:');
console.log('--------------------------------\n');

// Show difference between color formats
const testMessage = 'Sample MCP Response';
const formats = [
  { name: 'No Colors', useColors: false },
  { name: 'ANSI-16', useColors: true, format: 'ansi-16' },
  { name: 'ANSI-256', useColors: true, format: 'ansi-256' },
  { name: 'True Color', useColors: true, format: 'ansi-16m' }
];

formats.forEach(({ name, useColors, format }) => {
  console.log(`${name}:`);
  if (useColors && format) {
    // Create custom formatter for this format
    const customFormatter = new class extends MCPResponseFormatter {
      private format: string;

      constructor(format: string) {
        super(true);
        this.format = format;
      }

      formatToolResponse(toolName: string, result: any, duration?: number): string {
        const color = Bun.color('#3b82f6', this.format as any);
        return `${color}${testMessage}\x1b[0m`;
      }
    }(format);

    console.log('  ' + customFormatter.formatToolResponse('test', {}));
  } else {
    console.log(`  ${testMessage}`);
  }
  console.log();
});

// Demo 4: Performance with ANSI colors
console.log('4️⃣ Performance Impact of ANSI Colors:');
console.log('-------------------------------------\n');

const iterations = 50000;

// Test without colors
const noColorStart = performance.now();
for (let i = 0; i < iterations; i++) {
  const plainFormatter = new MCPResponseFormatter(false);
  plainFormatter.formatToolResponse('test', { success: true, result: 'test' });
}
const noColorTime = performance.now() - noColorStart;

// Test with colors
const colorStart = performance.now();
for (let i = 0; i < iterations; i++) {
  const colorFormatter = new MCPResponseFormatter(true);
  colorFormatter.formatToolResponse('test', { success: true, result: 'test' });
}
const colorTime = performance.now() - colorStart;

console.log(`Formatting ${iterations.toLocaleString()} responses:`);
console.log(`Without colors: ${noColorTime.toFixed(2)}ms`);
console.log(`With colors:    ${colorTime.toFixed(2)}ms`);
console.log(`Overhead:       ${((colorTime - noColorTime) / noColorTime * 100).toFixed(1)}%`);

// Demo 5: Help text with colors
console.log('\n5️⃣ Colored Help Text:');
console.log('---------------------\n');

function formatHelpWithColors() {
  const lines: string[] = [];

  lines.push(MCPANSIColors.colorize('Available MCP Tools:', 'info'));
  lines.push('');

  const tools = [
    { name: 'analyze_tension', desc: 'Analyze tension in the graph', category: 'analysis' },
    { name: 'propagate_tension', desc: 'Trigger tension propagation', category: 'propagation' },
    { name: 'assess_risk', desc: 'Assess risk levels', category: 'analysis' },
    { name: 'query_history', desc: 'Query historical data', category: 'data' },
    { name: 'get_system_status', desc: 'Get system status', category: 'system' },
    { name: 'get_errors', desc: 'Retrieve error logs', category: 'system' }
  ];

  tools.forEach(tool => {
    const categoryColor = MCPANSIColors.get(tool.category as any);
    lines.push(`  ${categoryColor}●\x1b[0m ${MCPANSIColors.colorize(tool.name, tool.category as any)} - ${tool.desc}`);
  });

  lines.push('');
  lines.push(MCPANSIColors.colorize('Usage: mcp-client call <tool_name> [arguments]', 'muted'));

  return lines.join('\n');
}

console.log(formatHelpWithColors());

console.log('\n✅ MCP ANSI Color demo complete!');
console.log('\n💡 Benefits of ANSI colors in MCP:');
console.log('   • Visual distinction between tool categories');
console.log('   • Instant status recognition');
console.log('   • Better error visibility');
console.log('   • Professional terminal output');
console.log('   • Enhanced user experience');
console.log('   • Minimal performance overhead');
