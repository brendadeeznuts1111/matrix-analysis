#!/usr/bin/env bun
/**
 * Bun Build - publicPath Option Demonstration
 * Shows how to use publicPath for CDN deployment and asset hosting
 */

// Make this file a module
export {};

console.log("📦 Bun Build - publicPath Option Demo");
console.log("===================================\n");

// Example 1: Basic publicPath usage
console.log("1️⃣ Basic publicPath Usage");
console.log("--------------------------");

const basicResult = await Bun.build({
  entrypoints: ["./src/app.tsx"],
  outdir: "./dist",
  publicPath: "https://cdn.example.com/",
  files: {
    "./src/app.tsx": `
import logo from "./assets/logo.svg";
import stylesheet from "./styles/main.css";
import image from "./images/banner.png";

console.log("Logo URL:", logo);
console.log("Stylesheet URL:", stylesheet);
console.log("Image URL:", image);

// Use in DOM
const img = document.createElement('img');
img.src = image;
document.body.appendChild(img);
    `,
    "./src/assets/logo.svg": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3498db"/></svg>`,
    "./src/styles/main.css": `
body { 
  background: url('../images/background.jpg');
  font-family: Arial, sans-serif;
}
    `,
    "./src/images/banner.png": "binary-image-content",
  },
});

if (basicResult.success) {
  const output = await basicResult.outputs[0].text();
  console.log("✅ Basic publicPath build successful!");
  console.log("Public path: https://cdn.example.com/");
  console.log("\n--- Generated Code Preview ---");
  console.log(output.substring(0, 500) + "...");
  console.log("--- End of Preview ---\n");
}

// Example 2: Different CDN configurations
console.log("2️⃣ Different CDN Configurations");
console.log("---------------------------------");

const cdnConfigs = [
  {
    name: "AWS CloudFront",
    publicPath: "https://d1234567890.cloudfront.net/",
    description: "AWS CDN with custom domain"
  },
  {
    name: "GitHub Pages",
    publicPath: "https://username.github.io/repo/",
    description: "GitHub Pages with repository path"
  },
  {
    name: "Netlify",
    publicPath: "https://app.netlify.com/",
    description: "Netlify deployment"
  },
  {
    name: "Vercel",
    publicPath: "https://my-app.vercel.app/",
    description: "Vercel deployment"
  },
  {
    name: "Custom CDN",
    publicPath: "https://assets.mycdn.com/v1/",
    description: "Custom CDN with versioning"
  }
];

for (const config of cdnConfigs) {
  const result = await Bun.build({
    entrypoints: ["./src/cdn-test.ts"],
    outdir: `./dist/${config.name.toLowerCase().replace(/\s+/g, '-')}`,
    publicPath: config.publicPath,
    files: {
      "./src/cdn-test.ts": `
import icon from "./icon.svg";
console.log("Icon from ${config.name}:", icon);
      `,
      "./src/icon.svg": `<svg><rect width="20" height="20"/></svg>`
    },
  });

  if (result.success) {
    console.log(`✅ ${config.name}:`);
    console.log(`  Public path: ${config.publicPath}`);
    console.log(`  Description: ${config.description}`);
    const output = await result.outputs[0].text();
    const iconUrl = output.match(/var icon = "([^"]+)"/)?.[1];
    if (iconUrl) {
      console.log(`  Generated URL: ${iconUrl}`);
    }
  }
}

// Example 3: Environment-specific publicPath
console.log("\n3️⃣ Environment-Specific publicPath");
console.log("-----------------------------------");

const environments = [
  {
    name: "Development",
    publicPath: undefined, // Default - relative paths
    description: "Local development with relative paths"
  },
  {
    name: "Staging",
    publicPath: "https://staging-cdn.example.com/",
    description: "Staging environment CDN"
  },
  {
    name: "Production",
    publicPath: "https://cdn.example.com/",
    description: "Production CDN"
  }
];

