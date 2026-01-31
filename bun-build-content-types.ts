#!/usr/bin/env bun
/**
 * Bun Bundler Content Types Demonstration
 * Shows all supported file types and how they're handled
 */

// Make this file a module
export {};

console.log("📦 Bun Bundler Content Types Demo");
console.log("=================================\n");

// Example 1: JavaScript/TypeScript files
console.log("1️⃣ JavaScript/TypeScript Files");
console.log("-------------------------------");

const jsResult = await Bun.build({
  entrypoints: ["/app/index.tsx"],
  files: {
    "/app/index.tsx": `
import React from "react";
import { User } from "./types.ts";
import { utils } from "./utils.js";

const user: User = { id: 1, name: "John", age: 30 };
console.log("User:", user);
console.log("Utils:", utils);

// JSX component
const App = () => <div>Hello World</div>;
export default App;
    `,
    "/app/types.ts": `
export interface User {
  id: number;
  name: string;
  age: number;
}

export type Status = "active" | "inactive";
    `,
    "/app/utils.js": `
export const utils = {
  format: (str: string) => str.toUpperCase(),
  random: () => Math.random()
};
    `,
  },
});

if (jsResult.success) {
  const output = await jsResult.outputs[0].text();
  console.log("✅ TypeScript/JSX bundled successfully");
  console.log("Features: Transpilation, JSX, interfaces, type imports");
  console.log("Bundle size:", output.length, "characters\n");
}

// Example 2: JSON files
console.log("2️⃣ JSON Files");
console.log("-------------");

const jsonResult = await Bun.build({
  entrypoints: ["/app/json-test.ts"],
  files: {
    "/app/json-test.ts": `
import pkg from "./package.json";
import config from "./config.json";
import data from "./data.json";

console.log("Package name:", pkg.name);
console.log("Package version:", pkg.version);
console.log("Config environment:", config.environment);
console.log("Database host:", config.database.host);
console.log("Data items:", data.items.length);
    `,
    "/app/package.json": JSON.stringify({
      name: "my-bun-app",
      version: "1.0.0",
      description: "A Bun application",
      scripts: {
        start: "bun run index.ts"
      }
    }, null, 2),
    "/app/config.json": JSON.stringify({
      environment: "production",
      database: {
        host: "localhost",
        port: 5432,
        name: "myapp"
      },
      features: {
        auth: true,
        logging: false
      }
    }, null, 2),
    "/app/data.json": JSON.stringify({
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" }
      ],
      total: 3
    }, null, 2),
  },
});

if (jsonResult.success) {
  const output = await jsonResult.outputs[0].text();
  console.log("✅ JSON files inlined as JavaScript objects");
  console.log("Features: Parsing, inlining, type inference");
  console.log("Bundle size:", output.length, "characters\n");
}

// Example 3: JSONC (JSON with comments)
console.log("3️⃣ JSONC Files (JSON with Comments)");
console.log("------------------------------------");

const jsoncResult = await Bun.build({
  entrypoints: ["/app/jsonc-test.ts"],
  files: {
    "/app/jsonc-test.ts": `
import config from "./settings.jsonc";
import schema from "./schema.jsonc";

console.log("App name:", config.app.name);
console.log("Debug mode:", config.app.debug);
console.log("Server port:", config.server.port);
console.log("Database name:", config.database.name);

console.log("Schema version:", schema.version);
console.log("Schema tables:", schema.tables.length);
    `,
    "/app/settings.jsonc": `
{
  // Application settings
  "app": {
    "name": "MyApp", // Application name
    "debug": false, // Enable debug mode
    "version": "1.0.0"
  },
  
  /* Server configuration */
  "server": {
    "host": "localhost",
    "port": 3000
  },
  
  // Database settings
  "database": {
    "name": "myapp_db",
    "ssl": true /* Enable SSL */
  }
}
    `,
    "/app/schema.jsonc": `
{
  // Database schema definition
  "version": "2024-01-01",
  "tables": [
    {
      "name": "users",
      "columns": ["id", "name", "email", "created_at"]
    },
    {
      "name": "posts",
      "columns": ["id", "user_id", "title", "content", "created_at"]
    }
  ]
}
    `,
  },
});

if (jsoncResult.success) {
  console.log("✅ JSONC files parsed with comments stripped");
  console.log("Features: Comment parsing, inlining\n");
}

