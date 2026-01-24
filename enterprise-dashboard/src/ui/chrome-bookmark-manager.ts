// chrome-bookmark-manager.ts
import {
  stringWidth, resolveSync, openInEditor,
  spawn, existsSync, readFileSync, writeFileSync
} from "bun";
import { mkdirSync } from "node:fs";
import * as path from "path";
import * as os from "os";

/**
 * 🔖 Chrome-Spec Bookmark Manager
 * Complete replica of chrome://bookmarks with enterprise features
 */

// Chrome's internal bookmark node structure
interface ChromeBookmarkNode {
  id: string;
  name: string;
  date_added?: string;
  date_last_used?: string;
  url?: string;
  type: "url" | "folder";
  children?: ChromeBookmarkNode[];
}

// Our enriched bookmark interface
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  folderPath: string[];
  tags: string[];
  added: Date;
  modified: Date;
  lastVisited?: Date;
  visits: number;
  icon?: string; // Favicon emoji
  order: number; // For drag-and-drop ordering
}

interface BookmarkFolder {
  id: string;
  name: string;
  parentId: string | null;
  children: (Bookmark | BookmarkFolder)[];
  expanded: boolean;
  order: number;
  created: Date;
}

// Drag-and-drop operation
interface DragDropOperation {
  sourceId: string;
  targetId: string;
  position: "before" | "after" | "inside";
}

interface BookmarkManagerConfig {
  workspaceProfileName: string;
  chromeBookmarksPath?: string; // Optional: Override default Chrome bookmarks path
  chromeProfileName?: string; // Optional: Specific Chrome profile to use
  chromeProfileDirectory?: string; // Optional: Specific profile directory
  autoDetectChromePath?: boolean; // Auto-detect Chrome bookmarks path (default: true)
  fallbackToDefaultProfile?: boolean; // Fallback to Default profile if specified not found (default: true)
  dnsCacheTTL?: number;
  maxSearchResults?: number;
  autoSync?: boolean;
  syncInterval?: number;
  defaultFolder?: string;
  faviconEmoji?: Record<string, string>;
  errorPages?: {
    theme?: string;
    colors?: {
      background: string;
      surface: string;
      primary: string;
      error: string;
      warning: string;
      success: string;
      text: string;
      textMuted: string;
      border: string;
    };
  };
  database?: {
    path?: string;
    backup?: boolean;
    backupInterval?: number;
  };
  performance?: {
    lazyLoad?: boolean;
    cacheSize?: number;
    debounceSearch?: number;
  };
}

export class ChromeSpecBookmarkManager {
  private bookmarks = new Map<string, Bookmark>();
  private folders = new Map<string, BookmarkFolder>();
  private rootFolder: BookmarkFolder;
  private dragState: DragDropOperation | null = null;
  private workspaceProfileName: string;
  private workspaceProfileDir: string | null = null;
  private errorPagesDir: string;
  private config: BookmarkManagerConfig;
  
  // Chrome's default folder IDs
  private static readonly CHROME_FOLDER_IDS = {
    ROOT: "0",
    BOOKMARKS_BAR: "1",
    OTHER_BOOKMARKS: "2",
    MOBILE_BOOKMARKS: "3"
  };

  // Default color scheme for error pages
  private static readonly DEFAULT_ERROR_COLORS = {
    background: "#0a0e27",
    surface: "#1a1f3a",
    primary: "#3b82f6",
    error: "#ef4444",
    warning: "#f59e0b",
    success: "#10b981",
    text: "#e5e7eb",
    textMuted: "#9ca3af",
    border: "#374151"
  };

  constructor(config?: BookmarkManagerConfig) {
    // Load configuration
    this.config = this.loadConfig(config);
    this.workspaceProfileName = this.config.workspaceProfileName || "Bookmark Manager Workspace";
    
    // Initialize Chrome's default folder structure
    this.rootFolder = {
      id: ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.ROOT,
      name: "Bookmarks",
      parentId: null,
      children: [],
      expanded: true,
      order: 0,
      created: new Date()
    };
    
    const bookmarksBar: BookmarkFolder = {
      id: ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.BOOKMARKS_BAR,
      name: "Bookmarks Bar",
      parentId: this.rootFolder.id,
      children: [],
      expanded: true,
      order: 1,
      created: new Date()
    };
    
    const otherBookmarks: BookmarkFolder = {
      id: ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.OTHER_BOOKMARKS,
      name: "Other Bookmarks",
      parentId: this.rootFolder.id,
      children: [],
      expanded: true,
      order: 2,
      created: new Date()
    };
    
    const mobileBookmarks: BookmarkFolder = {
      id: ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.MOBILE_BOOKMARKS,
      name: "Mobile Bookmarks",
      parentId: this.rootFolder.id,
      children: [],
      expanded: false,
      order: 3,
      created: new Date()
    };
    
    this.folders.set(this.rootFolder.id, this.rootFolder);
    this.folders.set(bookmarksBar.id, bookmarksBar);
    this.folders.set(otherBookmarks.id, otherBookmarks);
    this.folders.set(mobileBookmarks.id, mobileBookmarks);
    
    this.rootFolder.children = [bookmarksBar, otherBookmarks, mobileBookmarks];
    
    // Initialize error pages directory
    this.errorPagesDir = path.join(os.tmpdir(), "bookmark-manager-errors");
    if (!existsSync(this.errorPagesDir)) {
      try {
        // Create directory if it doesn't exist
        mkdirSync(this.errorPagesDir, { recursive: true });
      } catch {
        // Fallback to current directory
        this.errorPagesDir = path.join(process.cwd(), ".bookmark-errors");
      }
    }
  }

  /**
   * 0. PROFILE DETECTION & SETUP
   * Checks for Chrome profiles and ensures workspace profile exists
   */
  async ensureWorkspaceProfile(): Promise<boolean> {
    const platform = os.platform();
    if (platform !== "darwin" && platform !== "win32" && platform !== "linux") {
      return false;
    }

    try {
      // Get Chrome Local State path
      const localStatePath = this.getChromeLocalStatePath();
      if (!localStatePath || !existsSync(localStatePath)) {
        await this.showErrorPage({
          title: "Chrome Not Found",
          message: "Could not locate Chrome installation or Local State file.",
          details: `Expected location: ${localStatePath || "Unknown"}`,
          type: "error"
        });
        return false;
      }

      // Read Local State to check profiles
      const localState = JSON.parse(readFileSync(localStatePath, "utf-8"));
      const profiles = localState?.profile?.info_cache || {};

      // Check if workspace profile exists
      let profileFound = false;
      for (const [dir, info] of Object.entries(profiles as Record<string, any>)) {
        if (info?.name === this.workspaceProfileName) {
          this.workspaceProfileDir = dir;
          profileFound = true;
          console.log(`\x1b[32m✅ Found workspace profile: ${this.workspaceProfileName}\x1b[0m`);
          break;
        }
      }

      // Create workspace profile if it doesn't exist
      if (!profileFound) {
        console.log(`\x1b[33m⚠️  Workspace profile not found, creating...\x1b[0m`);
        const created = await this.createWorkspaceProfile(localStatePath, localState);
        if (!created) {
          await this.showErrorPage({
            title: "Profile Creation Failed",
            message: "Could not create workspace profile automatically.",
            details: "Please create a Chrome profile named 'Bookmark Manager Workspace' manually.",
            type: "warning"
          });
          return false;
        }
      }

      return true;
    } catch (error: any) {
      await this.showErrorPage({
        title: "Profile Detection Error",
        message: error.message,
        details: error.stack,
        type: "error"
      });
      return false;
    }
  }

  /**
   * Get Chrome Local State path based on platform
   */
  private getChromeLocalStatePath(): string | null {
    const platform = os.platform();
    switch (platform) {
      case "darwin":
        return path.join(
          os.homedir(),
          "Library/Application Support/Google/Chrome/Local State"
        );
      case "win32":
        return path.join(
          os.homedir(),
          "AppData/Local/Google/Chrome/User Data/Local State"
        );
      case "linux":
        return path.join(
          os.homedir(),
          ".config/google-chrome/Local State"
        );
      default:
        return null;
    }
  }

  /**
   * Create workspace profile in Chrome
   */
  private async createWorkspaceProfile(localStatePath: string, localState: any): Promise<boolean> {
    try {
      // Generate a unique profile directory name
      const profileDir = `Profile ${Date.now()}`;
      
      // Update Local State with new profile
      if (!localState.profile) {
        localState.profile = {};
      }
      if (!localState.profile.info_cache) {
        localState.profile.info_cache = {};
      }

      localState.profile.info_cache[profileDir] = {
        name: this.workspaceProfileName,
        active_time: Date.now() / 1000,
        is_using_default_avatar: true,
        is_using_default_name: false,
        is_omitted: false,
        is_ephemeral: false,
        is_signed_in: false
      };

      // Write updated Local State
      writeFileSync(localStatePath, JSON.stringify(localState, null, 2));
      
      this.workspaceProfileDir = profileDir;
      console.log(`\x1b[32m✅ Created workspace profile: ${profileDir}\x1b[0m`);
      return true;
    } catch (error: any) {
      console.log(`\x1b[31m❌ Failed to create profile: ${error.message}\x1b[0m`);
      return false;
    }
  }

