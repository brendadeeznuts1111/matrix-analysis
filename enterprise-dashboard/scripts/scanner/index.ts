/**
 * Bun Enterprise Scanner v3.1
 *
 * Self-contained scanner with embedded assets for compiled executables.
 * Generates HTML reports, supports PTY interactive fixes, and CDP-style profiling.
 *
 * Usage:
 *   bun scripts/scanner/index.ts [path]           # Scan directory
 *   bun scripts/scanner/index.ts --strict         # Errors only
 *   bun scripts/scanner/index.ts --interactive    # PTY fix sessions
 *   bun scripts/scanner/index.ts --profile        # Output timing profile
 *   bun scripts/scanner/index.ts --json           # JSON output for CI
 *   bun scripts/scanner/index.ts --html           # Generate HTML report
 *   bun scripts/scanner/index.ts --daemon         # Watch config for hot-reload
 *   bun scripts/scanner/index.ts --config <path>  # Custom config path
 *
 * Daemon Mode:
 *   Watches .scannerrc or scanner.config.json for changes and automatically
 *   reloads rules without process restart. Useful for tuning scan rules.
 *
 * Compile to standalone:
 *   bun build --compile --bytecode ./scripts/scanner/index.ts --outfile bun-scanner
 */

import { Glob, inspect, nanoseconds, randomUUIDv7, stringWidth } from "bun";
import { Assets, type RuleDefinition, type ScannerConfig } from "./assets";

// ============================================================================
// Types
// ============================================================================

interface ScanIssue {
  category: string;
  scope: string;
  type: string;
  message: string;
  fix: string;
  line: number;
  column?: number;
  severity: "error" | "warning" | "info";
}

interface ScanResult {
  filePath: string;
  issues: ScanIssue[];
  score: number;
  linesScanned: number;
}

interface ScanOptions {
  strict: boolean;
  interactive: boolean;
  profile: boolean;
  json: boolean;
  html: boolean;
  path: string;
  daemon: boolean;
  configPath: string;
}

interface ProfileData {
  traceId: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  filesScanned: number;
  issuesFound: number;
}

// ============================================================================
// Report Generator
// ============================================================================

class ReportGenerator {
  private template: string;

  constructor(template: string) {
    this.template = template;
  }

