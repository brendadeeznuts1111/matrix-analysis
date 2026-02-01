// factory-wager/render/opengraph-ascii.ts
export interface OpenGraphData {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  date?: string;
}

export class OpenGraphASCIICard {
  private colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    gray: '\x1b[90m',
    white: '\x1b[37m'
  };

  render(data: OpenGraphData): string {
    const width = 60;
    const title = this.truncate(data.title, width - 4);
    const desc = this.truncate(data.description || '', width - 4);
    const author = data.author || 'Unknown';
    const date = data.date || new Date().toISOString().split('T')[0];
    
    let card = '\n';
    card += `${this.colors.cyan}╔${'═'.repeat(width)}╗${this.colors.reset}\n`;
    card += `${this.colors.cyan}║${this.colors.reset}${this.colors.bold}${' '.repeat(Math.floor((width - title.length) / 2))}${title}${' '.repeat(Math.ceil((width - title.length) / 2))}${this.colors.reset}${this.colors.cyan}║${this.colors.reset}\n`;
    card += `${this.colors.cyan}╠${'═'.repeat(width)}╣${this.colors.reset}\n`;
    
    // ASCII image placeholder
    card += `${this.colors.cyan}║${this.colors.reset}${this.colors.gray}${' '.repeat(15)}┌${'─'.repeat(20)}┐${' '.repeat(23)}${this.colors.cyan}║${this.colors.reset}\n`;
    card += `${this.colors.cyan}║${this.colors.reset}${this.colors.gray}${' '.repeat(15)}│${' '.repeat(20)}│${' '.repeat(23)}${this.colors.cyan}║${this.colors.reset}\n`;
    card += `${this.colors.cyan}║${this.colors.reset}${this.colors.gray}${' '.repeat(15)}│${this.colors.yellow}   📄 PREVIEW${' '.repeat(7)}│${' '.repeat(23)}${this.colors.cyan}║${this.colors.reset}\n`;
    card += `${this.colors.cyan}║${this.colors.reset}${this.colors.gray}${' '.repeat(15)}│${' '.repeat(20)}│${' '.repeat(23)}${this.colors.cyan}║${this.colors.reset}\n`;
    card += `${this.colors.cyan}║${this.colors.reset}${this.colors.gray}${' '.repeat(15)}└${'─'.repeat(20)}┘${' '.repeat(23)}${this.colors.cyan}║${this.colors.reset}\n`;
    
    card += `${this.colors.cyan}╠${'═'.repeat(width)}╣${this.colors.reset}\n`;
    
    // Description
    const descLines = this.wrapText(desc, width - 4);
    descLines.forEach(line => {
      card += `${this.colors.cyan}║${this.colors.reset} ${this.colors.white}${line.padEnd(width - 2)}${this.colors.reset}${this.colors.cyan}║${this.colors.reset}\n`;
    });
    
    card += `${this.colors.cyan}╠${'═'.repeat(width)}╣${this.colors.reset}\n`;
    card += `${this.colors.cyan}║${this.colors.reset} ${this.colors.green}👤 ${author.padEnd(20)}${this.colors.reset}${this.colors.gray}📅 ${date}${this.colors.reset}${' '.repeat(width - 35 - author.length)}${this.colors.cyan}║${this.colors.reset}\n`;
    card += `${this.colors.cyan}╚${'═'.repeat(width)}╝${this.colors.reset}\n`;
    
    return card;
  }

  private truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
  }

  private wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length > width) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines.length ? lines : [''];
  }
}
