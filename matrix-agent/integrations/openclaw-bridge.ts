#!/usr/bin/env bun
/**
 * Matrix Agent ↔ OpenClaw Bridge
 * Bidirectional integration between Matrix Agent and OpenClaw ACP
 *
 * Features:
 * - ACP client for OpenClaw communication
 * - Event forwarding between systems
 * - Command proxy for cross-system execution
 * - Session synchronization
 */

import { $ } from "bun";
import { join } from "path";
import { homedir } from "os";

const OPENCLAW_DIR = join(homedir(), "openclaw");
const OPENCLAW_DIST = join(OPENCLAW_DIR, "dist");
const MATRIX_DIR = join(homedir(), ".matrix");

interface ACPMessage {
  id: string;
  type: "command" | "event" | "query" | "response";
  source: "matrix" | "openclaw";
  target?: string;
  payload: unknown;
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface ACPCommand {
  name: string;
  args: string[];
  options?: Record<string, unknown>;
}

interface BridgeConfig {
  openclaw: {
    enabled: boolean;
    acpEndpoint: string;
    gatewayPort: number;
  };
  matrix: {
    enabled: boolean;
    agentSocket: string;
  };
  sync: {
    sessions: boolean;
    commands: boolean;
    events: boolean;
  };
}

class OpenClawBridge {
  private config: BridgeConfig;
  private connected = false;
  private messageQueue: ACPMessage[] = [];

  constructor(config?: Partial<BridgeConfig>) {
    this.config = {
      openclaw: {
        enabled: true,
        acpEndpoint: "http://localhost:18790/acp",
        gatewayPort: 18790,
        ...config?.openclaw,
      },
      matrix: {
        enabled: true,
        agentSocket: join(MATRIX_DIR, "agent.sock"),
        ...config?.matrix,
      },
      sync: {
        sessions: true,
        commands: true,
        events: true,
        ...config?.sync,
      },
    };
  }

  /**
   * Initialize the bridge
   */
  async init(): Promise<void> {
    console.log("🌉 Initializing Matrix ↔ OpenClaw Bridge");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Check OpenClaw installation
    const openclawExists = await this.checkOpenClaw();
    if (!openclawExists) {
      console.log("⚠️  OpenClaw not found at ~/openclaw");
      console.log("   Bridge will operate in Matrix-only mode");
    } else {
      console.log("✅ OpenClaw detected");
    }

    // Check Matrix Agent
    const matrixExists = await this.checkMatrix();
    if (!matrixExists) {
      throw new Error("Matrix Agent not initialized. Run 'matrix-agent init' first");
    }
    console.log("✅ Matrix Agent detected");

    // Load or create config
    await this.loadConfig();

    console.log("\n📡 Bridge Configuration:");
    console.log(`   OpenClaw ACP: ${this.config.openclaw.acpEndpoint}`);
    console.log(`   Matrix Socket: ${this.config.matrix.agentSocket}`);
    console.log(`   Sync: sessions=${this.config.sync.sessions}, commands=${this.config.sync.commands}, events=${this.config.sync.events}`);

    this.connected = true;
  }

