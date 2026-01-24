# 🔖 Chrome-Spec Bookmark Manager

A complete enterprise-grade bookmark manager with Chrome sync, folder nesting, drag-and-drop, and interactive terminal UI.

## Features

✅ **Real Chrome Sync** - Reads actual Chrome/Chromium bookmarks from your system  
✅ **Folder Nesting** - Unlimited nested folders with expand/collapse  
✅ **Drag-and-Drop** - Terminal-based drag-and-drop interface  
✅ **Interactive Navigation** - Keyboard-controlled tree interface  
✅ **Smart Favicons** - Domain-specific emoji favicons  
✅ **Search** - Real-time search with highlighting  
✅ **Export/Import** - JSON export/import functionality  
✅ **Batch Operations** - Bulk bookmark management  

## Installation

```bash
# Ensure Bun 1.3.6+ is installed
bun --version

# No additional dependencies needed - uses Bun's built-in APIs
```

## Usage

### Basic Usage

```bash
# Run the bookmark manager
bun chrome-bookmark-manager.ts
```

### Programmatic Usage

```typescript
import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";

const manager = new ChromeSpecBookmarkManager();

// Sync with Chrome
await manager.syncWithChrome();

// Add bookmarks
manager.batchAddBookmarks([
  { title: "React Docs", url: "https://react.dev" },
  { title: "TypeScript", url: "https://typescriptlang.org" }
]);

// Start interactive mode
await manager.interactiveTree();
```

## Interactive Controls

| Key | Action |
|-----|--------|
| **↑/↓** | Navigate items |
| **→** | Expand folder or enter folder |
| **←** | Collapse folder or go to parent |
| **Space** | Start/stop drag operation |
| **Enter** | Open bookmark or toggle folder |
| **S** | Toggle search mode |
| **Escape** | Cancel operation or go back |
| **Ctrl+C** | Exit |

## Drag-and-Drop

1. Navigate to the item you want to move
2. Press **Space** to start dragging
3. Use arrow keys to select drop target
4. Press **Enter** to complete the move
5. Press **Escape** to cancel

## Chrome Sync & Profile Management

### Profile Detection

The manager automatically:
1. **Checks for Chrome profiles** by reading `Local State` file
2. **Creates workspace profile** if it doesn't exist ("Bookmark Manager Workspace")
3. **Lists all available profiles** for selection
4. **Opens error pages** in the dedicated workspace profile

### Profile Locations

Chrome profiles are detected from:
- **macOS**: `~/Library/Application Support/Google/Chrome/Local State`
- **Windows**: `%LOCALAPPDATA%\Google\Chrome\User Data\Local State`
- **Linux**: `~/.config/google-chrome/Local State`

### Bookmark File Locations

The manager searches for bookmarks in:
- **macOS**: `~/Library/Application Support/Google/Chrome/Default/Bookmarks`
- **Windows**: `%LOCALAPPDATA%\Google\Chrome\User Data\Default/Bookmarks`
- **Linux**: `~/.config/google-chrome/Default/Bookmarks`

Also supports Chromium:
- **macOS**: `~/Library/Application Support/Chromium/Default/Bookmarks`
- **Linux**: `~/.config/chromium/Default/Bookmarks`

### Error Handling

When errors occur, the manager:
1. **Generates formatted HTML error pages** with:
   - Dark theme with hex color scheme (`#0a0e27` background, `#ef4444` errors, etc.)
   - Type badges (error, warning, info, success)
   - Detailed error messages and stack traces
   - Actionable suggestions
   - File path information
2. **Opens error pages in workspace profile** automatically
3. **Falls back gracefully** if profile unavailable

### Sync with Specific Profile

```typescript
// Sync with a specific Chrome profile
await manager.syncWithChrome("My Profile Name");

// List all available profiles
const profiles = await manager.listChromeProfiles();
console.log(profiles); // [{ name: "Profile 1", directory: "Profile 1" }, ...]

// Get resolved path with validation
const pathResult = await manager.getChromeBookmarksPath("Work Profile");
if (pathResult.valid) {
  console.log(`✅ Found: ${pathResult.path} (source: ${pathResult.source})`);
} else {
  console.error(`❌ Error: ${pathResult.error}`);
}
```

### Path Configuration Options

```typescript
// Option 1: Direct path
const manager = new ChromeSpecBookmarkManager({
  chromeBookmarksPath: "/custom/path/to/Bookmarks"
});

// Option 2: Profile name
const manager = new ChromeSpecBookmarkManager({
  chromeProfileName: "Work Profile"
});

// Option 3: Profile directory
const manager = new ChromeSpecBookmarkManager({
  chromeProfileDirectory: "Profile 1"
});

// Option 4: Disable auto-detection
const manager = new ChromeSpecBookmarkManager({
  autoDetectChromePath: false
});
```

