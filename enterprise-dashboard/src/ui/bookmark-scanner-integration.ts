/**
 * Bookmark Manager & Enterprise Scanner Integration
 * Cross-references bookmarks with security scans and provides correlation
 */

import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import { EnterpriseScanner, type ScanIssue, type ScanResult } from "./enterprise-scanner.ts";
import type { Bookmark } from "./chrome-bookmark-manager.ts";

export interface BookmarkScanCorrelation {
  bookmarkId: string;
  bookmark: Bookmark;
  issues: ScanIssue[];
  riskLevel: "low" | "medium" | "high" | "critical";
  lastScanned?: Date;
  scanTraceId?: string;
}

export interface BookmarkSecurityReport {
  totalBookmarks: number;
  scannedBookmarks: number;
  issuesFound: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  correlations: BookmarkScanCorrelation[];
  recommendations: string[];
}

/**
 * Integrates bookmark manager with enterprise scanner
 */
export class BookmarkSecurityIntegration {
  private bookmarkManager: ChromeSpecBookmarkManager;
  private scanner: EnterpriseScanner;

  constructor(
    bookmarkManager: ChromeSpecBookmarkManager,
    scanner: EnterpriseScanner
  ) {
    this.bookmarkManager = bookmarkManager;
    this.scanner = scanner;
  }

