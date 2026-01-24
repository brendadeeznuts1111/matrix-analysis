/**
 * HMR Monitor - Hot Module Replacement Diagnostics
 * Real-time HMR event monitoring for Bun development
 */

import { getHMRStats } from "./bookmark-manager-hmr.ts";
import { getScannerHMRStats } from "./scanner-hmr.ts";

interface HMREvent {
  type: string;
  module?: string;
  timestamp: Date;
  impact: number;
}

class HMRMonitor {
  private events: HMREvent[] = [];
  private healthScore = 100;
  private hotUpdates = 0;
  private fullReloads = 0;
  private errors = 0;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (!import.meta.hot) {
      console.error("❌ HMR not available. Run with: bun --hot run app.ts");
      process.exit(1);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!import.meta.hot) return;

    import.meta.hot.on("bun:beforeUpdate", (module) => {
      this.recordEvent({
        type: "beforeUpdate",
        module: module.id,
        timestamp: new Date(),
        impact: 0
      });
    });

    import.meta.hot.on("bun:afterUpdate", (module) => {
      this.hotUpdates++;
      this.healthScore = Math.min(100, this.healthScore + 1);
      this.recordEvent({
        type: "afterUpdate",
        module: module.id,
        timestamp: new Date(),
        impact: 0
      });
    });

    import.meta.hot.on("bun:beforeFullReload", () => {
      this.fullReloads++;
      this.healthScore = Math.max(0, this.healthScore - 3);
      this.recordEvent({
        type: "beforeFullReload",
        timestamp: new Date(),
        impact: -3
      });
    });

    import.meta.hot.on("bun:error", (error) => {
      this.errors++;
      this.healthScore = Math.max(0, this.healthScore - 5);
      this.recordEvent({
        type: "error",
        timestamp: new Date(),
        impact: -5
      });
    });

    import.meta.hot.on("bun:ws:disconnect", () => {
      this.healthScore = Math.max(0, this.healthScore - 2);
      this.recordEvent({
        type: "ws:disconnect",
        timestamp: new Date(),
        impact: -2
      });
    });

