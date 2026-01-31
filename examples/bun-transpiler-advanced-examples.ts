#!/usr/bin/env bun
/**
 * 🎯 Advanced Bun.Transpiler Real-World Examples
 * 
 * Demonstrates practical applications of all transpiler features
 * in scenarios you'll actually encounter in development
 */

import { write } from 'bun';

console.log('🎯 Advanced Bun.Transpiler Real-World Examples');
console.log('============================================\n');

// ===== Example 1: Framework Migration =====
console.log('1️⃣ Framework Migration (React → Preact):');
console.log('----------------------------------------');

const reactCode = `
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  return (
    <div className="app">
      <h1>Hello React</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;
`;

// Create transpiler for Preact
const preactTranspiler = new Bun.Transpiler({
  loader: 'tsx',
  tsconfig: {
    jsxFactory: 'h' as any,
    jsxFragmentFactory: 'Fragment',
    jsxImportSource: 'preact'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  trimUnusedImports: true,
  minifyWhitespace: true
});

const preactResult = preactTranspiler.transformSync(reactCode);
console.log('✅ Migrated React to Preact');
console.log('Original imports: React, ReactDOM, useState, useEffect');
console.log('Transformed size:', preactResult.length, 'bytes\n');

// ===== Example 2: Environment-Specific Builds =====
console.log('2️⃣ Environment-Specific Builds:');
console.log('--------------------------------');

const apiCode = `
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.example.com' 
  : 'http://localhost:3000';

const DEBUG = process.env.NODE_ENV !== 'production';

export async function fetchUser(id: string) {
  if (DEBUG) console.log('Fetching user:', id);
  
  const response = await fetch(\`\${API_URL}/users/\${id}\`);
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return response.json();
}

export const config = {
  apiUrl: API_URL,
  debug: DEBUG,
  version: process.env.VERSION || '1.0.0'
};
`;

// Development build
const devTranspiler = new Bun.Transpiler({
  loader: 'ts',
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.VERSION': '"2.0.0-dev"'
  }
});

// Production build
const prodTranspiler = new Bun.Transpiler({
  loader: 'ts',
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.VERSION': '"2.0.0"'
  },
  minifyWhitespace: true,
  inline: true
});

const devResult = devTranspiler.transformSync(apiCode);
const prodResult = prodTranspiler.transformSync(apiCode);

console.log('Development build size:', devResult.length, 'bytes');
console.log('Production build size:', prodResult.length, 'bytes');
console.log('Compression:', ((1 - prodResult.length / devResult.length) * 100).toFixed(1) + '%\n');

// ===== Example 3: Macro System =====
console.log('3️⃣ Custom Macro System:');
console.log('------------------------');

const macroCode = `
import { gql } from 'graphql-tag';
import styled from 'styled-components';
import { css } from 'styled-components';

// GraphQL query macro
const GET_USER = gql\`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
\`;

// Styled component macro
const Button = styled.button\`
  background: \${props => props.primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px;
  \${props => props.large && css\`
    font-size: 1.2em;
    padding: 15px;
  \`}
\`;

export { GET_USER, Button };
`;

// Simulate macro transformation
const macroTranspiler = new Bun.Transpiler({
  loader: 'tsx',
  macro: {
    'graphql-tag': {
      'gql': './macros/graphql-macro.ts'
    },
    'styled-components': {
      'styled': './macros/styled-macro.ts',
      'css': './macros/css-macro.ts'
    }
  }
});

console.log('✅ Macros configured for GraphQL and styled-components');
console.log('Note: Actual macro files would be implemented separately\n');

// ===== Example 4: Dependency Analysis =====
console.log('4️⃣ Advanced Dependency Analysis:');
console.log('---------------------------------');

const complexCode = `
// External dependencies
import React from 'react';
import lodash from 'lodash';
import * as axios from 'axios';

// Internal modules
import { utils } from './utils';
import { config } from '../config';
import type { User } from './types';

// Dynamic imports
const lazyModule = await import('./lazy-component');
const theme = await import(\`./themes/\${process.env.THEME}.js\`);

// Conditional requires
let pdfGenerator;
if (process.env.GENERATE_PDF) {
  pdfGenerator = require('pdfkit');
}

// CSS imports
import './styles/main.css';
import styles from './styles.module.css';

// Asset imports
import logo from './assets/logo.png';
import icons from './assets/icons.svg';
`;

const analyzerTranspiler = new Bun.Transpiler({ loader: 'ts' });
const scanResult = analyzerTranspiler.scan(complexCode);
const importsOnly = analyzerTranspiler.scanImports(complexCode);

