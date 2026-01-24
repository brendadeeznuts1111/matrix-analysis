/**
 * Bun Power Tools - Enterprise-grade utilities leveraging Bun 1.3.6+ APIs
 *
 * Optimized patterns for:
 * - Zero-overhead promise handling (Bun.peek)
 * - Accurate terminal tables (Bun.stringWidth + Bun.inspect.table)
 * - Interactive debugging (Bun.Terminal + Bun.openInEditor)
 * - Safe HTML rendering (Bun.escapeHTML)
 * - Deep object comparison (Bun.deepEquals)
 */

export class BunToolkit {
  /**
   * OPTIMIZED PROMISE PROCESSING (Bun.peek)
   * Processes an array of promises with zero microtask overhead for those
   * already resolved. Ideal for cache-heavy workloads.
   */
  static async fastAll<T>(promises: Promise<T>[]): Promise<T[]> {
    const results: T[] = [];
    const pending: { promise: Promise<T>; index: number }[] = [];

    for (let i = 0; i < promises.length; i++) {
      const p = promises[i];
      const status = Bun.peek.status(p);

      if (status === "fulfilled") {
        results[i] = Bun.peek(p) as T; // Synchronous read
      } else if (status === "rejected") {
        throw Bun.peek(p); // Synchronous error throw
      } else {
        pending.push({ promise: p, index: i });
      }
    }

    // Only await what is actually still running
    if (pending.length > 0) {
      const remaining = await Promise.all(pending.map((item) => item.promise));
      remaining.forEach((res, i) => {
        results[pending[i].index] = res;
      });
    }

    return results;
  }

  /**
   * RESPONSIVE CLI TABLE (Bun.stringWidth + Bun.inspect.table)
   * Creates a table that fits the terminal and handles complex objects.
   */
  static renderResponsiveTable(data: object[], options: { colors?: boolean } = {}) {
    const cols = process.stdout.columns || 80;
    const maxCellWidth = Math.floor(cols / 3);

    // Auto-truncate string properties based on terminal width
    const processed = data.map((obj) => {
      const newObj: Record<string, unknown> = { ...obj };
      for (const key in newObj) {
        const value = newObj[key];
        if (typeof value === "string") {
          const width = Bun.stringWidth(value);
          if (width > maxCellWidth) {
            newObj[key] = value.slice(0, maxCellWidth - 1) + "\u2026";
          }
        }
      }
      return newObj;
    });

    console.log(Bun.inspect.table(processed, { colors: options.colors ?? true }));
  }

  /**
   * INTERACTIVE DEBUGGER (Bun.Terminal + Bun.openInEditor)
   * Spawns a PTY for a command, and opens the file in editor on failure.
   */
  static async debugTask(command: string[], sourceFile?: string): Promise<number> {
    console.log(`\x1b[94m[Executing] ${command.join(" ")}\x1b[0m`);

    const proc = Bun.spawn(command, {
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0 && sourceFile) {
      console.log(`\x1b[31mTask Failed. Opening ${sourceFile} in editor...\x1b[0m`);
      Bun.openInEditor(sourceFile);
    }

    return exitCode;
  }

  /**
   * SAFE HTML TEMPLATE (Bun.escapeHTML)
   * Renders a template with escaped user input to prevent XSS.
   */
  static safeHTML(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      const escaped = Bun.escapeHTML(value);
      result = result.replaceAll(placeholder, escaped);
    }
    return result;
  }

  /**
   * STATE CHANGE DETECTOR (Bun.deepEquals)
   * Compares two states and returns changed keys with before/after values.
   */
  static diffState<T extends Record<string, unknown>>(
    previous: T,
    current: T
  ): Map<string, { before: unknown; after: unknown }> {
    const changes = new Map<string, { before: unknown; after: unknown }>();

    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

    for (const key of allKeys) {
      if (!Bun.deepEquals(previous[key], current[key])) {
        changes.set(key, {
          before: previous[key],
          after: current[key],
        });
      }
    }

    return changes;
  }

  /**
   * PROMISE STATUS MONITOR (Bun.peek.status)
   * Returns current status of promises without awaiting.
   */
  static getPromiseStatuses<T>(
    promises: Map<string, Promise<T>>
  ): Map<string, { status: string; value?: T; error?: unknown }> {
    const statuses = new Map<string, { status: string; value?: T; error?: unknown }>();

    for (const [name, promise] of promises) {
      const status = Bun.peek.status(promise);
      const entry: { status: string; value?: T; error?: unknown } = { status };

      if (status === "fulfilled") {
        entry.value = Bun.peek(promise) as T;
      } else if (status === "rejected") {
        entry.error = Bun.peek(promise);
      }

      statuses.set(name, entry);
    }

    return statuses;
  }

  /**
   * FILE NAVIGATION (Bun.openInEditor + Bun.resolveSync)
   * Opens a file at a specific line in the configured editor.
   */
  static openAt(file: string, line?: number, column?: number): void {
    const resolved = file.startsWith("/") ? file : Bun.resolveSync(file, process.cwd());

    Bun.openInEditor(resolved, { line, column });
  }

  /**
   * TIMING UTILITY (Bun.nanoseconds)
   * High-precision timing for performance measurements.
   */
  static time<T>(label: string, fn: () => T): T {
    const start = Bun.nanoseconds();
    const result = fn();
    const elapsed = (Bun.nanoseconds() - start) / 1_000_000;
    console.log(`\x1b[90m[${label}] ${elapsed.toFixed(2)}ms\x1b[0m`);
    return result;
  }

  static async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Bun.nanoseconds();
    const result = await fn();
    const elapsed = (Bun.nanoseconds() - start) / 1_000_000;
    console.log(`\x1b[90m[${label}] ${elapsed.toFixed(2)}ms\x1b[0m`);
    return result;
  }
}

// Re-export for convenience
export const { fastAll, renderResponsiveTable, debugTask, safeHTML, diffState, openAt, time, timeAsync } =
  BunToolkit;
