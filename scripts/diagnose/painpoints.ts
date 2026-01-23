// scripts/diagnose/painpoints.ts
// Painpoint Detection System

type Severity = "critical" | "high" | "medium" | "low";
type Category = "git" | "code" | "deps" | "performance" | "security" | "config";

interface Painpoint {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  score: number;
  file?: string;
  line?: number;
  suggestion: string;
}

interface PainpointConfig {
  thresholds: {
    complexity: number;
    coverage: number;
    outdatedDeps: number;
    fileSize: number;
    depCount: number;
  };
  ignore: string[];
}

const DEFAULT_CONFIG: PainpointConfig = {
  thresholds: {
    complexity: 10,
    coverage: 80,
    outdatedDeps: 5,
    fileSize: 500, // lines
    depCount: 50,
  },
  ignore: ["node_modules", ".git", "dist", "build"],
};

export class PainpointDetector {
  private config: PainpointConfig;
  private painpoints: Painpoint[] = [];

  constructor(config: Partial<PainpointConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
    };
  }

  private getSeverityFromScore(score: number): Severity {
    if (score >= 90) return "critical";
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  private getSeverityWeight(severity: Severity): number {
    switch (severity) {
      case "critical": return 4;
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
    }
  }

  async detectGitPainpoints(projectPath: string): Promise<Painpoint[]> {
    const painpoints: Painpoint[] = [];

    try {
      // Check for uncommitted changes
      const status = await Bun.$`cd ${projectPath} && git status --porcelain`.quiet().nothrow();
      if (status.exitCode === 0) {
        const lines = status.stdout.toString().trim().split("\n").filter(Boolean);
        if (lines.length > 10) {
          painpoints.push({
            id: "git-uncommitted",
            title: "Many uncommitted changes",
            description: `${lines.length} uncommitted files detected`,
            severity: lines.length > 50 ? "high" : "medium",
            category: "git",
            score: Math.min(100, lines.length * 2),
            suggestion: "Commit or stash changes to maintain clean working directory",
          });
        }
      }

      // Check for large commits in history
      const logResult = await Bun.$`cd ${projectPath} && git log --oneline -20`.quiet().nothrow();
      if (logResult.exitCode === 0) {
        const commits = logResult.stdout.toString().trim().split("\n").filter(Boolean);
        if (commits.length < 5) {
          painpoints.push({
            id: "git-few-commits",
            title: "Limited commit history",
            description: "Project has few commits, consider more frequent commits",
            severity: "low",
            category: "git",
            score: 20,
            suggestion: "Commit smaller, more frequent changes",
          });
        }
      }

      // Check for missing .gitignore
      const gitignore = Bun.file(`${projectPath}/.gitignore`);
      if (!await gitignore.exists()) {
        painpoints.push({
          id: "git-no-gitignore",
          title: "Missing .gitignore",
          description: "No .gitignore file found",
          severity: "medium",
          category: "git",
          score: 50,
          suggestion: "Add .gitignore to exclude node_modules, dist, etc.",
        });
      }
    } catch {
      // Not a git repo or git not available
    }

    return painpoints;
  }

  async detectCodePainpoints(projectPath: string): Promise<Painpoint[]> {
    const painpoints: Painpoint[] = [];

    try {
      // Find large files
      const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx}");
      let fileCount = 0;
      const maxFiles = 100;

      for await (const file of glob.scan({ cwd: projectPath, onlyFiles: true })) {
        if (fileCount++ > maxFiles) break;
        if (this.config.ignore.some((p) => file.includes(p))) continue;

        const filePath = `${projectPath}/${file}`;
        const content = await Bun.file(filePath).text().catch(() => "");
        const lines = content.split("\n").length;

        if (lines > this.config.thresholds.fileSize) {
          painpoints.push({
            id: `code-large-file-${file}`,
            title: "Large file detected",
            description: `${file} has ${lines} lines`,
            severity: lines > 1000 ? "high" : "medium",
            category: "code",
            score: Math.min(100, (lines / this.config.thresholds.fileSize) * 50),
            file,
            suggestion: "Consider splitting into smaller modules",
          });
        }

        // Check for TODO/FIXME comments
        const todos = (content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi) || []).length;
        if (todos > 5) {
          painpoints.push({
            id: `code-todos-${file}`,
            title: "Many TODO comments",
            description: `${file} has ${todos} TODO/FIXME comments`,
            severity: "low",
            category: "code",
            score: Math.min(50, todos * 5),
            file,
            suggestion: "Address or track TODOs in issue tracker",
          });
        }
      }
    } catch {
      // Scan failed
    }

    return painpoints;
  }

  async detectDepsPainpoints(projectPath: string): Promise<Painpoint[]> {
    const painpoints: Painpoint[] = [];

    try {
      const pkgFile = Bun.file(`${projectPath}/package.json`);
      if (await pkgFile.exists()) {
        const pkg = await pkgFile.json();

        // Check dependency count
        const deps = Object.keys(pkg.dependencies || {}).length;
        const devDeps = Object.keys(pkg.devDependencies || {}).length;
        const totalDeps = deps + devDeps;

        if (totalDeps > this.config.thresholds.depCount) {
          painpoints.push({
            id: "deps-too-many",
            title: "High dependency count",
            description: `${totalDeps} total dependencies (${deps} prod, ${devDeps} dev)`,
            severity: totalDeps > 100 ? "high" : "medium",
            category: "deps",
            score: Math.min(100, (totalDeps / this.config.thresholds.depCount) * 50),
            suggestion: "Audit dependencies and remove unused packages",
          });
        }

        // Check for missing lockfile
        const bunLockBinary = Bun.file(`${projectPath}/bun.lockb`);
        const bunLockText = Bun.file(`${projectPath}/bun.lock`);
        const npmLock = Bun.file(`${projectPath}/package-lock.json`);
        const yarnLock = Bun.file(`${projectPath}/yarn.lock`);

        if (!await bunLockBinary.exists() && !await bunLockText.exists() && !await npmLock.exists() && !await yarnLock.exists()) {
          painpoints.push({
            id: "deps-no-lockfile",
            title: "Missing lockfile",
            description: "No bun.lock, bun.lockb, package-lock.json, or yarn.lock found",
            severity: "high",
            category: "deps",
            score: 80,
            suggestion: "Run bun install to generate lockfile for reproducible builds",
          });
        }

        // Check for missing engines
        if (!pkg.engines) {
          painpoints.push({
            id: "deps-no-engines",
            title: "No engine requirements",
            description: "package.json missing engines field",
            severity: "low",
            category: "deps",
            score: 20,
            suggestion: "Add engines field to specify Node/Bun version requirements",
          });
        }
      }
    } catch {
      // package.json read failed
    }

    return painpoints;
  }

  async detectSecurityPainpoints(projectPath: string): Promise<Painpoint[]> {
    const painpoints: Painpoint[] = [];

    try {
      // Check for .env files committed
      const envFile = Bun.file(`${projectPath}/.env`);
      if (await envFile.exists()) {
        const gitCheck = await Bun.$`cd ${projectPath} && git ls-files .env`.quiet().nothrow();
        if (gitCheck.exitCode === 0 && gitCheck.stdout.toString().trim()) {
          painpoints.push({
            id: "security-env-committed",
            title: ".env file in git",
            description: ".env file is tracked by git",
            severity: "critical",
            category: "security",
            score: 100,
            file: ".env",
            suggestion: "Remove .env from git and add to .gitignore",
          });
        }
      }

      // Check for hardcoded secrets and ports
      const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx,json}");
      let fileCount = 0;

      for await (const file of glob.scan({ cwd: projectPath, onlyFiles: true })) {
        if (fileCount++ > 100) break;
        if (this.config.ignore.some((p) => file.includes(p))) continue;
        if (file === "package-lock.json" || file === "bun.lockb") continue;
        if (file.includes(".test.") || file.includes(".spec.")) continue; // Skip test files for secrets

        const content = await Bun.file(`${projectPath}/${file}`).text().catch(() => "");

        // Comprehensive secret patterns
        const secretPatterns: Array<{ pattern: RegExp; name: string; severity: Severity }> = [
          // API Keys
          { pattern: /api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/gi, name: "API key", severity: "critical" },
          { pattern: /apikey\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/gi, name: "API key", severity: "critical" },

          // Secrets & Tokens
          { pattern: /secret\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/gi, name: "Secret", severity: "critical" },
          { pattern: /token\s*[:=]\s*["'][a-zA-Z0-9_\-\.]{20,}["']/gi, name: "Token", severity: "critical" },
          { pattern: /auth[_-]?token\s*[:=]\s*["'][^"']{10,}["']/gi, name: "Auth token", severity: "critical" },
          { pattern: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi, name: "Bearer token", severity: "critical" },

          // Passwords
          { pattern: /password\s*[:=]\s*["'][^"']{8,}["']/gi, name: "Password", severity: "critical" },
          { pattern: /passwd\s*[:=]\s*["'][^"']{8,}["']/gi, name: "Password", severity: "critical" },
          { pattern: /pwd\s*[:=]\s*["'][^"']{8,}["']/gi, name: "Password", severity: "critical" },

          // AWS
          { pattern: /AKIA[0-9A-Z]{16}/g, name: "AWS Access Key", severity: "critical" },
          { pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: "AWS Secret", severity: "critical" },

          // Private Keys
          { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, name: "Private key", severity: "critical" },
          { pattern: /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/g, name: "EC Private key", severity: "critical" },

          // Database URLs with credentials
          { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, name: "MongoDB connection string", severity: "critical" },
          { pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/gi, name: "PostgreSQL connection string", severity: "critical" },
          { pattern: /mysql:\/\/[^:]+:[^@]+@/gi, name: "MySQL connection string", severity: "critical" },
          { pattern: /redis:\/\/[^:]+:[^@]+@/gi, name: "Redis connection string", severity: "critical" },

          // GitHub/GitLab tokens
          { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: "GitHub PAT", severity: "critical" },
          { pattern: /gho_[a-zA-Z0-9]{36}/g, name: "GitHub OAuth", severity: "critical" },
          { pattern: /glpat-[a-zA-Z0-9\-]{20}/g, name: "GitLab PAT", severity: "critical" },

          // NPM tokens
          { pattern: /npm_[a-zA-Z0-9]{36}/g, name: "NPM token", severity: "critical" },

          // Slack
          { pattern: /xox[baprs]-[0-9]{10,}-[a-zA-Z0-9\-]+/g, name: "Slack token", severity: "critical" },

          // Stripe
          { pattern: /sk_live_[a-zA-Z0-9]{24,}/g, name: "Stripe live key", severity: "critical" },
          { pattern: /sk_test_[a-zA-Z0-9]{24,}/g, name: "Stripe test key", severity: "high" },

          // JWT (might be test data but flag it)
          { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, name: "JWT token", severity: "high" },
        ];

        for (const { pattern, name, severity } of secretPatterns) {
          if (pattern.test(content)) {
            const existing = painpoints.find((p) => p.file === file && p.title.includes("secret"));
            if (!existing) {
              painpoints.push({
                id: `security-secret-${file}-${name.replace(/\s+/g, "-").toLowerCase()}`,
                title: `Hardcoded ${name} detected`,
                description: `${file} contains ${name}`,
                severity,
                category: "security",
                score: severity === "critical" ? 100 : 85,
                file,
                suggestion: `Move ${name} to environment variables or Bun.secrets`,
              });
            }
          }
        }

        // Check for hardcoded ports (non-test files only)
        const portPatterns: Array<{ pattern: RegExp; ports: string; severity: Severity }> = [
          // Common development ports hardcoded
          { pattern: /port\s*[:=]\s*["']?(3000|3001|4000|5000|8000|8080|8888|9000)["']?/gi, ports: "common dev", severity: "medium" },
          // Database ports hardcoded
          { pattern: /port\s*[:=]\s*["']?(5432|3306|27017|6379|9200)["']?/gi, ports: "database", severity: "high" },
          // Listen on specific port
          { pattern: /\.listen\(\s*(3000|3001|4000|5000|8000|8080|8888|9000)\s*[,)]/g, ports: "server", severity: "medium" },
          // Bun.serve with hardcoded port
          { pattern: /Bun\.serve\(\s*\{[^}]*port\s*:\s*(3000|3001|4000|5000|8000|8080|8888|9000)/g, ports: "Bun server", severity: "medium" },
        ];

        for (const { pattern, ports, severity } of portPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            // Skip if it's in a comment or using process.env fallback
            const isEnvFallback = /port\s*[:=]\s*(process\.env|Bun\.env|import\.meta\.env)/i.test(content);
            if (!isEnvFallback) {
              const existing = painpoints.find((p) => p.file === file && p.title.includes("port"));
              if (!existing) {
                painpoints.push({
                  id: `security-hardcoded-port-${file}`,
                  title: `Hardcoded ${ports} port`,
                  description: `${file} has hardcoded port number`,
                  severity,
                  category: "security",
                  score: severity === "high" ? 75 : 50,
                  file,
                  suggestion: "Use environment variable: process.env.PORT || 3000",
                });
              }
            }
          }
        }

        // Check for hardcoded URLs with credentials or internal IPs
        const urlPatterns: Array<{ pattern: RegExp; name: string; severity: Severity }> = [
          { pattern: /https?:\/\/[^:]+:[^@]+@[^/]+/gi, name: "URL with credentials", severity: "critical" },
          { pattern: /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+/gi, name: "localhost URL", severity: "low" },
          { pattern: /https?:\/\/192\.168\.\d+\.\d+/gi, name: "private IP", severity: "medium" },
          { pattern: /https?:\/\/10\.\d+\.\d+\.\d+/gi, name: "private IP", severity: "medium" },
        ];

        for (const { pattern, name, severity } of urlPatterns) {
          if (pattern.test(content)) {
            const existing = painpoints.find((p) => p.file === file && p.title.includes(name));
            if (!existing) {
              painpoints.push({
                id: `security-url-${file}-${name.replace(/\s+/g, "-")}`,
                title: `Hardcoded ${name}`,
                description: `${file} contains hardcoded ${name}`,
                severity,
                category: "security",
                score: severity === "critical" ? 90 : severity === "medium" ? 60 : 30,
                file,
                suggestion: "Use environment variables for URLs and endpoints",
              });
            }
          }
        }
      }
    } catch {
      // Scan failed
    }

    return painpoints;
  }

  async detectAll(projectPath: string): Promise<Painpoint[]> {
    const [git, code, deps, security] = await Promise.all([
      this.detectGitPainpoints(projectPath),
      this.detectCodePainpoints(projectPath),
      this.detectDepsPainpoints(projectPath),
      this.detectSecurityPainpoints(projectPath),
    ]);

    this.painpoints = [...git, ...code, ...deps, ...security];

    // Sort by severity weight and score
    this.painpoints.sort((a, b) => {
      const weightDiff = this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity);
      if (weightDiff !== 0) return weightDiff;
      return b.score - a.score;
    });

    return this.painpoints;
  }

  getSummary(): { critical: number; high: number; medium: number; low: number; total: number } {
    return {
      critical: this.painpoints.filter((p) => p.severity === "critical").length,
      high: this.painpoints.filter((p) => p.severity === "high").length,
      medium: this.painpoints.filter((p) => p.severity === "medium").length,
      low: this.painpoints.filter((p) => p.severity === "low").length,
      total: this.painpoints.length,
    };
  }

  render(): string {
    if (this.painpoints.length === 0) {
      return "\n=== No Painpoints Detected ===\n\nProject looks healthy!\n";
    }

    const severityIcon = (s: Severity) => {
      switch (s) {
        case "critical": return "[!]";
        case "high": return "[H]";
        case "medium": return "[M]";
        case "low": return "[L]";
      }
    };

    const rows = this.painpoints.map((p) => ({
      Severity: `${severityIcon(p.severity)} ${p.severity}`,
      Category: p.category,
      Title: p.title,
      Score: p.score,
      File: p.file ?? "-",
    }));

    const summary = this.getSummary();
    const summaryRows = [
      { Level: "[!] Critical", Count: summary.critical },
      { Level: "[H] High", Count: summary.high },
      { Level: "[M] Medium", Count: summary.medium },
      { Level: "[L] Low", Count: summary.low },
      { Level: "Total", Count: summary.total },
    ];

    const sections = [
      "\n=== Painpoint Detection Report ===\n",
      Bun.inspect.table(rows, undefined, { colors: true }),
      "\n=== Summary ===\n",
      Bun.inspect.table(summaryRows, undefined, { colors: true }),
    ];

    // Top recommendations
    const topIssues = this.painpoints.slice(0, 3);
    if (topIssues.length > 0) {
      sections.push("\n=== Top Recommendations ===\n");
      const recRows = topIssues.map((p, i) => ({
        "#": i + 1,
        Issue: p.title,
        Action: p.suggestion.slice(0, 50) + (p.suggestion.length > 50 ? "..." : ""),
      }));
      sections.push(Bun.inspect.table(recRows, undefined, { colors: true }));
    }

    return sections.join("\n");
  }
}

// CLI entry point
if (import.meta.main) {
  const projectPath = process.argv[2] || process.cwd();

  console.log(`Scanning ${projectPath} for painpoints...\n`);

  const detector = new PainpointDetector();
  await detector.detectAll(projectPath);

  console.log(detector.render());
}

export { Painpoint, PainpointConfig, Severity, Category };