// Categorize dependencies
const categorized = {
  external: [] as string[],
  internal: [] as string[],
  dynamic: [] as string[],
  conditional: [] as string[],
  assets: [] as string[],
  css: [] as string[],
  types: [] as string[]
};

importsOnly.forEach(imp => {
  const path = imp.path;
  if (path.startsWith('.') || path.startsWith('/')) {
    if (path.includes('.css')) {
      categorized.css.push(path);
    } else if (path.includes('.png') || path.includes('.svg')) {
      categorized.assets.push(path);
    } else {
      categorized.internal.push(path);
    }
  } else if (imp.kind === 'dynamic-import') {
    categorized.dynamic.push(path);
  } else if (path.includes('require')) {
    categorized.conditional.push(path);
  } else if (complexCode.includes(`type {`)) {
    categorized.types.push(path);
  } else {
    categorized.external.push(path);
  }
});

console.log('Dependency breakdown:');
Object.entries(categorized).forEach(([type, deps]) => {
  if (deps.length > 0) {
    console.log(`  ${type}: ${deps.join(', ')}`);
  }
});

// ===== Example 5: Bundle Optimization =====
console.log('\n5️⃣ Bundle Optimization:');
console.log('-----------------------');

const bundleCode = `
// Unused imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import lodash, { map, filter, reduce, find } from 'lodash';
import * as moment from 'moment';

// Actually used
import { fetch } from 'node-fetch';

export function processData(data: any[]) {
  // Only using map from lodash
  return map(data, item => item.id);
}

export async function getData() {
  // Only using fetch
  const response = await fetch('https://api.example.com');
  return response.json();
}

// Unused functions
function unusedHelper() {
  return moment().format();
}
`;

const optimizedTranspiler = new Bun.Transpiler({
  loader: 'ts',
  trimUnusedImports: true,
  minifyWhitespace: true,
  exports: {
    eliminate: ['unusedHelper']
  }
});

const optimizedResult = optimizedTranspiler.transformSync(bundleCode);
const originalTranspiler = new Bun.Transpiler({ loader: 'ts' });
const originalResult = originalTranspiler.transformSync(bundleCode);

console.log('Original bundle size:', originalResult.length, 'bytes');
console.log('Optimized bundle size:', optimizedResult.length, 'bytes');
console.log('Savings:', ((1 - optimizedResult.length / originalResult.length) * 100).toFixed(1) + '%');

// ===== Example 6: Target-Specific Transpilation =====
console.log('\n6️⃣ Target-Specific Transpilation:');
console.log('----------------------------------');

const universalCode = `
import { readFileSync } from 'fs';
import { localStorage } from 'local-storage';

export function getConfig() {
  const fileConfig = readFileSync('./config.json', 'utf-8');
  const savedConfig = localStorage.getItem('config');
  
  return { fileConfig, savedConfig };
}

export const platform = process.platform;
`;

// Browser target
const browserTranspiler = new Bun.Transpiler({
  loader: 'ts',
  target: 'browser',
  define: {
    'process.platform': '"browser"'
  }
});

// Node.js target
const nodeTranspiler = new Bun.Transpiler({
  loader: 'ts',
  target: 'node'
});

const browserResult = browserTranspiler.transformSync(universalCode);
const nodeResult = nodeTranspiler.transformSync(universalCode);

console.log('Browser transpilation:');
console.log('  - process.platform replaced with "browser"');
console.log('  - Node.js APIs handled appropriately');

console.log('\nNode.js transpilation:');
console.log('  - process.platform preserved');
console.log('  - Node.js APIs used directly');

// ===== Save Results =====
console.log('\n💾 Saving example results...');

const results = {
  frameworkMigration: {
    original: reactCode,
    preact: preactResult
  },
  environmentBuilds: {
    development: devResult,
    production: prodResult
  },
  dependencyAnalysis: {
    categorized,
    totalImports: importsOnly.length
  },
  bundleOptimization: {
    original: originalResult,
    optimized: optimizedResult,
    savingsPercent: ((1 - optimizedResult.length / originalResult.length) * 100).toFixed(1)
  },
  targetSpecific: {
    browser: browserResult,
    node: nodeResult
  }
};

await write('./transpiler-examples-results.json', JSON.stringify(results, null, 2));
console.log('✅ Results saved to ./transpiler-examples-results.json');

console.log('\n🎉 Advanced examples complete!');
console.log('\nKey takeaways:');
console.log('• Framework migration: Automatic JSX factory replacement');
console.log('• Environment builds: Compile-time constants');
console.log('• Macros: Code generation at transpile time');
console.log('• Dependency analysis: Full import visibility');
console.log('• Bundle optimization: Remove unused code');
console.log('• Target-specific: Platform-aware transpilation');
