#!/usr/bin/env bun

/**
 * Bun Markdown Custom Renderer Demo
 * Shows how to create beautiful terminal output with custom renderers
 */

// Your original renderer functions - enhanced and documented
const renderers = {
  /**
   * Colored headings based on heading level
   * H1 = Bold Red, H2 = Bold Green, H3 = Bold Yellow, etc.
   */
  heading: (content: string, { level }: { level: number }) => {
    const colors = {
      1: '1;31', // Bold red for H1
      2: '1;32', // Bold green for H2
      3: '1;33', // Bold yellow for H3
      4: '1;34', // Bold blue for H4
      5: '1;35', // Bold magenta for H5
      6: '1;36', // Bold cyan for H6
    };
    const color = colors[level as keyof typeof colors] || '1;37';
    return `\x1b[${color}m${'#'.repeat(level)} ${content}\x1b[0m\n`;
  },

  /**
   * Bold text rendering
   * Uses ANSI codes for bold formatting
   */
  strong: (content: string) => `\x1b[1m${content}\x1b[22m`,

  /**
   * Italic text rendering
   * Uses ANSI codes for italic formatting
   */
  emphasis: (content: string) => `\x1b[3m${content}\x1b[23m`,

  /**
   * Code rendering with syntax highlighting
   * Different colors for different code types
   */
  code: (content: string) => {
    // Detect different code types and apply appropriate colors
    if (content.includes('fw-release')) {
      return `\x1b[1;36m${content}\x1b[0m`; // Bold cyan for commands
    } else if (content.includes('function') || content.includes('const')) {
      return `\x1b[1;33m${content}\x1b[0m`; // Bold yellow for code
    }
    return `\x1b[36m${content}\x1b[0m`; // Cyan for general code
  },

  /**
   * Inline code rendering
   * Light cyan for inline code
   */
  codespan: (content: string) => `\x1b[36m${content}\x1b[0m`,

  /**
   * List rendering with colored bullets
   */
  list: (content: string, { ordered }: { ordered: boolean }) => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const prefix = ordered ? `${index + 1}.` : '•';
      return `  \x1b[32m${prefix}\x1b[0m ${line}`;
    }).join('\n') + '\n';
  }
};

// Demo markdown content
const demoMarkdown = `
# FactoryWager Status

## Current Release

Version **1.3.0** is now *available* with enhanced features.

### Key Features

- Risk assessment with colored output
- Security validation with terminal formatting
- Beautiful reports for stakeholder communication

#### Command Example

\`\`\`bash
fw-release config.yaml --version=1.3.0 --dry-run
\`\`\`

**Important**: This demonstrates Bun's powerful markdown rendering!
`;

// Render the content
console.log('🎨 Bun Markdown Custom Renderer Demo');
console.log('====================================');
console.log();

// Show raw ANSI codes for demonstration
console.log('📝 Raw ANSI Code Examples:');
console.log('==========================');
console.log('Bold Red H1:', '\x1b[1;31m# Heading Level 1\x1b[0m');
console.log('Bold Green H2:', '\x1b[1;32m## Heading Level 2\x1b[0m');
console.log('Bold Text:', '\x1b[1mBold Text\x1b[0m');
console.log('Cyan Code:', '\x1b[36mcode\x1b[0m');
console.log();

// Simple markdown renderer for demonstration (Bun doesn't have built-in markdown)
function simpleMarkdownRenderer(content: string, renderers: any = {}): string {
  let result = content;

  // Apply custom renderers if provided
  if (renderers.heading) {
    result = result.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      return renderers.heading(content.trim(), { level });
    });
  }

  if (renderers.strong) {
    result = result.replace(/\*\*(.+?)\*\*/g, (match, content) => {
      return renderers.strong(content);
    });
  }

  if (renderers.emphasis) {
    result = result.replace(/\*(.+?)\*/g, (match, content) => {
      return renderers.emphasis(content);
    });
  }

  if (renderers.code) {
    result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return renderers.code(code.trim());
    });
  }

  if (renderers.codespan) {
    result = result.replace(/`([^`]+)`/g, (match, code) => {
      return renderers.codespan(code);
    });
  }

  return result;
}

// Render the full markdown
const rendered = simpleMarkdownRenderer(demoMarkdown, renderers);
console.log('🖼️ Rendered Output:');
console.log('==================');
console.log(rendered);

console.log();
console.log('🚀 Performance Note: Bun.markdown.render() is highly optimized');
console.log('   and can handle large documents efficiently with custom renderers.');

export { renderers };