  /**
   * List all available Chrome profiles
   */
  async listChromeProfiles(): Promise<Array<{ name: string; directory: string }>> {
    const localStatePath = this.getChromeLocalStatePath();
    if (!localStatePath || !existsSync(localStatePath)) {
      return [];
    }

    try {
      const localState = JSON.parse(readFileSync(localStatePath, "utf-8"));
      const profiles = localState?.profile?.info_cache || {};
      
      return Object.entries(profiles as Record<string, any>).map(([dir, info]) => ({
        name: info?.name || "Unnamed",
        directory: dir,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 1. REAL CHROME SYNC
   * Reads actual Chrome bookmarks file from local system
   * Now with profile detection and error handling
   */
  async syncWithChrome(profileName?: string): Promise<{ imported: number; errors: number }> {
    // First, ensure workspace profile exists
    const profileReady = await this.ensureWorkspaceProfile();
    if (!profileReady) {
      console.log(`\x1b[33m⚠️  Continuing without workspace profile...\x1b[0m`);
    }

    const platform = os.platform();
    let chromeBookmarksPath: string | null = null;
    const effectiveProfileName = profileName || this.config.chromeProfileName;

    // Priority 1: Use explicitly configured path
    if (this.config.chromeBookmarksPath) {
      chromeBookmarksPath = this.resolveBookmarksPath(this.config.chromeBookmarksPath);
      if (chromeBookmarksPath && existsSync(chromeBookmarksPath)) {
        console.log(`\x1b[32m✅ Using configured bookmarks path: ${chromeBookmarksPath}\x1b[0m`);
      } else {
        console.log(`\x1b[33m⚠️  Configured path not found: ${this.config.chromeBookmarksPath}\x1b[0m`);
        chromeBookmarksPath = null;
      }
    }

    // Priority 2: Use configured profile directory
    if (!chromeBookmarksPath && this.config.chromeProfileDirectory) {
      chromeBookmarksPath = this.getBookmarksPathForProfile(this.config.chromeProfileDirectory);
      if (chromeBookmarksPath && existsSync(chromeBookmarksPath)) {
        console.log(`\x1b[32m✅ Using configured profile directory: ${this.config.chromeProfileDirectory}\x1b[0m`);
      } else {
        chromeBookmarksPath = null;
      }
    }

    // Priority 3: Use profile name (from parameter or config)
    if (!chromeBookmarksPath && effectiveProfileName) {
      const profiles = await this.listChromeProfiles();
      const profile = profiles.find(p => 
        p.name === effectiveProfileName || 
        p.directory === effectiveProfileName
      );
      if (profile) {
        chromeBookmarksPath = this.getBookmarksPathForProfile(profile.directory);
        if (chromeBookmarksPath && existsSync(chromeBookmarksPath)) {
          console.log(`\x1b[32m✅ Using profile: ${profile.name} (${profile.directory})\x1b[0m`);
        } else {
          chromeBookmarksPath = null;
        }
      } else {
        console.log(`\x1b[33m⚠️  Profile not found: ${effectiveProfileName}\x1b[0m`);
      }
    }

    // Priority 4: Auto-detect if enabled (default behavior)
    if (!chromeBookmarksPath && (this.config.autoDetectChromePath !== false)) {
      // Find Chrome bookmarks file based on OS
      chromeBookmarksPath = this.getDefaultBookmarksPath(platform);
      
      if (!chromeBookmarksPath) {
        await this.showErrorPage({
          title: "Unsupported Platform",
          message: `Platform ${platform} is not supported`,
          details: "Supported platforms: macOS, Windows, Linux",
          type: "error"
        });
        return { imported: 0, errors: 1 };
      }
    }

    // Priority 5: Fallback to Default profile if enabled
    if ((!chromeBookmarksPath || !existsSync(chromeBookmarksPath)) && 
        this.config.fallbackToDefaultProfile !== false) {
      const defaultPath = this.getDefaultBookmarksPath(platform);
      if (defaultPath && existsSync(defaultPath)) {
        chromeBookmarksPath = defaultPath;
        console.log(`\x1b[90mFell back to Default profile\x1b[0m`);
      }
    }

    console.log(`\x1b[90mLooking for Chrome bookmarks at: ${chromeBookmarksPath}\x1b[0m`);

    // Validate path if it exists
    if (chromeBookmarksPath && existsSync(chromeBookmarksPath)) {
      const validation = await this.validateBookmarksPath(chromeBookmarksPath);
      if (!validation.valid) {
        console.log(`\x1b[33m⚠️  Path validation failed: ${validation.error}\x1b[0m`);
        chromeBookmarksPath = null;
      } else if (validation.stats) {
        console.log(`\x1b[90m  File size: ${(validation.stats.size / 1024).toFixed(2)} KB, Modified: ${validation.stats.modified.toLocaleString()}\x1b[0m`);
      }
    }

    if (!chromeBookmarksPath || !existsSync(chromeBookmarksPath)) {
      console.log(`\x1b[33m⚠️  Chrome bookmarks file not found\x1b[0m`);
      
      // Try alternative locations
      const alternativePaths = this.getAlternativeBookmarkPaths();
      
      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          const validation = await this.validateBookmarksPath(altPath);
          if (validation.valid) {
            chromeBookmarksPath = altPath;
            console.log(`\x1b[32m✅ Found valid bookmarks at: ${altPath}\x1b[0m`);
            break;
          }
        }
      }
    }

    if (!chromeBookmarksPath || !existsSync(chromeBookmarksPath)) {
      await this.showErrorPage({
        title: "Chrome Bookmarks Not Found",
        message: "Could not locate Chrome bookmarks file.",
        details: `Searched locations:\n${this.getAlternativeBookmarkPaths().join("\n")}`,
        type: "warning",
        suggestions: [
          "Make sure Chrome is installed",
          "Try syncing with a specific profile: manager.syncWithChrome('Profile Name')",
          "Check if Chrome bookmarks exist in the expected location"
        ]
      });
      return { imported: 0, errors: 1 };
    }

    try {
      const chromeData = JSON.parse(readFileSync(chromeBookmarksPath, "utf-8"));
      const imported = this.importChromeData(chromeData);
      
      console.log(`\x1b[32m✅ Synced ${imported} bookmarks from Chrome\x1b[0m`);
      return { imported, errors: 0 };
      
    } catch (error: any) {
      await this.showErrorPage({
        title: "Bookmark Sync Error",
        message: `Failed to read Chrome bookmarks: ${error.message}`,
        details: error.stack,
        type: "error",
        filePath: chromeBookmarksPath
      });
      return { imported: 0, errors: 1 };
    }
  }

  /**
   * Get bookmarks path for a specific profile directory
   */
  private getBookmarksPathForProfile(profileDir: string): string {
    const basePath = this.getChromeUserDataPath();
    
    // Handle absolute paths
    if (path.isAbsolute(profileDir)) {
      return path.join(profileDir, "Bookmarks");
    }
    
    return path.join(basePath, profileDir, "Bookmarks");
  }

  /**
   * Get default Chrome bookmarks path for platform
   */
  private getDefaultBookmarksPath(platform: string): string | null {
    switch (platform) {
      case "darwin": // macOS
        return path.join(
          os.homedir(),
          "Library/Application Support/Google/Chrome/Default/Bookmarks"
        );
      case "win32": // Windows
        return path.join(
          os.homedir(),
          "AppData/Local/Google/Chrome/User Data/Default/Bookmarks"
        );
      case "linux": // Linux
        return path.join(
          os.homedir(),
          ".config/google-chrome/Default/Bookmarks"
        );
      default:
        return null;
    }
  }

  /**
   * Resolve bookmarks path (handles relative/absolute paths, ~ expansion)
   */
  private resolveBookmarksPath(inputPath: string): string {
    // Expand ~ to home directory
    if (inputPath.startsWith("~")) {
      return path.join(os.homedir(), inputPath.slice(1));
    }
    
    // If absolute, return as-is
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }
    
    // Relative to current working directory
    return path.resolve(process.cwd(), inputPath);
  }

  /**
   * Validate bookmarks path exists and is readable
   */
  private async validateBookmarksPath(bookmarksPath: string): Promise<{
    valid: boolean;
    error?: string;
    stats?: { size: number; modified: Date };
  }> {
    try {
      if (!existsSync(bookmarksPath)) {
        return { valid: false, error: "File does not exist" };
      }

      const file = Bun.file(bookmarksPath);
      const stats = await file.stat();
      
      if (!stats.isFile()) {
        return { valid: false, error: "Path is not a file" };
      }

      // Try to parse as JSON to validate format
      try {
        const content = await file.json();
        if (!content.roots) {
          return { valid: false, error: "Invalid Chrome bookmarks format" };
        }
      } catch (parseError) {
        return { valid: false, error: `Invalid JSON: ${parseError}` };
      }

      return {
        valid: true,
        stats: {
          size: stats.size,
          modified: stats.mtime
        }
      };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get Chrome User Data path
   */
  private getChromeUserDataPath(): string {
    const platform = os.platform();
    switch (platform) {
      case "darwin":
        return path.join(os.homedir(), "Library/Application Support/Google/Chrome");
      case "win32":
        return path.join(os.homedir(), "AppData/Local/Google/Chrome/User Data");
      case "linux":
        return path.join(os.homedir(), ".config/google-chrome");
      default:
        return "";
    }
  }

  /**
   * Get alternative bookmark paths to search
   */
  private getAlternativeBookmarkPaths(): string[] {
    const platform = os.platform();
    const paths: string[] = [];

    if (platform === "darwin") {
      paths.push(
        path.join(os.homedir(), "Library/Application Support/Chromium/Default/Bookmarks"),
        path.join(os.homedir(), "Library/Application Support/Google/Chrome/Default/Bookmarks")
      );
    } else if (platform === "win32") {
      paths.push(
        path.join(os.homedir(), "AppData/Local/Chromium/User Data/Default/Bookmarks"),
        path.join(os.homedir(), "AppData/Local/Google/Chrome/User Data/Default/Bookmarks")
      );
    } else if (platform === "linux") {
      paths.push(
        path.join(os.homedir(), ".config/chromium/Default/Bookmarks"),
        path.join(os.homedir(), ".config/google-chrome/Default/Bookmarks")
      );
    }

    return paths;
  }

  /**
   * 2. CHROME DATA PARSER
   * Converts Chrome's internal format to our structure
   */
  private importChromeData(chromeData: any): number {
    let importedCount = 0;
    
    const parseChromeNode = (
      node: ChromeBookmarkNode, 
      parentId: string, 
      folderPath: string[]
    ) => {
      if (node.type === "folder") {
        // Create folder
        const folder: BookmarkFolder = {
          id: node.id,
          name: node.name,
          parentId,
          children: [],
          expanded: false,
          order: 0,
          created: new Date(parseInt(node.date_added || "0"))
        };
        
        this.folders.set(node.id, folder);
        
        // Add to parent
        const parentFolder = this.folders.get(parentId);
        if (parentFolder) {
          parentFolder.children.push(folder);
          folder.order = parentFolder.children.length;
        }
        
        // Parse children
        if (node.children) {
          const newPath = [...folderPath, node.name];
          node.children.forEach((child, index) => {
            parseChromeNode(child, node.id, newPath);
          });
        }
        
      } else if (node.type === "url") {
        // Create bookmark
        let bookmarkUrl = node.url || "";
        let folderPathForBookmark = [...folderPath];
        
        // Handle invalid URLs gracefully
        try {
          new URL(bookmarkUrl);
        } catch {
          // If URL is invalid, still create bookmark but mark it
          bookmarkUrl = node.url || "";
        }
        
        const bookmark: Bookmark = {
          id: node.id,
          title: node.name,
          url: bookmarkUrl,
          folderId: parentId,
          folderPath: folderPathForBookmark,
          tags: [],
          added: new Date(parseInt(node.date_added || "0")),
          modified: new Date(parseInt(node.date_added || "0")),
          visits: 0,
          order: 0
        };
        
        // Add favicon emoji based on domain
        try {
          const domain = new URL(bookmarkUrl).hostname;
          bookmark.icon = this.getFaviconEmoji(domain);
        } catch {
          bookmark.icon = "🔗";
        }
        
        this.bookmarks.set(node.id, bookmark);
        
        // Add to parent folder
        const parentFolder = this.folders.get(parentId);
        if (parentFolder) {
          parentFolder.children.push(bookmark);
          bookmark.order = parentFolder.children.length;
        }
        
        importedCount++;
      }
    };
    
    // Start parsing from Chrome's root nodes
    if (chromeData.roots) {
      // Bookmarks Bar
      if (chromeData.roots.bookmark_bar?.children) {
        chromeData.roots.bookmark_bar.children.forEach((node: ChromeBookmarkNode) => {
          parseChromeNode(node, ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.BOOKMARKS_BAR, ["Bookmarks Bar"]);
        });
      }
      
      // Other Bookmarks
      if (chromeData.roots.other?.children) {
        chromeData.roots.other.children.forEach((node: ChromeBookmarkNode) => {
          parseChromeNode(node, ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.OTHER_BOOKMARKS, ["Other Bookmarks"]);
        });
      }
      
      // Mobile Bookmarks (optional)
      if (chromeData.roots.synced?.children) {
        chromeData.roots.synced.children.forEach((node: ChromeBookmarkNode) => {
          parseChromeNode(node, ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.MOBILE_BOOKMARKS, ["Mobile Bookmarks"]);
        });
      }
    }
    
    return importedCount;
  }

  /**
   * 3. FOLDER NESTING UI
   * Renders tree structure with proper indentation
   */
  render(folderId: string = ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.ROOT): void {
    const cols = process.stdout.columns || 80;
    const folder = this.folders.get(folderId);
    
    if (!folder) {
      console.log(`\x1b[31m❌ Folder ${folderId} not found\x1b[0m`);
      return;
    }
    
    console.log(`\n\x1b[1m🔖 ${folder.name}\x1b[0m \x1b[90m${this.getFolderStats(folderId)}\x1b[0m`);
    console.log(`\x1b[90m${"─".repeat(cols)}\x1b[0m`);
    
    // Build tree structure for display
    const treeLines: string[] = [];
    this.buildFolderTree(folder, "", true, treeLines);
    
    // Render tree
    treeLines.forEach(line => console.log(line));
    
    // Footer with drag-and-drop instructions
    console.log(`\x1b[90m${"─".repeat(cols)}\x1b[0m`);
    console.log(`\x1b[90m[drag] Click to select • [drop] Enter target • [space] Expand/Collapse • [s] Search • [q] Back\x1b[0m`);
    
    if (this.dragState) {
      console.log(`\x1b[33m🔄 DRAG MODE: Moving item ${this.dragState.sourceId}\x1b[0m`);
    }
  }

  /**
   * 4. TREE BUILDING WITH INDENTATION
   * Creates visual tree structure with proper spacing
   */
  private buildFolderTree(
    folder: BookmarkFolder, 
    prefix: string, 
    isLast: boolean,
    lines: string[]
  ): void {
    // Folder line with expand/collapse indicator
    const connector = isLast ? "└─" : "├─";
    const expandSymbol = folder.expanded ? "▼" : "▶";
    const folderLine = `${prefix}${connector} ${expandSymbol} \x1b[1m${folder.name}\x1b[0m`;
    lines.push(folderLine);
    
    if (!folder.expanded) return;
    
    // Calculate new prefix for children
    const childPrefix = prefix + (isLast ? "  " : "│ ");
    
    // Sort children by order (drag-and-drop position)
    const sortedChildren = [...folder.children].sort((a, b) => a.order - b.order);
    
    sortedChildren.forEach((child, index) => {
      const isLastChild = index === sortedChildren.length - 1;
      
      if ("url" in child) {
        // It's a bookmark
        const bookmarkPrefix = childPrefix + (isLastChild ? "└─" : "├─");
        const favicon = child.icon || "📄";
        const visited = child.visits > 0 ? ` \x1b[90m(${child.visits})\x1b[0m` : "";
        
        // Truncate title if needed
        const maxTitleWidth = 30;
        let displayTitle = child.title;
        if (stringWidth(displayTitle) > maxTitleWidth) {
          displayTitle = displayTitle.slice(0, maxTitleWidth - 3) + "...";
        }
        
        const bookmarkLine = `${bookmarkPrefix} ${favicon} \x1b[36m${displayTitle}\x1b[0m${visited}`;
        lines.push(bookmarkLine);
        
      } else {
        // It's a subfolder
        this.buildFolderTree(child, childPrefix, isLastChild, lines);
      }
    });
  }

  /**
   * 5. DRAG-AND-DROP SIMULATION
   * Terminal-based drag-and-drop interface
   */
  startDrag(sourceId: string): void {
    this.dragState = {
      sourceId,
      targetId: "",
      position: "inside"
    };
    
    console.log(`\x1b[33m🔄 Dragging: ${this.getItemName(sourceId)}\x1b[0m`);
    console.log(`\x1b[90mUse arrow keys to select target, Enter to drop, Escape to cancel\x1b[0m`);
  }

  setDropTarget(targetId: string, position: "before" | "after" | "inside" = "inside"): void {
    if (!this.dragState) return;
    
    this.dragState.targetId = targetId;
    this.dragState.position = position;
    
    const sourceName = this.getItemName(this.dragState.sourceId);
    const targetName = this.getItemName(targetId);
    
    console.log(`\x1b[33m📍 Drop ${sourceName} ${position} ${targetName}\x1b[0m`);
  }

  completeDrag(): boolean {
    if (!this.dragState) return false;
    
    const { sourceId, targetId, position } = this.dragState;
    
    try {
      this.moveItem(sourceId, targetId, position);
      console.log(`\x1b[32m✅ Moved ${this.getItemName(sourceId)} ${position} ${this.getItemName(targetId)}\x1b[0m`);
      this.dragState = null;
      return true;
    } catch (error: any) {
      console.log(`\x1b[31m❌ Move failed: ${error.message}\x1b[0m`);
      return false;
    }
  }

  cancelDrag(): void {
    this.dragState = null;
    console.log(`\x1b[90m✗ Drag cancelled\x1b[0m`);
  }

  /**
   * 6. ITEM MOVEMENT LOGIC
   * Moves bookmarks/folders within the tree
   */
  private moveItem(sourceId: string, targetId: string, position: "before" | "after" | "inside"): void {
    const source = this.bookmarks.get(sourceId) || this.folders.get(sourceId);
    const target = this.bookmarks.get(targetId) || this.folders.get(targetId);
    
    if (!source || !target) {
      throw new Error("Source or target not found");
    }
    
    // Remove source from its current parent
    const sourceParent = this.getParent(sourceId);
    if (sourceParent) {
      sourceParent.children = sourceParent.children.filter(child => child.id !== sourceId);
      this.reorderChildren(sourceParent.id);
    }
    
    // Get target parent based on position
    let targetParent: BookmarkFolder;
    let insertIndex: number;
    
    if (position === "inside") {
      // Moving into a folder
      if (!("children" in target)) {
        throw new Error("Cannot move inside a bookmark");
      }
      targetParent = target;
      insertIndex = targetParent.children.length;
    } else {
      // Moving before/after an item
      const parent = this.getParent(targetId);
      if (!parent) {
        throw new Error("Target has no parent");
      }
      targetParent = parent;
      const targetIndex = targetParent.children.findIndex(child => child.id === targetId);
      
      insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    }
    
    // Update source's parent
    if ("folderId" in source) {
      source.folderId = targetParent.id;
      source.folderPath = this.getFolderPath(targetParent.id);
    } else {
      source.parentId = targetParent.id;
    }
    
    // Insert source at new position
    targetParent.children.splice(insertIndex, 0, source as any);
    this.reorderChildren(targetParent.id);
    
    // Update all orders
    this.reorderAll();
  }

  /**
   * 7. INTERACTIVE TREE NAVIGATION
   * Keyboard-controlled tree interface
   */
  async interactiveTree(): Promise<void> {
    console.clear();
    this.render();
    
    let selectedId = ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.ROOT;
    let searchMode = false;
    let searchQuery = "";
    let showHelp = false;
    
    // Set terminal to raw mode for key-by-key reading
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    const renderSelection = () => {
      console.clear();
      
      if (showHelp) {
        this.showKeyboardShortcuts();
        console.log(`\n\x1b[90mPress any key to return...\x1b[0m`);
        return;
      }
      
      this.render(selectedId);
      
      if (searchMode) {
        console.log(`\n\x1b[1m🔍 SEARCH MODE: ${searchQuery}_\x1b[0m`);
      } else {
        const item = this.getItemName(selectedId);
        console.log(`\n\x1b[1m👉 SELECTED: ${item}\x1b[0m`);
        console.log(`\x1b[90mPress ? for help, S to search, Space to drag\x1b[0m`);
      }
    };
    
    let buffer = '';
    
    process.stdin.on('data', async (key: string) => {
      // Handle Ctrl+C
      if (key === '\u0003') {
        process.stdin.setRawMode(false);
        process.exit();
      }
      
      // Handle Escape sequences (arrow keys)
      if (key === '\u001b') {
        buffer = key;
        return;
      }
      
      if (buffer === '\u001b') {
        if (key === '[') {
          buffer += key;
          return;
        }
        buffer = '';
      }
      
      if (buffer === '\u001b[') {
        buffer += key;
        const code = buffer;
        buffer = '';
        
        if (code === '\u001b[A') { // Up
          selectedId = this.getPreviousSibling(selectedId) || selectedId;
          renderSelection();
          return;
        } else if (code === '\u001b[B') { // Down
          selectedId = this.getNextSibling(selectedId) || selectedId;
          renderSelection();
          return;
        } else if (code === '\u001b[C') { // Right - expand or go into folder
          const item = this.folders.get(selectedId);
          if (item) {
            item.expanded = true;
          } else {
            selectedId = this.getFirstChild(selectedId) || selectedId;
          }
          renderSelection();
          return;
        } else if (code === '\u001b[D') { // Left - collapse or go to parent
          const item = this.folders.get(selectedId);
          if (item) {
            item.expanded = false;
          } else {
            const parent = this.getParent(selectedId);
            if (parent) selectedId = parent.id;
          }
          renderSelection();
          return;
        }
      }
      
      // Handle Enter
      if (key === '\r' || key === '\n') {
        if (searchMode) {
          const results = this.search(searchQuery);
          if (results.length > 0) {
            selectedId = results[0].id;
          }
          searchMode = false;
          searchQuery = "";
        } else {
          const item = this.bookmarks.get(selectedId) || this.folders.get(selectedId);
          if (item && "url" in item) {
            await this.openBookmark(selectedId);
          } else if (item && "children" in item) {
            item.expanded = !item.expanded;
          }
        }
        renderSelection();
        return;
      }
      
      // Handle Escape
      if (key === '\u001b' && buffer === '') {
        if (this.dragState) {
          this.cancelDrag();
        } else if (searchMode) {
          searchMode = false;
          searchQuery = "";
        } else {
          const parent = this.getParent(selectedId);
          if (parent) {
            selectedId = parent.id;
          }
        }
        renderSelection();
        return;
      }
      
      // Handle Backspace
      if (key === '\u007f' || key === '\b') {
        if (searchMode) {
          searchQuery = searchQuery.slice(0, -1);
        }
        renderSelection();
        return;
      }
      
      // Handle space for drag start
      if (key === ' ') {
        if (!this.dragState && !searchMode) {
          this.startDrag(selectedId);
        }
        renderSelection();
        return;
      }
      
      // Handle s for search
      if (key === 's' || key === 'S') {
        searchMode = !searchMode;
        searchQuery = "";
        renderSelection();
        return;
      }
      
      // Handle ? or h for help
      if (key === '?' || key === 'h' || key === 'H') {
        showHelp = !showHelp;
        renderSelection();
        return;
      }
      
      // Handle i for import
      if (key === 'i' || key === 'I') {
        if (!searchMode && !showHelp) {
          console.log(`\n\x1b[33m💡 Import: Use manager.importFromFile("path/to/file.json")\x1b[0m`);
          console.log(`\x1b[90mPress any key to continue...\x1b[0m`);
          process.stdin.once('data', () => renderSelection());
          return;
        }
      }
      
      // Handle stats
      if (key === 't' || key === 'T') {
        if (!searchMode && !showHelp) {
          const stats = this.getStatistics();
          console.clear();
          console.log(`\n\x1b[1m📊 Bookmark Statistics\x1b[0m`);
          console.log("=".repeat(60));
          console.log(`\n📚 Total Bookmarks: ${stats.totalBookmarks}`);
          console.log(`📁 Total Folders: ${stats.totalFolders}`);
          console.log(`👆 Total Visits: ${stats.totalVisits}`);
          console.log(`\n📂 By Folder:`);
          Object.entries(stats.byFolder)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .forEach(([folder, count]) => {
              console.log(`   ${folder}: ${count}`);
            });
          
          if (stats.mostVisited.length > 0) {
            console.log(`\n🔥 Most Visited:`);
            stats.mostVisited.slice(0, 5).forEach((bm, i) => {
              console.log(`   ${i + 1}. ${bm.title} (${bm.visits} visits)`);
            });
          }
          
          if (stats.recentlyAdded.length > 0) {
            console.log(`\n🆕 Recently Added (last 7 days):`);
            stats.recentlyAdded.slice(0, 5).forEach((bm, i) => {
              const daysAgo = Math.floor((Date.now() - bm.added.getTime()) / (1000 * 60 * 60 * 24));
              console.log(`   ${i + 1}. ${bm.title} (${daysAgo} days ago)`);
            });
          }
          
          console.log(`\n\x1b[90mPress any key to continue...\x1b[0m`);
          process.stdin.once('data', () => renderSelection());
          return;
        }
      }
      
      // If in search mode, add to query
      if (searchMode && key.length === 1 && key >= ' ' && key <= '~') {
        searchQuery += key;
        renderSelection();
        return;
      }
      
      // If help is showing, any key closes it
      if (showHelp) {
        showHelp = false;
        renderSelection();
        return;
      }
    });
  }

  /**
   * Show keyboard shortcuts help
   */
  private showKeyboardShortcuts(): void {
    const cols = process.stdout.columns || 80;
    
    console.log("\n\x1b[1m⌨️  Keyboard Shortcuts\x1b[0m");
    console.log("=".repeat(cols));
    
    const shortcuts = [
      { key: "↑/↓", desc: "Navigate items" },
      { key: "→", desc: "Expand folder or enter folder" },
      { key: "←", desc: "Collapse folder or go to parent" },
      { key: "Enter", desc: "Open bookmark or toggle folder" },
      { key: "Space", desc: "Start/stop drag operation" },
      { key: "S", desc: "Toggle search mode" },
      { key: "T", desc: "Show statistics" },
      { key: "I", desc: "Import bookmarks (programmatic)" },
      { key: "? / H", desc: "Show this help" },
      { key: "Escape", desc: "Cancel operation or go back" },
      { key: "Ctrl+C", desc: "Exit" },
    ];
    
    shortcuts.forEach(({ key, desc }) => {
      const keyDisplay = `\x1b[36m${key.padEnd(12)}\x1b[0m`;
      console.log(`  ${keyDisplay} ${desc}`);
    });
    
    console.log("\n" + "=".repeat(cols));
  }

  /**
   * 8. SEARCH WITH REAL-TIME HIGHLIGHTING
   */
  search(query: string): Bookmark[] {
    const results: Bookmark[] = [];
    const lowerQuery = query.toLowerCase();
    const maxResults = this.config.maxSearchResults || 50;
    
    for (const bookmark of this.bookmarks.values()) {
      const searchable = `
        ${bookmark.title.toLowerCase()}
        ${bookmark.url.toLowerCase()}
        ${bookmark.tags.join(' ').toLowerCase()}
        ${bookmark.folderPath.join('/').toLowerCase()}
      `;
      
      if (searchable.includes(lowerQuery)) {
        results.push(bookmark);
      }
    }
    
    // Limit results
    const limitedResults = results.slice(0, maxResults);
    
    // Display with highlighting
    console.log(`\n\x1b[1m🔍 "${query}" - ${results.length} results${results.length > maxResults ? ` (showing ${maxResults})` : ''}\x1b[0m`);
    
    limitedResults.forEach((bookmark, index) => {
      const highlightedTitle = this.highlightText(bookmark.title, query);
      const folderPath = bookmark.folderPath.join(' › ');
      
      console.log(
        `\x1b[90m${(index + 1).toString().padStart(3)}.\x1b[0m ` +
        `${bookmark.icon || '📄'} ${highlightedTitle} ` +
        `\x1b[90m(${folderPath})\x1b[0m`
      );
    });
    
    return limitedResults;
  }

  /**
   * 9. HELPER METHODS
   */
  private getItemName(id: string): string {
    const bookmark = this.bookmarks.get(id);
    if (bookmark) return bookmark.title;
    
    const folder = this.folders.get(id);
    if (folder) return folder.name;
    
    return "Unknown";
  }

  private getParent(id: string): BookmarkFolder | null {
    for (const folder of this.folders.values()) {
      if (folder.children.some(child => child.id === id)) {
        return folder;
      }
    }
    return null;
  }

  private getFolderStats(folderId: string): string {
    const folder = this.folders.get(folderId);
    if (!folder) return "(0 items)";
    
    let totalItems = 0;
    let totalBookmarks = 0;
    let totalFolders = 0;
    
    const countItems = (f: BookmarkFolder) => {
      totalItems += f.children.length;
      f.children.forEach(child => {
        if ("children" in child) {
          totalFolders++;
          countItems(child);
        } else {
          totalBookmarks++;
        }
      });
    };
    
    countItems(folder);
    return `(${totalItems} items • ${totalBookmarks} bookmarks • ${totalFolders} folders)`;
  }

  private getFaviconEmoji(domain: string): string {
    // Use configured favicon emoji map if available
    const emojiMap = this.config.faviconEmoji || {};
    
    // Check exact domain first
    if (emojiMap[domain]) return emojiMap[domain];
    
    // Check domain parts
    const domainParts = domain.split('.').slice(-2).join('.');
    if (emojiMap[domainParts]) return emojiMap[domainParts];
    
    // Fallback to default emoji map
    const defaultEmojiMap: Record<string, string> = {
      "github.com": "🐙",
      "gitlab.com": "🦊",
      "stackoverflow.com": "📚",
      "npmjs.com": "📦",
      "youtube.com": "📺",
      "twitter.com": "🐦",
      "linkedin.com": "💼",
      "reddit.com": "👁️",
      "medium.com": "📝",
      "notion.so": "📓",
      "figma.com": "🎨",
      "slack.com": "💬",
      "discord.com": "🎮",
      "aws.amazon.com": "☁️",
      "google.com": "🔍",
      "microsoft.com": "🪟",
      "apple.com": "🍎",
      "docker.com": "🐳",
      "kubernetes.io": "⚓",
      "grafana.com": "📊",
      "datadoghq.com": "🐶",
      "sentry.io": "🚨",
      "vercel.com": "▲",
      "netlify.com": "🌐",
    };
    
    if (defaultEmojiMap[domain]) return defaultEmojiMap[domain];
    if (defaultEmojiMap[domainParts]) return defaultEmojiMap[domainParts];
    
    // Default based on TLD
    if (domain.endsWith('.gov')) return "🏛️";
    if (domain.endsWith('.edu')) return "🎓";
    if (domain.endsWith('.org')) return "🌍";
    
    // Generic fallbacks
    const genericEmojis = ["🔗", "📎", "📍", "📌", "🔖"];
    return genericEmojis[Math.floor(Math.random() * genericEmojis.length)];
  }

  private highlightText(text: string, query: string): string {
    if (!query) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    
    return `${before}\x1b[1;33m${match}\x1b[0m${after}`;
  }

  private reorderChildren(folderId: string): void {
    const folder = this.folders.get(folderId);
    if (!folder) return;
    
    folder.children.forEach((child, index) => {
      if ("order" in child) {
        child.order = index + 1;
      }
    });
  }

  private reorderAll(): void {
    for (const folder of this.folders.values()) {
      this.reorderChildren(folder.id);
    }
  }

  private getPreviousSibling(id: string): string | null {
    const parent = this.getParent(id);
    if (!parent) return null;
    
    const index = parent.children.findIndex(child => child.id === id);
    
    if (index > 0) {
      const sibling = parent.children[index - 1];
      return sibling.id;
    }
    
    return null;
  }

  private getNextSibling(id: string): string | null {
    const parent = this.getParent(id);
    if (!parent) return null;
    
    const index = parent.children.findIndex(child => child.id === id);
    
    if (index < parent.children.length - 1) {
      const sibling = parent.children[index + 1];
      return sibling.id;
    }
    
    return null;
  }

  private getFirstChild(id: string): string | null {
    const folder = this.folders.get(id);
    if (!folder || folder.children.length === 0) return null;
    
    const firstChild = folder.children[0];
    return firstChild.id;
  }

  private getFolderPath(folderId: string): string[] {
    const path: string[] = [];
    let currentId: string | null = folderId;
    
    while (currentId) {
      const folder = this.folders.get(currentId);
      if (!folder) break;
      
      path.unshift(folder.name);
      currentId = folder.parentId;
    }
    
    return path;
  }

  /**
   * 10. BOOKMARK OPENING
   */
  async openBookmark(id: string): Promise<void> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) {
      console.log(`\x1b[31m❌ Bookmark not found\x1b[0m`);
      return;
    }
    
    // Update visit stats
    bookmark.visits++;
    bookmark.lastVisited = new Date();
    
    console.log(`\x1b[32m🌐 Opening: ${bookmark.title}\x1b[0m`);
    console.log(`\x1b[90m${bookmark.url}\x1b[0m`);
    
    // Determine how to open
    if (bookmark.url.startsWith('chrome://')) {
      console.log(`\x1b[33m⚠️  Chrome URL - open in browser manually\x1b[0m`);
    } else if (bookmark.url.startsWith('http')) {
      // Open in default browser
      const platform = os.platform();
      const command = platform === 'darwin' ? 'open' : 
                     platform === 'win32' ? 'start' : 'xdg-open';
      
      try {
        await spawn([command, bookmark.url]);
      } catch (error: any) {
        console.log(`\x1b[33m⚠️  Could not open browser: ${error.message}\x1b[0m`);
      }
    } else if (bookmark.url.startsWith('./') || bookmark.url.startsWith('/')) {
      // Local file - try to open in editor
      try {
        const resolved = resolveSync(bookmark.url, process.cwd());
        if (existsSync(resolved)) {
          await openInEditor(resolved);
        } else {
          console.log(`\x1b[31m❌ File not found: ${resolved}\x1b[0m`);
        }
      } catch (error: any) {
        console.log(`\x1b[33m⚠️  Could not open file: ${error.message}\x1b[0m`);
      }
    }
  }

  /**
   * 11. EXPORT/IMPORT
   */
  exportToFile(filePath: string = "./bookmarks-export.json"): void {
    const exportData = {
      version: "1.0",
      chromeSpec: true,
      exportedAt: new Date().toISOString(),
      bookmarks: Array.from(this.bookmarks.values()).map(b => ({
        ...b,
        added: b.added.toISOString(),
        modified: b.modified.toISOString(),
        lastVisited: b.lastVisited?.toISOString()
      })),
      folders: Array.from(this.folders.values()).map(f => ({
        ...f,
        created: f.created.toISOString(),
        children: f.children.map(c => c.id) // Store IDs only
      }))
    };
    
    writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log(`\x1b[32m✅ Exported to ${filePath}\x1b[0m`);
  }

  /**
   * Stream export to file (memory-efficient for large bookmark collections)
   * Uses Bun's FileSink for incremental writing without loading everything into memory
   */
  async exportToFileStreaming(
    filePath: string = "./bookmarks-export.json",
    options?: {
      version?: string;
      includeMetadata?: boolean;
      transform?: (bookmark: Bookmark) => unknown;
    }
  ): Promise<{ bookmarkCount: number; folderCount: number; path: string }> {
    const { StreamingJSONWriter } = await import("./streaming-json-writer.ts");
    const writer = new StreamingJSONWriter(filePath);

    // Write header (partial JSON that will be completed by streaming)
    const headerObj = {
      version: options?.version || "1.0",
      chromeSpec: true,
      exportedAt: new Date().toISOString(),
    };
    const headerJson = JSON.stringify(headerObj);
    // Create partial header: {"version":"1.0",...,"bookmarks":[
    const partialHeader = headerJson.slice(0, -1) + ',"bookmarks":[';
    await writer.writeHeader(partialHeader);

    // Stream bookmarks one by one
    let bookmarkCount = 0;
    for (const bookmark of this.bookmarks.values()) {
      const transformed = options?.transform 
        ? options.transform(bookmark)
        : {
            ...bookmark,
            added: bookmark.added.toISOString(),
            modified: bookmark.modified.toISOString(),
            lastVisited: bookmark.lastVisited?.toISOString()
          };
      
      await writer.writeItem(transformed);
      bookmarkCount++;
    }

    // Write folders section
    await writer.writeFooter("],\n  \"folders\": [");

    // Stream folders
    let folderCount = 0;
    for (const folder of this.folders.values()) {
      const folderData = {
        ...folder,
        created: folder.created.toISOString(),
        children: folder.children.map(c => c.id) // Store IDs only
      };
      
      await writer.writeItem(folderData);
      folderCount++;
    }

    // Close JSON
    await writer.writeFooter("]\n}");

    await writer.close();
    console.log(
      `\x1b[32m✅ Streamed export: ${bookmarkCount} bookmarks, ${folderCount} folders to ${filePath}\x1b[0m`
    );

    return { bookmarkCount, folderCount, path: filePath };
  }

  /**
   * Export in SARIF-like format (for scanning/analysis tools)
   */
  async exportToSARIF(
    filePath: string = "./bookmarks-sarif.json",
    options?: {
      version?: string;
      toolName?: string;
      rules?: Array<{ id: string; name: string; description?: string }>;
    }
  ): Promise<{ itemCount: number; path: string }> {
    const { writeJSONRuns } = await import("./streaming-json-writer.ts");

    const manager = this;
    async function* generateRuns() {
      // Generate a run for each folder or all bookmarks
      for (const folder of manager.folders.values()) {
        const bookmarksInFolder = Array.from(manager.bookmarks.values())
          .filter(b => b.folderPath.includes(folder.name));

        yield {
          tool: {
            name: options?.toolName || "Bookmark Manager",
            version: options?.version || "1.0.0"
          },
          results: bookmarksInFolder.map(bookmark => ({
            ruleId: "bookmark-item",
            level: "note",
            message: {
              text: `Bookmark: ${bookmark.title}`
            },
            locations: [{
              physicalLocation: {
                artifactLocation: {
                  uri: bookmark.url
                }
              }
            }],
            properties: {
              title: bookmark.title,
              url: bookmark.url,
              folder: bookmark.folderPath.join("/"),
              visits: bookmark.visits,
              tags: bookmark.tags
            }
          }))
        };
      }
    }

    const result = await writeJSONRuns(filePath, generateRuns(), {
      version: options?.version || "2.1.0",
      metadata: {
        $schema: "https://json.schemastore.org/sarif-2.1.0.json"
      }
    });

    console.log(
      `\x1b[32m✅ Exported ${result.itemCount} runs to SARIF format: ${filePath}\x1b[0m`
    );

    return result;
  }

  /**
   * Import from JSON file (reverse of export)
   */
  importFromFile(filePath: string): { imported: number; errors: number } {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const importData = JSON.parse(readFileSync(filePath, "utf-8"));
      
      if (!importData.chromeSpec || importData.version !== "1.0") {
        throw new Error("Invalid bookmark file format");
      }

      let importedCount = 0;
      let errorCount = 0;

      // Import folders first (they need to exist before bookmarks)
      if (importData.folders) {
        for (const folderData of importData.folders) {
          try {
            const folder: BookmarkFolder = {
              id: folderData.id,
              name: folderData.name,
              parentId: folderData.parentId,
              children: [],
              expanded: folderData.expanded || false,
              order: folderData.order || 0,
              created: new Date(folderData.created),
            };
            
            this.folders.set(folder.id, folder);
            importedCount++;
          } catch (error: any) {
            errorCount++;
            console.log(`\x1b[33m⚠️  Error importing folder ${folderData.id}: ${error.message}\x1b[0m`);
          }
        }

        // Rebuild folder children relationships
        for (const folderData of importData.folders) {
          const folder = this.folders.get(folderData.id);
          if (folder && folderData.children) {
            folder.children = folderData.children
              .map((childId: string) => {
                return this.bookmarks.get(childId) || this.folders.get(childId);
              })
              .filter(Boolean) as (Bookmark | BookmarkFolder)[];
          }
        }
      }

      // Import bookmarks
      if (importData.bookmarks) {
        for (const bookmarkData of importData.bookmarks) {
          try {
            const bookmark: Bookmark = {
              id: bookmarkData.id,
              title: bookmarkData.title,
              url: bookmarkData.url,
              folderId: bookmarkData.folderId,
              folderPath: bookmarkData.folderPath || [],
              tags: bookmarkData.tags || [],
              added: new Date(bookmarkData.added),
              modified: new Date(bookmarkData.modified),
              lastVisited: bookmarkData.lastVisited ? new Date(bookmarkData.lastVisited) : undefined,
              visits: bookmarkData.visits || 0,
              icon: bookmarkData.icon,
              order: bookmarkData.order || 0,
            };

            this.bookmarks.set(bookmark.id, bookmark);
            
            // Add to folder
            const folder = this.folders.get(bookmark.folderId);
            if (folder) {
              folder.children.push(bookmark);
            }
            
            importedCount++;
          } catch (error: any) {
            errorCount++;
            console.log(`\x1b[33m⚠️  Error importing bookmark ${bookmarkData.id}: ${error.message}\x1b[0m`);
          }
        }
      }

      console.log(`\x1b[32m✅ Imported ${importedCount} items from ${filePath}\x1b[0m`);
      if (errorCount > 0) {
        console.log(`\x1b[33m⚠️  ${errorCount} errors during import\x1b[0m`);
      }

      return { imported: importedCount, errors: errorCount };
    } catch (error: any) {
      throw new Error(`Failed to import: ${error.message}`);
    }
  }

  /**
   * Get bookmark statistics
   */
  getStatistics(): {
    totalBookmarks: number;
    totalFolders: number;
    byFolder: Record<string, number>;
    mostVisited: Bookmark[];
    recentlyAdded: Bookmark[];
    brokenLinks: number;
    totalVisits: number;
  } {
    const byFolder: Record<string, number> = {};
    const mostVisited: Bookmark[] = [];
    const recentlyAdded: Bookmark[] = [];

    for (const bookmark of this.bookmarks.values()) {
      // Count by folder
      const folderName = bookmark.folderPath[bookmark.folderPath.length - 1] || "Unknown";
      byFolder[folderName] = (byFolder[folderName] || 0) + 1;

      // Track most visited
      if (bookmark.visits > 0) {
        mostVisited.push(bookmark);
      }

      // Track recently added (last 7 days)
      const daysSinceAdded = (Date.now() - bookmark.added.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAdded <= 7) {
        recentlyAdded.push(bookmark);
      }
    }

    // Sort most visited
    mostVisited.sort((a, b) => b.visits - a.visits);

    // Sort recently added
    recentlyAdded.sort((a, b) => b.added.getTime() - a.added.getTime());

    const totalVisits = Array.from(this.bookmarks.values()).reduce((sum, b) => sum + b.visits, 0);

    return {
      totalBookmarks: this.bookmarks.size,
      totalFolders: this.folders.size,
      byFolder,
      mostVisited: mostVisited.slice(0, 10),
      recentlyAdded: recentlyAdded.slice(0, 10),
      brokenLinks: 0, // TODO: Implement dead link detection
      totalVisits,
    };
  }

  /**
   * 12. BATCH OPERATIONS
   */
  batchAddBookmarks(bookmarks: Array<{title: string; url: string; folderId?: string}>): number {
    let added = 0;
    
    bookmarks.forEach(({ title, url, folderId }) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const targetFolderId = folderId || ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.OTHER_BOOKMARKS;
      
      const bookmark: Bookmark = {
        id,
        title,
        url,
        folderId: targetFolderId,
        folderPath: this.getFolderPath(targetFolderId),
        tags: [],
        added: new Date(),
        modified: new Date(),
        visits: 0,
        order: 0
      };
      
      // Add favicon
      try {
        const domain = new URL(url).hostname;
        bookmark.icon = this.getFaviconEmoji(domain);
      } catch {
        bookmark.icon = "🔗";
      }
      
      this.bookmarks.set(id, bookmark);
      
      const folder = this.folders.get(targetFolderId);
      if (folder) {
        folder.children.push(bookmark);
        bookmark.order = folder.children.length;
        added++;
      }
    });
    
    return added;
  }

