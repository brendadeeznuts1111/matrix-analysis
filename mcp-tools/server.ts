#!/usr/bin/env bun
// mcp-tools/server.ts
import { createValidatedMCPServer } from './validate.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Create and start the validated MCP server
const server = createValidatedMCPServer();

// Mock transport for demonstration
class MockTransport {
  async send(message: any) {
    console.log('📤 Sending:', JSON.stringify(message, null, 2));
  }

  async start() {
    console.log('🚀 Tier-1380 MCP Server started with deepMatch validation');
    console.log('📋 Available tools:', Object.keys(require('./registry.json')).join(', '));
    console.log('');

    // Demonstrate some example calls
    await this.demonstrateCalls();
  }

  async demonstrateCalls() {
    console.log('🎭 Demonstrating tool calls:\n');

    const examples = [
      {
        name: ListToolsRequestSchema,
        params: {},
        description: 'List all available tools'
      },
      {
        name: CallToolRequestSchema,
        params: {
          name: 'rss/query',
          arguments: { pattern: 'bun', limit: 5 }
        },
        description: 'Valid RSS query call'
      },
      {
        name: CallToolRequestSchema,
        params: {
          name: 'cdn/purge',
          arguments: { domain: 'example.com', confirm: true }
        },
        description: 'Valid CDN purge call'
      },
      {
        name: CallToolRequestSchema,
        params: {
          name: 'audit/scan',
          arguments: { path: '/src', max_width: 89, recursive: true }
        },
        description: 'Valid audit scan call'
      },
      {
        name: CallToolRequestSchema,
        params: {
          name: 'rss/query',
          arguments: { limit: 10 } // Missing required 'pattern'
        },
        description: 'Invalid call - missing required field'
      }
    ];

    for (const example of examples) {
      console.log(`📞 ${example.description}`);
      console.log(`   Request: ${example.name} - ${JSON.stringify(example.params)}`);

      try {
        const result = await server.request(example.name, example.params, {
          _meta: { headers: { cookie: 'session=valid' } }
        });
        console.log(`   ✅ Success:`, JSON.stringify(result).substring(0, 100) + '...');
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.log('');
    }
  }
}

// Start the server
const transport = new MockTransport();
transport.start().catch(console.error);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Tier-1380 MCP Server shutting down...');
  process.exit(0);
});
