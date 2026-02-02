// lib/http.ts - Fetch wrappers with timeout/retry and server helpers
// ═══════════════════════════════════════════════════════════════════════════════
// Safe fetch with timeout, exponential backoff retry, and response builders.
// All fetch wrappers return null on failure instead of throwing.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-055: Safe Fetch Wrappers
// ─────────────────────────────────────────────────────────────────────────────
export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T | null> => {
  const res = await fetch(url, init).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json().catch(() => null) as Promise<T | null>;
};

export const fetchText = async (url: string, init?: RequestInit): Promise<string | null> => {
  const res = await fetch(url, init).catch(() => null);
  if (!res || !res.ok) return null;
  return res.text().catch(() => null);
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-056: Timeout Wrapper
// ─────────────────────────────────────────────────────────────────────────────
export const fetchWithTimeout = async (
  url: string,
  timeoutMs = 5000,
  init?: RequestInit
): Promise<Response | null> => {
  const signal = init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)])
    : AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...init, signal }).catch(() => null);
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-057: Retry with Exponential Backoff
// ─────────────────────────────────────────────────────────────────────────────
export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const fetchWithRetry = async (
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response | null> => {
  const { retries = 3, delayMs = 500, maxDelayMs = 5000, onRetry } = options ?? {};

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init).catch(() => null);

    if (res) {
      // Don't retry client errors (4xx)
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
    }

    if (attempt < retries) {
      onRetry?.(attempt + 1, res ? new Error(`HTTP ${res.status}`) : new Error("fetch failed"));
      const delay = Math.min(delayMs * Math.pow(2, attempt), maxDelayMs);
      await Bun.sleep(delay);
    }
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-058: Response Builders
// ─────────────────────────────────────────────────────────────────────────────
export const jsonResponse = <T>(data: T, status = 200): Response =>
  Response.json(data, { status });

export const errorResponse = (message: string, status = 500): Response =>
  Response.json({ error: message }, { status });

export const textResponse = (body: string, status = 200): Response =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

export const cachedJsonResponse = <T>(data: T, status = 200): (() => Response) => {
  const body = JSON.stringify(data);
  const headers = { "Content-Type": "application/json" };
  return () => new Response(body, { status, headers });
};

export const streamResponse = (stream: ReadableStream, status = 200): Response =>
  new Response(stream, {
    status,
    headers: { "Content-Type": "application/octet-stream" },
  });

// ─────────────────────────────────────────────────────────────────────────────
// BN-059: Serve Helper
// ─────────────────────────────────────────────────────────────────────────────
export interface ServeConfig {
  port?: number;
  hostname?: string;
  fetch: (req: Request, server: any) => Response | Promise<Response>;
}

export const serve = (config: ServeConfig) =>
  Bun.serve({
    port: config.port ?? 0,
    hostname: config.hostname ?? "127.0.0.1",
    fetch: config.fetch,
  });
