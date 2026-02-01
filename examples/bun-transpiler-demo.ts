#!/usr/bin/env bun
/**
 * 🚀 Bun Transpiler API Demo
 * 
 * Demonstrates various transpiler capabilities:
 * - Code transformation with different loaders
 * - Import/export scanning
 * - Custom tsconfig and defines
 * - JSX optimization
 */

import { write } from 'bun';

// Example 1: Basic TypeScript transformation
console.log('📝 Example 1: Basic TypeScript Transformation');
console.log('==========================================');

const tsCode = `
interface User {
  name: string;
  age: number;
}

const user: User = { name: "Alice", age: 30 };
console.log(\`Hello, \${user.name}!\`);
`;

const transpiler = new Bun.Transpiler({ loader: "ts" });
const jsCode = transpiler.transformSync(tsCode);
console.log('Original TypeScript:');
console.log(tsCode);
console.log('\nTranspiled JavaScript:');
console.log(jsCode);

// Example 2: JSX with custom defines
console.log('\n\n🎨 Example 2: JSX with Custom Defines');
console.log('=====================================');

const jsxCode = `
function App() {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div>
      <h1>Hello {isDev ? "Developer" : "World"}</h1>
      <p>Environment: {process.env.NODE_ENV}</p>
    </div>
  );
}
`;

const jsxTranspiler = new Bun.Transpiler({
  loader: "jsx",
  define: {
    "process.env.NODE_ENV": "\"production\"",
    "process.env.API_URL": "\"https://api.example.com\""
  },
  jsxOptimizationInline: true
});

const transpiledJSX = jsxTranspiler.transformSync(jsxCode);
console.log('Original JSX:');
console.log(jsxCode);
console.log('\nTranspiled JSX (with defines):');
console.log(transpiledJSX);

// Example 3: Scan imports and exports
console.log('\n\n🔍 Example 3: Scan Imports and Exports');
console.log('===================================');

const moduleCode = `
import React from 'react';
import { useState, useEffect } from 'react';
import lodash from 'lodash';
import './styles.css';
import type { User } from './types';

export const Component = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    import('./dynamic-module').then(module => {
      setData(module.default);
    });
  }, []);
  
  return React.createElement('div', null, 'Hello');
};

export default Component;
export { Component as MyComponent };
`;

const scanner = new Bun.Transpiler({ loader: "ts" });
const scanResult = scanner.scan(moduleCode);
const importsOnly = scanner.scanImports(moduleCode);

console.log('All exports found:');
console.log(scanResult.exports);
console.log('\nAll imports found:');
importsOnly.forEach((imp, index) => {
  console.log(`${index + 1}. ${imp.kind}: ${imp.path}`);
});

// Example 4: Custom tsconfig for different JSX runtimes
console.log('\n\n⚙️ Example 4: Custom TSConfig for Different JSX Runtimes');
console.log('====================================================');

const preactCode = `
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';

function PreactApp() {
  return (
    <Fragment>
      <h1>Preact App</h1>
      <p>Using Preact JSX</p>
    </Fragment>
  );
}
`;

const preactTranspiler = new Bun.Transpiler({
  loader: "jsx",
  tsconfig: {
    jsxFactory: "h",
    jsxFragmentFactory: "Fragment",
    jsxImportSource: undefined
  }
});

const preactResult = preactTranspiler.transformSync(preactCode);
console.log('Preact JSX transpilation:');
console.log(preactResult);

// Example 5: Macro replacement
console.log('\n\n🔧 Example 5: Macro Replacement');
console.log('==============================');

const macroCode = `
import { graphql } from 'react-relay';
import { styled } from 'styled-components';

const query = graphql\`
  query UserQuery {
    user(id: $id) {
      name
      email
    }
  }
\`;

const StyledButton = styled.button\`
  background: blue;
  color: white;
  padding: 10px;
\`;
`;

const macroTranspiler = new Bun.Transpiler({
  loader: "tsx",
  macro: {
    "react-relay": {
      "graphql": "./macros/relay-macro.ts"
    },
    "styled-components": {
      "styled": "./macros/styled-macro.ts"
    }
  }
});

// Note: This would fail without actual macro files, but demonstrates the API
console.log('Code with macros:');
console.log(macroCode);
console.log('\n(Macros would be replaced at transpile time)');

// Example 6: Minification and optimizations
console.log('\n\n📦 Example 6: Minification and Optimizations');
console.log('==========================================');

const unoptimizedCode = `
// This is a comment that will be removed
const unusedVariable = "This will be trimmed";

export function calculate(a: number, b: number): number {
  const result = a + b;
  // Another comment
  return result;
}

export const PI = 3.14159;
export const E = 2.71828;
`;

const optimizedTranspiler = new Bun.Transpiler({
  loader: "ts",
  minifyWhitespace: true,
  inline: true,
  trimUnusedImports: true,
  exports: {
    eliminate: ["E"] // Remove PI export but keep E
  }
});

const optimized = optimizedTranspiler.transformSync(unoptimizedCode);
console.log('Original code:');
console.log(unoptimizedCode);
console.log('\nOptimized code:');
console.log(optimized);

// Example 7: Target-specific transformations
console.log('\n\n🎯 Example 7: Target-Specific Transformations');
console.log('==============================================');

const universalCode = `
import fs from 'fs';
import path from 'path';

export function readFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, 'utf-8');
}

// Conditionally import based on environment
const adapter = process.env.BROWSER ? 
  import('./browser-adapter') : 
  import('./node-adapter');
`;

// Browser target - transforms fs to browser-compatible
const browserTranspiler = new Bun.Transpiler({
  loader: "ts",
  target: "browser",
  define: {
    "process.env.BROWSER": "true"
  }
});

// Node target - keeps require/import as-is
const nodeTranspiler = new Bun.Transpiler({
  loader: "ts",
  target: "node",
  define: {
    "process.env.BROWSER": "false"
  }
});

console.log('Browser target:');
console.log(browserTranspiler.transformSync(universalCode));
console.log('\nNode target:');
console.log(nodeTranspiler.transformSync(universalCode));

// Save examples to files for reference
await write('./transpiler-examples/original-ts.ts', tsCode);
await write('./transpiler-examples/transpiled-js.js', jsCode);
await write('./transpiler-examples/original-jsx.jsx', jsxCode);
await write('./transpiler-examples/transpiled-jsx.js', transpiledJSX);

console.log('\n✅ Examples saved to ./transpiler-examples/ directory');
console.log('\n🎉 Bun Transpiler API Demo Complete!');
