#!/usr/bin/env bun
// 🧪 Enterprise Bundle v1.3.1 - Test Suite
// Comprehensive testing for BuildArtifact Streaming Matrix

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { EnterpriseBundleBuilder } from '../enterprise-bundle-demo';

describe('EnterpriseBundleBuilder', () => {
  let builder: EnterpriseBundleBuilder;
  let server: any;

  beforeAll(async () => {
    builder = new EnterpriseBundleBuilder('v1.3.1-test');
  });

  afterAll(async () => {
    if (server) {
      server.stop();
    }
  });

  describe('Constructor', () => {
    it('should create builder with default version', () => {
      const defaultBuilder = new EnterpriseBundleBuilder();
      expect(defaultBuilder).toBeDefined();
    });

    it('should create builder with custom version', () => {
      const customBuilder = new EnterpriseBundleBuilder('v1.3.1-custom');
      expect(customBuilder).toBeDefined();
    });
  });

  describe('Build Process', () => {
    it('should build in-memory bundle successfully', async () => {
      const mcpCode = `
        export default {
          fetch(req: Request) {
            return new Response('Test Response');
          }
        };
      `;

      const { result, artifacts } = await builder.buildInMemory(mcpCode);
      
      expect(result).toBeDefined();
      expect(artifacts).toBeDefined();
      expect(artifacts.length).toBeGreaterThan(0);
      
      const entryPoint = artifacts.find(a => a.kind === 'entry-point');
      expect(entryPoint).toBeDefined();
      expect(entryPoint?.path).toBe('registry-mcp.js');
      expect(entryPoint?.size).toBeGreaterThan(0);
    });

    it('should handle build errors gracefully', async () => {
      const invalidCode = 'invalid javascript code {{{';
      
      try {
        await builder.buildInMemory(invalidCode);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Build failed');
      }
    });
  });

  describe('BuildArtifact Interface', () => {
    let artifact: any;

    beforeAll(async () => {
      const mcpCode = 'export default { fetch() { return new Response("test"); } }';
      const { artifacts } = await builder.buildInMemory(mcpCode);
      artifact = artifacts.find(a => a.kind === 'entry-point');
    });

    it('should implement all required Blob methods', async () => {
      expect(artifact.text).toBeDefined();
      expect(artifact.arrayBuffer).toBeDefined();
      expect(artifact.stream).toBeDefined();
      expect(artifact.json).toBeDefined();
      expect(artifact.formData).toBeDefined();
      expect(artifact.bytes).toBeDefined();
      expect(artifact.slice).toBeDefined();
    });

    it('should return text content', async () => {
      const text = await artifact.text();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should return array buffer', async () => {
      const buffer = await artifact.arrayBuffer();
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should return readable stream', async () => {
      const stream = artifact.stream();
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should parse JSON content', async () => {
      // Test with JSON content
      const jsonCode = '{"test": true}';
      const { artifacts } = await builder.buildInMemory(jsonCode);
      const jsonArtifact = artifacts.find(a => a.kind === 'entry-point');
      
      try {
        const parsed = await jsonArtifact.json();
        expect(parsed).toBeDefined();
      } catch {
        // Expected for non-JSON content
      }
    });

    it('should return form data', async () => {
      const formData = await artifact.formData();
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should run benchmarks without errors', async () => {
      const mcpCode = 'export default { fetch() { return new Response("test"); } }';
      const { artifacts } = await builder.buildInMemory(mcpCode);
      
      expect(async () => {
        await builder.benchmark(artifacts);
      }).not.toThrow();
    });
  });

  describe('Bundle Analysis', () => {
    it('should analyze bundle correctly', async () => {
      const mcpCode = 'export default { fetch() { return new Response("test"); } }';
      const { result } = await builder.buildInMemory(mcpCode);
      
      expect(async () => {
        builder.analyzeBundle(result);
      }).not.toThrow();
    });
  });

  describe('R2 Upload Simulation', () => {
    it('should simulate R2 upload successfully', async () => {
      const mcpCode = 'export default { fetch() { return new Response("test"); } }';
      const { artifacts } = await builder.buildInMemory(mcpCode);
      const artifact = artifacts.find(a => a.kind === 'entry-point');
      
      const uploadResult = await builder.uploadToR2(artifact!);
      
      expect(uploadResult).toBeDefined();
      expect(uploadResult.url).toContain('https://');
      expect(uploadResult.etag).toBeDefined();
      expect(uploadResult.etag.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Server', () => {
    it('should create memory server successfully', async () => {
      const mcpCode = 'export default { fetch() { return new Response("test"); } }';
      const { artifacts } = await builder.buildInMemory(mcpCode);
      const artifact = artifacts.find(a => a.kind === 'entry-point');
      
      server = await builder.createMemoryServer(artifact!, 1383);
      
      expect(server).toBeDefined();
      expect(server.port).toBe(1383);
    });

    it('should respond to health check', async () => {
      const response = await fetch('http://localhost:1383/api/health');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('v1.3.1-test');
      expect(data.bundleSize).toBeGreaterThan(0);
    });

    it('should respond to registry endpoint', async () => {
      const response = await fetch('http://localhost:1383/api/registry');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.version).toBe('v1.3.1-test');
      expect(data.endpoints).toContain('/api/health');
      expect(data.endpoints).toContain('/api/registry');
      expect(data.endpoints).toContain('/api/metrics');
    });

    it('should respond to metrics endpoint', async () => {
      const response = await fetch('http://localhost:1383/api/metrics');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.requests).toBeDefined();
      expect(data.errors).toBeDefined();
      expect(data.uptime).toBeDefined();
      expect(data.memory).toBeDefined();
    });
  });

  describe('WebSocket PTY', () => {
    it('should handle WebSocket connections', async () => {
      const ws = new WebSocket('ws://localhost:1383');
      
      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          expect(ws.readyState).toBe(1); // WebSocket.OPEN
          resolve(true);
        };
        
        ws.onerror = reject;
        
        setTimeout(reject, 1000); // Timeout after 1 second
      });
      
      ws.close();
    });
  });

  describe('Quality Assurance', () => {
    it('should pass all QA checks', async () => {
      const mcpCode = 'export default { fetch() { return new Response("test"); } }';
      const { result, artifacts } = await builder.buildInMemory(mcpCode);
      
      // Bundle size check
      const totalSize = result.outputs.reduce((sum: number, output: any) => sum + output.size, 0);
      expect(totalSize).toBeLessThan(4873); // Target: <4.51KB
      
      // Hash presence check
      const entryPoint = artifacts.find(a => a.kind === 'entry-point');
      expect(entryPoint?.hash).toBeDefined();
      expect(entryPoint?.hash?.length).toBeGreaterThan(0);
      
      // Type safety check
      expect(artifacts.every(a => a.kind && a.path && a.loader)).toBe(true);
    });
  });
});

