#!/usr/bin/env bun
/**
 * Tier-1380 SSE Live Alert Server
 * Real-time width violation streaming with multi-region broadcast
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";

// ─── Glyphs ───────────────────────────────────────
const GLYPHS = {
  STREAM: "📡",
  ALERT: "🚨",
  CONNECT: "🔌",
  DISCONNECT: "⛓",
  BROADCAST: "📻",
  DRIFT: "▵⟂⥂",
};

// ─── CSRF Token Store ─────────────────────────────
const csrfTokens = new Map<string, { token: string; expiry: number }>();

function generateCSRFToken(sessionId: string): string {
  const token = Bun.randomUUIDv7();
  csrfTokens.set(sessionId, { token, expiry: Date.now() + 3600000 }); // 1 hour
  return token;
}

function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (stored.expiry < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// ─── Violation Alert Stream ───────────────────────
interface ViolationAlert {
  id: string;
  timestamp: string;
  tenant: string;
  file: string;
  line: number;
  width: number;
  preview: string;
  severity: "warning" | "critical";
}

class AlertStreamManager {
  private clients = new Set<{ 
    id: string; 
    writer: WritableStreamDefaultWriter; 
    tenant: string;
    filters?: { minWidth?: number; severity?: string };
  }>();
  
  private violationQueue: ViolationAlert[] = [];
  private db: Database | null = null;
  private lastCheck = Date.now();
  
  constructor() {
    if (existsSync("./data/tier1380.db")) {
      this.db = new Database("./data/tier1380.db");
    }
  }
  
  addClient(id: string, writer: WritableStreamDefaultWriter, tenant: string, filters?: any) {
    this.clients.add({ id, writer, tenant, filters });
    console.log(`${GLYPHS.CONNECT} Client ${id} connected (${this.clients.size} total)`);
    
    // Send initial connection message
    this.sendToClient(id, { type: "connected", clientId: id, timestamp: new Date().toISOString() });
  }
  
  removeClient(id: string) {
    for (const client of this.clients) {
      if (client.id === id) {
        this.clients.delete(client);
        console.log(`${GLYPHS.DISCONNECT} Client ${id} disconnected (${this.clients.size} remaining)`);
        break;
      }
    }
  }
  
  async sendToClient(clientId: string, data: any) {
    for (const client of this.clients) {
      if (client.id === clientId) {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          await client.writer.write(new TextEncoder().encode(message));
        } catch (error) {
          console.error(`Error sending to ${clientId}:`, error);
          this.removeClient(clientId);
        }
        break;
      }
    }
  }
  
  async broadcast(alert: ViolationAlert) {
    this.violationQueue.push(alert);
    
    const message = `data: ${JSON.stringify({ type: "violation", ...alert })}\n\n`;
    const encoder = new TextEncoder();
    
    for (const client of this.clients) {
      // Filter by tenant
      if (client.tenant !== "*" && client.tenant !== alert.tenant) continue;
      
      // Filter by severity
      if (client.filters?.severity && client.filters.severity !== alert.severity) continue;
      
      // Filter by min width
      if (client.filters?.minWidth && alert.width < client.filters.minWidth) continue;
      
      try {
        await client.writer.write(encoder.encode(message));
      } catch (error) {
        console.error(`Error broadcasting to ${client.id}:`, error);
        this.removeClient(client.id);
      }
    }
    
    // Also simulate Redis broadcast for multi-region
    await this.redisBroadcast(alert);
  }
  
  private async redisBroadcast(alert: ViolationAlert) {
    // In production, this would use Redis pub/sub
    // await redis.publish("tier1380:violations:live", JSON.stringify(alert));
    console.log(`${GLYPHS.BROADCAST} Redis broadcast: tier1380:violations:live (${alert.tenant})`);
  }
  
  async pollForNewViolations() {
    if (!this.db) return;
    
    const now = Date.now();
    const newViolations = this.db.query(`
      SELECT id, file, line, width, preview, datetime(timestamp, 'unixepoch') as time
      FROM violations
      WHERE timestamp > ?
      ORDER BY timestamp DESC
      LIMIT 10
    `).all(Math.floor(this.lastCheck / 1000)) as any[];
    
    this.lastCheck = now;
    
    for (const v of newViolations) {
      const alert: ViolationAlert = {
        id: v.id?.toString() || Bun.randomUUIDv7(),
        timestamp: v.time,
        tenant: v.file?.split("/")[1] || "default",
        file: v.file,
        line: v.line,
        width: v.width,
        preview: v.preview?.slice(0, 50),
        severity: v.width > 120 ? "critical" : "warning",
      };
      
      await this.broadcast(alert);
    }
  }
  
  async sendHeartbeat() {
    const encoder = new TextEncoder();
    for (const client of this.clients) {
      try {
        await client.writer.write(encoder.encode(`:heartbeat\n\n`));
      } catch {
        this.removeClient(client.id);
      }
    }
  }
  
  getStats() {
    return {
      connectedClients: this.clients.size,
      queueSize: this.violationQueue.length,
      lastPoll: new Date(this.lastCheck).toISOString(),
    };
  }
}

const alertManager = new AlertStreamManager();

// ─── SSE Server ───────────────────────────────────
async function startSSEServer(port: number = 3333) {
  console.log(`${GLYPHS.STREAM} Starting SSE Alert Server on port ${port}\n`);
  console.log("-".repeat(70));
  
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",
    
    async fetch(req) {
      const url = new URL(req.url);
      const pathname = url.pathname;
      
      // CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token, X-Session-ID",
      };
      
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
      
      // Health check
      if (pathname === "/health") {
        return new Response(JSON.stringify({ 
          status: "ok", 
          ...alertManager.getStats(),
          timestamp: new Date().toISOString()
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Get CSRF token
      if (pathname === "/csrf-token") {
        const sessionId = req.headers.get("X-Session-ID") || Bun.randomUUIDv7();
        const token = generateCSRFToken(sessionId);
        return new Response(JSON.stringify({ token, sessionId }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // SSE Stream endpoint
      if (pathname === "/mcp/alerts/stream") {
        const tenant = url.searchParams.get("tenant") || "*";
        const minWidth = parseInt(url.searchParams.get("minWidth") || "0");
        const severity = url.searchParams.get("severity") || undefined;
        
        // CSRF verification
        const csrfToken = req.headers.get("X-CSRF-Token");
        const sessionId = req.headers.get("X-Session-ID");
        
        if (!csrfToken || !sessionId || !verifyCSRFToken(sessionId, csrfToken)) {
          return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        
        const clientId = Bun.randomUUIDv7();
        
        const stream = new ReadableStream({
          start(controller) {
            const writer = new WritableStream({
              write(chunk) {
                controller.enqueue(chunk);
              },
            }).getWriter();
            
            alertManager.addClient(clientId, writer, tenant, { minWidth, severity });
            
            // Send initial stats
            alertManager.sendToClient(clientId, {
              type: "stats",
              ...alertManager.getStats(),
            });
          },
          cancel() {
            alertManager.removeClient(clientId);
          },
        });
        
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
          },
        });
      }
      
      // Trigger test alert (for demo)
      if (pathname === "/mcp/alerts/test" && req.method === "POST") {
        const body = await req.json();
        const alert: ViolationAlert = {
          id: Bun.randomUUIDv7(),
          timestamp: new Date().toISOString(),
          tenant: body.tenant || "test",
          file: body.file || "test.ts",
          line: body.line || 1,
          width: body.width || 95,
          preview: body.preview || "Test violation...",
          severity: body.width > 120 ? "critical" : "warning",
        };
        
        await alertManager.broadcast(alert);
        
        return new Response(JSON.stringify({ sent: true, alert }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Dashboard HTML
      if (pathname === "/" || pathname === "/dashboard") {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Tier-1380 Live Alerts</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #0f0; padding: 20px; }
    .alert { border: 1px solid #0f0; padding: 10px; margin: 10px 0; }
    .critical { border-color: #f00; color: #f00; }
    .warning { border-color: #ff0; color: #ff0; }
    #stats { position: fixed; top: 10px; right: 10px; background: #333; padding: 10px; }
  </style>
</head>
<body>
  <h1>${GLYPHS.STREAM} Tier-1380 Live Violation Alerts</h1>
  <div id="stats">Connecting...</div>
  <div id="alerts"></div>
  
  <script>
    // Get CSRF token first
    fetch('/csrf-token', { headers: { 'X-Session-ID': localStorage.getItem('sessionId') || '' }})
      .then(r => r.json())
      .then(({ token, sessionId }) => {
        localStorage.setItem('sessionId', sessionId);
        
        // Connect to SSE
        const es = new EventSource('/mcp/alerts/stream?tenant=*', {
          headers: { 'X-CSRF-Token': token, 'X-Session-ID': sessionId }
        });
        
        es.onopen = () => {
          document.getElementById('stats').textContent = 'Connected';
        };
        
        es.onmessage = (e) => {
          const data = JSON.parse(e.data);
          
          if (data.type === 'stats') {
            document.getElementById('stats').textContent = 
              \`Clients: \${data.connectedClients} | Queue: \${data.queueSize}\`;
          } else if (data.type === 'violation') {
            const div = document.createElement('div');
            div.className = \`alert \${data.severity}\`;
            div.innerHTML = \`
              <strong>\${data.severity.toUpperCase()}</strong> 
              \${data.tenant} | \${data.file}:\${data.line} | 
              Width: \${data.width} cols
              <pre>\${data.preview}</pre>
            \`;
            document.getElementById('alerts').prepend(div);
          }
        };
        
        es.onerror = () => {
          document.getElementById('stats').textContent = 'Disconnected';
        };
      });
  </script>
</body>
</html>`;
        
        return new Response(html, {
          headers: { "Content-Type": "text/html", ...corsHeaders },
        });
      }
      
      return new Response("Not found", { status: 404 });
    },
  });
  
  console.log(`  ${GLYPHS.CONNECT} SSE Server: http://127.0.0.1:${port}`);
  console.log(`  ${GLYPHS.CONNECT} Dashboard: http://127.0.0.1:${port}/dashboard`);
  console.log(`  ${GLYPHS.CONNECT} Health: http://127.0.0.1:${port}/health`);
  console.log(`  ${GLYPHS.CONNECT} Stream: http://127.0.0.1:${port}/mcp/alerts/stream`);
  console.log(`\n  Endpoints:`);
  console.log(`    GET /csrf-token              - Get CSRF token`);
  console.log(`    GET /mcp/alerts/stream       - SSE stream (requires CSRF)`);
  console.log(`    POST /mcp/alerts/test        - Trigger test alert`);
  console.log(`    GET /dashboard               - Live alert dashboard`);
  console.log(`\n  Press Ctrl+C to stop`);
  
  // Start polling for new violations
  setInterval(() => alertManager.pollForNewViolations(), 5000);
  
  // Send heartbeats every 30 seconds
  setInterval(() => alertManager.sendHeartbeat(), 30000);
  
  process.on("SIGINT", () => {
    console.log(`\n${GLYPHS.DISCONNECT} Stopping SSE server...`);
    server.stop();
    process.exit(0);
  });
  
  await new Promise(() => {});
}

// ─── Main CLI ─────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "start";
  
  switch (cmd) {
    case "start":
      const port = parseInt(args[1]) || 3333;
      await startSSEServer(port);
      break;
      
    case "test":
      // Send test alert via HTTP
      const testAlert = {
        tenant: args[1] || "test",
        file: args[2] || "test.ts",
        line: parseInt(args[3]) || 1,
        width: parseInt(args[4]) || 95,
        preview: "Test violation preview...",
      };
      
      const res = await fetch("http://127.0.0.1:3333/mcp/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testAlert),
      });
      
      console.log(await res.json());
      break;
      
    case "help":
    default:
      console.log(`
${GLYPHS.STREAM} Tier-1380 SSE Live Alert Server

Usage:
  bun run tier1380:sse:start [port]     Start SSE server
  bun run tier1380:sse:test [tenant] [file] [line] [width]  Send test alert

Features:
  - Real-time width violation streaming
  - CSRF-protected EventSource connections
  - Multi-tenant filtering
  - Severity filtering (warning/critical)
  - Min-width threshold filtering
  - Live dashboard at /dashboard
  - Redis-compatible broadcast API
`);
  }
}

if (import.meta.main) {
  main();
}

export { AlertStreamManager, startSSEServer };
