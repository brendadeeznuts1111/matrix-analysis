#!/usr/bin/env bun
/**
 * Simple Bun Build from Memory Example
 * Exact example from the Bun documentation
 */

// Make this file a module
export {};

console.log("📦 Simple Bun Build from Memory");
console.log("===============================\n");

// Exact example from Bun documentation
const result = await Bun.build({
  entrypoints: ["/app/index.ts"],
  files: {
    "/app/index.ts": `
      import { greet } from "./greet.ts";
      console.log(greet("World"));
    `,
    "/app/greet.ts": `
      export function greet(name: string) {
        return "Hello, " + name + "!";
      }
    `,
  },
});

const output = await result.outputs[0].text();
console.log(output);

// Additional explanation
console.log("\n--- Explanation ---");
console.log("✅ All code provided in-memory via 'files' option");
console.log("✅ No files written to disk");
console.log("✅ Entry points are virtual paths starting with '/'");
console.log("✅ Module resolution works between virtual files");
console.log("✅ Output is a bundle string you can use directly");

// Show build details
console.log("\n--- Build Details ---");
console.log("Success:", result.success);
console.log("Outputs:", result.outputs.length);
console.log("Bundle size:", output.length, "characters");

// Show how to use the bundle
console.log("\n--- Using the Bundle ---");
console.log("You can:");
console.log("1. Write to disk: await Bun.write('bundle.js', output)");
console.log("2. Execute directly: eval(output)");
console.log("3. Serve as HTTP response: new Response(output)");
console.log("4. Create as a worker: new Worker(output, { type: 'string' })");
