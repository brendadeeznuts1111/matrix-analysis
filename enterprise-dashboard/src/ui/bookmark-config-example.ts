/**
 * Bookmark Manager Configuration Example
 * Demonstrates Bun's import attributes with { type: "file" }
 * 
 * This shows how to use Bun's import attributes to load configuration files
 * and merge with user-specific overrides.
 */

import configPath from "./default-bookmark-config.json" with { type: "file" };
import { file } from "bun";
import * as path from "path";
import * as os from "os";

/**
 * Load configuration with fallback chain:
 * 1. Default config (embedded in bundle)
 * 2. User config (~/.config/bookmark-manager/user-config.json)
 * 3. Environment variables (optional)
 */
async function loadBookmarkConfig() {
  // Load the embedded default configuration using import attributes
  const defaultConfig = await file(configPath).json();

  // Merge with user config if it exists
  const userConfigPath = path.join(
    os.homedir(), 
    ".config", 
    "bookmark-manager", 
    "user-config.json"
  );
  
  const userConfig = await file(userConfigPath)
    .json()
    .catch(() => ({}));

  // Merge: user config overrides defaults
  const config = { ...defaultConfig, ...userConfig };

  // Apply environment variable overrides
  if (process.env.BOOKMARK_WORKSPACE_PROFILE) {
    config.workspaceProfileName = process.env.BOOKMARK_WORKSPACE_PROFILE;
  }
  
  if (process.env.BOOKMARK_DNS_TTL) {
    config.dnsCacheTTL = parseInt(process.env.BOOKMARK_DNS_TTL, 10);
  }

  return config;
}

// Main execution
if (import.meta.main) {
  const config = await loadBookmarkConfig();
  
  console.log("📋 Bookmark Manager Configuration:");
  console.log("=".repeat(60));
  console.log(JSON.stringify(config, null, 2));
  console.log("\n💡 Configuration loaded from:");
  console.log(`   - Default: ${configPath}`);
  console.log(`   - User: ~/.config/bookmark-manager/user-config.json`);
  console.log(`   - Environment: BOOKMARK_* variables`);
}

export { loadBookmarkConfig };
export type { BookmarkManagerConfig } from "./chrome-bookmark-manager.ts";
