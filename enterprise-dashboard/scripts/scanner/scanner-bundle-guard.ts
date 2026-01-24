/**
 * Bundle Guard
 * Enforces bundle size budgets and analyzes build metafiles
 */

import type { ScannerRCConfig } from "./scanner-config-manager.ts";

export interface BundleMetafile {
  inputs: Record<string, {
    bytes: number;
    imports?: Array<{ path: string; kind?: string }>;
  }>;
  outputs: Record<string, {
    bytes: number;
    inputs?: string[];
    imports?: Array<{ path: string; kind?: string }>;
    exports?: string[];
  }>;
}

export interface BundleBudgetViolation {
  file: string;
  currentSize: number;
  budgetSize: number;
  violationType: "error" | "warning";
  message: string;
}

export class BundleGuard {
  private config: ScannerRCConfig;

  constructor(config: ScannerRCConfig) {
    this.config = config;
  }

  /**
   * Enforce bundle size budgets from metafile
   */
  async enforceBudgets(metafile: BundleMetafile): Promise<{
    violations: BundleBudgetViolation[];
    passed: boolean;
  }> {
    const violations: BundleBudgetViolation[] = [];
    const budgets = this.config.bundleBudgets;

    if (!budgets) {
      return { violations: [], passed: true };
    }

    // Check total bundle sizes
    for (const [outputPath, output] of Object.entries(metafile.outputs)) {
      const size = output.bytes;
      
      // Check max size
      if (budgets.maxSize && size > budgets.maxSize) {
        violations.push({
          file: outputPath,
          currentSize: size,
          budgetSize: budgets.maxSize,
          violationType: "error",
          message: `Bundle ${outputPath} exceeds maximum size: ${this.formatBytes(size)} > ${this.formatBytes(budgets.maxSize)}`
        });
      }

      // Check warning threshold
      if (budgets.warnings?.size && size > budgets.warnings.size) {
        violations.push({
          file: outputPath,
          currentSize: size,
          budgetSize: budgets.warnings.size,
          violationType: "warning",
          message: `Bundle ${outputPath} exceeds warning threshold: ${this.formatBytes(size)} > ${this.formatBytes(budgets.warnings.size)}`
        });
      }

      // Check initial bundle size (entry points)
      const isInitial = outputPath.includes("index") || outputPath.includes("main");
      if (isInitial && budgets.maxInitialSize && size > budgets.maxInitialSize) {
        violations.push({
          file: outputPath,
          currentSize: size,
          budgetSize: budgets.maxInitialSize,
          violationType: "error",
          message: `Initial bundle ${outputPath} exceeds maximum: ${this.formatBytes(size)} > ${this.formatBytes(budgets.maxInitialSize)}`
        });
      }

      // Check async/chunk size
      const isAsync = outputPath.includes("chunk") || outputPath.includes("async");
      if (isAsync && budgets.maxAsyncSize && size > budgets.maxAsyncSize) {
        violations.push({
          file: outputPath,
          currentSize: size,
          budgetSize: budgets.maxAsyncSize,
          violationType: "error",
          message: `Async bundle ${outputPath} exceeds maximum: ${this.formatBytes(size)} > ${this.formatBytes(budgets.maxAsyncSize)}`
        });
      }
    }

    const errors = violations.filter(v => v.violationType === "error");
    const passed = errors.length === 0;

    return { violations, passed };
  }

  /**
   * Analyze bundle composition
   */
  analyzeBundle(metafile: BundleMetafile): {
    totalSize: number;
    initialSize: number;
    asyncSize: number;
    largestFiles: Array<{ file: string; size: number; percentage: number }>;
    dependencies: Array<{ name: string; size: number }>;
  } {
    let totalSize = 0;
    let initialSize = 0;
    let asyncSize = 0;
    const fileSizes: Array<{ file: string; size: number }> = [];

    for (const [outputPath, output] of Object.entries(metafile.outputs)) {
      totalSize += output.bytes;
      
      const isInitial = outputPath.includes("index") || outputPath.includes("main");
      const isAsync = outputPath.includes("chunk") || outputPath.includes("async");
      
      if (isInitial) {
        initialSize += output.bytes;
      } else if (isAsync) {
        asyncSize += output.bytes;
      }

      fileSizes.push({ file: outputPath, size: output.bytes });
    }

    // Sort by size
    fileSizes.sort((a, b) => b.size - a.size);

    // Get largest files with percentages
    const largestFiles = fileSizes.slice(0, 10).map(f => ({
      file: f.file,
      size: f.size,
      percentage: (f.size / totalSize) * 100
    }));

    // Analyze dependencies
    const dependencies = new Map<string, number>();
    for (const [inputPath, input] of Object.entries(metafile.inputs)) {
      const depName = this.extractDependencyName(inputPath);
      if (depName) {
        dependencies.set(depName, (dependencies.get(depName) || 0) + input.bytes);
      }
    }

    const depArray = Array.from(dependencies.entries())
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      totalSize,
      initialSize,
      asyncSize,
      largestFiles,
      dependencies: depArray
    };
  }

  private extractDependencyName(inputPath: string): string | null {
    // Extract package name from node_modules path
    const nodeModulesMatch = inputPath.match(/node_modules\/(@[^\/]+\/[^\/]+|[^\/]+)/);
    if (nodeModulesMatch) {
      return nodeModulesMatch[1];
    }
    return null;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
