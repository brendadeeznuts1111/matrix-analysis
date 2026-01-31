#!/usr/bin/env bun
/**
 * 📚 Complete Bun.Transpiler API Reference Implementation
 *
 * This file demonstrates ALL features of Bun.Transpiler as documented in the official docs
 * Including: transform, transformSync, scan, scanImports, and all configuration options
 */

import { write } from 'bun';

console.log('📚 Bun.Transpiler Complete API Reference');
console.log('=======================================\n');

// ===== 1. Basic Transpiler Creation =====
console.log('1️⃣ Basic Transpiler Creation:');
console.log('-------------------------------');

const basicTranspiler = new Bun.Transpiler({
  loader: "tsx"
});
console.log('✅ Created transpiler with TSX loader\n');

// ===== 2. transformSync() Examples =====
console.log('2️⃣ transformSync() Examples:');
console.log('---------------------------');

const tsxCode = `
import * as whatever from "./whatever.ts"
export function Home(props: {title: string}){
  return <p>{props.title}</p>;
}
`;

const syncResult = basicTranspiler.transformSync(tsxCode);
console.log('Original TSX:');
console.log(tsxCode);
console.log('\nTranspiled JavaScript:');
console.log(syncResult.substring(0, 300) + '...\n');

// Override loader
const jsxOnly = basicTranspiler.transformSync("<div>hi!</div>", "jsx");
console.log('JSX only transpilation:');
console.log(jsxOnly + '\n');

// ===== 3. transform() Examples =====
console.log('3️⃣ transform() Examples (Async):');
console.log('--------------------------------');

const asyncTranspiler = new Bun.Transpiler({ loader: "jsx" });
const asyncResult = await asyncTranspiler.transform("<div>hi!</div>");
console.log('Async transform result:');
console.log(asyncResult + '\n');

// ===== 4. scan() Examples =====
console.log('4️⃣ scan() Examples:');
console.log('-------------------');

const scannerTranspiler = new Bun.Transpiler({ loader: "tsx" });

const codeToScan = `
import React from 'react';
import type {ReactNode} from 'react';
const val = require('./cjs.js')
import('./loader');

export const name = "hello";
export type ComponentProps = { children: ReactNode };
`;

const scanResult = scannerTranspiler.scan(codeToScan);
console.log('Code to scan:');
console.log(codeToScan);
console.log('\nScan result:');
console.log(JSON.stringify(scanResult, null, 2));
console.log(`Exports found: ${scanResult.exports.join(', ')}`);
console.log(`Imports found: ${scanResult.imports.length}\n`);

// ===== 5. scanImports() Examples =====
console.log('5️⃣ scanImports() Examples (Performance-optimized):');
console.log('----------------------------------------------------');

const importsOnly = scannerTranspiler.scanImports(codeToScan);
console.log('Imports only (faster for large files):');
console.log(JSON.stringify(importsOnly, null, 2) + '\n');

// ===== 6. All TranspilerOptions =====
console.log('6️⃣ Complete TranspilerOptions Demo:');
console.log('-----------------------------------');

const advancedTranspiler = new Bun.Transpiler({
  // Loader options
  loader: "tsx",

  // Platform targeting
  target: "browser", // "browser" | "bun" | "node"

  // Custom defines (like webpack DefinePlugin)
  define: {
    "process.env.NODE_ENV": "\"production\"",
    "process.env.VERSION": "\"1.0.0\"",
    "__DEV__": "false",
    "__DEBUG__": "false"
  },

  // Custom tsconfig
  tsconfig: {
    jsxFactory: "h" as any,
    jsxFragmentFactory: "Fragment",
    jsxImportSource: "preact",
    useDefineForClassFields: true,
    target: "ES2020",
    module: "ESNext"
  },

  // Macro support
  macro: {
    "react-relay": {
      "graphql": "./macros/relay-macro.ts"
    },
    "styled-components": {
      "styled": "./macros/styled-macro.ts"
    }
  },

  // Export manipulation
  exports: {
    eliminate: ["internalHelper", "debugInfo"],
    replace: {
      "oldExport": "newExport"
    }
  },

  // Optimization flags
  trimUnusedImports: true,
  jsxOptimizationInline: true,
  minifyWhitespace: false,
  inline: true
});

console.log('✅ Created advanced transpiler with all options\n');

// ===== 7. Import Kinds Demonstration =====
console.log('7️⃣ All Import Kinds:');
console.log('------------------');

const allImportKindsCode = `
// ES6 imports
import React from 'react';
import { useState } from 'react';
import type { User } from './types';

// CommonJS requires
const fs = require('fs');
const { exec } = require('child_process');
const path = require.resolve('./module');

// Dynamic imports
const lazyModule = await import('./lazy-module');

// CSS imports (if supported)
// @import 'styles.css';
// background: url('./image.png');

// Internal imports (injected by Bun)
// import.meta.url
`;