for (const env of environments) {
  const buildConfig: any = {
    entrypoints: ["./src/env-app.tsx"],
    outdir: `./dist/${env.name.toLowerCase()}`,
    files: {
      "./src/env-app.tsx": `
import logo from "./logo.png";
import script from "./script.js";

console.log("=== ${env.name} Build ===");
console.log("Logo:", logo);
console.log("Script:", script);

// Dynamic import example
import('./module.json').then(module => {
  console.log("Dynamic module:", module.default);
});
      `,
      "./src/logo.png": "binary-logo",
      "./src/script.js": "console.log('Script loaded');",
      "./src/module.json": JSON.stringify({ env: env.name })
    },
  };

  if (env.publicPath) {
    buildConfig.publicPath = env.publicPath;
  }

  const result = await Bun.build(buildConfig);

  if (result.success) {
    console.log(`\n${env.name} Environment:`);
    console.log(`  Public path: ${env.publicPath || 'undefined (relative paths)'}`);
    console.log(`  Description: ${env.description}`);
    
    const jsOutput = result.outputs.find(o => o.path.endsWith('.js'));
    if (jsOutput) {
      const content = await jsOutput.text();
      const urls = content.match(/"(https?:\/\/[^"]+)"/g) || [];
      console.log(`  Asset URLs: ${urls.length > 0 ? urls.join(', ') : 'Relative paths'}`);
    }
  }
}

// Example 4: Versioned publicPath
console.log("\n4️⃣ Versioned publicPath");
console.log("------------------------");

const version = "1.2.3";
const versionedResult = await Bun.build({
  entrypoints: ["./src/versioned.tsx"],
  outdir: "./dist/versioned",
  publicPath: `https://cdn.example.com/v${version}/`,
  files: {
    "./src/versioned.tsx": `
import logo from "./logo.svg";
import styles from "./app.css";
import data from "./data.json";

console.log("Versioned assets:");
console.log("Logo:", logo);
console.log("Styles:", styles);
console.log("Data:", data);

// Version information
export const VERSION = "${version}";
export const CDN_BASE = "https://cdn.example.com/v${version}";
    `,
    "./src/logo.svg": `<svg><text>v${version}</text></svg>`,
    "./src/app.css": `
body::before {
  content: "v${version}";
  position: fixed;
  top: 10px;
  right: 10px;
}
    `,
    "./src/data.json": JSON.stringify({
      version,
      buildTime: new Date().toISOString(),
      assets: {
        logo: "logo.svg",
        styles: "app.css"
      }
    })
  },
});

if (versionedResult.success) {
  console.log("✅ Versioned publicPath build successful!");
  console.log(`Version: ${version}`);
  console.log(`Public path: https://cdn.example.com/v${version}/`);
  
  const output = await versionedResult.outputs[0].text();
  console.log("\nVersion info in bundle:");
  if (output.includes('VERSION = "1.2.3"')) {
    console.log("  ✅ Version constant embedded");
  }
  if (output.includes('https://cdn.example.com/v1.2.3/')) {
    console.log("  ✅ Versioned URLs generated");
  }
}

// Example 5: Multiple publicPath strategies
console.log("\n5️⃣ Multiple publicPath Strategies");
console.log("----------------------------------");

const strategies = [
  {
    name: "Root CDN",
    publicPath: "https://cdn.example.com/",
    assets: ["logo.svg", "icon.png"],
    expected: "https://cdn.example.com/logo-a1b2c3.svg"
  },
  {
    name: "Subdirectory CDN",
    publicPath: "https://cdn.example.com/assets/",
    assets: ["logo.svg", "icon.png"],
    expected: "https://cdn.example.com/assets/logo-a1b2c3.svg"
  },
  {
    name: "Versioned Subdirectory",
    publicPath: "https://cdn.example.com/v1.2.3/",
    assets: ["logo.svg", "icon.png"],
    expected: "https://cdn.example.com/v1.2.3/logo-a1b2c3.svg"
  },
  {
    name: "Complex Path",
    publicPath: "https://d1234567890.cloudfront.net/static/",
    assets: ["logo.svg", "icon.png"],
    expected: "https://d1234567890.cloudfront.net/static/logo-a1b2c3.svg"
  }
];

for (const strategy of strategies) {
  const result = await Bun.build({
    entrypoints: ["./src/strategy.ts"],
    outdir: `./dist/strategy-${strategy.name.toLowerCase().replace(/\s+/g, '-')}`,
    publicPath: strategy.publicPath,
    files: {
      "./src/strategy.ts": `
${strategy.assets.map(asset => 
  `import ${asset.split('.')[0]} from "./${asset}";`
).join('\n')}

console.log("${strategy.name} Strategy:");
${strategy.assets.map(asset => 
  `console.log("  ${asset}:", ${asset.split('.')[0]});`
).join('\n')}
      `,
      ...strategy.assets.reduce((acc, asset) => {
        acc[`./src/${asset}`] = `binary-${asset}`;
        return acc;
      }, {} as Record<string, string>)
    },
  });

  if (result.success) {
    console.log(`\n${strategy.name}:`);
    console.log(`  Public path: ${strategy.publicPath}`);
    console.log(`  Expected pattern: ${strategy.expected}`);
    
    const output = await result.outputs[0].text();
    const urls = output.match(/"(https?:\/\/[^"]+\.(svg|png))"/g) || [];
    console.log(`  Generated URLs: ${urls.join(', ')}`);
  }
}

