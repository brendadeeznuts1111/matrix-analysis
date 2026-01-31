#!/usr/bin/env bun
/**
 * Bun Build - env with Prefix Pattern Demonstration
 * Shows how to selectively inline environment variables by prefix
 */

// Make this file a module
export {};

console.log("📦 Bun Build - env with Prefix Pattern Demo");
console.log("========================================\n");

// Set test environment variables with different prefixes
process.env.PUBLIC_API_URL = "https://api.example.com";
process.env.PUBLIC_APP_VERSION = "2.1.0";
process.env.PUBLIC_CDN_URL = "https://cdn.example.com";
process.env.PUBLIC_FEATURE_FLAGS = '{"newUI": true, "beta": false}';
process.env.PUBLIC_SENTRY_DSN = "https://sentry.io/123456";

// Private variables (should NOT be inlined)
process.env.SECRET_API_KEY = "super-secret-key";
process.env.DATABASE_URL = "postgresql://user:pass@localhost/db";
process.env.PRIVATE_TOKEN = "private-token-value";
process.env.ADMIN_PASSWORD = "admin123";

// Other public variables with different prefixes
process.env.CLIENT_WEBSOCKET_URL = "wss://ws.example.com";
process.env.CLIENT_GA_ID = "GA-123456789";

// Example 1: Basic PUBLIC_* prefix usage
console.log("1️⃣ Basic PUBLIC_* Prefix Usage");
console.log("-------------------------------");

const publicResult = await Bun.build({
  entrypoints: ["./src/app.ts"],
  outdir: "./dist/public-prefix",
  env: "PUBLIC_*", // Only inline vars starting with PUBLIC_
  files: {
    "./src/app.ts": `
console.log("Public Environment Variables:");
console.log("API URL:", process.env.PUBLIC_API_URL);
console.log("App Version:", process.env.PUBLIC_APP_VERSION);
console.log("CDN URL:", process.env.PUBLIC_CDN_URL);

console.log("\\nPrivate Variables (should not be inlined):");
console.log("Secret Key:", process.env.SECRET_API_KEY);
console.log("Database URL:", process.env.DATABASE_URL);

// Use public vars in configuration
const config = {
  api: {
    url: process.env.PUBLIC_API_URL,
    version: process.env.PUBLIC_APP_VERSION
  },
  cdn: process.env.PUBLIC_CDN_URL,
  secret: process.env.SECRET_API_KEY // This will remain as process.env
};

console.log("Config:", config);
    `,
  },
});

if (publicResult.success) {
  const output = await publicResult.outputs[0].text();
  console.log("✅ PUBLIC_* prefix build successful!");
  console.log("\n--- Generated Code Analysis ---");
  console.log("Public API URL inlined:", output.includes('"https://api.example.com"'));
  console.log("Secret key preserved:", output.includes('process.env.SECRET_API_KEY'));
  console.log("Database URL preserved:", output.includes('process.env.DATABASE_URL'));
  console.log("--- End of Analysis ---\n");
}

// Example 2: Multiple prefix patterns
console.log("2️⃣ Multiple Prefix Patterns");
console.log("----------------------------");

const prefixExamples = [
  {
    prefix: "PUBLIC_*",
    description: "Public-facing configuration",
    vars: ["PUBLIC_API_URL", "PUBLIC_APP_VERSION"]
  },
  {
    prefix: "CLIENT_*",
    description: "Client-side configuration",
    vars: ["CLIENT_WEBSOCKET_URL", "CLIENT_GA_ID"]
  },
  {
    prefix: "VITE_*",
    description: "Vite-style public variables",
    vars: [] // Will use existing vars
  }
];

