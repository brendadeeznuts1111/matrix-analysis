// ab-variant-types.ts — Shared A/B variant type definitions
// Deduplicates types used across persistence worker, omega-pools-zstd,
// and test files.

export interface ABSnapshotState {
  variant: string;
  poolSize: number;
  cookies: [string, string][];
  timestamp: number;
  sessionId?: string;
}

export interface ABVariantEvent {
  type: "variant" | "tenant-variant" | "persisted";
  variant: string;
  poolSize: number;
  sessionId?: string;
  tenantId?: string;
  snapshotSize?: number;
  ts: number;
}

export interface ABMetricsSnapshot {
  type: "metrics";
  ts: number;
  windowMs: number;
  impressions: number;
  variants: Record<string, number>;
  pools: Record<string, number>;
  tenants: Record<string, number>;
}

export interface ABWsMessage {
  type: string;
  protocol?: string;
  ts?: number;
  [key: string]: unknown;
}
