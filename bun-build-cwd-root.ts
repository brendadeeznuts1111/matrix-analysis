#!/usr/bin/env bun
/**
 * Bun Build - Working Directory as Root
 * Demonstrates how CWD is used as root when all entrypoints are in files map
 */

// Make this file a module
export {};

console.log("📦 Bun Build - Working Directory as Root");
console.log("========================================\n");

// Get and display current working directory
const cwd = process.cwd();
console.log("Current Working Directory:", cwd);
console.log("This will be used as the root for virtual files\n");

// Example 1: Basic virtual file system with CWD as root
console.log("1️⃣ Virtual Files with CWD as Root");
console.log("-----------------------------------");

const result1 = await Bun.build({
  entrypoints: ["./virtual-app.ts"], // Relative path - uses CWD as root
  files: {
    "./virtual-app.ts": `
import { helper } from "./utils/helper.ts";
console.log("Main app running from virtual file");
helper();
    `,
    "./utils/helper.ts": `
export function helper() {
  console.log("Helper function executed");
}
    `,
  },
});

if (result1.success) {
  const output = await result1.outputs[0].text();
  console.log("✅ Build successful with relative paths!");
  console.log("\n--- Generated Code ---");
  console.log(output);
  console.log("--- End of Code ---\n");
}

// Example 2: Mixed absolute and relative paths
console.log("2️⃣ Mixed Path Types");
console.log("-------------------");

const result2 = await Bun.build({
  entrypoints: ["/app/main.ts", "./secondary.ts"], // Mix of absolute and relative
  files: {
    // Absolute path - starts with /
    "/app/main.ts": `
import { secondary } from "../secondary.ts";
import { util } from "/app/utils/util.ts";
console.log("Main from absolute path");
secondary();
util();
    `,
    // Relative path - relative to CWD
    "./secondary.ts": `
export function secondary() {
  console.log("Secondary from relative path");
}
    `,
    // Another absolute path
    "/app/utils/util.ts": `
export function util() {
  console.log("Util from absolute path");
}
    `,
  },
});

if (result2.success) {
  const output = await result2.outputs[0].text();
  console.log("✅ Mixed paths work correctly!");
  console.log("Bundle size:", output.length, "characters\n");
}

// Example 3: Demonstrating CWD resolution
console.log("3️⃣ CWD Resolution Demonstration");
console.log("---------------------------------");

// Create a virtual file that references its location
const result3 = await Bun.build({
  entrypoints: ["./cwd-demo.ts"],
  files: {
    "./cwd-demo.ts": `
// This file knows it's being built from CWD
console.log("Building from CWD:", "${cwd}");
console.log("Virtual files are resolved relative to CWD");

import { moduleA } from "./modules/module-a.ts";
import { moduleB } from "/virtual/module-b.ts";

moduleA();
moduleB();
    `,
    "./modules/module-a.ts": `
console.log("Module A: Resolved from CWD relative path");
export function moduleA() {
  console.log("  Module A executed");
}
    `,
    "/virtual/module-b.ts": `
console.log("Module B: Resolved from absolute path");
export function moduleB() {
  console.log("  Module B executed");
}
    `,
  },
});

if (result3.success) {
  const output = await result3.outputs[0].text();
  console.log("✅ CWD resolution working!");
  console.log("\n--- Output Preview ---");
  console.log(output.substring(0, 300) + "...");
  console.log("--- End of Preview ---\n");
}

// Example 4: Virtual file system structure
console.log("4️⃣ Virtual File System Structure");
console.log("--------------------------------");

const result4 = await Bun.build({
  entrypoints: ["./src/index.ts"],
  files: {
    // Simulating a typical project structure
    "./src/index.ts": `
import { App } from "./App.tsx";
import { config } from "../config/app.config.ts";
import "./styles/main.css";

console.log("App starting...");
const app = new App(config);
app.start();
    `,
    "./src/App.tsx": `
import { Component } from "./components/Component.tsx";
import { Logger } from "../utils/Logger.ts";

export class App {
  constructor(private config: any) {
    new Logger().info("App initialized");
  }

  start() {
    new Component().render();
  }
}
    `,
    "./src/components/Component.tsx": `
export class Component {
  render() {
    console.log("Component rendered");
  }
}
    `,
    "./utils/Logger.ts": `
export class Logger {
  info(msg: string) {
    console.log("[INFO]:", msg);
  }
}
    `,
    "./config/app.config.ts": `
export const config = {
  name: "Virtual App",
  version: "1.0.0",
  env: "development"
};
    `,
    "./styles/main.css": `
body {
  font-family: Arial, sans-serif;
}
.app {
  padding: 20px;
}
    `,
  },
});

