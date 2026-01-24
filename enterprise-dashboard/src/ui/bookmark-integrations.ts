/**
 * Bookmark Manager Integrations
 * Cross-references and integrates with various systems
 */

import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import { EnterpriseScanner } from "./enterprise-scanner.ts";
import { BookmarkSecurityIntegration } from "./bookmark-scanner-integration.ts";
import { BookmarkRegistryIntegration } from "./bookmark-registry-integration.ts";
import type { Bookmark } from "./chrome-bookmark-manager.ts";

/**
 * Integration Registry
 * Tracks all integrations and cross-references
 */
export class BookmarkIntegrationRegistry {
  private bookmarkManager: ChromeSpecBookmarkManager;
  private integrations: Map<string, any> = new Map();

  constructor(bookmarkManager: ChromeSpecBookmarkManager) {
    this.bookmarkManager = bookmarkManager;
  }

  /**
   * Register scanner integration
   */
  registerScanner(scanner: EnterpriseScanner): BookmarkSecurityIntegration {
    const integration = new BookmarkSecurityIntegration(this.bookmarkManager, scanner);
    this.integrations.set("scanner", integration);
    return integration;
  }

  /**
   * Register package registry integration
   */
  registerRegistry(): BookmarkRegistryIntegration {
    const integration = new BookmarkRegistryIntegration(this.bookmarkManager);
    this.integrations.set("registry", integration);
    return integration;
  }

  /**
   * Get all cross-references for a bookmark
   */
  async getCrossReferences(bookmarkId: string): Promise<{
    bookmark: Bookmark | null;
    scanner?: { issues: number; riskLevel: string; traceId?: string };
    visits: number;
    lastVisit?: Date;
    folderPath: string[];
    tags: string[];
  }> {
    const bookmark = this.bookmarkManager["bookmarks"].get(bookmarkId);
    if (!bookmark) {
      return {
        bookmark: null,
        visits: 0,
        folderPath: [],
        tags: []
      };
    }

    const crossRefs: any = {
      bookmark,
      visits: bookmark.visits,
      lastVisit: bookmark.lastVisited,
      folderPath: bookmark.folderPath,
      tags: bookmark.tags
    };

    // Get scanner cross-reference if available
    const scannerIntegration = this.integrations.get("scanner");
    if (scannerIntegration && bookmark.url.startsWith("http")) {
      try {
        const url = new URL(bookmark.url);
        const scanResult = await scannerIntegration["scanner"].scan(url.hostname);
        
        const riskLevel = scanResult.issuesFound === 0 ? "low" :
                         scanResult.issuesFound < 3 ? "medium" :
                         scanResult.issuesFound < 10 ? "high" : "critical";

        crossRefs.scanner = {
          issues: scanResult.issuesFound,
          riskLevel,
          traceId: scanResult.traceId
        };
      } catch {
        // Skip invalid URLs
      }
    }

    // Get registry cross-reference if available
    const registryIntegration = this.integrations.get("registry");
    if (registryIntegration) {
      const registryCorrelation = await registryIntegration.crossReferenceWithRegistry(bookmarkId);
      if (registryCorrelation.isPackageUrl) {
        crossRefs.registry = {
          packageName: registryCorrelation.packageInfo?.name,
          registry: registryCorrelation.registry,
          version: registryCorrelation.packageInfo?.version,
          description: registryCorrelation.packageInfo?.description
        };
      }
    }

    return crossRefs;
  }

  /**
   * Get all integrations
   */
  getIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }
}

/**
 * Quick setup function
 */
export async function setupBookmarkIntegrations(
  bookmarkManager: ChromeSpecBookmarkManager,
  options?: {
    scanner?: EnterpriseScanner;
    registry?: boolean; // Enable package registry integration
  }
): Promise<BookmarkIntegrationRegistry> {
  const registry = new BookmarkIntegrationRegistry(bookmarkManager);

  if (options?.scanner) {
    registry.registerScanner(options.scanner);
  }

  if (options?.registry !== false) {
    // Enable registry by default
    registry.registerRegistry();
  }

  return registry;
}
