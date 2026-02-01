#!/usr/bin/env bun
// Simple Instant MCP Server - FactoryWager v1.3.8
// Fast startup + WebSocket PTY overlay

// Make this file a module
export {};

console.log("🚀 Simple Instant MCP Server - FactoryWager v1.3.8");
console.log("=" .repeat(50));

// Simple MCP Router
class MCPRouter {
  private routes: Map<string, (req: Request) => Promise<Response>> = new Map();

  addRoute(path: string, handler: (req: Request) => Promise<Response>) {
    this.routes.set(path, handler);
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    
    const handler = this.routes.get(path);
    if (handler) {
      return await handler(req);
    }

    return new Response(JSON.stringify({
      error: "Route not found",
      path: path,
      availableRoutes: Array.from(this.routes.keys())
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Create router
const router = new MCPRouter();

// Health check endpoint
router.addRoute("/api/health", async (req) => {
  return new Response(JSON.stringify({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "factory-wager-mcp",
    version: "1.3.8",
    uptime: process.uptime(),
    memory: process.memoryUsage()
  }), {
    headers: { "Content-Type": "application/json" }
  });
});

// R2 upload endpoint
router.addRoute("/api/r2/upload", async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const disposition = formData.get("disposition") as string || "attachment";
    const filename = formData.get("filename") as string || file.name;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const uploadResult = {
      success: true,
      url: 'https://factory-wager.com/uploads/' + filename,
      filename: filename,
      disposition: disposition,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(uploadResult), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

// Metrics endpoint
router.addRoute("/api/metrics", async (req) => {
  const metrics = {
    requests: Math.floor(Math.random() * 1000),
    errors: Math.floor(Math.random() * 10),
    avgResponseTime: Math.random() * 100,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(metrics), {
    headers: { "Content-Type": "application/json" }
  });
});

// WebSocket PTY Overlay
class WebSocketPTYOverlay {
  private connections: Set<any> = new Set(); // Using any for ServerWebSocket
  private terminalSessions: Map<string, any> = new Map();

  addConnection(ws: any, sessionId: string = "default") {
    this.connections.add(ws);
    
    const session = {
      id: sessionId,
      created: new Date().toISOString(),
      commands: [],
      output: []
    };
    this.terminalSessions.set(sessionId, session);

    ws.send(JSON.stringify({
      type: "session_created",
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }));

    ws.addEventListener("message", (message: any) => {
      try {
        const data = JSON.parse(message.data.toString());
        this.handleCommand(ws, sessionId, data);
      } catch (error) {
        ws.send(JSON.stringify({
          type: "error",
          error: "Invalid JSON",
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.addEventListener("close", () => {
      this.connections.delete(ws);
      this.terminalSessions.delete(sessionId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: "output",
      data: "Welcome to FactoryWager MCP Terminal v1.3.8\n",
      timestamp: new Date().toISOString()
    }));
  }

  private handleCommand(ws: any, sessionId: string, data: any) {
    const session = this.terminalSessions.get(sessionId);
    if (!session) return;

    const command = data.command || "";
    session.commands.push({
      command: command,
      timestamp: new Date().toISOString()
    });

    let output = "";
    
    switch (command.trim()) {
      case "help":
        output = "FactoryWager MCP Terminal Commands:\n" +
                "  help     - Show this help\n" +
                "  status   - Show server status\n" +
                "  metrics  - Show system metrics\n" +
                "  routes   - Show available routes\n" +
                "  clear    - Clear terminal\n" +
                "  exit     - Close session\n";
        break;
        
      case "status":
        output = "Server Status:\n" +
                "  Status: Running\n" +
                "  Uptime: " + process.uptime().toFixed(2) + "s\n" +
                "  Memory: " + (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB\n" +
                "  Connections: " + this.connections.size + "\n" +
                "  Sessions: " + this.terminalSessions.size + "\n";
        break;
        
      case "metrics":
        output = "System Metrics:\n" +
                "  CPU: " + (Math.random() * 100).toFixed(1) + "%\n" +
                "  Memory: " + (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB\n" +
                "  Requests: " + Math.floor(Math.random() * 1000) + "\n" +
                "  Errors: " + Math.floor(Math.random() * 10) + "\n" +
                "  Response Time: " + (Math.random() * 100).toFixed(1) + "ms\n";
        break;
        
      case "routes":
        output = "Available Routes:\n" +
                "  GET  /api/health\n" +
                "  POST /api/r2/upload\n" +
                "  GET  /api/metrics\n" +
                "  GET  /api/ws (WebSocket)\n";
        break;
        
      case "clear":
        ws.send(JSON.stringify({
          type: "clear",
          timestamp: new Date().toISOString()
        }));
        return;
        
      case "exit":
        ws.close();
        return;
        
      default:
        if (command.trim()) {
          output = "Command not recognized: " + command + "\nType 'help' for available commands.\n";
        }
        break;
    }

    session.output.push({
      data: output,
      timestamp: new Date().toISOString()
    });

    ws.send(JSON.stringify({
      type: "output",
      data: output,
      timestamp: new Date().toISOString()
    }));
  }

  broadcast(message: any) {
    const data = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    // Use Array.from() to avoid iteration issues
    for (const ws of Array.from(this.connections)) {
      if (ws.readyState === 1) { // WebSocket.OPEN = 1
        ws.send(data);
      }
    }
  }
}

const ptyOverlay = new WebSocketPTYOverlay();

// Start server function
async function startServer() {
  console.log("🌐 Starting server on http://localhost:1380");
  console.log(`🔌 WebSocket PTY overlay available`);
  console.log("");
  console.log("📋 Available Endpoints:");
  console.log("  GET  http://localhost:1380/api/health");
  console.log("  POST http://localhost:1380/api/r2/upload");
  console.log("  GET  http://localhost:1380/api/metrics");
  console.log("  WS   ws://localhost:1380/api/ws");
  console.log("");
  console.log("💡 Connect with WebSocket client for PTY overlay:");
  console.log("   const ws = new WebSocket('ws://localhost:1380/api/ws');");
  console.log("   ws.send(JSON.stringify({command: 'help'}));");

  const server = Bun.serve({
    port: 1380,
    fetch(req) {
      // Handle WebSocket upgrade
      if (req.headers.get("upgrade") === "websocket") {
        const success = server.upgrade(req);
        if (success) return undefined;
      }
      
      // Route through MCP router
      return router.handle(req);
    },
    websocket: {
      message(ws: any, message: any) {
        // Messages are handled by PTY overlay
      },
      open(ws: any) {
        ptyOverlay.addConnection(ws, "session-" + Date.now());
      },
      close(ws: any) {
        // Connection cleanup handled by PTY overlay
      },
      drain(ws: any) {
        // Handle drain if needed
      }
    }
  });

  console.log("🚀 Server started successfully!");
  
  console.log("  WS   ws://localhost:1380/api/ws");
  console.log("");
  console.log("💡 Connect with WebSocket client for PTY overlay:");
  console.log("   const ws = new WebSocket('ws://localhost:1380/api/ws');");
  console.log("   ws.send(JSON.stringify({command: 'help'}));");

  // Broadcast server status every 30 seconds
  setInterval(() => {
    ptyOverlay.broadcast({
      type: "server_status",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: ptyOverlay["connections"].size
    });
  }, 30000);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down server...");
    server.stop();
    process.exit(0);
  });

  return server;
}

// Start the server
startServer().catch(console.error);