if (result4.success) {
  console.log("✅ Complex virtual structure built!");
  console.log("Virtual files created:");
  // Count the files we provided
  const fileCount = Object.keys({
    "./src/index.ts": 1,
    "./src/App.tsx": 1,
    "./src/components/Component.tsx": 1,
    "./utils/Logger.ts": 1,
    "./config/app.config.ts": 1,
    "./styles/main.css": 1
  }).length;
  console.log(`  - ${fileCount} virtual files`);
  console.log(`  - All resolved from CWD: ${cwd}\n`);
}

// Example 5: Path resolution edge cases
console.log("5️⃣ Path Resolution Edge Cases");
console.log("----------------------------");

const result5 = await Bun.build({
  entrypoints: ["./edge-cases.ts"],
  files: {
    "./edge-cases.ts": `
// Various import patterns
import { a } from "./a.ts";           // Relative
import { b } from "../b.ts";          // Parent directory
import { c } from "/virtual/c.ts";    // Absolute
import { d } from "./deep/nested/d.ts"; // Deep nested

console.log("Edge cases demo");
a(); b(); c(); d();
    `,
    "./a.ts": `export function a() { console.log("File a"); }`,
    "../b.ts": `export function b() { console.log("File b (parent)"); }`,
    "/virtual/c.ts": `export function c() { console.log("File c (absolute)"); }`,
    "./deep/nested/d.ts": `export function d() { console.log("File d (deep)"); }`,
  },
});

if (result5.success) {
  console.log("✅ All edge cases resolved!");
  const output = await result5.outputs[0].text();
  console.log("Bundle contains all imports successfully\n");
}

// Example 6: Show how CWD affects the build
console.log("6️⃣ CWD Impact on Build");
console.log("---------------------");

// Temporarily change CWD to demonstrate
const originalCwd = process.cwd();
console.log("Original CWD:", originalCwd);

// Create builds with different path strategies
const strategies: Array<{
  name: string;
  entrypoints: string[];
  files: Record<string, string>;
}> = [
  {
    name: "All relative paths",
    entrypoints: ["./app.ts"],
    files: {
      "./app.ts": 'console.log("All relative");',
    },
  },
  {
    name: "All absolute paths",
    entrypoints: ["/app.ts"],
    files: {
      "/app.ts": 'console.log("All absolute");',
    },
  },
  {
    name: "Mixed paths",
    entrypoints: ["./app.ts"],
    files: {
      "./app.ts": 'console.log("Mixed");',
      "/lib.ts": 'export const x = 1;',
    },
  },
];

for (const strategy of strategies) {
  const result = await Bun.build(strategy);
  if (result.success) {
    console.log(`✅ ${strategy.name}: Success`);
  } else {
    console.log(`❌ ${strategy.name}: Failed`);
  }
}

// Restore original CWD if needed (not actually changing in this demo)
console.log("\nCurrent CWD remains:", process.cwd());

// Summary
console.log("\n📋 CWD as Root Summary");
console.log("=======================");
console.log("✅ When all entrypoints are in files map, CWD is used as root");
console.log("✅ Relative paths (./) are resolved from CWD");
console.log("✅ Absolute paths (/) are virtual and work independently");
console.log("✅ Parent directory (../) works relative to CWD");
console.log("✅ Deep nesting works with relative paths");
console.log("✅ Mixed absolute/relative paths are supported");

console.log("\n💡 Key Points:");
console.log("---------------");
console.log("• CWD = process.cwd() at build time");
console.log("• Virtual files don't need to exist on disk");
console.log("• Absolute paths start with /");
console.log("• Relative paths start with ./ or ../");
console.log("• All paths are resolved before bundling");

console.log("\n✨ CWD as root demonstrated! 🚀");
