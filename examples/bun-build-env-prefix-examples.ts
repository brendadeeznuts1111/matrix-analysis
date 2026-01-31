#!/usr/bin/env bun
/**
 * Bun Build - env Prefix Pattern Examples
 * Shows exact examples of how prefix-based env variable injection works
 */

// Make this file a module
export {};

console.log("📦 Bun Build - env Prefix Pattern Examples");
console.log("========================================\n");

// Set up the exact environment variables from the example
process.env.FOO = "bar";
process.env.BAZ = "123";
process.env.ACME_PUBLIC_URL = "https://acme.com";

// Add more examples
process.env.ACME_PUBLIC_API_KEY = "pk_live_12345";
process.env.ACME_PUBLIC_VERSION = "2.1.0";
process.env.SECRET_DATABASE_PASSWORD = "super-secret";
process.env.INTERNAL_DEBUG_MODE = "true";

// Example 1: Exact example from documentation
console.log("1️⃣ Exact Documentation Example");
console.log("-------------------------------");

console.log("Environment variables:");
console.log("  FOO=bar");
console.log("  BAZ=123");
console.log("  ACME_PUBLIC_URL=https://acme.com");
console.log();

const exactResult = await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./dist/exact-example",
  env: "ACME_PUBLIC_*",
  files: {
    "./index.tsx": `
console.log(process.env.FOO);
console.log(process.env.ACME_PUBLIC_URL);
console.log(process.env.BAZ);
    `,
  },
});

if (exactResult.success) {
  const output = await exactResult.outputs[0].text();
  console.log("Generated bundle:");
  console.log("------------------");
  console.log(output);
  console.log("\n✅ Only ACME_PUBLIC_URL inlined as string literal");
  console.log("✅ FOO and BAZ preserved as process.env references");
}

// Example 2: Multiple matching variables
console.log("\n2️⃣ Multiple Variables with Same Prefix");
console.log("--------------------------------------");

const multiResult = await Bun.build({
  entrypoints: ["./multi.ts"],
  outdir: "./dist/multi-prefix",
  env: "ACME_PUBLIC_*",
  files: {
    "./multi.ts": `
// All ACME_PUBLIC_* variables will be inlined
console.log("API Key:", process.env.ACME_PUBLIC_API_KEY);
console.log("URL:", process.env.ACME_PUBLIC_URL);
console.log("Version:", process.env.ACME_PUBLIC_VERSION);

// Non-matching variables preserved
console.log("Secret:", process.env.SECRET_DATABASE_PASSWORD);
console.log("Debug:", process.env.INTERNAL_DEBUG_MODE);
    `,
  },
});

if (multiResult.success) {
  const output = await multiResult.outputs[0].text();
  console.log("Generated bundle:");
  console.log("------------------");
  console.log(output);
  console.log("\nAnalysis:");
  console.log("  ✓ API Key inlined:", output.includes('"pk_live_12345"'));
  console.log("  ✓ URL inlined:", output.includes('"https://acme.com"'));
  console.log("  ✓ Version inlined:", output.includes('"2.1.0"'));
  console.log("  ✓ Secret preserved:", output.includes('process.env.SECRET_DATABASE_PASSWORD'));
}

// Example 3: Different prefixes comparison
console.log("\n3️⃣ Different Prefixes Comparison");
console.log("---------------------------------");

const prefixes = [
  "ACME_PUBLIC_*",
  "SECRET_*",
  "INTERNAL_*",
  "NONEXISTENT_*"
];