    import.meta.hot.on("bun:ws:connect", () => {
      this.healthScore = Math.min(100, this.healthScore + 5);
      this.recordEvent({
        type: "ws:connect",
        timestamp: new Date(),
        impact: 5
      });
    });
  }

  private recordEvent(event: HMREvent): void {
    this.events.push(event);
    // Keep last 50 events
    if (this.events.length > 50) {
      this.events.shift();
    }
  }

  /**
   * Monitor mode - real-time display
   */
  monitor(): void {
    // Clear any existing interval to prevent leaks
    this.stop();

    console.clear();
    console.log("\x1b[1m🔥 HMR Monitor - Live\x1b[0m");
    console.log("=".repeat(60));

    this.monitorInterval = setInterval(() => {
      this.render();
    }, 1000);

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      this.stop();
      this.renderSummary();
      process.exit(0);
    });

    // Initial render
    this.render();
  }

  /**
   * Stop the monitor and clear intervals
   */
  stop(): void {
    if (this.monitorInterval !== null) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Render current status
   */
  private render(): void {
    const now = Date.now();
    const recentEvents = this.events.slice(-10);
    const timeSinceUpdate = recentEvents.length > 0
      ? now - recentEvents[recentEvents.length - 1].timestamp.getTime()
      : 0;
    const frequency = this.hotUpdates > 0 && timeSinceUpdate > 0
      ? (this.hotUpdates / (timeSinceUpdate / 60000)).toFixed(1)
      : "0";

    const healthGrade = this.healthScore >= 95 ? "A+" :
                       this.healthScore >= 90 ? "A" :
                       this.healthScore >= 80 ? "B" :
                       this.healthScore >= 70 ? "C" :
                       this.healthScore >= 60 ? "D" : "F";

    console.clear();
    console.log("\x1b[1m🔥 HMR Monitor - Live\x1b[0m");
    console.log("=".repeat(60));
    console.log(`\x1b[1mHealth:\x1b[0m ${healthGrade} (${this.healthScore}/100)`);
    console.log(`\x1b[1mHot Updates:\x1b[0m ${this.hotUpdates.toString().padStart(5)}  \x1b[1mFull Reloads:\x1b[0m ${this.fullReloads.toString().padStart(2)}`);
    console.log(`\x1b[1mErrors:\x1b[0m ${this.errors.toString().padStart(5)}  \x1b[1mFrequency:\x1b[0m ${frequency}/min`);
    console.log("=".repeat(60));
    
    if (recentEvents.length > 0) {
      console.log("\x1b[1mRecent Events:\x1b[0m");
      recentEvents.slice(-5).reverse().forEach(event => {
        const icon = this.getEventIcon(event.type);
        const time = event.timestamp.toLocaleTimeString();
        const module = event.module ? `  ${event.module.split("/").pop()}` : "";
        console.log(`  ${time}  ${icon}  ${event.type}${module}`);
      });
    }

    console.log("\n\x1b[90mPress Ctrl+C for summary\x1b[0m");
  }

  /**
   * Get icon for event type
   */
  private getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      "beforeUpdate": "→",
      "afterUpdate": "✓",
      "beforeFullReload": "⚠",
      "error": "✗",
      "ws:disconnect": "↓",
      "ws:connect": "↑"
    };
    return icons[type] || "•";
  }

  /**
   * Render summary
   */
  private renderSummary(): void {
    console.clear();
    console.log("\x1b[1m📊 HMR Summary\x1b[0m");
    console.log("=".repeat(60));
    console.log(`Total Updates: ${this.hotUpdates}`);
    console.log(`Full Reloads: ${this.fullReloads}`);
    console.log(`Errors: ${this.errors}`);
    console.log(`Final Health: ${this.healthScore}/100`);
    console.log("=".repeat(60));
  }

  /**
   * Statistics mode
   */
  stats(): void {
    const bookmarkStats = getHMRStats();
    const scannerStats = getScannerHMRStats();

    console.log("\x1b[1m📊 HMR Statistics\x1b[0m\n");

    // Bookmark Manager Stats
    console.log("📚 Bookmark Manager:");
    console.log(`  Updates: ${bookmarkStats.updates}`);
    console.log(`  Errors: ${bookmarkStats.errors}`);
    console.log(`  Health: ${bookmarkStats.health} (${bookmarkStats.score}/100)`);
    if (bookmarkStats.modules.length > 0) {
      console.log("  Top Modules:");
      bookmarkStats.modules.slice(0, 5).forEach(m => {
        console.log(`    - ${m.module}: ${m.count} updates`);
      });
    }

    console.log("\n🔍 Enterprise Scanner:");
    console.log(`  Updates: ${scannerStats.updates}`);
    console.log(`  Errors: ${scannerStats.errors}`);
    console.log(`  Full Reloads: ${scannerStats.fullReloads}`);
    console.log(`  Health: ${scannerStats.health} (${scannerStats.score}/100)`);
  }

  /**
   * Health report
   */
  report(): void {
    const bookmarkStats = getHMRStats();
    const scannerStats = getScannerHMRStats();
    const overallScore = Math.round((bookmarkStats.score + scannerStats.score) / 2);

    console.log("\x1b[1m📊 HMR Health Report\x1b[0m\n");
    console.log(`Overall Score: ${this.getHealthGrade(overallScore)} (${overallScore}/100)\n`);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (bookmarkStats.errors > 0) {
      issues.push(`⚠️  ${bookmarkStats.errors} HMR errors in bookmark manager`);
      recommendations.push("Check for syntax errors or circular dependencies");
    }

    if (scannerStats.fullReloads > 0) {
      issues.push(`⚠️  ${scannerStats.fullReloads} full reloads detected`);
      recommendations.push("Add import.meta.hot.accept() to entry files");
    }

    if (bookmarkStats.modules.length > 10) {
      issues.push(`⚠️  High module update frequency (${bookmarkStats.modules.length} modules)`);
      recommendations.push("Consider batching rapid saves");
    }

    if (issues.length > 0) {
      console.log("Issues Found:");
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log("\nRecommendations:");
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    } else {
      console.log("✅ No issues detected");
    }
  }

  private getHealthGrade(score: number): string {
    return score >= 95 ? "A+" :
           score >= 90 ? "A" :
           score >= 80 ? "B" :
           score >= 70 ? "C" :
           score >= 60 ? "D" : "F";
  }
}

// CLI entry point
if (import.meta.main) {
  const monitor = new HMRMonitor();
  const command = process.argv[2] || "monitor";

  switch (command) {
    case "monitor":
      monitor.monitor();
      break;
    case "stats":
      monitor.stats();
      break;
    case "report":
      monitor.report();
      break;
    default:
      console.log(`
Usage: bun --hot hmr-monitor.ts [command]

Commands:
  monitor  Real-time HMR monitoring (default)
  stats    Show HMR statistics
  report   Health report with recommendations
      `);
  }
}
