/**
 * Bun Enterprise Scanner - Production Build
 *
 * Self-contained scanner with:
 * - SQLite rules database (embeddable)
 * - Live dashboard server
 * - HTML report generation
 * - CDP-style profiling
 *
 * Compile to standalone:
 *   bun build --compile --bytecode ./scripts/scanner/production.ts --outfile bun-scanner
 */

import { Database } from "bun:sqlite";
import { Glob, inspect, nanoseconds, randomUUIDv7, stringWidth } from "bun";

// ============================================================================
// Asset Paths (resolved at build time for embedding)
// ============================================================================

const SCANNER_DIR = new URL(".", import.meta.url).pathname;
const RULES_DB_PATH = `${SCANNER_DIR}assets/rules.db`;
const DASHBOARD_TEMPLATE_PATH = `${SCANNER_DIR}templates/dashboard.html`;
const REPORT_TEMPLATE_PATH = `${SCANNER_DIR}templates/report.html`;

// ============================================================================
// Types
// ============================================================================

interface LintRule {
  id: number;
  name: string;
  pattern: string;
  category: string;
  scope: string;
  suggestion: string;
  severity: "error" | "warning" | "info";
  enabled: number;
}

interface ScanIssue {
  file: string;
  line: number;
  column?: number;
  rule: string;
  category: string;
  message: string;
  fix: string;
  severity: "error" | "warning" | "info";
}

interface FileResult {
  path: string;
  shortName: string;
  lines: number;
  issues: ScanIssue[];
  score: number;
}

interface ScanSummary {
  traceId: string;
  sessionId: string;
  filesScanned: number;
  totalLines: number;
  issuesFound: number;
  errors: number;
  warnings: number;
  infos: number;
  score: number;
  durationMs: number;
  timestamp: string;
}

interface ScanOptions {
  path: string;
  strict: boolean;
  interactive: boolean;
  profile: boolean;
  json: boolean;
  html: boolean;
  serve: boolean;
  port: number;
}

// ============================================================================
// Rules Database
// ============================================================================

class RulesDatabase {
  private db: Database;
  private rules: Array<LintRule & { regex: RegExp }> = [];

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true });
    this.loadRules();
  }

  private loadRules(): void {
    const rows = this.db.query<LintRule, []>("SELECT * FROM lint_rules WHERE enabled = 1").all();

    this.rules = rows.map((rule) => ({
      ...rule,
      regex: new RegExp(rule.pattern, "i"),
    }));
  }

  getRules(options?: { category?: string; severity?: string }): Array<LintRule & { regex: RegExp }> {
    let filtered = this.rules;

    if (options?.category) {
      filtered = filtered.filter((r) => r.category === options.category);
    }

    if (options?.severity) {
      filtered = filtered.filter((r) => r.severity === options.severity);
    }

    return filtered;
  }

  getRuleCount(): number {
    return this.rules.length;
  }

  getCategories(): string[] {
    return [...new Set(this.rules.map((r) => r.category))];
  }

  close(): void {
    this.db.close();
  }
}

// ============================================================================
// Dashboard Server
// ============================================================================

class DashboardServer {
  private template: string;
  private results: FileResult[] = [];
  private summary: ScanSummary | null = null;

  constructor(templatePath: string) {
    this.template = Bun.file(templatePath).text() as unknown as string;
  }

  async init(): Promise<void> {
    this.template = await Bun.file(DASHBOARD_TEMPLATE_PATH).text();
  }

  setResults(results: FileResult[], summary: ScanSummary): void {
    this.results = results;
    this.summary = summary;
  }

