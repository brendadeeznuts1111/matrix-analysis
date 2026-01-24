/**
 * Enterprise Bookmark Resource Monitor (Bun 1.3.6+)
 *
 * Mirrors chrome://bookmarks/?id=2 structure for enterprise resources.
 * Uses Bun.resolveSync for local paths, stringWidth for alignment,
 * and openInEditor for quick file access.
 */

import { inspect, stringWidth, randomUUIDv7 } from "bun";

// ============================================================================
// Types
// ============================================================================

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folder: string;
  dateAdded?: number;
  tags?: string[];
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  children: string[]; // Bookmark IDs
}

export interface SearchResult {
  bookmark: Bookmark;
  matchType: "title" | "url" | "tag";
  matchScore: number;
}

// ============================================================================
// Chrome Standard Folder IDs
// ============================================================================

export const CHROME_FOLDERS = {
  ROOT: "0",
  BOOKMARKS_BAR: "1",
  OTHER_BOOKMARKS: "2",
  MOBILE_BOOKMARKS: "3",
} as const;

// ============================================================================
// BookmarkManager Class
// ============================================================================

export class BookmarkManager {
  private bookmarks: Map<string, Bookmark> = new Map();
  private folders: Map<string, BookmarkFolder> = new Map();

  constructor() {
    // Initialize standard Chrome folders
    this.folders.set(CHROME_FOLDERS.BOOKMARKS_BAR, {
      id: CHROME_FOLDERS.BOOKMARKS_BAR,
      name: "Bookmarks Bar",
      parentId: CHROME_FOLDERS.ROOT,
      children: [],
    });
    this.folders.set(CHROME_FOLDERS.OTHER_BOOKMARKS, {
      id: CHROME_FOLDERS.OTHER_BOOKMARKS,
      name: "Other Bookmarks",
      parentId: CHROME_FOLDERS.ROOT,
      children: [],
    });
    this.folders.set(CHROME_FOLDERS.MOBILE_BOOKMARKS, {
      id: CHROME_FOLDERS.MOBILE_BOOKMARKS,
      name: "Mobile Bookmarks",
      parentId: CHROME_FOLDERS.ROOT,
      children: [],
    });
  }

  /**
   * 1. PATH RESOLUTION
   * Resolves internal documentation paths using Bun.resolveSync
   */
  static getDocPath(file: string): string {
    try {
      return Bun.resolveSync(file, process.cwd());
    } catch {
      return "External URL";
    }
  }

  /**
   * 2. ADD BOOKMARK
   * Creates a new bookmark with time-ordered UUID
   */
  add(title: string, url: string, folder = CHROME_FOLDERS.OTHER_BOOKMARKS, tags?: string[]): Bookmark {
    // Use full UUID to avoid collisions on rapid insertions (first 12 chars are timestamp-based)
    const id = randomUUIDv7("hex");
    const bookmark: Bookmark = {
      id,
      title,
      url,
      folder,
      dateAdded: Date.now(),
      tags,
    };

    this.bookmarks.set(id, bookmark);

    // Add to folder
    const folderData = this.folders.get(folder);
    if (folderData) {
      folderData.children.push(id);
    }

    return bookmark;
  }

  /**
   * 3. GET BOOKMARKS BY FOLDER
   */
  getByFolder(folderId: string): Bookmark[] {
    return Array.from(this.bookmarks.values()).filter((b) => b.folder === folderId);
  }

  /**
   * 4. SEARCH BOOKMARKS
   * Case-insensitive search across title, URL, and tags
   */
  search(query: string): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const results: SearchResult[] = [];

