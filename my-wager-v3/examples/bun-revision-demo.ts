#!/usr/bin/env bun
// examples/bun-revision-demo.ts
// Demonstrating Bun.revision for production tracking

console.log("Bun.revision Demo");
console.log("================");

// Display Bun revision info
console.log(`Bun.version: ${Bun.version}`);
console.log(`Bun.revision: ${Bun.revision}`);
console.log(`Revision length: ${Bun.revision?.length || 0} characters`);

// Explain what revision means
console.log("\nWhat is Bun.revision?");
console.log("- The exact Git commit hash used to build this Bun binary");
console.log("- Useful for debugging and reproducibility");
console.log("- Helps track which specific Bun version introduced features/bugs");

// Production use case example
console.log("\nProduction Use Cases:");
console.log("1. Bug Reports: Include revision in error logs");
console.log("2. CI/CD: Verify specific Bun build is deployed");
console.log("3. Debugging: Reproduce issues with exact same build");
console.log("4. Security: Track which builds contain security patches");

// Demonstrate revision in logging
const logEntry = {
  timestamp: new Date().toISOString(),
  level: "INFO",
  message: "Production server started",
  runtime: {
    bun_version: Bun.version,
    bun_revision: Bun.revision,
    node_compat: typeof process !== 'undefined'
  }
};

console.log("\nStructured Log Example:");
console.log(JSON.stringify(logEntry, null, 2));

// Revision validation (useful for deployment scripts)
const expectedRevision = "ba426210c28a43a3d36db504523617fd0202070e";
if (Bun.revision === expectedRevision) {
  console.log(`\n✅ Revision check passed`);
  console.log(`Running expected build: ${Bun.revision.substring(0, 7)}...`);
} else {
  console.log(`\n⚠️ Revision mismatch`);
  console.log(`Expected: ${expectedRevision}`);
  console.log(`Actual: ${Bun.revision}`);
}

// Show revision in Omega context
console.log("\nOmega Phase 3.25 Integration:");
console.log("- Matrix telemetry includes Bun.revision");
console.log("- All logs track exact Bun build used");
console.log("- Enables perfect reproducibility for debugging");

console.log(`\n🚀 Bun revision tracking active!`);
