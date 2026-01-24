/**
 * Chrome-Spec Bookmark Manager (Bun 1.3.6+)
 *
 * Mirrors chrome://bookmarks/?id=2 structure for enterprise resources.
 * Features: visit tracking, Chrome-style IDs, persistence, stats dashboard.
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
  visits?: number;
  lastVisited?: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  children: string[];
}

export interface SearchResult {
  bookmark: Bookmark;
  matchType: "title" | "url" | "tag";
  matchScore: number;
}

export type UrlType = "web" | "local" | "chrome";

export interface ResolvedUrl {
  type: UrlType;
  resolved: string;
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
  private nextChromeId = 101;
  private saveFile: string | null = null;

  constructor(options?: { saveFile?: string; useChromeIds?: boolean }) {
    this.saveFile = options?.saveFile ?? null;

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

    // Load from file if specified
    if (this.saveFile) {
      this.loadFromFile();
    }
  }

  // ==========================================================================
  // URL Resolution
  // ==========================================================================

  /**
   * Resolves URL and determines type (web, local, chrome)
   */
  static resolveUrl(url: string): ResolvedUrl {
    // Chrome internal URLs
    if (url.startsWith("chrome://") || url.startsWith("edge://")) {
      return { type: "chrome", resolved: url };
    }

    // Local files
    if (url.startsWith("./") || url.startsWith("../") || url.startsWith("/")) {
      try {
        const resolved = Bun.resolveSync(url, process.cwd());
        return { type: "local", resolved };
      } catch {
        return { type: "local", resolved: url };
      }
    }

    // Web URLs
    return { type: "web", resolved: url };
  }

  /**
   * Legacy method for backward compatibility
   */
  static getDocPath(file: string): string {
    const result = BookmarkManager.resolveUrl(file);
    return result.type === "local" ? result.resolved : "External URL";
  }

  // ==========================================================================
  // ID Generation
  // ==========================================================================

  /**
   * Generate Chrome-style sequential ID (101, 102, 103...)
   */
  private generateChromeId(): string {
    // Find max ID in existing bookmarks
    for (const id of this.bookmarks.keys()) {
      const num = parseInt(id);
      if (!isNaN(num) && num >= this.nextChromeId) {
        this.nextChromeId = num + 1;
      }
    }
    return (this.nextChromeId++).toString();
  }

  /**
   * Generate time-ordered UUID (for distributed systems)
   */
  private generateUUID(): string {
    return randomUUIDv7("hex");
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Add bookmark with optional Chrome-style ID
   */
  add(
    title: string,
    url: string,
    folder = CHROME_FOLDERS.OTHER_BOOKMARKS,
    tags?: string[],
    useChromeId = false
  ): Bookmark {
    const id = useChromeId ? this.generateChromeId() : this.generateUUID();
    const bookmark: Bookmark = {
      id,
      title,
      url,
      folder,
      dateAdded: Date.now(),
      tags,
      visits: 0,
    };

    this.bookmarks.set(id, bookmark);

    // Add to folder
    const folderData = this.folders.get(folder);
    if (folderData) {
      folderData.children.push(id);
    }

    this.persist();
    return bookmark;
  }

  /**
   * Get bookmark by ID
   */
  get(id: string): Bookmark | undefined {
    return this.bookmarks.get(id);
  }

  /**
   * Delete bookmark
   */
  delete(id: string): boolean {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return false;

    // Remove from folder
    const folder = this.folders.get(bookmark.folder);
    if (folder) {
      folder.children = folder.children.filter((cid) => cid !== id);
    }

    this.bookmarks.delete(id);
    this.persist();
    return true;
  }

  /**
   * Get bookmarks by folder
   */
  getByFolder(folderId: string): Bookmark[] {
    return Array.from(this.bookmarks.values()).filter((b) => b.folder === folderId);
  }

  // ==========================================================================
  // Visit Tracking
  // ==========================================================================

  /**
   * Record a visit to a bookmark
   */
  recordVisit(id: string): void {
    const bookmark = this.bookmarks.get(id);
    if (bookmark) {
      bookmark.visits = (bookmark.visits || 0) + 1;
      bookmark.lastVisited = Date.now();
      this.persist();
    }
  }

  /**
   * Get most visited bookmarks
   */
  getMostVisited(limit = 5): Bookmark[] {
    return Array.from(this.bookmarks.values())
      .filter((b) => (b.visits || 0) > 0)
      .sort((a, b) => (b.visits || 0) - (a.visits || 0))
      .slice(0, limit);
  }

  // ==========================================================================
  // Search
  // ==========================================================================

  /**
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

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Render folder view (mirrors chrome://bookmarks/?id=X)
   */
  render(folderId = CHROME_FOLDERS.OTHER_BOOKMARKS): void {
    const cols = process.stdout.columns || 80;
    const folder = this.folders.get(folderId);
    const bookmarks = this.getByFolder(folderId);

    console.log(
      `\n\x1b[1m🔖 ${folder?.name || "Unknown"}\x1b[0m \x1b[90m(${bookmarks.length} items)\x1b[0m`
    );
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m`);

    if (bookmarks.length === 0) {
      console.log("\x1b[90m  No bookmarks in this folder\x1b[0m\n");
      return;
    }

    const tableData = bookmarks.map((b) => {
      const { type } = BookmarkManager.resolveUrl(b.url);
      const maxUrlWidth = Math.floor(cols * 0.35);
      const displayUrl = stringWidth(b.url) > maxUrlWidth ? b.url.slice(0, maxUrlWidth - 3) + "..." : b.url;

      const icon = type === "local" ? "📄" : type === "chrome" ? "⚙️" : "🌐";
      const visits = b.visits ? `(${b.visits})` : "";

      return {
        ID: `[${b.id.slice(0, 8)}]`,
        Title: truncateTitle(b.title, 22),
        Location: displayUrl,
        Type: `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        Visits: visits || "—",
        Tags: b.tags?.slice(0, 2).join(", ") || "—",
      };
    });

    console.log(inspect.table(tableData, undefined, { colors: true }));
  }

  /**
   * Render search results
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
   * Render statistics dashboard
   */
  renderStats(): void {
    const cols = process.stdout.columns || 80;
    const all = Array.from(this.bookmarks.values());
    const visited = all.filter((b) => (b.visits || 0) > 0);
    const local = all.filter((b) => BookmarkManager.resolveUrl(b.url).type === "local");
    const chrome = all.filter((b) => BookmarkManager.resolveUrl(b.url).type === "chrome");
    const web = all.length - local.length - chrome.length;

    console.log(`\n\x1b[1m📊 Bookmark Statistics\x1b[0m`);
    console.log(`\x1b[90m${"━".repeat(cols)}\x1b[0m`);

    const stats = [
      {
        Metric: "Total Bookmarks",
        Value: all.length.toString(),
      },
      {
        Metric: "Visited",
        Value: `${visited.length} (${all.length ? Math.round((visited.length / all.length) * 100) : 0}%)`,
      },
      {
        Metric: "Web URLs",
        Value: web.toString(),
      },
      {
        Metric: "Local Files",
        Value: local.length.toString(),
      },
      {
        Metric: "Chrome URLs",
        Value: chrome.length.toString(),
      },
    ];

    console.log(inspect.table(stats, undefined, { colors: true }));

    // Most visited
    const mostVisited = this.getMostVisited(3);
    if (mostVisited.length > 0) {
      console.log(`\n\x1b[1m🏆 Most Visited\x1b[0m`);
      const medals = ["🥇", "🥈", "🥉"];
      mostVisited.forEach((b, i) => {
        console.log(` ${medals[i]} ${b.title} (${b.visits} visits)`);
      });
    }
  }

  // ==========================================================================
  // Open Bookmark
  // ==========================================================================

  /**
   * Open bookmark - web in browser, local in editor
   */
  async open(bookmarkId: string): Promise<boolean> {
    const bookmark = this.bookmarks.get(bookmarkId);
    if (!bookmark) {
      console.log(`\x1b[31m❌ Bookmark ${bookmarkId} not found\x1b[0m`);
      return false;
    }

    // Record visit
    this.recordVisit(bookmarkId);

    const { type, resolved } = BookmarkManager.resolveUrl(bookmark.url);
    console.log(`\x1b[32mOpening:\x1b[0m ${bookmark.title}`);
    console.log(`\x1b[90m${resolved}\x1b[0m`);

    switch (type) {
      case "web":
        // Open in Chrome (per CLAUDE.md preferences)
        Bun.spawn(["open", "-a", "Google Chrome", resolved]);
        return true;

      case "local":
        try {
          // Check file exists using Bun.file().size (throws if missing)
          Bun.file(resolved).size;
          Bun.openInEditor(resolved);
          console.log(`\x1b[90mOpened in editor\x1b[0m`);
          return true;
        } catch {
          console.log(`\x1b[31mFile not found: ${resolved}\x1b[0m`);
          return false;
        }

      case "chrome":
        console.log(`\x1b[33m⚠️  Chrome URLs must be opened directly in Chrome\x1b[0m`);
        console.log(`\x1b[90mCopy: ${bookmark.url}\x1b[0m`);
        return false;
    }
  }

  // ==========================================================================
  // Import / Export
  // ==========================================================================

  /**
   * Import bookmarks from array
   */
  importBookmarks(
    bookmarks: Array<Omit<Bookmark, "id" | "dateAdded">>,
    useChromeIds = false
  ): number {
    let count = 0;
    for (const b of bookmarks) {
      const bookmark = this.add(b.title, b.url, b.folder, b.tags, useChromeIds);
      // Preserve visit data if provided
      if (b.visits) bookmark.visits = b.visits;
      if (b.lastVisited) bookmark.lastVisited = b.lastVisited;
      count++;
    }
    this.persist();
    return count;
  }

  /**
   * Import from Chrome HTML export
   */
  importFromChromeHTML(html: string): number {
    const bookmarkRegex = /<A HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi;
    let match;
    let imported = 0;

    while ((match = bookmarkRegex.exec(html)) !== null) {
      const [, url, title] = match;
      this.add(title.trim(), url, CHROME_FOLDERS.OTHER_BOOKMARKS, ["imported"], true);
      imported++;
    }

    console.log(`\x1b[32m✅ Imported ${imported} bookmarks from Chrome export\x1b[0m`);
    return imported;
  }

  /**
   * Export bookmarks to array
   */
  exportBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values());
  }

  /**
   * Get basic stats
   */
  getStats() {
    const all = Array.from(this.bookmarks.values());
    const local = all.filter((b) => BookmarkManager.resolveUrl(b.url).type === "local").length;
    const chrome = all.filter((b) => BookmarkManager.resolveUrl(b.url).type === "chrome").length;

    return {
      total: all.length,
      local,
      chrome,
      web: all.length - local - chrome,
      folders: this.folders.size,
      visited: all.filter((b) => (b.visits || 0) > 0).length,
    };
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  /**
   * Save to file
   */
  private persist(): void {
    if (!this.saveFile) return;

    const data = {
      version: "1.0",
      chromeSpec: true,
      lastUpdated: new Date().toISOString(),
      bookmarks: this.exportBookmarks(),
      nextChromeId: this.nextChromeId,
    };

    Bun.write(this.saveFile, JSON.stringify(data, null, 2));
  }

  /**
   * Load from file
   */
  loadFromFile(): boolean {
    if (!this.saveFile) return false;

    try {
      const file = Bun.file(this.saveFile);
      // Check if file exists by checking size (throws if missing)
      if (file.size === 0) return false;

      const content = file.json() as {
        bookmarks?: Bookmark[];
        nextChromeId?: number;
      };

      if (content.bookmarks) {
        for (const b of content.bookmarks) {
          this.bookmarks.set(b.id, b);
          const folder = this.folders.get(b.folder);
          if (folder && !folder.children.includes(b.id)) {
            folder.children.push(b.id);
          }
        }
      }

      if (content.nextChromeId) {
        this.nextChromeId = content.nextChromeId;
      }

      console.log(`\x1b[32m✅ Loaded ${this.bookmarks.size} bookmarks\x1b[0m`);
      return true;
    } catch {
      // File doesn't exist or is invalid - start fresh
      return false;
    }
  }

  /**
   * Save to specific file
   */
  saveToFile(path: string): void {
    const originalFile = this.saveFile;
    this.saveFile = path;
    this.persist();
    this.saveFile = originalFile;
    console.log(`\x1b[32m✅ Saved ${this.bookmarks.size} bookmarks to ${path}\x1b[0m`);
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

  // Import enterprise bookmarks with visit data
  manager.importBookmarks([
    { title: "API Documentation", url: "https://api.enterprise.com/docs", folder: "2", tags: ["api", "docs"], visits: 42 },
    { title: "Deployment Guide", url: "./docs/deploy.md", folder: "2", tags: ["deploy", "ops"], visits: 18 },
    { title: "Grafana Dashboard", url: "https://metrics.enterprise.com/d/main", folder: "2", tags: ["metrics"], visits: 156 },
    { title: "Bun Runtime Docs", url: "https://bun.sh/docs", folder: "2", tags: ["bun", "runtime"], visits: 89 },
    { title: "Internal Wiki", url: "https://wiki.enterprise.com", folder: "2", tags: ["wiki", "internal"], visits: 34 },
    { title: "Architecture Diagram", url: "./docs/architecture.svg", folder: "2", tags: ["arch", "diagram"] },
    { title: "Chrome Flags", url: "chrome://flags/#enable-experimental", folder: "2", tags: ["chrome", "experimental"], visits: 3 },
    { title: "CI/CD Pipeline", url: "https://github.com/enterprise/actions", folder: "1", tags: ["ci", "github"], visits: 67 },
    { title: "Slack Channel", url: "https://enterprise.slack.com/archives/dev", folder: "1", tags: ["slack"], visits: 245 },
  ]);

  // Render folders
  manager.render(CHROME_FOLDERS.OTHER_BOOKMARKS);
  manager.render(CHROME_FOLDERS.BOOKMARKS_BAR);

  // Search demo
  manager.renderSearch("docs");

  // Stats dashboard
  manager.renderStats();
}

// CLI
if (import.meta.main) {
  const args = new Set(Bun.argv.slice(2));
  const searchQuery = Bun.argv.find((_, i) => Bun.argv[i - 1] === "--search" || Bun.argv[i - 1] === "-s");

  if (args.has("--help") || args.has("-h")) {
    console.log(`
🔖 Chrome-Spec Bookmark Manager

Usage:
  bun src/ui/bookmarks.ts              # Run demo
  bun src/ui/bookmarks.ts -s <query>   # Search bookmarks
  bun src/ui/bookmarks.ts --stats      # Show statistics only

Features:
  - Chrome-style folder structure (ID 1, 2, 3)
  - Visit tracking with most-visited ranking
  - URL type detection (web, local, chrome://)
  - File persistence with JSON export
`);
  } else if (args.has("--stats")) {
    const manager = new BookmarkManager();
    manager.importBookmarks([
      { title: "API Docs", url: "https://api.example.com", folder: "2", visits: 42 },
      { title: "Local File", url: "./README.md", folder: "2", visits: 10 },
      { title: "Chrome Flags", url: "chrome://flags", folder: "2", visits: 3 },
    ]);
    manager.renderStats();
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
