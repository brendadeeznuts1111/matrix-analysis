#!/usr/bin/env bun
// examples/bun-which-cwd-demo.ts
// Demonstrating Bun.which with cwd (current working directory) option

// Make this file a module
export {};

console.log("Bun.which cwd (Current Working Directory) Demo");
console.log("=================================================");

// 1. Basic cwd usage
console.log("\n1. Basic cwd Usage:");

// Example from the documentation
const lsFromTmp = Bun.which("ls", {
  cwd: "/tmp",
  PATH: ""
});
console.log(`ls from /tmp with empty PATH: ${lsFromTmp || 'null (as expected)'}`);

// 2. cwd with different directories
console.log("\n2. Testing Different Directories:");

const testDirectories = [
  { path: "/", name: "root" },
  { path: "/usr", name: "usr" },
  { path: "/bin", name: "bin" },
  { path: "/usr/bin", name: "usr/bin" },
  { path: "/tmp", name: "tmp" },
  { path: "/Users/nolarose", name: "home" },
  { path: "/Users/nolarose/.bun/bin", name: "bun bin" }
];

testDirectories.forEach(dir => {
  const lsPath = Bun.which("ls", {
    cwd: dir.path,
    PATH: ""
  });
  console.log(`ls from ${dir.name} (${dir.path}): ${lsPath || 'not found'}`);
});

// 3. cwd with custom PATH
console.log("\n3. cwd with Custom PATH:");

const customPath = "/bin:/usr/bin";
const cwdPathTests = [
  { cwd: "/", name: "root" },
  { cwd: "/tmp", name: "tmp" },
  { cwd: "/Users", name: "Users" }
];

cwdPathTests.forEach(test => {
  const result = Bun.which("ls", {
    cwd: test.cwd,
    PATH: customPath
  });
  console.log(`ls from ${test.name} with PATH '${customPath}': ${result || 'not found'}`);
});

// 4. Finding executables relative to cwd
console.log("\n4. Finding Executables Relative to cwd:");

// Create a function to find executables in a directory tree
function findExecutableInDir(executable: string, searchDir: string): string | null {
  const result = Bun.which(executable, {
    cwd: searchDir,
    PATH: ""
  });

  if (result) return result;

  // Try parent directories
  const parentDir = searchDir.split('/').slice(0, -1).join('/') || '/';
  if (parentDir !== searchDir) {
    return findExecutableInDir(executable, parentDir);
  }

  return null;
}

// Find bun relative to current directory
const currentDir = process.cwd();
const bunFromCurrent = findExecutableInDir("bun", currentDir);
console.log(`bun found relative to ${currentDir}: ${bunFromCurrent || 'not found'}`);

// 5. Practical use case: Local project tools
console.log("\n5. Practical Use Case - Local Project Tools:");

// Simulate a project structure with local tools
const projectDirs = [
  "/Users/nolarose/my-wager-v3",
  "/Users/nolarose/my-wager-v3/node_modules/.bin",
  "/Users/nolarose/my-wager-v3/.bin"
];

const projectTools = ["bun", "node", "npm"];

projectDirs.forEach(dir => {
  console.log(`\nChecking ${dir}:`);
  projectTools.forEach(tool => {
    const toolPath = Bun.which(tool, {
      cwd: dir,
      PATH: ""
    });
    if (toolPath) {
      console.log(`  ${tool}: ${toolPath}`);
    }
  });
});

// 6. Security context - restricted execution
console.log("\n6. Security Context - Restricted Execution:");

// In a secure environment, you might want to limit where executables can be found
const secureDir = "/tmp";
const allowedPath = "/bin:/usr/bin";

console.log(`Secure execution from ${secureDir}:`);
const secureTools = ["ls", "cat", "echo"];
secureTools.forEach(tool => {
  const path = Bun.which(tool, {
    cwd: secureDir,
    PATH: allowedPath
  });
  console.log(`  ${tool}: ${path || 'blocked'}`);
});

// 7. cwd with relative paths
console.log("\n7. cwd with Relative Paths:");

// Test relative paths
const relativePaths = [
  ".",
  "./",
  "..",
  "../",
  "./node_modules/.bin"
];

relativePaths.forEach(path => {
  const result = Bun.which("bun", {
    cwd: path,
    PATH: ""
  });
  console.log(`bun from relative path '${path}': ${result || 'not found'}`);
});

// 8. Omega Phase 3.25 - cwd for module resolution
console.log("\n8. Omega Phase 3.25 - cwd for Module Resolution:");

// Omega uses cwd to ensure tools are found relative to the project
const omegaCwd = "/Users/nolarose/my-wager-v3";
const omegaTools = ["bun", "git"];

console.log(`Omega tool resolution from ${omegaCwd}:`);
omegaTools.forEach(tool => {
  const withCwd = Bun.which(tool, {
    cwd: omegaCwd,
    PATH: "/usr/local/bin:/usr/bin:/bin"
  });

  const withoutCwd = Bun.which(tool, {
    PATH: "/usr/local/bin:/usr/bin:/bin"
  });

  console.log(`  ${tool}:`);
  console.log(`    with cwd: ${withCwd || 'not found'}`);
  console.log(`    without cwd: ${withoutCwd || 'not found'}`);
});

// 9. Edge cases
console.log("\n9. Edge Cases:");

// Non-existent directory
const nonExistent = Bun.which("ls", {
  cwd: "/this/does/not/exist",
  PATH: "/bin"
});
console.log(`ls from non-existent directory: ${nonExistent || 'null (expected)'}`);

// Empty string cwd
try {
  const emptyCwd = Bun.which("ls", {
    cwd: "",
    PATH: "/bin"
  });
  console.log(`ls with empty cwd: ${emptyCwd || 'null'}`);
} catch (e: unknown) {
  console.log(`ls with empty cwd: error - ${e instanceof Error ? e.message : String(e)}`);
}

// 10. Performance comparison
console.log("\n10. Performance Comparison:");

const iterations = 1000;

// Test with cwd
const startWithCwd = performance.now();
for (let i = 0; i < iterations; i++) {
  Bun.which("ls", { cwd: "/tmp", PATH: "/bin" });
}
const endWithCwd = performance.now();

// Test without cwd
const startWithoutCwd = performance.now();
for (let i = 0; i < iterations; i++) {
  Bun.which("ls", { PATH: "/bin" });
}
const endWithoutCwd = performance.now();

console.log(`With cwd (${iterations} iterations): ${(endWithCwd - startWithCwd).toFixed(2)}ms`);
console.log(`Without cwd (${iterations} iterations): ${(endWithoutCwd - startWithoutCwd).toFixed(2)}ms`);

console.log("\n✅ cwd demo completed!");