// Example 4: TOML files
console.log("4️⃣ TOML Files");
console.log("---------------");

const tomlResult = await Bun.build({
  entrypoints: ["/app/toml-test.ts"],
  files: {
    "/app/toml-test.ts": `
import bunfig from "./bunfig.toml";
import config from "./app.toml";

console.log("Bun log level:", bunfig.logLevel);
console.log("Bun preload:", bunfig.preload);
console.log("App name:", config.app.name);
console.log("App port:", config.server.port);
console.log("Database URL:", config.database.url);
    `,
    "/app/bunfig.toml": `
# Bun configuration file
logLevel = "debug"

[preload]
"./global-setup.js"
"./test-setup.js"

[define]
API_KEY = "\"secret-key\""
NODE_ENV = "\"production\""
    `,
    "/app/app.toml": `
[app]
name = "MyApplication"
version = "1.0.0"
debug = false

[server]
host = "0.0.0.0"
port = 8080
workers = 4

[database]
url = "postgresql://user:pass@localhost/db"
max_connections = 100
timeout = 30

[cache]
redis_url = "redis://localhost:6379"
ttl = 3600
    `,
  },
});

if (tomlResult.success) {
  console.log("✅ TOML files parsed and inlined");
  console.log("Features: Section parsing, array support, nested structures\n");
}

// Example 5: YAML files
console.log("5️⃣ YAML Files");
console.log("---------------");

const yamlResult = await Bun.build({
  entrypoints: ["/app/yaml-test.ts"],
  files: {
    "/app/yaml-test.ts": `
import config from "./config.yaml";
import deployment from "./deployment.yaml";

console.log("Application:", config.app.name);
console.log("Environment:", config.app.environment);
console.log("Features:", config.features);

console.log("Deployment name:", deployment.metadata.name);
console.log("Replicas:", deployment.spec.replicas);
console.log("Container image:", deployment.spec.containers[0].image);
    `,
    "/app/config.yaml": `
app:
  name: "my-yaml-app"
  version: "2.0.0"
  environment: "production"

features:
  - authentication
  - logging
  - metrics
  - caching

database:
  host: "db.example.com"
  port: 5432
  name: "myapp"

logging:
  level: "info"
  format: "json"
  outputs:
    - "console"
    - "file"
    `,
    "/app/deployment.yaml": `
apiVersion: "apps/v1"
kind: "Deployment"
metadata:
  name: "my-app"
  labels:
    app: "my-app"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: "my-app"
  template:
    metadata:
      labels:
        app: "my-app"
    spec:
      containers:
        - name: "app"
          image: "myapp:latest"
          ports:
            - containerPort: 3000
          env:
            - name: "NODE_ENV"
              value: "production"
            `,
  },
});

if (yamlResult.success) {
  console.log("✅ YAML files parsed and inlined");
  console.log("Features: List parsing, nested objects, anchors\n");
}

// Example 6: Text files
console.log("6️⃣ Text Files");
console.log("--------------");

const textResult = await Bun.build({
  entrypoints: ["/app/text-test.ts"],
  files: {
    "/app/text-test.ts": `
import readme from "./README.txt";
import license from "./LICENSE.txt";
import changelog from "./CHANGELOG.txt";

console.log("README length:", readme.length, "characters");
console.log("First line:", readme.split('\\n')[0]);
console.log("License type:", license.split('\\n')[0]);
console.log("Latest version:", changelog.split('\\n')[0]);
    `,
    "/app/README.txt": `
My Awesome Application
======================

This is a sample application demonstrating Bun's text file support.

Features:
- Fast bundling
- Multiple file type support
- In-memory bundling

Installation:
bun install
bun run start
    `.trim(),
    "/app/LICENSE.txt": `
MIT License

Copyright (c) 2024 My Application

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
    `.trim(),
    "/app/CHANGELOG.txt": `
## [2.0.0] - 2024-01-15
### Added
- YAML file support
- Performance improvements

## [1.1.0] - 2024-01-01
### Added
- JSONC support
- Text file support

## [1.0.0] - 2023-12-15
### Added
- Initial release
- Basic bundling features
    `.trim(),
  },
});

if (textResult.success) {
  console.log("✅ Text files inlined as strings");
  console.log("Features: Raw content, multiline support\n");
}

// Example 7: HTML and CSS files
console.log("7️⃣ HTML and CSS Files");
console.log("----------------------");

