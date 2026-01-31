#!/usr/bin/env bun
/**
 * Bun Build - naming Option Demonstration
 * Shows how to customize output file naming patterns
 */

// Make this file a module
export {};

console.log("📦 Bun Build - naming Option Demo");
console.log("===============================\n");

// Example 1: Default naming pattern
console.log("1️⃣ Default Naming Pattern");
console.log("-------------------------");

const defaultResult = await Bun.build({
  entrypoints: ["./index.tsx", "./nested/deep/index.tsx"],
  outdir: "./dist/default",
  // Default naming: "[dir]/[name].[ext]"
  files: {
    "./index.tsx": `
console.log("Main index");
export default function App() { return <div>App</div>; }
    `,
    "./nested/deep/index.tsx": `
console.log("Nested index");
export default function NestedApp() { return <div>Nested</div>; }
    `,
  },
});

if (defaultResult.success) {
  console.log("✅ Default naming pattern: '[dir]/[name].[ext]'");
  console.log("Files created:");
  defaultResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 2: Custom naming with hash
console.log("2️⃣ Custom Naming with Hash");
console.log("----------------------------");

const hashResult = await Bun.build({
  entrypoints: ["./src/app.tsx", "./src/admin.tsx"],
  outdir: "./dist/hashed",
  naming: "files/[dir]/[name]-[hash].[ext]",
  files: {
    "./src/app.tsx": `
console.log("Main app");
export const version = "1.0.0";
    `,
    "./src/admin.tsx": `
console.log("Admin panel");
export const adminVersion = "1.0.0";
    `,
  },
});

if (hashResult.success) {
  console.log("✅ Custom naming with hash: 'files/[dir]/[name]-[hash].[ext]'");
  console.log("Files created:");
  hashResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 3: Different naming tokens
console.log("3️⃣ Naming Tokens Demonstration");
console.log("--------------------------------");

const tokenExamples = [
  {
    name: "Only name",
    pattern: "[name].[ext]",
    description: "Just filename and extension"
  },
  {
    name: "Name with hash",
    pattern: "[name]-[hash].[ext]",
    description: "Filename with content hash"
  },
  {
    name: "Hash first",
    pattern: "[hash]-[name].[ext]",
    description: "Hash prefix for better caching"
  },
  {
    name: "With directory",
    pattern: "[dir]/[name].[ext]",
    description: "Preserve directory structure"
  },
  {
    name: "Flattened with hash",
    pattern: "[name]-[hash].[ext]",
    description: "Flatten structure with unique names"
  },
  {
    name: "Full path simulation",
    pattern: "[dir]/[name]-[hash].[ext]",
    description: "Keep structure but add hash"
  }
];

for (const example of tokenExamples) {
  const result = await Bun.build({
    entrypoints: ["./src/components/Button.tsx"],
    outdir: `./dist/tokens/${example.name.toLowerCase().replace(/\s+/g, '-')}`,
    naming: example.pattern,
    files: {
      "./src/components/Button.tsx": `
console.log("Button component for ${example.name}");
export function Button() { return <button>Click</button>; }
      `,
    },
  });

  if (result.success) {
    console.log(`${example.name}:`);
    console.log(`  Pattern: ${example.pattern}`);
    console.log(`  Description: ${example.description}`);
    result.outputs.forEach(output => {
      console.log(`  Output: ${output.path}`);
    });
    console.log();
  }
}

// Example 4: Asset naming
console.log("4️⃣ Asset Naming Patterns");
console.log("-------------------------");

const assetResult = await Bun.build({
  entrypoints: ["./src/assets.ts"],
  outdir: "./dist/assets",
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "[name]-[hash].[ext]",
    asset: "assets/[name]-[hash].[ext]", // Custom asset naming
  },
  files: {
    "./src/assets.ts": `
import logo from "./images/logo.svg";
import icon from "./icons/favicon.ico";
import font from "./fonts/main.woff2";
import banner from "./images/banner.png";

console.log("Assets loaded:");
console.log("Logo:", logo);
console.log("Icon:", icon);
console.log("Font:", font);
console.log("Banner:", banner);
    `,
    "./src/images/logo.svg": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>`,
    "./src/icons/favicon.ico": "binary-favicon",
    "./src/fonts/main.woff2": "binary-font",
    "./src/images/banner.png": "binary-banner",
  },
});

if (assetResult.success) {
  console.log("✅ Custom asset naming: 'assets/[name]-[hash].[ext]'");
  console.log("Files created:");
  assetResult.outputs.forEach(output => {
    const type = output.path.includes('assets/') ? 'Asset' : 'Entry';
    console.log(`  [${type}] ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 5: Chunk naming with splitting
console.log("5️⃣ Chunk Naming with Splitting");
console.log("--------------------------------");

const chunkResult = await Bun.build({
  entrypoints: ["./src/main.tsx", "./src/secondary.tsx"],
  outdir: "./dist/chunks",
  splitting: true,
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "chunks/chunk-[hash].[ext]", // Custom chunk naming
    asset: "assets/[name]-[hash].[ext]",
  },
  files: {
    "./src/main.tsx": `
import { shared } from "./shared.ts";
import { MainComponent } from "./components/Main.tsx";

console.log("Main loaded");
shared.log();
MainComponent();
    `,
    "./src/secondary.tsx": `
import { shared } from "./shared.ts";
import { SecondaryComponent } from "./components/Secondary.tsx";

console.log("Secondary loaded");
shared.log();
SecondaryComponent();
    `,
    "./src/shared.ts": `
export function log() {
  console.log("Shared module");
}

export const version = "1.0.0";
    `,
    "./src/components/Main.tsx": `
import { version } from "../shared.ts";
export function MainComponent() {
  console.log("Main component v" + version);
}
    `,
    "./src/components/Secondary.tsx": `
import { version } from "../shared.ts";
export function SecondaryComponent() {
  console.log("Secondary component v" + version);
}
    `,
  },
});

if (chunkResult.success) {
  console.log("✅ Custom chunk naming: 'chunks/chunk-[hash].[ext]'");
  console.log("Files created:");
  chunkResult.outputs.forEach(output => {
    let type = "Entry";
    if (output.path.includes('chunks/')) type = "Chunk";
    else if (output.path.includes('assets/')) type = "Asset";
    console.log(`  [${type}] ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 6: Version-based naming
console.log("6️⃣ Version-Based Naming");
console.log("------------------------");

const version = "2.1.0";
const versionResult = await Bun.build({
  entrypoints: ["./src/app.tsx", "./src/admin.tsx"],
  outdir: "./dist/versioned",
  naming: {
    entry: "[dir]/[name]-v" + version + ".[ext]",
    chunk: "chunks/[name]-v" + version + "-[hash].[ext]",
    asset: "assets/[name]-v" + version + "-[hash].[ext]",
  },
  files: {
    "./src/app.tsx": `
console.log("App v${version}");
export const APP_VERSION = "${version}";
    `,
    "./src/admin.tsx": `
console.log("Admin v${version}");
export const ADMIN_VERSION = "${version}";
    `,
  },
});

if (versionResult.success) {
  console.log(`✅ Version-based naming for v${version}`);
  console.log("Files created:");
  versionResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 7: Environment-specific naming
console.log("7️⃣ Environment-Specific Naming");
console.log("--------------------------------");

const environments = [
  {
    name: "Development",
    suffix: "dev",
    pattern: "[dir]/[name]-dev.[ext]",
    description: "Development builds"
  },
  {
    name: "Staging",
    suffix: "staging",
    pattern: "[dir]/[name]-staging-[hash].[ext]",
    description: "Staging builds with hash"
  },
  {
    name: "Production",
    suffix: "prod",
    pattern: "[dir]/[name]-prod.[ext]",
    description: "Production builds"
  }
];

for (const env of environments) {
  const result = await Bun.build({
    entrypoints: ["./src/index.tsx"],
    outdir: `./dist/env-${env.suffix}`,
    naming: env.pattern,
    files: {
      "./src/index.tsx": `
console.log("${env.name} build");
export const ENVIRONMENT = "${env.name}";
      `,
    },
  });

  if (result.success) {
    console.log(`${env.name} Environment:`);
    console.log(`  Pattern: ${env.pattern}`);
    console.log(`  Description: ${env.description}`);
    result.outputs.forEach(output => {
      console.log(`  Output: ${output.path}`);
    });
    console.log();
  }
}

// Example 8: Complex naming strategies
console.log("8️⃣ Complex Naming Strategies");
console.log("------------------------------");

const strategies = [
  {
    name: "Micro-frontend",
    naming: {
      entry: "microfrontends/[name]/index.[ext]",
      chunk: "microfrontends/[name]/chunks/[hash].[ext]",
      asset: "microfrontends/[name]/assets/[hash].[ext]",
    },
    description: "Isolate micro-frontend assets"
  },
  {
    name: "Monorepo",
    naming: {
      entry: "[dir]/[name].[ext]",
      chunk: "shared/chunks/[hash].[ext]",
      asset: "static/[hash].[ext]",
    },
    description: "Shared chunks for monorepo"
  },
  {
    name: "CDN Optimized",
    naming: {
      entry: "[hash].[ext]",
      chunk: "chunks/[hash].[ext]",
      asset: "assets/[hash].[ext]",
    },
    description: "Hash-only for maximum caching"
  },
  {
    name: "Versioned Release",
    naming: {
      entry: "v1.0/[dir]/[name].[ext]",
      chunk: "v1.0/chunks/[hash].[ext]",
      asset: "v1.0/assets/[hash].[ext]",
    },
    description: "Versioned directory structure"
  }
];

for (const strategy of strategies) {
  const result = await Bun.build({
    entrypoints: ["./packages/app/src/index.tsx"],
    outdir: `./dist/strategy-${strategy.name.toLowerCase().replace(/\s+/g, '-')}`,
    naming: strategy.naming,
    files: {
      "./packages/app/src/index.tsx": `
console.log("${strategy.name} strategy");
export const STRATEGY = "${strategy.name}";
      `,
    },
  });

  if (result.success) {
    console.log(`${strategy.name} Strategy:`);
    console.log(`  Description: ${strategy.description}`);
    console.log(`  Entry naming: ${strategy.naming.entry}`);
    console.log(`  Chunk naming: ${strategy.naming.chunk}`);
    console.log(`  Asset naming: ${strategy.naming.asset}`);
    console.log(`  Outputs:`);
    result.outputs.forEach(output => {
      console.log(`    - ${output.path}`);
    });
    console.log();
  }
}

// Example 9: Naming tokens explained
console.log("9️⃣ Naming Tokens Explained");
console.log("----------------------------");

// Create examples showing each token
const tokenResult = await Bun.build({
  entrypoints: [
    "./src/index.tsx",
    "./src/nested/deep/file.tsx",
    "./src/another-component.tsx"
  ],
  outdir: "./dist/tokens",
  naming: "[dir]/[name]-[hash].[ext]",
  files: {
    "./src/index.tsx": `console.log("Index - root level");`,
    "./src/nested/deep/file.tsx": `console.log("Nested deep file");`,
    "./src/another-component.tsx": `console.log("Another component");`,
  },
});

if (tokenResult.success) {
  console.log("Token breakdown:");
  console.log("  [name] - Filename without extension");
  console.log("  [ext] - Output extension (js, css, etc.)");
  console.log("  [hash] - Content hash for cache busting");
  console.log("  [dir] - Directory path from root");
  console.log();
  console.log("Examples from current build:");
  tokenResult.outputs.forEach(output => {
    const parts = output.path.split('/');
    const file = parts[parts.length - 1];
    const dir = parts.slice(0, -1).join('/') || '(root)';
    
    // Extract tokens
    const nameMatch = file.match(/^([^-]+)/);
    const hashMatch = file.match(/-([^.]+)\./);
    const extMatch = file.match(/\.([^.]+)$/);
    
    console.log(`  ${output.path}:`);
    console.log(`    [dir] = ${dir}`);
    console.log(`    [name] = ${nameMatch?.[1] || 'N/A'}`);
    console.log(`    [hash] = ${hashMatch?.[1] || 'N/A'}`);
    console.log(`    [ext] = ${extMatch?.[1] || 'N/A'}`);
  });
}

// Summary
console.log("\n📋 Naming Options Summary");
console.log("========================");
console.log("✅ [name] - Filename without extension");
console.log("✅ [ext] - Output file extension");
console.log("✅ [hash] - Content hash for cache busting");
console.log("✅ [dir] - Directory path from project root");
console.log("✅ entry - Entry point files");
console.log("✅ chunk - Split code chunks");
console.log("✅ asset - Static assets (images, fonts, etc.)");

console.log("\n💡 Common Patterns:");
console.log("-------------------");
console.log("• Default: '[dir]/[name].[ext]'");
console.log("• With hash: '[name]-[hash].[ext]'");
console.log("• CDN ready: '[hash].[ext]'");
console.log("• Versioned: 'v1.0/[name].[ext]'");
console.log("• Micro-frontends: 'apps/[name]/index.[ext]'");

console.log("\n🔧 Best Practices:");
console.log("------------------");
console.log("• Use [hash] for cache busting in production");
console.log("• Keep [dir] for better organization");
console.log("• Version your naming scheme");
console.log("• Different patterns per environment");
console.log("• Consider CDN requirements");

console.log("\n✨ Naming demonstration complete! 🚀");
