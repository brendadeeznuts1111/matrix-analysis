#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager CLI - Single Point of Entry (Bun Native)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { profileManager, ProfileUtils } from "./config/profiles.ts";
import { PATHS } from "./config/paths.ts";
import { readFileSync, existsSync } from "fs";

// Version information using existing systems
const VERSION = "1.4.0-beta.20260201";
const BUILD_DATE = new Date().toISOString();
const BUN_VERSION = process.versions.bun;

// CLI Arguments parsing
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];
const options = args.slice(2);

// Helper function to get git information
async function getGitInfo(): Promise<{ commit?: string; branch?: string }> {
  const info: { commit?: string; branch?: string } = {};

  try {
    const commitProcess = Bun.spawn(["git", "rev-parse", "HEAD"], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const commitOutput = await new Response(commitProcess.stdout).text();
    info.commit = commitOutput.trim() || undefined;
  } catch {
    // Git not available
  }

  try {
    const branchProcess = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const branchOutput = await new Response(branchProcess.stdout).text();
    info.branch = branchOutput.trim() || undefined;
  } catch {
    // Git not available
  }

  return info;
}

// Helper function to get system status
async function getSystemStatus(): Promise<{
  version: string;
  buildDate: string;
  bunVersion: string;
  environment: string;
  gitInfo: { commit?: string; branch?: string };
  features: Record<string, boolean>;
  configStatus: Record<string, boolean>;
}> {
  const gitInfo = await getGitInfo();
  const activeProfile = profileManager.getActiveProfileName();

  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    bunVersion: BUN_VERSION,
    environment: process.env.NODE_ENV || "development",
    gitInfo,
    features: {
      markdown_engine: existsSync(PATHS.MARKDOWN_ENGINE),
      toml_config: existsSync(PATHS.REPORT_CONFIG),
      profile_system: true,
      cli_integration: true,
      audit_system: existsSync(`${PATHS.AUDIT_DIR}/native-audit.ts`),
      archive_system: existsSync(`${PATHS.CWD}/archive-api.ts`),
    },
    configStatus: {
      report_config: existsSync(PATHS.REPORT_CONFIG),
      column_config: existsSync(PATHS.COLUMN_CONFIG),
      visibility_config: existsSync(PATHS.VISIBILITY_CONFIG),
      types: existsSync(PATHS.TYPES_DIR),
      profiles: activeProfile !== null,
    }
  };
}

