/**
 * Compile-Time Feature Flags (Bun 1.3.6+)
 *
 * Dead-code elimination at build time - disabled features are physically
 * removed from the bundle, not just wrapped in if(false).
 *
 * Usage:
 *   bun build --feature=TIER_PRO --minify src/index.ts
 *   bun run --feature=DEBUG_LOGGING src/index.ts
 */

import { feature } from "bun:bundle";

// ============================================================================
// Tier Features (mutually exclusive in production)
// ============================================================================

export const IS_FREE = feature("TIER_FREE");
export const IS_PRO = feature("TIER_PRO");
export const IS_ENTERPRISE = feature("TIER_ENTERPRISE");

// ============================================================================
// Debug & Development Features
// ============================================================================

export const DEBUG_LOGGING = feature("DEBUG_LOGGING");
export const DEBUG_TERMINAL = feature("DEBUG_TERMINAL");
export const DEBUG_PERF = feature("DEBUG_PERF");

// ============================================================================
// Experimental Features (A/B Testing)
// ============================================================================

export const AB_TEST_NEW_UI = feature("AB_TEST_NEW_UI");
export const AB_TEST_PTY_POOL = feature("AB_TEST_PTY_POOL");

// ============================================================================
// Google Cloud Features
// ============================================================================

export const GOOGLE_API_ENABLED = feature("GOOGLE_API");
export const GOOGLE_CLOUD_TRACE = feature("GOOGLE_CLOUD_TRACE");

// ============================================================================
// Feature Guards
// ============================================================================

/**
 * Conditionally import premium modules only when TIER_PRO is enabled.
 * At build time, this entire block is removed for free-tier bundles.
 */
export async function loadPremiumFeatures() {
  if (IS_PRO || IS_ENTERPRISE) {
    const modules = await Promise.all([
      import("../dashboard/SecurityAudit"),
      import("../dashboard/KeychainViewer"),
    ]);
    return {
      SecurityAudit: modules[0],
      KeychainViewer: modules[1],
    };
  }
  return null;
}

/**
 * Conditionally enable debug logging.
 * Completely removed from production bundles.
 */
export function debugLog(category: string, ...args: unknown[]) {
  if (DEBUG_LOGGING) {
    const timestamp = new Date().toISOString().slice(11, 23);
    console.log(`[${timestamp}] [${category}]`, ...args);
  }
}

/**
 * Performance timing helper - removed from non-debug builds.
 */
export function debugPerf(label: string): () => void {
  if (DEBUG_PERF) {
    const start = performance.now();
    return () => {
      const duration = (performance.now() - start).toFixed(2);
      console.log(`[PERF] ${label}: ${duration}ms`);
    };
  }
  return () => {};
}

// ============================================================================
// Type Declarations for bun:bundle
// ============================================================================

declare module "bun:bundle" {
  interface Registry {
    features:
      | "TIER_FREE"
      | "TIER_PRO"
      | "TIER_ENTERPRISE"
      | "DEBUG_LOGGING"
      | "DEBUG_TERMINAL"
      | "DEBUG_PERF"
      | "AB_TEST_NEW_UI"
      | "AB_TEST_PTY_POOL"
      | "GOOGLE_API"
      | "GOOGLE_CLOUD_TRACE";
  }
}