  /**
   * Get access to folders for setup (internal use)
   */
  getFolders(): Map<string, BookmarkFolder> {
    return this.folders;
  }

  /**
   * Load configuration from file or use defaults
   */
  private loadConfig(userConfig?: BookmarkManagerConfig): BookmarkManagerConfig {
    // Default configuration
    const defaults: BookmarkManagerConfig = {
      workspaceProfileName: "Bookmark Manager Workspace",
      autoDetectChromePath: true,
      fallbackToDefaultProfile: true,
      dnsCacheTTL: 30,
      maxSearchResults: 50,
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      defaultFolder: ChromeSpecBookmarkManager.CHROME_FOLDER_IDS.OTHER_BOOKMARKS,
      faviconEmoji: {},
      errorPages: {
        theme: "dark",
        colors: ChromeSpecBookmarkManager.DEFAULT_ERROR_COLORS,
      },
      database: {
        path: "./bookmark-manager.db",
        backup: true,
        backupInterval: 86400000, // 24 hours
      },
      performance: {
        lazyLoad: true,
        cacheSize: 1000,
        debounceSearch: 300,
      },
    };

    // Try to load from default config file
    try {
      // Use Bun's import attributes if available
      const configFile = path.join(import.meta.dir || process.cwd(), "default-bookmark-config.json");
      if (existsSync(configFile)) {
        const fileContent = readFileSync(configFile, "utf-8");
        const fileConfig = JSON.parse(fileContent);
        Object.assign(defaults, fileConfig);
      }
    } catch {
      // Ignore if config file doesn't exist
    }

    // Try to load user config
    try {
      const userConfigPath = path.join(os.homedir(), ".config", "bookmark-manager", "user-config.json");
      if (existsSync(userConfigPath)) {
        const userConfigContent = readFileSync(userConfigPath, "utf-8");
        const userConfigData = JSON.parse(userConfigContent);
        Object.assign(defaults, userConfigData);
      }
    } catch {
      // Ignore if user config doesn't exist
    }

    // Merge with provided config (highest priority)
    if (userConfig) {
      Object.assign(defaults, userConfig);
    }

    return defaults;
  }

