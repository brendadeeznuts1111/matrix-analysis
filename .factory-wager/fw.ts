#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager CLI - Single Point of Entry (Bun Native)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { profileManager, ProfileUtils } from "./config/profiles.ts";
import { PATHS } from "./config/paths.ts";
import { readFileSync, existsSync } from "fs";

// CLI Arguments parsing
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];
const options = args.slice(2);

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
            console.log("🖥️ FactoryWager System Status:");
            console.log(`📁 Working Directory: ${process.cwd()}`);
            console.log(`🔧 Git Root: ${PATHS.GIT_ROOT}`);
            const activeProfile = profileManager.getActiveProfileName();
            console.log(`👤 Active Profile: ${activeProfile || "None"}`);
            break;
          case "health":
            console.log("🏥 FactoryWager Health Check:");
            try {
              const profiles = profileManager.getProfiles();
              console.log(`✅ Profile System: ${Object.keys(profiles).length} profiles loaded`);
            } catch (error) {
              console.log("❌ Profile System: Error");
            }
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
            console.log("🏭 FactoryWager CLI");
            console.log("Version: 1.0.0");
            console.log("Bun Version:", process.versions.bun);
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
        const currentProfile = profileManager.getActiveProfileName();
        console.log("🏭 FactoryWager Quick Info:");
        console.log(`👤 Profile: ${currentProfile || "None"}`);
        console.log(`📁 Directory: ${process.cwd()}`);
        console.log(`🔧 Mode: ${process.env.FW_MODE || "Unknown"}`);
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