const kindsTranspiler = new Bun.Transpiler({ loader: "ts" });
const allKinds = kindsTranspiler.scanImports(allImportKindsCode);

console.log('Demonstrating all import kinds:');
allKinds.forEach((imp, index) => {
  console.log(`${index + 1}. ${imp.kind.padEnd(18)} - ${imp.path}`);
});

console.log('\nImport kind reference:');
console.log('- import-statement: ES6 import statements');
console.log('- require-call:     CommonJS require() calls');
console.log('- require-resolve:  require.resolve() calls');
console.log('- dynamic-import:   Dynamic import() expressions');
console.log('- import-rule:      CSS @import rules');
console.log('- url-token:        CSS url() references');
console.log('- internal:         Bun-injected imports');
console.log('- entry-point-*:    Bundle entry points\n');

// ===== 8. Real-world Examples =====
console.log('8️⃣ Real-world Transformation Examples:');
console.log('------------------------------------');

// Example: React with custom environment
const reactCode = `
import React, { useState, useEffect } from 'react';
import api from './api';
import './styles.css';

export function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode');
    }

    api.fetchData().then(setData);
  }, []);

  return <div>Hello {process.env.APP_NAME}</div>;
}
`;

const reactTranspiler = new Bun.Transpiler({
  loader: "tsx",
  target: "browser",
  define: {
    "process.env.NODE_ENV": "\"production\"",
    "process.env.APP_NAME": "\"My App\""
  },
  minifyWhitespace: true,
  trimUnusedImports: true
});

const reactResult = reactTranspiler.transformSync(reactCode);
console.log('React component transformation:');
console.log('Original size:', reactCode.length, 'bytes');
console.log('Transformed size:', reactResult.length, 'bytes');
console.log('Compression:', ((1 - reactResult.length / reactCode.length) * 100).toFixed(1) + '%\n');

// Example: Node.js with CommonJS
const nodeCode = `
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import config from './config.json';

export async function processFile(filename: string) {
  const filePath = join(__dirname, filename);
  const data = await readFile(filePath, 'utf-8');

  if (process.env.DEBUG) {
    console.log('Processing:', filePath);
  }

  return data.toUpperCase();
}
`;

const nodeTranspiler = new Bun.Transpiler({
  loader: "ts",
  target: "node",
  define: {
    "process.env.DEBUG": "true"
  },
  inline: true
});

const nodeResult = nodeTranspiler.transformSync(nodeCode);
console.log('Node.js module transformation:');
console.log(nodeResult.substring(0, 400) + '...\n');

// ===== 9. Performance Comparison =====
console.log('9️⃣ Performance Comparison:');
console.log('--------------------------');

const largeCode = `
${Array.from({ length: 100 }, (_, i) => `
import module${i} from './module${i}';
import type { Type${i} } from './types${i}';
const require${i} = require('./require${i}');
`).join('\n')}

export function heavyFunction() {
  console.log('This is a heavy function with many imports');
  ${Array.from({ length: 100 }, (_, i) => `module${i}.default;`).join('\n')}
}
`;

// Performance test
const perfStart = performance.now();
const perfImports = scannerTranspiler.scanImports(largeCode);
const perfEnd = performance.now();

console.log(`Scanned ${perfImports.length} imports in ${(perfEnd - perfStart).toFixed(2)}ms`);
console.log(`Average time per import: ${((perfEnd - perfStart) / perfImports.length * 1000).toFixed(2)}μs\n`);

// ===== 10. Error Handling =====
console.log('🔟 Error Handling:');
console.log('-----------------');

try {
  const errorTranspiler = new Bun.Transpiler({ loader: "ts" } as any);
  const invalidCode = `
import { broken syntax
export function test() {
  return this is broken
`;

  // This will throw an error
  errorTranspiler.transformSync(invalidCode);
} catch (error: any) {
  console.log('Caught transpilation error:');
  console.log(error.message);
  console.log('✅ Error handling works correctly\n');
}

// ===== 11. Save Results =====
console.log('1️⃣1️⃣ Saving Reference Results:');
console.log('---------------------------');

const referenceData = {
  basicTransform: syncResult,
  scanResult: scanResult,
  importKinds: allKinds,
  performance: {
    importsScanned: perfImports.length,
    timeMs: perfEnd - perfStart
  },
  examples: {
    react: reactResult,
    node: nodeResult
  }
};

await write('./transpiler-reference-results.json', JSON.stringify(referenceData, null, 2));
console.log('✅ All results saved to ./transpiler-reference-results.json');

console.log('\n🎉 Complete Bun.Transpiler API Reference Finished!');
console.log('This demonstration covered ALL features from the official documentation.');
