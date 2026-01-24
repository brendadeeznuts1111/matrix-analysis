/**
 * Bookmark Manager HMR Support
 * Hot Module Replacement for development with state preservation
 */

import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import { createLogger } from "../utils/logger.ts";

const hmrLog = createLogger("HMR");

// HMR state preservation
let managerInstance: ChromeSpecBookmarkManager | null = null;
let activeMonitor: BookmarkManagerHMRMonitor | null = null;
let hmrStats = {
  updates: 0,
  errors: 0,
  lastUpdate: Date.now(),
  modules: new Map<string, number>()
};

/**
 * Get or create bookmark manager instance with HMR support
 */
export function getBookmarkManager(): ChromeSpecBookmarkManager {
  // Restore from HMR data if available
  if (import.meta.hot?.data.manager) {
    managerInstance = import.meta.hot.data.manager;
    hmrLog.info("🔄 HMR: Restored bookmark manager instance");
  } else {
    managerInstance = new ChromeSpecBookmarkManager();
  }

  // Setup HMR handlers
  if (import.meta.hot) {
    setupHMRHandlers(managerInstance);
  }

  return managerInstance;
}

/**
 * Setup HMR event handlers
 */
function setupHMRHandlers(manager: ChromeSpecBookmarkManager): void {
  if (!import.meta.hot) return;

  // Track before update
  import.meta.hot.on("bun:beforeUpdate", (module) => {
    const modulePath = module.id || "unknown";
    hmrStats.modules.set(modulePath, (hmrStats.modules.get(modulePath) || 0) + 1);
    hmrStats.lastUpdate = Date.now();
    
    hmrLog.info(`🔄 HMR: Updating ${modulePath}`);
    
    // Save manager state
    import.meta.hot.data.manager = manager;
    import.meta.hot.data.stats = hmrStats;
  });

  // Track after update
  import.meta.hot.on("bun:afterUpdate", (module) => {
    hmrStats.updates++;
    const modulePath = module.id || "unknown";
    hmrLog.info(`✅ HMR: Updated ${modulePath} (${hmrStats.updates} total updates)`);
  });

  // Track errors
  import.meta.hot.on("bun:error", (error) => {
    hmrStats.errors++;
    hmrLog.error(`❌ HMR Error:`, error);
  });

  // Track full reloads
  import.meta.hot.on("bun:beforeFullReload", () => {
    hmrLog.warn("⚠️ HMR: Full reload triggered");
  });

  // WebSocket connection tracking
  import.meta.hot.on("bun:ws:disconnect", () => {
    hmrLog.warn("⚠️ HMR: WebSocket disconnected");
  });

  import.meta.hot.on("bun:ws:connect", () => {
    hmrLog.info("✅ HMR: WebSocket reconnected");
  });

  // Accept updates
  import.meta.hot.accept((newModule) => {
    // Manager instance is preserved via import.meta.hot.data
    hmrLog.info("✅ HMR: Bookmark manager updated");
  });

  // Cleanup on dispose - CRITICAL: stop any running intervals
  import.meta.hot.dispose(() => {
    // Stop any active HMR monitors to prevent interval leaks
    if (activeMonitor) {
      activeMonitor.stop();
      activeMonitor = null;
    }
    // State is automatically preserved in import.meta.hot.data
    hmrLog.info("🧹 HMR: Disposing bookmark manager");
  });
}

/**
 * Get HMR statistics
 */
export function getHMRStats(): {
  updates: number;
  errors: number;
  lastUpdate: Date;
  modules: Array<{ module: string; count: number }>;
  health: string;
  score: number;
} {
  const moduleArray = Array.from(hmrStats.modules.entries())
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate health score
  let score = 100;
  score -= hmrStats.errors * 5; // -5 per error
  if (hmrStats.updates === 0) score = 0;

  const health = score >= 95 ? "A+" :
                 score >= 90 ? "A" :
                 score >= 80 ? "B" :
                 score >= 70 ? "C" :
                 score >= 60 ? "D" : "F";

  return {
    updates: hmrStats.updates,
    errors: hmrStats.errors,
    lastUpdate: new Date(hmrStats.lastUpdate),
    modules: moduleArray,
    health,
    score
  };
}

/**
 * HMR Monitor for Bookmark Manager
 */
export class BookmarkManagerHMRMonitor {
  private interval?: Timer;

  /**
   * Start real-time monitoring
   */
  start(): void {
    // Track this monitor for HMR cleanup
    activeMonitor = this;

    console.clear();
    hmrLog.info("\x1b[1m🔥 Bookmark Manager HMR Monitor\x1b[0m");
    hmrLog.info("=".repeat(60));

    this.interval = setInterval(() => {
      this.render();
    }, 1000);

    // Initial render
    this.render();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /**
   * Render HMR status
   */
  private render(): void {
    const stats = getHMRStats();
    const now = Date.now();
    const timeSinceUpdate = now - stats.lastUpdate.getTime();
    const frequency = stats.updates > 0 
      ? (stats.updates / (timeSinceUpdate / 60000)).toFixed(1)
      : "0";

    console.clear();
    hmrLog.info("\x1b[1m🔥 Bookmark Manager HMR Monitor - Live\x1b[0m");
    hmrLog.info("=".repeat(60));
    hmrLog.info(`\x1b[1mHealth:\x1b[0m ${stats.health} (${stats.score}/100)`);
    hmrLog.info(`\x1b[1mHot Updates:\x1b[0m ${stats.updates.toString().padStart(5)}  \x1b[1mErrors:\x1b[0m ${stats.errors.toString().padStart(5)}`);
    hmrLog.info(`\x1b[1mFrequency:\x1b[0m ${frequency}/min`);
    hmrLog.info("=".repeat(60));

    if (stats.modules.length > 0) {
      hmrLog.info("\x1b[1mMost Updated Modules:\x1b[0m");
      stats.modules.slice(0, 5).forEach((m, i) => {
        hmrLog.info(`  ${i + 1}. ${m.module} (${m.count} updates)`);
      });
    }

    hmrLog.debug("\n\x1b[90mPress Ctrl+C to exit\x1b[0m");
  }
}

// Auto-setup if HMR is available
if (import.meta.hot) {
  hmrLog.info("✅ HMR enabled for Bookmark Manager");
  
  // Restore stats if available
  if (import.meta.hot.data.stats) {
    hmrStats = import.meta.hot.data.stats;
  }
}
