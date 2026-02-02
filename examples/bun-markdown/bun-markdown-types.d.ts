/**
 * Type declarations for Bun v1.3.8 markdown API
 * Adds missing TypeScript definitions for Bun.markdown
 */

declare global {
  namespace Bun {
    interface MarkdownRenderers {
      [key: string]: (children: string, options?: any) => string;
    }
    
    interface MarkdownOptions {
      [key: string]: (children: string, options?: any) => string | null;
    }
    
    interface MarkdownAPI {
      render(content: string, renderers?: MarkdownOptions): string;
      html(content: string, options?: { headingIds?: boolean; allowHtml?: boolean }): string;
      react(content: string, components?: any, options?: { reactVersion?: number }): any;
    }
    
    const markdown: MarkdownAPI;
  }
}

export {};