  /**
   * Check if OpenClaw is installed
   */
  private async checkOpenClaw(): Promise<boolean> {
    try {
      const result = await $`test -d ${OPENCLAW_DIR}`.quiet().nothrow();
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if Matrix Agent is initialized
   */
  private async checkMatrix(): Promise<boolean> {
    try {
      const result = await $`test -d ${MATRIX_DIR}`.quiet().nothrow();
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Load bridge configuration
   */
  private async loadConfig(): Promise<void> {
    const configPath = join(MATRIX_DIR, "openclaw-bridge.json");
    try {
      const content = await Bun.file(configPath).text();
      const saved = JSON.parse(content);
      this.config = { ...this.config, ...saved };
    } catch {
      // Save default config
      await Bun.write(configPath, JSON.stringify(this.config, null, 2));
    }
  }

  /**
   * Send command to OpenClaw ACP
   */
  async sendToOpenClaw(command: ACPCommand): Promise<unknown> {
    if (!this.config.openclaw.enabled) {
      throw new Error("OpenClaw integration is disabled");
    }

    const message: ACPMessage = {
      id: this.generateId(),
      type: "command",
      source: "matrix",
      payload: command,
      timestamp: new Date().toISOString(),
    };

    try {
      // Use OpenClaw CLI as proxy
      const result = await $`cd ${OPENCLAW_DIR} && bun openclaw.mjs ${command.name} ${command.args}`.nothrow().quiet();

      return {
        success: result.exitCode === 0,
        output: result.stdout.toString(),
        error: result.stderr.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Send event to Matrix Agent
   */
  async sendToMatrix(event: string, data: unknown): Promise<unknown> {
    if (!this.config.matrix.enabled) {
      throw new Error("Matrix integration is disabled");
    }

    const message: ACPMessage = {
      id: this.generateId(),
      type: "event",
      source: "openclaw",
      payload: { event, data },
      timestamp: new Date().toISOString(),
    };

    // Forward to Matrix Agent
    try {
      const result = await $`bun ${MATRIX_DIR}/matrix-agent.ts event ${event} ${JSON.stringify(data)}`.nothrow().quiet();
      return {
        success: result.exitCode === 0,
        output: result.stdout.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Proxy Matrix command to OpenClaw
   */
  async proxyMatrixCommand(command: string, args: string[]): Promise<unknown> {
    console.log(`🔄 Proxying: matrix ${command} → openclaw`);

    const acpCommand: ACPCommand = {
      name: command,
      args,
    };

    return this.sendToOpenClaw(acpCommand);
  }

  /**
   * Proxy OpenClaw command to Matrix
   */
  async proxyOpenClawCommand(command: string, args: string[]): Promise<unknown> {
    console.log(`🔄 Proxying: openclaw ${command} → matrix`);

    // Map OpenClaw commands to Matrix equivalents
    const commandMap: Record<string, string> = {
      "profile": "profile",
      "tier1380": "tier1380",
      "commit": "commit-flow",
      "status": "status",
    };

    const matrixCommand = commandMap[command] || command;

    try {
      const result = await $`bun ${MATRIX_DIR}/matrix-agent.ts ${matrixCommand} ${args}`.nothrow();
      return {
        success: result.exitCode === 0,
        output: result.stdout.toString(),
        error: result.stderr.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Sync sessions between Matrix and OpenClaw
   */
  async syncSessions(): Promise<void> {
    if (!this.config.sync.sessions) {
      console.log("⏭️  Session sync disabled");
      return;
    }

    console.log("🔄 Syncing sessions...");

    // Get Matrix sessions
    const matrixSessions = await $`bun ${MATRIX_DIR}/scripts/health-check.ts --json`.nothrow().json().catch(() => ({}));

    // Get OpenClaw sessions (if available)
    let openclawSessions = {};
    try {
      openclawSessions = await $`cd ${OPENCLAW_DIR} && bun openclaw.mjs session list --json`.nothrow().json();
    } catch {
      // OpenClaw session command may not exist
    }

    console.log(`   Matrix sessions: ${Object.keys(matrixSessions).length}`);
    console.log(`   OpenClaw sessions: ${Object.keys(openclawSessions).length}`);
  }

  /**
   * Get bridge status
   */
  async status(): Promise<void> {
    console.log("🌉 OpenClaw Bridge Status");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Connection: ${this.connected ? "✅ Connected" : "❌ Disconnected"}`);
    console.log(`OpenClaw: ${this.config.openclaw.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`Matrix: ${this.config.matrix.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`\nSync Settings:`);
    console.log(`  Sessions: ${this.config.sync.sessions ? "✅" : "❌"}`);
    console.log(`  Commands: ${this.config.sync.commands ? "✅" : "❌"}`);
    console.log(`  Events: ${this.config.sync.events ? "✅" : "❌"}`);
    console.log(`\nEndpoints:`);
    console.log(`  OpenClaw ACP: ${this.config.openclaw.acpEndpoint}`);
    console.log(`  Matrix Agent: ${this.config.matrix.agentSocket}`);
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Show help
   */
  showHelp(): void {
    console.log(`
🌉 Matrix Agent ↔ OpenClaw Bridge

USAGE:
  openclaw-bridge.ts <command> [args]

COMMANDS:
  init                    Initialize bridge configuration
  status                  Show bridge status
  sync                    Sync sessions between systems
  proxy <cmd> [args]      Proxy command to OpenClaw
  matrix <cmd> [args]     Proxy command to Matrix from OpenClaw
  event <type> [data]     Send event to connected system
  config                  Show current configuration
  help                    Show this help

EXAMPLES:
  # Initialize bridge
  bun openclaw-bridge.ts init

  # Proxy Matrix profile command to OpenClaw
  bun openclaw-bridge.ts proxy profile list

  # Send event to Matrix from OpenClaw context
  bun openclaw-bridge.ts matrix status

  # Sync sessions
  bun openclaw-bridge.ts sync

INTEGRATION:
  - OpenClaw: ~/openclaw (ACP protocol)
  - Matrix: ~/.matrix (Matrix Agent)
  - Config: ~/.matrix/openclaw-bridge.json
`);
  }
}

// CLI Interface
async function main() {
  const bridge = new OpenClawBridge();
  const args = Bun.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "init":
      await bridge.init();
      break;

    case "status":
      await bridge.status();
      break;

    case "sync":
      await bridge.init();
      await bridge.syncSessions();
      break;

    case "proxy": {
      const cmd = args[1];
      const cmdArgs = args.slice(2);
      if (!cmd) {
        console.error("Usage: proxy <command> [args]");
        process.exit(1);
      }
      const result = await bridge.proxyMatrixCommand(cmd, cmdArgs);
      console.log(result);
      break;
    }

    case "matrix": {
      const cmd = args[1];
      const cmdArgs = args.slice(2);
      if (!cmd) {
        console.error("Usage: matrix <command> [args]");
        process.exit(1);
      }
      const result = await bridge.proxyOpenClawCommand(cmd, cmdArgs);
      console.log(result);
      break;
    }

    case "config": {
      const configPath = join(MATRIX_DIR, "openclaw-bridge.json");
      try {
        const config = await Bun.file(configPath).text();
        console.log(config);
      } catch {
        console.log("No configuration found. Run 'init' first.");
      }
      break;
    }

    case "help":
    case "--help":
    case "-h":
    default:
      bridge.showHelp();
      break;
  }
}

export { OpenClawBridge };
export type { ACPMessage, ACPCommand, BridgeConfig };

if (import.meta.main) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
