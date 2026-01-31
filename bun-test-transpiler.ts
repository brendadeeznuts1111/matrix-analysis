#!/usr/bin/env bun
/**
 * 🛠️ Bun Transpiler Utility for Test Runner
 *
 * Integrates transpiler capabilities with the test runner for:
 * - Dynamic test file transformation
 * - Environment-specific test configuration
 * - Test code optimization
 */

import { Bun } from 'bun';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Create a transpiler for test files
export class TestTranspiler {
  private transpiler: Bun.Transpiler;

  constructor(options: {
    environment?: 'development' | 'production' | 'test';
    minify?: boolean;
    target?: 'browser' | 'bun' | 'node';
  } = {}) {
    this.transpiler = new Bun.Transpiler({
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
    const code = readFileSync(filePath, 'utf-8');
    return this.transpiler.transformSync(code);
  }

  // Scan test file for dependencies
  scanTestDependencies(filePath: string): {
    imports: Array<{ path: string; kind: string }>;
    exports: string[];
  } {
    const code = readFileSync(filePath, 'utf-8');
    const scan = this.transpiler.scan(code);
    const imports = this.transpiler.scanImports(code);

    return {
      imports: imports.map(imp => ({ path: imp.path, kind: imp.kind })),
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
      } catch (error) {
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

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  const transpiler = new TestTranspiler({
    environment: (process.env.NODE_ENV as any) || 'test',
    minify: args.includes('--minify'),
    target: 'bun'
  });

  switch (command) {
    case 'transform':
      if (args[1]) {
        console.log('🔄 Transforming test file...');
        const result = transpiler.transformTest(args[1]);
        console.log(result);
      } else {
        console.error('Please provide a file path');
      }
      break;

    case 'scan':
      if (args[1]) {
        console.log('🔍 Scanning test dependencies...');
        const deps = transpiler.scanTestDependencies(args[1]);
        console.log('Imports:', deps.imports);
        console.log('Exports:', deps.exports);
      } else {
        console.error('Please provide a file path');
      }
      break;

    case 'bundle':
      const files = args.slice(1).filter(arg => !arg.startsWith('--'));
      if (files.length > 0) {
        console.log('📦 Creating test bundle...');
        transpiler.bundleTests(files, './bundled-tests.js');
      } else {
        console.error('Please provide test files to bundle');
      }
      break;

    default:
      console.log(`
Bun Test Transpiler Utility

USAGE:
  bun run bun-test-transpiler.ts <command> [options] [files...]

COMMANDS:
  transform <file>     Transform a single test file
  scan <file>         Scan test file for dependencies
  bundle <files...>   Bundle multiple test files

OPTIONS:
  --minify            Minify output code
  --target <target>   Target platform (browser|bun|node)

EXAMPLES:
  bun run bun-test-transpiler.ts transform ./test/example.test.ts
  bun run bun-test-transpiler.ts scan ./test/example.test.ts
  bun run bun-test-transpiler.ts bundle ./test/*.test.ts --minify
`);
  }
}
