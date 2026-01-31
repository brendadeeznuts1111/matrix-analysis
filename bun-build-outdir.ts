#!/usr/bin/env bun
/**
 * Bun Build - outdir Option Demonstration
 * Shows how to use outdir to organize build outputs
 */

// Make this file a module
export {};

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

console.log("📦 Bun Build - outdir Option Demo");
console.log("=================================\n");

// Clean up any existing dist directories
async function cleanDist() {
  const dirs = ["./dist", "./dist/multi", "./dist/nested", "./dist/assets"];
  dirs.forEach(dir => {
    if (existsSync(dir)) {
      // Note: In real usage, you'd use fs.rmSync with recursive: true
      console.log(`Note: ${dir} directory exists (would clean in production)`);
    }
  });
}

await cleanDist();

// Example 1: Basic outdir usage
console.log("1️⃣ Basic outdir Usage");
console.log("----------------------");

const basicResult = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  files: {
    "./src/index.ts": `
import { utils } from "./utils.ts";
import { config } from "./config.json";

console.log("App starting...");
console.log("Utils:", utils);
console.log("Config:", config);
    `,
    "./src/utils.ts": `
export const utils = {
  format: (str: string) => str.toUpperCase(),
  random: () => Math.floor(Math.random() * 100)
};
    `,
    "./src/config.json": JSON.stringify({
      name: "BasicApp",
      version: "1.0.0",
      debug: true
    }, null, 2),
  },
});

if (basicResult.success) {
  console.log("✅ Basic build with outdir successful!");
  console.log("Output directory: ./dist");
  console.log("Files created:");
  for (const output of basicResult.outputs) {
    console.log(`  - ${output.path} (${output.size} bytes)`);

    // Write the file to demonstrate outdir
    const fullPath = join("./dist", output.path);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, await output.text());
  }
  console.log("  (Files written to disk for demonstration)\n");
}

// Example 2: Multiple entrypoints with outdir
console.log("2️⃣ Multiple Entrypoints with outdir");
console.log("-------------------------------------");

const multiResult = await Bun.build({
  entrypoints: [
    "./src/main.ts",
    "./src/worker.ts",
    "./src/worker-second.ts"
  ],
  outdir: "./dist/multi",
  files: {
    "./src/main.ts": `
import { Worker } from "./worker.ts";
console.log("Main application");
const worker = new Worker();
worker.start();
    `,
    "./src/worker.ts": `
export class Worker {
  start() {
    console.log("Worker 1 started");
  }
}
    `,
    "./src/worker-second.ts": `
export class Worker {
  start() {
    console.log("Worker 2 started");
  }
}
    `,
  },
});

