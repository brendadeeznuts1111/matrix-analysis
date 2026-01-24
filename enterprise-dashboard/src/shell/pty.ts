/**
 * PTY/TTY Manager (Bun 1.3.6+)
 *
 * Reusable terminal pool for running interactive programs.
 * Uses Explicit Resource Management (ES2023) for automatic cleanup.
 *
 * Use cases:
 * - Interactive shells (bash, zsh, fish)
 * - Text editors (vim, nano)
 * - System monitors (htop, top)
 * - Database clients (psql, mysql, redis-cli)
 * - REPLs (python, node, bun)
 */

import { PTY_CLEANUP_TIMEOUT_MS } from "../config/constants.ts";
import { ptyLog } from "../utils/logger.ts";

// ============================================================================
// Types
// ============================================================================

export interface PTYOptions {
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
  cwd?: string;
  onData?: (data: Uint8Array) => void;
  onExit?: (exitCode: number) => void;
}

export interface PTYSession {
  id: string;
  command: string[];
  terminal: Bun.Terminal;
  process: Bun.Subprocess;
  startedAt: number;
}

// ============================================================================
// PTY Manager (Singleton)
// ============================================================================

class PTYManager {
  private sessions = new Map<string, PTYSession>();

  /**
   * Spawn an interactive PTY session.
   * Returns a session ID for management.
   */
  async spawn(command: string[], options: PTYOptions = {}): Promise<string> {
    // Use UUIDv7 for unique, time-sortable IDs (race-condition safe)
    const id = `pty-${Bun.randomUUIDv7()}`;

    const terminal = new Bun.Terminal({
      cols: options.cols ?? process.stdout.columns ?? 80,
      rows: options.rows ?? process.stdout.rows ?? 24,
      data: (_, data) => {
        if (options.onData) {
          options.onData(data);
        } else {
          process.stdout.write(data);
        }
      },
    });

    const proc = Bun.spawn(command, {
      terminal,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });

    const session: PTYSession = {
      id,
      command,
      terminal,
      process: proc,
      startedAt: Date.now(),
    };

    this.sessions.set(id, session);

    // Auto-cleanup on exit with proper resource management
    // Attach catch handler to prevent unhandled rejection warnings
    this.handleSessionExit(id, proc, options.onExit).catch((err) => {
      ptyLog.error(`Session ${id} exit handler error:`, err);
    });

    return id;
  }

  /**
   * Handle session exit with proper cleanup and timeout.
   */
  private async handleSessionExit(
    id: string,
    proc: Bun.Subprocess,
    onExit?: (exitCode: number) => void
  ): Promise<void> {
    try {
      // Wait for graceful exit with configurable timeout
      const exitCode = await Promise.race([
        proc.exited,
        Bun.sleep(PTY_CLEANUP_TIMEOUT_MS).then(() => {
          // Force kill if graceful exit times out
          if (!proc.killed) {
            proc.kill(9); // SIGKILL
          }
          return -1;
        }),
      ]);

      onExit?.(exitCode);
    } catch (error) {
      ptyLog.error(`Session ${id} cleanup error:`, error);
    } finally {
      this.sessions.delete(id);
    }
  }

  /**
   * Run an interactive command with raw mode input.
   * Blocks until the command exits.
   */
  async interactive(command: string[], options: PTYOptions = {}): Promise<number> {
    const terminal = new Bun.Terminal({
      cols: options.cols ?? process.stdout.columns ?? 80,
      rows: options.rows ?? process.stdout.rows ?? 24,
      data: (_, data) => process.stdout.write(data),
    });

    const proc = Bun.spawn(command, {
      terminal,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });

    // Enable raw mode for keyboard input
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    // Forward stdin to terminal with error handling
    const stdinReader = async () => {
      try {
        for await (const chunk of process.stdin) {
          terminal.write(chunk);
        }
      } catch (error) {
        // Log error but don't crash - stdin errors are recoverable
        if (error instanceof Error && error.name !== "AbortError") {
          ptyLog.error("Stdin read error:", error.message);
        }
      }
    };
    // Start stdin reader (runs until process exits or stdin closes)
    // Attach catch handler to prevent unhandled rejection warnings
    stdinReader().catch(() => {
      // Errors already logged inside stdinReader
    });

    // Handle terminal resize
    const resize = () => {
      terminal.resize(process.stdout.columns, process.stdout.rows);
    };
    process.stdout.on("resize", resize);

    // Wait for process to exit
    const exitCode = await proc.exited;

    // Cleanup
    process.stdout.off("resize", resize);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }

