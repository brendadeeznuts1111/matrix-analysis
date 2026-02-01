// factory-wager/render/markdown-engine.ts
export interface RenderOptions {
  headingIds?: boolean;
  hardBreaks?: boolean;
  preserveWhitespace?: boolean;
  frontmatter?: boolean;
  ansi?: boolean;
}

export interface RenderedDocument {
  html: string;
  frontmatter: Record<string, any>;
  meta: {
    title?: string;
    description?: string;
    wordCount: number;
    readingTime: number;
  };
}

export class MarkdownEngine {
  /**
   * Render markdown to HTML using Bun's native renderer
   */
  render(content: string, opts: RenderOptions = {}): string {
    if (opts.frontmatter) {
      const { body } = this.extractFrontmatter(content);
      content = body;
    }

    return Bun.markdown.html(content, {
      headingIds: opts.headingIds ?? true,
      hardBreaks: opts.hardBreaks ?? false,
      preserveWhitespace: opts.preserveWhitespace ?? false
    });
  }

  /**
   * Render with frontmatter extraction and metadata
   */
  async renderDocument(filePath: string, opts: RenderOptions = {}): Promise<RenderedDocument> {
    const content = await Bun.file(filePath).text();
    const { data, body } = this.extractFrontmatter(content);
    
    const html = this.render(body, opts);
    const wordCount = body.split(/\s+/).length;
    
    return {
      html,
      frontmatter: data,
      meta: {
        title: data.title,
        description: data.description,
        wordCount,
        readingTime: Math.ceil(wordCount / 200) // ~200 WPM reading speed
      }
    };
  }

  /**
   * Extract frontmatter from markdown content
   */
  private extractFrontmatter(content: string): { data: Record<string, any>; body: string } {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    
    if (!match) {
      return { data: {}, body: content };
    }

    const data: Record<string, any> = {};
    const yamlLines = match[1].split(/\r?\n/);
    
    for (const line of yamlLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let value: string | string[] | boolean | number = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
        
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        } else if (typeof value === 'string' && (value === 'true' || value === 'false')) {
          value = value === 'true';
        } else if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
          value = Number(value);
        }
        
        data[key] = value;
      }
    }

    return { data, body: match[2].trim() };
  }

  /**
   * Batch render multiple files
   */
  async batchRender(filePaths: string[], opts: RenderOptions = {}): Promise<Map<string, RenderedDocument>> {
    const results = new Map<string, RenderedDocument>();
    
    await Promise.all(
      filePaths.map(async (path) => {
        const doc = await this.renderDocument(path, opts);
        results.set(path, doc);
      })
    );
    
    return results;
  }
}
