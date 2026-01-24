# Bookmark Manager Enhancements

## Enhanced Chrome Bookmarks Path Configuration

### New Configuration Options

```typescript
interface BookmarkManagerConfig {
  chromeBookmarksPath?: string;        // Direct path override
  chromeProfileName?: string;          // Profile name to use
  chromeProfileDirectory?: string;     // Profile directory name
  autoDetectChromePath?: boolean;      // Auto-detect (default: true)
  fallbackToDefaultProfile?: boolean;  // Fallback to Default (default: true)
}
```

### Path Resolution Priority

The scanner now uses a priority-based path resolution:

1. **Configured Path** (`chromeBookmarksPath`)
   - Direct path override
   - Supports `~` expansion
   - Supports relative/absolute paths

2. **Configured Profile Directory** (`chromeProfileDirectory`)
   - Specific profile directory name
   - Example: `"Profile 1"` or `"Default"`

3. **Profile Name** (`chromeProfileName` or parameter)
   - Profile display name
   - Example: `"Work Profile"`

4. **Auto-Detection** (if enabled)
   - Default Chrome profile location
   - Platform-specific paths

5. **Fallback to Default** (if enabled)
   - Uses Default profile as last resort

6. **Alternative Paths**
   - Searches common alternative locations
   - Cross-platform compatibility

### Usage Examples

#### Direct Path Configuration
```typescript
const manager = new ChromeSpecBookmarkManager({
  chromeBookmarksPath: "/custom/path/to/Bookmarks"
});

// Or with ~ expansion
const manager = new ChromeSpecBookmarkManager({
  chromeBookmarksPath: "~/Library/Application Support/Google/Chrome/Custom/Bookmarks"
});
```

#### Profile-Based Configuration
```typescript
// By profile name
const manager = new ChromeSpecBookmarkManager({
  chromeProfileName: "Work Profile"
});

// By directory name
const manager = new ChromeSpecBookmarkManager({
  chromeProfileDirectory: "Profile 1"
});
```

#### Config File
```json
{
  "chromeBookmarksPath": "~/custom/bookmarks.json",
  "chromeProfileName": "Work",
  "autoDetectChromePath": true,
  "fallbackToDefaultProfile": true
}
```

### Path Validation

The scanner now validates bookmarks paths:

- ✅ File existence check
- ✅ File type validation
- ✅ JSON format validation
- ✅ Chrome bookmarks structure validation
- ✅ File metadata (size, modified date)

### New Methods

#### `getChromeBookmarksPath(profileName?)`
Get resolved path with validation:

```typescript
const result = await manager.getChromeBookmarksPath("Work Profile");
if (result.valid) {
  console.log(`Found at: ${result.path} (source: ${result.source})`);
} else {
  console.error(`Error: ${result.error}`);
}
```

Returns:
- `path`: Resolved bookmarks path or null
- `valid`: Whether path is valid and readable
- `error`: Error message if invalid
- `source`: Where the path came from (configured/profile/default/alternative/none)

#### `resolveBookmarksPath(inputPath)`
Resolves paths with:
- `~` expansion to home directory
- Absolute path handling
- Relative path resolution

#### `validateBookmarksPath(bookmarksPath)`
Validates:
- File existence
- File type (must be file, not directory)
- JSON format
- Chrome bookmarks structure
- Returns file stats (size, modified date)

### Error Handling

Enhanced error messages with:
- Specific validation errors
- File metadata when available
- Suggested alternatives
- Clear source identification

### Benefits

1. **Flexibility**: Multiple ways to specify bookmarks location
2. **Reliability**: Validation ensures paths are valid before use
3. **User-Friendly**: Clear error messages and fallback options
4. **Cross-Platform**: Handles platform-specific paths automatically
5. **Type-Safe**: Full TypeScript support with proper types

### Migration

Existing code continues to work. New options are all optional:

```typescript
// Old code still works
const manager = new ChromeSpecBookmarkManager();
await manager.syncWithChrome();

// New options available
const manager = new ChromeSpecBookmarkManager({
  chromeBookmarksPath: "/custom/path"
});
```
