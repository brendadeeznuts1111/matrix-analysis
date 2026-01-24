#!/usr/bin/env bun
/**
 * Feedback Server for Bun API Slides
 * Collects slide feedback via Bun.serve() and stores in NDJSON format
 *
 * Usage: bun src/feedback-server.ts
 * Endpoint: POST http://localhost:3001/feedback
 */

interface Feedback {
  slide: number;
  type: "suggestion" | "bug" | "question" | "praise";
  comment: string;
  timestamp: string;
  userAgent?: string;
}

const FEEDBACK_FILE = "./feedback.ndjson";
const PORT = 3001;

// Allowed origins for CORS (restrict from wildcard)
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

// Simple API key auth for read endpoints (set via env)
const API_KEY = process.env.FEEDBACK_API_KEY || null;

function isAuthorized(req: Request): boolean {
  if (!API_KEY) return true; // No key configured = dev mode
  const authHeader = req.headers.get("Authorization");
  return authHeader === `Bearer ${API_KEY}`;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";

    // CORS headers - restrict to known origins
    const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /feedback - Submit feedback
    if (req.method === "POST" && url.pathname === "/feedback") {
      try {
        const body = await req.json() as Feedback;

        // Validate
        if (!body.comment || !body.type) {
          return Response.json(
            { error: "Missing required fields" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Enrich with metadata
        const entry = {
          ...body,
          userAgent: req.headers.get("user-agent") || "unknown",
          receivedAt: new Date().toISOString(),
        };

        // Append to NDJSON file
        const file = Bun.file(FEEDBACK_FILE);
        const existing = await file.exists() ? await file.text() : "";
        await Bun.write(FEEDBACK_FILE, existing + JSON.stringify(entry) + "\n");

        console.log(`[Feedback] Slide ${body.slide} - ${body.type}: ${body.comment.slice(0, 50)}...`);

        return Response.json(
          { success: true, message: "Feedback recorded" },
          { headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { error: "Invalid JSON" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // GET /feedback - View all feedback (for review) - REQUIRES AUTH
    if (req.method === "GET" && url.pathname === "/feedback") {
      if (!isAuthorized(req)) {
        return Response.json(
          { error: "Unauthorized - set Authorization: Bearer <FEEDBACK_API_KEY>" },
          { status: 401, headers: corsHeaders }
        );
      }
      try {
        const file = Bun.file(FEEDBACK_FILE);
        if (!await file.exists()) {
          return Response.json([], { headers: corsHeaders });
        }

        const content = await file.text();
        const entries = content
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line));

        return Response.json(entries, { headers: corsHeaders });
      } catch {
        return Response.json([], { headers: corsHeaders });
      }
    }

    // GET /feedback/stats - Feedback statistics - REQUIRES AUTH
    if (req.method === "GET" && url.pathname === "/feedback/stats") {
      if (!isAuthorized(req)) {
        return Response.json(
          { error: "Unauthorized - set Authorization: Bearer <FEEDBACK_API_KEY>" },
          { status: 401, headers: corsHeaders }
        );
      }
      try {
        const file = Bun.file(FEEDBACK_FILE);
        if (!await file.exists()) {
          return Response.json({ total: 0, byType: {}, bySlide: {} }, { headers: corsHeaders });
        }

        const content = await file.text();
        const entries = content
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line)) as Feedback[];

        const stats = {
          total: entries.length,
          byType: {} as Record<string, number>,
          bySlide: {} as Record<number, number>,
        };

        for (const entry of entries) {
          stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
          stats.bySlide[entry.slide] = (stats.bySlide[entry.slide] || 0) + 1;
        }

        return Response.json(stats, { headers: corsHeaders });
      } catch {
        return Response.json({ total: 0, byType: {}, bySlide: {} }, { headers: corsHeaders });
      }
    }

    // GET / - Health check
    if (url.pathname === "/") {
      return Response.json({
        status: "ok",
        service: "Bun API Slides Feedback Server",
        endpoints: [
          "POST /feedback - Submit feedback",
          "GET /feedback - View all feedback",
          "GET /feedback/stats - Feedback statistics",
        ],
      }, { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`
📬 Feedback Server running on http://localhost:${PORT}

Endpoints:
  POST /feedback       Submit slide feedback
  GET  /feedback       View all feedback
  GET  /feedback/stats Feedback statistics

Feedback stored in: ${FEEDBACK_FILE}
`);