## Export/Import

### Standard Export

```typescript
// Export bookmarks
manager.exportToFile("./my-bookmarks.json");
```

### Streaming Export (Memory-Efficient)

```typescript
// Stream export for large bookmark collections
const result = await manager.exportToFileStreaming("./bookmarks.json", {
  version: "2.0",
  transform: (bookmark) => ({
    title: bookmark.title,
    url: bookmark.url,
    visits: bookmark.visits
  })
});
// Returns: { bookmarkCount, folderCount, path }
```

### SARIF Format Export

```typescript
// Export in SARIF format for security tools
await manager.exportToSARIF("./bookmarks-sarif.json", {
  version: "2.1.0",
  toolName: "Bookmark Analyzer"
});
```

### Import from JSON

```typescript
// Import bookmarks from JSON file
const result = manager.importFromFile("./my-bookmarks.json");
console.log(`Imported ${result.imported} bookmarks, ${result.errors} errors`);
```

## New Query Methods

### Get Bookmark by ID

```typescript
const bookmark = manager.getBookmark("bookmark-id");
```

### Get All Bookmarks

```typescript
const allBookmarks = manager.getAllBookmarks();
```

### Find by URL Pattern

```typescript
// Find all GitHub bookmarks
const githubBookmarks = manager.getBookmarksByUrlPattern("github.com");

// Using regex
const npmBookmarks = manager.getBookmarksByUrlPattern(/npmjs\.com/);
```

### Find by Domain

```typescript
// Find all bookmarks for a domain
const domainBookmarks = manager.getBookmarksByDomain("example.com");
```

### Cross-Reference with External Systems

```typescript
// Cross-reference bookmark with scanner
const crossRef = await manager.crossReferenceBookmark("bookmark-id", {
  scanner: scannerInstance,
  traceId: "trace-123"
});
// Returns: { bookmark, references: { scanner, visits, lastVisit, folderPath } }
```

## Statistics & Analytics

### Get Statistics

```typescript
const stats = manager.getStatistics();
console.log(`Total: ${stats.totalBookmarks} bookmarks`);
console.log(`Most visited: ${stats.mostVisited[0].title}`);
console.log(`By folder:`, stats.byFolder);
```

### Security Report

```typescript
const integration = new BookmarkSecurityIntegration(manager, scanner);
const report = await integration.generateSecurityReport();
// Returns: scanResults, bookmarkCorrelations, visitCorrelations, recommendations
```

## Integrations & Cross-References

### Enterprise Scanner Integration

The bookmark manager integrates with the Enterprise Scanner for security analysis:

```typescript
import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import { EnterpriseScanner } from "./enterprise-scanner.ts";
import { BookmarkSecurityIntegration } from "./bookmark-scanner-integration.ts";

const bookmarkManager = new ChromeSpecBookmarkManager();
const scanner = new EnterpriseScanner({ mode: "audit" });
await scanner.initialize();

const integration = new BookmarkSecurityIntegration(bookmarkManager, scanner);

// Scan all bookmarks for security issues
const report = await integration.scanBookmarks({
  riskThreshold: "high"
});
```

### Package Registry Integration

Cross-reference bookmarks with npm/GitHub packages:

```typescript
import { BookmarkRegistryIntegration } from "./bookmark-registry-integration.ts";

const registryIntegration = new BookmarkRegistryIntegration(bookmarkManager);

// Find all npm package bookmarks
const packageBookmarks = await registryIntegration.findPackageBookmarks();
const npmPackages = packageBookmarks.filter(c => c.registry === "npm");
```

### Integration Registry

Centralized integration management:

```typescript
import { setupBookmarkIntegrations } from "./bookmark-integrations.ts";

const registry = await setupBookmarkIntegrations(bookmarkManager, {
  scanner: scannerInstance,
  registry: true
});

// Get unified cross-references
const crossRefs = await registry.getCrossReferences(bookmarkId);
// Returns: bookmark + scanner + registry + visits + tags
```

## Enhanced Configuration

### Chrome Bookmarks Path Configuration

Multiple ways to specify Chrome bookmarks location:

```typescript
// Direct path
const manager = new ChromeSpecBookmarkManager({
  chromeBookmarksPath: "~/custom/bookmarks.json"
});

// Profile-based
const manager = new ChromeSpecBookmarkManager({
  chromeProfileName: "Work Profile"
});

// Path discovery with validation
const result = await manager.getChromeBookmarksPath("Work Profile");
if (result.valid) {
  console.log(`Found at: ${result.path} (${result.source})`);
}
```

