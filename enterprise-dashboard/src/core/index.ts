/**
 * Enterprise Dashboard Core
 *
 * Bun 1.3.6+ Native APIs with Google V8 Observability Standards
 */

// Feature Flags (Compile-time dead-code elimination)
export {
  IS_FREE,
  IS_PRO,
  IS_ENTERPRISE,
  DEBUG_LOGGING,
  DEBUG_TERMINAL,
  DEBUG_PERF,
  AB_TEST_NEW_UI,
  AB_TEST_PTY_POOL,
  loadPremiumFeatures,
  debugLog,
  debugPerf,
} from "./features";

// BunToolkit (CDP Tracing, PTY, Peek, Tables, State Diffing)
export { BunToolkit, updateDashboard } from "./BunToolkit";

// Re-export types
export type { PTYOptions, PTYSession } from "../shell/pty";