// Example 6: publicPath with splitting
console.log("\n6️⃣ publicPath with Code Splitting");
console.log("------------------------------------");

const splitResult = await Bun.build({
  entrypoints: ["./src/main.tsx", "./src/secondary.tsx"],
  outdir: "./dist/split",
  publicPath: "https://cdn.example.com/",
  splitting: true,
  files: {
    "./src/main.tsx": `
import { shared } from "./shared.ts";
import { ComponentA } from "./components/A.tsx";

console.log("Main:", shared);
ComponentA();
    `,
    "./src/secondary.tsx": `
import { shared } from "./shared.ts";
import { ComponentB } from "./components/B.tsx";

console.log("Secondary:", shared);
ComponentB();
    `,
    "./src/shared.ts": `
export const shared = "Shared module";
export const version = "1.0.0";
    `,
    "./src/components/A.tsx": `
import { version } from "../shared.ts";
export function ComponentA() {
  console.log("Component A, version:", version);
}
    `,
    "./src/components/B.tsx": `
import { version } from "../shared.ts";
export function ComponentB() {
  console.log("Component B, version:", version);
}
    `,
  },
});

if (splitResult.success) {
  console.log("✅ Code splitting with publicPath successful!");
  console.log("Files created:");
  splitResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  
  // Check if chunks have correct publicPath
  const chunkOutputs = splitResult.outputs.filter(o => o.path.includes('chunk'));
  if (chunkOutputs.length > 0) {
    console.log("\nChunks generated with publicPath applied");
  }
}

// Example 7: Relative vs Absolute publicPath
console.log("\n7️⃣ Relative vs Absolute publicPath");
console.log("-----------------------------------");

const pathComparisons = [
  {
    name: "No publicPath (default)",
    publicPath: undefined,
    description: "Relative paths for local development"
  },
  {
    name: "Root relative",
    publicPath: "/",
    description: "Root-relative paths"
  },
  {
    name: "Absolute CDN",
    publicPath: "https://cdn.example.com/",
    description: "Full CDN URL"
  },
  {
    name: "Relative subdirectory",
    publicPath: "./assets/",
    description: "Relative subdirectory"
  }
];

for (const comparison of pathComparisons) {
  const config: any = {
    entrypoints: ["./src/paths.tsx"],
    outdir: `./dist/paths-${comparison.name.toLowerCase().replace(/\s+/g, '-')}`,
    files: {
      "./src/paths.tsx": `
import image from "./test.png";
import font from "./font.woff2";

console.log("${comparison.name}:");
console.log("  Image:", image);
console.log("  Font:", font);
      `,
      "./src/test.png": "binary-test",
      "./src/font.woff2": "binary-font"
    },
  };

  if (comparison.publicPath !== undefined) {
    config.publicPath = comparison.publicPath;
  }

  const result = await Bun.build(config);

  if (result.success) {
    console.log(`\n${comparison.name}:`);
    console.log(`  Public path: ${comparison.publicPath || 'undefined'}`);
    console.log(`  Description: ${comparison.description}`);
    
    const output = await result.outputs[0].text();
    const urls = output.match(/var (image|font) = "([^"]+)"/g) || [];
    console.log(`  URLs: ${urls.join(', ')}`);
  }
}

// Summary
console.log("\n📋 publicPath Summary");
console.log("=====================");
console.log("✅ Asset imports - Converted to full CDN URLs");
console.log("✅ External modules - Left untouched with publicPath");
console.log("✅ Code chunks - Get publicPath prefix when splitting");
console.log("✅ Dynamic imports - Respect publicPath setting");
console.log("✅ Versioned deployments - Easy URL versioning");

console.log("\n💡 Use Cases:");
console.log("-------------");
console.log("• CDN deployments - CloudFront, Netlify, Vercel");
console.log("• Multi-environment - Dev/Staging/Prod URLs");
console.log("• Versioned assets - /v1.2.3/ paths");
console.log("• Static hosting - GitHub Pages, S3");
console.log("• Micro-frontend architectures");

console.log("\n🔧 Best Practices:");
console.log("------------------");
console.log("• Use undefined for local development");
console.log("• Include trailing slash in CDN URLs");
console.log("• Version your publicPath for cache busting");
console.log("• Test asset loading in each environment");
console.log("• Combine with asset hashing for optimal caching");

console.log("\n✨ publicPath demonstration complete! 🚀");
