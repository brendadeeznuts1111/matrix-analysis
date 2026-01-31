#!/usr/bin/env bun
/**
 * Practical Bun Build Files Examples
 * Real-world scenarios using different content types
 */

// Make this file a module
export {};

console.log("🔧 Practical Bun Build Files Examples");
console.log("====================================\n");

// Example 1: Generate API client from OpenAPI spec (as ArrayBuffer)
console.log("1️⃣ API Client Generation");
console.log("------------------------");

const openApiSpec = {
  openapi: "3.0.0",
  info: { title: "Example API", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        operationId: "getUsers",
        responses: { "200": { content: { "application/json": { schema: { type: "array" } } } } }
      }
    }
  }
};

// Convert spec to ArrayBuffer
const specBuffer = new TextEncoder().encode(JSON.stringify(openApiSpec, null, 2)).buffer;

const apiClientResult = await Bun.build({
  entrypoints: ["/generated/api-client.ts"],
  files: {
    "/generated/api-client.ts": `
// Generated API client from OpenAPI spec
import spec from "./openapi.json";

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "https://api.example.com") {
    this.baseUrl = baseUrl;
  }

  async getUsers(): Promise<any[]> {
    const response = await fetch(\`\${this.baseUrl}/users\`);
    const data = await response.json();
    return data;
  }
}

export const api = new ApiClient();
export { ApiClient, ApiResponse };
console.log("API client generated from spec version:", spec.info.version);
    `,
    "/generated/openapi.json": specBuffer,
  },
  outdir: "./dist/api-client",
});

if (apiClientResult.success) {
  console.log("✅ API client generated successfully");
  console.log("Files created:", apiClientResult.outputs.length);
}

// Example 2: Environment-specific config (as Blob)
console.log("\n2️⃣ Environment Config Builder");
console.log("------------------------------");

function createConfigBlob(environment: string): Blob {
  const configs = {
    development: {
      apiUrl: "http://localhost:3000",
      debug: true,
      features: { experimental: true },
    },
    production: {
      apiUrl: "https://api.production.com",
      debug: false,
      features: { experimental: false },
    },
    test: {
      apiUrl: "http://test-api.example.com",
      debug: true,
      features: { experimental: false },
    },
  };

  const config = configs[environment as keyof typeof configs];
  return new Blob([`export default ${JSON.stringify(config, null, 2)};`], {
    type: 'text/typescript'
  });
}

// Build for different environments
for (const env of ['development', 'production', 'test']) {
  const configResult = await Bun.build({
    entrypoints: ["/src/app.ts"],
    files: {
      "/src/app.ts": `
import config from "./config.ts";
console.log("Environment:", "${env}");
console.log("API URL:", config.apiUrl);
console.log("Debug mode:", config.debug);
      `,
      "/src/config.ts": createConfigBlob(env),
    },
    outdir: `./dist/${env}`,
  });

  if (configResult.success) {
    console.log(`✅ ${env} config built successfully`);
  }
}

// Example 3: Multi-language bundle (as TypedArray)
console.log("\n3️⃣ Multi-language Resource Bundle");
console.log("-----------------------------------");

const translations = {
  en: { hello: "Hello", goodbye: "Goodbye", welcome: "Welcome" },
  es: { hello: "Hola", goodbye: "Adiós", welcome: "Bienvenido" },
  fr: { hello: "Bonjour", goodbye: "Au revoir", welcome: "Bienvenue" },
  de: { hello: "Hallo", goodbye: "Auf Wiedersehen", welcome: "Willkommen" },
};

for (const [lang, strings] of Object.entries(translations)) {
  const translationTypedArray = new TextEncoder().encode(`
export const translations = ${JSON.stringify(strings, null, 2)};
export const language = "${lang}";

export function t(key: keyof typeof translations): string {
  return translations[key] || key;
}

console.log(\`Loaded \${language} translations\`);
  `);

  const i18nResult = await Bun.build({
    entrypoints: [`/i18n/${lang}.ts`],
    files: {
      [`/i18n/${lang}.ts`]: translationTypedArray,
    },
    outdir: `./dist/i18n`,
  });

  if (i18nResult.success) {
    console.log(`✅ ${lang} translations bundled`);
  }
}

// Example 4: Inline SVG icons (as string)
console.log("\n4️⃣ SVG Icon Bundle");
console.log("-------------------");

const svgIcons = {
  logo: `<svg viewBox="0 0 24 24"><text y="20" font-size="20">🚀</text></svg>`,
  menu: `<svg viewBox="0 0 24 24"><rect y="4" width="20" height="2"/><rect y="10" width="20" height="2"/><rect y="16" width="20" height="2"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>`,
};

