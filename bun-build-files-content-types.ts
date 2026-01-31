#!/usr/bin/env bun
/**
 * Bun Build Files API - Content Types Demonstration
 * Shows how to use string, Blob, TypedArray, and ArrayBuffer as file contents
 */

// Make this file a module
export {};

console.log("📦 Bun Build Files API - Content Types Demo");
console.log("==========================================\n");

// Example 1: String content (most common)
console.log("1️⃣ String Content");
console.log("------------------");

const stringResult = await Bun.build({
  entrypoints: ["/virtual/string-example.ts"],
  files: {
    "/virtual/string-example.ts": `
// File content as a string
export const message = "Hello from string content!";
export const timestamp = new Date().toISOString();

console.log(message);
console.log("Generated at:", timestamp);
    `,
  },
});

if (stringResult.success) {
  const output = await stringResult.outputs[0].text();
  console.log("✅ Built successfully with string content");
  console.log("Output length:", output.length, "characters");
}

// Example 2: Blob content (for binary data)
console.log("\n2️⃣ Blob Content");
console.log("---------------");

// Create a blob with TypeScript code
const codeBlob = new Blob([
  `
// File content as a Blob
export const source = "blob";
export const size = "${new Blob(['test']).size}";

console.log("Hello from blob content!");
console.log("Blob size:", size);
  `.trim()
], { type: 'text/typescript' });

const blobResult = await Bun.build({
  entrypoints: ["/virtual/blob-example.ts"],
  files: {
    "/virtual/blob-example.ts": codeBlob,
  },
});

if (blobResult.success) {
  const output = await blobResult.outputs[0].text();
  console.log("✅ Built successfully with Blob content");
  console.log("Output length:", output.length, "characters");
}

// Example 3: TypedArray content (Uint8Array)
console.log("\n3️⃣ TypedArray Content (Uint8Array)");
console.log("-----------------------------------");

// Convert TypeScript string to Uint8Array
const tsCode = `
// File content as Uint8Array
export const arrayType = "Uint8Array";
export const byteLength = new TextEncoder().encode("test").byteLength;

console.log("Hello from Uint8Array content!");
console.log("Byte length:", byteLength);
`.trim();

const uint8Array = new TextEncoder().encode(tsCode);

const typedArrayResult = await Bun.build({
  entrypoints: ["/virtual/typedarray-example.ts"],
  files: {
    "/virtual/typedarray-example.ts": uint8Array,
  },
});

if (typedArrayResult.success) {
  const output = await typedArrayResult.outputs[0].text();
  console.log("✅ Built successfully with Uint8Array content");
  console.log("Original bytes:", uint8Array.length);
  console.log("Output length:", output.length, "characters");
}

// Example 4: ArrayBuffer content
console.log("\n4️⃣ ArrayBuffer Content");
console.log("------------------------");

// Create ArrayBuffer from string
const arrayBuffer = new TextEncoder().encode(`
// File content as ArrayBuffer
export const bufferType = "ArrayBuffer";
export const isDetached = false;

console.log("Hello from ArrayBuffer content!");
console.log("Buffer type:", bufferType);
`).buffer;

const arrayBufferResult = await Bun.build({
  entrypoints: ["/virtual/arraybuffer-example.ts"],
  files: {
    "/virtual/arraybuffer-example.ts": arrayBuffer,
  },
});

if (arrayBufferResult.success) {
  const output = await arrayBufferResult.outputs[0].text();
  console.log("✅ Built successfully with ArrayBuffer content");
  console.log("Original buffer bytes:", arrayBuffer.byteLength);
  console.log("Output length:", output.length, "characters");
}

// Example 5: Mixed content types
console.log("\n5️⃣ Mixed Content Types");
console.log("----------------------");

const mixedResult = await Bun.build({
  entrypoints: ["/virtual/mixed-example.ts"],
  files: {
    // String
    "/virtual/mixed-example.ts": `
import { stringData } from "./string-data";
import { blobData } from "./blob-data";
import { arrayData } from "./array-data";
import { bufferData } from "./buffer-data";

console.log("=== Mixed Content Types Demo ===");
console.log("String:", stringData);
console.log("Blob:", blobData);
console.log("Array:", arrayData);
console.log("Buffer:", bufferData);
    `,
    // Blob
    "/virtual/blob-data.ts": new Blob([
      `export const blobData = { type: "Blob", created: "${new Date().toISOString()}" };`
    ], { type: 'text/typescript' }),
    // TypedArray
    "/virtual/array-data.ts": new TextEncoder().encode(`
      export const arrayData = { 
        type: "Uint8Array", 
        bytes: ${new TextEncoder().encode("test").length} 
      };
    `),
    // ArrayBuffer
    "/virtual/buffer-data.ts": new TextEncoder().encode(`
      export const bufferData = { 
        type: "ArrayBuffer", 
        byteLength: 4 
      };
    `).buffer,
    // String
    "/virtual/string-data.ts": `
      export const stringData = { 
        type: "String", 
        length: "string".length 
      };
    `,
  },
});

if (mixedResult.success) {
  const output = await mixedResult.outputs[0].text();
  console.log("✅ Built successfully with mixed content types");
  console.log("Total files in bundle:", mixedResult.outputs.length);
  
  // Show the generated code
  console.log("\nGenerated code preview:");
  console.log("----------------------");
  console.log(output.substring(0, 500) + "...");
}

// Example 6: Practical use case - JSON config as TypedArray
console.log("\n6️⃣ Practical Example - JSON Config");
console.log("----------------------------------");

const config = {
  apiUrl: "https://api.example.com",
  version: "1.0.0",
  features: {
    auth: true,
    logging: false,
  },
  buildTime: new Date().toISOString(),
};

// Convert JSON to Uint8Array
const configJson = JSON.stringify(config, null, 2);
const configTypedArray = new TextEncoder().encode(configJson);

const configResult = await Bun.build({
  entrypoints: ["/virtual/config-example.ts"],
  files: {
    "/virtual/config-example.ts": `
// Import JSON config provided as TypedArray
import configJson from "./config.json";

console.log("Configuration loaded from TypedArray:");
console.log(JSON.stringify(configJson, null, 2));

// Use the config
console.log("\\nUsing config:");
console.log("API URL:", configJson.apiUrl);
console.log("Version:", configJson.version);
console.log("Auth enabled:", configJson.features.auth);
    `,
    "/virtual/config.json": configTypedArray, // JSON as TypedArray
  },
});

if (configResult.success) {
  const output = await configResult.outputs[0].text();
  console.log("✅ Built successfully with JSON config as TypedArray");
  console.log("Config size:", configTypedArray.length, "bytes");
}

// Summary
console.log("\n📊 Summary");
console.log("==========");
console.log("✅ String content - Simple and direct");
console.log("✅ Blob content - For binary data, supports MIME types");
console.log("✅ TypedArray content - Efficient for encoded data");
console.log("✅ ArrayBuffer content - Raw binary buffer");
console.log("✅ Mixed types - Combine different content types in one build");

console.log("\n💡 Tips:");
console.log("---------");
console.log("• Use strings for most TypeScript/JavaScript code");
console.log("• Use Blobs for binary files with MIME types");
console.log("• Use TypedArrays for pre-encoded text data");
console.log("• Use ArrayBuffer for raw binary data");
console.log("• All types are automatically converted by Bun");

console.log("\n✨ All content types demonstrated successfully! 🚀");
