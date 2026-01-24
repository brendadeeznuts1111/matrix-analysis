/**
 * Scanner Configuration Management
 * Supports .scannerrc and environment variable configuration
 */

import { file } from "bun";
import * as path from "path";
import * as os from "os";
import type { ScannerConfig, ScanMode } from "./enterprise-scanner.ts";

export interface ScannerRC {
  mode?: ScanMode;
  effectiveDate?: string;
  rulesUrl?: string;
  baselinePath?: string;
  metricsPort?: number;
  sandbox?: boolean;
  suggestFixes?: boolean;
}

/**
 * Load configuration from .scannerrc or environment
 */
export async function loadScannerConfig(): Promise<ScannerConfig> {
  // Try to load .scannerrc
  const rcPath = path.join(process.cwd(), ".scannerrc");
  let rcConfig: ScannerRC = {};

  try {
    rcConfig = await file(rcPath).json();
  } catch {
    // .scannerrc doesn't exist, use defaults
  }

  // Merge with environment variables (env takes precedence)
  const config: ScannerConfig = {
    mode: (process.env.SCANNER_MODE as ScanMode) || rcConfig.mode || "audit",
    format: (process.env.SCANNER_FORMAT as any) || "sarif",
    rulesUrl: process.env.SCANNER_RULES_URL || rcConfig.rulesUrl,
    cacheDir: process.env.SCANNER_CACHE_DIR || ".bunpm/scan-cache",
    metricsPort: process.env.SCANNER_METRICS_PORT 
      ? parseInt(process.env.SCANNER_METRICS_PORT) 
      : rcConfig.metricsPort,
    sandbox: process.env.SCANNER_SANDBOX === "true" || rcConfig.sandbox || false,
    suggestFixes: process.env.SCANNER_SUGGEST_FIXES === "true" || rcConfig.suggestFixes || false,
    baselinePath: process.env.SCANNER_BASELINE || rcConfig.baselinePath,
    traceId: process.env.TRACE_ID
  };

  return config;
}

/**
 * Create default .scannerrc file
 */
export async function createDefaultScannerRC(outputPath: string = ".scannerrc"): Promise<void> {
  const defaultRC: ScannerRC = {
    mode: "audit",
    effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
    rulesUrl: process.env.SCANNER_RULES_URL,
    baselinePath: ".scanner-baseline.json"
  };

  await Bun.write(outputPath, JSON.stringify(defaultRC, null, 2));
  console.log(`✅ Created ${outputPath}`);
}
