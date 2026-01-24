/**
 * Bun Enterprise Scanner v3.0 + Annotation Engine
 *
 * Auto-generates [DOMAIN][SCOPE]... tags + Interactive PTY Fixes
 * Production-grade linter with CDP-style profiling.
 *
 * Usage:
 *   bun scripts/scan.ts [path]              # Scan directory
 *   bun scripts/scan.ts --strict            # Errors only (no warnings)
 *   bun scripts/scan.ts --interactive       # PTY fix sessions
 *   bun scripts/scan.ts --profile           # Output timing profile
 *   bun scripts/scan.ts --json              # JSON output for CI
 */

import { $, Glob, inspect, nanoseconds, randomUUIDv7, stringWidth } from "bun";

// ============================================================================
// Types
// ============================================================================

interface ScanIssue {
  category: "DEPS" | "PERF" | "COMPAT" | "STYLE" | "SECURITY";
  scope: "IMPORT" | "EXPORT" | "GLOBAL" | "LOCAL" | "MODULE";
  type: string;
  message: string;
  fix: string;
  line: number;
  column?: number;
  severity: "error" | "warning" | "info";
}

interface Annotation {
  tag: string;
  line: number;
  recommendation: string;
}

interface ScanResult {
  filePath: string;
  issues: ScanIssue[];
  annotations: Annotation[];
  score: number;
  linesScanned: number;
}

