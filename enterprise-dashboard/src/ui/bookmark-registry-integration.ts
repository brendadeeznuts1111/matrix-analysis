/**
 * Bookmark Manager ↔ Package Registry Integration
 * Cross-references bookmarks with npm/package registries
 */

import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import type { Bookmark } from "./chrome-bookmark-manager.ts";

export interface PackageRegistryInfo {
  name: string;
  version?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  registry: "npm" | "github" | "custom";
  registryUrl: string;
}

export interface BookmarkPackageCorrelation {
  bookmark: Bookmark;
  packageInfo?: PackageRegistryInfo;
  isPackageUrl: boolean;
  packageName?: string;
  registry?: string;
}

/**
 * Integrates bookmark manager with package registries
 */
export class BookmarkRegistryIntegration {
  private bookmarkManager: ChromeSpecBookmarkManager;
  private registryCache: Map<string, PackageRegistryInfo> = new Map();

  constructor(bookmarkManager: ChromeSpecBookmarkManager) {
    this.bookmarkManager = bookmarkManager;
  }

  /**
   * Detect if bookmark URL points to a package registry
   */
  async detectPackageFromBookmark(bookmark: Bookmark): Promise<BookmarkPackageCorrelation> {
    const correlation: BookmarkPackageCorrelation = {
      bookmark,
      isPackageUrl: false
    };

    try {
      const url = new URL(bookmark.url);

      // Check npm registry
      if (url.hostname === "www.npmjs.com" || url.hostname === "npmjs.com") {
        const packageName = this.extractPackageNameFromNpmUrl(url);
        if (packageName) {
          correlation.isPackageUrl = true;
          correlation.packageName = packageName;
          correlation.registry = "npm";
          correlation.packageInfo = await this.fetchNpmPackageInfo(packageName);
        }
      }

      // Check GitHub packages
      if (url.hostname === "github.com") {
        const packageName = this.extractPackageNameFromGitHubUrl(url);
        if (packageName) {
          correlation.isPackageUrl = true;
          correlation.packageName = packageName;
          correlation.registry = "github";
          correlation.packageInfo = await this.fetchGitHubPackageInfo(packageName, url);
        }
      }

      // Check custom registries (from package.json homepage/repository)
      const customPackage = await this.detectCustomRegistryPackage(url);
      if (customPackage) {
        correlation.isPackageUrl = true;
        correlation.packageInfo = customPackage;
        correlation.registry = "custom";
      }

    } catch {
      // Invalid URL, not a package
    }

    return correlation;
  }

  /**
   * Find all bookmarks that reference npm packages
   */
  async findPackageBookmarks(): Promise<BookmarkPackageCorrelation[]> {
    const bookmarks = this.bookmarkManager.getAllBookmarks();
    const correlations: BookmarkPackageCorrelation[] = [];

    for (const bookmark of bookmarks) {
      const correlation = await this.detectPackageFromBookmark(bookmark);
      if (correlation.isPackageUrl) {
        correlations.push(correlation);
      }
    }

    return correlations;
  }

  /**
   * Cross-reference bookmark with package registry
   */
  async crossReferenceWithRegistry(bookmarkId: string): Promise<{
    bookmark: Bookmark | null;
    packageInfo?: PackageRegistryInfo;
    registry?: string;
    isPackageUrl: boolean;
  }> {
    const bookmark = this.bookmarkManager.getBookmark(bookmarkId);
    if (!bookmark) {
      return { bookmark: null, isPackageUrl: false };
    }

    const correlation = await this.detectPackageFromBookmark(bookmark);
    
    return {
      bookmark,
      packageInfo: correlation.packageInfo,
      registry: correlation.registry,
      isPackageUrl: correlation.isPackageUrl
    };
  }

  /**
   * Get package info from npm registry
   */
  async fetchNpmPackageInfo(packageName: string): Promise<PackageRegistryInfo | undefined> {
    // Check cache first
    const cacheKey = `npm:${packageName}`;
    if (this.registryCache.has(cacheKey)) {
      return this.registryCache.get(cacheKey);
    }

    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      if (!response.ok) return undefined;

      const data = await response.json();
      const latest = data["dist-tags"]?.latest || Object.keys(data.versions || {})[0];
      const version = data.versions?.[latest];

      const packageInfo: PackageRegistryInfo = {
        name: packageName,
        version: latest,
        description: version?.description || data.description,
        homepage: version?.homepage || data.homepage,
        repository: typeof version?.repository === "string" 
          ? version.repository 
          : version?.repository?.url,
        registry: "npm",
        registryUrl: `https://registry.npmjs.org/${packageName}`
      };

      this.registryCache.set(cacheKey, packageInfo);
      return packageInfo;
    } catch {
      return undefined;
    }
  }

  /**
   * Get package info from GitHub
   */
  async fetchGitHubPackageInfo(packageName: string, url: URL): Promise<PackageRegistryInfo | undefined> {
    const cacheKey = `github:${packageName}`;
    if (this.registryCache.has(cacheKey)) {
      return this.registryCache.get(cacheKey);
    }

    try {
      // Extract owner/repo from GitHub URL
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        const owner = pathParts[0];
        const repo = pathParts[1];

        const packageInfo: PackageRegistryInfo = {
          name: packageName,
          description: `GitHub repository: ${owner}/${repo}`,
          repository: url.href,
          registry: "github",
          registryUrl: `https://github.com/${owner}/${repo}`
        };

        this.registryCache.set(cacheKey, packageInfo);
        return packageInfo;
      }
    } catch {
      // Ignore errors
    }

    return undefined;
  }

  /**
   * Extract package name from npm URL
   */
  private extractPackageNameFromNpmUrl(url: URL): string | null {
    // npmjs.com/package/package-name
    const match = url.pathname.match(/^\/package\/(.+)$/);
    if (match) {
      return match[1];
    }

    // Scoped packages: npmjs.com/package/@scope/package-name
    const scopedMatch = url.pathname.match(/^\/package\/(@[^\/]+\/[^\/]+)/);
    if (scopedMatch) {
      return scopedMatch[1];
    }

    return null;
  }

  /**
   * Extract package name from GitHub URL
   */
  private extractPackageNameFromGitHubUrl(url: URL): string | null {
    // github.com/owner/repo
    const match = url.pathname.match(/^\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }

    return null;
  }

  /**
   * Detect custom registry packages (from package.json metadata)
   */
  private async detectCustomRegistryPackage(url: URL): Promise<PackageRegistryInfo | undefined> {
    // This would check if URL matches known package homepages/repositories
    // For now, return undefined (can be extended)
    return undefined;
  }

  /**
   * Get all bookmarks organized by registry
   */
  async getBookmarksByRegistry(): Promise<{
    npm: BookmarkPackageCorrelation[];
    github: BookmarkPackageCorrelation[];
    custom: BookmarkPackageCorrelation[];
    other: Bookmark[];
  }> {
    const packageBookmarks = await this.findPackageBookmarks();
    
    return {
      npm: packageBookmarks.filter(c => c.registry === "npm"),
      github: packageBookmarks.filter(c => c.registry === "github"),
      custom: packageBookmarks.filter(c => c.registry === "custom"),
      other: this.bookmarkManager.getAllBookmarks().filter(b => {
        const isPackage = packageBookmarks.some(c => c.bookmark.id === b.id);
        return !isPackage;
      })
    };
  }
}
