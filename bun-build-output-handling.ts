#!/usr/bin/env bun
/**
 * Bun Build Output Handling
 * Demonstrates how to access and use build outputs
 */

// Make this file a module
export {};

console.log("📦 Bun Build Output Handling");
console.log("============================\n");

// Example 1: Basic output access
console.log("1️⃣ Basic Output Access");
console.log("----------------------");

const basicResult = await Bun.build({
  entrypoints: ["/app/basic.ts"],
  files: {
    "/app/basic.ts": `
export const message = "Hello from build!";
export const version = "1.0.0";

console.log(message);
console.log("Version:", version);
    `,
  },
});

if (basicResult.success) {
  // Access the first output
  const output = basicResult.outputs[0];

  // Get the text content
  const textContent = await output.text();

  console.log("✅ Build successful!");
  console.log("Output path:", output.path);
  console.log("Output size:", output.size, "bytes");
  console.log("Output type:", output.kind);
  console.log("\n--- Generated Code ---");
  console.log(textContent);
  console.log("--- End of Code ---\n");
}

// Example 2: Multiple outputs
console.log("2️⃣ Multiple Outputs");
console.log("-------------------");

const multiResult = await Bun.build({
  entrypoints: [
    "/app/main.ts",
    "/app/worker.ts",
    "/app/types.ts"
  ],
  files: {
    "/app/main.ts": `
import { Worker } from "./worker";
import { User } from "./types";

const worker = new Worker();
const user: User = { id: 1, name: "John" };

console.log("Main app running");
worker.start();
console.log("User:", user);
    `,
    "/app/worker.ts": `
export class Worker {
  start() {
    console.log("Worker started");
  }
}
    `,
    "/app/types.ts": `
export interface User {
  id: number;
  name: string;
}
    `,
  },
});

if (multiResult.success) {
  console.log("✅ Multi-entry build successful!");
  console.log(`Total outputs: ${multiResult.outputs.length}\n`);

  // Iterate through all outputs
  for (const [index, output] of multiResult.outputs.entries()) {
    console.log(`Output ${index + 1}:`);
    console.log(`  Path: ${output.path}`);
    console.log(`  Size: ${output.size} bytes`);
    console.log(`  Type: ${output.kind}`);

    // Get text content
    const content = await output.text();
    console.log(`  Preview: ${content.substring(0, 100)}...\n`);
  }
}

// Example 3: Output as different formats
console.log("3️⃣ Output Formats");
console.log("------------------");

const formatResult = await Bun.build({
  entrypoints: ["/app/formats.ts"],
  files: {
    "/app/formats.ts": `
export const data = { message: "Hello World!" };
console.log(data.message);
    `,
  },
});

if (formatResult.success) {
  const output = formatResult.outputs[0];

  // Get as text
  const textOutput = await output.text();
  console.log("As text:");
  console.log(textOutput.substring(0, 100) + "...\n");

  // Get as array buffer
  const arrayBuffer = await output.arrayBuffer();
  console.log("As ArrayBuffer:");
  console.log(`  Size: ${arrayBuffer.byteLength} bytes`);
  console.log(`  Type: ${arrayBuffer.constructor.name}\n`);

  // Get as blob (create from text)
  const textContent = await output.text();
  const blob = new Blob([textContent], { type: 'application/javascript' });
  console.log("As Blob:");
  console.log(`  Size: ${blob.size} bytes`);
  console.log(`  Type: ${blob.type}\n`);

  // Get as stream (create from text)
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(textContent));
      controller.close();
    }
  });
  console.log("As Stream:");
  console.log(`  Type: ${stream.constructor.name}`);
  console.log(`  Locked: ${stream.locked}\n`);
}

// Example 4: Using outputs in different scenarios
console.log("4️⃣ Using Outputs");
console.log("----------------");

const usageResult = await Bun.build({
  entrypoints: ["/app/usage.ts"],
  files: {
    "/app/usage.ts": `
export function calculate(x: number, y: number): number {
  return x + y;
}

console.log("Module loaded");
    `,
  },
});