for (const { prefix, description, vars } of prefixExamples) {
  const result = await Bun.build({
    entrypoints: ["./src/multi.ts"],
    outdir: `./dist/${prefix.replace('*', 'star')}`,
    env: prefix as `${string}*`, // Type assertion to satisfy TypeScript
    files: {
      "./src/multi.ts": `
console.log("=== ${prefix} Variables ===");
console.log("Description: ${description}");

// PUBLIC_* variables
console.log("PUBLIC_API_URL:", process.env.PUBLIC_API_URL);
console.log("PUBLIC_APP_VERSION:", process.env.PUBLIC_APP_VERSION);
console.log("PUBLIC_CDN_URL:", process.env.PUBLIC_CDN_URL);

// CLIENT_* variables
console.log("CLIENT_WEBSOCKET_URL:", process.env.CLIENT_WEBSOCKET_URL);
console.log("CLIENT_GA_ID:", process.env.CLIENT_GA_ID);

// Private variables (should never be inlined)
console.log("SECRET_API_KEY:", process.env.SECRET_API_KEY);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
      `,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    console.log(`\n${prefix}:`);
    console.log(`  Description: ${description}`);

    // Check which variables are inlined
    const publicInlined = output.includes('"https://api.example.com"');
    const clientInlined = output.includes('"wss://ws.example.com"');
    const secretPreserved = output.includes('process.env.SECRET_API_KEY');

    console.log(`  PUBLIC_* inlined: ${publicInlined}`);
    console.log(`  CLIENT_* inlined: ${clientInlined}`);
    console.log(`  Secrets preserved: ${secretPreserved}`);
  }
}

// Example 3: Security comparison
console.log("\n3️⃣ Security Comparison: Prefix vs Inline All");
console.log("-------------------------------------------");

// Build with prefix (secure)
const secureResult = await Bun.build({
  entrypoints: ["./src/secure.ts"],
  outdir: "./dist/secure",
  env: "PUBLIC_*",
  files: {
    "./src/secure.ts": `
const config = {
  // Public (will be inlined)
  publicApi: process.env.PUBLIC_API_URL,
  publicVersion: process.env.PUBLIC_APP_VERSION,

  // Private (will remain as process.env)
  secretKey: process.env.SECRET_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  privateToken: process.env.PRIVATE_TOKEN
};

console.log("Secure config:", config);

// Export for analysis
export { config };
    `,
  },
});

// Build with inline all (insecure)
const insecureResult = await Bun.build({
  entrypoints: ["./src/insecure.ts"],
  outdir: "./dist/insecure",
  env: "inline",
  files: {
    "./src/insecure.ts": `
const config = {
  // Public (will be inlined)
  publicApi: process.env.PUBLIC_API_URL,
  publicVersion: process.env.PUBLIC_APP_VERSION,

  // Private (WILL BE INLINED - DANGER!)
  secretKey: process.env.SECRET_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  privateToken: process.env.PRIVATE_TOKEN
};

console.log("Insecure config:", config);

// Export for analysis
export { config };
    `,
  },
});

if (secureResult.success && insecureResult.success) {
  const secureOutput = await secureResult.outputs[0].text();
  const insecureOutput = await insecureResult.outputs[0].text();

  console.log("Secure build (PUBLIC_*):");
  console.log(`  Public API inlined: ${secureOutput.includes('"https://api.example.com"')}`);
  console.log(`  Secret key preserved: ${secureOutput.includes('process.env.SECRET_API_KEY')}`);
  console.log(`  Bundle size: ${secureOutput.length} chars`);

  console.log("\nInsecure build (inline):");
  console.log(`  Public API inlined: ${insecureOutput.includes('"https://api.example.com"')}`);
  console.log(`  Secret key exposed: ${insecureOutput.includes('"super-secret-key"')}`);
  console.log(`  Bundle size: ${insecureOutput.length} chars`);

  console.log("\n⚠️  Security Analysis:");
  console.log(`  Secrets in insecure bundle: ${insecureOutput.includes('super-secret-key') ? 'EXPOSED!' : 'Safe'}`);
}

// Example 4: Real-world usage patterns
console.log("\n4️⃣ Real-world Usage Patterns");
console.log("------------------------------");

const realWorldResult = await Bun.build({
  entrypoints: ["./src/realworld.ts"],
  outdir: "./dist/realworld",
  env: "PUBLIC_*",
  files: {
    "./src/realworld.ts": `
// Configuration object with public and private parts
const appConfig = {
  // Public configuration (client-side)
  public: {
    apiUrl: process.env.PUBLIC_API_URL,
    cdnUrl: process.env.PUBLIC_CDN_URL,
    version: process.env.PUBLIC_APP_VERSION,
    sentryDsn: process.env.PUBLIC_SENTRY_DSN,
    features: JSON.parse(process.env.PUBLIC_FEATURE_FLAGS || "{}")
  },

  // Private configuration (server-side only)
  private: {
    secretKey: process.env.SECRET_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    adminPassword: process.env.ADMIN_PASSWORD
  }
};

// Client-side application
class ClientApp {
  constructor() {
    this.api = new ApiClient(appConfig.public.apiUrl);
    this.tracker = new Sentry(appConfig.public.sentryDsn);
    this.version = appConfig.public.version;
  }

  initialize() {
    console.log("Client app initialized with public config");
    console.log("API:", this.api.baseUrl);
    console.log("Version:", this.version);

    // Private config is not accessible here
    console.log("Secret accessible:", typeof appConfig.private.secretKey);
  }
}

// Server-side application
class ServerApp {
  constructor() {
    this.db = new Database(appConfig.private.databaseUrl);
    this.auth = new AuthService(appConfig.private.secretKey);
  }

  start() {
    console.log("Server app started with private config");
    console.log("Database connected:", !!this.db);
    console.log("Auth service ready:", !!this.auth);
  }
}

// Utility functions
export function getClientConfig() {
  return appConfig.public; // Only return public part
}

export function getServerConfig() {
  return appConfig; // Full config (server-side)
}

// Demo
console.log("=== Real-world Demo ===");
const client = new ClientApp();
client.initialize();

// Note: ServerApp would only be instantiated on the server
console.log("Client config safe to expose:", getClientConfig());
    `,
  },
});

if (realWorldResult.success) {
  const output = await realWorldResult.outputs[0].text();
  console.log("✅ Real-world pattern demonstration!");
  console.log("\nAnalysis:");
  console.log("  Public config inlined:", output.includes('"https://api.example.com"'));
  console.log("  Private config preserved:", output.includes('process.env.SECRET_API_KEY'));
  console.log("  Client-side safety:", output.includes('getClientConfig'));
}

// Example 5: Advanced prefix patterns
console.log("\n5️⃣ Advanced Prefix Patterns");
console.log("----------------------------");

const advancedPatterns = [
  {
    prefix: "REACT_APP_*",
    description: "Create React App pattern",
    setup: () => {
      process.env.REACT_APP_API_URL = "https://react-api.example.com";
      process.env.REACT_APP_ENV = "production";
    }
  },
  {
    prefix: "VUE_APP_*",
    description: "Vue CLI pattern",
    setup: () => {
      process.env.VUE_APP_API_URL = "https://vue-api.example.com";
      process.env.VUE_APP_VERSION = "3.0.0";
    }
  },
  {
    prefix: "ANGULAR_*",
    description: "Angular pattern",
    setup: () => {
      process.env.ANGULAR_ENV = "production";
      process.env.ANGULAR_API_URL = "https://angular-api.example.com";
    }
  },
  {
    prefix: "NEXT_PUBLIC_*",
    description: "Next.js pattern",
    setup: () => {
      process.env.NEXT_PUBLIC_API_URL = "https://next-api.example.com";
      process.env.NEXT_PUBLIC_VERCEL_URL = "https://example.vercel.app";
    }
  }
];

for (const { prefix, description, setup } of advancedPatterns) {
  // Setup environment
  setup();

  const result = await Bun.build({
    entrypoints: ["./src/advanced.ts"],
    outdir: `./dist/${prefix.toLowerCase().replace('*', '')}`,
    env: prefix as `${string}*`, // Type assertion to satisfy TypeScript
    files: {
      "./src/advanced.ts": `
console.log("=== ${prefix} Pattern ===");
console.log("Framework: ${description}");

// Different framework patterns
console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
console.log("VUE_APP_API_URL:", process.env.VUE_APP_API_URL);
console.log("ANGULAR_API_URL:", process.env.ANGULAR_API_URL);
console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

// Always preserved
console.log("SECRET_API_KEY:", process.env.SECRET_API_KEY);
      `,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    const hasMatchingPrefix = prefix.includes("REACT") ? output.includes("https://react-api") :
                            prefix.includes("VUE") ? output.includes("https://vue-api") :
                            prefix.includes("ANGULAR") ? output.includes("https://angular-api") :
                            prefix.includes("NEXT") ? output.includes("https://next-api") : false;

    console.log(`\n${prefix}:`);
    console.log(`  Framework: ${description}`);
    console.log(`  Variables inlined: ${hasMatchingPrefix}`);
    console.log(`  Secrets preserved: ${output.includes('process.env.SECRET_API_KEY')}`);
  }
}

// Example 6: Performance comparison
console.log("\n6️⃣ Performance Comparison");
console.log("--------------------------");

const performanceResult = await Bun.build({
  entrypoints: ["./src/performance.ts"],
  outdir: "./dist/performance",
  env: "PUBLIC_*",
  minify: true,
  files: {
    "./src/performance.ts": `
// Large app with many environment variables
const config = {
  // Public variables (inlined)
  PUBLIC_API_URL: process.env.PUBLIC_API_URL,
  PUBLIC_APP_VERSION: process.env.PUBLIC_APP_VERSION,
  PUBLIC_CDN_URL: process.env.PUBLIC_CDN_URL,
  PUBLIC_FEATURE_FLAGS: process.env.PUBLIC_FEATURE_FLAGS,
  PUBLIC_SENTRY_DSN: process.env.PUBLIC_SENTRY_DSN,

  // Private variables (preserved)
  SECRET_API_KEY: process.env.SECRET_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  PRIVATE_TOKEN: process.env.PRIVATE_TOKEN,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

  // Mixed usage
  endpoints: {
    api: process.env.PUBLIC_API_URL + "/v1",
    auth: process.env.PUBLIC_API_URL + "/auth",
    ws: process.env.PUBLIC_CDN_URL?.replace("https", "wss") + "/ws"
  }
};

// Application code
class App {
  constructor() {
    this.version = config.PUBLIC_APP_VERSION;
    this.api = config.PUBLIC_API_URL;
    this.features = JSON.parse(config.PUBLIC_FEATURE_FLAGS);
  }

  start() {
    console.log("App v" + this.version + " starting");
    console.log("API: " + this.api);
    console.log("Features:", this.features);
  }
}

// Initialize
const app = new App();
app.start();
    `,
  },
});

if (performanceResult.success) {
  const output = await performanceResult.outputs[0].text();
  console.log("✅ Performance test complete!");
  console.log(`Bundle size: ${output.length} characters`);
  console.log("Public vars inlined:", output.includes('"https://api.example.com"'));
  console.log("Private vars preserved:", output.includes('process.env.SECRET_API_KEY'));
  console.log("Optimized for production:", !output.includes('process.env.PUBLIC_'));
}

// Summary
console.log("\n📋 env Prefix Pattern Summary");
console.log("=============================");
console.log("✅ PUBLIC_* - Only inline vars starting with PUBLIC_");
console.log("✅ CLIENT_* - Client-side configuration pattern");
console.log("✅ VITE_* - Vite-style public variables");
console.log("✅ REACT_APP_* - Create React App pattern");
console.log("✅ NEXT_PUBLIC_* - Next.js pattern");
console.log("✅ Custom prefixes - Any pattern with *");

console.log("\n💡 Security Benefits:");
console.log("---------------------");
console.log("• Prevents accidental secret exposure");
console.log("• Clear separation of public/private");
console.log("• Team-friendly conventions");
console.log("• Audit-ready variable naming");

console.log("\n🔧 Use Cases:");
console.log("-------------");
console.log("• Public API URLs");
console.log("• Client-side feature flags");
console.log("• CDN endpoints");
console.log("• Analytics tracking IDs");
console.log("• Public configuration");

console.log("\n⚠️  Best Practices:");
console.log("-------------------");
console.log("• Use consistent prefixes (PUBLIC_, CLIENT_)");
console.log("• Never put secrets in public-prefixed vars");
console.log("• Document your prefix conventions");
console.log("• Use different prefixes per environment");
console.log("• Combine with runtime validation");

console.log("\n✨ env prefix pattern demonstration complete! 🚀");
