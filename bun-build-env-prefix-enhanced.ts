#!/usr/bin/env bun
/**
 * Bun Build - Enhanced env with Prefix Pattern Demonstration
 * Shows how to selectively inline environment variables by prefix
 * Enhanced with more examples, better output, and comprehensive testing
 */

// Make this file a module
export {};

console.log("📦 Bun Build - Enhanced env Prefix Pattern Demo");
console.log("===============================================\n");

// Helper function to create colored output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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
process.env.VITE_APP_TITLE = "My Vite App";
process.env.REACT_APP_ENVIRONMENT = "production";

// Example 1: Basic PUBLIC_* prefix usage with detailed analysis
console.log("1️⃣ Basic PUBLIC_* Prefix Usage");
colorLog("cyan", "-------------------------------");

const publicResult = await Bun.build({
  entrypoints: ["./src/app.ts"],
  outdir: "./dist/public-prefix",
  env: "PUBLIC_*",
  minify: false,
  files: {
    "./src/app.ts": `
console.log("=== Environment Variables Analysis ===");

// Public variables (will be inlined)
const publicVars = {
  apiUrl: process.env.PUBLIC_API_URL,
  version: process.env.PUBLIC_APP_VERSION,
  cdnUrl: process.env.PUBLIC_CDN_URL,
  features: JSON.parse(process.env.PUBLIC_FEATURE_FLAGS || "{}"),
  sentryDsn: process.env.PUBLIC_SENTRY_DSN
};

// Private variables (should remain as process.env)
const privateVars = {
  secretKey: process.env.SECRET_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  token: process.env.PRIVATE_TOKEN,
  password: process.env.ADMIN_PASSWORD
};

console.log("Public variables (inlined):", publicVars);
console.log("Private variables (preserved):", privateVars);

// Test conditional logic
if (publicVars.features.newUI) {
  console.log("✨ New UI is enabled!");
}

// Test string interpolation
const welcomeMessage = \`Welcome to version \${publicVars.version}\`;
console.log(welcomeMessage);
    `,
  },
});

if (publicResult.success) {
  colorLog("green", "✅ Build successful!");
  const output = await publicResult.outputs[0].text();
  
  console.log("\n--- Generated Code Analysis ---");
  
  // Check what was inlined
  const inlinedVars = [];
  if (output.includes('"https://api.example.com"')) inlinedVars.push("PUBLIC_API_URL");
  if (output.includes('"2.1.0"')) inlinedVars.push("PUBLIC_APP_VERSION");
  if (output.includes('"https://cdn.example.com"')) inlinedVars.push("PUBLIC_CDN_URL");
  if (output.includes('"{"newUI": true, "beta": false}"')) inlinedVars.push("PUBLIC_FEATURE_FLAGS");
  if (output.includes('"https://sentry.io/123456"')) inlinedVars.push("PUBLIC_SENTRY_DSN");
  
  // Check what was preserved
  const preservedVars = [];
  if (output.includes('process.env.SECRET_API_KEY')) preservedVars.push("SECRET_API_KEY");
  if (output.includes('process.env.DATABASE_URL')) preservedVars.push("DATABASE_URL");
  if (output.includes('process.env.PRIVATE_TOKEN')) preservedVars.push("PRIVATE_TOKEN");
  if (output.includes('process.env.ADMIN_PASSWORD')) preservedVars.push("ADMIN_PASSWORD");
  
  console.log(`\n${colors.yellow}Inlined variables (${inlinedVars.length}):${colors.reset}`);
  inlinedVars.forEach(v => console.log(`  ✓ ${v}`));
  
  console.log(`\n${colors.yellow}Preserved variables (${preservedVars.length}):${colors.reset}`);
  preservedVars.forEach(v => console.log(`  ✓ ${v}`));
  
  console.log(`\nBundle size: ${output.length} characters`);
}

// Example 2: Multiple prefixes with comparison table
console.log("\n2️⃣ Multiple Prefix Patterns Comparison");
colorLog("cyan", "------------------------------------");

const prefixExamples = [
  {
    prefix: "PUBLIC_*",
    description: "Public-facing configuration",
    expectedMatches: ["PUBLIC_API_URL", "PUBLIC_APP_VERSION", "PUBLIC_CDN_URL", "PUBLIC_FEATURE_FLAGS", "PUBLIC_SENTRY_DSN"]
  },
  {
    prefix: "CLIENT_*",
    description: "Client-side configuration",
    expectedMatches: ["CLIENT_WEBSOCKET_URL", "CLIENT_GA_ID"]
  },
  {
    prefix: "SECRET_*",
    description: "Secret configuration (for testing)",
    expectedMatches: ["SECRET_API_KEY"]
  },
  {
    prefix: "NONEXISTENT_*",
    description: "No matching variables",
    expectedMatches: []
  }
];

