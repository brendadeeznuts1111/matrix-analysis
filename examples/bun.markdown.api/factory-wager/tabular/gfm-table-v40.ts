// factory-wager/tabular/gfm-table-v40.ts (enhanced)
import { wrapAnsi } from 'bun';

function renderCell(value: string, colWidth: number): string {
  // Wrap while preserving ANSI codes
  const wrapped = wrapAnsi(value, colWidth, {
    hard: false,           // word boundaries
    trim: true,
    ambiguousIsNarrow: true
  });

  // Optional: truncate last line if still too long
  const lines = wrapped.split('\n');
  if (lines[lines.length-1].length > colWidth) {
    lines[lines.length-1] = lines[lines.length-1].slice(0, colWidth-1) + '…';
  }

  return lines.join('\n');
}

// Enhanced table rendering with Bun.wrapAnsi
export class GfmTableRenderer {
  private colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };

  renderTable(headers: string[], rows: string[][]): string {
    const colWidths = this.calculateColumnWidths(headers, rows);
    
    // Render header
    let table = this.renderRow(headers, colWidths, true);
    table += '\n' + this.renderSeparator(colWidths);
    
    // Render data rows
    for (const row of rows) {
      table += '\n' + this.renderRow(row, colWidths, false);
    }
    
    return table;
  }

  private calculateColumnWidths(headers: string[], rows: string[][]): number[] {
    const widths = headers.map(h => h.length);
    
    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        const cellLength = this.stripAnsi(row[i]).length;
        if (cellLength > widths[i]) {
          widths[i] = cellLength;
        }
      }
    }
    
    return widths;
  }

  private renderRow(row: string[], widths: number[], isHeader: boolean): string {
    const cells = row.map((cell, i) => renderCell(cell, widths[i]));
    
    const separator = '│';
    return cells.join(separator);
  }

  private renderSeparator(widths: number[]): string {
    const parts = widths.map(width => '├' + '─'.repeat(width));
    return parts.join('┼') + '┤';
  }

  private stripAnsi(text: string): string {
    // Remove ANSI escape codes for length calculation
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }
}

// Example usage
export function createEnhancedTable() {
  const renderer = new GfmTableRenderer();
  
  const headers = ['Service', 'Status', 'Latency', 'Uptime'];
  const rows = [
    ['API Gateway', '✅ Healthy', '45ms', '99.9%'],
    ['Database', '⚠️ Slow', '120ms', '99.5%'],
    ['Cache', '✅ Fast', '2ms', '100%']
  ];
  
  return renderer.renderTable(headers, rows);
}

export { renderCell };
