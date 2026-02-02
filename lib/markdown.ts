// lib/markdown.ts - Markdown to HTML conversion
// =============================================================================
// Bun-native markdown rendering
// =============================================================================

// -----------------------------------------------------------------------------
// BN-103: Markdown
// -----------------------------------------------------------------------------
export const html = (input: string): string | null => {
  try {
    return Bun.markdown.html(input);
  } catch {
    return null;
  }
};

// Alias for clarity
export const render = html;
