#!/usr/bin/env bun
/**
 * 📦 Import Analysis & Transformation Demo
 * 
 * Demonstrates how to analyze and transform different import types using Bun.Transpiler
 */

import { write } from 'bun';

// Example code with mixed import types
const mixedImportCode = `
// ES6 imports
import React, { useState } from 'react';
import lodash from 'lodash';
import type { User } from './types';

// CommonJS require
const fs = require('fs');
const { exec } = require('child_process');

// Dynamic imports
const dynamicModule = await import('./dynamic-module');
const lazyLoad = async () => {
  const module = await import('./heavy-module');
  return module.default;
};

// Mixed usage
const config = require('./config.json');
const api = await import('./api');

// Conditional requires
if (process.env.NODE_ENV === 'development') {
  const devTools = require('react-devtools');
}

// Import assertions (Node 16+)
const data = await import('./data.json', { assert: { type: 'json' } });
`;

// Create transpiler and analyze imports
const transpiler = new Bun.Transpiler({ loader: 'ts' });

console.log('🔍 Import Analysis Demo');
console.log('======================\n');

// 1. Scan all imports
console.log('1️⃣ Scanning all imports:');
const scanResult = transpiler.scan(mixedImportCode);
const imports = transpiler.scanImports(mixedImportCode);

console.log(`Total imports found: ${imports.length}\n`);

// 2. Group imports by kind
const importsByKind = imports.reduce((acc, imp) => {
  if (!acc[imp.kind]) acc[imp.kind] = [];
  acc[imp.kind].push(imp);
  return acc;
}, {} as Record<string, typeof imports>);