const iconBundleResult = await Bun.build({
  entrypoints: ["/icons/index.ts"],
  files: {
    "/icons/index.ts": `
// Icon bundle - all icons as strings
${Object.entries(svgIcons).map(([name, svg]) => 
  `export const ${name}Icon = \`${svg}\`;`
).join('\n')}

export type IconName = keyof typeof icons;

export function getIcon(name: IconName): string {
  const icons = {
    ${Object.keys(svgIcons).map(name => `${name}: ${name}Icon`).join(',\n    ')}
  };
  return icons[name];
}

console.log("Icon bundle loaded with", ${Object.keys(svgIcons).length}, "icons");
    `,
  },
  outdir: "./dist/icons",
});

if (iconBundleResult.success) {
  console.log("✅ SVG icon bundle created");
}

// Example 5: Database schema as TypedArray
console.log("\n5️⃣ Database Schema Bundle");
console.log("--------------------------");

const dbSchema = `
-- Database schema
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const schemaTypedArray = new TextEncoder().encode(dbSchema);

const schemaResult = await Bun.build({
  entrypoints: ["/db/schema-loader.ts"],
  files: {
    "/db/schema-loader.ts": `
// Database schema loader
import schema from "./schema.sql";

export function loadSchema(db: any): void {
  const statements = schema.split(';').filter(s => s.trim());
  statements.forEach(stmt => {
    if (stmt.trim()) {
      db.exec(stmt);
    }
  });
  console.log("Database schema loaded with", ${schemaTypedArray.length}, "bytes");
}

export { schema };
    `,
    "/db/schema.sql": schemaTypedArray,
  },
  outdir: "./dist/db",
});

if (schemaResult.success) {
  console.log("✅ Database schema bundled");
}

// Example 6: Mixed content types - Complete app bundle
console.log("\n6️⃣ Complete App Bundle (Mixed Types)");
console.log("------------------------------------");

const appResult = await Bun.build({
  entrypoints: ["/app/main.ts"],
  files: {
    // Main entrypoint (string)
    "/app/main.ts": `
import { config } from "./config";
import { translations } from "./i18n";
import { api } from "./api";
import { getIcon } from "./icons";

console.log("🚀 App Starting...");
console.log("Config:", JSON.stringify(config, null, 2));
console.log("Translation for 'hello':", translations.hello);
console.log("API base URL:", api.baseUrl);
console.log("Logo icon:", getIcon("logo"));

// Initialize app
api.getUsers().then(users => {
  console.log(\`Fetched \${users.length} users\`);
});
    `,
    // Config as Blob
    "/app/config.ts": new Blob([
      `export const config = {
  name: "MyApp",
  version: "1.0.0",
  buildTime: "${new Date().toISOString()}"
};`
    ], { type: 'text/typescript' }),
    // Translations as TypedArray
    "/app/i18n.ts": new TextEncoder().encode(`
export const translations = {
  hello: "Hello World",
  goodbye: "Goodbye",
  app_name: "My Application"
};
    `),
    // API client as ArrayBuffer
    "/app/api.ts": new TextEncoder().encode(`
export class ApiClient {
  constructor(public baseUrl: string = "https://api.example.com") {}
  
  async getUsers(): Promise<any[]> {
    // Mock implementation
    return [{ id: 1, name: "John" }, { id: 2, name: "Jane" }];
  }
}

export const api = new ApiClient();
    `).buffer,
    // Icons as string
    "/app/icons.ts": `
export const icons = {
  logo: "<svg>🚀</svg>",
  menu: "<svg>☰</svg>",
  close: "<svg>✕</svg>"
};

export function getIcon(name: keyof typeof icons): string {
  return icons[name];
}
    `,
  },
  outdir: "./dist/app",
});

if (appResult.success) {
  console.log("✅ Complete app bundled successfully");
  console.log("Bundle size:", 
    (await Promise.all(appResult.outputs.map(o => o.text())))
      .reduce((sum, text) => sum + text.length, 0), 
    "characters"
  );
}

// Summary
console.log("\n📋 Practical Examples Summary");
console.log("==============================");
console.log("✅ API client from OpenAPI spec (ArrayBuffer)");
console.log("✅ Environment configs (Blob)");
console.log("✅ Multi-language bundles (TypedArray)");
console.log("✅ SVG icon bundle (string)");
console.log("✅ Database schema (TypedArray)");
console.log("✅ Complete app (mixed types)");

console.log("\n💡 Real-world Use Cases:");
console.log("------------------------");
console.log("• Generate code from specs at build time");
console.log("• Create environment-specific builds");
console.log("• Bundle assets without filesystem access");
console.log("• Inline resources for better performance");
console.log("• Create portable, self-contained bundles");

console.log("\n✨ All practical examples completed! 🎉");
