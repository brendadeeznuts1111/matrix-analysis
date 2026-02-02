import { describe, it, expect } from "bun:test";
import { html, render } from "../markdown.ts";

describe("markdown", () => {
  describe("BN-103: Markdown to HTML", () => {
    it("should convert heading", () => {
      const result = html("# Hello");
      expect(result).not.toBeNull();
      expect(result).toContain("<h1>");
      expect(result).toContain("Hello");
    });

    it("should convert bold text", () => {
      const result = html("**bold**");
      expect(result).toContain("<strong>");
    });

    it("should convert italic text", () => {
      const result = html("*italic*");
      expect(result).toContain("<em>");
    });

    it("should convert links", () => {
      const result = html("[link](https://example.com)");
      expect(result).toContain("href=");
      expect(result).toContain("example.com");
    });

    it("should convert code blocks", () => {
      const result = html("```\ncode\n```");
      expect(result).toContain("<code>");
    });

    it("should convert lists", () => {
      const result = html("- one\n- two\n- three");
      expect(result).toContain("<li>");
    });

    it("should render be an alias for html", () => {
      expect(render("# Test")).toBe(html("# Test"));
    });

    it("should handle empty string", () => {
      const result = html("");
      expect(result).not.toBeNull();
      expect(typeof result).toBe("string");
    });

    it("should handle complex markdown", () => {
      const md = "# Title\n\n> blockquote\n\n| col1 | col2 |\n|------|------|\n| a | b |\n";
      const result = html(md);
      expect(result).not.toBeNull();
      expect(result).toContain("Title");
    });
  });
});
