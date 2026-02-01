// factory-wager/render/ansi-renderer.ts
export interface ANSIRenderOptions {
  syntaxHighlight?: boolean;
  showLineNumbers?: boolean;
  codeTheme?: 'dark' | 'light';
}

export class ANSIRenderer {
  private colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };

  private tsKeywords = ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'import', 'export', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'switch', 'case'];
  private jsKeywords = ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'async', 'await', 'return', 'if', 'else', 'for', 'while'];

  renderFrontmatter(data: Record<string, any>): string {
    const entries = Object.entries(data);
    const maxKeyLen = Math.max(...entries.map(([k]) => k.length), 15);
    const maxValLen = Math.max(...entries.map(([,v]) => String(v).length), 40);
    
    let output = `${this.colors.cyan}┌${'─'.repeat(maxKeyLen + maxValLen + 7)}┐${this.colors.reset}\n`;
    output += `${this.colors.cyan}│${this.colors.reset}${this.colors.bold} ${'KEY'.padEnd(maxKeyLen)} │ ${'VALUE'.padEnd(maxValLen)} ${this.colors.reset}${this.colors.cyan}│${this.colors.reset}\n`;
    output += `${this.colors.cyan}├${'─'.repeat(maxKeyLen + maxValLen + 7)}┤${this.colors.reset}\n`;
    
    entries.forEach(([key, value]) => {
      const keyStr = key.padEnd(maxKeyLen);
      const valStr = String(value).padEnd(maxValLen);
      const keyColor = key.startsWith('_') ? this.colors.gray : this.colors.yellow;
      const valColor = typeof value === 'boolean' ? (value ? this.colors.green : this.colors.red) : this.colors.white;
      output += `${this.colors.cyan}│${this.colors.reset} ${keyColor}${keyStr}${this.colors.reset} │ ${valColor}${valStr}${this.colors.reset} ${this.colors.cyan}│${this.colors.reset}\n`;
    });
    
    output += `${this.colors.cyan}└${'─'.repeat(maxKeyLen + maxValLen + 7)}┘${this.colors.reset}\n`;
    return output;
  }

  renderMarkdown(content: string): string {
    return content
      .replace(/^### (.*$)/gim, `${this.colors.magenta}### ${this.colors.bold}$1${this.colors.reset}`)
      .replace(/^## (.*$)/gim, `${this.colors.cyan}## ${this.colors.bold}$1${this.colors.reset}`)
      .replace(/^# (.*$)/gim, `${this.colors.blue}# ${this.colors.bold}$1${this.colors.reset}`)
      .replace(/\*\*(.*?)\*\*/g, `${this.colors.bold}$1${this.colors.reset}`)
      .replace(/\*(.*?)\*/g, `${this.colors.italic}$1${this.colors.reset}`)
      .replace(/`(.*?)`/g, `${this.colors.cyan}$1${this.colors.reset}`);
  }

  highlightCode(code: string, lang: string): string {
    const keywords = lang === 'ts' || lang === 'typescript' ? this.tsKeywords : this.jsKeywords;
    let highlighted = code;
    
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      highlighted = highlighted.replace(regex, `${this.colors.blue}${kw}${this.colors.reset}`);
    });
    
    highlighted = highlighted
      .replace(/(['"`].*?['"`])/g, `${this.colors.green}$1${this.colors.reset}`)
      .replace(/(\/\/.*$)/gm, `${this.colors.gray}$1${this.colors.reset}`)
      .replace(/(\/\*[\s\S]*?\*\/)/g, `${this.colors.gray}$1${this.colors.reset}`);
    
    return highlighted;
  }

  render(content: string, frontmatter: Record<string, any>, opts: ANSIRenderOptions = {}): string {
    const parts = content.split('---');
    const body = parts.length > 2 ? parts.slice(2).join('---') : content;
    
    let output = `${this.colors.cyan}${this.colors.bold}╔══ FRONTMATTER ══╗${this.colors.reset}\n`;
    output += this.renderFrontmatter(frontmatter);
    output += `${this.colors.cyan}${this.colors.bold}╚══ CONTENT ══════╝${this.colors.reset}\n\n`;
    output += this.renderMarkdown(body);
    return output;
  }
}
