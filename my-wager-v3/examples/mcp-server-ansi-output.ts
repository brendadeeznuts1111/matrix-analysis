#!/usr/bin/env bun
// MCP Server with Enhanced ANSI Output
// Using Bun.wrapAnsi for beautiful terminal responses

// Make this a module
export {};

console.log('🔌 MCP Server Enhanced ANSI Output');
console.log('=================================\n');

// ANSI color palette for MCP responses
const MCP_COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  tool: '\x1b[36m',
  success: '\x1b[32m',
  warning: '\x1b[33m',
  error: '\x1b[31m',
  info: '\x1b[34m',
  result: '\x1b[35m',
  highlight: '\x1b[43m\x1b[30m'
};

// Enhanced MCP response formatter
class MCPResponseFormatter {
  private width: number;
  
  constructor(width: number = 80) {
    this.width = width;
  }
  
  // Format tool execution result
  formatToolResult(toolName: string, result: any, duration?: number): string {
    if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
    
    const lines: string[] = [];
    
    // Header
    lines.push(`${MCP_COLORS.bright}${MCP_COLORS.tool}╭─ Tool: ${toolName}${MCP_COLORS.reset}`);
    lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset}`);
    
    // Success/Error status
    const status = result.success !== false ? 
      `${MCP_COLORS.success}✅ Success${MCP_COLORS.reset}` : 
      `${MCP_COLORS.error}❌ Error${MCP_COLORS.reset}`;
    
    lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset} Status: ${status}`);
    
    if (duration) {
      lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset} Duration: ${MCP_COLORS.info}${duration.toFixed(2)}ms${MCP_COLORS.reset}`);
    }
    
    lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset}`);
    
    // Result content
    if (result.result) {
      lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset} ${MCP_COLORS.bright}Result:${MCP_COLORS.reset}`);
      lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset}`);
      
      const resultText = this.formatResultContent(result.result);
      const wrappedResult = Bun.wrapAnsi(resultText, this.width - 4, { trim: true });
      wrappedResult.split('\n').forEach(line => {
        lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset} ${line}`);
      });
    }
    
    if (result.error) {
      lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset} ${MCP_COLORS.bright}Error:${MCP_COLORS.reset}`);
      lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset}`);
      
      const wrappedError = Bun.wrapAnsi(
        `${MCP_COLORS.error}${result.error}${MCP_COLORS.reset}`, 
        this.width - 4, 
        { trim: true }
      );
      wrappedError.split('\n').forEach(line => {
        lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset} ${line}`);
      });
    }
    
    // Footer
    lines.push(`${MCP_COLORS.tool}│${MCP_COLORS.reset}`);
    lines.push(`${MCP_COLORS.bright}${MCP_COLORS.tool}╰─ End of ${toolName}${MCP_COLORS.reset}`);
    
    return lines.join('\n');
  }
  
  // Format different result types
  private formatResultContent(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    
    if (Array.isArray(result)) {
      if (result.length === 0) return `${MCP_COLORS.dim}No results${MCP_COLORS.reset}`;
      
      return result.map((item, index) => {
        if (typeof item === 'object') {
          return `${index + 1}. ${JSON.stringify(item, null, 2)}`;
        }
        return `${index + 1}. ${item}`;
      }).join('\n');
    }
    
    if (typeof result === 'object') {
      const lines: string[] = [];
      Object.entries(result).forEach(([key, value]) => {
        const wrappedKey = Bun.wrapAnsi(
          `${MCP_COLORS.highlight} ${key}:${MCP_COLORS.reset}`, 
          Math.floor(this.width / 3),
          { trim: true }
        );
        const wrappedValue = Bun.wrapAnsi(
          String(value), 
          Math.floor(this.width / 3) - 2,
          { trim: true }
        );
        lines.push(`${wrappedKey} ${wrappedValue}`);
      });
      return lines.join('\n');
    }
    
    return String(result);
  }
  
  // Format help text
  formatHelp(tools: Array<{name: string, description: string}>): string {
    if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
    
    const lines: string[] = [];
    
    lines.push(`${MCP_COLORS.bright}${MCP_COLORS.info}Available MCP Tools:${MCP_COLORS.reset}\n`);
    
    tools.forEach(tool => {
      const wrappedName = Bun.wrapAnsi(
        `${MCP_COLORS.tool}${tool.name}${MCP_COLORS.reset}`, 
        25,
        { trim: true }
      );
      const wrappedDesc = Bun.wrapAnsi(
        tool.description, 
        this.width - 30,
        { trim: true }
      );
      
      lines.push(`  ${wrappedName.padEnd(25)} ${wrappedDesc}`);
    });
    
    return lines.join('\n');
  }
  
  // Format error with context
  formatError(error: string, context?: string): string {
    if (!Bun?.wrapAnsi) return 'Bun.wrapAnsi not available';
    
    const lines: string[] = [];
    
    lines.push(`${MCP_COLORS.error}╭─ Error${MCP_COLORS.reset}`);
    lines.push(`${MCP_COLORS.error}│${MCP_COLORS.reset}`);
    
    if (context) {
      const wrappedContext = Bun.wrapAnsi(
        `${MCP_COLORS.dim}Context: ${context}${MCP_COLORS.reset}`,
        this.width - 4,
        { trim: true }
      );
      wrappedContext.split('\n').forEach(line => {
        lines.push(`${MCP_COLORS.error}│${MCP_COLORS.reset} ${line}`);
      });
      lines.push(`${MCP_COLORS.error}│${MCP_COLORS.reset}`);
    }
    
    const wrappedError = Bun.wrapAnsi(
      `${MCP_COLORS.bright}${error}${MCP_COLORS.reset}`,
      this.width - 4,
      { trim: true }
    );
    wrappedError.split('\n').forEach(line => {
      lines.push(`${MCP_COLORS.error}│${MCP_COLORS.reset} ${line}`);
    });
    
    lines.push(`${MCP_COLORS.error}│${MCP_COLORS.reset}`);
    lines.push(`${MCP_COLORS.bright}${MCP_COLORS.error}╰─ End Error${MCP_COLORS.reset}`);
    
    return lines.join('\n');
  }
}

