#!/usr/bin/env bun
/**
 * 📦 Bun.Transpiler Import Kinds Deep Dive
 *
 * Demonstrates all 6 import kinds and how to handle them
 */

console.log('📦 Bun.Transpiler Import Kinds Deep Dive');
console.log('=====================================\n');

// Sample code with all import kinds
const allImportsCode = `
// 1. import-statement: ES6 imports
import React from 'react';
import { useState, useEffect } from 'react';
import type { User } from './types';
import * as utils from './utils';

// 2. require-call: CommonJS require
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

// 3. require-resolve: Path resolution only
const modulePath = require.resolve('./module');
const configPath = require.resolve('../config/app.json');

// 4. dynamic-import: Dynamic ES imports
const lazyComponent = await import('./LazyComponent');
const adminModule = await import(\`./admin/\${role}.js\`);
const themeModule = await import(\`./themes/\${process.env.THEME}.css\`);

// 5. import-rule: CSS @import (simulated in JS)
// @import 'bootstrap/dist/css/bootstrap.min.css';
// @import './styles/main.css';
// @import url('https://fonts.googleapis.com/css2?family=Inter');

// 6. url-token: CSS url references (simulated in JS)
// background: url('./images/background.jpg');
// background-image: url('../assets/logo.svg');
// cursor: url('./cursors/pointer.cur'), auto;
`;

// Create transpiler
const transpiler = new Bun.Transpiler({ loader: 'ts' });

// Scan all imports
const imports = transpiler.scanImports(allImportsCode);

console.log('1️⃣ Detected Import Kinds:');
console.log('------------------------');

// Group imports by kind
const grouped = imports.reduce((acc, imp) => {
  acc[imp.kind] = acc[imp.kind] || [];
  acc[imp.kind].push(imp);
  return acc;
}, {} as Record<string, any[]>);

