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
  private idCounter = 0;

  /**
   * Spawn an interactive PTY session.
   * Returns a session ID for management.
   */
  async spawn(command: string[], options: PTYOptions = {}): Promise<string> {
    const id = `pty-${++this.idCounter}-${Date.now()}`;

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
    this.handleSessionExit(id, proc, options.onExit);

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
      // Wait for graceful exit with 5s timeout
      const exitCode = await Promise.race([
        proc.exited,
        Bun.sleep(5000).then(() => {
          // Force kill if graceful exit times out
          if (!proc.killed) {
            proc.kill(9); // SIGKILL
          }
          return -1;
        }),
      ]);

      onExit?.(exitCode);
    } catch (error) {
      console.error(`[PTY] Session ${id} cleanup error:`, error);
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
          console.error("[PTY] Stdin read error:", error.message);
        }
      }
    };
    // Start stdin reader (runs until process exits or stdin closes)
    stdinReader();

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
// Convenience Functions
// ============================================================================

/**
 * Run vim on a file.
 */
export function editFile(path: string): Promise<number> {
  const editor = process.env.EDITOR || process.env.VISUAL || "vim";
  return ptyManager.interactive([editor, path]);
}

/**
 * Run an interactive shell.
 */
export function shell(shellPath?: string): Promise<number> {
  const sh = shellPath || process.env.SHELL || "/bin/bash";
  return ptyManager.interactive([sh]);
}

/**
 * Run htop or top.
 */
export function monitor(): Promise<number> {
  // Try htop first, fall back to top
  return ptyManager.interactive(["htop"]).catch(() => ptyManager.interactive(["top"]));
}

/**
 * Run a database CLI.
 */
export function dbCli(
  type: "postgres" | "mysql" | "redis",
  connectionString?: string
): Promise<number> {
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
