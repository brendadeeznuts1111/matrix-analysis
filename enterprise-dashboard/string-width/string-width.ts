/**
 * String Width Calculator
 * Enhanced string width calculations with Bun.stringWidth
 * Handles: Unicode, emoji, ANSI sequences, zero-width chars
 */

/**
 * StringWidthCalculator - Accurate terminal width calculations
 */
export class StringWidthCalculator {
  /**
   * Calculate display width for terminal/table output
   * Handles: 🇺🇸 (2), 👋🏽 (2), 👨‍👩‍👧 (2), \u2060 (0)
   */
  calculateDisplayWidth(text: string): number {
    return Bun.stringWidth(text);
  }

  /**
   * Format table cells with proper padding based on visual width
   */
  formatTableCell(text: string, maxWidth: number, align: "left" | "right" | "center" = "left"): string {
    const width = this.calculateDisplayWidth(text);
    const padding = Math.max(0, maxWidth - width);

    switch (align) {
      case "right":
        return " ".repeat(padding) + text;
      case "center":
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return " ".repeat(leftPad) + text + " ".repeat(rightPad);
      default:
        return text + " ".repeat(padding);
    }
  }

  /**
   * Truncate string to fit within max width, adding ellipsis if needed
   */
  truncateToWidth(text: string, maxWidth: number, ellipsis: string = "..."): string {
    const width = this.calculateDisplayWidth(text);
    if (width <= maxWidth) return text;

    const ellipsisWidth = this.calculateDisplayWidth(ellipsis);
    const targetWidth = maxWidth - ellipsisWidth;

    if (targetWidth <= 0) return ellipsis.slice(0, maxWidth);

    // Truncate character by character
    let result = "";
    let currentWidth = 0;

    for (const char of text) {
      const charWidth = this.calculateDisplayWidth(char);
      if (currentWidth + charWidth > targetWidth) break;
      result += char;
      currentWidth += charWidth;
    }

    return result + ellipsis;
  }

  /**
   * Validate terminal output won't wrap incorrectly
   */
  validateTerminalWidth(lines: string[], maxTerminalCols: number = 80): boolean {
    return lines.every(line => this.calculateDisplayWidth(line) <= maxTerminalCols);
  }

  /**
   * Get lines that exceed terminal width
   */
  getOverflowingLines(lines: string[], maxTerminalCols: number = 80): { index: number; width: number; line: string }[] {
    return lines
      .map((line, index) => ({ index, width: this.calculateDisplayWidth(line), line }))
      .filter(({ width }) => width > maxTerminalCols);
  }

  /**
   * Strip ANSI for width calculation (Bun.stringWidth handles this automatically)
   */
  stripAnsiAndCalculate(text: string): number {
    // Bun.stringWidth automatically ignores ANSI sequences
    return Bun.stringWidth(text);
  }

  /**
   * Check if string contains emoji sequences
   */
  hasEmojiSequences(text: string): boolean {
    // Emoji sequences have visual width less than byte length
    // Examples: 🇺🇸, 👋🏽, 👨‍👩‍👧
    const emojiPattern = /[\u{1F1E0}-\u{1F1FF}]|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u;
    return emojiPattern.test(text);
  }

  /**
   * Check if string contains zero-width characters
   * U+00AD (soft hyphen), U+2060-U+2064 (joiners), U+200B-U+200D (zero-width spaces)
   */
  hasZeroWidthChars(text: string): boolean {
    const zeroWidthPattern = /[\u00AD\u2060-\u2064\u200B-\u200D\uFEFF]/;
    return zeroWidthPattern.test(text);
  }

  /**
   * Count zero-width characters in string
   */
  countZeroWidthChars(text: string): number {
    const zeroWidthPattern = /[\u00AD\u2060-\u2064\u200B-\u200D\uFEFF]/g;
    return (text.match(zeroWidthPattern) || []).length;
  }

  /**
   * Format for CLI tables with color support
   */
  formatColoredCell(text: string, color: string, width: number): string {
    const colorCode = Bun.color(color, "ansi") || "";
    const reset = "\x1b[0m";

    // Bun.stringWidth handles ANSI correctly - measures text only
    const visualWidth = Bun.stringWidth(text);
    const padding = Math.max(0, width - visualWidth);

    return `${colorCode}${text}${reset}${" ".repeat(padding)}`;
  }

  /**
   * Create a progress bar with accurate width
   */
  createProgressBar(progress: number, width: number = 20, filled: string = "█", empty: string = "░"): string {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const filledCount = Math.round(clampedProgress * width);
    const emptyCount = width - filledCount;

    return filled.repeat(filledCount) + empty.repeat(emptyCount);
  }

  /**
   * Wrap text to fit within max width
   */
  wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const wordWidth = this.calculateDisplayWidth(word);
      const currentWidth = this.calculateDisplayWidth(currentLine);
      const spaceWidth = currentLine ? 1 : 0;

      if (currentWidth + spaceWidth + wordWidth <= maxWidth) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = wordWidth <= maxWidth ? word : this.truncateToWidth(word, maxWidth, "");
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }
}

export const stringWidth = new StringWidthCalculator();