### Configuration Priority

1. **Configured Path** (`chromeBookmarksPath`)
2. **Profile Directory** (`chromeProfileDirectory`)
3. **Profile Name** (`chromeProfileName`)
4. **Auto-Detection** (platform defaults)
5. **Fallback to Default** profile
6. **Alternative Paths** search

## Configuration

### Configuration Files

#### default-bookmark-config.json

Default configuration with embedded settings:

```json
{
  "workspaceProfileName": "Bookmark Manager Workspace",
  "chromeBookmarksPath": "~/Library/Application Support/Google/Chrome/Default/Bookmarks",
  "chromeProfileName": "Default",
  "autoDetectChromePath": true,
  "fallbackToDefaultProfile": true,
  "maxSearchResults": 50,
  "autoSync": true,
  "faviconEmoji": {
    "github.com": "🐙",
    "npmjs.com": "📦"
  }
}
```

#### User Config (~/.config/bookmark-manager/user-config.json)

User-specific overrides (merged with defaults).

### Slides Configuration

Configure the bookmark manager via presentation slides:

```typescript
import { SlidesConfigManager } from "./bookmark-slides-config.ts";

const slidesManager = new SlidesConfigManager();
const slides = await slidesManager.loadFromSlides("./bookmark-config-slides.json");

// Apply configuration from slides
await slidesManager.applySlidesConfig(manager, slides);

// Or present slides interactively
await slidesManager.presentSlides(slides);
```

#### Slides Format

```json
{
  "version": "1.0.0",
  "metadata": {
    "author": "Enterprise Team",
    "description": "Bookmark Manager Setup"
  },
  "slides": [
    {
      "title": "Chrome Sync Configuration",
      "content": "Configure Chrome bookmarks synchronization",
      "config": {
        "chromeProfileName": "Default",
        "autoDetectChromePath": true
      },
      "actions": [{
        "type": "sync",
        "params": {}
      }]
    },
    {
      "title": "Security Scanning",
      "content": "Scan bookmarks for security issues",
      "actions": [{
        "type": "scan",
        "params": {
          "mode": "audit",
          "riskThreshold": "high"
        }
      }]
    }
  ]
}
```

#### Slide Actions

- **sync**: Sync with Chrome (`params.profileName`)
- **export**: Export bookmarks (`params.path`)
- **scan**: Security scan (`params.mode`, `params.riskThreshold`)
- **search**: Search bookmarks (`params.query`)

## Integration Example

```typescript
// enterprise-dashboard.ts
import { startEnterpriseBookmarkManager } from "./chrome-bookmark-manager.ts";

class EnterpriseDashboard {
  async showMenu() {
    const options = [
      { key: "1", label: "📚 Bookmark Manager", action: startEnterpriseBookmarkManager },
      { key: "2", label: "📊 System Metrics", action: () => this.showMetrics() },
      { key: "q", label: "❌ Exit", action: () => process.exit(0) },
    ];
    
    // Handle menu selection...
  }
}
```

## File Structure

```
chrome-bookmark-manager.ts    # Main bookmark manager class
├── ChromeSpecBookmarkManager  # Core manager class
├── startEnterpriseBookmarkManager()  # Entry point function
└── Exports for integration
```

## Requirements

- **Bun**: 1.3.6 or higher
- **Platform**: macOS, Windows, or Linux
- **Chrome/Chromium**: Optional (for sync feature)

## Notes

- The manager reads Chrome bookmarks in read-only mode
- Changes made in the manager are not synced back to Chrome (one-way sync)
- Bookmarks are stored in memory during the session
- Use `exportToFile()` to persist changes

## Slides Configuration

### Interactive Slideshow

Present configuration as an interactive slideshow:

```typescript
const slidesManager = new SlidesConfigManager();
const slides = await slidesManager.loadFromSlides("./config-slides.json");
await slidesManager.presentSlides(slides);
```

### Generate Slides from Manager

```typescript
const slides = slidesManager.generateSlidesFromManager(manager);
await Bun.write("./manager-slides.json", JSON.stringify(slides, null, 2));
```

### Slide Structure

Each slide can contain:
- **title**: Slide title
- **content**: Description/instructions
- **config**: Configuration to apply
- **actions**: Actions to execute (sync, export, scan, search)

## Future Enhancements

- Two-way Chrome sync
- Cloud storage integration
- Dead link detection
- Bookmark deduplication
- AI-powered organization
- Browser extension integration
- Web-based slides configuration UI
