#!/usr/bin/env bun
/**
 * Kimi Shell Interactive Mode
 * Enhanced REPL with auto-completion and history
 */

import { readFileSync, existsSync, appendFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
};

interface CommandHistory {
  commands: string[];
  index: number;
}

const HISTORY_FILE = join(homedir(), ".kimi", "shell_history");
const MAX_HISTORY = 1000;

const COMMANDS = [
  "metrics",
  "metrics collect",
  "metrics dashboard",
  "metrics record",
  "shell",
  "shell status",
  "shell exec",
  "shell switch",
  "settings",
  "vault",
  "vault health",
  "vault list",
  "workflow",
  "workflow mcp",
  "workflow acp",
  "help",
  "exit",
  "quit",
];

function loadHistory(): CommandHistory {
  try {
    if (existsSync(HISTORY_FILE)) {
      const content = readFileSync(HISTORY_FILE, "utf-8");
      const commands = content.split("\n").filter(Boolean).slice(-MAX_HISTORY);
      return { commands, index: commands.length };
    }
  } catch {
    // Ignore errors
  }
  return { commands: [], index: 0 };
}

function saveHistory(history: CommandHistory): void {
  try {
    const content = history.commands.join("\n") + "\n";
    appendFileSync(HISTORY_FILE, content);
  } catch {
    // Ignore errors
  }
}

function getCompletions(input: string): string[] {
  if (!input) return [];
  return COMMANDS.filter((cmd) => cmd.startsWith(input.toLowerCase()));
}

function printPrompt(): void {
  process.stdout.write(`${COLORS.cyan}🐚 kimi>${COLORS.reset} `);
}

function printWelcome(): void {
  console.log(`${COLORS.bold}${COLORS.cyan}`);
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           🐚 Kimi Shell Interactive Mode v1.3.8                   ║");
  console.log("║           Tier-1380 OMEGA | Type 'help' for commands              ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log(`${COLORS.reset}`);
}

function printHelp(): void {
  console.log(`
${COLORS.bold}Available Commands:${COLORS.reset}
  metrics [collect|dashboard|record]  - Metrics operations
  shell [status|exec|switch]          - Shell management
  settings                            - Settings dashboard
  vault [health|list]                 - Vault credentials
  workflow [mcp|acp]                  - Workflow visualization
  
${COLORS.bold}Interactive Commands:${COLORS.reset}
  help                                - Show this help
  history                             - Show command history
  clear                               - Clear screen
  exit, quit                          - Exit shell
`);
}

async function executeCommand(input: string): Promise<void> {
  const trimmed = input.trim();
  if (!trimmed) return;

  const args = trimmed.split(/\s+/);
  const cmd = args[0].toLowerCase();

  switch (cmd) {
    case "help":
      printHelp();
      return;
    case "exit":
    case "quit":
      console.log(`${COLORS.green}Goodbye! 👋${COLORS.reset}`);
      process.exit(0);
      break;
    case "clear":
      console.clear();
      return;
    case "history": {
      const history = loadHistory();
      history.commands.forEach((cmd, i) => {
        console.log(`  ${COLORS.gray}${String(i + 1).padStart(3)}${COLORS.reset}  ${cmd}`);
      });
      return;
    }
  }

  // Delegate to kimi-cli
  const { $ } = await import("bun");
  const scriptPath = join(import.meta.dir, "kimi-cli.ts");
  
  try {
    const result = await $`bun ${scriptPath} ${args}`.nothrow();
    if (result.stdout) console.log(result.stdout.toString());
    if (result.stderr) console.error(result.stderr.toString());
  } catch (error) {
    console.error(`${COLORS.red}Error: ${error}${COLORS.reset}`);
  }
}

async function readLine(): Promise<string> {
  return new Promise((resolve) => {
    let input = "";
    
    const onData = (data: Buffer) => {
      const char = data.toString();
      
      if (char === "\n" || char === "\r") {
        process.stdout.write("\n");
        process.stdin.off("data", onData);
        resolve(input);
        return;
      }
      
      if (char === "\t") {
        // Tab completion
        const completions = getCompletions(input);
        if (completions.length === 1) {
          input = completions[0];
          process.stdout.write(`\r${COLORS.cyan}🐚 kimi>${COLORS.reset} ${input}`);
        } else if (completions.length > 1) {
          console.log(`\n${COLORS.gray}${completions.join("  ")}${COLORS.reset}`);
          printPrompt();
          process.stdout.write(input);
        }
        return;
      }
      
      if (char === "\x7F") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      
      if (char.charCodeAt(0) >= 32) {
        input += char;
        process.stdout.write(char);
      }
    };
    
    process.stdin.on("data", onData);
  });
}

export async function startInteractiveMode(): Promise<void> {
  printWelcome();
  
  const history = loadHistory();
  
  // Enable raw mode for better input handling
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  
  while (true) {
    printPrompt();
    
    const input = await readLine();
    
    if (input.trim()) {
      history.commands.push(input.trim());
      if (history.commands.length > MAX_HISTORY) {
        history.commands.shift();
      }
      saveHistory(history);
      
      await executeCommand(input);
    }
  }
}

if (import.meta.main) {
  startInteractiveMode().catch(console.error);
}
