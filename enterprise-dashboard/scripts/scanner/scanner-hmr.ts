/**
 * Enterprise Scanner HMR Support
 * Hot Module Replacement for scanner development
 */

import { EnterpriseScanner } from "./enterprise-scanner.ts";
import type { ScannerConfig } from "./enterprise-scanner.ts";

// HMR state
let scannerInstance: EnterpriseScanner | null = null;
let scannerHMRStats = {
  updates: 0,
  errors: 0,
  fullReloads: 0,
  lastUpdate: Date.now(),
  scanCount: 0
};

/**
 * Get or create scanner instance with HMR support
 */
export function getScanner(config?: ScannerConfig): EnterpriseScanner {
  // Restore from HMR data if available
  if (import.meta.hot?.data.scanner) {
    scannerInstance = import.meta.hot.data.scanner;
    console.log("🔄 HMR: Restored scanner instance");
  } else {
    scannerInstance = new EnterpriseScanner(config || {
      mode: "audit",
      format: "sarif"
    });
  }

  // Setup HMR handlers
  if (import.meta.hot) {
    setupScannerHMRHandlers(scannerInstance);
  }

  return scannerInstance;
}

/**
 * Setup HMR handlers for scanner
 */
function setupScannerHMRHandlers(scanner: EnterpriseScanner): void {
  if (!import.meta.hot) return;

  // Track updates
  import.meta.hot.on("bun:beforeUpdate", () => {
    scannerHMRStats.lastUpdate = Date.now();
    import.meta.hot.data.scanner = scanner;
    import.meta.hot.data.stats = scannerHMRStats;
  });

  import.meta.hot.on("bun:afterUpdate", () => {
    scannerHMRStats.updates++;
    console.log(`✅ HMR: Scanner updated (${scannerHMRStats.updates} total)`);
  });

  // Track errors
  import.meta.hot.on("bun:error", (error) => {
    scannerHMRStats.errors++;
    console.error(`❌ HMR Error in scanner:`, error);
  });

  // Track full reloads
  import.meta.hot.on("bun:beforeFullReload", () => {
    scannerHMRStats.fullReloads++;
    console.warn("⚠️ HMR: Full reload triggered");
  });

  // Accept updates
  import.meta.hot.accept((newModule) => {
    // Scanner instance preserved via import.meta.hot.data
    console.log("✅ HMR: Scanner module updated");
  });

  // Cleanup
  import.meta.hot.dispose(() => {
    console.log("🧹 HMR: Disposing scanner");
  });
}

/**
 * Get scanner HMR statistics
 */
export function getScannerHMRStats(): {
  updates: number;
  errors: number;
  fullReloads: number;
  lastUpdate: Date;
  health: string;
  score: number;
} {
  let score = 100;
  score -= scannerHMRStats.errors * 5;
  score -= scannerHMRStats.fullReloads * 3;

  const health = score >= 95 ? "A+" :
                 score >= 90 ? "A" :
                 score >= 80 ? "B" :
                 score >= 70 ? "C" :
                 score >= 60 ? "D" : "F";

  return {
    updates: scannerHMRStats.updates,
    errors: scannerHMRStats.errors,
    fullReloads: scannerHMRStats.fullReloads,
    lastUpdate: new Date(scannerHMRStats.lastUpdate),
    health,
    score
  };
}

// Auto-setup if HMR is available
if (import.meta.hot) {
  console.log("✅ HMR enabled for Enterprise Scanner");
  
  if (import.meta.hot.data.stats) {
    scannerHMRStats = import.meta.hot.data.stats;
  }
}