  /**
   * Get current configuration
   */
  getConfig(): BookmarkManagerConfig {
    return { ...this.config };
  }

  /**
   * Get bookmark by ID (for integrations)
   */
  getBookmark(id: string): Bookmark | undefined {
    return this.bookmarks.get(id);
  }

  /**
   * Get all bookmarks (for integrations)
   */
  getAllBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values());
  }

  /**
   * Get bookmarks by URL pattern (for cross-referencing)
   */
  getBookmarksByUrlPattern(pattern: string | RegExp): Bookmark[] {
    const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
    return Array.from(this.bookmarks.values()).filter(b => regex.test(b.url));
  }

  /**
   * Get bookmarks by domain (for security scanning)
   */
  getBookmarksByDomain(domain: string): Bookmark[] {
    return Array.from(this.bookmarks.values()).filter(b => {
      try {
        const url = new URL(b.url);
        return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
      } catch {
        return false;
      }
    });
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<BookmarkManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    this.workspaceProfileName = this.config.workspaceProfileName || "Bookmark Manager Workspace";
  }

  /**
   * Cross-reference bookmark with external systems
   */
  async crossReferenceBookmark(bookmarkId: string, context?: {
    scanner?: any;
    traceId?: string;
  }): Promise<{
    bookmark: Bookmark | null;
    references: {
      scanner?: { issues: number; traceId?: string };
      visits: number;
      lastVisit?: Date;
      folderPath: string[];
    };
  }> {
    const bookmark = this.bookmarks.get(bookmarkId);
    if (!bookmark) {
      return { bookmark: null, references: { visits: 0, folderPath: [] } };
    }

    const references: any = {
      visits: bookmark.visits,
      lastVisit: bookmark.lastVisited,
      folderPath: bookmark.folderPath
    };

    // Cross-reference with scanner if provided
    if (context?.scanner && bookmark.url.startsWith("http")) {
      try {
        const url = new URL(bookmark.url);
        const scanResult = await context.scanner.scan(url.hostname);
        references.scanner = {
          issues: scanResult.issuesFound,
          traceId: scanResult.traceId || context.traceId
        };
      } catch {
        // Skip invalid URLs
      }
    }

    return { bookmark, references };
  }

  /**
   * Get resolved Chrome bookmarks path (with validation)
   */
  async getChromeBookmarksPath(profileName?: string): Promise<{
    path: string | null;
    valid: boolean;
    error?: string;
    source: "configured" | "profile" | "default" | "alternative" | "none";
  }> {
    const effectiveProfileName = profileName || this.config.chromeProfileName;
    let chromeBookmarksPath: string | null = null;
    let source: "configured" | "profile" | "default" | "alternative" | "none" = "none";

    // Check configured path
    if (this.config.chromeBookmarksPath) {
      chromeBookmarksPath = this.resolveBookmarksPath(this.config.chromeBookmarksPath);
      if (chromeBookmarksPath && existsSync(chromeBookmarksPath)) {
        const validation = await this.validateBookmarksPath(chromeBookmarksPath);
        if (validation.valid) {
          source = "configured";
          return { path: chromeBookmarksPath, valid: true, source };
        }
      }
    }

    // Check profile
    if (effectiveProfileName) {
      const profiles = await this.listChromeProfiles();
      const profile = profiles.find(p => 
        p.name === effectiveProfileName || 
        p.directory === effectiveProfileName
      );
      if (profile) {
        chromeBookmarksPath = this.getBookmarksPathForProfile(profile.directory);
        if (chromeBookmarksPath && existsSync(chromeBookmarksPath)) {
          const validation = await this.validateBookmarksPath(chromeBookmarksPath);
          if (validation.valid) {
            source = "profile";
            return { path: chromeBookmarksPath, valid: true, source };
          }
        }
      }
    }

    // Check default
    const defaultPath = this.getDefaultBookmarksPath(os.platform());
    if (defaultPath && existsSync(defaultPath)) {
      const validation = await this.validateBookmarksPath(defaultPath);
      if (validation.valid) {
        source = "default";
        return { path: defaultPath, valid: true, source };
      }
    }

    // Check alternatives
    const alternativePaths = this.getAlternativeBookmarkPaths();
    for (const altPath of alternativePaths) {
      if (existsSync(altPath)) {
        const validation = await this.validateBookmarksPath(altPath);
        if (validation.valid) {
          source = "alternative";
          return { path: altPath, valid: true, source };
        }
      }
    }

    return { 
      path: null, 
      valid: false, 
      error: "No valid Chrome bookmarks file found",
      source: "none"
    };
  }

  /**
   * ERROR PAGE GENERATION & DISPLAY
   * Creates formatted HTML error pages and opens them in workspace profile
   */
  async showErrorPage(options: {
    title: string;
    message: string;
    details?: string;
    type: "error" | "warning" | "info" | "success";
    suggestions?: string[];
    filePath?: string;
  }): Promise<void> {
    const colors = this.config.errorPages?.colors || ChromeSpecBookmarkManager.DEFAULT_ERROR_COLORS;
    const typeColors = {
      error: colors.error,
      warning: colors.warning,
      info: colors.primary,
      success: colors.success
    };

    const iconMap = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      success: "✅"
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title} - Bookmark Manager</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${colors.background};
      color: ${colors.text};
      line-height: 1.6;
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      max-width: 800px;
      width: 100%;
      background: ${colors.surface};
      border-radius: 12px;
      border: 1px solid ${colors.border};
      padding: 2.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid ${colors.border};
    }
    
    .icon {
      font-size: 3rem;
      line-height: 1;
    }
    
    .title {
      font-size: 1.75rem;
      font-weight: 600;
      color: ${colors.text};
    }
    
    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${typeColors[options.type]}20;
      color: ${typeColors[options.type]};
      border: 1px solid ${typeColors[options.type]}40;
      margin-left: auto;
    }
    
    .message {
      font-size: 1.125rem;
      color: ${colors.text};
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }
    
    .details {
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.875rem;
      color: ${colors.textMuted};
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .suggestions {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid ${colors.border};
    }
    
    .suggestions-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: ${colors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }
    
    .suggestions-list {
      list-style: none;
      padding: 0;
    }
    
    .suggestions-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      color: ${colors.text};
    }
    
    .suggestions-list li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: ${typeColors[options.type]};
    }
    
    .file-path {
      margin-top: 1rem;
      padding: 0.75rem;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 6px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.8125rem;
      color: ${colors.textMuted};
      word-break: break-all;
    }
    
    .file-path-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${colors.textMuted};
      margin-bottom: 0.25rem;
    }
    
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid ${colors.border};
      text-align: center;
      font-size: 0.875rem;
      color: ${colors.textMuted};
    }
    
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: ${colors.background};
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${colors.border};
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: ${colors.textMuted};
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${iconMap[options.type]}</div>
      <div class="title">${this.escapeHtml(options.title)}</div>
      <div class="type-badge">${options.type}</div>
    </div>
    
    <div class="message">${this.escapeHtml(options.message)}</div>
    
    ${options.details ? `
      <div class="details">${this.escapeHtml(options.details)}</div>
    ` : ''}
    
    ${options.filePath ? `
      <div class="file-path">
        <div class="file-path-label">File Path</div>
        ${this.escapeHtml(options.filePath)}
      </div>
    ` : ''}
    
    ${options.suggestions && options.suggestions.length > 0 ? `
      <div class="suggestions">
        <div class="suggestions-title">Suggestions</div>
        <ul class="suggestions-list">
          ${options.suggestions.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div class="footer">
      Bookmark Manager Workspace • ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;

    // Save HTML to file
    const timestamp = Date.now();
    const fileName = `error-${timestamp}.html`;
    const filePath = path.join(this.errorPagesDir, fileName);
    
    try {
      writeFileSync(filePath, html, "utf-8");
      
      // Open in Chrome with workspace profile
      await this.openInWorkspaceProfile(filePath);
      
      console.log(`\x1b[90m📄 Error page opened in workspace profile\x1b[0m`);
    } catch (error: any) {
      console.log(`\x1b[31m❌ Failed to show error page: ${error.message}\x1b[0m`);
      // Fallback: try to open in default browser
      try {
        const platform = os.platform();
        const command = platform === 'darwin' ? 'open' : 
                       platform === 'win32' ? 'start' : 'xdg-open';
        await spawn([command, filePath]);
      } catch {
        console.log(`\x1b[33m⚠️  Could not open error page. File saved at: ${filePath}\x1b[0m`);
      }
    }
  }

  /**
   * Open file in Chrome workspace profile
   */
  private async openInWorkspaceProfile(filePath: string): Promise<void> {
    const platform = os.platform();
    const fileUrl = `file://${filePath}`;

    if (platform === "darwin") {
      const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      
      if (this.workspaceProfileDir) {
        // Use workspace profile
        const chromeArgs = [
          chromePath,
          fileUrl,
          `--profile-directory=${this.workspaceProfileDir}`,
          "--new-window"
        ];
        
        try {
          await spawn(chromeArgs, {
            detached: true,
            stdio: ["ignore", "ignore", "ignore"],
          });
          return;
        } catch (error: any) {
          console.log(`\x1b[33m⚠️  Could not open with profile, trying default...\x1b[0m`);
        }
      }
      
      // Fallback: use default Chrome
      try {
        await spawn(["open", "-a", "Google Chrome", filePath], {
          detached: true,
          stdio: ["ignore", "ignore", "ignore"],
        });
      } catch {
        // Last resort: use system default
        await spawn(["open", filePath]);
      }
    } else if (platform === "win32") {
      const chromePath = path.join(
        os.homedir(),
        "AppData/Local/Google/Chrome/Application/chrome.exe"
      );
      
      if (this.workspaceProfileDir && existsSync(chromePath)) {
        try {
          await spawn([
            chromePath,
            fileUrl,
            `--profile-directory=${this.workspaceProfileDir}`,
            "--new-window"
          ], {
            detached: true,
            stdio: ["ignore", "ignore", "ignore"],
          });
          return;
        } catch {
          // Fallback
        }
      }
      
      // Fallback
      await spawn(["start", filePath], { shell: true });
    } else if (platform === "linux") {
      if (this.workspaceProfileDir) {
        try {
          await spawn([
            "google-chrome",
            fileUrl,
            `--profile-directory=${this.workspaceProfileDir}`,
            "--new-window"
          ], {
            detached: true,
            stdio: ["ignore", "ignore", "ignore"],
          });
          return;
        } catch {
          // Fallback
        }
      }
      
      // Fallback
      await spawn(["xdg-open", filePath]);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// --- ENTERPRISE INTEGRATION ---

export async function startEnterpriseBookmarkManager() {
  console.clear();
  console.log("\x1b[1m🚀 ENTERPRISE BOOKMARK COMMAND CENTER\x1b[0m");
  console.log("\x1b[90m" + "=".repeat(60) + "\x1b[0m");
  
  // HMR support for development
  let manager: ChromeSpecBookmarkManager;
  if (import.meta.hot) {
    const { getBookmarkManager } = await import("./bookmark-manager-hmr.ts");
    manager = getBookmarkManager();
    console.log("\x1b[90m✅ HMR enabled - state preserved across updates\x1b[0m\n");
  } else {
    manager = new ChromeSpecBookmarkManager();
  }
  
  // First, ensure workspace profile exists
  console.log("\x1b[90m🔍 Checking Chrome profiles...\x1b[0m");
  const profileReady = await manager.ensureWorkspaceProfile();
  
  if (profileReady) {
    console.log("\x1b[32m✅ Workspace profile ready\x1b[0m");
    
    // List available profiles
    const profiles = await manager.listChromeProfiles();
    if (profiles.length > 0) {
      console.log(`\x1b[90m📋 Found ${profiles.length} Chrome profile(s):\x1b[0m`);
      profiles.forEach((p, i) => {
        const marker = p.name === manager['workspaceProfileName'] ? "⭐" : "  ";
        console.log(`\x1b[90m  ${marker} ${i + 1}. ${p.name}\x1b[0m`);
      });
    }
  } else {
    console.log("\x1b[33m⚠️  Workspace profile setup incomplete\x1b[0m");
    console.log("\x1b[90m   Error details opened in browser tab\x1b[0m");
  }
  
  // Sync with Chrome automatically
  console.log("\n\x1b[90m🔄 Syncing with Chrome bookmarks...\x1b[0m");
  const syncResult = await manager.syncWithChrome();
  
  if (syncResult.imported > 0) {
    console.log(`\x1b[32m✅ ${syncResult.imported} bookmarks loaded from Chrome\x1b[0m`);
  } else if (syncResult.errors > 0) {
    console.log("\x1b[33m⚠️  Sync encountered errors - check browser tab for details\x1b[0m");
  } else {
    console.log("\x1b[33m⚠️  No Chrome bookmarks found, starting with empty manager\x1b[0m");
    
    // Add some enterprise defaults
    const enterpriseBookmarks = [
      { title: "API Documentation", url: "https://api.enterprise.com/docs", folderId: "2" },
      { title: "Deployment Guide", url: "./docs/deploy.md", folderId: "2" },
      { title: "Monitoring Dashboard", url: "https://grafana.enterprise.com", folderId: "2" },
      { title: "Error Tracking", url: "https://sentry.enterprise.com", folderId: "1" },
      { title: "CI/CD Pipeline", url: "https://jenkins.enterprise.com", folderId: "1" },
    ];
    
    const added = manager.batchAddBookmarks(enterpriseBookmarks);
    console.log(`\x1b[32m✅ Added ${added} enterprise bookmarks\x1b[0m`);
  }
  
  // Create some example folders
  const folders = manager.getFolders();
  const otherBookmarks = folders.get("2");
  
  if (otherBookmarks) {
    const devFolder: BookmarkFolder = {
      id: "dev-" + Date.now(),
      name: "Development",
      parentId: "2",
      children: [],
      expanded: true,
      order: 1,
      created: new Date()
    };
    
    const opsFolder: BookmarkFolder = {
      id: "ops-" + Date.now(),
      name: "Operations",
      parentId: "2",
      children: [],
      expanded: true,
      order: 2,
      created: new Date()
    };
    
    folders.set(devFolder.id, devFolder);
    folders.set(opsFolder.id, opsFolder);
    
    otherBookmarks.children.push(devFolder, opsFolder);
    
    // Add some nested bookmarks
    manager.batchAddBookmarks([
      { title: "React Docs", url: "https://react.dev", folderId: devFolder.id },
      { title: "TypeScript", url: "https://typescriptlang.org", folderId: devFolder.id },
      { title: "Docker Docs", url: "https://docs.docker.com", folderId: opsFolder.id },
      { title: "K8s Docs", url: "https://kubernetes.io/docs", folderId: opsFolder.id },
    ]);
  }
  
  console.log("\n\x1b[32m✅ Bookmark manager ready!\x1b[0m");
  console.log("\x1b[90mPress any key to start interactive mode...\x1b[0m");
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    manager.interactiveTree();
  });
}

// Run if called directly
if (import.meta.main) {
  startEnterpriseBookmarkManager();
}

// Export for use in other modules
export { ChromeSpecBookmarkManager as default };
