#!/usr/bin/env bun
// examples/bun-which-path-demo.ts
// Demonstrating Bun.which with custom PATH configuration

// Make this file a module
export {};

console.log("Bun.which PATH Configuration Demo");
console.log("==================================");

// 1. Default PATH behavior
console.log("\n1. Default PATH (from environment):");
const defaultBun = Bun.which("bun");
console.log(`bun with default PATH: ${defaultBun}`);

// Show current PATH
console.log(`Current PATH: ${Bun.env.PATH}`);

// 2. Custom PATH configuration
console.log("\n2. Custom PATH configuration:");

// Example 1: Custom PATH string
const customPath = "/usr/local/bin:/usr/bin:/bin";
const bunWithCustomPath = Bun.which("bun", {
  PATH: customPath
});
console.log(`bun with custom PATH '${customPath}': ${bunWithCustomPath}`);

// Example 2: Multiple PATH configurations
const pathConfigs = [
  { name: "Minimal", PATH: "/usr/bin:/bin" },
  { name: "Standard", PATH: "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" },
  { name: "Development", PATH: "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin" },
  { name: "Empty", PATH: "" }
];

pathConfigs.forEach(config => {
  const result = Bun.which("git", { PATH: config.PATH });
  console.log(`git with ${config.name} PATH: ${result || 'not found'}`);
});

// 3. Current working directory (cwd) option
console.log("\n3. Current Working Directory (cwd) option:");

// Example: Find executable from specific directory
const gitFromRoot = Bun.which("git", {
  cwd: "/",
  PATH: Bun.env.PATH
});
console.log(`git from root directory: ${gitFromRoot}`);

const gitFromTmp = Bun.which("git", {
  cwd: "/tmp",
  PATH: Bun.env.PATH
});
console.log(`git from /tmp directory: ${gitFromTmp}`);

// Example: Empty PATH with different cwd
const emptyPathResults = [
  { cwd: "/", name: "root" },
  { cwd: "/usr", name: "usr" },
  { cwd: "/tmp", name: "tmp" },
  { cwd: "/Users/nolarose", name: "home" }
];

emptyPathResults.forEach(dir => {
  const result = Bun.which("ls", {
    cwd: dir.cwd,
    PATH: ""
  });
  console.log(`ls from ${dir.name} with empty PATH: ${result || 'not found'}`);
});

// 4. Practical utility functions
console.log("\n4. Practical PATH Utilities:");

// Utility: Find executable in multiple PATHs
function findInMultiplePaths(executable: string, paths: string[]): string | null {
  for (const path of paths) {
    const result = Bun.which(executable, { PATH: path });
    if (result) return result;
  }
  return null;
}

const bunPaths = [
  "/Users/nolarose/.bun/bin",
  "/usr/local/bin",
  "/opt/homebrew/bin",
  "/usr/bin"
];

const foundBun = findInMultiplePaths("bun", bunPaths);
console.log(`Found bun in: ${foundBun}`);

// Utility: Validate PATH entries
function validatePath(path: string): { valid: string[]; invalid: string[] } {
  const entries = path.split(':').filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  
  entries.forEach(entry => {
    const testFile = Bun.which("ls", { cwd: entry, PATH: "" });
    if (testFile) {
      valid.push(entry);
    } else {
      invalid.push(entry);
    }
  });
  
  return { valid, invalid };
}

const pathValidation = validatePath(Bun.env.PATH || "");
console.log(`PATH validation: ${pathValidation.valid.length} valid, ${pathValidation.invalid.length} invalid`);

// 5. Omega Phase 3.25 use case
console.log("\n5. Omega Phase 3.25 - PATH Strategy:");

// Omega's preferred PATH order
const omegaPathOrder = [
  "/Users/nolarose/.bun/bin",  // Local Bun 1.3.7
  "/opt/homebrew/bin",         // Homebrew tools
  "/usr/local/bin",            // Local binaries
  "/usr/bin",                  // System binaries
  "/bin",                      // Core binaries
  "/usr/sbin",                 // System admin
  "/sbin"                      // Core admin
];

const omegaPath = omegaPathOrder.join(':');
console.log(`Omega preferred PATH: ${omegaPath}`);

// Test Omega PATH with critical tools
const criticalTools = ["bun", "git", "node", "curl"];
console.log("\nCritical tools with Omega PATH:");
criticalTools.forEach(tool => {
  const path = Bun.which(tool, { PATH: omegaPath });
  console.log(`${tool}: ${path || 'MISSING'}`);
});

// 6. Environment-specific PATH
console.log("\n6. Environment-specific PATH:");

const environments = {
  development: "/Users/nolarose/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin",
  production: "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
  ci: "/usr/local/bin:/usr/bin:/bin"
};

Object.entries(environments).forEach(([env, path]) => {
  const bunPath = Bun.which("bun", { PATH: path });
  console.log(`${env} environment bun: ${bunPath || 'not found'}`);
});

console.log("\n✅ PATH configuration demo completed!");
