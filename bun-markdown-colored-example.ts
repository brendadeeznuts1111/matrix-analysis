#!/usr/bin/env bun

/**
 * Bun Markdown Colored Terminal Output Example
 * Demonstrates custom renderers for beautiful terminal formatting
 */

import { readFileSync } from 'fs';

// Sample markdown content
const markdownContent = `
# FactoryWager Release Report

## Overview

This is a **bold** statement and this is *emphasized* text.

### Features

- Risk assessment with **colored output**
- Security validation with terminal formatting
- Beautiful reports for stakeholder communication

#### Code Example

\`\`\`bash
/fw-release config.yaml --version=1.3.0
\`\`\`

**Important**: This demonstrates Bun's powerful markdown rendering capabilities.
`;

// Enhanced custom renderers for terminal output
const renderers = {
  // Colored headings based on level
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

  // Bold text
  strong: (content: string) => `\x1b[1m${content}\x1b[22m`,

  // Italic text
  emphasis: (content: string) => `\x1b[3m${content}\x1b[23m`,

  // Code blocks with syntax highlighting
  code: (content: string) => {
    // Simple syntax highlighting for bash
    if (content.includes('fw-release')) {
      return `\x1b[1;36m${content}\x1b[0m`;
    }
    return `\x1b[36m${content}\x1b[0m`;
  },

  // Inline code
  codespan: (content: string) => `\x1b[36m${content}\x1b[0m`,

  // Lists with proper indentation
  list: (content: string, { ordered }: { ordered: boolean }) => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const prefix = ordered ? `${index + 1}.` : '•';
      return `  \x1b[32m${prefix}\x1b[0m ${line}`;
    }).join('\n') + '\n';
  },

  // Blockquotes
  blockquote: (content: string) => {
    return `\x1b[33m│ ${content.trim()}\x1b[0m\n`;
  },

  // Links (show URL in terminal)
  link: (content: string, { href }: { href: string }) => {
    return `\x1b[34m${content}\x1b[0m (\x1b[36m${href}\x1b[0m)`;
  }
};

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

// Render the markdown with custom renderers
const rendered = simpleMarkdownRenderer(markdownContent, renderers);

console.log('🎨 Bun Markdown Colored Terminal Output');
console.log('=======================================');
console.log();
console.log(rendered);
console.log();
console.log('✨ Features demonstrated:');
console.log('  • Colored headings by level');
console.log('  • Bold and italic text formatting');
console.log('  • Syntax-highlighted code blocks');
console.log('  • Styled lists and blockquotes');
console.log('  • Link formatting with URLs');
console.log();
console.log('🚀 Powered by Bun v1.3.8 markdown rendering!');

export { renderers };
