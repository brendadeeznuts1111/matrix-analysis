import type { Presentation, Section, Slide } from "./types";

export const sections: Section[] = [
  {
    id: "string-width",
    title: "Bun.stringWidth()",
    icon: "📏",
    api: "Bun.stringWidth",
    category: "formatting",
    slides: ["sw-intro", "sw-maps", "sw-tables"],
  },
  {
    id: "peek",
    title: "Bun.peek()",
    icon: "👁️",
    api: "Bun.peek",
    category: "async",
    slides: ["peek-intro", "peek-patterns", "peek-dashboard"],
  },
  {
    id: "inspect",
    title: "Bun.inspect()",
    icon: "🔍",
    api: "Bun.inspect",
    category: "debugging",
    slides: ["inspect-intro", "inspect-custom", "inspect-terminal"],
  },
  {
    id: "inspect-table",
    title: "Bun.inspect.table()",
    icon: "📊",
    api: "Bun.inspect.table",
    category: "formatting",
    slides: ["table-intro", "table-patterns", "table-dashboard"],
  },
  {
    id: "open-editor",
    title: "Bun.openInEditor()",
    icon: "📂",
    api: "Bun.openInEditor",
    category: "debugging",
    slides: ["editor-intro", "editor-vscode", "editor-nav"],
  },
  {
    id: "deep-equals",
    title: "Bun.deepEquals()",
    icon: "⚖️",
    api: "Bun.deepEquals",
    category: "comparison",
    slides: ["equals-intro", "equals-testing", "equals-custom"],
  },
  {
    id: "escape-html",
    title: "Bun.escapeHTML()",
    icon: "🛡️",
    api: "Bun.escapeHTML",
    category: "security",
    slides: ["html-intro", "html-template"],
  },
  {
    id: "shell",
    title: "Bun.$ & spawn()",
    icon: "💻",
    api: "Bun.$/spawn",
    category: "shell",
    slides: ["shell-intro", "shell-patterns", "shell-streaming"],
  },
  {
    id: "connect",
    title: "Bun.connect()",
    icon: "🔌",
    api: "Bun.connect",
    category: "networking",
    slides: ["connect-intro", "connect-errors", "connect-patterns"],
  },
  {
    id: "build",
    title: "Bun.build()",
    icon: "📦",
    api: "Bun.build",
    category: "bundler",
    slides: ["build-intro", "build-virtual", "build-enterprise"],
  },
  {
    id: "performance",
    title: "Performance",
    icon: "⚡",
    api: "Response.json/Buffer",
    category: "optimization",
    slides: ["perf-intro", "perf-simd"],
  },
  {
    id: "integration",
    title: "Integration",
    icon: "🔧",
    api: "Combined",
    category: "integration",
    slides: ["int-dashboard", "int-guide"],
  },
];

