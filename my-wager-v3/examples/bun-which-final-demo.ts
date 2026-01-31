#!/usr/bin/env bun
// examples/bun-which-final-demo.ts
// Final accurate demo of Bun.which cwd behavior

// Make this file a module
export {};

console.log("Bun.which cwd - Final Accurate Demo");
console.log("===================================");

// 1. cwd with relative paths returns relative paths
console.log("\n1. Relative Paths Return Relative Paths:");

// Create test setup
const testDir = "/tmp/bun-final-test";
await Bun.$`mkdir -p ${testDir}`;
await Bun.write(`${testDir}/mytool.sh`, `#!/bin/bash\necho "Hello"`);
await Bun.$`chmod +x ${testDir}/mytool.sh`;

// Test relative path resolution
const relativeResult = Bun.which("mytool.sh", {
  cwd: testDir,
  PATH: "./"
});
console.log(`mytool.sh with PATH="./" from ${testDir}:`);
console.log(`  Result: ${relativeResult}`);
console.log(`  Absolute path: ${testDir}/mytool.sh`);

// 2. Absolute paths ignore cwd
console.log("\n2. Absolute Paths Ignore cwd:");
const absoluteResult = Bun.which("ls", {
  cwd: "/nonexistent",
  PATH: "/bin"
});
console.log(`ls from /nonexistent with PATH="/bin": ${absoluteResult}`);

// 3. Mixed PATH behavior
console.log("\n3. Mixed PATH Behavior:");
const mixedResult = Bun.which("mytool.sh", {
  cwd: testDir,
  PATH: "./:/usr/bin"
});
console.log(`mytool.sh with PATH="./:/usr/bin": ${mixedResult}`);

const lsResult = Bun.which("ls", {
  cwd: testDir,
  PATH: "./:/usr/bin"
});
console.log(`ls with PATH="./:/usr/bin": ${lsResult}`);

// 4. Practical example - Node.js style local binaries
console.log("\n4. Node.js Style Local Binaries:");

// Simulate node_modules/.bin structure
const nodeModulesBin = `${testDir}/node_modules/.bin`;
await Bun.$`mkdir -p ${nodeModulesBin}`;
await Bun.write(`${nodeModulesBin}/my-cli`, `#!/bin/bash\necho "CLI tool"`);
await Bun.$`chmod +x ${nodeModulesBin}/my-cli`;

// Test Node.js style resolution
const nodeStylePath = "./node_modules/.bin:/usr/local/bin:/usr/bin";
const nodeTests = [
  { cwd: testDir, name: "project root" },
  { cwd: `${testDir}/src`, name: "src directory" }
];

nodeTests.forEach(test => {
  const cliPath = Bun.which("my-cli", {
    cwd: test.cwd,
    PATH: nodeStylePath
  });
  console.log(`\nmy-cli from ${test.name}:`);
  console.log(`  Relative result: ${cliPath}`);
  console.log(`  Would execute: ${test.cwd}/${cliPath}`);
});

// 5. Security - cwd doesn't prevent absolute PATH access
console.log("\n5. Security - cwd Doesn't Restrict Absolute PATH:");

const securityResult = Bun.which("ls", {
  cwd: "/tmp",
  PATH: "/bin:/etc:/usr/bin"  // Can still access /etc
});
console.log(`ls from /tmp with PATH including /etc: ${securityResult}`);
console.log("Note: cwd doesn't restrict absolute PATH entries");

// 6. Real-world Omega use case
console.log("\n6. Real-world Omega Use Case:");

// Omega's strategy: Use absolute paths for system tools, relative for project tools
const omegaPath = "./node_modules/.bin:/Users/nolarose/.bun/bin:/usr/bin:/bin";
const omegaCwd = "/Users/nolarose/my-wager-v3";

const bunInOmega = Bun.which("bun", {
  cwd: omegaCwd,
  PATH: omegaPath
});

const gitInOmega = Bun.which("git", {
  cwd: omegaCwd,
  PATH: omegaPath
});

console.log(`Omega tool resolution from ${omegaCwd}:`);
console.log(`  bun: ${bunInOmega}`);
console.log(`  git: ${gitInOmega}`);
console.log(`  Note: bun uses absolute path, git uses absolute path`);

// Cleanup
await Bun.$`rm -rf ${testDir}`;

console.log("\n✅ Final Understanding:");
console.log("1. cwd is the base for resolving RELATIVE paths in PATH");
console.log("2. Relative paths return relative paths from cwd");
console.log("3. Absolute paths in PATH completely ignore cwd");
console.log("4. Empty PATH = no results, regardless of cwd");
console.log("5. cwd is NOT a security boundary for absolute paths");
console.log("6. Useful for project-local tools with relative PATHs");
