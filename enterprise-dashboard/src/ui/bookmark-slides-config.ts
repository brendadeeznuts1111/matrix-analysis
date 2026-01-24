/**
 * Bookmark Manager Slides Configuration
 * Configure bookmark manager via presentation/slides format
 */

import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import type { BookmarkManagerConfig } from "./chrome-bookmark-manager.ts";

export interface SlideConfig {
  title: string;
  content: string;
  config?: Partial<BookmarkManagerConfig>;
  actions?: Array<{
    type: "sync" | "export" | "scan" | "search";
    params?: Record<string, any>;
  }>;
}

export interface SlidesConfiguration {
  version: string;
  slides: SlideConfig[];
  metadata?: {
    author?: string;
    created?: string;
    description?: string;
  };
}

/**
 * Parse slides configuration and apply to bookmark manager
 */
export class SlidesConfigManager {
  /**
   * Load configuration from slides format
   */
  async loadFromSlides(slidesPath: string): Promise<SlidesConfiguration> {
    const { file } = await import("bun");
    const slidesData = await file(slidesPath).json();
    return slidesData as SlidesConfiguration;
  }

  /**
   * Apply slides configuration to bookmark manager
   */
  async applySlidesConfig(
    manager: ChromeSpecBookmarkManager,
    slides: SlidesConfiguration
  ): Promise<void> {
    for (const slide of slides.slides) {
      console.log(`\n📊 Slide: ${slide.title}`);
      console.log(`   ${slide.content}`);

      // Apply configuration from slide
      if (slide.config) {
        manager.updateConfig(slide.config);
        console.log(`   ✅ Configuration updated`);
      }

      // Execute actions
      if (slide.actions) {
        for (const action of slide.actions) {
          await this.executeAction(manager, action);
        }
      }
    }
  }

  /**
   * Execute action from slide
   */
  private async executeAction(
    manager: ChromeSpecBookmarkManager,
    action: { type: string; params?: Record<string, any> }
  ): Promise<void> {
    switch (action.type) {
      case "sync":
        const profileName = action.params?.profileName;
        await manager.syncWithChrome(profileName);
        console.log(`   ✅ Synced with Chrome${profileName ? ` (${profileName})` : ""}`);
        break;

      case "export":
        const exportPath = action.params?.path || "./bookmarks-export.json";
        manager.exportToFile(exportPath);
        console.log(`   ✅ Exported to ${exportPath}`);
        break;

      case "scan":
        const { EnterpriseScanner } = await import("./enterprise-scanner.ts");
        const scanner = new EnterpriseScanner({
          mode: action.params?.mode || "audit",
          format: "sarif"
        });
        await scanner.initialize();
        
        const { BookmarkSecurityIntegration } = await import("./bookmark-scanner-integration.ts");
        const integration = new BookmarkSecurityIntegration(manager, scanner);
        const report = await integration.scanBookmarks({
          riskThreshold: action.params?.riskThreshold || "medium"
        });
        console.log(`   ✅ Scanned: ${report.issuesFound} issues found`);
        break;

      case "search":
        const query = action.params?.query;
        if (query) {
          const results = manager.search(query);
          console.log(`   ✅ Found ${results.length} results for "${query}"`);
        }
        break;
    }
  }

  /**
   * Generate slides configuration from current manager state
   */
  generateSlidesFromManager(manager: ChromeSpecBookmarkManager): SlidesConfiguration {
    const config = manager.getConfig();
    const stats = manager.getStatistics();

    return {
      version: "1.0.0",
      metadata: {
        created: new Date().toISOString(),
        description: "Bookmark Manager Configuration Slides"
      },
      slides: [
        {
          title: "Configuration Overview",
          content: `Workspace: ${config.workspaceProfileName}\nMax Results: ${config.maxSearchResults || 50}`,
          config: {
            workspaceProfileName: config.workspaceProfileName,
            maxSearchResults: config.maxSearchResults
          }
        },
        {
          title: "Statistics",
          content: `Total Bookmarks: ${stats.totalBookmarks}\nTotal Folders: ${stats.totalFolders}\nTotal Visits: ${stats.totalVisits}`,
          actions: []
        },
        {
          title: "Sync with Chrome",
          content: "Sync bookmarks from Chrome",
          actions: [{
            type: "sync",
            params: {}
          }]
        },
        {
          title: "Export Bookmarks",
          content: "Export bookmarks to JSON",
          actions: [{
            type: "export",
            params: { path: "./bookmarks-export.json" }
          }]
        }
      ]
    };
  }

  /**
   * Create interactive slideshow presentation
   */
  async presentSlides(slides: SlidesConfiguration): Promise<void> {
    console.clear();
    console.log("\x1b[1m📊 Bookmark Manager Configuration Slides\x1b[0m");
    console.log("=".repeat(60));

    for (let i = 0; i < slides.slides.length; i++) {
      const slide = slides.slides[i];
      
      console.log(`\n\x1b[1mSlide ${i + 1}/${slides.slides.length}: ${slide.title}\x1b[0m`);
      console.log("\x1b[90m" + "-".repeat(60) + "\x1b[0m");
      console.log(slide.content);
      
      if (slide.config) {
        console.log("\n\x1b[33mConfiguration:\x1b[0m");
        console.log(JSON.stringify(slide.config, null, 2));
      }

      if (i < slides.slides.length - 1) {
        console.log("\n\x1b[90mPress Enter to continue to next slide...\x1b[0m");
        await this.waitForEnter();
        console.clear();
      }
    }

    console.log("\n\x1b[32m✅ Presentation complete!\x1b[0m");
  }

  private async waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once("data", () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });
  }
}

/**
 * Example slides configuration
 */
export const exampleSlidesConfig: SlidesConfiguration = {
  version: "1.0.0",
  metadata: {
    author: "Enterprise Team",
    created: new Date().toISOString(),
    description: "Bookmark Manager Setup and Configuration"
  },
  slides: [
    {
      title: "Welcome to Bookmark Manager",
      content: "Enterprise-grade bookmark management with Chrome sync and security scanning.",
      config: {
        workspaceProfileName: "Bookmark Manager Workspace",
        maxSearchResults: 50
      }
    },
    {
      title: "Chrome Sync Configuration",
      content: "Configure Chrome bookmarks synchronization",
      config: {
        chromeProfileName: "Default",
        autoDetectChromePath: true
      },
      actions: [{
        type: "sync",
        params: {}
      }]
    },
    {
      title: "Security Scanning",
      content: "Scan bookmarks for security issues",
      actions: [{
        type: "scan",
        params: {
          mode: "audit",
          riskThreshold: "high"
        }
      }]
    },
    {
      title: "Export Results",
      content: "Export bookmarks and scan results",
      actions: [{
        type: "export",
        params: {
          path: "./bookmarks-export.json"
        }
      }]
    }
  ]
};
