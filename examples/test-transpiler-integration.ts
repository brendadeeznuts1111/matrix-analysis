#!/usr/bin/env bun
/**
 * 🔧 Direct Integration of Bun.Transpiler with Test Runner
 *
 * This shows how to integrate transpiler capabilities directly into your test.ts workflow
 */

import { readFileSync, writeFileSync } from 'fs';

// Enhanced test runner with integrated transpiler
class TranspiledTestRunner {
  private transpiler: any;

  constructor(options: {
    environment?: 'development' | 'production' | 'test';
    optimize?: boolean;
    target?: 'browser' | 'bun' | 'node';
  } = {}) {
    // Create transpiler with test-specific configuration
    this.transpiler = new (globalThis as any).Bun.Transpiler({
      loader: 'ts',
      target: options.target || 'bun',
      define: {
        'process.env.NODE_ENV': `"${options.environment || 'test'}"`,
        'process.env.TEST_MODE': '"true"',
        'globalThis.__TEST__': 'true',
        'globalThis.__TRANSPILED__': '"true"'
      },
      minifyWhitespace: options.optimize || false,
      trimUnusedImports: options.optimize || false,
      inline: true,
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    });
  }

  // Transform the test.ts file with transpiler
  transformTestFile(filePath: string): {
    originalCode: string;
    transpiledCode: string;
    imports: any[];
    exports: string[];
    stats: {
      originalSize: number;
      transpiledSize: number;
      compression: number;
      importsCount: number;
      exportsCount: number;
    };
  } {
    // Read the original test file
    let originalCode = readFileSync(filePath, 'utf-8');

    // Remove shebang if present
    if (originalCode.startsWith('#!')) {
      originalCode = originalCode.replace(/^#![^\n]*\n/, '');
    }

    // Scan imports and exports
    const scanResult = this.transpiler.scan(originalCode);
    const imports = this.transpiler.scanImports(originalCode);

    // Transform the code
    const transpiledCode = this.transpiler.transformSync(originalCode);

    // Calculate stats
    const stats = {
      originalSize: originalCode.length,
      transpiledSize: transpiledCode.length,
      compression: ((1 - transpiledCode.length / originalCode.length) * 100),
      importsCount: imports.length,
      exportsCount: scanResult.exports.length
    };

    return {
      originalCode,
      transpiledCode,
      imports,
      exports: scanResult.exports,
      stats
    };
  }

  // Create a test bundle with all dependencies
  createTestBundle(testFile: string, outputPath: string): void {
    const result = this.transformTestFile(testFile);

    // Create bundle with metadata
    const bundle = `// Auto-generated test bundle with Bun.Transpiler
// Generated at: ${new Date().toISOString()}
// Environment: ${process.env.NODE_ENV || 'test'}

// Bundle metadata
const bundleMeta = {
  originalSize: ${result.stats.originalSize},
  transpiledSize: ${result.stats.transpiledSize},
  compression: ${result.stats.compression.toFixed(2)} + '%',
  imports: ${JSON.stringify(result.imports, null, 2)},
  exports: ${JSON.stringify(result.exports, null, 2)}
};

console.log('📊 Bundle Metadata:', bundleMeta);

// Transpiled test code
${result.transpiledCode}

// Export metadata for inspection
export { bundleMeta };
`;

    writeFileSync(outputPath, bundle);
    console.log(`✅ Test bundle created: ${outputPath}`);
    console.log(`   Compression: ${result.stats.compression.toFixed(1)}%`);
    console.log(`   Imports: ${result.stats.importsCount}`);
    console.log(`   Exports: ${result.stats.exportsCount}`);
  }

  // Run the transpiled test
  async runTranspiledTest(testFile: string): Promise<any> {
    const result = this.transformTestFile(testFile);

    // Write transpiled code to a temporary file
    const tempFile = './temp-transpiled-test.js';
    writeFileSync(tempFile, result.transpiledCode);

    try {
      // Import and run the transpiled test
      const module = await import(`./${tempFile}`);

      // If the module has a main function, run it
      if (module.testCommand && typeof module.testCommand === 'function') {
        console.log('🚀 Running transpiled test...');
        return await module.testCommand(process.argv.slice(2));
      }

      return module;
    } finally {
      // Clean up temp file
      try {
        await import('fs').then(fs => fs.promises.unlink(tempFile));
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// Demo: Integration with your test.ts
if (import.meta.main) {
  console.log('🔧 Integrating Bun.Transpiler with Test Runner');
  console.log('==========================================\n');

  // Create transpiler-aware test runner
  const testRunner = new TranspiledTestRunner({
    environment: 'test',
    optimize: false, // Set to true for production
    target: 'bun'
  });

  // Transform your test.ts file
  const testFile = './my-wager-v3/cli/test.ts';
  console.log(`1️⃣ Transforming ${testFile}:`);

  const result = testRunner.transformTestFile(testFile);

  console.log(`   Original size: ${(result.stats.originalSize / 1024).toFixed(1)} KB`);
  console.log(`   Transpiled size: ${(result.stats.transpiledSize / 1024).toFixed(1)} KB`);
  console.log(`   Compression: ${result.stats.compression.toFixed(1)}%`);

  console.log('\n2️⃣ Import Analysis:');
  result.imports.forEach((imp, index) => {
    console.log(`   ${index + 1}. ${imp.kind.padEnd(18)} - ${imp.path}`);
  });

  console.log('\n3️⃣ Export Analysis:');
  result.exports.forEach((exp, index) => {
    console.log(`   ${index + 1}. ${exp}`);
  });

  // Create optimized bundle
  console.log('\n4️⃣ Creating optimized test bundle:');
  testRunner.createTestBundle(testFile, './test-transpiled-bundle.js');

  // Show transformation preview
  console.log('\n5️⃣ Transformation Preview:');
  console.log('Original (first 500 chars):');
  console.log(result.originalCode.substring(0, 500) + '...');

  console.log('\nTranspiled (first 500 chars):');
  console.log(result.transpiledCode.substring(0, 500) + '...');

  // Performance comparison
  console.log('\n6️⃣ Performance Modes:');

  // Development mode
  const devRunner = new TranspiledTestRunner({ environment: 'development', optimize: false });
  const devResult = devRunner.transformTestFile(testFile);

  // Production mode
  const prodRunner = new TranspiledTestRunner({ environment: 'production', optimize: true });
  const prodResult = prodRunner.transformTestFile(testFile);

  console.log('Mode         | Size (KB) | Compression');
  console.log('-------------|-----------|------------');
  console.log(`Original     | ${(result.stats.originalSize / 1024).toFixed(1).padEnd(9)} | -`);
  console.log(`Development  | ${(devResult.stats.transpiledSize / 1024).toFixed(1).padEnd(9)} | ${devResult.stats.compression.toFixed(1)}%`);
  console.log(`Production   | ${(prodResult.stats.transpiledSize / 1024).toFixed(1).padEnd(9)} | ${prodResult.stats.compression.toFixed(1)}%`);

  console.log('\n✅ Integration complete!');
  console.log('\n💡 To use in your test workflow:');
  console.log('   1. Replace direct test execution with runTranspiledTest()');
  console.log('   2. Use createTestBundle() for CI/CD pipelines');
  console.log('   3. Enable optimization in production for faster tests');
  console.log('   4. Import analysis helps identify test dependencies');
}

export { TranspiledTestRunner };
