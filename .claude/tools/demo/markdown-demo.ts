#!/usr/bin/env bun
/**
 * Bun.markdown Demo — Interactive showcase of the native CommonMark parser
 *
 * Demonstrates all supported features: headings, emphasis, code blocks,
 * lists, tables, links, images, blockquotes, GFM extensions, and
 * file-based rendering pipelines.
 *
 * Run:  bun run tools/demo/markdown-demo.ts [command]
 *
 * Commands:
 *   features   Show all supported markdown features rendered to HTML
 *   serve      Start a local markdown server on :3000
 *   pipe       Read stdin markdown, write HTML to stdout
 *   file       Render a markdown file to HTML (pass path as arg)
 *   roundtrip  Demonstrate md → html → file pipeline
 */

// ─── Feature Demos ───────────────────────────────────────────────────────────

function demoHeadings(): void {
	const md = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`;
	showRendered("Headings (h1-h6)", md);
}

function demoEmphasis(): void {
	const md = `**Bold text** and *italic text* and ***bold italic***.

~~Strikethrough~~ text (GFM extension).`;
	showRendered("Emphasis & Strikethrough", md);
}

function demoCode(): void {
	const md = `Inline \`code\` in a sentence.

\`\`\`typescript
// Fenced code block with language hint
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello from Bun!");
  },
});
console.log(\`Listening on :\${server.port}\`);
\`\`\`

    // Indented code block (4 spaces)
    const x = 42;`;
	showRendered("Code (inline, fenced, indented)", md);
}

function demoLists(): void {
	const md = `**Unordered:**
- Item alpha
- Item beta
  - Nested item
  - Another nested
- Item gamma

**Ordered:**
1. First step
2. Second step
3. Third step

**Task List (GFM):**
- [x] Parse markdown
- [x] Render to HTML
- [ ] Deploy to production`;
	showRendered("Lists (unordered, ordered, task)", md);
}

function demoTables(): void {
	const md = `| Feature | Status | Performance |
|---------|--------|-------------|
| CommonMark | Full | Native Zig |
| GFM Tables | Full | Native Zig |
| Strikethrough | Full | Native Zig |
| Autolinks | Full | Native Zig |
| Task Lists | Full | Native Zig |`;
	showRendered("Tables (GFM)", md);
}

function demoBlockquotes(): void {
	const md = `> Single-level blockquote with **bold** text.

> Nested blockquotes:
>> Inner level
>>> Deeper level

> Multi-paragraph blockquote:
>
> Second paragraph inside the quote.`;
	showRendered("Blockquotes", md);
}

function demoLinks(): void {
	const md = `[Inline link](https://bun.com)

[Link with title](https://bun.com "Bun Homepage")

![Image alt text](https://bun.com/logo.svg)

Autolinked URL: https://bun.com/blog/bun-v1.3.8`;
	showRendered("Links & Images", md);
}

function demoHorizontalRules(): void {
	const md = `Content above

---

Content between

***

Content below`;
	showRendered("Horizontal Rules", md);
}

