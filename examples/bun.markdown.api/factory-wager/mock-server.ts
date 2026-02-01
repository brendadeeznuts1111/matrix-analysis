// factory-wager/mock-server.ts
// Mock endpoints for FactoryWager health check demonstration

const colors = {
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log(`${colors.cyan}🚀 Starting FactoryWager Mock Server with Dev Subdomain Support...${colors.reset}\n`);

const server = Bun.serve({
  port: 3000,
  routes: {
    // Development API
    '/': () => {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        service: 'factory-wager-dev-api',
        timestamp: Date.now()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Factory-Version': '1.0.0',
          'CF-Ray': 'mock-ray-001'
        }
      });
    },

    // Health check endpoint
    '/health': () => {
      return new Response(JSON.stringify({ 
        status: 'ok',
        uptime: 3600,
        checks: {
          database: 'connected',
          cache: 'available',
          workers: 'ready'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-CRC32': '12345678',
          'CF-Ray': 'mock-ray-health'
        }
      });
    },

    // Registry endpoint
    '/registry': () => {
      return new Response(JSON.stringify({
        packages: 42,
        status: 'operational',
        version: 'v2.1.0'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'CF-Ray': 'mock-ray-registry'
        }
      });
    },

    // Monitoring endpoint
    '/status': () => {
      return new Response(JSON.stringify({
        overall: 'healthy',
        services: ['api', 'registry', 'r2'],
        incidents: []
      }), {
        headers: {
          'Content-Type': 'application/json',
          'CF-Ray': 'mock-ray-status'
        }
      });
    }
  },

  // Fallback for any other path
  fetch(req) {
    return new Response(JSON.stringify({
      message: 'FactoryWager Mock Server',
      path: new URL(req.url).pathname,
      status: 'running'
    }), {
      headers: { 'Content-Type': 'application/json', 'CF-Ray': 'mock-ray-generic' }
    });
  }
});

console.log(`${colors.green}✅ Mock server running at http://localhost:${server.port}${colors.reset}`);
console.log(`${colors.cyan}📡 Endpoints available:${colors.reset}`);
console.log(`   - http://localhost:3000/ (Development API)`);
console.log(`   - http://localhost:3000/health (Health Check)`);
console.log(`   - http://localhost:3000/registry (Registry)`);
console.log(`   - http://localhost:3000/status (Monitoring)`);
console.log(`\n${colors.cyan}Press Ctrl+C to stop${colors.reset}`);

// Keep the process running
setInterval(() => {}, 1000);