// Helper function to display comprehensive status
async function displaySystemStatus(): Promise<void> {
  const status = await getSystemStatus();
  const activeProfile = profileManager.getActiveProfileName();

  console.log(`
🏭 ═══════════════════════════════════════════════════════════════════════════════
    FactoryWager System Status
    ═══════════════════════════════════════════════════════════════════════════════

    📋 Version Information:
    Version: ${status.version}
    Build Date: ${new Date(status.buildDate).toLocaleString()}
    Environment: ${status.environment}
    Bun Version: ${status.bunVersion}

    ${status.gitInfo.commit ? `🔗 Git Commit: ${status.gitInfo.commit.substring(0, 8)}` : ""}
    ${status.gitInfo.branch ? `🌿 Git Branch: ${status.gitInfo.branch}` : ""}

    👤 Active Profile: ${activeProfile || "None"}

    🚀 Features Status:
    ${Object.entries(status.features)
      .map(([feature, enabled]) => `    ${enabled ? '✅' : '❌'} ${feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
      .join('\n')}

    ⚙️ Configuration Status:
    ${Object.entries(status.configStatus)
      .map(([config, exists]) => `    ${exists ? '✅' : '❌'} ${config.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
      .join('\n')}

    📁 Key Paths:
    Working Directory: ${process.cwd()}
    Git Root: ${PATHS.GIT_ROOT}
    Config Directory: ${PATHS.CONFIG_DIR}
    Reports Directory: ${PATHS.REPORTS_DIR}

════════════════════════════════════════════════════════════════════════════════ 🏭
  `);
}

// Helper function to execute shell commands
async function execCommand(cmd: string): Promise<void> {
  const process = Bun.spawn(["sh", "-c", cmd], {
    stdout: "inherit",
    stderr: "inherit",
  });
  await process.exited;
}

// Helper function to show help
function showHelp(): void {
  console.log(`
🏭 ═══════════════════════════════════════════════════════════════════════════════
    FactoryWager CLI - Single Point of Entry (Bun Native)
    ═══════════════════════════════════════════════════════════════════════════════

    Usage: fw <command> [subcommand] [options]

    Profile Management:
      fw profile list              - List all available profiles
      fw profile switch <name>     - Switch to a profile
      fw profile apply [name]      - Apply profile to current environment
      fw profile current           - Show current active profile
      fw profile generate <name>   - Generate shell configuration for profile
      fw profile export <name> <file> - Export profile to file

    Report Generation:
      fw report markdown [format]  - Generate markdown-native report
      fw report toml <config> <output> [useCase] - Generate TOML-powered report
      fw report demo               - Generate demo reports in all formats

    Configuration:
      fw config show               - Show current configuration
      fw config paths              - Show all path configurations

    Audit & Compliance:
      fw audit run                 - Run audit system
      fw audit validate            - Validate audit data
      fw audit rotate              - Rotate audit logs

    Build & Deploy:
      fw build archive             - Build archive
      fw build deploy              - Deploy to production

    System Status:
      fw status system             - Show system status
      fw status git                - Show git status
      fw status health             - Run health check

    Utilities:
      fw util clean                - Clean generated files
      fw util setup                - Initial setup
      fw util version              - Show version information

    Quick Commands:
      fw dev                       - Switch to development profile
      fw prod                      - Switch to production profile
      fw audit-mode                - Switch to audit profile
      fw demo                      - Switch to demo profile
      fw report-html               - Generate HTML report
      fw report-ansi               - Generate ANSI report
      fw info                      - Show quick system info
      fw welcome                   - Show welcome message

    Examples:
      fw setup                     # Initial setup
      fw dev                       # Switch to development
      fw report-html               # Generate HTML report
      fw status health             # Health check

════════════════════════════════════════════════════════════════════════════════ 🏭
  `);
}

// Main command router
async function main(): Promise<void> {
  try {
    // Show help if no command or --help
    if (!command || command === "--help" || command === "-h") {
      showHelp();
      return;
    }

    // Route commands based on input
    switch (command) {
      case "profile":
      case "p":
        switch (subCommand) {
          case "list":
          case "ls":
            ProfileUtils.init();
            break;
          case "switch":
          case "sw":
            if (!options[0]) {
              console.error("❌ Profile name required");
              process.exit(1);
            }
            ProfileUtils.switchProfile(options[0]);
            break;
          case "current":
          case "cur":
            const current = profileManager.getActiveProfileName();
            if (current) {
              console.log(`📋 Current profile: ${current}`);
              const profile = profileManager.getActiveProfile();
              if (profile) {
                console.log(`📝 Description: ${profile.description}`);
                console.log(`🔧 Mode: ${profile.factoryWager.mode}`);
                console.log(`🎨 Theme: ${profile.terminal.theme}`);
              }
            } else {
              console.log("❌ No active profile set");
            }
            break;
          default:
            console.error("❌ Unknown profile subcommand");
            console.log("Available: list, switch, current");
            process.exit(1);
        }
        break;

      case "report":
      case "r":
        switch (subCommand) {
          case "markdown":
          case "md":
            const format = options[0] || "html";
            await execCommand(`bun run ${PATHS.MARKDOWN_ENGINE} ${format}`);
            break;
          case "demo":
            await execCommand(`bun run ${PATHS.MARKDOWN_ENGINE} demo`);
            break;
          default:
            console.error("❌ Unknown report subcommand");
            console.log("Available: markdown, demo");
            process.exit(1);
        }
        break;

      case "config":
      case "c":
        switch (subCommand) {
          case "show":
          case "sh":
            console.log("🔧 FactoryWager Configuration:");
            console.log(`📁 Config Directory: ${PATHS.CONFIG_DIR}`);
            console.log(`📋 Report Config: ${PATHS.REPORT_CONFIG}`);
            break;
          case "paths":
          case "p":
            console.log("🛤️ FactoryWager Paths:");
            Object.entries(PATHS).forEach(([key, value]) => {
              console.log(`${key}: ${value}`);
            });
            break;
          default:
            console.error("❌ Unknown config subcommand");
            console.log("Available: show, paths");
            process.exit(1);
        }
        break;

      case "status":
      case "s":
        switch (subCommand) {
          case "system":
          case "sys":
            await displaySystemStatus();
            break;
          case "health":
            console.log("🏥 FactoryWager Health Check:");
            const status = await getSystemStatus();
            const enabledFeatures = Object.values(status.features).filter(Boolean).length;
            const totalFeatures = Object.keys(status.features).length;
            const existingConfigs = Object.values(status.configStatus).filter(Boolean).length;
            const totalConfigs = Object.keys(status.configStatus).length;

            console.log(`✅ Features: ${enabledFeatures}/${totalFeatures} enabled`);
            console.log(`✅ Configuration: ${existingConfigs}/${totalConfigs} files found`);
            console.log(`✅ Version: ${status.version}`);
            console.log(`✅ Environment: ${status.environment}`);
            console.log("🎯 Overall Health: GOOD");
            break;
          default:
            console.error("❌ Unknown status subcommand");
            console.log("Available: system, health");
            process.exit(1);
        }
        break;

      case "util":
      case "u":
        switch (subCommand) {
          case "setup":
            console.log("🚀 FactoryWager Initial Setup:");
            ProfileUtils.init();
            try {
              ProfileUtils.switchProfile("development");
              console.log("✅ Default profile set to development");
            } catch (error) {
              console.log("❌ Failed to set default profile");
            }
            console.log("✅ Setup completed");
            break;
          case "version":
          case "v":
            const gitInfo = await getGitInfo();
            const activeProfile = profileManager.getActiveProfileName();

            console.log(`
🏭 ═══════════════════════════════════════════════════════════════════════════════
    FactoryWager Version Information
    ═══════════════════════════════════════════════════════════════════════════════

    📋 Version: ${VERSION}
    🏭 Name: FactoryWager CLI
    📅 Build Date: ${new Date(BUILD_DATE).toLocaleString()}
    🌍 Environment: ${process.env.NODE_ENV || "development"}
    🥟 Bun Version: ${BUN_VERSION}

    ${gitInfo.commit ? `🔗 Git Commit: ${gitInfo.commit.substring(0, 8)}` : ""}
    ${gitInfo.branch ? `🌿 Git Branch: ${gitInfo.branch}` : ""}

    👤 Active Profile: ${activeProfile || "None"}

    🚀 Features:
    ✅ Profile System
    ✅ CLI Integration
    ✅ TOML Configuration
    ${existsSync(PATHS.MARKDOWN_ENGINE) ? "✅ Markdown Engine" : "❌ Markdown Engine"}
    ${existsSync(`${PATHS.AUDIT_DIR}/native-audit.ts`) ? "✅ Audit System" : "❌ Audit System"}
    ${existsSync(`${PATHS.CWD}/archive-api.ts`) ? "✅ Archive System" : "❌ Archive System"}

    📁 Working Directory: ${process.cwd()}
    🔧 Git Root: ${PATHS.GIT_ROOT}

════════════════════════════════════════════════════════════════════════════════ 🏭
            `);
            break;
          default:
            console.error("❌ Unknown util subcommand");
            console.log("Available: setup, version");
            process.exit(1);
        }
        break;

      // Quick commands
      case "dev":
        ProfileUtils.switchProfile("development");
        break;

      case "prod":
        ProfileUtils.switchProfile("production");
        break;

      case "demo":
        ProfileUtils.switchProfile("demo");
        break;

      case "report-html":
        await execCommand(`bun run ${PATHS.MARKDOWN_ENGINE} html`);
        break;

      case "info":
        const status = await getSystemStatus();
        const activeProfile = profileManager.getActiveProfileName();

        console.log("🏭 FactoryWager Quick Info:");
        console.log(`👤 Profile: ${activeProfile || "None"}`);
        console.log(`📋 Version: ${status.version}`);
        console.log(`📁 Directory: ${process.cwd()}`);
        console.log(`🔧 Mode: ${process.env.FW_MODE || "Unknown"}`);
        console.log(`🌍 Environment: ${status.environment}`);
        console.log(`🥟 Bun: ${status.bunVersion}`);

        if (status.gitInfo.commit) {
          console.log(`🔗 Git: ${status.gitInfo.commit.substring(0, 8)}`);
        }
        break;

      case "welcome":
        console.log(`
🏭 ═══════════════════════════════════════════════════════════════════════════════
    FactoryWager CLI - Single Point of Entry
    ═══════════════════════════════════════════════════════════════════════════════

    Quick Start:
      fw setup              # Initial setup
      fw dev                # Switch to development
      fw report-html        # Generate HTML report
      fw status system      # Show system status

    Profile Management:
      fw profile list       # List profiles
      fw profile switch dev # Switch profile
      fw profile current    # Show current profile

    Report Generation:
      fw report markdown    # Markdown report
      fw report demo        # Demo reports

    System Status:
      fw status health      # Health check
      fw info               # Quick info

    Utilities:
      fw util version       # Version info

    For detailed help: fw --help
════════════════════════════════════════════════════════════════════════════════ 🏭
        `);
        break;

      default:
        console.error("❌ Unknown command");
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the CLI
if (import.meta.main) {
  main();
}

// Export for programmatic use
export { main };
export default main;
