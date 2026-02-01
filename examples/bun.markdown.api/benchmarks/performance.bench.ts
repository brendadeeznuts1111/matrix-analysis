#!/usr/bin/env bun
// 📊 Enterprise Bundle v1.3.1 - Performance Benchmarks
// Comprehensive performance testing and analysis

import { bench, describe } from 'bun:test';
import { EnterpriseBundleBuilder } from '../enterprise-bundle-demo';

const builder = new EnterpriseBundleBuilder('v1.3.1-benchmark');
const mcpCode = `
export default {
  async fetch(req: Request) {
    const url = new URL(req.url);
    
    switch (url.pathname) {
      case '/api/health':
        return Response.json({
          status: 'healthy',
          version: 'v1.3.1',
          timestamp: new Date().toISOString()
        });
        
      case '/api/metrics':
        return Response.json({
          requests: Math.floor(Math.random() * 1000),
          errors: Math.floor(Math.random() * 10),
          uptime: process.uptime(),
          memory: process.memoryUsage()
        });
        
      default:
        return new Response('Enterprise Bundle Server', {
          headers: { 'Content-Type': 'text/plain' }
        });
    }
  }
};
`;

describe('Enterprise Bundle Performance', () => {
  let artifacts: any[];
  let artifact: any;

  beforeAll(async () => {
    const { result, artifacts: builtArtifacts } = await builder.buildInMemory(mcpCode);
    artifacts = builtArtifacts;
    artifact = artifacts.find(a => a.kind === 'entry-point');
  });

  describe('Build Performance', () => {
    bench('Bundle Creation', async () => {
      await builder.buildInMemory(mcpCode);
    }, {
      iterations: 100,
      time: 1000, // 1 second
    });

    bench('Bundle Analysis', async () => {
      const { result } = await builder.buildInMemory(mcpCode);
      builder.analyzeBundle(result);
    }, {
      iterations: 1000,
      time: 1000,
    });
  });

  describe('BuildArtifact Operations', () => {
    bench('artifact.text()', async () => {
      await artifact.text();
    }, {
      iterations: 10000,
      time: 1000,
    });

    bench('artifact.arrayBuffer()', async () => {
      await artifact.arrayBuffer();
    }, {
      iterations: 10000,
      time: 1000,
    });

    bench('artifact.bytes()', async () => {
      await artifact.bytes();
    }, {
      iterations: 10000,
      time: 1000,
    });

    bench('artifact.stream()', async () => {
      const stream = artifact.stream();
      const reader = stream.getReader();
      await reader.read();
      reader.releaseLock();
    }, {
      iterations: 10000,
      time: 1000,
    });

    bench('artifact.json()', async () => {
      try {
        await artifact.json();
      } catch {
        // Expected for non-JSON content
      }
    }, {
      iterations: 1000,
      time: 1000,
    });

    bench('artifact.formData()', async () => {
      await artifact.formData();
    }, {
      iterations: 1000,
      time: 1000,
    });
  });

  describe('R2 Upload Simulation', () => {
    bench('R2 Upload Simulation', async () => {
      await builder.uploadToR2(artifact);
    }, {
      iterations: 1000,
      time: 1000,
    });
  });

  describe('Memory Operations', () => {
    bench('Memory Allocation', () => {
      const buffer = new ArrayBuffer(4096);
      const view = new Uint8Array(buffer);
      view.fill(0);
      return buffer;
    }, {
      iterations: 100000,
      time: 1000,
    });

    bench('Text Encoding', () => {
      const encoder = new TextEncoder();
      return encoder.encode(mcpCode);
    }, {
      iterations: 10000,
      time: 1000,
    });

    bench('Text Decoding', () => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const encoded = encoder.encode(mcpCode);
      return decoder.decode(encoded);
    }, {
      iterations: 10000,
      time: 1000,
    });
  });

  describe('Hash Operations', () => {
    bench('Simple Hash Simulation', () => {
      // Simulate hash operation
      const data = new TextEncoder().encode(mcpCode);
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data[i];
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(36);
    }, {
      iterations: 10000,
      time: 1000,
    });

    bench('HMAC Simulation', () => {
      // Simulate HMAC operation
      const data = new TextEncoder().encode(mcpCode);
      const key = new TextEncoder().encode('demo-hmac-key');
      let result = 0;
      for (let i = 0; i < data.length; i++) {
        result ^= data[i] ^ key[i % key.length];
      }
      return result.toString(36);
    }, {
      iterations: 10000,
      time: 1000,
    });
  });

  describe('Compression Simulation', () => {
    bench('Gzip Compression Simulation', () => {
      // Simple compression simulation
      const data = mcpCode;
      let compressed = '';
      let count = 1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i] === data[i - 1]) {
          count++;
        } else {
          compressed += data[i - 1] + (count > 1 ? count : '');
          count = 1;
        }
      }
      compressed += data[data.length - 1] + (count > 1 ? count : '');
      
      return compressed;
    }, {
      iterations: 1000,
      time: 1000,
    });

    bench('Brotli Compression Simulation', () => {
      // Simple Brotli-like compression
      const data = mcpCode;
      const dictionary = ['export', 'default', 'return', 'Response', 'json'];
      let compressed = data;
      
      dictionary.forEach((word, index) => {
        const marker = `\\x${index.toString(16).padStart(2, '0')}`;
        compressed = compressed.replaceAll(word, marker);
      });
      
      return compressed;
    }, {
      iterations: 1000,
      time: 1000,
    });
  });

  describe('Server Operations', () => {
    let server: any;

    beforeAll(async () => {
      server = await builder.createMemoryServer(artifact, 1385);
    });

    afterAll(async () => {
      if (server) {
        server.stop();
      }
    });

    bench('HTTP Request - Health Check', async () => {
      await fetch('http://localhost:1385/api/health');
    }, {
      iterations: 1000,
      time: 1000,
    });

    bench('HTTP Request - Registry', async () => {
      await fetch('http://localhost:1385/api/registry');
    }, {
      iterations: 1000,
      time: 1000,
    });

    bench('HTTP Request - Metrics', async () => {
      await fetch('http://localhost:1385/api/metrics');
    }, {
      iterations: 1000,
      time: 1000,
    });

    bench('JSON Response Parsing', async () => {
      const response = await fetch('http://localhost:1385/api/health');
      return response.json();
    }, {
      iterations: 1000,
      time: 1000,
    });
  });

  describe('WebSocket Operations', () => {
    bench('WebSocket Connection', async () => {
      const ws = new WebSocket('ws://localhost:1385');
      await new Promise((resolve) => {
        ws.onopen = resolve;
        setTimeout(resolve, 100); // Fallback timeout
      });
      ws.close();
    }, {
      iterations: 100,
      time: 1000,
    });

    bench('WebSocket Message', async () => {
      const ws = new WebSocket('ws://localhost:1385');
      await new Promise((resolve) => {
        ws.onopen = () => {
          ws.send('test message');
          setTimeout(resolve, 50);
        };
      });
      ws.close();
    }, {
      iterations: 100,
      time: 1000,
    });
  });

  describe('Concurrent Operations', () => {
    bench('Concurrent Bundle Builds', async () => {
      const promises = Array(10).fill(null).map(() => 
        builder.buildInMemory(mcpCode)
      );
      return Promise.all(promises);
    }, {
      iterations: 10,
      time: 1000,
    });

    bench('Concurrent HTTP Requests', async () => {
      const promises = Array(50).fill(null).map(() => 
        fetch('http://localhost:1385/api/health')
      );
      return Promise.all(promises);
    }, {
      iterations: 20,
      time: 1000,
    });

    bench('Concurrent Artifact Operations', async () => {
      const promises = Array(100).fill(null).map(() => 
        artifact.text()
      );
      return Promise.all(promises);
    }, {
      iterations: 100,
      time: 1000,
    });
  });
});

// Performance Summary
console.log('📊 Enterprise Bundle Performance Benchmarks');
console.log('==========================================');
console.log('Target Metrics:');
console.log('  Build Time: <15ms');
console.log('  Bundle Size: <4.6KB');
console.log('  API Response: <10ms');
console.log('  WebSocket Latency: <2ms');
console.log('  Concurrent Requests: 1000+');
console.log('');

// Run benchmarks with specific configuration
if (import.meta.main) {
  console.log('🚀 Starting performance benchmarks...');
  console.log('Server will be available on http://localhost:1385');
  console.log('');
}
