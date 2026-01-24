/**
 * Configuration Manager for Enterprise Scanner
 * Loads and manages scanner configuration from .scannerrc and environment
 */

import { file } from "bun";
import * as path from "path";
import * as os from "os";
import type { ScannerConfig } from "./enterprise-scanner.ts";

export interface ScannerRCConfig extends ScannerConfig {
  metafileOutput?: string;
  bundleBudgets?: {
    maxSize?: number;
    maxInitialSize?: number;
    maxAsyncSize?: number;
    warnings?: {
      size?: number;
      initialSize?: number;
      asyncSize?: number;
    };
  };
  s3?: {
    bucket: string;
    region?: string;
    prefix?: string;
    compress?: boolean;
  };
}

export class ConfigManager {
  /**
   * Load configuration from .scannerrc and environment
   */
  async load(configPath?: string): Promise<ScannerRCConfig> {
    const rcPath = configPath || path.join(process.cwd(), ".scannerrc");
    
    let config: Partial<ScannerRCConfig> = {};

    // Load from .scannerrc if exists
    try {
      if (await file(rcPath).exists()) {
        config = await file(rcPath).json();
      }
    } catch {
      // Use defaults if file doesn't exist or is invalid
    }

    // Merge with environment variables (env takes precedence)
    const finalConfig: ScannerRCConfig = {
      mode: (process.env.SCANNER_MODE as any) || config.mode || "audit",
      format: (process.env.SCANNER_FORMAT as any) || config.format || "sarif",
      rulesUrl: process.env.SCANNER_RULES_URL || config.rulesUrl,
      rulesDbPath: process.env.SCANNER_RULES_DB_PATH || config.rulesDbPath,
      cacheDir: process.env.SCANNER_CACHE_DIR || config.cacheDir || ".bunpm/scan-cache",
      metricsPort: process.env.SCANNER_METRICS_PORT 
        ? parseInt(process.env.SCANNER_METRICS_PORT) 
        : config.metricsPort,
      sandbox: process.env.SCANNER_SANDBOX === "true" || config.sandbox || false,
      suggestFixes: process.env.SCANNER_SUGGEST_FIXES === "true" || config.suggestFixes || false,
      baselinePath: process.env.SCANNER_BASELINE || config.baselinePath,
      traceId: process.env.TRACE_ID || config.traceId,
      metafileOutput: process.env.SCANNER_METAFILE_OUTPUT || config.metafileOutput,
      bundleBudgets: config.bundleBudgets || {
        maxSize: 5 * 1024 * 1024, // 5MB default
        warnings: {
          size: 3 * 1024 * 1024 // 3MB warning threshold
        }
      },
      s3: config.s3 || {
        bucket: process.env.S3_BUCKET || "security-reports",
        region: process.env.S3_REGION || "us-east-1",
        prefix: process.env.S3_PREFIX || "scans",
        compress: process.env.S3_COMPRESS !== "false"
      }
    };

    return finalConfig;
  }

  /**
   * Save configuration to .scannerrc
   */
  async save(config: Partial<ScannerRCConfig>, configPath?: string): Promise<void> {
    const rcPath = configPath || path.join(process.cwd(), ".scannerrc");
    await Bun.write(rcPath, JSON.stringify(config, null, 2));
  }
}
