#!/usr/bin/env bun
/**
 * 🔧 Enhanced Test Runner with Transpiler Integration
 *
 * This demonstrates how to integrate Bun.Transpiler with the existing test runner
 * for dynamic test transformation and optimization.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

// Import the TestTranspiler class definition
// We'll recreate it here to avoid circular dependencies
class TestTranspiler {
  private transpiler: any;

  constructor(options: {
    environment?: 'development' | 'production' | 'test';
    minify?: boolean;
    target?: 'browser' | 'bun' | 'node';
  } = {}) {
    this.transpiler = new (globalThis as any).Bun.Transpiler({
      loader: 'ts',
      target: options.target || 'bun',
      define: {
        'process.env.NODE_ENV': `"${options.environment || 'test'}"`,
        'process.env.TEST_MODE': '"true"',
        'globalThis.__TEST__': 'true'
      },
      inline: true,
      minifyWhitespace: options.minify || false,
      trimUnusedImports: true,
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    });
  }

  // Transform a test file
  transformTest(filePath: string): string {
    let code = readFileSync(filePath, 'utf-8');
    // Remove shebang if present
    if (code.startsWith('#!')) {
      code = code.replace(/^#![^\n]*\n/, '');
    }
    return this.transpiler.transformSync(code);
  }

  // Scan test file for dependencies
  scanTestDependencies(filePath: string): {
    imports: Array<{ path: string; kind: string }>;
    exports: string[];
  } {
    let code = readFileSync(filePath, 'utf-8');
    // Remove shebang if present
    if (code.startsWith('#!')) {
      code = code.replace(/^#![^\n]*\n/, '');
    }
    const scan = this.transpiler.scan(code);
    const imports = this.transpiler.scanImports(code);

    return {
      imports: imports.map((imp: any) => ({ path: imp.path, kind: imp.kind })),
      exports: scan.exports
    };
  }

  // Transform multiple test files with dependency resolution
  transformTestSuite(filePaths: string[]): {
    transformed: Map<string, string>;
    dependencies: Map<string, string[]>;
    errors: string[];
  } {
    const transformed = new Map<string, string>();
    const dependencies = new Map<string, string[]>();
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        // Transform the file
        const transformedCode = this.transformTest(filePath);
        transformed.set(filePath, transformedCode);

        // Get dependencies
        const deps = this.scanTestDependencies(filePath);
        dependencies.set(filePath, deps.imports.map(imp => imp.path));
      } catch (error: any) {
        errors.push(`Failed to transform ${filePath}: ${error.message}`);
      }
    }

    return { transformed, dependencies, errors };
  }

  // Create a bundled test file
  bundleTests(filePaths: string[], outputPath: string): void {
    const { transformed, dependencies, errors } = this.transformTestSuite(filePaths);

    if (errors.length > 0) {
      console.error('Transformation errors:');
      errors.forEach(err => console.error(`  - ${err}`));
      return;
    }

    // Create bundle header
    let bundle = `
// Auto-generated test bundle
// Generated at: ${new Date().toISOString()}
// Environment: ${process.env.NODE_ENV || 'test'}

`;

    // Add transformed files
    for (const [filePath, code] of transformed) {
      bundle += `\n// File: ${filePath}\n`;
      bundle += code;
      bundle += '\n';
    }

    // Write bundle
    writeFileSync(outputPath, bundle);
    console.log(`✅ Test bundle created: ${outputPath}`);
    console.log(`   Files included: ${filePaths.length}`);
    console.log(`   Bundle size: ${bundle.length} bytes`);
  }
}

// Enhanced test configuration with transpiler options
interface TestConfigWithTranspiler {
  // Existing test config properties
  context?: string;
  filter?: string;
  updateSnapshots?: boolean;

  // Transpiler-specific options
  transpiler?: {
    environment?: 'development' | 'production' | 'test';
    minify?: boolean;
    target?: 'browser' | 'bun' | 'node';
    inlineDefines?: Record<string, string>;
    optimizeForCoverage?: boolean;
  };

  // Runtime transformation options
  runtime?: {
    transformOnTheFly?: boolean;
    cacheTransformed?: boolean;
    bundleTests?: boolean;
  };
}

// Example: Transform test files before running them
export async function runTestsWithTranspiler(
  testFiles: string[],
  config: TestConfigWithTranspiler = {}
) {
  console.log('🚀 Running tests with transpiler integration...');

  // Create transpiler with configuration
  const transpiler = new TestTranspiler({
    environment: config.transpiler?.environment || 'test',
    minify: config.transpiler?.minify || false,
    target: config.transpiler?.target || 'bun'
  });

  // Add custom defines if provided
  if (config.transpiler?.inlineDefines) {
    // Note: In a real implementation, you'd recreate the transpiler with these defines
    console.log('📝 Custom defines:', config.transpiler.inlineDefines);
  }

  const results = {
    transformed: 0,
    cached: 0,
    errors: 0,
    totalFiles: testFiles.length
  };

  // Process each test file
  for (const testFile of testFiles) {
    try {
      if (config.runtime?.transformOnTheFly) {
        // Transform in memory
        const transformedCode = transpiler.transformTest(testFile);

        // Create a temporary module from the transformed code
        const module = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformedCode)}`);

        // Run the test (simplified example)
        if (module.runTest) {
          await module.runTest();
        }

        results.transformed++;
      } else {
        // Transform to disk and run
        const outputPath = testFile.replace('.ts', '.transpiled.js');
        const transformedCode = transpiler.transformTest(testFile);
        writeFileSync(outputPath, transformedCode);

        // Run the transformed test
        const { exec } = await import('child_process');
        await new Promise((resolve, reject) => {
          exec(`bun run ${outputPath}`, (error: any, stdout: any, stderr: any) => {
            if (error) {
              results.errors++;
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });

        results.transformed++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${testFile}:`, error.message);
      results.errors++;
    }
  }

  // Print summary
  console.log('\n📊 Test Execution Summary:');
  console.log(`   Total files: ${results.totalFiles}`);
  console.log(`   Transformed: ${results.transformed}`);
  console.log(`   Cached: ${results.cached}`);
  console.log(`   Errors: ${results.errors}`);

  return results;
}

// Example: Create optimized test bundle for CI
export function createOptimizedTestBundle(
  testFiles: string[],
  outputPath: string = './dist/test-bundle.js'
) {
  console.log('📦 Creating optimized test bundle for CI...');

  const transpiler = new TestTranspiler({
    environment: 'production',
    minify: true,
    target: 'node'
  });

  // Analyze dependencies first
  const allDependencies = new Set<string>();
  const fileDependencies = new Map<string, string[]>();

  for (const testFile of testFiles) {
    const deps = transpiler.scanTestDependencies(testFile);
    const importPaths = deps.imports.map(imp => imp.path);
    fileDependencies.set(testFile, importPaths);
    importPaths.forEach(dep => allDependencies.add(dep));
  }

  console.log(`🔍 Found ${allDependencies.size} unique dependencies`);

  // Create bundle with dependency ordering
  const bundle = transpiler.transformTestSuite(testFiles);

  if (bundle.errors.length === 0) {
    // Add bundle metadata
    const metadata = `
// Test Bundle Metadata
// Generated: ${new Date().toISOString()}
// Files: ${testFiles.length}
// Dependencies: ${allDependencies.size}
// Environment: production
// Minified: true

`;

    const finalBundle = metadata + Array.from(bundle.transformed.values()).join('\n');
    writeFileSync(outputPath, finalBundle);

    console.log(`✅ Bundle created: ${outputPath}`);
    console.log(`   Size: ${(finalBundle.length / 1024).toFixed(1)} KB`);
    console.log(`   Compression: ${((1 - finalBundle.length / testFiles.reduce((sum, f) => sum + readFileSync(f).length, 0)) * 100).toFixed(1)}%`);
  } else {
    console.error('❌ Bundle creation failed:');
    bundle.errors.forEach(err => console.error(`   - ${err}`));
  }
}

// Example usage
if (import.meta.main) {
  // Demo with the existing test.ts file
  const testFiles = ['./my-wager-v3/cli/test.ts'];

  console.log('🧪 Running transpiler demo with existing test file...\n');

  // 1. Scan dependencies
  console.log('1️⃣ Scanning test dependencies:');
  const transpiler = new TestTranspiler();
  const deps = transpiler.scanTestDependencies(testFiles[0]);
  console.log(`   Imports: ${deps.imports.length}`);
  console.log(`   Exports: ${deps.exports.length}`);
  console.log(`   Main exports: ${deps.exports.slice(0, 3).join(', ')}...\n`);

  // 2. Transform with different configurations
  console.log('2️⃣ Transforming with different configurations:');

  // Development mode
  const devTranspiler = new TestTranspiler({ environment: 'development' });
  const devCode = devTranspiler.transformTest(testFiles[0]);
  console.log(`   Development bundle: ${(devCode.length / 1024).toFixed(1)} KB`);

  // Production mode (minified)
  const prodTranspiler = new TestTranspiler({
    environment: 'production',
    minify: true
  });
  const prodCode = prodTranspiler.transformTest(testFiles[0]);
  console.log(`   Production bundle: ${(prodCode.length / 1024).toFixed(1)} KB`);
  console.log(`   Compression ratio: ${((1 - prodCode.length / devCode.length) * 100).toFixed(1)}%\n`);

  // 3. Create optimized bundle
  console.log('3️⃣ Creating optimized test bundle:');
  createOptimizedTestBundle(testFiles, './demo-test-bundle.js');

  console.log('\n✨ Transpiler integration demo complete!');
  console.log('\n💡 To integrate with the actual test runner:');
  console.log('   1. Import TestTranspiler in your test runner');
  console.log('   2. Transform test files before execution');
  console.log('   3. Use defines for environment-specific configuration');
  console.log('   4. Enable minification for production/CI builds');
}
