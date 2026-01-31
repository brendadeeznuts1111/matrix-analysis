#!/usr/bin/env bun
/**
 * Test env prefix example
 */

export {};

console.log("Testing env prefix...");

// Set environment variables
process.env.PUBLIC_API_URL = "https://api.example.com";
process.env.SECRET_KEY = "secret";

const result = await Bun.build({
  entrypoints: ["./test.ts"],
  outdir: "./dist/test",
  env: "PUBLIC_*",
  files: {
    "./test.ts": `
console.log("API:", process.env.PUBLIC_API_URL);
console.log("Secret:", process.env.SECRET_KEY);
    `,
  },
});

if (result.success) {
  console.log("✅ Build successful!");
  const output = await result.outputs[0].text();
  console.log("Output:", output);
} else {
  console.log("❌ Build failed");
  console.log("Errors:", result.logs);
}