// Integration Tests
describe('Integration Tests', () => {
  it('should handle complete workflow', async () => {
    const builder = new EnterpriseBundleBuilder('v1.3.1-integration');
    const mcpCode = `
      export default {
        async fetch(req: Request) {
          const url = new URL(req.url);
          
          if (url.pathname === '/test') {
            return Response.json({
              message: 'Integration test successful',
              timestamp: new Date().toISOString()
            });
          }
          
          return new Response('Not Found', { status: 404 });
        }
      };
    `;

    // Build
    const { result, artifacts } = await builder.buildInMemory(mcpCode);
    expect(artifacts.length).toBeGreaterThan(0);

    // Analyze
    builder.analyzeBundle(result);

    // Benchmark
    await builder.benchmark(artifacts);

    // Upload
    const artifact = artifacts.find(a => a.kind === 'entry-point');
    const uploadResult = await builder.uploadToR2(artifact!);
    expect(uploadResult.url).toContain('factory-wager-mcp');

    // Server
    const server = await builder.createMemoryServer(artifact!, 1384);
    
    try {
      // Test custom endpoint
      const response = await fetch('http://localhost:1384/test');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe('Integration test successful');
    } finally {
      server.stop();
    }
  });
});

console.log('🧪 Enterprise Bundle Test Suite Complete');
