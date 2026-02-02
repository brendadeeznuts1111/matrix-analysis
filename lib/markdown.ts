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

// -----------------------------------------------------------------------------
// BN-126: Markdown Render with Callbacks and Options
// -----------------------------------------------------------------------------
export interface MarkdownOptions {
  tables?: boolean;
  strikethrough?: boolean;
  tasklists?: boolean;
  wikiLinks?: boolean;
  latexMath?: boolean;
  autolinks?: boolean | { url?: boolean; www?: boolean; email?: boolean };
}

export const render = (
  input: string,
  callbacks?: Record<string, Function>,
  options?: MarkdownOptions,
): string | null => {
  try {
    return Bun.markdown.render(input, callbacks, options);
  } catch {
    return null;
  }
};