function demoMixed(): void {
	const md = `# Bun v1.3.8 Release Notes

Bun v1.3.8 introduces **Bun.markdown**, a builtin CommonMark-compliant
Markdown parser written in Zig. It supports all standard markdown features
plus GFM extensions.

## Key Features

1. **Zero dependencies** — no npm packages needed
2. **Native performance** — written in Zig, compiled to native code
3. **CommonMark compliant** — passes the full spec
4. **GFM extensions** — tables, strikethrough, task lists, autolinks

## Quick Start

\`\`\`typescript
// One-line markdown rendering
const html = Bun.markdown("# Hello World");

// File-based rendering
const md = await Bun.file("README.md").text();
const rendered = Bun.markdown(md);
await Bun.write("output.html", rendered);
\`\`\`

## Performance

| Parser | Type | Relative Speed |
|--------|------|---------------|
| Bun.markdown | Native (Zig) | 1.0x (baseline) |
| marked | npm (JS) | ~3-5x slower |
| markdown-it | npm (JS) | ~5-8x slower |

> **Note:** Benchmarks vary by input size and complexity.
> Run \`bun run src/benchmarks/bunmark-markdown.ts compare\` for your system.

---

*Built with Bun v1.3.8. One line. Total control.*`;
	showRendered("Full Document (mixed features)", md);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showRendered(title: string, md: string): void {
	const start = Bun.nanoseconds();
	const html = Bun.markdown(md);
	const elapsed = (Bun.nanoseconds() - start) / 1e6;

	console.log(`\n${"=".repeat(60)}`);
	console.log(`  ${title}`);
	console.log(`${"=".repeat(60)}`);
	console.log();
	console.log("MARKDOWN:");
	console.log(md);
	console.log();
	console.log("HTML:");
	console.log(html);
	console.log(
		`[${elapsed.toFixed(3)} ms | ${new TextEncoder().encode(md).length}B in → ${new TextEncoder().encode(html).length}B out]`,
	);
}

// ─── Commands ────────────────────────────────────────────────────────────────

function runFeatures(): void {
	console.log("Bun.markdown Demo — All Supported Features");
	console.log(`Runtime: Bun ${Bun.version}`);

	demoHeadings();
	demoEmphasis();
	demoCode();
	demoLists();
	demoTables();
	demoBlockquotes();
	demoLinks();
	demoHorizontalRules();
	demoMixed();

	console.log(`\n${"=".repeat(60)}`);
	console.log("  Demo complete. All features rendered successfully.");
	console.log(`${"=".repeat(60)}`);
}

function runServe(): void {
	const server = Bun.serve({
		port: 3000,
		hostname: "127.0.0.1",
		async fetch(req) {
			const url = new URL(req.url);

			if (url.pathname === "/") {
				return new Response(
					Bun.markdown(`# Bun.markdown Demo Server

Serve any \`.md\` file as HTML by visiting its path.

## Examples

- [/README](/README) — Render README.md
- [/CHANGELOG](/CHANGELOG) — Render CHANGELOG.md

## API

\`GET /<filename>\` renders \`<filename>.md\` from the current directory.
`),
					{ headers: { "Content-Type": "text/html; charset=utf-8" } },
				);
			}

			const filePath = `.${url.pathname}.md`;
			const file = Bun.file(filePath);
			if (await file.exists()) {
				const md = await file.text();
				const html = Bun.markdown(md);
				const wrapped = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${url.pathname.slice(1)}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
  pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; border-radius: 4px; }
  code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f4f4f4; }
  blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
  img { max-width: 100%; }
</style>
</head><body>${html}</body></html>`;
				return new Response(wrapped, {
					headers: { "Content-Type": "text/html; charset=utf-8" },
				});
			}

			return new Response("Not Found", { status: 404 });
		},
	});

	console.log(`Bun.markdown demo server listening on http://127.0.0.1:${server.port}`);
	console.log("Visit http://127.0.0.1:3000/ for the index page");
	console.log("Press Ctrl+C to stop");
}

async function runPipe(): Promise<void> {
	const md = await Bun.stdin.text();
	const html = Bun.markdown(md);
	process.stdout.write(html);
}

async function runFile(path: string): Promise<void> {
	const file = Bun.file(path);
	if (!(await file.exists())) {
		console.error(`File not found: ${path}`);
		process.exit(1);
	}
	const md = await file.text();
	const start = Bun.nanoseconds();
	const html = Bun.markdown(md);
	const elapsed = (Bun.nanoseconds() - start) / 1e6;

	console.log(html);
	console.error(`[Rendered ${path} in ${elapsed.toFixed(3)} ms]`);
}

async function runRoundtrip(): Promise<void> {
	const tmpMd = "/tmp/bun-markdown-demo.md";
	const tmpHtml = "/tmp/bun-markdown-demo.html";

	const md = `# Round-trip Demo

This file was **written**, **read**, and **rendered** by Bun.

- Step 1: Write markdown to disk
- Step 2: Read it back
- Step 3: Render to HTML
- Step 4: Write HTML to disk

\`\`\`typescript
await Bun.write("file.md", markdown);
const html = Bun.markdown(await Bun.file("file.md").text());
await Bun.write("file.html", html);
\`\`\`
`;

	// Write markdown
	await Bun.write(tmpMd, md);
	console.log(`Wrote markdown: ${tmpMd} (${new TextEncoder().encode(md).length} bytes)`);

	// Read + render
	const readBack = await Bun.file(tmpMd).text();
	const start = Bun.nanoseconds();
	const html = Bun.markdown(readBack);
	const elapsed = (Bun.nanoseconds() - start) / 1e6;

	// Write HTML
	await Bun.write(tmpHtml, html);
	console.log(
		`Wrote HTML:     ${tmpHtml} (${new TextEncoder().encode(html).length} bytes)`,
	);
	console.log(`Rendered in ${elapsed.toFixed(3)} ms`);
	console.log();
	console.log("HTML output:");
	console.log(html);
}

function showHelp(): void {
	console.log(`Bun.markdown Demo — Interactive CommonMark Showcase

Usage:
  bun run tools/demo/markdown-demo.ts <command> [args]

Commands:
  features    Render all supported markdown features to HTML
  serve       Start local markdown-to-HTML server on :3000
  pipe        Read stdin markdown, write HTML to stdout
  file <path> Render a specific markdown file
  roundtrip   Demo the write → read → render → write pipeline
  help        Show this help message

Examples:
  bun run tools/demo/markdown-demo.ts features
  bun run tools/demo/markdown-demo.ts serve
  cat README.md | bun run tools/demo/markdown-demo.ts pipe
  bun run tools/demo/markdown-demo.ts file ./README.md
`);
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	const command = Bun.argv[2] || "features";

	switch (command) {
		case "features":
			runFeatures();
			break;
		case "serve":
			runServe();
			break;
		case "pipe":
			await runPipe();
			break;
		case "file":
			await runFile(Bun.argv[3] || "README.md");
			break;
		case "roundtrip":
			await runRoundtrip();
			break;
		case "help":
		case "--help":
		case "-h":
			showHelp();
			break;
		default:
			console.error(`Unknown command: ${command}`);
			showHelp();
			process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

// Export for testing
export { demoHeadings, demoEmphasis, demoCode, demoLists, demoTables };