const htmlCssResult = await Bun.build({
  entrypoints: ["/app/index.html"],
  files: {
    "/app/index.html": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <link rel="stylesheet" href="./styles/main.css">
    <link rel="stylesheet" href="./styles/components.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to My App</h1>
        <p class="description">Built with Bun!</p>
        <button class="btn btn-primary">Click Me</button>
    </div>
    <script src="./app.js"></script>
</body>
</html>
    `,
    "/app/styles/main.css": `
/* Main styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #2c3e50;
    margin-bottom: 20px;
}

.description {
    color: #7f8c8d;
    font-size: 18px;
}
    `,
    "/app/styles/components.css": `
/* Component styles */
.btn {
    display: inline-block;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #3498db;
    color: white;
}

.btn-primary:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}
    `,
    "/app/app.js": `
console.log("App loaded!");

document.querySelector('.btn').addEventListener('click', () => {
    alert('Button clicked!');
});
    `,
  },
  outdir: "./dist/html-css",
});

if (htmlCssResult.success) {
  console.log("✅ HTML and CSS files processed");
  console.log("Files created:", htmlCssResult.outputs.length);
  htmlCssResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 8: Assets (unrecognized extensions)
console.log("8️⃣ Asset Files");
console.log("---------------");

const assetResult = await Bun.build({
  entrypoints: ["/app/assets.ts"],
  files: {
    "/app/assets.ts": `
import logo from "./logo.svg";
import icon from "./favicon.ico";
import font from "./font.woff2";
import image from "./banner.png";

console.log("Logo path:", logo);
console.log("Icon path:", icon);
console.log("Font path:", font);
console.log("Banner path:", image);

// Use in DOM
document.getElementById('logo').src = logo;
    `,
    "/app/logo.svg": `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3498db"/></svg>`,
    "/app/favicon.ico": "binary-content-placeholder",
    "/app/font.woff2": "binary-font-content-placeholder",
    "/app/banner.png": "binary-image-content-placeholder",
  },
  outdir: "./dist/assets",
});

if (assetResult.success) {
  console.log("✅ Asset files copied as-is");
  console.log("Features: Path resolution, hash naming");
  assetResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  console.log();
}

// Example 9: Mixed content types
console.log("9️⃣ Mixed Content Types");
console.log("-----------------------");

const mixedResult = await Bun.build({
  entrypoints: ["/app/mixed.ts"],
  files: {
    "/app/mixed.ts": `
import { config } from "./config.json";
import { settings } from "./settings.toml";
import { readme } from "./README.txt";
import { Component } from "./Component.tsx";
import "./styles.css";

console.log("Config:", config);
console.log("Settings:", settings);
console.log("Readme length:", readme.length);

// Use component
const app = new Component();
app.render();
    `,
    "/app/config.json": JSON.stringify({ env: "prod", debug: false }),
    "/app/settings.toml": "[app]\nname = \"MixedApp\"\nversion = \"1.0.0\"",
    "/app/README.txt": "This is a mixed content type demo.",
    "/app/Component.tsx": `
export class Component {
  render() {
    console.log("Component rendered");
  }
}
    `,
    "/app/styles.css": "body { margin: 0; }",
  },
});

if (mixedResult.success) {
  console.log("✅ All content types work together");
  console.log("Bundle demonstrates interoperability\n");
}

// Summary
console.log("📋 Content Types Summary");
console.log("=========================");
console.log("✅ .js .jsx .ts .tsx - Transpiled to JavaScript");
console.log("✅ .json - Parsed and inlined as objects");
console.log("✅ .jsonc - JSON with comments supported");
console.log("✅ .toml - TOML configuration files");
console.log("✅ .yaml .yml - YAML configuration files");
console.log("✅ .txt - Inlined as strings");
console.log("✅ .html - Processed with asset bundling");
console.log("✅ .css - Bundled into single CSS file");
console.log("✅ .node .wasm - Treated as assets");
console.log("✅ Other extensions - Copied as assets");

console.log("\n💡 Key Features:");
console.log("----------------");
console.log("• Built-in transpiler for TS/JSX");
console.log("• No down-conversion of modern syntax");
console.log("• Dead code elimination");
console.log("• Tree shaking");
console.log("• Asset path resolution");
console.log("• In-memory bundling support");

console.log("\n✨ All content types demonstrated! 🚀");
