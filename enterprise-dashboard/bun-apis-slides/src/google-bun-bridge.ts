/**
 * Google + Bun Bridge
 *
 * Aligns Bun's high-performance APIs with Google's official terminology:
 * - CDP (Chrome DevTools Protocol) for profiling
 * - TabId/GroupId for UI management
 * - UUID v7 for time-ordered identifiers
 * - Material 3 (M3) for design tokens
 */

// ============================================================================
// Material 3 Color System
// ============================================================================

export const M3_COLORS = {
  // Primary
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF",
  onPrimaryContainer: "#21005D",

  // Secondary
  secondary: "#625B71",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E8DEF8",
  onSecondaryContainer: "#1D192B",

  // Tertiary
  tertiary: "#7D5260",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFD8E4",
  onTertiaryContainer: "#31111D",

  // Error
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",

  // Success (Extended)
  success: "#006D3A",
  onSuccess: "#FFFFFF",
  successContainer: "#9DF6B5",
  onSuccessContainer: "#00210D",

  // Surface
  surface: "#FEF7FF",
  onSurface: "#1D1B20",
  surfaceVariant: "#E7E0EC",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",

  // Dark Theme
  dark: {
    surface: "#141218",
    onSurface: "#E6E0E9",
    surfaceContainer: "#211F26",
    primary: "#D0BCFF",
    onPrimary: "#381E72",
    error: "#FFB4AB",
    outline: "#938F99",
  },
} as const;

// ============================================================================
// CDP Profiling (Chrome DevTools Protocol)
// ============================================================================

export interface CDPTrace {
  name: string;
  startTime: number;
  save: () => Promise<number>;
  stop: () => CDPTraceResult;
}

export interface CDPTraceResult {
  name: string;
  duration: number;
  filePath: string;
}

/**
 * Create a CDP-compliant CPU Profile trace
 * Output format: Chrome DevTools Trace Event Format (.cpuprofile)
 */
export function createCDPTrace(name: string): CDPTrace {
  const startTime = performance.now();
  const fileName = `${name}-${Date.now()}.cpuprofile`;
  const filePath = `./traces/${fileName}`;

  return {
    name,
    startTime,
    stop: () => ({
      name,
      duration: performance.now() - startTime,
      filePath,
    }),
    save: async () => {
      const trace = {
        name,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString(),
      };
      return Bun.write(filePath, JSON.stringify(trace, null, 2));
    },
  };
}

// ============================================================================
// Tab Management (Chromium Tab Model)
// ============================================================================

export interface TabMetadata {
  tabId: string; // Hex UUID v7 - CDP standard
  sessionId: string; // Base64URL - compact for headers
  groupId?: string;
  windowId?: string;
  createdAt: number;
}

export interface TabGroup {
  groupId: string;
  title: string;
  color: keyof typeof TAB_GROUP_COLORS;
  tabs: string[]; // tabIds
  collapsed: boolean;
}

export const TAB_GROUP_COLORS = {
  grey: M3_COLORS.outline,
  blue: "#1A73E8",
  red: M3_COLORS.error,
  yellow: "#F9AB00",
  green: M3_COLORS.success,
  pink: "#E91E63",
  purple: M3_COLORS.primary,
  cyan: "#00ACC1",
  orange: "#FF5722",
} as const;

/**
 * Create tab metadata with Google-standard identifiers
 * - tabId: Hex UUID v7 (time-ordered, prevents DB hotspotting)
 * - sessionId: Base64URL (compact for URL/headers)
 */
export function createTabMetadata(groupId?: string, windowId?: string): TabMetadata {
  return {
    tabId: Bun.randomUUIDv7("hex"),
    sessionId: Bun.randomUUIDv7("base64url"),
    groupId,
    windowId,
    createdAt: Date.now(),
  };
}

/**
 * Create a tab group with M3-aligned colors
 */
export function createTabGroup(
  title: string,
  color: keyof typeof TAB_GROUP_COLORS = "blue"
): TabGroup {
  return {
    groupId: Bun.randomUUIDv7("hex"),
    title,
    color,
    tabs: [],
    collapsed: false,
  };
}

// ============================================================================
// V8 Structural Equality (Deep Comparison)
// ============================================================================

export interface EqualityOptions {
  strict?: boolean; // Type-aware comparison
  ignoreUndefined?: boolean;
}

/**
 * V8-style structural equality check
 * Google term: Deep Equality / Structural Equality
 */
export function isStructurallyEqual(a: unknown, b: unknown, options: EqualityOptions = {}): boolean {
  const { strict = true, ignoreUndefined = false } = options;

  if (ignoreUndefined) {
    a = filterUndefined(a);
    b = filterUndefined(b);
  }

  return Bun.deepEquals(a, b, strict);
}

function filterUndefined(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.filter((item) => item !== undefined).map(filterUndefined);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = filterUndefined(value);
    }
  }
  return result;
}

// ============================================================================
// Identity Generation (UUID v7 - Time-Ordered)
// ============================================================================

export type UUIDFormat = "hex" | "base64url";

export interface Identity {
  id: string;
  format: UUIDFormat;
  timestamp: number;
}

/**
 * Generate time-ordered UUID v7
 * Google-recommended for high-concurrency systems
 * Prevents database hotspotting (unlike UUID v4)
 */
export function createIdentity(format: UUIDFormat = "hex"): Identity {
  return {
    id: Bun.randomUUIDv7(format),
    format,
    timestamp: Date.now(),
  };
}

/**
 * Generate a batch of time-ordered IDs
 * Useful for bulk inserts to BigQuery/Spanner
 */
export function createIdentityBatch(count: number, format: UUIDFormat = "hex"): string[] {
  return Array.from({ length: count }, () => Bun.randomUUIDv7(format));
}

// ============================================================================
// Unified Bridge Export
// ============================================================================

export const GoogleBunBridge = {
  // CDP Profiling
  createCDPTrace,

  // Tab Management
  createTabMetadata,
  createTabGroup,
  TAB_GROUP_COLORS,

  // V8 Equality
  isStructurallyEqual,

  // Identity
  createIdentity,
  createIdentityBatch,

  // M3 Colors
  M3_COLORS,
} as const;

export default GoogleBunBridge;