if (usageResult.success) {
  const output = usageResult.outputs[0];

  // Method 1: Write to file
  console.log("Method 1: Write to file");
  await Bun.write("./dist/usage-bundle.js", await output.text());
  console.log("✅ Written to ./dist/usage-bundle.js\n");

  // Method 2: Create HTTP response
  console.log("Method 2: HTTP Response");
  const response = new Response(await output.text(), {
    headers: { "Content-Type": "application/javascript" }
  });
  console.log(`Response: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${response.headers.get("Content-Type")}\n`);

  // Method 3: Execute in memory (be careful in production!)
  console.log("Method 3: Execute in memory");
  try {
    // Note: This is for demonstration only
    const code = await output.text();
    console.log("Code ready for execution (length:", code.length, "chars)");
    // eval(code); // Uncomment to execute
    console.log("✅ Code prepared for execution\n");
  } catch (e) {
    console.log("⚠️  Execution skipped for safety\n");
  }

  // Method 4: Create as Worker
  console.log("Method 4: Web Worker");
  const workerCode = await output.text();
  console.log("Worker code prepared");
  console.log(`Code size: ${workerCode.length} characters`);
  // const worker = new Worker(workerCode, { type: "string" });
  console.log("✅ Worker ready to be created\n");
}

// Example 5: Output metadata
console.log("5️⃣ Output Metadata");
console.log("------------------");

const metaResult = await Bun.build({
  entrypoints: ["/app/meta.ts"],
  files: {
    "/app/meta.ts": `
export const meta = {
  name: "My App",
  version: "1.0.0",
  buildTime: new Date().toISOString()
};
    `,
  },
  metafile: true, // Enable metafile generation
});

if (metaResult.success) {
  const output = metaResult.outputs[0];

  console.log("Output Properties:");
  console.log(`  path: ${output.path}`);
  console.log(`  size: ${output.size}`);
  console.log(`  kind: ${output.kind}`);
  console.log(`  hash: ${output.hash || 'N/A'}`);
  console.log(`  loader: ${output.loader || 'default'}`);

  // Check if output has additional properties
  const outputKeys = Object.keys(output);
  console.log(`  All keys: ${outputKeys.join(', ')}\n`);

  // Show metafile if available
  if (metaResult.metafile) {
    console.log("Metafile available:");
    console.log(`  Inputs: ${Object.keys(metaResult.metafile.inputs).length}`);
    console.log(`  Outputs: ${Object.keys(metaResult.metafile.outputs).length}`);
  }
}

// Example 6: Error handling
console.log("6️⃣ Error Handling");
console.log("-----------------");

const errorResult = await Bun.build({
  entrypoints: ["/app/error.ts"],
  files: {
    "/app/error.ts": `
import { nonExistent } from "./missing.ts";
console.log("This won't work");
    `,
  },
});

if (!errorResult.success) {
  console.log("❌ Build failed!");
  console.log("Errors:", errorResult.logs.length);

  errorResult.logs.forEach((log, index) => {
    console.log(`\nError ${index + 1}:`);
    console.log(`  Level: ${log.level}`);
    console.log(`  Message: ${log.message}`);
    if (log.position) {
      console.log(`  File: ${log.position.file}`);
      console.log(`  Line: ${log.position.line}`);
      console.log(`  Column: ${log.position.column}`);
    }
  });
}

// Summary
console.log("\n📋 Output Handling Summary");
console.log("==========================");
console.log("✅ Basic text() access");
console.log("✅ Multiple outputs iteration");
console.log("✅ Different formats (text, buffer, blob, stream)");
console.log("✅ Practical usage scenarios");
console.log("✅ Metadata inspection");
console.log("✅ Error handling");

console.log("\n💡 Key Points:");
console.log("---------------");
console.log("• Always check result.success");
console.log("• outputs[0] for single entry builds");
console.log("• Iterate outputs for multiple entries");
console.log("• text() is most common for JavaScript");
console.log("• Use metafile for build metadata");

console.log("\n✨ Output handling demonstrated! 🚀");
