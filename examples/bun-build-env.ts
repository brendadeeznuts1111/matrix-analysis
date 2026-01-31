#!/usr/bin/env bun
/**
 * Bun Build - env Option Demonstration
 * Shows how to handle environment variables during bundling
 */

// Make this file a module
export {};

console.log("📦 Bun Build - env Option Demo");
console.log("============================\n");

// Set some test environment variables
process.env.NODE_ENV = "production";
process.env.API_URL = "https://api.example.com";
process.env.DEBUG = "false";
process.env.VERSION = "1.0.0";
process.env.SECRET_KEY = "super-secret";
process.env.FEATURE_FLAGS = '{"auth": true, "beta": false}';
process.env.PORT = "3000";

// Example 1: env: "inline" - Default behavior
console.log("1️⃣ env: 'inline' - Default Behavior");
console.log("-----------------------------------");

const inlineResult = await Bun.build({
  entrypoints: ["./src/app.ts"],
  outdir: "./dist/inline",
  env: "inline", // Default - injects env vars into bundle
  files: {
    "./src/app.ts": `
console.log("Environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("API_URL:", process.env.API_URL);
console.log("DEBUG:", process.env.DEBUG);
console.log("VERSION:", process.env.VERSION);

// Conditional code based on env
if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode");
} else {
  console.log("Running in development mode");
}

// Using env in configuration
const config = {
  apiUrl: process.env.API_URL,
  debug: process.env.DEBUG === "true",
  port: parseInt(process.env.PORT || "3000")
};

console.log("Config:", config);
    `,
  },
});

if (inlineResult.success) {
  const output = await inlineResult.outputs[0].text();
  console.log("✅ env: 'inline' build successful!");
  console.log("\n--- Generated Code (showing inlined env vars) ---");
  console.log(output.substring(0, 1000) + "...");
  console.log("--- End of Code ---\n");
}

// Example 2: env: "inline" with dead code elimination
console.log("2️⃣ Dead Code Elimination with env");
console.log("------------------------------------");

const dceResult = await Bun.build({
  entrypoints: ["./src/dce.ts"],
  outdir: "./dist/dce",
  env: "inline",
  minify: true, // Enable minification to see DCE effect
  files: {
    "./src/dce.ts": `
// This code will be eliminated in production
if (process.env.NODE_ENV === "development") {
  console.log("Development only code");
  console.log("This should be removed in production");
  function devOnlyFunction() {
    return "dev";
  }
}

// This code remains in production
if (process.env.NODE_ENV === "production") {
  console.log("Production code");
  function prodFunction() {
    return "prod";
  }
}

// Always included
console.log("Always included");
console.log("Environment:", process.env.NODE_ENV);
    `,
  },
});

if (dceResult.success) {
  const output = await dceResult.outputs[0].text();
  console.log("✅ Dead code elimination with env vars!");
  console.log("Bundle size:", output.length, "characters");
  console.log("Contains 'Development':", output.includes("Development"));
  console.log("Contains 'Production':", output.includes("Production"));
  console.log();
}

// Example 3: Different env modes
console.log("3️⃣ Different Environment Modes");
console.log("--------------------------------");

const envModes = [
  {
    mode: "inline" as const,
    description: "Injects env vars as string literals"
  },
  {
    mode: "disable" as const, // Changed from "none" to "disable"
    description: "No special handling, process.env preserved"
  }
];