    return exitCode;
  }

  /**
   * Write data to a PTY session.
   */
  write(sessionId: string, data: string | Uint8Array): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.terminal.write(typeof data === "string" ? new TextEncoder().encode(data) : data);
    return true;
  }

  /**
   * Resize a PTY session.
   */
  resize(sessionId: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.terminal.resize(cols, rows);
    return true;
  }

  /**
   * Kill a PTY session.
   */
  kill(sessionId: string, signal: NodeJS.Signals = "SIGTERM"): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.process.kill(signal);
    return true;
  }

  /**
   * Get all active sessions.
   */
  list(): PTYSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by ID.
   */
  get(sessionId: string): PTYSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Kill all sessions.
   */
  killAll(): void {
    for (const session of this.sessions.values()) {
      session.process.kill("SIGTERM");
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const ptyManager = new PTYManager();

// ============================================================================
// Input Validation
// ============================================================================

// Allowed shells (prevent arbitrary command execution via SHELL env)
const ALLOWED_SHELLS = new Set([
  "/bin/bash", "/bin/zsh", "/bin/sh", "/bin/fish",
  "/usr/bin/bash", "/usr/bin/zsh", "/usr/bin/sh", "/usr/bin/fish",
  "/usr/local/bin/bash", "/usr/local/bin/zsh", "/usr/local/bin/fish",
  "bash", "zsh", "sh", "fish"
]);

// Allowed editors (prevent arbitrary command execution via EDITOR env)
const ALLOWED_EDITORS = new Set([
  "vim", "nvim", "vi", "nano", "emacs", "code", "subl", "atom",
  "/usr/bin/vim", "/usr/bin/nvim", "/usr/bin/vi", "/usr/bin/nano",
  "/usr/bin/emacs", "/usr/local/bin/vim", "/usr/local/bin/nvim"
]);

/**
 * Validate that a string is safe for use as a command argument.
 * Rejects null bytes and shell metacharacters.
 */
function isSafeArgument(arg: string): boolean {
  // Reject null bytes, shell metacharacters, and control characters
  return !/[\0\n\r;|&$`\\]/.test(arg);
}

/**
 * Validate a file path for editing (no traversal, no special chars).
 */
function isValidFilePath(filePath: string): boolean {
  // Reject empty paths, null bytes, and obvious traversal
  if (!filePath || filePath.includes("\0")) return false;
  // Allow normal paths but reject shell metacharacters
  return isSafeArgument(filePath);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Run vim on a file.
 */
export function editFile(path: string): Promise<number> {
  if (!isValidFilePath(path)) {
    return Promise.reject(new Error(`Invalid file path: "${path}"`));
  }

  const envEditor = process.env.EDITOR || process.env.VISUAL;
  // Only use env editor if it's in the allowlist
  let editor: string;
  if (envEditor && ALLOWED_EDITORS.has(envEditor)) {
    editor = envEditor;
  } else {
    editor = "vim";
    if (envEditor) {
      ptyLog.warn(`Editor "${envEditor}" not in allowlist, using vim`);
    }
  }
  return ptyManager.interactive([editor, path]);
}

/**
 * Run an interactive shell.
 */
export function shell(shellPath?: string): Promise<number> {
  const envShell = shellPath || process.env.SHELL;
  // Only use shell if it's in the allowlist
  let sh: string;
  if (envShell && ALLOWED_SHELLS.has(envShell)) {
    sh = envShell;
  } else {
    sh = "/bin/bash";
    if (envShell) {
      ptyLog.warn(`Shell "${envShell}" not in allowlist, using /bin/bash`);
    }
  }
  return ptyManager.interactive([sh]);
}

/**
 * Run htop or top.
 */
export function monitor(): Promise<number> {
  // Try htop first, fall back to top with logging
  return ptyManager.interactive(["htop"]).catch((error) => {
    ptyLog.warn(`htop unavailable (${error.message || "not found"}), falling back to top`);
    return ptyManager.interactive(["top"]);
  });
}

/**
 * Run a database CLI.
 */
export function dbCli(
  type: "postgres" | "mysql" | "redis",
  connectionString?: string
): Promise<number> {
  // Validate connection string if provided
  if (connectionString && !isSafeArgument(connectionString)) {
    return Promise.reject(new Error("Invalid connection string"));
  }

  const commands: Record<string, string[]> = {
    postgres: ["psql", connectionString || ""],
    mysql: ["mysql", connectionString ? `-h${connectionString}` : ""],
    redis: ["redis-cli", ...(connectionString ? ["-u", connectionString] : [])],
  };

  return ptyManager.interactive(commands[type].filter(Boolean));
}

/**
 * Run a REPL.
 */
export function repl(runtime: "bun" | "node" | "python" = "bun"): Promise<number> {
  const commands: Record<string, string[]> = {
    bun: ["bun", "repl"],
    node: ["node"],
    python: ["python3"],
  };

  return ptyManager.interactive(commands[runtime]);
}

export default ptyManager;
