#!/usr/bin/env bun
/**
 * 🔧 Import-Aware Test Runner
 *
 * Extends the test runner to handle different import types intelligently
 */

import { readFileSync, writeFileSync } from 'fs';

interface ImportAnalysis {
  imports: Array<{
    kind: string;
    path: string;
    line?: number;
  }>;
  dependencies: {
    external: string[];
    local: string[];
    builtIn: string[];
    dynamic: string[];
  };
}

class ImportAwareTestRunner {
  private transpiler: any;

  constructor() {
    this.transpiler = new (globalThis as any).Bun.Transpiler({
      loader: 'ts'
    });
  }

  // Analyze imports in a test file
  analyzeImports(filePath: string): ImportAnalysis {
    let code = readFileSync(filePath, 'utf-8');

    // Remove shebang if present
    if (code.startsWith('#!')) {
      code = code.replace(/^#![^\n]*\n/, '');
    }

    const imports = this.transpiler.scanImports(code);

    const analysis: ImportAnalysis = {
      imports: imports.map((imp: any) => ({
        kind: imp.kind,
        path: imp.path,
        line: undefined // Could add line numbers with more parsing
      })),
      dependencies: {
        external: [],
        local: [],
        builtIn: [],
        dynamic: []
      }
    };

    // Categorize dependencies
    imports.forEach((imp: any) => {
      const path = imp.path;

      if (imp.kind === 'dynamic-import') {
        analysis.dependencies.dynamic.push(path);
      } else if (path.startsWith('.') || path.startsWith('/')) {
        analysis.dependencies.local.push(path);
      } else if (['fs', 'path', 'child_process', 'os', 'crypto', 'util', 'events'].includes(path)) {
        analysis.dependencies.builtIn.push(path);
      } else {
        analysis.dependencies.external.push(path);
      }
    });

    return analysis;
  }

  // Transform test file based on import types
  transformTest(filePath: string, options: {
    target?: 'node' | 'browser' | 'bun';
    mockExternals?: boolean;
    optimizeDynamic?: boolean;
  } = {}): string {
    const code = readFileSync(filePath, 'utf-8');
    const analysis = this.analyzeImports(filePath);

    let transformedCode = code;

    // Remove shebang
    if (transformedCode.startsWith('#!')) {
      transformedCode = transformedCode.replace(/^#![^\n]*\n/, '');
    }

    // Apply transformations based on target
    switch (options.target) {
      case 'browser':
        // Mock Node.js built-ins for browser
        analysis.dependencies.builtIn.forEach(module => {
          if (module === 'fs') {
            transformedCode = transformedCode.replace(
              new RegExp(`require\\(['"]${module}['"]\\)`, 'g'),
              'mockFs()'
            );
          }
        });
        break;

      case 'node':
        // Convert dynamic imports to require for better static analysis
        if (options.optimizeDynamic) {
          analysis.dependencies.dynamic.forEach(path => {
            if (!path.includes('..') && !path.includes('/')) {
              transformedCode = transformedCode.replace(
                new RegExp(`await import\\(['"]${path}['"]\\)`, 'g'),
                `require('${path}')`
              );
            }
          });
        }
        break;

      case 'bun':
        // Bun handles all import types natively - no transformation needed
        break;
    }

    // Mock external dependencies if requested
    if (options.mockExternals) {
      analysis.dependencies.external.forEach(dep => {
        transformedCode = transformedCode.replace(
          new RegExp(`(import|require)\\(['"]${dep}['"]\\)`, 'g'),
          `$1.mock('${dep}')`
        );
      });
    }

    // Add import analysis as comments
    const header = `
// Test Import Analysis
// External: ${analysis.dependencies.external.join(', ')}
// Local: ${analysis.dependencies.local.join(', ')}
// Built-in: ${analysis.dependencies.builtIn.join(', ')}
// Dynamic: ${analysis.dependencies.dynamic.join(', ')}

`;

    return header + transformedCode;
  }

  // Generate test dependency graph
  generateDependencyGraph(testFiles: string[]): {
    graph: Record<string, string[]>;
    circular: string[][];
    levels: Record<string, number>;
  } {
    const graph: Record<string, string[]> = {};
    const allFiles = new Set<string>();

    // Build initial graph
    testFiles.forEach(file => {
      const analysis = this.analyzeImports(file);
      graph[file] = analysis.dependencies.local;
      allFiles.add(file);
      analysis.dependencies.local.forEach(dep => allFiles.add(dep));
    });

    // Detect circular dependencies
    const circular: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (file: string, path: string[]): void => {
      if (recursionStack.has(file)) {
        const cycleStart = path.indexOf(file);
        circular.push([...path.slice(cycleStart), file]);
        return;
      }

      if (visited.has(file)) return;

      visited.add(file);
      recursionStack.add(file);

      (graph[file] || []).forEach(dep => {
        detectCycle(dep, [...path, file]);
      });

      recursionStack.delete(file);
    };

    Array.from(allFiles).forEach(file => {
      if (!visited.has(file)) {
        detectCycle(file, []);
      }
    });

    // Calculate dependency levels
    const levels: Record<string, number> = {};
    const calculateLevel = (file: string): number => {
      if (levels[file] !== undefined) return levels[file];

      const deps = graph[file] || [];
      if (deps.length === 0) {
        levels[file] = 0;
      } else {
        levels[file] = 1 + Math.max(...deps.map(dep => calculateLevel(dep)));
      }

      return levels[file];
    };

    Array.from(allFiles).forEach(file => {
      calculateLevel(file);
    });

    return { graph, circular, levels };
  }

  // Create test execution order based on dependencies
  getExecutionOrder(testFiles: string[]): string[] {
    const { levels } = this.generateDependencyGraph(testFiles);

    return testFiles
      .map(file => ({ file, level: levels[file] || 0 }))
      .sort((a, b) => a.level - b.level)
      .map(item => item.file);
  }
}

// Demo usage
if (import.meta.main) {
  const runner = new ImportAwareTestRunner();

  console.log('🔍 Import-Aware Test Runner Demo');
  console.log('=================================\n');

  // Analyze the existing test file
  const testFile = './my-wager-v3/cli/test.ts';
  console.log(`1️⃣ Analyzing imports in ${testFile}:`);
  const analysis = runner.analyzeImports(testFile);

  console.log(`   Total imports: ${analysis.imports.length}`);
  console.log(`   External dependencies: ${analysis.dependencies.external.join(', ')}`);
  console.log(`   Local modules: ${analysis.dependencies.local.join(', ')}`);
  console.log(`   Built-in modules: ${analysis.dependencies.builtIn.join(', ')}`);
  console.log(`   Dynamic imports: ${analysis.dependencies.dynamic.join(', ')}`);

  // Show import details
  console.log('\n2️⃣ Import details:');
  analysis.imports.forEach((imp, index) => {
    console.log(`   ${index + 1}. ${imp.kind.padEnd(16)} - ${imp.path}`);
  });

  // Transform for different targets
  console.log('\n3️⃣ Transformations:');

  console.log('\n   For Node.js (optimized):');
  const nodeTransformed = runner.transformTest(testFile, {
    target: 'node',
    optimizeDynamic: true
  });
  console.log(`   Size: ${(nodeTransformed.length / 1024).toFixed(1)} KB`);

  console.log('\n   For Browser (with mocks):');
  const browserTransformed = runner.transformTest(testFile, {
    target: 'browser',
    mockExternals: true
  });
  console.log(`   Size: ${(browserTransformed.length / 1024).toFixed(1)} KB`);

  // Generate dependency graph
  console.log('\n4️⃣ Dependency Graph:');
  const testFiles = [testFile];
  const { graph, circular, levels } = runner.generateDependencyGraph(testFiles);

  console.log(`   Circular dependencies: ${circular.length}`);
  console.log('   Dependency levels:');
  Object.entries(levels).forEach(([file, level]) => {
    console.log(`   ${file}: level ${level}`);
  });

  // Get execution order
  console.log('\n5️⃣ Recommended execution order:');
  const order = runner.getExecutionOrder(testFiles);
  order.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });

  // Save transformed test
  const transformedPath = testFile.replace('.ts', '.import-aware.ts');
  writeFileSync(transformedPath, nodeTransformed);
  console.log(`\n✅ Transformed test saved to: ${transformedPath}`);

  console.log('\n💡 Benefits of Import-Aware Test Runner:');
  console.log('   - Detects and handles different import types');
  console.log('   - Optimizes tests for target environments');
  console.log('   - Identifies circular dependencies');
  console.log('   - Creates optimal execution order');
  console.log('   - Enables selective mocking of dependencies');
}

export { ImportAwareTestRunner };
