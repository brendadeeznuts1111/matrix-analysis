/**
 * Enterprise Dashboard UI Components
 *
 * Bun-native UI utilities for terminal rendering.
 */

// Unicode-safe table utilities
export {
  safeTruncate,
  middleTruncate,
  formatTableData,
  renderTable,
  formatPath,
  formatUrl,
  formatStatus,
  formatBytes,
  formatDuration,
  type TableColumn,
} from "./table";

// Bookmark Resource Monitor
export {
  BookmarkManager,
  CHROME_FOLDERS,
  demo as bookmarkDemo,
  type Bookmark,
  type BookmarkFolder,
  type SearchResult,
} from "./bookmarks";

// Google Chromium element parser
export {
  parseChromiumComponent,
  safeLabel,
  renderStatusLine,
  renderMenuHeader,
  renderMenuItem,
  renderGoogleMenu,
  renderMenuSection,
  inspectComponents,
  trackStateChange,
  getStateHistory,
  monitorWithEditor,
  CHROME_SETTINGS_MENU,
  MD_VIEWBOX,
  // Professional Monitor
  ChromiumMonitor,
  monitorDemo,
  type ChromiumComponent,
  type MenuSection,
  type ComponentState,
  type MonitorComponentState,
  type CDPTraceContext,
} from "./google-elements";