// Demo: MCP Server Responses
console.log('📨 Sample MCP Server Responses:\n');

const formatter = new MCPResponseFormatter(80);

// Demo 1: Successful tool execution
console.log('1️⃣ Successful Tool Execution:');
console.log('============================\n');

const systemStatusResult = {
  success: true,
  result: {
    timestamp: '2026-01-30T21:30:00.000Z',
    uptime: 72.5,
    memory: {
      heapUsed: 45670000,
      heapTotal: 64000000
    },
    propagator: {
      nodeCount: 1247,
      edgeCount: 3892,
      stats: {
        totalPropagations: 15234,
        averageConvergenceTime: 0.11
      }
    }
  }
};

console.log(formatter.formatToolResult('get_system_status', systemStatusResult, 12.5));

// Demo 2: Error response
console.log('\n2️⃣ Error Response:');
console.log('================\n');

const errorResult = {
  success: false,
  error: 'TENSION_001: Propagation failed - Node timeout exceeded',
  code: 'PROPAGATION_TIMEOUT'
};

console.log(formatter.formatError(errorResult.error, 'During analyze_tension with nodeId: node-42'));

// Demo 3: Array result
console.log('\n3️⃣ Array Result:');
console.log('==============\n');

const errorsResult = {
  success: true,
  result: [
    { code: 'TENSION_001', severity: 'high', message: 'Propagation failed', timestamp: '2026-01-30T21:29:00Z' },
    { code: 'TENSION_401', severity: 'medium', message: 'Memory limit exceeded', timestamp: '2026-01-30T21:28:00Z' },
    { code: 'TENSION_101', severity: 'low', message: 'WebSocket connection lost', timestamp: '2026-01-30T21:27:00Z' }
  ]
};

console.log(formatter.formatToolResult('get_errors', errorsResult, 8.3));

// Demo 4: Help text
console.log('\n4️⃣ Help Text:');
console.log('===========\n');

const tools = [
  { name: 'analyze_tension', description: 'Analyze tension in the graph for a specific node or the entire network' },
  { name: 'propagate_tension', description: 'Trigger tension propagation from source nodes with configurable parameters' },
  { name: 'assess_risk', description: 'Assess risk levels for nodes or the entire network based on historical data' },
  { name: 'query_history', description: 'Query historical tension data and metrics with time range filtering' },
  { name: 'get_system_status', description: 'Get current system status and health metrics including memory and performance' },
  { name: 'get_errors', description: 'Retrieve recent errors and system issues with severity filtering' }
];

console.log(formatter.formatHelp(tools));

// Demo 5: Integration example
console.log('\n5️⃣ Integration Example:');
console.log('=====================\n');

console.log(`${MCP_COLORS.info}Example MCP server endpoint with ANSI formatting:${MCP_COLORS.reset}\n`);

const integrationCode = `
// Enhanced MCP server with ANSI output
app.post('/call', async (req, res) => {
  const { tool, arguments: args } = req.body;
  const formatter = new MCPResponseFormatter(process.stdout.columns || 80);
  
  try {
    const startTime = performance.now();
    const result = await handleToolCall(tool, args);
    const duration = performance.now() - startTime;
    
    // Format beautiful ANSI response
    const formatted = formatter.formatToolResult(tool, result, duration);
    
    // Return both JSON and formatted text
    res.json({
      success: true,
      result,
      formatted: process.env.FORMAT === 'ansi' ? formatted : undefined
    });
  } catch (error) {
    const formatted = formatter.formatError(error.message, tool);
    res.json({
      success: false,
      error: error.message,
      formatted: process.env.FORMAT === 'ansi' ? formatted : undefined
    });
  }
});
`;

console.log(integrationCode);

console.log('\n✅ ANSI formatting enhances MCP server with:');
console.log('   - Beautiful terminal output');
console.log('   - Color-coded responses');
console.log('   - Automatic text wrapping');
console.log('   - Structured error display');
console.log('   - Professional CLI experience');