interface ScanOptions {
  strict: boolean;
  interactive: boolean;
  profile: boolean;
  json: boolean;
  path: string;
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
// Scan Rules
// ============================================================================

const RULES: Array<{
  id: string;
  category: ScanIssue["category"];
  scope: ScanIssue["scope"];
  pattern: RegExp;
  message: string;
  fix: string;
  severity: ScanIssue["severity"];
}> = [
  // DEPS - Node.js compatibility patterns
  {
    id: "node-fs",
    category: "DEPS",
    scope: "IMPORT",
    pattern: /import\s+(?:\*\s+as\s+)?(?:fs|\{[^}]*\})\s+from\s+["'](?:node:)?fs["']/,
    message: "Node.js fs import - consider Bun.file()",
    fix: "Bun.file().text() / .json() / .bytes()",
    severity: "warning",
  },
  {
    id: "node-child-process",
    category: "DEPS",
    scope: "IMPORT",
    pattern: /import\s+(?:\*\s+as\s+)?(?:child_process|\{[^}]*\})\s+from\s+["'](?:node:)?child_process["']/,
    message: "Node.js child_process - use Bun.spawn() or Bun.$",
    fix: "Bun.spawn() or $`command`",
    severity: "warning",
  },
  {
    id: "node-fetch",
    category: "DEPS",
    scope: "IMPORT",
    pattern: /import\s+(?:fetch|nodeFetch)\s+from\s+["']node-fetch["']/,
    message: "node-fetch package - native fetch() available",
    fix: "Use global fetch()",
    severity: "warning",
  },
  {
    id: "express",
    category: "DEPS",
    scope: "IMPORT",
    pattern: /import\s+(?:express|\{[^}]*\})\s+from\s+["']express["']/,
    message: "Express.js - consider Bun.serve() for better performance",
    fix: "Bun.serve({ fetch(req) { ... } })",
    severity: "info",
  },

  // PERF - Performance patterns
  {
    id: "json-parse-fs",
    category: "PERF",
    scope: "GLOBAL",
    pattern: /JSON\.parse\(\s*(?:fs\.readFileSync|await\s+fs\.promises\.readFile)/,
    message: "JSON.parse(fs.read...) - use Bun.file().json()",
    fix: "await Bun.file(path).json()",
    severity: "warning",
  },
  {
    id: "sync-file-read",
    category: "PERF",
    scope: "GLOBAL",
    pattern: /fs\.readFileSync\(/,
    message: "Synchronous file read - prefer async Bun.file()",
    fix: "await Bun.file(path).text()",
    severity: "warning",
  },

  // COMPAT - Cross-runtime compatibility
  {
    id: "process-env-direct",
    category: "COMPAT",
    scope: "GLOBAL",
    pattern: /process\.env\.\w+\s*(?:===?|!==?)\s*(?:undefined|null)/,
    message: "Direct env check - use Bun.env for type safety",
    fix: "Bun.env.VAR_NAME",
    severity: "info",
  },

  // SECURITY - Security patterns
  {
    id: "eval-usage",
    category: "SECURITY",
    scope: "GLOBAL",
    // Match eval( at word boundary, excluding common false positives
    pattern: /(?:^|[^"'`])(?<!\w)eval\s*\(/,
    message: "eval() usage detected - security risk",
    fix: "Use Function constructor or safer alternatives",
    severity: "error",
  },
  {
    id: "hardcoded-secret",
    category: "SECURITY",
    scope: "GLOBAL",
    pattern: /(?:password|secret|api_?key|token)\s*[:=]\s*["'][^"']{8,}["']/i,
    message: "Potential hardcoded secret detected",
    fix: "Use environment variables: Bun.env.SECRET_NAME",
    severity: "error",
  },
];

// ============================================================================
// EnhancedScanner Class
// ============================================================================

class EnhancedScanner {
  private profile: ProfileData | null = null;
  private options: ScanOptions;

  constructor(options: ScanOptions) {
    this.options = options;
  }

  /**
   * Generate annotation tag from issue
   */
  private generateAnnotation(issue: ScanIssue): Annotation {
    const meta = issue.fix ? `META:{fix:${issue.fix}}` : "";
    const tag = `[${issue.category}][${issue.scope}][${issue.type.toUpperCase()}]${meta ? `[${meta}]` : ""}[BUN-NATIVE]`;

    return {
      tag,
      line: issue.line,
      recommendation: issue.fix,
    };
  }

  /**
   * Inject annotation comments into source
   */
  suggestAnnotations(content: string, issues: ScanIssue[]): string {
    if (issues.length === 0) return content;

    const lines = content.split("\n");
    // Sort by line descending to avoid offset issues
    const sorted = [...issues].sort((a, b) => b.line - a.line);

    for (const issue of sorted) {
      const annotation = this.generateAnnotation(issue);
      const insertLine = Math.max(0, issue.line - 1);
      const indent = lines[insertLine]?.match(/^(\s*)/)?.[1] || "";
      lines.splice(insertLine, 0, `${indent}// ${annotation.tag}`);
    }

    return lines.join("\n");
  }

  /**
   * Interactive PTY fix session using Bun.Terminal
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

    // Use Bun.Terminal for full PTY support
    await using terminal = new Bun.Terminal({
      cols: process.stdout.columns || 120,
      rows: process.stdout.rows || 40,
      data: (_, data) => process.stdout.write(data),
    });

    // Open at first issue line
    const firstLine = issues[0]?.line || 1;
    const proc = Bun.spawn([editor, `+${firstLine}`, filePath], { terminal });

    // Handle terminal resize
    const onResize = () => terminal.resize(process.stdout.columns, process.stdout.rows);
    process.stdout.on("resize", onResize);

    await proc.exited;
    process.stdout.off("resize", onResize);
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
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*")) continue;

      for (const rule of RULES) {
        // Skip warnings in strict mode
        if (this.options.strict && rule.severity !== "error") continue;

        const match = line.match(rule.pattern);
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

    const annotations = issues.map((i) => this.generateAnnotation(i));
    const score = Math.max(0, 100 - issues.length * 5);

    return {
      filePath,
      issues,
      annotations,
      score,
      linesScanned: lines.length,
    };
  }

  /**
   * Scan entire project or single file
   */
  async scanProject(): Promise<ScanResult[]> {
    const startTime = nanoseconds();
    const traceId = randomUUIDv7("hex").slice(0, 8);

    if (this.options.profile) {
      this.profile = {
        traceId,
        startTime,
        filesScanned: 0,
        issuesFound: 0,
      };
    }

    const targetPath = this.options.path;
    const files: string[] = [];

    // Check if path is a file or directory
    const pathFile = Bun.file(targetPath);
    const isFile = await pathFile.exists() && targetPath.match(/\.(ts|tsx|js|jsx)$/);

    if (isFile) {
      files.push(targetPath);
    } else {
      const glob = new Glob("**/*.{ts,tsx,js,jsx}");
      for await (const file of glob.scan({ cwd: targetPath, onlyFiles: true })) {
        // Skip node_modules and dist
        if (file.includes("node_modules") || file.includes("/dist/")) continue;
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

      // Interactive mode: launch PTY for files with issues
      if (this.options.interactive && result.issues.length > 0) {
        await this.launchFixSession(filePath, result.issues);
      }
    }

    if (this.options.profile && this.profile) {
      const endTime = nanoseconds();
      this.profile.endTime = endTime;
      this.profile.durationMs = (endTime - this.profile.startTime) / 1_000_000;
      this.profile.filesScanned = files.length;
      this.profile.issuesFound = results.reduce((sum, r) => sum + r.issues.length, 0);
    }

    return results;
  }

  /**
   * Render results as dashboard table
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

    // Filter to files with issues for cleaner output
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
          Score: r.score >= 90 ? `\x1b[32m${r.score}\x1b[0m` : r.score >= 70 ? `\x1b[33m${r.score}\x1b[0m` : `\x1b[31m${r.score}\x1b[0m`,
          Status: r.score >= 90 ? "OK" : r.score >= 70 ? "~~" : "XX",
        };
      });

      console.log(inspect.table(tableData, undefined, { colors: true }));

      // Show detailed issues
      console.log("\n\x1b[1mIssue Details:\x1b[0m\n");

      for (const result of withIssues) {
        const fileName = result.filePath.split("/").pop();
        console.log(`\x1b[1m${fileName}\x1b[0m`);

        for (const issue of result.issues) {
          const severityColor = issue.severity === "error" ? "\x1b[31m" : issue.severity === "warning" ? "\x1b[33m" : "\x1b[36m";
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

    // Profile data
    if (this.profile) {
      console.log(`\n\x1b[90m[Profile] Trace: ${this.profile.traceId} | Duration: ${this.profile.durationMs?.toFixed(2)}ms\x1b[0m`);
    }
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options: ScanOptions = {
    strict: args.includes("--strict"),
    interactive: args.includes("--interactive"),
    profile: args.includes("--profile"),
    json: args.includes("--json"),
    path: args.find((a) => !a.startsWith("--")) || process.cwd(),
  };

  // Resolve path
  if (!options.path.startsWith("/")) {
    options.path = `${process.cwd()}/${options.path}`;
  }

  const scanner = new EnhancedScanner(options);
  const results = await scanner.scanProject();
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

export { EnhancedScanner, RULES };
export type { ScanIssue, ScanResult, ScanOptions, Annotation };
