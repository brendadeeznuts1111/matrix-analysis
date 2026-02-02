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
  const result = await $`${cmd.reduce((acc, part, i) => acc + (args[i - 1] || "") + part)}`.text();
  return result.trim();
};

export const shQuiet = async (
  cmd: TemplateStringsArray,
  ...args: string[]
): Promise<string> => {
  const result = await $`${cmd.reduce((acc, part, i) => acc + (args[i - 1] || "") + part)}`
    .quiet()
    .text();
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