for (const { mode, description } of envModes) {
  // Change env for demo
  const originalEnv: string | undefined = process.env.NODE_ENV;
  process.env.NODE_ENV = mode === "inline" ? "production" : "development";

  const result = await Bun.build({
    entrypoints: ["./src/modes.ts"],
    outdir: `./dist/modes-${mode}`,
    env: mode,
    files: {
      "./src/modes.ts": `
console.log("Mode: ${mode}");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("API_URL:", process.env.API_URL);

// Check if process.env exists
console.log("process.env exists:", typeof process.env !== 'undefined');
console.log("process.env keys:", Object.keys(process.env).slice(0, 3));
      `,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    console.log(`${mode} mode:`);
    console.log(`  Description: ${description}`);
    console.log(`  process.env preserved: ${output.includes('process.env')}`);
    console.log(`  NODE_ENV inlined: ${output.includes('"production"') || output.includes('"development"')}`);
    console.log();
  }

  process.env.NODE_ENV = originalEnv;
}

// Example 4: Environment variable types
console.log("4️⃣ Environment Variable Types");
console.log("-------------------------------");

const typesResult = await Bun.build({
  entrypoints: ["./src/types.ts"],
  outdir: "./dist/types",
  env: "inline",
  files: {
    "./src/types.ts": `
// String variables
const stringVars = {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  VERSION: process.env.VERSION,
  EMPTY: process.env.EMPTY_VAR || "default"
};

// Boolean-like strings
const boolVars = {
  DEBUG: process.env.DEBUG === "true",
  PRODUCTION: process.env.NODE_ENV === "production",
  FEATURE_FLAG: process.env.FEATURE_FLAG === "true"
};

// Number-like strings
const numberVars = {
  PORT: parseInt(process.env.PORT || "3000"),
  TIMEOUT: parseInt(process.env.TIMEOUT || "5000"),
  RETRY_COUNT: parseInt(process.env.RETRY_COUNT || "3")
};

// JSON strings
const jsonVars = {
  FEATURES: JSON.parse(process.env.FEATURE_FLAGS || "{}"),
  CONFIG: JSON.parse(process.env.CONFIG || "{}")
};

console.log("String vars:", stringVars);
console.log("Boolean vars:", boolVars);
console.log("Number vars:", numberVars);
console.log("JSON vars:", jsonVars);
    `,
  },
});

if (typesResult.success) {
  console.log("✅ Different env var types handled!");
  const output = await typesResult.outputs[0].text();
  console.log("String inlined:", output.includes('"production"'));
  console.log("Boolean logic preserved:", output.includes('=== "true"'));
  console.log("Parse operations preserved:", output.includes('JSON.parse'));
  console.log();
}

// Example 5: Environment-specific builds
console.log("5️⃣ Environment-Specific Builds");
console.log("---------------------------------");

const environments = [
  {
    name: "development",
    vars: {
      NODE_ENV: "development",
      API_URL: "http://localhost:3000",
      DEBUG: "true",
      LOG_LEVEL: "debug"
    }
  },
  {
    name: "staging",
    vars: {
      NODE_ENV: "staging",
      API_URL: "https://staging-api.example.com",
      DEBUG: "true",
      LOG_LEVEL: "info"
    }
  },
  {
    name: "production",
    vars: {
      NODE_ENV: "production",
      API_URL: "https://api.example.com",
      DEBUG: "false",
      LOG_LEVEL: "error"
    }
  }
];

for (const env of environments) {
  // Set environment variables
  Object.entries(env.vars).forEach(([key, value]) => {
    process.env[key] = value;
  });

  const result = await Bun.build({
    entrypoints: ["./src/env-specific.ts"],
    outdir: `./dist/env-${env.name}`,
    env: "inline",
    files: {
      "./src/env-specific.ts": `
const config = {
  environment: process.env.NODE_ENV,
  apiUrl: process.env.API_URL,
  debug: process.env.DEBUG === "true",
  logLevel: process.env.LOG_LEVEL
};

console.log("${env.name} configuration:", config);

// Environment-specific code
if (process.env.DEBUG === "true") {
  console.log("Debug mode enabled");
  console.log("All environment variables:", {
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    DEBUG: process.env.DEBUG,
    LOG_LEVEL: process.env.LOG_LEVEL
  });
}
      `,
    },
  });

  if (result.success) {
    console.log(`${env.name} build:`);
    const output = await result.outputs[0].text();
    const apiUrlMatch = output.match(/apiUrl:\s*"([^"]+)"/);
    const debugMatch = output.match(/debug:\s*(true|false)/);

    console.log(`  API URL: ${apiUrlMatch?.[1]}`);
    console.log(`  Debug: ${debugMatch?.[1]}`);
    console.log(`  Bundle size: ${output.length} chars`);
  }
  console.log();
}

// Example 6: Security considerations
console.log("6️⃣ Security Considerations");
console.log("----------------------------");

const securityResult = await Bun.build({
  entrypoints: ["./src/security.ts"],
  outdir: "./dist/security",
  env: "inline",
  files: {
    "./src/security.ts": `
// Public variables (safe to inline)
const publicConfig = {
  NODE_ENV: process.env.NODE_ENV,
  VERSION: process.env.VERSION,
  PUBLIC_API_URL: process.env.PUBLIC_API_URL
};

// Sensitive variables (should NOT be inlined)
const sensitiveConfig = {
  SECRET_KEY: process.env.SECRET_KEY, // This will be exposed!
  DATABASE_URL: process.env.DATABASE_URL, // This will be exposed!
  API_TOKEN: process.env.API_TOKEN // This will be exposed!
};

console.log("Public config:", publicConfig);
console.log("Sensitive config:", sensitiveConfig); // DANGER!

// Best practice: Only access sensitive vars at runtime
function getSecretKey() {
  // In production, this should be loaded securely
  return process.env.SECRET_KEY;
}

console.log("Secret key (runtime):", getSecretKey());
    `,
  },
});

if (securityResult.success) {
  const output = await securityResult.outputs[0].text();
  console.log("⚠️  Security Warning!");
  console.log("The following sensitive data is now in your bundle:");

  const secretMatch = output.match(/SECRET_KEY:\s*"([^"]+)"/);
  const dbMatch = output.match(/DATABASE_URL:\s*"([^"]+)"/);
  const tokenMatch = output.match(/API_TOKEN:\s*"([^"]+)"/);

  if (secretMatch) console.log(`  - SECRET_KEY: ${secretMatch[1].substring(0, 10)}...`);
  if (dbMatch) console.log(`  - DATABASE_URL: ${dbMatch[1].substring(0, 10)}...`);
  if (tokenMatch) console.log(`  - API_TOKEN: ${tokenMatch[1].substring(0, 10)}...`);

  console.log("\n💡 Security Best Practices:");
  console.log("  - Never inline secrets with env: 'inline'");
  console.log("  - Use runtime loading for sensitive data");
  console.log("  - Consider env: 'none' for production secrets");
  console.log();
}