    for (const bookmark of this.bookmarks.values()) {
      // Title match (highest priority)
      if (bookmark.title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          bookmark,
          matchType: "title",
          matchScore: bookmark.title.toLowerCase().startsWith(normalizedQuery) ? 100 : 80,
        });
        continue;
      }

      // Tag match (medium priority)
      if (bookmark.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))) {
        results.push({
          bookmark,
          matchType: "tag",
          matchScore: 60,
        });
        continue;
      }

      // URL match (lower priority)
      if (bookmark.url.toLowerCase().includes(normalizedQuery)) {
        results.push({
          bookmark,
          matchType: "url",
          matchScore: 40,
        });
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * 5. RENDER FOLDER VIEW
   * Mirrors chrome://bookmarks/?id=X
   */
  render(folderId = CHROME_FOLDERS.OTHER_BOOKMARKS): void {
    const cols = process.stdout.columns || 80;
    const folder = this.folders.get(folderId);
    const bookmarks = this.getByFolder(folderId);

    console.log(`\n\x1b[1m🔖 Chrome Bookmarks | ${folder?.name || "Unknown"} (ID: ${folderId})\x1b[0m`);
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m`);

    if (bookmarks.length === 0) {
      console.log("\x1b[90m  No bookmarks in this folder\x1b[0m\n");
      return;
    }

    const tableData = bookmarks.map((b) => {
      const isLocal = !b.url.startsWith("http");
      const maxUrlWidth = Math.floor(cols * 0.4);
      const displayUrl =
        stringWidth(b.url) > maxUrlWidth ? b.url.slice(0, maxUrlWidth - 3) + "..." : b.url;

      return {
        ID: `[${b.id.slice(0, 8)}]`,
        Title: truncateTitle(b.title, 25),
        Location: displayUrl,
        Type: isLocal ? "📄 Local" : "🌐 Web",
        Tags: b.tags?.slice(0, 2).join(", ") || "—",
      };
    });

    console.log(inspect.table(tableData, undefined, { colors: true }));
  }

  /**
   * 6. RENDER SEARCH RESULTS
   */
  renderSearch(query: string): void {
    const cols = process.stdout.columns || 80;
    const results = this.search(query);

    console.log(`\n\x1b[1m🔍 Search: "${query}"\x1b[0m`);
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m`);

    if (results.length === 0) {
      console.log("\x1b[90m  No matching bookmarks\x1b[0m\n");
      return;
    }

    console.log(`\x1b[90m  Found ${results.length} result(s)\x1b[0m\n`);

    const tableData = results.map((r) => {
      const matchColor =
        r.matchType === "title" ? "\x1b[32m" : r.matchType === "tag" ? "\x1b[33m" : "\x1b[90m";

      return {
        Score: `${r.matchScore}`,
        Match: `${matchColor}${r.matchType}\x1b[0m`,
        Title: truncateTitle(r.bookmark.title, 25),
        URL: truncateUrl(r.bookmark.url, 35),
      };
    });

    console.log(inspect.table(tableData, undefined, { colors: true }));
  }

  /**
   * 7. OPEN BOOKMARK
   * Opens local files in editor, logs web URLs
   */
  async open(bookmarkId: string): Promise<boolean> {
    const bookmark = this.bookmarks.get(bookmarkId);
    if (!bookmark) return false;

    if (bookmark.url.startsWith("http")) {
      console.log(`\x1b[36m[Open]\x1b[0m ${bookmark.url}`);
      // In a real implementation, you'd use Bun.spawn to open in browser
      return true;
    }

    // Local file - open in editor
    try {
      const resolvedPath = BookmarkManager.getDocPath(bookmark.url);
      if (resolvedPath !== "External URL") {
        Bun.openInEditor(resolvedPath);
        console.log(`\x1b[32m[Editor]\x1b[0m Opened ${bookmark.url}`);
        return true;
      }
    } catch {
      console.log(`\x1b[31m[Error]\x1b[0m Could not open ${bookmark.url}`);
    }

    return false;
  }

  /**
   * 8. IMPORT FROM ARRAY
   */
  importBookmarks(bookmarks: Array<Omit<Bookmark, "id" | "dateAdded">>): number {
    let count = 0;
    for (const b of bookmarks) {
      this.add(b.title, b.url, b.folder, b.tags);
      count++;
    }
    return count;
  }

  /**
   * 9. EXPORT TO ARRAY
   */
  exportBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values());
  }

  /**
   * 10. GET STATS
   */
  getStats() {
    const all = Array.from(this.bookmarks.values());
    const local = all.filter((b) => !b.url.startsWith("http")).length;
    const web = all.length - local;

    return {
      total: all.length,
      local,
      web,
      folders: this.folders.size,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function truncateTitle(title: string, maxWidth: number): string {
  if (stringWidth(title) <= maxWidth) return title;

  let result = "";
  let width = 0;
  for (const char of title) {
    const charWidth = stringWidth(char);
    if (width + charWidth + 3 > maxWidth) break;
    result += char;
    width += charWidth;
  }
  return result + "...";
}

function truncateUrl(url: string, maxWidth: number): string {
  // Strip protocol for display
  const display = url.replace(/^https?:\/\//, "");
  if (stringWidth(display) <= maxWidth) return display;

  let result = "";
  let width = 0;
  for (const char of display) {
    const charWidth = stringWidth(char);
    if (width + charWidth + 3 > maxWidth) break;
    result += char;
    width += charWidth;
  }
  return result + "...";
}

// ============================================================================
// Demo & CLI
// ============================================================================

export function demo(): void {
  const manager = new BookmarkManager();

  // Import enterprise bookmarks
  manager.importBookmarks([
    { title: "API Documentation", url: "https://api.enterprise.com/docs", folder: "2", tags: ["api", "docs"] },
    { title: "Deployment Guide", url: "./docs/deploy.md", folder: "2", tags: ["deploy", "ops"] },
    { title: "Grafana Dashboard", url: "https://metrics.enterprise.com/d/main", folder: "2", tags: ["metrics"] },
    { title: "Bun Runtime Docs", url: "https://bun.sh/docs", folder: "2", tags: ["bun", "runtime"] },
    { title: "Internal Wiki", url: "https://wiki.enterprise.com", folder: "2", tags: ["wiki", "internal"] },
    { title: "Architecture Diagram", url: "./docs/architecture.svg", folder: "2", tags: ["arch", "diagram"] },
    { title: "CI/CD Pipeline", url: "https://github.com/enterprise/actions", folder: "1", tags: ["ci", "github"] },
    { title: "Slack Channel", url: "https://enterprise.slack.com/archives/dev", folder: "1", tags: ["slack"] },
  ]);

  // Render Other Bookmarks folder
  manager.render(CHROME_FOLDERS.OTHER_BOOKMARKS);

  // Render Bookmarks Bar
  manager.render(CHROME_FOLDERS.BOOKMARKS_BAR);

  // Search demo
  manager.renderSearch("docs");
  manager.renderSearch("metrics");

  // Stats
  console.log("\n\x1b[1m📊 Bookmark Stats\x1b[0m");
  console.log(inspect.table([manager.getStats()], undefined, { colors: true }));
}

// Run demo if executed directly
if (import.meta.main) {
  const args = new Set(Bun.argv.slice(2));
  const searchQuery = Bun.argv.find((a, i) => Bun.argv[i - 1] === "--search" || Bun.argv[i - 1] === "-s");

  if (args.has("--help") || args.has("-h")) {
    console.log(`
🔖 Bookmark Resource Monitor

Usage:
  bun src/ui/bookmarks.ts              # Run demo
  bun src/ui/bookmarks.ts -s <query>   # Search bookmarks
  bun src/ui/bookmarks.ts --search api # Search for "api"
`);
  } else if (searchQuery) {
    const manager = new BookmarkManager();
    manager.importBookmarks([
      { title: "API Documentation", url: "https://api.enterprise.com/docs", folder: "2", tags: ["api"] },
      { title: "Bun Runtime Docs", url: "https://bun.sh/docs", folder: "2", tags: ["bun"] },
      { title: "Internal Wiki", url: "https://wiki.enterprise.com", folder: "2", tags: ["wiki"] },
    ]);
    manager.renderSearch(searchQuery);
  } else {
    demo();
  }
}
