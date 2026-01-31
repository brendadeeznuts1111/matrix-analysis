#!/usr/bin/env bun
// examples/bun-which-cwd-corrected.ts
// Corrected demo showing how cwd actually works with relative PATHs

// Make this file a module
export {};

console.log("Bun.which cwd - CORRECTED Understanding");
console.log("======================================");

// 1. cwd with relative PATH entries
console.log("\n1. cwd with Relative PATH Entries:");

// Create a test setup
const testDir = "/tmp/bun-test";
await Bun.write(`${testDir}/test-script.sh`, `#!/bin/bash\necho "Hello from test"`);
await Bun.$`chmod +x ${testDir}/test-script.sh`;

// Test with relative PATH
const relativePathTests = [
  {
    cwd: "/tmp",
    PATH: "./bun-test",
    description: "relative path from /tmp"
  },
  {
    cwd: "/tmp/bun-test",
    PATH: "./",
    description: "current directory from within"
  },
  {
    cwd: "/",
    PATH: "./tmp/bun-test",
    description: "relative path from root"
  }
];

relativePathTests.forEach(test => {
  const result = Bun.which("test-script.sh", {
    cwd: test.cwd,
    PATH: test.PATH
  });
  console.log(`${test.description}: ${result || 'not found'}`);
});

// 2. Absolute PATH ignores cwd
console.log("\n2. Absolute PATH Ignores cwd:");

const absolutePathTest = [
  {
    cwd: "/tmp",
    PATH: "/bin"
  },
  {
    cwd: "/usr",
    PATH: "/bin"
  },
  {
    cwd: "/nonexistent",
    PATH: "/bin"
  }
];

absolutePathTest.forEach(test => {
  const result = Bun.which("ls", {
    cwd: test.cwd,
    PATH: test.PATH
  });
  console.log(`ls from ${test.cwd} with PATH ${test.PATH}: ${result}`);
});

// 3. Mixed PATH (absolute + relative)
console.log("\n3. Mixed PATH (Absolute + Relative):");

const mixedPath = "/bin:./bun-test:/usr/bin";
const mixedTests = [
  { cwd: "/tmp", name: "from /tmp" },
  { cwd: "/tmp/bun-test", name: "from /tmp/bun-test" },
  { cwd: "/", name: "from /" }
];

mixedTests.forEach(test => {
  const ls = Bun.which("ls", { cwd: test.cwd, PATH: mixedPath });
  const script = Bun.which("test-script.sh", { cwd: test.cwd, PATH: mixedPath });
  console.log(`${test.name}:`);
  console.log(`  ls: ${ls}`);
  console.log(`  test-script.sh: ${script || 'not found'}`);
});

// 4. Practical use case: Project with local tools
console.log("\n4. Practical Use Case - Project with Local Tools:");

// Simulate a project structure
const projectDir = "/tmp/omega-project";
await Bun.$`mkdir -p ${projectDir}/tools ${projectDir}/bin`;
await Bun.write(`${projectDir}/tools/omega-build`, `#!/bin/bash\necho "Building Omega"`);
await Bun.write(`${projectDir}/bin/omega-test`, `#!/bin/bash\necho "Testing Omega"`);
await Bun.$`chmod +x ${projectDir}/tools/omega-build ${projectDir}/bin/omega-test`;

// Project PATH with relative entries
const projectPath = "./bin:./tools:/usr/local/bin:/usr/bin";

console.log(`Project structure created at ${projectDir}`);
console.log(`Project PATH: ${projectPath}`);

// Test from different working directories
const projectTests = [
  { cwd: projectDir, name: "project root" },
  { cwd: `${projectDir}/src`, name: "src subdirectory" },
  { cwd: "/tmp", name: "outside project" }
];

projectTests.forEach(test => {
  console.log(`\nFrom ${test.name}:`);
  const build = Bun.which("omega-build", { cwd: test.cwd, PATH: projectPath });
  const testCmd = Bun.which("omega-test", { cwd: test.cwd, PATH: projectPath });
  const ls = Bun.which("ls", { cwd: test.cwd, PATH: projectPath });
  
  console.log(`  omega-build: ${build || 'not found'}`);
  console.log(`  omega-test: ${testCmd || 'not found'}`);
  console.log(`  ls: ${ls}`);
});

// 5. Security implications
console.log("\n5. Security Implications:");

// cwd can be used to limit relative path resolution
const securityTests = [
  {
    cwd: "/tmp",
    PATH: "./safe-bin:/usr/bin",
    description: "restricted to /tmp/safe-bin"
  },
  {
    cwd: "/tmp",
    PATH: "../etc:/usr/bin",
    description: "potential directory traversal"
  }
];

securityTests.forEach(test => {
  console.log(`\n${test.description}:`);
  // Note: Bun.which doesn't actually execute, just finds paths
  // So directory traversal via ../ in PATH is about where it looks, not execution
  console.log(`  PATH resolution from cwd ${test.cwd}`);
});

// 6. Cleanup
console.log("\n6. Cleanup:");
await Bun.$`rm -rf ${testDir} ${projectDir}`;
console.log("Test directories cleaned up");

console.log("\n✅ Corrected cwd understanding:");
console.log("- cwd is the base for RELATIVE paths in PATH");
console.log("- Absolute paths in PATH ignore cwd");
console.log("- Empty PATH = no results regardless of cwd");
console.log("- Useful for project-local tool resolution");
