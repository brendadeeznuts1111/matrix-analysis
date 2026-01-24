/**
 * Centralized Configuration Constants
 *
 * All hardcoded magic numbers and timeouts should be defined here.
 * Environment variables can override defaults where appropriate.
 */

// ============================================================================
// Timing Constants
// ============================================================================

/** Default fetch timeout in milliseconds */
export const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS ?? "10000", 10);

/** PTY session cleanup timeout in milliseconds */
export const PTY_CLEANUP_TIMEOUT_MS = parseInt(process.env.PTY_CLEANUP_TIMEOUT_MS ?? "5000", 10);

/** Metrics flush interval in milliseconds */
export const METRICS_FLUSH_INTERVAL_MS = parseInt(process.env.METRICS_FLUSH_INTERVAL_MS ?? "5000", 10);

/** Metrics endpoint timeout in milliseconds */
export const METRICS_ENDPOINT_TIMEOUT_MS = parseInt(process.env.METRICS_ENDPOINT_TIMEOUT_MS ?? "5000", 10);

// ============================================================================
// Cache Constants
// ============================================================================

/** Default cache TTL in milliseconds (1 hour) */
export const DEFAULT_CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS ?? "3600000", 10);

/** Maximum LRU cache size for registry client */
export const REGISTRY_CACHE_MAX_SIZE = parseInt(process.env.REGISTRY_CACHE_MAX_SIZE ?? "1000", 10);

/** Maximum LRU cache size for bookmark registry */
export const BOOKMARK_CACHE_MAX_SIZE = parseInt(process.env.BOOKMARK_CACHE_MAX_SIZE ?? "500", 10);

// ============================================================================
// Buffer & Batch Constants
// ============================================================================

/** Maximum metrics buffer size before flush */
export const METRICS_MAX_BUFFER_SIZE = parseInt(process.env.METRICS_MAX_BUFFER_SIZE ?? "1000", 10);

/** Batch size for concurrent bookmark registry requests */
export const REGISTRY_BATCH_SIZE = parseInt(process.env.REGISTRY_BATCH_SIZE ?? "10", 10);

/** Maximum audit log entries before culling */
export const MAX_AUDIT_LOG_SIZE = parseInt(process.env.MAX_AUDIT_LOG_SIZE ?? "1000", 10);

/** Percentage of audit log to remove when cap exceeded (0-1) */
export const AUDIT_LOG_CULL_PERCENT = 0.1;

// ============================================================================
// Sampling & Monitoring Constants
// ============================================================================

/** Metrics sampling rate in milliseconds */
export const METRICS_SAMPLING_RATE_MS = parseInt(process.env.METRICS_SAMPLING_RATE_MS ?? "100", 10);

/** Health check cache duration in milliseconds */
export const HEALTH_CHECK_CACHE_MS = parseInt(process.env.HEALTH_CHECK_CACHE_MS ?? "10000", 10);

// ============================================================================
// UI Constants
// ============================================================================

/** Number of days for "recently added" bookmark threshold */
export const RECENTLY_ADDED_DAYS = parseInt(process.env.RECENTLY_ADDED_DAYS ?? "7", 10);

/** Default number of items to show in bookmark statistics */
export const STATS_DISPLAY_LIMIT = parseInt(process.env.STATS_DISPLAY_LIMIT ?? "10", 10);

/** Search input debounce delay in milliseconds */
export const SEARCH_DEBOUNCE_MS = parseInt(process.env.SEARCH_DEBOUNCE_MS ?? "300", 10);

/** Sync interval for bookmark manager in milliseconds (5 minutes) */
export const SYNC_INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS ?? "300000", 10);

/** Backup interval for bookmark manager in milliseconds (24 hours) */
export const BACKUP_INTERVAL_MS = parseInt(process.env.BACKUP_INTERVAL_MS ?? "86400000", 10);

// ============================================================================
// Terminal Constants
// ============================================================================

/** Maximum concurrent terminal sessions */
export const MAX_TERMINAL_SESSIONS = parseInt(process.env.MAX_TERMINAL_SESSIONS ?? "10", 10);

/** Terminal session timeout in milliseconds (1 hour) */
export const TERMINAL_SESSION_TIMEOUT_MS = parseInt(process.env.TERMINAL_SESSION_TIMEOUT_MS ?? "3600000", 10);

/** Number of recent audit log entries to return */
export const AUDIT_LOG_DISPLAY_LIMIT = parseInt(process.env.AUDIT_LOG_DISPLAY_LIMIT ?? "50", 10);

// ============================================================================
// Registry & API URLs
// ============================================================================

/** Default npm registry URL */
export const NPM_REGISTRY_URL = process.env.REGISTRY_URL ?? "https://registry.npmjs.org";

/** GitHub API base URL */
export const GITHUB_API_URL = process.env.GITHUB_API_URL ?? "https://api.github.com";

// ============================================================================
// Validation
// ============================================================================

// Ensure all parsed values are valid numbers
const configs = {
  FETCH_TIMEOUT_MS,
  PTY_CLEANUP_TIMEOUT_MS,
  METRICS_FLUSH_INTERVAL_MS,
  METRICS_ENDPOINT_TIMEOUT_MS,
  DEFAULT_CACHE_TTL_MS,
  REGISTRY_CACHE_MAX_SIZE,
  BOOKMARK_CACHE_MAX_SIZE,
  METRICS_MAX_BUFFER_SIZE,
  REGISTRY_BATCH_SIZE,
  MAX_AUDIT_LOG_SIZE,
  METRICS_SAMPLING_RATE_MS,
  HEALTH_CHECK_CACHE_MS,
  RECENTLY_ADDED_DAYS,
  STATS_DISPLAY_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SYNC_INTERVAL_MS,
  BACKUP_INTERVAL_MS,
  MAX_TERMINAL_SESSIONS,
  TERMINAL_SESSION_TIMEOUT_MS,
  AUDIT_LOG_DISPLAY_LIMIT,
};

for (const [key, value] of Object.entries(configs)) {
  if (Number.isNaN(value) || value < 0) {
    console.warn(`[Config] Invalid value for ${key}: ${value}, using default`);
  }
}
