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

  // Section 9: Integration
  {
    id: "int-dashboard",
    number: 26,
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
    number: 27,
    type: "demo",
    sectionId: "integration",
    title: "DevDashboard",
    subtitle: "All APIs Combined",
    content: "Terminal monitoring, promise tracking, file watching, state inspection—all working together in a unified developer experience.",
    tags: ["demo", "complete"],
  },
  {
    id: "int-guide",
    number: 28,
    type: "summary",
    sectionId: "integration",
    title: "API Selection Guide",
    subtitle: "Choosing the Right Tool",
    content: "Performance characteristics, use cases, and best practices for each API. Match the right tool to your specific requirements.",
    tags: ["guide", "reference"],
  },

  // Final
  {
    id: "final",
    number: 29,
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
