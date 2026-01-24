/**
 * Scanner Assets Module
 *
 * Embedded resources for compiled executables.
 * Uses `with { type: "file" }` for reference-based bundling
 * (keeps binary size down vs base64 inlining).
 *
 * Note: In development mode, we use direct file paths.
 * In compiled mode, the `with { type: "file" }` imports resolve to temp paths.
 */

// Asset paths - use import.meta for development, compile-time embedding for production
const ASSETS_DIR = new URL(".", import.meta.url).pathname;

const defaultConfigPath = `${ASSETS_DIR}assets/default-config.json`;
const baseRulesPath = `${ASSETS_DIR}rules/base.json`;
const reportTemplatePath = `${ASSETS_DIR}templates/report.html`;

// ============================================================================
// Types
// ============================================================================

export interface ScannerConfig {
  name: string;
  version: string;
  thresholds: {
    maxIssues: number;
    minScore: number;
    errorExitCode: number;
  };
  ignore: string[];
  rules: {
    deps: boolean;
    perf: boolean;
    compat: boolean;
    security: boolean;
  };
  output: {
    format: "table" | "json" | "html";
    colors: boolean;
    verbose: boolean;
  };
  profile: {
    enabled: boolean;
    outputDir: string;
  };
}

export interface RuleDefinition {
  id: string;
  category: string;
  scope: string;
  pattern: string;
  message: string;
  fix: string;
  severity: "error" | "warning" | "info";
  enabled: boolean;
}

export interface RuleSet {
  version: string;
  rules: RuleDefinition[];
}

// ============================================================================
// Asset Loaders
// ============================================================================

/**
 * Load embedded default configuration.
 * Falls back to empty config on error (for development).
 */
export async function loadDefaultConfig(): Promise<ScannerConfig> {
  try {
    const content = await Bun.file(defaultConfigPath).json();
    return content as ScannerConfig;
  } catch {
    console.warn("[Assets] Default config not found, using fallback");
    return {
      name: "Bun Enterprise Scanner",
      version: "3.0.0",
      thresholds: { maxIssues: 10, minScore: 80, errorExitCode: 1 },
      ignore: ["node_modules", "dist"],
      rules: { deps: true, perf: true, compat: true, security: true },
      output: { format: "table", colors: true, verbose: false },
      profile: { enabled: false, outputDir: "./traces" },
    };
  }
}

/**
 * Load embedded base rules.
 */
export async function loadBaseRules(): Promise<RuleSet> {
  try {
    const content = await Bun.file(baseRulesPath).json();
    return content as RuleSet;
  } catch {
    console.warn("[Assets] Base rules not found, using empty ruleset");
    return { version: "1.0.0", rules: [] };
  }
}

/**
 * Load HTML report template.
 */
export async function loadReportTemplate(): Promise<string> {
  try {
    return await Bun.file(reportTemplatePath).text();
  } catch {
    console.warn("[Assets] Report template not found");
    return "<html><body><h1>Scan Report</h1><pre>{{RESULTS_JSON}}</pre></body></html>";
  }
}

/**
 * Load configuration with local overrides.
 * Priority: local scanner.config.json > embedded defaults
 */
export async function loadConfig(localConfigPath = "./scanner.config.json"): Promise<ScannerConfig> {
  const defaults = await loadDefaultConfig();

  try {
    const local = await Bun.file(localConfigPath).json();
    return { ...defaults, ...local };
  } catch {
    return defaults;
  }
}

// ============================================================================
// Unified Assets Export
// ============================================================================

export const Assets = {
  paths: {
    config: defaultConfigPath,
    rules: baseRulesPath,
    template: reportTemplatePath,
  },
  load: {
    config: loadConfig,
    defaultConfig: loadDefaultConfig,
    rules: loadBaseRules,
    template: loadReportTemplate,
  },
};

export default Assets;