export const slides: Slide[] = [
  // Cover
  {
    id: "cover",
    number: 1,
    type: "cover",
    title: "Bun's Advanced APIs",
    subtitle: "Power Tools for Developers",
    content: "Mastering High-Performance JavaScript APIs",
    icon: "🚀",
    tags: ["bun", "apis", "performance"],
  },

  // Table of Contents
  {
    id: "toc",
    number: 2,
    type: "toc",
    title: "What We'll Cover",
    content: "Eight powerful APIs to supercharge your development workflow",
    tags: ["overview"],
  },

  // Section 1: Bun.stringWidth()
  {
    id: "sw-intro",
    number: 3,
    type: "section",
    sectionId: "string-width",
    title: "Bun.stringWidth()",
    subtitle: "Perfect Table Formatting",
    content: "Handle Unicode, emojis, and CJK characters with pixel-perfect terminal alignment",
    icon: "📏",
    tags: ["formatting", "unicode", "terminal"],
  },
  {
    id: "sw-maps",
    number: 4,
    type: "content",
    sectionId: "string-width",
    title: "Formatting Maps & Objects",
    subtitle: "Precise Text Alignment",
    content: "Calculate true display width for any string, enabling perfect column alignment in CLI tables regardless of character type—ASCII, emoji, or CJK.",
    tags: ["maps", "alignment"],
  },
  {
    id: "sw-tables",
    number: 5,
    type: "code",
    sectionId: "string-width",
    title: "TableRenderer Class",
    subtitle: "Dynamic Column Widths",
    content: "Build sophisticated table renderers combining Bun.inspect() depth control with Bun.stringWidth() for production-ready terminal data visualization.",
    tags: ["classes", "tables"],
  },

  // Section 2: Bun.peek()
  {
    id: "peek-intro",
    number: 6,
    type: "section",
    sectionId: "peek",
    title: "Bun.peek()",
    subtitle: "Zero-Cost Promise Inspection",
    content: "Synchronously check promise state without adding microtask overhead",
    icon: "👁️",
    tags: ["async", "promises", "performance"],
  },
  {
    id: "peek-patterns",
    number: 7,
    type: "content",
    sectionId: "peek",
    title: "Performance Patterns",
    subtitle: "Eliminating Microtask Overhead",
    content: "Replace costly async/await chains with synchronous state checks. Implement stale-while-revalidate caching with zero performance penalty.",
    tags: ["optimization", "caching"],
  },
  {
    id: "peek-dashboard",
    number: 8,
    type: "demo",
    sectionId: "peek",
    title: "PromiseMonitor",
    subtitle: "Real-Time Status Tracking",
    content: "Track promise states without .then() handlers. Monitor async operations in real-time with zero impact on resolution timing.",
    tags: ["monitoring", "dashboard"],
  },

  // Section 3: Bun.inspect()
  {
    id: "inspect-intro",
    number: 9,
    type: "section",
    sectionId: "inspect",
    title: "Bun.inspect()",
    subtitle: "Advanced Object Inspection",
    content: "Debug and visualize complex data structures with full control over output format",
    icon: "🔍",
    tags: ["debugging", "inspection", "objects"],
  },
  {
    id: "inspect-custom",
    number: 10,
    type: "content",
    sectionId: "inspect",
    title: "Custom Class Inspection",
    subtitle: "Bun.inspect.custom Symbol",
    content: "Control how your classes appear in logs. Hide sensitive fields, format output with colors and emojis, and set context-aware depth limits.",
    tags: ["classes", "symbols"],
  },
  {
    id: "inspect-terminal",
    number: 11,
    type: "code",
    sectionId: "inspect",
    title: "Terminal Integration",
    subtitle: "Bun.Terminal + Bun.inspect()",
    content: "Combine terminal APIs for interactive object exploration. Visualize deeply nested configs with configurable depth and ANSI color support.",
    tags: ["terminal", "interactive"],
  },

  // Section 4: Bun.inspect.table() - Most Used API
  {
    id: "table-intro",
    number: 12,
    type: "section",
    sectionId: "inspect-table",
    title: "Bun.inspect.table()",
    subtitle: "Zero-Dependency Data Tables",
    content: "Beautiful terminal tables without npm packages—the most used API in enterprise codebases",
    icon: "📊",
    tags: ["tables", "formatting", "cli"],
  },
  {
    id: "table-patterns",
    number: 13,
    type: "content",
    sectionId: "inspect-table",
    title: "Usage Patterns",
    subtitle: "Column Filtering & Colors",
    content: "Filter columns with array syntax, enable ANSI colors for terminal output, pre-format data with icons and status indicators for rich CLI experiences.",
    code: `// All columns
Bun.inspect.table(data);

// Filter columns
Bun.inspect.table(data, ["name", "status"]);

// With colors
Bun.inspect.table(data, undefined, { colors: true });

// Pre-format for display
const formatted = items.map(x => ({
  "#": x.id,
  "Name": \`\${x.icon} \${x.name}\`,
  "Status": x.active ? "✓ Active" : "✗ Inactive",
}));
console.log(Bun.inspect.table(formatted));`,
    tags: ["patterns", "columns", "colors"],
  },
  {
    id: "table-dashboard",
    number: 14,
    type: "demo",
    sectionId: "inspect-table",
    title: "Enterprise Dashboard",
    subtitle: "15+ Files Using This API",
    content: "Security audits, registry viewers, package managers, scanner reports—all powered by Bun.inspect.table(). Replaces cli-table3, table, and similar npm packages.",
    code: `// Security Audit Dashboard
const risks = scanResults.map(r => ({
  "Package": r.name,
  "Severity": r.severity === "critical" ? "🔴 CRITICAL" : "⚠️ " + r.severity,
  "Category": r.category,
  "Action": r.blocked ? "BLOCKED" : "ALLOWED",
}));
console.log(Bun.inspect.table(risks, undefined, { colors: true }));

// Output:
// ┌─────────┬────────────────┬────────────┬─────────┐
// │ Package │ Severity       │ Category   │ Action  │
// ├─────────┼────────────────┼────────────┼─────────┤
// │ lodash  │ ⚠️ low         │ BUNDLE     │ ALLOWED │
// │ axios   │ ⚠️ medium      │ ANTIPATTERN│ ALLOWED │
// └─────────┴────────────────┴────────────┴─────────┘`,
    tags: ["dashboard", "enterprise", "security"],
  },

  // Section 5: Bun.openInEditor()
  {
    id: "editor-intro",
    number: 15,
    type: "section",
    sectionId: "open-editor",
    title: "Bun.openInEditor()",
    subtitle: "Developer Experience",
    content: "Jump from code to editor instantly—files, lines, columns, and error locations",
    icon: "📂",
    tags: ["dx", "editor", "navigation"],
  },
  {
    id: "editor-vscode",
    number: 16,
    type: "content",
    sectionId: "open-editor",
    title: "Editor Detection",
    subtitle: "CodeNavigator Class",
    content: "Auto-detect user's editor (VSCode, JetBrains, vim). Open files at exact line:column positions. Parse stack traces to jump directly to errors.",
    tags: ["vscode", "detection"],
  },
  {
    id: "editor-nav",
    number: 17,
    type: "demo",
    sectionId: "open-editor",
    title: "Project Navigator",
    subtitle: "Bookmark Management",
    content: "Build a bookmark system for rapid code navigation. Save important locations and jump between them with a single command.",
    tags: ["bookmarks", "workflow"],
  },

  // Section 6: Bun.deepEquals()
  {
    id: "equals-intro",
    number: 18,
    type: "section",
    sectionId: "deep-equals",
    title: "Bun.deepEquals()",
    subtitle: "Advanced Object Comparison",
    content: "Deep equality checks with strict mode and type awareness",
    icon: "⚖️",
    tags: ["comparison", "testing", "equality"],
  },
  {
    id: "equals-testing",
    number: 19,
    type: "content",
    sectionId: "deep-equals",
    title: "Testing Framework",
    subtitle: "Assertion Library",
    content: "Build assertions with strict/non-strict modes. Compare class instances, handle undefined values, and provide detailed diff output on failure.",
    tags: ["testing", "assertions"],
  },
  {
    id: "equals-custom",
    number: 20,
    type: "code",
    sectionId: "deep-equals",
    title: "Custom Comparison Rules",
    subtitle: "ignoreUndefined & More",
    content: "Extend comparison with custom rules: ignore undefined keys, compare by subset, normalize before comparison. Flexible strategies for any use case.",
    tags: ["customization", "rules"],
  },

  // Section 7: Bun.escapeHTML()
  {
    id: "html-intro",
    number: 21,
    type: "section",
    sectionId: "escape-html",
    title: "Bun.escapeHTML()",
    subtitle: "Safe HTML Rendering",
    content: "Prevent XSS attacks with fast, native HTML escaping",
    icon: "🛡️",
    tags: ["security", "xss", "html"],
  },
  {
    id: "html-template",
    number: 22,
    type: "content",
    sectionId: "escape-html",
    title: "SafeTemplate Engine",
    subtitle: "XSS Prevention",
    content: "Build template engines that escape by default. Integrate with HTTP servers for secure user input handling. Trust nothing, escape everything.",
    tags: ["templates", "http"],
  },

  // Section 8: Bun.$ & spawn() - Shell Commands
  {
    id: "shell-intro",
    number: 23,
    type: "section",
    sectionId: "shell",
    title: "Bun.$ & spawn()",
    subtitle: "Shell Commands Made Easy",
    content: "Execute shell commands with tagged templates or fine-grained process control",
    icon: "💻",
    tags: ["shell", "process", "cli"],
  },
  {
    id: "shell-patterns",
    number: 24,
    type: "content",
    sectionId: "shell",
    title: "Bun.$ Patterns",
    subtitle: "Tagged Template Shell",
    content: "Shell commands with interpolation, pipes, and globs. Use .quiet() to suppress output, .nothrow() to handle errors, .text() for string output.",
    code: `import { $ } from "bun";

// Simple command
await $\`ls -la\`;

// Interpolation (auto-escaped)
const file = "my file.txt";
await $\`cat \${file}\`;

// Chaining methods
const output = await $\`git status\`.quiet().text();
const { exitCode } = await $\`npm test\`.nothrow();

// Pipes work naturally
await $\`cat package.json | grep name\`;`,
    tags: ["patterns", "shell", "interpolation"],
  },
  {
    id: "shell-streaming",
    number: 25,
    type: "demo",
    sectionId: "shell",
    title: "Bun.spawn()",
    subtitle: "Process Control & Streaming",
    content: "Fine-grained control for long-running processes, streaming I/O, and PTY sessions. Used heavily in CLI tools, build systems, and dev servers.",
    code: `// Long-running process with streaming
const proc = Bun.spawn(["node", "server.js"], {
  stdout: "pipe",
  stderr: "pipe",
});

// Stream output
const output = await new Response(proc.stdout).text();
await proc.exited; // Wait for completion

// PTY for interactive commands (vim, htop)
const pty = Bun.spawn(["vim", "file.txt"], {
  terminal: { cols: 80, rows: 24 },
});`,
    tags: ["spawn", "streaming", "pty"],
  },

  // Section 9: Bun.connect() - Networking
  {
    id: "connect-intro",
    number: 26,
    type: "section",
    sectionId: "connect",
    title: "Bun.connect()",
    subtitle: "Low-Level Networking",
    content: "TCP/TLS connections with async handlers for high-performance networking",
    icon: "🔌",
    tags: ["networking", "tcp", "tls"],
  },
  {
    id: "connect-errors",
    number: 27,
    type: "content",
    sectionId: "connect",
    title: "Error Handling",
    subtitle: "Graceful Connection Failures",
    content: "Handle connection errors gracefully with try-catch patterns. Log context for debugging and implement retry logic for resilient applications.",
    code: `// Graceful error handling
try {
  await Bun.connect({
    hostname: "api.example.com",
    port: 443,
    tls: true,
    socket: {
      data(socket, data) { /* handle response */ },
      error(socket, err) { console.error("Socket error:", err); },
      close() { console.log("Connection closed"); },
    },
  });
} catch (e) {
  await ErrorHandler.handle(e, { endpoint: "/api" });
}`,
    tags: ["errors", "try-catch", "resilience"],
  },
  {
    id: "connect-patterns",
    number: 28,
    type: "demo",
    sectionId: "connect",
    title: "Connection Patterns",
    subtitle: "TCP Client & Health Checks",
    content: "Build TCP clients, implement health checks, and create connection pools. Use Bun.connect() for Redis, database, and custom protocol clients.",
    code: `// Health check with timeout
async function healthCheck(host: string, port: number) {
  try {
    const socket = await Bun.connect({
      hostname: host,
      port,
      socket: {
        open(socket) { socket.end(); },
        error() { /* handled below */ },
      },
    });
    return { status: "up", latency: Date.now() - start };
  } catch {
    return { status: "down", error: "Connection refused" };
  }
}`,
    tags: ["health-check", "tcp-client", "patterns"],
  },

  // Section 10: Bun.build() - Bundler & Compiler
  {
    id: "build-intro",
    number: 29,
    type: "section",
    sectionId: "build",
    title: "Bun.build()",
    subtitle: "Bundler & Compiler",
    content: "Zero-config bundling with virtual files, bytecode compilation, and air-gapped builds",
    icon: "📦",
    tags: ["bundler", "compile", "build"],
  },
  {
    id: "build-virtual",
    number: 30,
    type: "content",
    sectionId: "build",
    title: "Virtual File System",
    subtitle: "No Temp Files Needed",
    content: "Inject files at build time without disk I/O. Perfect for testing, dynamic config, and rule injection.",
    code: `// Virtual files for testing - no fixtures needed
await Bun.build({
  entrypoints: ["/test/index.ts"],
  files: {
    "/test/index.ts": \`
      import { scan } from "./scanner";
      export const result = scan(["lodash"]);
    \`,
    "/test/scanner.ts": \`
      export function scan(deps: string[]) {
        return deps.map(d => ({ name: d, ok: true }));
      }
    \`,
    "./config.ts": \`
      export const rules = \${JSON.stringify(rules)};
      export const hash = "\${Bun.hash.xxHash3(data)}";
    \`
  },
  outdir: "./dist"
});`,
    tags: ["virtual-fs", "testing", "injection"],
  },
  {
    id: "build-enterprise",
    number: 31,
    type: "demo",
    sectionId: "build",
    title: "Air-Gapped Builds",
    subtitle: "Secure CI Without Registry",
    content: "Compile standalone binaries using pre-approved Bun executables. No npm downloads in production.",
    code: `// Enterprise: offline compilation
await Bun.build({
  entrypoints: ["./scanner.ts"],
  compile: true,
  target: "bun-linux-x64",
  // Use approved binary, no download
  executablePath: "/enterprise/bin/bun-v1.2.5",
  minify: true,
  bytecode: true,
  files: {
    // Embed rules at build time
    "./rules.json": JSON.stringify(rules),
    "./config.ts": \`
      export const config = {
        s3: "\${process.env.S3_BUCKET}",
        version: "\${process.env.GIT_SHA}"
      };
    \`
  }
});`,
    tags: ["air-gapped", "compile", "enterprise"],
  },

  // Section 11: Performance Optimizations
  {
    id: "perf-intro",
    number: 32,
    type: "section",
    sectionId: "performance",
    title: "Performance",
    subtitle: "SIMD Optimizations",
    content: "Leverage native SIMD for 3.5x faster JSON serialization and pattern matching",
    icon: "⚡",
    tags: ["performance", "simd", "optimization"],
  },
  {
    id: "perf-simd",
    number: 33,
    type: "content",
    sectionId: "performance",
    title: "Response.json() & Buffer",
    subtitle: "Native Speed Gains",
    content: "SIMD-optimized JSON serialization for API responses and fast binary pattern matching for large files.",
    code: `// Response.json() - 3.5x faster for large JSON
// Before: ~2415ms | After: ~700ms
export default {
  fetch(req) {
    const sarif = generateSarifReport(); // Large JSON
    return Response.json(sarif); // SIMD-optimized
  }
};

// Buffer.indexOf() - 2x faster for 44KB+ files
class FastPatternMatcher {
  private buffer: Buffer;

  constructor(content: string) {
    this.buffer = Buffer.from(content);
  }

  hasPattern(pattern: string): boolean {
    return this.buffer.includes(pattern); // SIMD
  }

  findLine(pattern: string): number {
    const idx = this.buffer.indexOf(pattern);
    if (idx === -1) return -1;
    return this.buffer.subarray(0, idx).toString().split("\\n").length;
  }
}`,
    tags: ["response-json", "buffer", "simd"],
  },

  // Section 12: Integration
  {
    id: "int-dashboard",
    number: 34,
    type: "section",
    sectionId: "integration",
    title: "Integration",
    subtitle: "Developer Dashboard",
    content: "Combine all APIs into a powerful development toolkit",
    icon: "🔧",
    tags: ["integration", "dashboard"],
  },
  {
    id: "int-demo",
    number: 35,
    type: "demo",
    sectionId: "integration",
    title: "DevDashboard",
    subtitle: "All APIs Combined",
    content: "Terminal monitoring, promise tracking, file watching, state inspection—all working together in a unified developer experience.",
    tags: ["demo", "complete"],
  },
  {
    id: "int-guide",
    number: 36,
    type: "summary",
    sectionId: "integration",
    title: "API Quick Reference",
    subtitle: "Signatures, Topics & Categories",
    content: "Complete reference for Bun APIs covered in this presentation plus essential utilities.",
    code: `// Covered in Slides
const covered = [
  { API: "Bun.stringWidth(str)",       Topic: "Terminal alignment",  Category: "Formatting" },
  { API: "Bun.peek(promise)",          Topic: "Sync promise check",  Category: "Async" },
  { API: "Bun.inspect(obj, opts?)",    Topic: "Object debugging",    Category: "Debugging" },
  { API: "Bun.inspect.table(data)",    Topic: "CLI tables",          Category: "Formatting" },
  { API: "Bun.openInEditor(path)",     Topic: "Jump to code",        Category: "DX" },
  { API: "Bun.deepEquals(a, b)",       Topic: "Deep comparison",     Category: "Testing" },
  { API: "Bun.escapeHTML(str)",        Topic: "XSS prevention",      Category: "Security" },
  { API: "Bun.$\`cmd\`",                Topic: "Shell commands",      Category: "Shell" },
  { API: "Bun.spawn(cmd, opts)",       Topic: "Process control",     Category: "Shell" },
  { API: "Bun.connect(opts)",          Topic: "TCP/TLS sockets",     Category: "Network" },
];
// Essential Utilities
const utils = [
  { API: "Bun.serve(opts)",            Topic: "HTTP server",         Category: "Server" },
  { API: "Bun.file(path)",             Topic: "File reference",      Category: "I/O" },
  { API: "Bun.write(path, data)",      Topic: "Write files",         Category: "I/O" },
  { API: "Bun.sleep(ms)",              Topic: "Async delay",         Category: "Timing" },
  { API: "Bun.nanoseconds()",          Topic: "High-res timing",     Category: "Timing" },
  { API: "Bun.password.hash(pwd)",     Topic: "Argon2id hash",       Category: "Security" },
  { API: "Bun.randomUUIDv7()",         Topic: "Time-sorted UUID",    Category: "Utils" },
  { API: "Bun.gzipSync(data)",         Topic: "Compression",         Category: "Utils" },
  { API: "Bun.version",                Topic: "Runtime version",     Category: "Meta" },
];
console.log(Bun.inspect.table([...covered, ...utils]));`,
    tags: ["reference", "signatures", "categories"],
  },

  // Final
  {
    id: "final",
    number: 37,
    type: "final",
    title: "Master Bun's APIs",
    subtitle: "Start Building Today",
    content: "Transform your workflow with high-performance, native JavaScript APIs. Build sophisticated tools with less code and better performance.",
    icon: "🎯",
    tags: ["conclusion"],
  },
];

export const presentation: Presentation = {
  meta: {
    title: "Bun's Advanced APIs",
    subtitle: "Power Tools for Developers",
    version: "1.0.0",
    author: "Bun APIs Slides",
  },
  sections,
  slides,
};
