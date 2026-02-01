/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager Profile System - Terminal & Bun.terminal Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { PATHS, PathUtils } from "./paths.ts";
import { readFileSync, existsSync, writeFileSync } from "fs";

/**
 * Profile interface definition
 */
export interface Profile {
  name: string;
  description: string;
  environment: "development" | "staging" | "production" | "testing";
  terminal: {
    shell: "bash" | "zsh" | "fish" | "powershell" | "cmd";
    theme: "dark" | "light" | "auto";
    prompt: string;
    aliases: Record<string, string>;
    env_vars: Record<string, string>;
  };
  bun: {
    version: string;
    registry?: string;
    config: Record<string, any>;
    flags: string[];
  };
  factoryWager: {
    mode: "development" | "production" | "audit" | "demo";
    reporting: {
      format: "html" | "ansi" | "react" | "markdown";
      output_dir: string;
      auto_generate: boolean;
    };
    features: {
      markdown_engine: boolean;
      toml_config: boolean;
      audit_system: boolean;
      archive_system: boolean;
    };
  };
  paths: {
    config_dir: string;
    reports_dir: string;
    types_dir: string;
    audit_dir: string;
    output_dir: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Default profiles
 */
export const DEFAULT_PROFILES: Record<string, Profile> = {
  development: {
    name: "development",
    description: "Development environment with debugging enabled",
    environment: "development",
    terminal: {
      shell: "zsh",
      theme: "dark",
      prompt: "⚡ FactoryWager Dev \\w\\$ ",
      aliases: {
        "fw": "bun run .factory-wager/cli.ts",
        "fw-report": "bun run .factory-wager/reports/markdown-engine.ts",
        "fw-toml": "bun run .factory-wager/reports/toml-powered-generator.ts",
        "fw-audit": "bun run .factory-wager/audit-cli.sh",
        "fw-config": "cd .factory-wager && ls config/",
        "fw-types": "cd .factory-wager && ls types/",
        "fw-status": "git status && echo '📊 Repository Status'",
        "fw-clean": "git clean -fd && echo '🧹 Cleaned working tree'",
      },
      env_vars: {
        "NODE_ENV": "development",
        "DEBUG": "factory-wager:*",
        "FW_MODE": "development",
        "FW_LOG_LEVEL": "debug",
      },
    },
    bun: {
      version: ">=1.3.8",
      config: {
        "logLevel": "debug",
        "smol": true,
        "jsx": "automatic",
      },
      flags: ["--hot", "--watch"],
    },
    factoryWager: {
      mode: "development",
      reporting: {
        format: "html",
        output_dir: "./reports",
        auto_generate: true,
      },
      features: {
        markdown_engine: true,
        toml_config: true,
        audit_system: true,
        archive_system: true,
      },
    },
    paths: {
      config_dir: PATHS.CONFIG_DIR,
      reports_dir: PATHS.REPORTS_DIR,
      types_dir: PATHS.TYPES_DIR,
      audit_dir: PATHS.AUDIT_DIR,
      output_dir: PATHS.OUTPUT_DIR,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  production: {
    name: "production",
    description: "Production environment optimized for performance",
    environment: "production",
    terminal: {
      shell: "bash",
      theme: "dark",
      prompt: "🏭 FactoryWager Prod \\w\\$ ",
      aliases: {
        "fw": "bun run .factory-wager/cli.ts --prod",
        "fw-report": "bun run .factory-wager/reports/markdown-engine.ts --format=html --theme=dark",
        "fw-deploy": "bun run .factory-wager/archive-factory-wager.sh",
        "fw-status": "git status && echo '📊 Production Status'",
        "fw-health": "bun run .factory-wager/audit-cli.sh --health-check",
      },
      env_vars: {
        "NODE_ENV": "production",
        "FW_MODE": "production",
        "FW_LOG_LEVEL": "info",
        "FW_PERFORMANCE": "enabled",
      },
    },
    bun: {
      version: ">=1.3.8",
      config: {
        "logLevel": "error",
        "minify": true,
        "target": "bun",
      },
      flags: ["--production", "--minify"],
    },
    factoryWager: {
      mode: "production",
      reporting: {
        format: "html",
        output_dir: "./dist/reports",
        auto_generate: false,
      },
      features: {
        markdown_engine: true,
        toml_config: true,
        audit_system: true,
        archive_system: true,
      },
    },
    paths: {
      config_dir: PATHS.CONFIG_DIR,
      reports_dir: PATHS.REPORTS_DIR,
      types_dir: PATHS.TYPES_DIR,
      audit_dir: PATHS.AUDIT_DIR,
      output_dir: "./dist/reports",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  audit: {
    name: "audit",
    description: "Audit mode for compliance and security analysis",
    environment: "testing",
    terminal: {
      shell: "bash",
      theme: "light",
      prompt: "🔍 FactoryWager Audit \\w\\$ ",
      aliases: {
        "fw": "bun run .factory-wager/cli.ts --audit",
        "fw-audit": "bun run .factory-wager/audit-cli.sh --verbose",
        "fw-report": "bun run .factory-wager/reports/markdown-engine.ts --use-case=incident_report",
        "fw-validate": "bun run .factory-wager/audit-validator.ts",
        "fw-rotate": "bun run .factory-wager/audit-rotator.ts",
      },
      env_vars: {
        "NODE_ENV": "testing",
        "FW_MODE": "audit",
        "FW_LOG_LEVEL": "verbose",
        "FW_AUDIT_MODE": "enabled",
        "FW_COMPLIANCE": "strict",
      },
    },
    bun: {
      version: ">=1.3.8",
      config: {
        "logLevel": "debug",
        "audit": true,
      },
      flags: ["--inspect"],
    },
    factoryWager: {
      mode: "audit",
      reporting: {
        format: "markdown",
        output_dir: "./audit/reports",
        auto_generate: true,
      },
      features: {
        markdown_engine: true,
        toml_config: true,
        audit_system: true,
        archive_system: true,
      },
    },
    paths: {
      config_dir: PATHS.CONFIG_DIR,
      reports_dir: "./audit/reports",
      types_dir: PATHS.TYPES_DIR,
      audit_dir: PATHS.AUDIT_DIR,
      output_dir: "./audit/output",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  demo: {
    name: "demo",
    description: "Demo mode for presentations and showcases",
    environment: "development",
    terminal: {
      shell: "zsh",
      theme: "auto",
      prompt: "🎪 FactoryWager Demo \\w\\$ ",
      aliases: {
        "fw": "bun run .factory-wager/cli.ts --demo",
        "fw-demo": "bun run .factory-wager/reports/markdown-engine.ts demo",
        "fw-showcase": "bun run .factory-wager/factory-wager-complete-bun-api.ts",
        "fw-colors": "bun run .factory-wager/factory-wager-terminal-reports.ts",
      },
      env_vars: {
        "NODE_ENV": "development",
        "FW_MODE": "demo",
        "FW_LOG_LEVEL": "info",
        "FW_DEMO_MODE": "enabled",
      },
    },
    bun: {
      version: ">=1.3.8",
      config: {
        "logLevel": "info",
      },
      flags: ["--hot"],
    },
    factoryWager: {
      mode: "demo",
      reporting: {
        format: "html",
        output_dir: "./demo/reports",
        auto_generate: true,
      },
      features: {
        markdown_engine: true,
        toml_config: true,
        audit_system: false,
        archive_system: false,
      },
    },
    paths: {
      config_dir: PATHS.CONFIG_DIR,
      reports_dir: "./demo/reports",
      types_dir: PATHS.TYPES_DIR,
      audit_dir: PATHS.AUDIT_DIR,
      output_dir: "./demo/output",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

/**
 * Profile Manager class
 */
export class ProfileManager {
  private profiles: Map<string, Profile> = new Map();
  private activeProfile: string | null = null;
  private profileConfigPath: string;

  constructor() {
    this.profileConfigPath = `${PATHS.CONFIG_DIR}/profiles.json`;
    this.loadProfiles();
  }

  /**
   * Load profiles from configuration file
   */
  private loadProfiles(): void {
    // Load default profiles
    Object.entries(DEFAULT_PROFILES).forEach(([name, profile]) => {
      this.profiles.set(name, profile);
    });

    // Load custom profiles from file if exists
    if (existsSync(this.profileConfigPath)) {
      try {
        const customProfiles = JSON.parse(readFileSync(this.profileConfigPath, "utf8"));
        Object.entries(customProfiles).forEach(([name, profile]) => {
          this.profiles.set(name, profile);
        });
      } catch (error) {
        console.warn(`Failed to load custom profiles: ${error}`);
      }
    }
  }

  /**
   * Save profiles to configuration file
   */
  private saveProfiles(): void {
    const profilesObject: Record<string, Profile> = {};
    this.profiles.forEach((profile, name) => {
      if (!DEFAULT_PROFILES[name]) {
        // Only save custom profiles, not defaults
        profilesObject[name] = profile;
      }
    });

    try {
      writeFileSync(this.profileConfigPath, JSON.stringify(profilesObject, null, 2));
    } catch (error) {
      console.error(`Failed to save profiles: ${error}`);
    }
  }

  /**
   * Get all available profiles
   */
  getProfiles(): Record<string, Profile> {
    const result: Record<string, Profile> = {};
    this.profiles.forEach((profile, name) => {
      result[name] = profile;
    });
    return result;
  }

  /**
   * Get a specific profile
   */
  getProfile(name: string): Profile | undefined {
    return this.profiles.get(name);
  }

  /**
   * Create or update a profile
   */
  setProfile(name: string, profile: Profile): void {
    profile.updated_at = new Date().toISOString();
    this.profiles.set(name, profile);
    this.saveProfiles();
  }

  /**
   * Delete a profile (cannot delete default profiles)
   */
  deleteProfile(name: string): boolean {
    if (DEFAULT_PROFILES[name]) {
      throw new Error("Cannot delete default profile");
    }
    
    const deleted = this.profiles.delete(name);
    if (deleted) {
      this.saveProfiles();
    }
    return deleted;
  }

  /**
   * Set active profile
   */
  setActiveProfile(name: string): void {
    if (!this.profiles.has(name)) {
      throw new Error(`Profile '${name}' not found`);
    }
    this.activeProfile = name;
  }

  /**
   * Get active profile
   */
  getActiveProfile(): Profile | null {
    return this.activeProfile ? this.profiles.get(this.activeProfile) || null : null;
  }

  /**
   * Get active profile name
   */
  getActiveProfileName(): string | null {
    return this.activeProfile;
  }

  /**
   * Generate shell configuration for active profile
   */
  generateShellConfig(): string {
    const profile = this.getActiveProfile();
    if (!profile) {
      return "# No active profile set\n";
    }

    let config = `# FactoryWager Profile: ${profile.name}\n`;
    config += `# ${profile.description}\n\n`;

    // Environment variables
    config += "# Environment Variables\n";
    Object.entries(profile.terminal.env_vars).forEach(([key, value]) => {
      config += `export ${key}="${value}"\n`;
    });
    config += "\n";

    // Aliases
    config += "# Aliases\n";
    Object.entries(profile.terminal.aliases).forEach(([alias, command]) => {
      config += `alias ${alias}="${command}"\n`;
    });
    config += "\n";

    // FactoryWager specific
    config += "# FactoryWager Configuration\n";
    config += `export FW_PROFILE="${profile.name}"\n`;
    config += `export FW_MODE="${profile.factoryWager.mode}"\n`;
    config += `export FW_REPORT_FORMAT="${profile.factoryWager.reporting.format}"\n`;
    config += `export FW_OUTPUT_DIR="${profile.factoryWager.reporting.output_dir}"\n`;

    return config;
  }

  /**
   * Generate Bun configuration for active profile
   */
  generateBunConfig(): string {
    const profile = this.getActiveProfile();
    if (!profile) {
      return "{}";
    }

    const bunConfig = {
      ...profile.bun.config,
      // Add profile-specific settings
      profile: profile.name,
      mode: profile.factoryWager.mode,
      logLevel: profile.terminal.env_vars.FW_LOG_LEVEL || "info",
    };

    return JSON.stringify(bunConfig, null, 2);
  }

  /**
   * Apply profile to current environment
   */
  applyProfile(): void {
    const profile = this.getActiveProfile();
    if (!profile) {
      console.log("No active profile to apply");
      return;
    }

    console.log(`🔧 Applying profile: ${profile.name}`);
    
    // Set environment variables
    Object.entries(profile.terminal.env_vars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log(`✅ Profile '${profile.name}' applied successfully`);
    console.log(`📊 Mode: ${profile.factoryWager.mode}`);
    console.log(`🎨 Theme: ${profile.terminal.theme}`);
    console.log(`📝 Report Format: ${profile.factoryWager.reporting.format}`);
  }

  /**
   * List available profiles
   */
  listProfiles(): void {
    console.log("📋 Available FactoryWager Profiles:");
    console.log("");
    
    this.profiles.forEach((profile, name) => {
      const isActive = name === this.activeProfile ? " [ACTIVE]" : "";
      console.log(`${name}${isActive}`);
      console.log(`  ${profile.description}`);
      console.log(`  Environment: ${profile.environment}`);
      console.log(`  Mode: ${profile.factoryWager.mode}`);
      console.log("");
    });
  }
}

/**
 * Global profile manager instance
 */
export const profileManager = new ProfileManager();

/**
 * Utility functions
 */
export const ProfileUtils = {
  /**
   * Initialize profile system
   */
  init: (): void => {
    console.log("🚀 Initializing FactoryWager Profile System");
    profileManager.listProfiles();
  },

  /**
   * Switch to a profile
   */
  switchProfile: (name: string): void => {
    try {
      profileManager.setActiveProfile(name);
      profileManager.applyProfile();
    } catch (error) {
      console.error(`❌ Failed to switch to profile '${name}': ${error}`);
    }
  },

  /**
   * Generate shell script for profile
   */
  generateShellScript: (profileName: string): string => {
    const originalProfile = profileManager.getActiveProfileName();
    if (originalProfile) {
      profileManager.setActiveProfile(profileName);
    }
    
    const script = profileManager.generateShellConfig();
    
    if (originalProfile) {
      profileManager.setActiveProfile(originalProfile);
    }
    
    return script;
  },

  /**
   * Export profile configuration
   */
  exportProfile: (name: string, filePath: string): void => {
    const profile = profileManager.getProfile(name);
    if (!profile) {
      throw new Error(`Profile '${name}' not found`);
    }

    const config = {
      profile,
      shell_config: profileManager.generateShellConfig(),
      bun_config: profileManager.generateBunConfig(),
    };

    writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log(`✅ Profile '${name}' exported to ${filePath}`);
  },
};

// Export defaults
export default {
  ProfileManager,
  profileManager,
  DEFAULT_PROFILES,
  ProfileUtils,
};