console.log('2️⃣ Imports grouped by kind:');
Object.entries(importsByKind).forEach(([kind, items]) => {
  console.log(`\n${kind.toUpperCase()}:`);
  items.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.path}`);
  });
});

// 3. Transform based on import type
console.log('\n3️⃣ Transformations based on import type:');

// Transform ES6 imports to CommonJS
const es6ToCommonJS = mixedImportCode
  .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");')
  .replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g, 'const { $1 } = require("$2");');

console.log('\nES6 → CommonJS:');
console.log(es6ToCommonJS.substring(0, 500) + '...');

// Transform CommonJS to ES6
const commonJSToES6 = mixedImportCode
  .replace(/const\s+(\w+)\s+=\s+require\(['"]([^'"]+)['"]\);?/g, 'import $1 from "$2";')
  .replace(/const\s+\{([^}]+)\}\s+=\s+require\(['"]([^'"]+)['"]\);?/g, 'import { $1 } from "$2";');

console.log('\n\nCommonJS → ES6:');
console.log(commonJSToES6.substring(0, 500) + '...');

// 4. Create import map for bundling
console.log('\n\n4️⃣ Creating import map:');
const importMap = {
  imports: {} as Record<string, string>,
  dynamicImports: [] as string[],
  requires: [] as string[]
};

imports.forEach(imp => {
  switch (imp.kind) {
    case 'import-statement':
      importMap.imports[imp.path] = imp.path;
      break;
    case 'dynamic-import':
      importMap.dynamicImports.push(imp.path);
      break;
    case 'require-call':
      importMap.requires.push(imp.path);
      break;
  }
});

console.log(JSON.stringify(importMap, null, 2));

// 5. Dependency tree analysis
console.log('\n\n5️⃣ Dependency tree analysis:');
const dependencyTree = {
  external: [] as string[],
  local: [] as string[],
  builtIn: [] as string[],
  types: [] as string[]
};

imports.forEach(imp => {
  const path = imp.path;
  if (path.startsWith('.') || path.startsWith('/')) {
    if (path.includes('.json')) {
      dependencyTree.types.push(path);
    } else {
      dependencyTree.local.push(path);
    }
  } else if (['fs', 'path', 'child_process', 'os', 'crypto'].includes(path)) {
    dependencyTree.builtIn.push(path);
  } else if (imp.kind === 'import-statement' && mixedImportCode.includes(`type {`)) {
    dependencyTree.types.push(path);
  } else {
    dependencyTree.external.push(path);
  }
});

console.log('External dependencies:', dependencyTree.external);
console.log('Local modules:', dependencyTree.local);
console.log('Built-in modules:', dependencyTree.builtIn);
console.log('Type imports:', dependencyTree.types);

// 6. Optimize imports (remove unused)
console.log('\n\n6️⃣ Import optimization suggestions:');
const usedImports = new Set(['React', 'useState', 'fs']); // Simulated usage analysis
const optimizationSuggestions = [];

imports.forEach(imp => {
  if (imp.kind === 'import-statement') {
    const namedImports = mixedImportCode.match(/import\s*\{([^}]+)\}/)?.[1];
    if (namedImports) {
      const importsArray = namedImports.split(',').map(s => s.trim());
      const unused = importsArray.filter(imp => !usedImports.has(imp));
      if (unused.length > 0) {
        optimizationSuggestions.push(`Remove unused imports: ${unused.join(', ')} from ${imp.path}`);
      }
    }
  }
});

console.log(optimizationSuggestions);

// 7. Create a custom transformer
console.log('\n\n7️⃣ Custom transformer example:');
class ImportTransformer {
  private transpiler: any;
  
  constructor() {
    this.transpiler = new Bun.Transpiler({ loader: 'ts' });
  }
  
  // Transform imports based on target environment
  transformForTarget(code: string, target: 'browser' | 'node' | 'bun'): string {
    const imports = this.transpiler.scanImports(code);
    
    let transformedCode = code;
    
    imports.forEach(imp => {
      switch (target) {
        case 'browser':
          // Convert Node built-ins to browser equivalents
          if (imp.path === 'fs') {
            transformedCode = transformedCode.replace(
              /require\(['"]fs['"]\)/g,
              'await import("browser-fs")'
            );
          }
          break;
          
        case 'node':
          // Convert dynamic imports to require for static analysis
          if (imp.kind === 'dynamic-import') {
            transformedCode = transformedCode.replace(
              new RegExp(`await import\\(['"]${imp.path}['"]\\)`, 'g'),
              `require('${imp.path}')`
            );
          }
          break;
          
        case 'bun':
          // Bun can handle all import types natively
          // No transformation needed
          break;
      }
    });
    
    return transformedCode;
  }
  
  // Bundle optimization
  optimizeForBundle(code: string): string {
    const imports = this.transpiler.scanImports(code);
    const dynamicImports = imports.filter(imp => imp.kind === 'dynamic-import');
    
    // Convert dynamic imports to static where possible
    let optimized = code;
    dynamicImports.forEach(imp => {
      if (!imp.path.includes('..') && !imp.path.includes('/')) {
        // Simple module - can be made static
        optimized = optimized.replace(
          new RegExp(`await import\\(['"]${imp.path}['"]\\)`, 'g'),
          `require('${imp.path}')`
        );
      }
    });
    
    return optimized;
  }
}

const transformer = new ImportTransformer();

console.log('Browser transformation:');
const browserCode = transformer.transformForTarget(mixedImportCode, 'browser');
console.log(browserCode.substring(0, 300) + '...');

console.log('\nBundle optimization:');
const optimizedCode = transformer.optimizeForBundle(mixedImportCode);
console.log(`Original dynamic imports: ${imports.filter(i => i.kind === 'dynamic-import').length}`);
console.log(`Optimized dynamic imports: ${optimizedCode.match(/await import/g)?.length || 0}`);

// Save analysis results
await write('./import-analysis-results.json', JSON.stringify({
  totalImports: imports.length,
  importsByKind,
  dependencyTree,
  optimizationSuggestions,
  importMap
}, null, 2));

console.log('\n✅ Analysis complete! Results saved to ./import-analysis-results.json');
