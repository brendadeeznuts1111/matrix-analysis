// lib/shell.ts - Safe shell execution with structured output capture
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps Bun shell APIs with error-safe patterns and structured results
// ═══════════════════════════════════════════════════════════════════════════════

import { $ } from "bun";

// ─────────────────────────────────────────────────────────────────────────────
// BN-020: Command Runner
// ─────────────────────────────────────────────────────────────────────────────
export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  ok: boolean;
}

export const run = async (cmd: string[]): Promise<RunResult> => {
  try {
    const proc = Bun.spawnSync(cmd, {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = proc.stdout.toString();
    const stderr = proc.stderr.toString();
    const exitCode = proc.exitCode;
    return { stdout, stderr, exitCode, ok: exitCode === 0 };
  } catch {
    return { stdout: "", stderr: "spawn failed", exitCode: 1, ok: false };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-021: Shell Template Helper
// ─────────────────────────────────────────────────────────────────────────────
export const sh = async (
  cmd: TemplateStringsArray,
  ...args: string[]
): Promise<string> => {
  const fullCmd = cmd.reduce((acc, part, i) => acc + (args[i - 1] || "") + part);
  const result = await $`sh -c ${fullCmd}`.text();
  return result.trim();
};

export const shQuiet = async (
  cmd: TemplateStringsArray,
  ...args: string[]
): Promise<string> => {
  const fullCmd = cmd.reduce((acc, part, i) => acc + (args[i - 1] || "") + part);
  const result = await $`sh -c ${fullCmd}`.quiet().text();
  return result.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-022: Output Parsers
// ─────────────────────────────────────────────────────────────────────────────
export const lines = (output: string): string[] =>
  output.split("\n").map((l) => l.trim()).filter(Boolean);

export const jsonOut = <T>(output: string): T | null => {
  try {
    return JSON.parse(output) as T;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-023: Which
// ─────────────────────────────────────────────────────────────────────────────
export const which = (bin: string): string | null => {
  try {
    return Bun.which(bin);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-113: Spawn (async process with streaming)
// ─────────────────────────────────────────────────────────────────────────────
export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  stdin?: "inherit" | "pipe" | "ignore" | null;
  stdout?: "inherit" | "pipe" | "ignore" | null;
  stderr?: "inherit" | "pipe" | "ignore" | null;
}

export const spawn = (
  cmd: string[],
  options?: SpawnOptions
): Subprocess | null => {
  try {
    return Bun.spawn(cmd, {
      cwd: options?.cwd,
      env: options?.env,
      stdin: options?.stdin ?? "ignore",
      stdout: options?.stdout ?? "pipe",
      stderr: options?.stderr ?? "pipe",
    });
  } catch {
    return null;
  }
};

export const spawnAndWait = async (
  cmd: string[],
  options?: SpawnOptions
): Promise<RunResult> => {
  try {
    const proc = Bun.spawn(cmd, {
      cwd: options?.cwd,
      env: options?.env,
      stdin: options?.stdin ?? "ignore",
      stdout: options?.stdout ?? "pipe",
      stderr: options?.stderr ?? "pipe",
    });
    const exitCode = await proc.exited;
    const stdout = proc.stdout
      ? await Bun.readableStreamToText(proc.stdout as ReadableStream)
      : "";
    const stderr = proc.stderr
      ? await Bun.readableStreamToText(proc.stderr as ReadableStream)
      : "";
    return { stdout, stderr, exitCode, ok: exitCode === 0 };
  } catch {
    return { stdout: "", stderr: "spawn failed", exitCode: 1, ok: false };
  }
};

type Subprocess = ReturnType<typeof Bun.spawn>;
