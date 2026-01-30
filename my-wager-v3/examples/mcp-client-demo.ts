#!/usr/bin/env bun
// MCP Client Demo
// [TENSION-MCP-CLIENT-001] [TENSION-AI-INTEGRATION-002]

// This example demonstrates how to interact with the Tension Field MCP Server

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

interface MCPResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  timestamp: string;
}

class TensionMCPClient {
  private baseUrl: string;
  
  constructor(host: string = 'localhost', port: number = 3002) {
    this.baseUrl = `http://${host}:${port}`;
  }
  
  async getServerInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/`);
    return response.json();
  }
  
  async getAvailableTools(): Promise<Record<string, MCPTool>> {
    const response = await fetch(`${this.baseUrl}/tools`);
    return response.json();
  }
  
  async callTool(toolName: string, args: any = {}): Promise<MCPResponse> {
    const response = await fetch(`${this.baseUrl}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: toolName,
        arguments: args
      })
    });
    
    return response.json();
  }
}

// Demo Usage
async function runMCPDemo() {
  console.log('🔌 Tension Field MCP Client Demo');
  console.log('================================\n');
  
  const client = new TensionMCPClient();
  
  try {
    // 1. Get server info
    console.log('1. Connecting to MCP Server...');
    const serverInfo = await client.getServerInfo();
    console.log(`   Server: ${serverInfo.name} v${serverInfo.version}`);
    console.log(`   Description: ${serverInfo.description}\n`);
    
    // 2. List available tools
    console.log('2. Available Tools:');
    const tools = await client.getAvailableTools();
    Object.entries(tools).forEach(([name, tool]) => {
      console.log(`   - ${name}: ${tool.description}`);
    });
    console.log();
    
    // 3. Get system status
    console.log('3. Getting System Status...');
    const status = await client.callTool('get_system_status', { includeDetails: true });
    if (status.success) {
      console.log(`   Uptime: ${status.result.uptime.toFixed(2)}s`);
      console.log(`   Memory: ${(status.result.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Nodes: ${status.result.propagator.nodeCount}`);
      console.log(`   Edges: ${status.result.propagator.edgeCount}\n`);
    }
    
    // 4. Analyze tension (add demo nodes first)
    console.log('4. Adding Demo Nodes...');
    // Note: In a real implementation, you'd have endpoints to add nodes
    console.log('   (Demo nodes would be added here)\n');
    
    // 5. Propagate tension
    console.log('5. Propagating Tension...');
    const propagation = await client.callTool('propagate_tension', {
      sourceNodes: 'demo-node-0',
      config: {
        decayRate: 0.1,
        inertiaFactor: 0.8,
        maxIterations: 50
      }
    });
    
    if (propagation.success) {
      console.log(`   ✅ Propagation completed`);
      console.log(`   Iterations: ${propagation.result.propagation.iterations}`);
      console.log(`   Converged: ${propagation.result.propagation.converged}`);
      console.log(`   Duration: ${(propagation.result.propagation.durationNs / 1e6).toFixed(2)}ms\n`);
    } else {
      console.log(`   ❌ Propagation failed: ${propagation.error}\n`);
    }
    
    // 6. Assess risk
    console.log('6. Assessing Risk...');
    const risk = await client.callTool('assess_risk', {
      nodeId: 'demo-node-0',
      timeHorizon: 24
    });
    
    if (risk.success) {
      console.log(`   Risk Level: ${risk.result.level || 'Unknown'}`);
      console.log(`   Score: ${risk.result.score || 'N/A'}`);
      if (risk.result.mitigation) {
        console.log(`   Mitigation: ${risk.result.mitigation}`);
      }
      console.log();
    }
    
    // 7. Query history
    console.log('7. Querying Historical Data...');
    const history = await client.callTool('query_history', {
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      metrics: ['tension', 'volatility'],
      limit: 10
    });
    
    if (history.success) {
      console.log(`   Records found: ${history.result.count}`);
      console.log(`   Time range: Last 24 hours\n`);
    }
    
    // 8. Get recent errors
    console.log('8. Checking Recent Errors...');
    const errors = await client.callTool('get_errors', {
      timeRange: 24,
      limit: 5
    });
    
    if (errors.success) {
      if (errors.result.errors.length > 0) {
        console.log(`   Recent errors: ${errors.result.errors.length}`);
        errors.result.errors.forEach((e: any, i: number) => {
          console.log(`   ${i + 1}. [${e.severity}] ${e.code}: ${e.message}`);
        });
      } else {
        console.log('   ✅ No recent errors');
      }
    }
    
    console.log('\n✅ MCP Demo Complete!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n💡 Make sure the MCP server is running:');
    console.log('   bun run mcp:server');
  }
}

// Run demo if this file is executed directly
if (import.meta.main) {
  runMCPDemo();
}

export { TensionMCPClient, runMCPDemo };