  start(port: number): ReturnType<typeof Bun.serve> {
    const self = this;

    return Bun.serve({
      port,
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/" || url.pathname === "/dashboard") {
          return new Response(self.renderDashboard(), {
            headers: { "Content-Type": "text/html" },
          });
        }

        if (url.pathname === "/api/results") {
          return Response.json({
            results: self.results,
            summary: self.summary,
          });
        }

        if (url.pathname === "/api/summary") {
          return Response.json(self.summary);
        }

        return new Response("Not Found", { status: 404 });
      },
    });
  }

  private renderDashboard(): string {
    if (!this.summary) return "<h1>No scan results</h1>";

    // Generate issues table HTML
    const allIssues = this.results.flatMap((r) => r.issues);
    const issuesHTML =
      allIssues.length > 0
        ? `<table>
          <thead>
            <tr>
              <th>File</th>
              <th>Line</th>
              <th>Severity</th>
              <th>Category</th>
              <th>Rule</th>
              <th>Suggested Fix</th>
            </tr>
          </thead>
          <tbody>
            ${allIssues
              .map(
                (issue) => `
              <tr data-severity="${issue.severity}">
                <td>${Bun.escapeHTML(issue.file)}</td>
                <td>${issue.line}</td>
                <td><span class="severity-badge ${issue.severity}">${issue.severity}</span></td>
                <td><span class="category-badge">${issue.category}</span></td>
                <td>${Bun.escapeHTML(issue.message)}</td>
                <td><code class="fix-code">${Bun.escapeHTML(issue.fix)}</code></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>`
        : `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h2>No Issues Found</h2>
          <p>Your codebase passes all checks.</p>
        </div>`;

    // Generate files table HTML
    const filesHTML = `<table>
      <thead>
        <tr>
          <th>File</th>
          <th>Lines</th>
          <th>Issues</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        ${this.results
          .filter((r) => r.issues.length > 0)
          .slice(0, 20)
          .map(
            (r) => `
          <tr>
            <td>${Bun.escapeHTML(r.shortName)}</td>
            <td>${r.lines}</td>
            <td>${r.issues.length}</td>
            <td>${r.score}/100</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>`;

    return this.template
      .replace(/\{\{TRACE_ID\}\}/g, this.summary.traceId)
      .replace(/\{\{SESSION_ID\}\}/g, this.summary.sessionId)
      .replace(/\{\{SCORE\}\}/g, String(this.summary.score))
      .replace(/\{\{FILES_SCANNED\}\}/g, String(this.summary.filesScanned))
      .replace(/\{\{TOTAL_LINES\}\}/g, this.summary.totalLines.toLocaleString())
      .replace(/\{\{ISSUES_FOUND\}\}/g, String(this.summary.issuesFound))
      .replace(/\{\{ERRORS\}\}/g, String(this.summary.errors))
      .replace(/\{\{WARNINGS\}\}/g, String(this.summary.warnings))
      .replace(/\{\{DURATION_MS\}\}/g, this.summary.durationMs.toFixed(1))
      .replace(/\{\{TIMESTAMP\}\}/g, this.summary.timestamp)
      .replace(/\{\{ISSUES_TABLE\}\}/g, issuesHTML)
      .replace(/\{\{FILES_TABLE\}\}/g, filesHTML)
      .replace(/\{\{RESULTS_JSON\}\}/g, JSON.stringify(this.results));
  }
}

// ============================================================================
// Production Scanner
// ============================================================================

class ProductionScanner {
  private rulesDb: RulesDatabase;
  private dashboard: DashboardServer;
  private options: ScanOptions;
  private startTime: number = 0;
  private traceId: string = "";
  private sessionId: string = "";

  constructor(options: ScanOptions) {
    this.options = options;
    this.rulesDb = new RulesDatabase(RULES_DB_PATH);
    this.dashboard = new DashboardServer(DASHBOARD_TEMPLATE_PATH);
  }

  async init(): Promise<void> {
    await this.dashboard.init();

    if (!this.options.json) {
      const ruleCount = this.rulesDb.getRuleCount();
      const categories = this.rulesDb.getCategories();
      console.log(`\x1b[90m[Init] Loaded ${ruleCount} rules from SQLite DB\x1b[0m`);
      console.log(`\x1b[90m[Init] Categories: ${categories.join(", ")}\x1b[0m`);
    }
  }

  async scan(): Promise<{ results: FileResult[]; summary: ScanSummary }> {
    this.startTime = nanoseconds();
    this.traceId = randomUUIDv7("hex").slice(0, 8);
    this.sessionId = randomUUIDv7("base64url").slice(0, 16);

    const targetPath = this.options.path;
    const files: string[] = [];

    // Check if single file or directory
    const isFile = (await Bun.file(targetPath).exists()) && targetPath.match(/\.(ts|tsx|js|jsx)$/);

    if (isFile) {
      files.push(targetPath);
    } else {
      const glob = new Glob("**/*.{ts,tsx,js,jsx}");
      for await (const file of glob.scan({ cwd: targetPath, onlyFiles: true })) {
        if (file.includes("node_modules") || file.includes("/dist/")) continue;
        files.push(`${targetPath}/${file}`);
      }
    }

    if (!this.options.json) {
      console.log(`\x1b[1mScanning ${files.length} files...\x1b[0m\n`);
    }

    const rules = this.rulesDb.getRules(this.options.strict ? { severity: "error" } : undefined);
    const results: FileResult[] = [];

    for (const filePath of files) {
      const result = await this.processFile(filePath, rules);
      results.push(result);

      // Interactive mode
      if (this.options.interactive && result.issues.length > 0) {
        await this.launchFixSession(filePath, result.issues);
      }
    }

    const endTime = nanoseconds();
    const durationMs = (endTime - this.startTime) / 1_000_000;

    const summary: ScanSummary = {
      traceId: this.traceId,
      sessionId: this.sessionId,
      filesScanned: files.length,
      totalLines: results.reduce((sum, r) => sum + r.lines, 0),
      issuesFound: results.reduce((sum, r) => sum + r.issues.length, 0),
      errors: results.reduce((sum, r) => sum + r.issues.filter((i) => i.severity === "error").length, 0),
      warnings: results.reduce((sum, r) => sum + r.issues.filter((i) => i.severity === "warning").length, 0),
      infos: results.reduce((sum, r) => sum + r.issues.filter((i) => i.severity === "info").length, 0),
      score: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length),
      durationMs,
      timestamp: new Date().toISOString(),
    };

    return { results, summary };
  }

  private async processFile(filePath: string, rules: Array<LintRule & { regex: RegExp }>): Promise<FileResult> {
    const content = await Bun.file(filePath).text();
    const lines = content.split("\n");
    const issues: ScanIssue[] = [];
    const shortName = filePath.split("/").pop() || filePath;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const rule of rules) {
        const match = line.match(rule.regex);
        if (match) {
          issues.push({
            file: shortName,
            line: lineNum,
            column: match.index,
            rule: rule.name,
            category: rule.category,
            message: rule.suggestion,
            fix: rule.suggestion,
            severity: rule.severity,
          });
        }
      }
    }

    const score = Math.max(0, 100 - issues.length * 5);

    return { path: filePath, shortName, lines: lines.length, issues, score };
  }

  private async launchFixSession(filePath: string, issues: ScanIssue[]): Promise<void> {
    const editor = Bun.env.EDITOR || Bun.env.VISUAL || "vim";

    console.log(`\x1b[33m[Interactive] Opening ${filePath}...\x1b[0m`);

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

  async startDashboard(results: FileResult[], summary: ScanSummary): Promise<void> {
    this.dashboard.setResults(results, summary);
    const server = this.dashboard.start(this.options.port);

    console.log(`\n\x1b[32m[Dashboard] Running at http://localhost:${server.port}\x1b[0m`);
    console.log(`\x1b[90mPress Ctrl+C to stop\x1b[0m\n`);
  }

  renderConsole(results: FileResult[], summary: ScanSummary): void {
    if (this.options.json) {
      console.log(JSON.stringify({ results, summary }, null, 2));
      return;
    }

    const cols = process.stdout.columns || 80;
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m`);
    console.log(`\x1b[1mScan Results\x1b[0m  \x1b[90mTrace: ${summary.traceId}\x1b[0m`);
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m\n`);

    const withIssues = results.filter((r) => r.issues.length > 0);

    if (withIssues.length === 0) {
      console.log("\x1b[32mNo issues found.\x1b[0m\n");
    } else {
      const tableData = withIssues.map((r) => ({
        File: stringWidth(r.shortName) > 30 ? r.shortName.slice(0, 27) + "..." : r.shortName,
        Errors: r.issues.filter((i) => i.severity === "error").length || "-",
        Warnings: r.issues.filter((i) => i.severity === "warning").length || "-",
        Info: r.issues.filter((i) => i.severity === "info").length || "-",
        Score: r.score >= 90 ? `\x1b[32m${r.score}\x1b[0m` : r.score >= 70 ? `\x1b[33m${r.score}\x1b[0m` : `\x1b[31m${r.score}\x1b[0m`,
      }));

      console.log(inspect.table(tableData, undefined, { colors: true }));
    }

    // Summary
    const summaryData = [
      { Metric: "Files Scanned", Value: summary.filesScanned },
      { Metric: "Total Lines", Value: summary.totalLines.toLocaleString() },
      { Metric: "Issues Found", Value: summary.issuesFound },
      { Metric: "Health Score", Value: `${summary.score}/100` },
      { Metric: "Duration", Value: `${summary.durationMs.toFixed(2)}ms` },
    ];

    console.log(`\n\x1b[90m${"─".repeat(cols)}\x1b[0m`);
    console.log("\x1b[1mSummary\x1b[0m");
    console.log(inspect.table(summaryData, undefined, { colors: true }));
  }

  async generateHtmlReport(results: FileResult[], summary: ScanSummary): Promise<void> {
    const template = await Bun.file(REPORT_TEMPLATE_PATH).text();

    // Use same rendering logic as dashboard
    this.dashboard.setResults(results, summary);

    const html = template
      .replace(/\{\{SCORE\}\}/g, String(summary.score))
      .replace(/\{\{SCORE_CLASS\}\}/g, summary.score >= 90 ? "excellent" : summary.score >= 70 ? "good" : "poor")
      .replace(/\{\{FILES_SCANNED\}\}/g, String(summary.filesScanned))
      .replace(/\{\{TOTAL_LINES\}\}/g, summary.totalLines.toLocaleString())
      .replace(/\{\{ISSUES_FOUND\}\}/g, String(summary.issuesFound))
      .replace(/\{\{DURATION_MS\}\}/g, summary.durationMs.toFixed(1))
      .replace(/\{\{TRACE_ID\}\}/g, summary.traceId)
      .replace(/\{\{TIMESTAMP\}\}/g, summary.timestamp)
      .replace(/\{\{RESULTS_JSON\}\}/g, JSON.stringify(results));

    await Bun.write("./scan-report.html", html);
    console.log(`\x1b[32m[Report] Generated: ./scan-report.html\x1b[0m`);
  }

  cleanup(): void {
    this.rulesDb.close();
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options: ScanOptions = {
    path: args.find((a) => !a.startsWith("--")) || process.cwd(),
    strict: args.includes("--strict"),
    interactive: args.includes("--interactive"),
    profile: args.includes("--profile"),
    json: args.includes("--json"),
    html: args.includes("--html"),
    serve: args.includes("--serve"),
    port: parseInt(args.find((a) => a.startsWith("--port="))?.split("=")[1] || "0") || 0,
  };

  // Resolve relative path
  if (!options.path.startsWith("/")) {
    options.path = `${process.cwd()}/${options.path}`;
  }

  const scanner = new ProductionScanner(options);

  try {
    await scanner.init();
    const { results, summary } = await scanner.scan();

    // Generate HTML report if requested
    if (options.html) {
      await scanner.generateHtmlReport(results, summary);
    }

    // Start dashboard server if requested
    if (options.serve) {
      await scanner.startDashboard(results, summary);
      // Keep process alive
      await new Promise(() => {});
    } else {
      scanner.renderConsole(results, summary);
    }

    // Exit with error code in strict mode
    if (options.strict && summary.errors > 0) {
      process.exit(1);
    }
  } finally {
    scanner.cleanup();
  }
}

main().catch((err) => {
  console.error("\x1b[31mScan failed:\x1b[0m", err.message);
  process.exit(1);
});

export { ProductionScanner, RulesDatabase, DashboardServer };
export type { LintRule, ScanIssue, FileResult, ScanSummary, ScanOptions };