if (multiResult.success) {
  console.log("✅ Multiple entrypoints built!");
  console.log("Output directory: ./dist/multi");
  console.log("Files created:");
  multiResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 3: Nested structure preservation
console.log("3️⃣ Nested Structure Preservation");
console.log("---------------------------------");

const nestedResult = await Bun.build({
  entrypoints: [
    "./src/pages/index.tsx",
    "./src/pages/about.tsx",
    "./src/components/Button.tsx",
    "./src/utils/helpers.ts"
  ],
  outdir: "./dist/nested",
  files: {
    "./src/pages/index.tsx": `
import { Button } from "../components/Button.tsx";
export default function Index() {
  return <div><Button>Click me</Button></div>;
}
    `,
    "./src/pages/about.tsx": `
import { Button } from "../components/Button.tsx";
export default function About() {
  return <div><Button>About</Button></div>;
}
    `,
    "./src/components/Button.tsx": `
export function Button({ children }: { children: any }) {
  return <button>{children}</button>;
}
    `,
    "./src/utils/helpers.ts": `
export const formatDate = (date: Date) => date.toISOString();
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
    `,
  },
});

if (nestedResult.success) {
  console.log("✅ Nested structure preserved!");
  console.log("Output directory: ./dist/nested");
  console.log("Files created:");
  nestedResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 4: Assets with outdir
console.log("4️⃣ Assets with outdir");
console.log("---------------------");

const assetResult = await Bun.build({
  entrypoints: ["./src/app.ts"],
  outdir: "./dist/assets",
  files: {
    "./src/app.ts": `
import logo from "./assets/logo.svg";
import stylesheet from "./styles/main.css";
import image from "./images/banner.png";

console.log("Logo:", logo);
console.log("Stylesheet:", stylesheet);
console.log("Image:", image);

// Create elements
const img = document.createElement('img');
img.src = image;

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = stylesheet;
    `,
    "./src/assets/logo.svg": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>`,
    "./src/styles/main.css": `
body { margin: 0; font-family: Arial, sans-serif; }
.container { max-width: 1200px; margin: 0 auto; }
    `,
    "./src/images/banner.png": "binary-image-placeholder",
  },
});

if (assetResult.success) {
  console.log("✅ Assets handled with outdir!");
  console.log("Output directory: ./dist/assets");
  console.log("Files created:");
  assetResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 5: Different outdir strategies
console.log("5️⃣ Different outdir Strategies");
console.log("------------------------------");

const strategies: Array<{
  name: string;
  outdir: string;
  entrypoints: string[];
  files: Record<string, string>;
}> = [
  {
    name: "Flat structure",
    outdir: "./dist/flat",
    entrypoints: ["./a.ts", "./b.ts", "./c.ts"],
    files: {
      "./a.ts": "console.log('A');",
      "./b.ts": "console.log('B');",
      "./c.ts": "console.log('C');",
    },
  },
  {
    name: "Versioned output",
    outdir: "./dist/v1.2.3",
    entrypoints: ["./app.ts"],
    files: {
      "./app.ts": "console.log('Version 1.2.3');",
    },
  },
  {
    name: "Environment-specific",
    outdir: "./dist/production",
    entrypoints: ["./index.ts"],
    files: {
      "./index.ts": "console.log('Production build');",
    },
  },
];

for (const strategy of strategies) {
  const result = await Bun.build(strategy);
  if (result.success) {
    console.log(`✅ ${strategy.name}:`);
    console.log(`  Outdir: ${strategy.outdir}`);
    console.log(`  Files: ${result.outputs.length}`);
    result.outputs.forEach(output => {
      console.log(`    - ${output.path}`);
    });
  }
}

// Example 6: Outdir with naming options
console.log("\n6️⃣ Outdir with File Naming");
console.log("---------------------------");

const namingResult = await Bun.build({
  entrypoints: [
    "./src/very-long-filename-for-testing.ts",
    "./src/short.ts",
    "./src/with-dashes.ts",
    "./src/with_underscores.ts"
  ],
  outdir: "./dist/naming",
  files: {
    "./src/very-long-filename-for-testing.ts": `
console.log("Very long filename");
export const long = "long";
    `,
    "./src/short.ts": `
console.log("Short filename");
export const short = "short";
    `,
    "./src/with-dashes.ts": `
console.log("With dashes");
export const dashes = "dashes";
    `,
    "./src/with_underscores.ts": `
console.log("With underscores");
export const underscores = "underscores";
    `,
  },
});

if (namingResult.success) {
  console.log("✅ File naming demonstrated!");
  console.log("Output directory: ./dist/naming");
  console.log("Files created:");
  namingResult.outputs.forEach(output => {
    console.log(`  - ${output.path}`);
  });
  console.log();
}

// Example 7: Outdir vs manual output
console.log("7️⃣ Outdir vs Manual Output");
console.log("---------------------------");

// With outdir
const withOutdir = await Bun.build({
  entrypoints: ["./src/with-outdir.ts"],
  outdir: "./dist/comparison/outdir",
  files: {
    "./src/with-outdir.ts": "console.log('With outdir');",
  },
});

// Without outdir (manual)
const withoutOutdir = await Bun.build({
  entrypoints: ["./src/without-outdir.ts"],
  files: {
    "./src/without-outdir.ts": "console.log('Without outdir');",
  },
});

if (withOutdir.success && withoutOutdir.success) {
  console.log("Comparison:");
  console.log("With outdir:");
  console.log(`  - Automatic file creation in specified directory`);
  console.log(`  - ${withOutdir.outputs.length} files ready`);

  console.log("\nWithout outdir:");
  console.log(`  - Manual handling required`);
  console.log(`  - ${withoutOutdir.outputs.length} outputs to process manually`);

  // Show manual handling
  for (const output of withoutOutdir.outputs) {
    const content = await output.text();
    console.log(`  - Would manually write: ${output.path} (${content.length} chars)`);
  }
}

// Example 8: Outdir with different targets
console.log("\n8️⃣ Outdir with Different Targets");
console.log("---------------------------------");

const targets = [
  { target: "browser" as const, outdir: "./dist/browser" },
  { target: "node" as const, outdir: "./dist/node" },
  { target: "bun" as const, outdir: "./dist/bun" },
];

for (const { target, outdir } of targets) {
  const result = await Bun.build({
    entrypoints: ["./src/universal.ts"],
    outdir,
    target,
    files: {
      "./src/universal.ts": `
console.log("Target: "${target}");
export const data = { target: "${target}" };
      `,
    },
  });

  if (result.success) {
    console.log(`✅ ${target} target:`);
    console.log(`  Outdir: ${outdir}`);
    result.outputs.forEach(output => {
      console.log(`  - ${output.path}`);
    });
  }
}

// Summary
console.log("\n📋 outdir Option Summary");
console.log("=========================");
console.log("✅ Automatic file creation in specified directory");
console.log("✅ Preserves nested structure from entrypoints");
console.log("✅ Handles assets and copies them correctly");
console.log("✅ Works with multiple entrypoints");
console.log("✅ Supports versioned and environment-specific paths");
console.log("✅ Manages file naming automatically");
console.log("✅ Compatible with all build targets");

console.log("\n💡 Best Practices:");
console.log("-------------------");
console.log("• Use './dist' for standard builds");
console.log("• Include version in outdir for releases");
console.log("• Separate by environment: ./dist/prod, ./dist/dev");
console.log("• Clean outdir before new builds");
console.log("• Use absolute paths for CI/CD");

console.log("\n✨ outdir demonstration complete! 🚀");
