#!/usr/bin/env bun
/**
 * Tier-1380 System Information Summary
 * Comprehensive overview of all infrastructure components
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";

// ─── Glyphs ───────────────────────────────────────
const GLYPHS = {
  DRIFT: "▵⟂⥂",
  COHERENCE: "⥂⟂(▵⟜⟳)",
  LOCKED: "⟳⟲⟜(▵⊗⥂)",
  AUDIT: "⊟",
  RUN: "▶",
  LOCK: "🔒",
};

// ─── Color Helpers ────────────────────────────────
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[39m`,
  red: (s: string) => `\x1b[31m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  dim: (s: string) => `\x1b[90m${s}\x1b[39m`,
};

// ─── Component Checkers ───────────────────────────
async function checkPort(port: number, host = "127.0.0.1"): Promise<boolean> {
  try {
    const conn = await Bun.connect({ hostname: host, port });
    conn.end();
    return true;
  } catch {
    return false;
  }
}

async function getOpenClawInfo() {
  const configPath = `${process.env.HOME}/.openclaw/openclaw.json`;
  const config = existsSync(configPath)
    ? await Bun.file(configPath).json().catch(() => null)
    : null;

  return {
    version: "v2026.1.30",
    running: await checkPort(18789),
    port: 18789,
    tailscale: "nolas-mac-mini.tailb53dda.ts.net",
    config: config ? "✓" : "✗",
  };
}

async function getMatrixAgentInfo() {
  const configPath = `${process.env.HOME}/.matrix/agent/config.json`;
  const config = existsSync(configPath)
    ? await Bun.file(configPath).json().catch(() => null)
    : null;

  return {
    version: config?.version || "v1.0.0",
    name: config?.name || "matrix-agent",
    model: config?.agents?.defaults?.model?.primary || "unknown",
    config: config ? "✓" : "✗",
  };
}

async function getProfileInfo() {
  const profilesDir = `${process.env.HOME}/.matrix/profiles`;
  const profiles: string[] = [];

  if (existsSync(profilesDir)) {
    for await (const entry of new Bun.Glob("*.json").scan(profilesDir)) {
      profiles.push(entry.replace(".json", ""));
    }
  }

  return {
    count: profiles.length,
    profiles: profiles.slice(0, 5),
    all: profiles,
  };
}

async function getAuditInfo() {
  const dbPath = "./data/tier1380.db";
  if (!existsSync(dbPath)) {
    return { violations: 0, executions: 0, packages: 0 };
  }

  try {
    const db = new Database(dbPath, { readonly: true });
    const violations = (db.query("SELECT COUNT(*) as c FROM violations").get() as any).c;
    const executions = (db.query("SELECT COUNT(*) as c FROM executions").get() as any).c;
    const packages = (db.query("SELECT COUNT(*) as c FROM packages").get() as any).c;
    db.close();

    return { violations, executions, packages };
  } catch {
    return { violations: 0, executions: 0, packages: 0 };
  }
}

async function getCronInfo() {
  try {
    const result = await $`crontab -l 2>/dev/null || echo ""`;
    const jobs = result.stdout.trim().split("\n").filter(l => l.trim() && !l.startsWith("#"));
    return { count: jobs.length, jobs: jobs.slice(0, 3) };
  } catch {
    return { count: 0, jobs: [] };
  }
}

async function getBunInfo() {
  return {
    version: Bun.version,
    revision: Bun.revision,
    mem: "N/A", // Bun.memoryUsage not available in v1.3.7
  };
}

// ─── Main Display ─────────────────────────────────
async function main() {
  console.log(c.bold(`\n${GLYPHS.DRIFT} Tier-1380 System Information Summary\n`));

  // Header
  console.log(c.dim("-".repeat(70)));
  console.log(c.bold("  Runtime Environment"));
  console.log(c.dim("-".repeat(70)));

  const bun = await getBunInfo();
  console.log(`  Bun Version:     ${c.cyan(bun.version)} (${bun.revision.slice(0, 8)})`);
  console.log(`  Memory Usage:    ${bun.mem}`);
  console.log(`  Working Dir:     ${process.cwd()}`);
  console.log(`  Home Dir:        ${process.env.HOME}`);

  // OpenClaw
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.bold("  OpenClaw Gateway"));
  console.log(c.dim("-".repeat(70)));

  const openclaw = await getOpenClawInfo();
  const status = openclaw.running ? c.green("● Running") : c.red("● Stopped");
  console.log(`  Status:          ${status}`);
  console.log(`  Version:         ${openclaw.version}`);
  console.log(`  Local Port:      ${openclaw.port}`);
  console.log(`  Tailscale:       ${openclaw.tailscale}`);
  console.log(`  Config:          ${openclaw.config === "✓" ? c.green(openclaw.config) : c.red(openclaw.config)}`);

  // Matrix Agent
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.bold("  Matrix Agent"));
  console.log(c.dim("-".repeat(70)));

  const agent = await getMatrixAgentInfo();
  console.log(`  Name:            ${agent.name}`);
  console.log(`  Version:         ${agent.version}`);
  console.log(`  Config:          ${agent.config === "✓" ? c.green(agent.config) : c.red(agent.config)}`);
  console.log(`  Primary Model:   ${c.dim(agent.model)}`);

  // Profiles
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.bold("  Environment Profiles"));
  console.log(c.dim("-".repeat(70)));

  const profiles = await getProfileInfo();
  console.log(`  Total Profiles:  ${profiles.count}`);
  if (profiles.count > 0) {
    console.log(`  Recent:          ${profiles.profiles.join(", ")}${profiles.count > 5 ? " …" : ""}`);
  }

  // Audit System
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.bold("  Tier-1380 Audit System"));
  console.log(c.dim("-".repeat(70)));

  const audit = await getAuditInfo();
  const vColor = audit.violations > 0 ? c.yellow(String(audit.violations)) : c.green("0");
  console.log(`  Col-89 Violations:  ${vColor}`);
  console.log(`  Secure Executions:  ${audit.executions}`);
  console.log(`  Packages Verified:  ${audit.packages}`);

  // Cron Jobs
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.bold("  Scheduled Tasks (Cron)"));
  console.log(c.dim("-".repeat(70)));

  const cron = await getCronInfo();
  console.log(`  Active Jobs:     ${cron.count}`);
  if (cron.jobs.length > 0) {
    cron.jobs.forEach((job, i) => {
      const cmd = job.length > 50 ? job.slice(0, 47) + "…" : job;
      console.log(`  ${i + 1}. ${c.dim(cmd)}`);
    });
    if (cron.count > 3) console.log(`     … and ${cron.count - 3} more`);
  }

  // Quick Links
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.bold("  Quick Commands"));
  console.log(c.dim("-".repeat(70)));

  console.log(`  ${c.cyan("bun run tier1380:sysinfo")}        Show this summary`);
  console.log(`  ${c.cyan("bun run matrix:openclaw:status")}  Check OpenClaw status`);
  console.log(`  ${c.cyan("bun run tier1380:audit db")}       View audit database`);
  console.log(`  ${c.cyan("bun run tier1380:exec:stats")}    View execution stats`);
  console.log(`  ${c.cyan("bun run mcp:status")}            Run MCP health check`);

  // Footer
  console.log(c.dim("\n─".repeat(70)));
  console.log(c.dim(`  ${GLYPHS.LOCKED} Tier-1380 OMEGA System v1.0.0`));
  console.log(c.dim("─".repeat(70) + "\n"));
}

// Shell helper
async function $(strings: TemplateStringsArray, ...values: any[]) {
  const cmd = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  const proc = Bun.spawn(["bash", "-c", cmd], { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { stdout, stderr, exitCode: proc.exitCode };
}

if (import.meta.main) {
  main().catch(console.error);
}

export { getOpenClawInfo, getMatrixAgentInfo, getProfileInfo, getAuditInfo };