  async generate(
    results: ScanResult[],
    profile: ProfileData | null,
    outputPath = "./scan-report.html"
  ): Promise<void> {
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const totalLines = results.reduce((sum, r) => sum + r.linesScanned, 0);
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    const scoreClass = avgScore >= 90 ? "excellent" : avgScore >= 70 ? "good" : "poor";

    // Generate issue rows HTML
    const issueRows = results
      .filter((r) => r.issues.length > 0)
      .flatMap((r) =>
        r.issues.map(
          (issue) => `
          <tr>
            <td>${this.escapeHtml(r.filePath.split("/").pop() || r.filePath)}</td>
            <td>${issue.line}</td>
            <td><span class="severity ${issue.severity}">${issue.severity.toUpperCase()}</span></td>
            <td>${issue.category}</td>
            <td>${this.escapeHtml(issue.message)}</td>
            <td><code class="fix-suggestion">${this.escapeHtml(issue.fix)}</code></td>
          </tr>`
        )
      )
      .join("\n");

    // Replace template placeholders
    let html = this.template
      .replace("{{SCORE}}", String(avgScore))
      .replace("{{SCORE_CLASS}}", scoreClass)
      .replace("{{FILES_SCANNED}}", String(results.length))
      .replace("{{TOTAL_LINES}}", totalLines.toLocaleString())
      .replace("{{ISSUES_FOUND}}", String(totalIssues))
      .replace("{{DURATION_MS}}", profile?.durationMs?.toFixed(1) || "N/A")
      .replace("{{TRACE_ID}}", profile?.traceId || "N/A")
      .replace("{{TIMESTAMP}}", new Date().toISOString())
      .replace("{{RESULTS_JSON}}", JSON.stringify(results, null, 2));

    // Handle conditional sections
    if (totalIssues > 0) {
      html = html
        .replace("{{#IF_ISSUES}}", "")
        .replace("{{/IF_ISSUES}}", "")
        .replace(/\{\{#IF_NO_ISSUES\}\}[\s\S]*?\{\{\/IF_NO_ISSUES\}\}/g, "")
        .replace("{{ISSUES_ROWS}}", issueRows);
    } else {
      html = html
        .replace(/\{\{#IF_ISSUES\}\}[\s\S]*?\{\{\/IF_ISSUES\}\}/g, "")
        .replace("{{#IF_NO_ISSUES}}", "")
        .replace("{{/IF_NO_ISSUES}}", "");
    }

    await Bun.write(outputPath, html);
    console.log(`\x1b[32m[Report] Generated: ${outputPath}\x1b[0m`);
  }

  private escapeHtml(text: string): string {
    return Bun.escapeHTML(text);
  }
}

// ============================================================================
// Enhanced Scanner
// ============================================================================

class EnhancedScanner {
  private profile: ProfileData | null = null;
  private options: ScanOptions;
  private config: ScannerConfig | null = null;
  private rules: Array<RuleDefinition & { regex: RegExp }> = [];

  constructor(options: ScanOptions) {
    this.options = options;
  }

  /**
   * Initialize scanner with embedded assets
   */
  async init(): Promise<void> {
    this.config = await Assets.load.config();
    const ruleSet = await Assets.load.rules();

    // Compile regex patterns from rule definitions
    this.rules = ruleSet.rules
      .filter((r) => r.enabled)
      .filter((r) => {
        // Filter by config settings
        const cat = r.category.toLowerCase();
        if (cat === "deps" && !this.config?.rules.deps) return false;
        if (cat === "perf" && !this.config?.rules.perf) return false;
        if (cat === "compat" && !this.config?.rules.compat) return false;
        if (cat === "security" && !this.config?.rules.security) return false;
        return true;
      })
      .map((r) => ({
        ...r,
        regex: new RegExp(r.pattern, "i"),
      }));

    if (!this.options.json) {
      console.log(`\x1b[90m[Init] Loaded ${this.rules.length} rules from embedded assets\x1b[0m`);
    }
  }

  /**
   * Reload configuration without full restart (for daemon mode hot-reload)
   */
  async reloadConfig(): Promise<void> {
    const prevRuleCount = this.rules.length;
    this.config = await Assets.load.config(this.options.configPath);
    const ruleSet = await Assets.load.rules();

    this.rules = ruleSet.rules
      .filter((r) => r.enabled)
      .filter((r) => {
        const cat = r.category.toLowerCase();
        if (cat === "deps" && !this.config?.rules.deps) return false;
        if (cat === "perf" && !this.config?.rules.perf) return false;
        if (cat === "compat" && !this.config?.rules.compat) return false;
        if (cat === "security" && !this.config?.rules.security) return false;
        return true;
      })
      .map((r) => ({
        ...r,
        regex: new RegExp(r.pattern, "i"),
      }));

    console.log(
      `\x1b[36m[Hot-Reload] Config reloaded: ${prevRuleCount} → ${this.rules.length} rules\x1b[0m`
    );
  }

  /**
   * Process a single file
   */
  async processFile(filePath: string): Promise<ScanResult> {
    const content = await Bun.file(filePath).text();
    const lines = content.split("\n");
    const issues: ScanIssue[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const rule of this.rules) {
        // Skip non-errors in strict mode
        if (this.options.strict && rule.severity !== "error") continue;

        const match = line.match(rule.regex);
        if (match) {
          issues.push({
            category: rule.category,
            scope: rule.scope,
            type: rule.id,
            message: rule.message,
            fix: rule.fix,
            line: lineNum,
            column: match.index,
            severity: rule.severity,
          });
        }
      }
    }

    const score = Math.max(0, 100 - issues.length * 5);
    return { filePath, issues, score, linesScanned: lines.length };
  }

  /**
   * Interactive PTY fix session
   */
  async launchFixSession(filePath: string, issues: ScanIssue[]): Promise<void> {
    const editor = Bun.env.EDITOR || Bun.env.VISUAL || "vim";

    console.log(`\x1b[33m[Interactive] Opening ${filePath} with ${editor}...\x1b[0m`);
    console.log("\x1b[90mSuggested fixes:\x1b[0m");

    for (const issue of issues) {
      console.log(`  Line ${issue.line}: ${issue.message}`);
      console.log(`  \x1b[32m-> ${issue.fix}\x1b[0m`);
    }
    console.log("");

    await using terminal = new Bun.Terminal({
      cols: process.stdout.columns || 120,
      rows: process.stdout.rows || 40,
      data: (_, data) => process.stdout.write(data),
    });

    const firstLine = issues[0]?.line || 1;
    const proc = Bun.spawn([editor, `+${firstLine}`, filePath], { terminal });

    const onResize = () => terminal.resize(process.stdout.columns, process.stdout.rows);
    process.stdout.on("resize", onResize);

    await proc.exited;
    process.stdout.off("resize", onResize);
  }

  /**
   * Scan project
   */
  async scanProject(): Promise<ScanResult[]> {
    const startTime = nanoseconds();
    const traceId = randomUUIDv7("hex").slice(0, 8);

    if (this.options.profile) {
      this.profile = { traceId, startTime, filesScanned: 0, issuesFound: 0 };
    }

    const targetPath = this.options.path;
    const files: string[] = [];

    // Check if single file or directory
    const pathFile = Bun.file(targetPath);
    const isFile = (await pathFile.exists()) && targetPath.match(/\.(ts|tsx|js|jsx)$/);

    if (isFile) {
      files.push(targetPath);
    } else {
      const glob = new Glob("**/*.{ts,tsx,js,jsx}");
      const ignorePatterns = this.config?.ignore || ["node_modules", "dist"];

      for await (const file of glob.scan({ cwd: targetPath, onlyFiles: true })) {
        const shouldIgnore = ignorePatterns.some((p) => file.includes(p));
        if (shouldIgnore) continue;
        files.push(`${targetPath}/${file}`);
      }
    }

    if (!this.options.json) {
      console.log(`\x1b[1mScanning ${files.length} files...\x1b[0m\n`);
    }

    const results: ScanResult[] = [];

    for (const filePath of files) {
      const result = await this.processFile(filePath);
      results.push(result);

      if (this.options.interactive && result.issues.length > 0) {
        await this.launchFixSession(filePath, result.issues);
      }
    }

    if (this.profile) {
      const endTime = nanoseconds();
      this.profile.endTime = endTime;
      this.profile.durationMs = (endTime - this.profile.startTime) / 1_000_000;
      this.profile.filesScanned = files.length;
      this.profile.issuesFound = results.reduce((sum, r) => sum + r.issues.length, 0);
    }

    return results;
  }

  /**
   * Get profile data
   */
  getProfile(): ProfileData | null {
    return this.profile;
  }

  /**
   * Render dashboard output
   */
  renderDashboard(results: ScanResult[]): void {
    if (this.options.json) {
      console.log(JSON.stringify({ results, profile: this.profile }, null, 2));
      return;
    }

    const cols = process.stdout.columns || 80;
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m`);
    console.log("\x1b[1mScan Results\x1b[0m");
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m\n`);

    const withIssues = results.filter((r) => r.issues.length > 0);

    if (withIssues.length === 0) {
      console.log("\x1b[32mNo issues found.\x1b[0m\n");
    } else {
      const tableData = withIssues.map((r) => {
        const name = r.filePath.split("/").pop() || r.filePath;
        const truncatedName = stringWidth(name) > 30 ? name.slice(0, 27) + "..." : name;

        const errors = r.issues.filter((i) => i.severity === "error").length;
        const warnings = r.issues.filter((i) => i.severity === "warning").length;
        const infos = r.issues.filter((i) => i.severity === "info").length;

        return {
          File: truncatedName,
          Errors: errors > 0 ? `\x1b[31m${errors}\x1b[0m` : "0",
          Warnings: warnings > 0 ? `\x1b[33m${warnings}\x1b[0m` : "0",
          Info: infos > 0 ? `\x1b[36m${infos}\x1b[0m` : "0",
          Score:
            r.score >= 90
              ? `\x1b[32m${r.score}\x1b[0m`
              : r.score >= 70
                ? `\x1b[33m${r.score}\x1b[0m`
                : `\x1b[31m${r.score}\x1b[0m`,
          Status: r.score >= 90 ? "OK" : r.score >= 70 ? "~~" : "XX",
        };
      });

      console.log(inspect.table(tableData, undefined, { colors: true }));

      console.log("\n\x1b[1mIssue Details:\x1b[0m\n");

      for (const result of withIssues) {
        const fileName = result.filePath.split("/").pop();
        console.log(`\x1b[1m${fileName}\x1b[0m`);

        for (const issue of result.issues) {
          const severityColor =
            issue.severity === "error" ? "\x1b[31m" : issue.severity === "warning" ? "\x1b[33m" : "\x1b[36m";
          const severityIcon = issue.severity === "error" ? "X" : issue.severity === "warning" ? "!" : "i";

          console.log(`  ${severityColor}${severityIcon}\x1b[0m Line ${issue.line}: ${issue.message}`);
          console.log(`    \x1b[90m-> ${issue.fix}\x1b[0m`);
        }
        console.log("");
      }
    }

    // Summary
    const totalFiles = results.length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalFiles);
    const totalLines = results.reduce((sum, r) => sum + r.linesScanned, 0);

    const summaryData = [
      { Metric: "Files Scanned", Value: totalFiles },
      { Metric: "Total Lines", Value: totalLines },
      { Metric: "Issues Found", Value: totalIssues },
      { Metric: "Average Score", Value: `${avgScore}/100` },
    ];

    console.log(`\x1b[90m${"─".repeat(cols)}\x1b[0m`);
    console.log("\x1b[1mSummary\x1b[0m");
    console.log(inspect.table(summaryData, undefined, { colors: true }));

    if (this.profile) {
      console.log(
        `\n\x1b[90m[Profile] Trace: ${this.profile.traceId} | Duration: ${this.profile.durationMs?.toFixed(2)}ms\x1b[0m`
      );
    }
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse --config=path or --config path
  const configArgIdx = args.findIndex((a) => a === "--config" || a.startsWith("--config="));
  let configPath = "./scanner.config.json";
  if (configArgIdx !== -1) {
    const arg = args[configArgIdx];
    if (arg.includes("=")) {
      configPath = arg.split("=")[1];
    } else if (args[configArgIdx + 1]) {
      configPath = args[configArgIdx + 1];
    }
  }

  const options: ScanOptions = {
    strict: args.includes("--strict"),
    interactive: args.includes("--interactive"),
    profile: args.includes("--profile"),
    json: args.includes("--json"),
    html: args.includes("--html"),
    daemon: args.includes("--daemon") || args.includes("--watch"),
    configPath,
    path: args.find((a) => !a.startsWith("--")) || process.cwd(),
  };

  if (!options.path.startsWith("/")) {
    options.path = `${process.cwd()}/${options.path}`;
  }

  const scanner = new EnhancedScanner(options);
  await scanner.init();

  // Daemon mode: watch config file for changes and re-scan
  if (options.daemon) {
    console.log(`\x1b[1m🔄 Daemon Mode\x1b[0m - Watching ${configPath} for changes`);
    console.log(`\x1b[90m   Press Ctrl+C to exit\x1b[0m\n`);

    // Initial scan
    let results = await scanner.scanProject();
    scanner.renderDashboard(results);

    // Watch config file for changes
    const { watch } = await import("fs");
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    watch(configPath, async (eventType) => {
      if (eventType !== "change") return;

      // Debounce rapid changes (editors often write multiple times)
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log(`\n\x1b[36m🔄 Config changed, reloading...\x1b[0m`);
        try {
          await scanner.reloadConfig();
          results = await scanner.scanProject();
          scanner.renderDashboard(results);
        } catch (err) {
          console.error(`\x1b[31m[Hot-Reload] Failed to reload config:\x1b[0m`, (err as Error).message);
        }
      }, 100);
    });

    // Keep process alive
    await new Promise(() => {});
  }

  const results = await scanner.scanProject();

  // Generate HTML report if requested
  if (options.html) {
    const template = await Assets.load.template();
    const generator = new ReportGenerator(template);
    await generator.generate(results, scanner.getProfile());
  }

  scanner.renderDashboard(results);

  // Exit with error code if issues found in strict mode
  if (options.strict) {
    const hasErrors = results.some((r) => r.issues.some((i) => i.severity === "error"));
    if (hasErrors) process.exit(1);
  }
}

main().catch((err) => {
  console.error("\x1b[31mScan failed:\x1b[0m", err.message);
  process.exit(1);
});

export { EnhancedScanner, ReportGenerator };
export type { ScanIssue, ScanResult, ScanOptions };
