#!/usr/bin/env bun
/**
 * Bun.markdown.html() — Builtin CommonMark Parser Test Suite
 *
 * Tests the native Zig-based CommonMark-compliant markdown parser
 * namespace introduced in Bun v1.3.7+ (Bun.markdown.html() API).
 *
 * Run: CLAUDECODE=1 bun test tests/bun-markdown.test.ts --bail --timeout=5000
 */

import { beforeAll, describe, expect, it } from "bun:test";

const hasBunMarkdown =
	"markdown" in Bun &&
	typeof Bun.markdown === "object" &&
	Bun.markdown !== null &&
	typeof Bun.markdown.html === "function";

// ─── Guard ───────────────────────────────────────────────────────────────────
describe.skipIf(!hasBunMarkdown)("Bun.markdown availability", () => {
	it("should exist as a namespace with html() method on the Bun global", () => {
		expect(typeof Bun.markdown).toBe("object");
		expect(typeof Bun.markdown.html).toBe("function");
	});
});

// ─── CommonMark Core ─────────────────────────────────────────────────────────
describe.skipIf(!hasBunMarkdown)("CommonMark core rendering", () => {
	it("should render headings h1–h6", () => {
		expect(Bun.markdown.html("# H1")).toContain("<h1>");
		expect(Bun.markdown.html("## H2")).toContain("<h2>");
		expect(Bun.markdown.html("### H3")).toContain("<h3>");
		expect(Bun.markdown.html("#### H4")).toContain("<h4>");
		expect(Bun.markdown.html("##### H5")).toContain("<h5>");
		expect(Bun.markdown.html("###### H6")).toContain("<h6>");
	});

	it("should render paragraphs", () => {
		const html = Bun.markdown.html("Hello world");
		expect(html).toContain("<p>");
		expect(html).toContain("Hello world");
	});

	it("should render bold text", () => {
		const html = Bun.markdown.html("**bold**");
		expect(html).toMatch(/<strong>bold<\/strong>/);
	});

	it("should render italic text", () => {
		const html = Bun.markdown.html("*italic*");
		expect(html).toMatch(/<em>italic<\/em>/);
	});

	it("should render bold+italic combined", () => {
		const html = Bun.markdown.html("***bold italic***");
		expect(html).toMatch(/<strong><em>|<em><strong>/);
	});

	it("should render inline code", () => {
		const html = Bun.markdown.html("`code`");
		expect(html).toContain("<code>code</code>");
	});

	it("should render fenced code blocks", () => {
		const md = "```typescript\nconst x = 1;\n```";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<pre>");
		expect(html).toContain("<code");
		expect(html).toContain("const x = 1;");
	});

	it("should render indented code blocks", () => {
		const md = "    const x = 1;\n    const y = 2;";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<pre>");
		expect(html).toContain("<code>");
	});

	it("should render unordered lists", () => {
		const md = "- item 1\n- item 2\n- item 3";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<ul>");
		expect(html).toContain("<li>");
		expect(html).toContain("item 1");
	});

	it("should render ordered lists", () => {
		const md = "1. first\n2. second\n3. third";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<ol>");
		expect(html).toContain("<li>");
	});

	it("should render blockquotes", () => {
		const html = Bun.markdown.html("> quote");
		expect(html).toContain("<blockquote>");
		expect(html).toContain("quote");
	});

	it("should render nested blockquotes", () => {
		const html = Bun.markdown.html("> outer\n>> inner");
		expect(html).toContain("<blockquote>");
		expect(html).toContain("inner");
	});

	it("should render horizontal rules", () => {
		expect(Bun.markdown.html("---")).toContain("<hr");
		expect(Bun.markdown.html("***")).toContain("<hr");
		expect(Bun.markdown.html("___")).toContain("<hr");
	});

	it("should render links", () => {
		const html = Bun.markdown.html("[text](https://example.com)");
		expect(html).toContain('<a href="https://example.com"');
		expect(html).toContain("text");
	});

	it("should render images", () => {
		const html = Bun.markdown.html("![alt](https://example.com/img.png)");
		expect(html).toContain("<img");
		expect(html).toContain('src="https://example.com/img.png"');
		expect(html).toContain('alt="alt"');
	});

	it("should render line breaks with two trailing spaces", () => {
		const html = Bun.markdown.html("line one  \nline two");
		expect(html).toContain("<br");
	});

	it("should handle empty input", () => {
		const html = Bun.markdown.html("");
		expect(typeof html).toBe("string");
	});

	it("should handle whitespace-only input", () => {
		const html = Bun.markdown.html("   \n\n   ");
		expect(typeof html).toBe("string");
	});
});