for (const prefix of prefixes) {
  const result = await Bun.build({
    entrypoints: ["./compare.ts"],
    outdir: `./dist/prefix-${prefix.replace('*', 'star')}`,
    env: prefix as `${string}*`,
    files: {
      "./compare.ts": `
console.log("Testing prefix: ${prefix}");
console.log("FOO:", process.env.FOO);
console.log("BAZ:", process.env.BAZ);
console.log("ACME_PUBLIC_URL:", process.env.ACME_PUBLIC_URL);
console.log("ACME_PUBLIC_API_KEY:", process.env.ACME_PUBLIC_API_KEY);
console.log("SECRET_DATABASE_PASSWORD:", process.env.SECRET_DATABASE_PASSWORD);
console.log("INTERNAL_DEBUG_MODE:", process.env.INTERNAL_DEBUG_MODE);
      `,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    console.log(`\n${prefix}:`);
    
    // Count inlined vs preserved
    const inlinedCount = (output.match(/"[^"]*"/g) || []).length;
    const preservedCount = (output.match(/process\.env\./g) || []).length;
    
    console.log(`  Inlined variables: ${inlinedCount}`);
    console.log(`  Preserved variables: ${preservedCount}`);
    
    // Show which are inlined
    if (prefix === "ACME_PUBLIC_*") {
      console.log("  Inlined: ACME_PUBLIC_URL, ACME_PUBLIC_API_KEY, ACME_PUBLIC_VERSION");
    } else if (prefix === "SECRET_*") {
      console.log("  Inlined: SECRET_DATABASE_PASSWORD");
    } else if (prefix === "INTERNAL_*") {
      console.log("  Inlined: INTERNAL_DEBUG_MODE");
    } else {
      console.log("  Inlined: None");
    }
  }
}

// Example 4: env: "disable" comparison
console.log("\n4️⃣ env: 'disable' - No Injection");
console.log("--------------------------------");

const disableResult = await Bun.build({
  entrypoints: ["./disable.ts"],
  outdir: "./dist/disable",
  env: "disable",
  files: {
    "./disable.ts": `
console.log("All environment variables preserved:");
console.log("FOO:", process.env.FOO);
console.log("BAZ:", process.env.BAZ);
console.log("ACME_PUBLIC_URL:", process.env.ACME_PUBLIC_URL);
console.log("SECRET:", process.env.SECRET_DATABASE_PASSWORD);
    `,
  },
});

if (disableResult.success) {
  const output = await disableResult.outputs[0].text();
  console.log("Generated bundle:");
  console.log("------------------");
  console.log(output);
  console.log("\n✅ ALL process.env references preserved");
  console.log("✅ No variables inlined");
}

// Example 5: Real-world React component example
console.log("\n5️⃣ Real-world React Component");
console.log("------------------------------");

const reactResult = await Bun.build({
  entrypoints: ["./App.tsx"],
  outdir: "./dist/react-app",
  env: "REACT_APP_*",
  target: "browser",
  files: {
    "./App.tsx": `
import React from 'react';

function App() {
  // These will be inlined (REACT_APP_*)
  const apiUrl = process.env.REACT_APP_API_URL;
  const version = process.env.REACT_APP_VERSION;
  const isProduction = process.env.REACT_APP_ENV === 'production';
  
  // These will be preserved
  const secretKey = process.env.SECRET_API_KEY;
  const dbUrl = process.env.DATABASE_URL;
  
  return (
    <div>
      <h1>React App</h1>
      <p>API: {apiUrl}</p>
      <p>Version: {version}</p>
      <p>Production: {isProduction ? 'Yes' : 'No'}</p>
    </div>
  );
}

export default App;
    `,
  },
});

// Set REACT_APP variables
process.env.REACT_APP_API_URL = "https://api.reactapp.com";
process.env.REACT_APP_VERSION = "1.0.0";
process.env.REACT_APP_ENV = "production";
process.env.SECRET_API_KEY = "sk-12345";
process.env.DATABASE_URL = "postgres://localhost/myapp";

if (reactResult.success) {
  const output = await reactResult.outputs[0].text();
  console.log("Generated React bundle:");
  console.log("----------------------");
  // Show relevant parts
  const lines = output.split('\n');
  const apiLine = lines.find(l => l.includes('apiUrl'));
  const versionLine = lines.find(l => l.includes('version'));
  const secretLine = lines.find(l => l.includes('secretKey'));
  
  if (apiLine) console.log(apiLine.trim());
  if (versionLine) console.log(versionLine.trim());
  if (secretLine) console.log(secretLine.trim());
  
  console.log("\n✅ REACT_APP_* variables inlined");
  console.log("✅ SECRET_* and DATABASE_* preserved");
}

// Example 6: Security demonstration
console.log("\n6️⃣ Security - Safe vs Unsafe");
console.log("----------------------------");

// Safe build - only public vars
const safeResult = await Bun.build({
  entrypoints: ["./safe.ts"],
  outdir: "./dist/safe",
  env: "PUBLIC_*",
  files: {
    "./safe.ts": `
const config = {
  // Public (safe to expose)
  apiUrl: process.env.PUBLIC_API_URL,
  cdnUrl: process.env.PUBLIC_CDN_URL,
  
  // Private (preserved)
  secretKey: process.env.SECRET_KEY,
  databaseUrl: process.env.DATABASE_URL
};

console.log("Config:", config);
    `,
  },
});

process.env.PUBLIC_API_URL = "https://api.public.com";
process.env.PUBLIC_CDN_URL = "https://cdn.public.com";
process.env.SECRET_KEY = "super-secret-key";
process.env.DATABASE_URL = "postgres://user:pass@localhost/db";

// Unsafe build - all vars inlined
const unsafeResult = await Bun.build({
  entrypoints: ["./unsafe.ts"],
  outdir: "./dist/unsafe",
  env: "inline",
  files: {
    "./unsafe.ts": `
const config = {
  // Public (safe to expose)
  apiUrl: process.env.PUBLIC_API_URL,
  cdnUrl: process.env.PUBLIC_CDN_URL,
  
  // Private (DANGER - will be exposed!)
  secretKey: process.env.SECRET_KEY,
  databaseUrl: process.env.DATABASE_URL
};

console.log("Config:", config);
    `,
  },
});

if (safeResult.success && unsafeResult.success) {
  const safeOutput = await safeResult.outputs[0].text();
  const unsafeOutput = await unsafeResult.outputs[0].text();
  
  console.log("Safe build (PUBLIC_* only):");
  console.log("  Public API inlined:", safeOutput.includes('"https://api.public.com"'));
  console.log("  Secret key preserved:", safeOutput.includes('process.env.SECRET_KEY'));
  console.log("  Database URL preserved:", safeOutput.includes('process.env.DATABASE_URL'));
  
  console.log("\n⚠️  Unsafe build (inline all):");
  console.log("  Public API inlined:", unsafeOutput.includes('"https://api.public.com"'));
  console.log("  Secret key EXPOSED:", unsafeOutput.includes('"super-secret-key"'));
  console.log("  Database URL EXPOSED:", unsafeOutput.includes('"postgres://user:pass@localhost/db"'));
  
  console.log("\n💡 Security Tip:");
  console.log("  Always use prefix patterns like PUBLIC_* for client-side builds!");
}

// Summary
console.log("\n📋 env Prefix Pattern Summary");
console.log("=============================");
console.log("✅ Prefix pattern: env: 'PREFIX_*'");
console.log("✅ Matches variables starting with PREFIX_");
console.log("✅ Inlines matching vars as string literals");
console.log("✅ Preserves non-matching vars as process.env");
console.log("✅ env: 'disable' preserves all vars");

console.log("\n💡 Common Prefixes:");
console.log("-------------------");
console.log("• PUBLIC_* - General public configuration");
console.log("• REACT_APP_* - Create React App");
console.log("• VITE_* - Vite build tool");
console.log("• NEXT_PUBLIC_* - Next.js");
console.log("• ACME_PUBLIC_* - Company-specific (example)");

console.log("\n🔧 Security Benefits:");
console.log("---------------------");
console.log("• Prevents accidental secret exposure");
console.log("• Clear separation of public/private");
console.log("• Team-friendly naming conventions");
console.log("• Easy to audit and review");

console.log("\n✨ Prefix pattern examples complete! 🚀");
