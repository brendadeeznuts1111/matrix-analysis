// factory-wager/render/ansi-diff.ts
import { ANSIRenderer } from './ansi-renderer';

export interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export class ANSIDiffer {
  private colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    gray: '\x1b[90m',
    bold: '\x1b[1m'
  };

  diffFiles(oldFile: string, newFile: string): string {
    const oldContent = this.extractContent(oldFile);
    const newContent = this.extractContent(newFile);
    const oldFm = this.extractFrontmatter(oldFile);
    const newFm = this.extractFrontmatter(newFile);
    
    let output = `${this.colors.bold}╔══ FILE DIFF ══╗${this.colors.reset}\n\n`;
    
    // Frontmatter diff
    output += `${this.colors.yellow}${this.colors.bold}FRONTMATTER CHANGES:${this.colors.reset}\n`;
    const allKeys = new Set([...Object.keys(oldFm), ...Object.keys(newFm)]);
    
    for (const key of Array.from(allKeys)) {
      const oldVal = oldFm[key];
      const newVal = newFm[key];
      
      if (!(key in oldFm)) {
        output += `  ${this.colors.green}+ ${key}: ${newVal}${this.colors.reset}\n`;
      } else if (!(key in newFm)) {
        output += `  ${this.colors.red}- ${key}: ${oldVal}${this.colors.reset}\n`;
      } else if (oldVal !== newVal) {
        output += `  ${this.colors.yellow}~ ${key}:${this.colors.reset}\n`;
        output += `    ${this.colors.red}- ${oldVal}${this.colors.reset}\n`;
        output += `    ${this.colors.green}+ ${newVal}${this.colors.reset}\n`;
      } else {
        output += `  ${this.colors.gray}  ${key}: ${newVal}${this.colors.reset}\n`;
      }
    }
    
    // Content diff
    output += `\n${this.colors.yellow}${this.colors.bold}CONTENT CHANGES:${this.colors.reset}\n`;
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) {
        output += `${this.colors.green}+ ${newLines[j]}${this.colors.reset}\n`;
        j++;
      } else if (j >= newLines.length) {
        output += `${this.colors.red}- ${oldLines[i]}${this.colors.reset}\n`;
        i++;
      } else if (oldLines[i] === newLines[j]) {
        output += `  ${this.colors.gray}${oldLines[i]}${this.colors.reset}\n`;
        i++; j++;
      } else {
        output += `${this.colors.red}- ${oldLines[i]}${this.colors.reset}\n`;
        output += `${this.colors.green}+ ${newLines[j]}${this.colors.reset}\n`;
        i++; j++;
      }
    }
    
    return output;
  }

  private extractContent(file: string): string {
    const parts = file.split('---');
    return parts.length > 2 ? parts.slice(2).join('---').trim() : file.trim();
  }

  private extractFrontmatter(file: string): Record<string, any> {
    const match = file.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    
    const fm: Record<string, any> = {};
    match[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        fm[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
      }
    });
    return fm;
  }
}
