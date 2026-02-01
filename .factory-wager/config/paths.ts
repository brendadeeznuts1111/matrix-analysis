/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager Path Configuration Constants
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { execSync } from "child_process";
import path from "path";

/**
 * Git repository root directory
 */
export const GIT_ROOT: string = execSync("git rev-parse --show-toplevel", { 
  encoding: "utf8" 
}).trim();

/**
 * Current working directory
 */
export const CWD: string = process.cwd();

/**
 * Relative path from git root to current directory
 */
export const RELATIVE_PATH: string = path.relative(GIT_ROOT, CWD);

/**
 * FactoryWager specific paths
 */
export const PATHS = {
  // Repository structure
  GIT_ROOT,
  CWD,
  RELATIVE_PATH,
  
  // FactoryWager directories
  FACTORY_WAGER: path.join(GIT_ROOT, ".factory-wager"),
  FACTORY_WAGER_LEGACY: path.join(GIT_ROOT, "factory-wager"),
  
  // Current working directory paths
  CONFIG_DIR: path.join(CWD, "config"),
  REPORTS_DIR: path.join(CWD, "reports"),
  TYPES_DIR: path.join(CWD, "types"),
  AUDIT_DIR: path.join(CWD, "audit"),
  SCHEMA_DIR: path.join(CWD, "schema"),
  TASKS_DIR: path.join(CWD, "tasks"),
  
  // Configuration files
  REPORT_CONFIG: path.join(CWD, "config", "report-config.toml"),
  COLUMN_CONFIG: path.join(CWD, "config", "column-config.toml"),
  VISIBILITY_CONFIG: path.join(CWD, "config", "column-visibility.toml"),
  
  // Type definition files
  REPORT_TYPES: path.join(CWD, "types", "report-types.ts"),
  REPORT_CONFIG_TYPES: path.join(CWD, "types", "report-config-types.ts"),
  COLUMN_TYPES: path.join(CWD, "types", "column-types.ts"),
  
  // Report generators
  MARKDOWN_ENGINE: path.join(CWD, "reports", "markdown-engine.ts"),
  TOML_GENERATOR: path.join(CWD, "reports", "toml-powered-generator.ts"),
  
  // Output directories
  OUTPUT_DIR: path.join(CWD, "reports"),
  ARCHIVE_DIR: path.join(CWD, "archive"),
  
} as const;

/**
 * Path validation utilities
 */
export const PathUtils = {
  /**
   * Check if a path exists
   */
  exists: (filePath: string): boolean => {
    try {
      require("fs").existsSync(filePath);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Check if current directory is the FactoryWager directory
   */
  isFactoryWagerDir: (): boolean => {
    return CWD === PATHS.FACTORY_WAGER;
  },
  
  /**
   * Check if we're in a git repository
   */
  isGitRepo: (): boolean => {
    try {
      execSync("git rev-parse --git-dir", { encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Get relative path from git root
   */
  getRelativeFromGitRoot: (targetPath: string): string => {
    return path.relative(GIT_ROOT, targetPath);
  },
  
  /**
   * Resolve path relative to current directory
   */
  resolveFromCwd: (targetPath: string): string => {
    return path.resolve(CWD, targetPath);
  }
} as const;

/**
 * Environment variables export
 */
export const ENV_VARS = {
  GIT_ROOT,
  CWD,
  RELATIVE_PATH,
  FACTORY_WAGER: PATHS.FACTORY_WAGER,
  CONFIG_DIR: PATHS.CONFIG_DIR,
  REPORTS_DIR: PATHS.REPORTS_DIR,
  TYPES_DIR: PATHS.TYPES_DIR
} as const;

/**
 * Debug information
 */
export const DEBUG = {
  printPaths: (): void => {
    console.log("=== FactoryWager Path Configuration ===");
    console.log(`GIT_ROOT: ${GIT_ROOT}`);
    console.log(`CWD: ${CWD}`);
    console.log(`RELATIVE_PATH: ${RELATIVE_PATH}`);
    console.log("");
    console.log("=== Key Directories ===");
    console.log(`FACTORY_WAGER: ${PATHS.FACTORY_WAGER}`);
    console.log(`CONFIG_DIR: ${PATHS.CONFIG_DIR}`);
    console.log(`REPORTS_DIR: ${PATHS.REPORTS_DIR}`);
    console.log(`TYPES_DIR: ${PATHS.TYPES_DIR}`);
    console.log("");
    console.log("=== Status ===");
    console.log(`Is FactoryWager dir: ${PathUtils.isFactoryWagerDir()}`);
    console.log(`Is git repo: ${PathUtils.isGitRepo()}`);
  }
} as const;

// Export defaults
export default {
  GIT_ROOT,
  CWD,
  RELATIVE_PATH,
  PATHS,
  PathUtils,
  ENV_VARS,
  DEBUG
};