// Example 7: env vs define comparison
console.log("7️⃣ env vs define Comparison");
console.log("------------------------------");

// Using env option
const envBuild = await Bun.build({
  entrypoints: ["./src/env-vs-define.ts"],
  outdir: "./dist/env-build",
  env: "inline",
  files: {
    "./src/env-vs-define.ts": `
console.log("Using env option:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Custom:", process.env.CUSTOM_VAR);
    `,
  },
});

// Using define option
const defineBuild = await Bun.build({
  entrypoints: ["./src/env-vs-define.ts"],
  outdir: "./dist/define-build",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.CUSTOM_VAR": '"defined-value"',
  },
  files: {
    "./src/env-vs-define.ts": `
console.log("Using define option:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Custom:", process.env.CUSTOM_VAR);
    `,
  },
});

if (envBuild.success && defineBuild.success) {
  const envOutput = await envBuild.outputs[0].text();
  const defineOutput = await defineBuild.outputs[0].text();

  console.log("env option:");
  console.log(`  - Automatic injection of all process.env.*`);
  console.log(`  - Bundle size: ${envOutput.length} chars`);

  console.log("\ndefine option:");
  console.log(`  - Manual specification of each variable`);
  console.log(`  - Bundle size: ${defineOutput.length} chars`);

  console.log("\nWhen to use:");
  console.log("  - env: Quick injection of many env vars");
  console.log("  - define: Precise control, better for security");
}

// Example 8: Advanced patterns
console.log("\n8️⃣ Advanced Environment Patterns");
console.log("----------------------------------");

const advancedResult = await Bun.build({
  entrypoints: ["./src/advanced.ts"],
  outdir: "./dist/advanced",
  env: "inline",
  files: {
    "./src/advanced.ts": `
// Feature flags from environment
const featureFlags = {
  newUI: process.env.FEATURE_NEW_UI === "true",
  betaAccess: process.env.FEATURE_BETA === "true",
  debugMode: process.env.DEBUG === "true"
};

// Dynamic configuration
const config = {
  api: {
    baseUrl: process.env.API_BASE_URL,
    timeout: parseInt(process.env.API_TIMEOUT || "5000"),
    retries: parseInt(process.env.API_RETRIES || "3")
  },
  auth: {
    provider: process.env.AUTH_PROVIDER || "local",
    sso: process.env.SSO_ENABLED === "true"
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    toConsole: process.env.LOG_TO_CONSOLE !== "false"
  }
};

// Environment-specific initialization
function initialize() {
  if (process.env.NODE_ENV === "development") {
    console.log("🛠️  Development mode");
    console.log("Config:", JSON.stringify(config, null, 2));
  } else {
    console.log("🚀 Production mode");
  }

  if (featureFlags.debugMode) {
    console.log("🐛 Debug features enabled");
  }
}

// Export for use
export { config, featureFlags, initialize };

// Auto-initialize
initialize();
    `,
  },
});

if (advancedResult.success) {
  console.log("✅ Advanced patterns demonstrated!");
  const output = await advancedResult.outputs[0].text();
  console.log("Feature flags inlined:", output.includes('newUI:'));
  console.log("Config object created:", output.includes('api:'));
  console.log("Conditional logic preserved:", output.includes('if ('));
}

// Summary
console.log("\n📋 env Option Summary");
console.log("======================");
console.log("✅ env: 'inline' - Injects all env vars as string literals");
console.log("✅ env: 'none' - Preserves process.env references");
console.log("✅ Enables dead code elimination");
console.log("✅ Works with minification for smaller bundles");
console.log("✅ Automatic injection vs manual define");

console.log("\n💡 Use Cases:");
console.log("-------------");
console.log("• Environment-specific builds");
console.log("• Feature flag management");
console.log("• Configuration injection");
console.log("• Dead code elimination");
console.log("• Build-time optimizations");

console.log("\n⚠️  Security Considerations:");
console.log("-------------------------");
console.log("• NEVER inline secrets with env: 'inline'");
console.log("• Use runtime loading for sensitive data");
console.log("• Consider define for precise control");
console.log("• Audit bundles for exposed secrets");

console.log("\n🔧 Best Practices:");
console.log("------------------");
console.log("• Use env for public config only");
console.log("• Combine with dead code elimination");
console.log("• Different configs per environment");
console.log("• Use define for security-sensitive cases");

console.log("\n✨ env option demonstration complete! 🚀");