// Display each kind
Object.entries(grouped).forEach(([kind, items]) => {
  console.log(`\n${kind}:`);
  items.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.path}`);
  });
});

// ===== 2. Import Kind Handlers =====
console.log('\n2️⃣ Import Kind Handlers:');
console.log('------------------------');

class ImportKindHandler {
  // Handle ES6 imports
  static handleImportStatement(imp: any) {
    return {
      type: 'ES6 Import',
      handling: 'Direct import supported',
      bundling: 'Tree-shakable',
      example: `import ${imp.path.includes('*') ? '* as name' : 'name'} from '${imp.path}';`
    };
  }

  // Handle CommonJS requires
  static handleRequireCall(imp: any) {
    return {
      type: 'CommonJS Require',
      handling: 'Transform to ES6 or keep as-is',
      bundling: 'Not tree-shakable',
      example: `const name = require('${imp.path}');`
    };
  }

  // Handle require.resolve
  static handleRequireResolve(imp: any) {
    return {
      type: 'Path Resolution',
      handling: 'Convert to import.meta.resolve or keep',
      bundling: 'No runtime code',
      example: `const path = require.resolve('${imp.path}');`
    };
  }

  // Handle dynamic imports
  static handleDynamicImport(imp: any) {
    return {
      type: 'Dynamic Import',
      handling: 'Code splitting friendly',
      bundling: 'Creates separate chunks',
      example: `const module = await import('${imp.path}');`
    };
  }

  // Handle CSS imports
  static handleImportRule(imp: any) {
    return {
      type: 'CSS Import',
      handling: 'Process with CSS loader',
      bundling: 'Injected into DOM or bundled',
      example: `@import '${imp.path}';`
    };
  }

  // Handle URL tokens
  static handleUrlToken(imp: any) {
    return {
      type: 'Asset URL',
      handling: 'Copy to output and hash filename',
      bundling: 'Asset optimization',
      example: `url('${imp.path}')`
    };
  }
}

// Show handler for each kind
console.log('\nHandler Strategies:');
Object.entries(grouped).forEach(([kind, items]) => {
  const handler = `handle${kind.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`;
  const strategy = (ImportKindHandler as any)[handler](items[0]);
  console.log(`\n${kind}:`);
  console.log(`  Type: ${strategy.type}`);
  console.log(`  Handling: ${strategy.handling}`);
  console.log(`  Bundling: ${strategy.bundling}`);
  console.log(`  Example: ${strategy.example}`);
});

// ===== 3. Transformation Examples =====
console.log('\n3️⃣ Transformation Examples:');
console.log('---------------------------');

// Example 1: CommonJS to ES6
const commonJSToES6 = `
const fs = require('fs');
const { readFile } = require('fs');
const config = require('./config.json');
`;

const es6Transpiler = new Bun.Transpiler({
  loader: 'ts',
  target: 'node' as any
});

const transformed = es6Transpiler.transformSync(commonJSToES6);
console.log('\nCommonJS → ES6:');
console.log('Original:', commonJSToES6.trim());
console.log('Transformed:', transformed);

// Example 2: Dynamic import optimization
const dynamicCode = `
const modules = ['admin', 'user', 'guest'];
const loaded = {};
for (const mod of modules) {
  loaded[mod] = await import(\`./\${mod}.js\`);
}
`;

const dynamicTranspiler = new Bun.Transpiler({
  loader: 'ts',
  target: 'browser'
});

const dynamicTransformed = dynamicTranspiler.transformSync(dynamicCode);
console.log('\nDynamic Import (Browser):');
console.log('Original:', dynamicCode.trim());
console.log('Transformed:', dynamicTransformed);

// ===== 4. Dependency Graph Builder =====
console.log('\n4️⃣ Dependency Graph Builder:');
console.log('-----------------------------');

class DependencyGraph {
  private graph: Map<string, Set<string>> = new Map();
  private reverseGraph: Map<string, Set<string>> = new Map();

  addDependency(from: string, to: string) {
    if (!this.graph.has(from)) {
      this.graph.set(from, new Set());
    }
    this.graph.get(from)!.add(to);

    if (!this.reverseGraph.has(to)) {
      this.reverseGraph.set(to, new Set());
    }
    this.reverseGraph.get(to)!.add(from);
  }

  getDependencies(file: string): string[] {
    return Array.from(this.graph.get(file) || []);
  }

  getDependents(file: string): string[] {
    return Array.from(this.reverseGraph.get(file) || []);
  }

  detectCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): boolean => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const dep of this.graph.get(node) || []) {
        if (dfs(dep, [...path])) {
          return true;
        }
      }

      recursionStack.delete(node);
      path.pop();
      return false;
    };

    for (const node of this.graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }
}

// Build dependency graph from imports
const depGraph = new DependencyGraph();
const currentFile = 'src/index.ts';

// Simulate adding dependencies
grouped['import-statement']?.forEach((imp: any) => {
  depGraph.addDependency(currentFile, imp.path);
});

grouped['require-call']?.forEach((imp: any) => {
  depGraph.addDependency(currentFile, imp.path);
});

grouped['dynamic-import']?.forEach((imp: any) => {
  depGraph.addDependency(currentFile, imp.path);
});

console.log('\nDependencies for src/index.ts:');
console.log('Direct:', depGraph.getDependencies(currentFile));

// ===== 5. Best Practices =====
console.log('\n5️⃣ Best Practices:');
console.log('------------------');

const bestPractices = [
  {
    kind: 'import-statement',
    practice: 'Use for static dependencies',
    reason: 'Enables tree-shaking and better optimization'
  },
  {
    kind: 'require-call',
    practice: 'Avoid in new code',
    reason: 'ES6 imports provide better tooling and tree-shaking'
  },
  {
    kind: 'require-resolve',
    practice: 'Use for runtime path resolution',
    reason: 'Converts to absolute paths at runtime'
  },
  {
    kind: 'dynamic-import',
    practice: 'Use for code splitting',
    reason: 'Creates separate bundles and reduces initial load'
  },
  {
    kind: 'import-rule',
    practice: 'Use for CSS dependencies',
    reason: 'Properly handled by CSS loaders'
  },
  {
    kind: 'url-token',
    practice: 'Use for asset references',
    reason: 'Assets are processed and hashed'
  }
];

bestPractices.forEach(({ kind, practice, reason }) => {
  console.log(`\n${kind}:`);
  console.log(`  Practice: ${practice}`);
  console.log(`  Reason: ${reason}`);
});

console.log('\n🎉 Import kinds deep dive complete!');
console.log('\nKey insights:');
console.log('• Each import kind has specific handling requirements');
console.log('• ES6 imports are preferred for better optimization');
console.log('• Dynamic imports enable code splitting');
console.log('• Understanding import kinds helps with bundling strategies');