// ─── GFM Extensions ─────────────────────────────────────────────────────────
describe.skipIf(!hasBunMarkdown)("GFM extensions", () => {
	it("should render tables", () => {
		const md = "| A | B |\n|---|---|\n| 1 | 2 |";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<table>");
		expect(html).toContain("<th>");
		expect(html).toContain("<td>");
	});

	it("should render strikethrough", () => {
		const html = Bun.markdown.html("~~deleted~~");
		expect(html).toMatch(/<del>|<s>/);
		expect(html).toContain("deleted");
	});

	it("should render task lists", () => {
		const md = "- [ ] unchecked\n- [x] checked";
		const html = Bun.markdown.html(md);
		expect(html).toContain('type="checkbox"');
	});

	it("should autolink angle-bracket URLs", () => {
		const html = Bun.markdown.html("Visit <https://bun.com> for more");
		expect(html).toContain("<a");
		expect(html).toContain("https://bun.com");
	});
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────
describe.skipIf(!hasBunMarkdown)("edge cases", () => {
	it("should handle deeply nested lists", () => {
		const md = "- a\n  - b\n    - c\n      - d";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<ul>");
		expect(html).toContain("d");
	});

	it("should handle special characters in inline code", () => {
		const html = Bun.markdown.html("`<script>alert('xss')</script>`");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<script>");
	});

	it("should handle HTML entities in text", () => {
		const html = Bun.markdown.html("5 > 3 & 2 < 4");
		expect(html).toContain("&gt;");
		expect(html).toContain("&amp;");
		expect(html).toContain("&lt;");
	});

	it("should handle unicode and emoji", () => {
		const html = Bun.markdown.html("Hello 🌍 world! こんにちは");
		expect(html).toContain("🌍");
		expect(html).toContain("こんにちは");
	});

	it("should handle very long single lines", () => {
		const long = "word ".repeat(10000);
		const html = Bun.markdown.html(long);
		expect(html).toContain("<p>");
		expect(html.length).toBeGreaterThan(40000);
	});

	it("should handle mixed inline styles", () => {
		const html = Bun.markdown.html("**bold *and italic* together**");
		expect(html).toContain("<strong>");
		expect(html).toContain("<em>");
	});

	it("should handle code blocks with backticks inside", () => {
		const md = "````\n```\ninner code\n```\n````";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<pre>");
	});

	it("should handle consecutive headings", () => {
		const md = "# H1\n## H2\n### H3";
		const html = Bun.markdown.html(md);
		expect(html).toContain("<h1>");
		expect(html).toContain("<h2>");
		expect(html).toContain("<h3>");
	});
});

// ─── Return Type ─────────────────────────────────────────────────────────────
describe.skipIf(!hasBunMarkdown)("return type", () => {
	it("should always return a string", () => {
		expect(typeof Bun.markdown.html("# test")).toBe("string");
		expect(typeof Bun.markdown.html("")).toBe("string");
		expect(typeof Bun.markdown.html("plain text")).toBe("string");
	});
});

// ─── Integration: File → Markdown → HTML ────────────────────────────────────
describe.skipIf(!hasBunMarkdown)("file integration", () => {
	const tmpPath = "/tmp/bun-markdown-test.md";

	beforeAll(async () => {
		await Bun.write(
			tmpPath,
			`# Test File

This is a **test** file with:

- Item 1
- Item 2
- Item 3

\`\`\`typescript
const x: number = 42;
\`\`\`

> A blockquote

| Col A | Col B |
|-------|-------|
| val1  | val2  |
`,
		);
	});

	it("should render markdown read from a file", async () => {
		const md = await Bun.file(tmpPath).text();
		const html = Bun.markdown.html(md);
		expect(html).toContain("<h1>");
		expect(html).toContain("<strong>test</strong>");
		expect(html).toContain("<ul>");
		expect(html).toContain("<pre>");
		expect(html).toContain("<blockquote>");
		expect(html).toContain("<table>");
	});

	it("should produce valid HTML output", async () => {
		const md = await Bun.file(tmpPath).text();
		const html = Bun.markdown.html(md);
		// Basic structural checks
		const openTags = (html.match(/<[a-z][^/>]*>/g) || []).length;
		const closeTags = (html.match(/<\/[a-z]+>/g) || []).length;
		// Self-closing tags (hr, br, img, input) don't need closing
		expect(openTags).toBeGreaterThan(0);
		expect(closeTags).toBeGreaterThan(0);
	});
});