  /**
   * Scan all bookmark URLs and correlate with security issues
   */
  async scanBookmarks(options?: {
    includeFolders?: string[];
    excludeFolders?: string[];
    riskThreshold?: "low" | "medium" | "high" | "critical";
  }): Promise<BookmarkSecurityReport> {
    const bookmarks = Array.from(this.bookmarkManager["bookmarks"].values());
    
    // Filter by folders if specified
    let filteredBookmarks = bookmarks;
    if (options?.includeFolders) {
      filteredBookmarks = filteredBookmarks.filter(b => 
        options.includeFolders!.some(folder => b.folderPath.includes(folder))
      );
    }
    if (options?.excludeFolders) {
      filteredBookmarks = filteredBookmarks.filter(b => 
        !options.excludeFolders!.some(folder => b.folderPath.includes(folder))
      );
    }

    const correlations: BookmarkScanCorrelation[] = [];
    let issuesFound = 0;
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

    // Scan each bookmark URL
    for (const bookmark of filteredBookmarks) {
      try {
        const url = new URL(bookmark.url);
        const hostname = url.hostname;

        // Scan the domain/hostname
        const scanResult = await this.scanner.scan(hostname);
        
        // Filter issues by risk threshold
        const relevantIssues = scanResult.issues.filter(issue => {
          if (!options?.riskThreshold) return true;
          const severity = issue.severity;
          const threshold = options.riskThreshold;
          
          const severityOrder = { note: 0, warning: 1, error: 2 };
          const thresholdOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          
          return severityOrder[severity] >= thresholdOrder[threshold];
        });

        if (relevantIssues.length > 0) {
          const riskLevel = this.calculateRiskLevel(relevantIssues);
          riskDistribution[riskLevel]++;

          correlations.push({
            bookmarkId: bookmark.id,
            bookmark,
            issues: relevantIssues,
            riskLevel,
            lastScanned: new Date(),
            scanTraceId: scanResult.traceId
          });

          issuesFound += relevantIssues.length;
        }
      } catch (error) {
        // Skip invalid URLs
        console.warn(`Skipping invalid bookmark URL: ${bookmark.url}`);
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(correlations, riskDistribution);

    return {
      totalBookmarks: bookmarks.length,
      scannedBookmarks: filteredBookmarks.length,
      issuesFound,
      riskDistribution,
      correlations,
      recommendations
    };
  }

  /**
   * Cross-reference bookmark visits with security issues
   */
  async correlateVisitsWithSecurity(): Promise<Map<string, {
    bookmark: Bookmark;
    visitCount: number;
    lastVisit: Date;
    securityIssues: ScanIssue[];
    riskScore: number;
  }>> {
    const correlationMap = new Map();
    const bookmarks = Array.from(this.bookmarkManager["bookmarks"].values());

    for (const bookmark of bookmarks) {
      if (!bookmark.url.startsWith("http")) continue;

      try {
        const url = new URL(bookmark.url);
        const hostname = url.hostname;

        // Scan hostname
        const scanResult = await this.scanner.scan(hostname);
        
        // Calculate risk score based on visits and issues
        const riskScore = this.calculateRiskScore(bookmark, scanResult.issues);

        correlationMap.set(bookmark.id, {
          bookmark,
          visitCount: bookmark.visits,
          lastVisit: bookmark.lastVisited || bookmark.added,
          securityIssues: scanResult.issues,
          riskScore
        });
      } catch {
        // Skip invalid URLs
      }
    }

    return correlationMap;
  }

  /**
   * Find bookmarks that reference scanned files
   */
  async findBookmarksForScannedFiles(scanResult: ScanResult): Promise<Map<string, Bookmark[]>> {
    const fileToBookmarks = new Map<string, Bookmark[]>();
    const bookmarks = Array.from(this.bookmarkManager["bookmarks"].values());

    // Extract file paths from scan issues
    const scannedFiles = new Set(
      scanResult.issues
        .map(issue => issue.file)
        .filter((file): file is string => file !== undefined)
    );

    // Match bookmarks to scanned files
    for (const bookmark of bookmarks) {
      try {
        const url = new URL(bookmark.url);
        
        // Check if bookmark URL matches any scanned file path
        for (const file of scannedFiles) {
          if (file.includes(url.hostname) || url.pathname.includes(file)) {
            if (!fileToBookmarks.has(file)) {
              fileToBookmarks.set(file, []);
            }
            fileToBookmarks.get(file)!.push(bookmark);
          }
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return fileToBookmarks;
  }

  /**
   * Generate security report with bookmark context
   */
  async generateSecurityReport(): Promise<{
    scanResults: ScanResult;
    bookmarkCorrelations: BookmarkSecurityReport;
    visitCorrelations: Map<string, any>;
    recommendations: string[];
  }> {
    // Run full scan
    const scanResult = await this.scanner.scan(".");

    // Scan bookmarks
    const bookmarkCorrelations = await this.scanBookmarks();

    // Correlate visits
    const visitCorrelations = await this.correlateVisitsWithSecurity();

    // Find bookmarks for scanned files
    const fileBookmarks = await this.findBookmarksForScannedFiles(scanResult);

    // Generate comprehensive recommendations
    const recommendations = [
      ...bookmarkCorrelations.recommendations,
      ...this.generateFileBasedRecommendations(scanResult, fileBookmarks)
    ];

    return {
      scanResults: scanResult,
      bookmarkCorrelations,
      visitCorrelations,
      recommendations: [...new Set(recommendations)] // Deduplicate
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private calculateRiskLevel(issues: ScanIssue[]): "low" | "medium" | "high" | "critical" {
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;

    if (errorCount >= 3) return "critical";
    if (errorCount >= 1) return "high";
    if (warningCount >= 3) return "medium";
    return "low";
  }

  private calculateRiskScore(bookmark: Bookmark, issues: ScanIssue[]): number {
    let score = 0;

    // Base score from issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case "error": score += 10; break;
        case "warning": score += 5; break;
        case "note": score += 1; break;
      }
    });

    // Multiply by visit frequency (more visits = higher risk if issues exist)
    if (bookmark.visits > 0) {
      score *= Math.log10(bookmark.visits + 1);
    }

    // Recent visits increase risk
    if (bookmark.lastVisited) {
      const daysSinceVisit = (Date.now() - bookmark.lastVisited.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit < 7) {
        score *= 1.5; // 50% increase for recent visits
      }
    }

    return Math.round(score);
  }

  private generateRecommendations(
    correlations: BookmarkScanCorrelation[],
    riskDistribution: { low: number; medium: number; high: number; critical: number }
  ): string[] {
    const recommendations: string[] = [];

    if (riskDistribution.critical > 0) {
      recommendations.push(
        `🚨 ${riskDistribution.critical} bookmark(s) have critical security issues. Review immediately.`
      );
    }

    if (riskDistribution.high > 0) {
      recommendations.push(
        `⚠️  ${riskDistribution.high} bookmark(s) have high-risk security issues. Consider removing or updating.`
      );
    }

    const highRiskBookmarks = correlations.filter(c => c.riskLevel === "high" || c.riskLevel === "critical");
    if (highRiskBookmarks.length > 0) {
      recommendations.push(
        `📋 Review these high-risk bookmarks: ${highRiskBookmarks.map(c => c.bookmark.title).join(", ")}`
      );
    }

    return recommendations;
  }

  private generateFileBasedRecommendations(
    scanResult: ScanResult,
    fileBookmarks: Map<string, Bookmark[]>
  ): string[] {
    const recommendations: string[] = [];

    if (fileBookmarks.size > 0) {
      recommendations.push(
        `🔗 ${fileBookmarks.size} scanned file(s) have associated bookmarks. Review bookmark security.`
      );
    }

    return recommendations;
  }
}

/**
 * Quick integration helper
 */
export async function integrateBookmarksWithScanner(
  bookmarkManager: ChromeSpecBookmarkManager,
  scanner: EnterpriseScanner
): Promise<BookmarkSecurityIntegration> {
  const integration = new BookmarkSecurityIntegration(bookmarkManager, scanner);
  return integration;
}