console.log("Prefix Pattern | Matches | Inlined | Preserved");
console.log("--------------|---------|---------|----------");

for (const { prefix, description, expectedMatches } of prefixExamples) {
  const result = await Bun.build({
    entrypoints: ["./src/multi.ts"],
    outdir: `./dist/${prefix.replace('*', 'star')}`,
    env: prefix as `${string}*`,
    files: {
      "./src/multi.ts": `
// Testing prefix: ${prefix}
console.log("API URL:", process.env.PUBLIC_API_URL);
console.log("App Version:", process.env.PUBLIC_APP_VERSION);
console.log("CDN URL:", process.env.PUBLIC_CDN_URL);
console.log("Feature Flags:", process.env.PUBLIC_FEATURE_FLAGS);
console.log("Sentry DSN:", process.env.PUBLIC_SENTRY_DSN);
console.log("WebSocket URL:", process.env.CLIENT_WEBSOCKET_URL);
console.log("GA ID:", process.env.CLIENT_GA_ID);
console.log("Secret Key:", process.env.SECRET_API_KEY);
console.log("Database URL:", process.env.DATABASE_URL);
console.log("Private Token:", process.env.PRIVATE_TOKEN);
      `,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    
    // Count inlined and preserved
    const processEnvMatches = output.match(/process\.env\./g) || [];
    const stringLiterals = output.match(/"[^"]*https?:\/\/[^"]*"/g) || [];
    
    const inlined = expectedMatches.filter(v => {
      const value = process.env[v.replace('PUBLIC_', '').replace('CLIENT_', '').replace('SECRET_', '')];
      return value && output.includes(`"${value}"`);
    }).length;
    
    const preserved = processEnvMatches.length;
    
    console.log(`${prefix.padEnd(13)} | ${expectedMatches.length.toString().padEnd(7)} | ${inlined.toString().padEnd(7)} | ${preserved}`);
  }
}

// Example 3: Security audit with risk levels
console.log("\n3️⃣ Security Audit - Risk Assessment");
colorLog("cyan", "---------------------------------");

const securityTests = [
  {
    name: "Safe - PUBLIC_* only",
    env: "PUBLIC_*" as const,
    risk: "LOW",
    description: "Only public variables inlined"
  },
  {
    name: "Medium - CLIENT_* only",
    env: "CLIENT_*" as const,
    risk: "MEDIUM",
    description: "Client variables inlined"
  },
  {
    name: "High - SECRET_* exposed",
    env: "SECRET_*" as const,
    risk: "HIGH",
    description: "Secret variables inlined"
  },
  {
    name: "Critical - All variables",
    env: "inline" as const,
    risk: "CRITICAL",
    description: "All variables inlined"
  }
];

console.log("Risk Level | Variables Inlined | Security Status");
console.log("-----------|------------------|-----------------");

for (const test of securityTests) {
  const result = await Bun.build({
    entrypoints: ["./src/security.ts"],
    outdir: `./dist/security-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
    env: test.env,
    files: {
      "./src/security.ts": `
const config = {
  // Public
  publicApi: process.env.PUBLIC_API_URL,
  publicVersion: process.env.PUBLIC_APP_VERSION,
  
  // Client
  websocket: process.env.CLIENT_WEBSOCKET_URL,
  analytics: process.env.CLIENT_GA_ID,
  
  // Secret
  secretKey: process.env.SECRET_API_KEY,
  database: process.env.DATABASE_URL,
  privateToken: process.env.PRIVATE_TOKEN
};

console.log("Config loaded");
      `,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    
    // Check for secrets
    const hasSecrets = output.includes('"super-secret-key"') || 
                      output.includes('"postgresql://') ||
                      output.includes('"private-token-value"');
    
    const statusColor = hasSecrets ? 'red' : 'green';
    const status = hasSecrets ? '⚠️ SECRETS EXPOSED' : '✅ SECURE';
    
    const riskColor = test.risk === 'CRITICAL' ? 'red' : 
                     test.risk === 'HIGH' ? 'yellow' : 
                     test.risk === 'MEDIUM' ? 'cyan' : 'green';
    
    console.log(`${colors[riskColor]}${test.risk.padEnd(11)}${colors.reset} | ${output.length.toString().padEnd(16)} | ${colors[statusColor]}${status}${colors.reset}`);
  }
}

// Example 4: Real-world application patterns
console.log("\n4️⃣ Real-world Application Patterns");
colorLog("cyan", "--------------------------------");

const appPatterns = [
  {
    name: "React Application",
    prefix: "REACT_APP_*",
    env: {
      "REACT_APP_API_URL": "https://api.reactapp.com",
      "REACT_APP_ENVIRONMENT": "production",
      "REACT_APP_VERSION": "1.0.0"
    },
    code: `
import React from 'react';

function App() {
  const config = {
    apiUrl: process.env.REACT_APP_API_URL,
    environment: process.env.REACT_APP_ENVIRONMENT,
    version: process.env.REACT_APP_VERSION
  };
  
  return React.createElement('div', null, 
    React.createElement('h1', null, 'React App'),
    React.createElement('p', null, \`Environment: \${config.environment}\`)
  );
}

export default App;
    `
  },
  {
    name: "Vue Application",
    prefix: "VUE_*",
    env: {
      "VUE_APP_TITLE": "My Vue App",
      "VUE_APP_API_BASE": "https://api.vueapp.com"
    },
    code: `
const VueApp = {
  config: {
    title: process.env.VUE_APP_TITLE,
    apiBase: process.env.VUE_APP_API_BASE
  },
  
  init() {
    console.log(\`Initializing \${this.config.title}\`);
    console.log(\`API: \${this.config.apiBase}\`);
  }
};

VueApp.init();
    `
  },
  {
    name: "Node.js API",
    prefix: "SERVER_*",
    env: {
      "SERVER_PORT": "3000",
      "SERVER_HOST": "0.0.0.0",
      "SERVER_CORS_ORIGIN": "https://example.com"
    },
    code: `
const server = {
  config: {
    port: parseInt(process.env.SERVER_PORT || "3000"),
    host: process.env.SERVER_HOST || "localhost",
    corsOrigin: process.env.SERVER_CORS_ORIGIN
  },
  
  start() {
    console.log(\`Server starting on \${this.config.host}:\${this.config.port}\`);
    console.log(\`CORS origin: \${this.config.corsOrigin}\`);
  }
};

server.start();
    `
  }
];

for (const app of appPatterns) {
  // Set environment variables
  Object.entries(app.env).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  const result = await Bun.build({
    entrypoints: ["./src/app-pattern.ts"],
    outdir: `./dist/${app.name.toLowerCase().replace(/\s+/g, '-')}`,
    env: app.prefix as `${string}*`,
    files: {
      "./src/app-pattern.ts": app.code,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    
    console.log(`\n${colors.magenta}${app.name}:${colors.reset}`);
    console.log(`  Prefix: ${app.prefix}`);
    
    // Check inlined values
    const inlinedCount = Object.keys(app.env).filter(key => {
      const value = app.env[key as keyof typeof app.env];
      return output.includes(`"${value}"`);
    }).length;
    
    console.log(`  Variables inlined: ${inlinedCount}/${Object.keys(app.env).length}`);
    console.log(`  Bundle size: ${output.length} chars`);
  }
}

// Example 5: Performance optimization analysis
console.log("\n5️⃣ Performance Optimization Analysis");
colorLog("cyan", "------------------------------------");

const performanceTests = [
  {
    name: "No env inlining",
    env: "disable" as const,
    description: "All process.env preserved"
  },
  {
    name: "Selective inlining",
    env: "PUBLIC_*" as const,
    description: "Only PUBLIC_* inlined"
  },
  {
    name: "Full inlining",
    env: "inline" as const,
    description: "All variables inlined"
  }
];

const complexCode = `
// Complex application with many environment variables
class ComplexApp {
  constructor() {
    this.config = {
      // Public configuration
      apiUrl: process.env.PUBLIC_API_URL,
      cdnUrl: process.env.PUBLIC_CDN_URL,
      version: process.env.PUBLIC_APP_VERSION,
      features: JSON.parse(process.env.PUBLIC_FEATURE_FLAGS || "{}"),
      
      // Server configuration
      port: parseInt(process.env.SERVER_PORT || "3000"),
      host: process.env.SERVER_HOST || "localhost",
      
      // Database configuration
      databaseUrl: process.env.DATABASE_URL,
      redisUrl: process.env.REDIS_URL,
      
      // Authentication
      jwtSecret: process.env.JWT_SECRET,
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
      
      // External services
      sentryDsn: process.env.PUBLIC_SENTRY_DSN,
      analyticsKey: process.env.ANALYTICS_KEY,
      
      // Feature flags
      enableBeta: process.env.ENABLE_BETA === "true",
      enableDebug: process.env.ENABLE_DEBUG === "true"
    };
  }
  
  initialize() {
    console.log("Initializing complex application...");
    console.log("Configuration loaded:", Object.keys(this.config).length, "settings");
    
    if (this.config.features.newUI) {
      console.log("New UI enabled");
    }
    
    if (this.config.enableDebug) {
      console.log("Debug mode active");
    }
  }
}

const app = new ComplexApp();
app.initialize();
`;

// Set additional env vars for complex test
process.env.SERVER_PORT = "3000";
process.env.SERVER_HOST = "localhost";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "jwt-secret";
process.env.BCRYPT_ROUNDS = "12";
process.env.ANALYTICS_KEY = "analytics-123";
process.env.ENABLE_BETA = "true";
process.env.ENABLE_DEBUG = "false";

console.log("Test Type              | Bundle Size | Size Reduction");
console.log("----------------------|------------|----------------");

let baselineSize = 0;

for (const test of performanceTests) {
  const result = await Bun.build({
    entrypoints: ["./src/complex.ts"],
    outdir: `./dist/perf-${test.name.toLowerCase().replace(/\s+/g, '-')}`,
    env: test.env,
    minify: false,
    files: {
      "./src/complex.ts": complexCode,
    },
  });

  if (result.success) {
    const output = await result.outputs[0].text();
    const size = output.length;
    
    if (baselineSize === 0) baselineSize = size;
    
    const reduction = baselineSize > size ? 
      `${((baselineSize - size) / baselineSize * 100).toFixed(1)}%` : 
      "0.0%";
    
    console.log(`${test.name.padEnd(22)} | ${size.toString().padEnd(10)} | ${reduction}`);
  }
}

// Example 6: Best practices and recommendations
console.log("\n6️⃣ Best Practices & Recommendations");
colorLog("cyan", "----------------------------------");

const recommendations = [
  {
    category: "Security",
    practices: [
      "✅ Always use prefix patterns for client-side builds",
      "✅ Never inline secrets with env: 'inline'",
      "✅ Use PUBLIC_* or CLIENT_* for public variables",
      "✅ Keep sensitive data in SERVER_* or SECRET_*",
      "✅ Audit bundles for exposed credentials"
    ]
  },
  {
    category: "Performance",
    practices: [
      "✅ Inline frequently accessed variables",
      "✅ Use selective inlining for better tree-shaking",
      "✅ Combine with minification for production",
      "✅ Consider bundle size vs runtime flexibility",
      "✅ Test different strategies for your use case"
    ]
  },
  {
    category: "Development",
    practices: [
      "✅ Use descriptive prefixes (REACT_APP_, VUE_)",
      "✅ Document your environment variable conventions",
      "✅ Use different prefixes per environment",
      "✅ Validate environment variables at runtime",
      "✅ Provide default values for optional variables"
    ]
  }
];

for (const { category, practices } of recommendations) {
  console.log(`\n${colors.yellow}${category}:${colors.reset}`);
  practices.forEach(practice => {
    const isGood = practice.startsWith("✅");
    const color = isGood ? "green" : "red";
    console.log(`  ${colors[color]}${practice}${colors.reset}`);
  });
}

// Summary
console.log("\n" + "=".repeat(50));
colorLog("bright", "🎯 Enhanced env Prefix Pattern Summary");
console.log("=".repeat(50));

console.log(`\n${colors.cyan}Key Features Demonstrated:${colors.reset}`);
console.log("• Selective inlining by prefix pattern");
console.log("• Security risk assessment");
console.log("• Performance optimization analysis");
console.log("• Real-world application patterns");
console.log("• Best practices and recommendations");

console.log(`\n${colors.cyan}Prefix Patterns:${colors.reset}`);
console.log("• PUBLIC_* - General public configuration");
console.log("• CLIENT_* - Client-side settings");
console.log("• REACT_APP_* - Create React App");
console.log("• VUE_* - Vue.js applications");
console.log("• SERVER_* - Server-side configuration");

console.log(`\n${colors.cyan}Security Levels:${colors.reset}`);
console.log("• LOW - Only public variables inlined");
console.log("• MEDIUM - Client variables inlined");
console.log("• HIGH - Some secrets exposed");
console.log("• CRITICAL - All variables inlined");

console.log(`\n${colors.green}✨ Enhanced demonstration complete! 🚀${colors.reset}`);
console.log("\nTo run specific examples:");
console.log("  bun run build:env-prefix          # Basic example");
console.log("  bun run build:env-prefix-examples # Exact doc examples");
