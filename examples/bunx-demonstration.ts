#!/usr/bin/env bun
/**
 * Bunx (Bun eXecute) Demonstration
 * Shows how to use bunx to run packages without installing them
 */

// Make this file a module
export {};

console.log("🚀 Bunx (Bun eXecute) Demonstration");
console.log("==================================\n");

console.log("💡 Key Facts:");
console.log("   • bunx is an alias for 'bun x'");
console.log("   • The bunx CLI is auto-installed when you install Bun");
console.log("   • Use bunx to auto-install and run packages from npm");
console.log("   • It's Bun's equivalent of npx or yarn dlx");
console.log("   • Both commands work identically:\n");
console.log("   bunx my-cli --foo bar");
console.log("   bun x my-cli --foo bar  # Same thing!\n");

// Example 1: Basic bunx usage scenarios
console.log("1️⃣ Basic bunx Usage Examples");
console.log("------------------------------");

console.log("Common bunx commands:");
console.log("# Run Prisma migrations");
console.log("bunx prisma migrate");
console.log("bun x prisma migrate  # Same command!");
console.log();
console.log("# Format a file with Prettier");
console.log("bunx prettier foo.js");
console.log("bun x prettier foo.js  # Same command!");
console.log();
console.log("# Run a specific version of a package");
console.log("bunx [email protected] app.js");
console.log("bun x [email protected] app.js  # Same command!");
console.log();
console.log("# Use --package when binary name differs from package name");
console.log("bunx -p @angular/cli ng new my-app");
console.log("bun x -p @angular/cli ng new my-app  # Same command!");
console.log();
console.log("# Force running with Bun instead of Node.js");
console.log("bunx --bun vite dev foo.js");
console.log("bun x --bun vite dev foo.js  # Same command!");

// Example 2: bunx with different package types
console.log("\n2️⃣ bunx with Different Package Types");
console.log("------------------------------------");

const packageExamples = [
  {
    category: "Database Tools",
    packages: [
      { cmd: "bunx prisma", desc: "Prisma ORM toolkit" },
      { cmd: "bunx knex", desc: "SQL query builder" },
      { cmd: "bunx sequelize-cli", desc: "Sequelize CLI" }
    ]
  },
  {
    category: "Build Tools",
    packages: [
      { cmd: "bunx vite", desc: "Vite build tool" },
      { cmd: "bunx webpack", desc: "Webpack bundler" },
      { cmd: "bunx rollup", desc: "Rollup bundler" },
      { cmd: "bunx esbuild", desc: "ESBuild bundler" }
    ]
  },
  {
    category: "Code Quality",
    packages: [
      { cmd: "bunx prettier", desc: "Code formatter" },
      { cmd: "bunx eslint", desc: "JavaScript linter" },
      { cmd: "bunx typescript", desc: "TypeScript compiler" },
      { cmd: "bunx jest", desc: "Testing framework" }
    ]
  },
  {
    category: "Frameworks",
    packages: [
      { cmd: "bunx -p @angular/cli ng", desc: "Angular CLI" },
      { cmd: "bunx -p @nestjs/cli nest", desc: "NestJS CLI" },
      { cmd: "bunx create-react-app", desc: "React app creator" },
      { cmd: "bunx -p @vue/cli vue", desc: "Vue CLI" }
    ]
  }
];

for (const { category, packages } of packageExamples) {
  console.log(`\n${category}:`);
  packages.forEach(({ cmd, desc }) => {
    console.log(`  ${cmd.padEnd(30)} - ${desc}`);
  });
}

// Example 3: Version-specific usage
console.log("\n3️⃣ Version-Specific Package Execution");
console.log("-------------------------------------");

const versionExamples = [
  {
    scenario: "Testing different versions",
    examples: [
      "bunx [email protected] --version",
      "bunx [email protected] --version",
      "bunx [email protected] --version"
    ]
  },
  {
    scenario: "Reproducible builds",
    examples: [
      "bunx [email protected] build",
      "bunx [email protected] test",
      "bunx [email protected] lint"
    ]
  },
  {
    scenario: "Compatibility testing",
    examples: [
      "bunx [email protected] migrate",
      "bunx [email protected] generate",
      "bunx [email protected] db:seed"
    ]
  }
];

for (const { scenario, examples } of versionExamples) {
  console.log(`\n${scenario}:`);
  examples.forEach(example => {
    console.log(`  ${example}`);
  });
}

// Example 4: Advanced bunx features
console.log("\n4️⃣ Advanced bunx Features");
console.log("--------------------------");

console.log("--bun flag:");
console.log("  # Force execution with Bun runtime");
console.log("  bunx --bun my-cli    # ✅ Good");
console.log("  bunx my-cli --bun    # ❌ Bad");
console.log();

console.log("--package/-p flag:");
console.log("  # When binary name differs from package name");
console.log("  bunx -p @angular/cli ng new my-app");
console.log("  bunx --package renovate renovate-config-validator");
console.log();

console.log("Shebang handling:");
console.log("  # Scripts with #!/usr/bin/env node");
console.log("  bunx --bun script-with-node-shebang.js");
console.log();

console.log("Local vs Global:");
console.log("  # bunx first checks node_modules/.bin");
console.log("  # Then downloads and caches globally");
console.log("  # Cached packages are reused across projects");

// Example 5: Practical workflow examples
console.log("\n5️⃣ Practical Workflow Examples");
console.log("------------------------------");

const workflows = [
  {
    title: "New Project Setup",
    steps: [
      "bunx create-react-app my-app",
      "cd my-app",
      "bunx prettier --write src/",
      "bunx eslint src/ --fix"
    ]
  },
  {
    title: "Database Migration",
    steps: [
      "bunx prisma migrate dev",
      "bunx prisma generate",
      "bunx prisma studio"
    ]
  },
  {
    title: "Build and Deploy",
    steps: [
      "bunx vite build",
      "bunx serve -s dist",
      "bunx netlify-cli deploy --prod"
    ]
  },
  {
    title: "Testing Workflow",
    steps: [
      "bunx jest --coverage",
      "bunx cypress run",
      "bunx playwright test"
    ]
  }
];

for (const { title, steps } of workflows) {
  console.log(`\n${title}:`);
  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });
}

// Example 6: Speed comparison - bunx vs npx
console.log("\n6️⃣ ⚡ Speed Comparison - bunx vs npx");
console.log("------------------------------------");

console.log("🚀 Performance Benchmark:");
console.log("  With Bun's fast startup times, bunx is roughly 100x faster than npx for locally installed packages!");
console.log();

console.log("Why bunx is so fast:");
console.log("  • Bun's ultra-fast runtime startup");
console.log("  • Efficient package caching mechanism");
console.log("  • No temporary directory creation/cleanup");
console.log("  • Native binary execution");
console.log("  • Optimized package resolution");
console.log();

console.log("Real-world impact:");
console.log("  • npx: ~2-3 seconds for simple commands");
console.log("  • bunx: ~20-30ms for same commands");
console.log("  • CI/CD pipelines run significantly faster");
console.log("  • Development workflow is more fluid");

// Example 7: bunx vs npm/npx vs yarn dlx comparison
console.log("\n7️⃣ bunx vs npm/npx vs yarn dlx Comparison");
console.log("-----------------------------------------");

console.log("npm npx:");
console.log("  npx create-react-app my-app");
console.log("  npx [email protected] --version");
console.log("  # Uses npm registry, slower");
console.log();

console.log("yarn dlx:");
console.log("  yarn dlx create-react-app my-app");
console.log("  yarn dlx [email protected] --version");
console.log("  # Uses Yarn registry, temporary installation");
console.log();

console.log("bunx (Bun's equivalent):");
console.log("  bunx create-react-app my-app");
console.log("  bunx [email\protected] --version");
console.log("  # Uses Bun's package manager, faster");
console.log();

console.log("Performance advantages:");
console.log("  ⚡ Speed - With Bun's fast startup times, bunx is roughly 100x faster than npx for locally installed packages!");
console.log("  ✅ Faster package installation");
console.log("  ✅ Better caching mechanism");
console.log("  ✅ Integrated with Bun runtime");
console.log("  ✅ Automatic shebang detection");
console.log("  ✅ No temporary cleanup needed");

// Example 8: Tips and best practices
console.log("\n8️⃣ Tips and Best Practices");
console.log("---------------------------");

const tips = [
  {
    category: "Performance",
    tips: [
      "Use specific versions for reproducible builds",
      "Cache is automatic - no need to manage manually",
      "bunx --bun for better performance with Bun-optimized packages"
    ]
  },
  {
    category: "Compatibility",
    tips: [
      "Check if package supports Bun runtime",
      "Use --bun flag for Node.js scripts",
      "Some packages may need Node.js-specific features"
    ]
  },
  {
    category: "CI/CD",
    tips: [
      "Pin versions in CI/CD pipelines",
      "Use bunx for zero-install dependencies",
      "Combine with bun install for project dependencies"
    ]
  },
  {
    category: "Development",
    tips: [
      "Great for trying new tools without installation",
      "Useful for one-off operations",
      "Ideal for scripts and automation"
    ]
  }
];

for (const { category, tips: tipList } of tips) {
  console.log(`\n${category}:`);
  tipList.forEach(tip => {
    console.log(`  • ${tip}`);
  });
}

// Example 9: Common issues and solutions
console.log("\n9️⃣ Common Issues and Solutions");
console.log("--------------------------------");

const issues = [
  {
    issue: "Package not found",
    solution: "Check package name and spelling, ensure it exists on npm"
  },
  {
    issue: "Permission denied",
    solution: "Use --bun flag or check file permissions"
  },
  {
    issue: "Version conflicts",
    solution: "Specify exact version with @x.y.z syntax"
  },
  {
    issue: "Binary not found",
    solution: "Use -p flag when binary name differs from package name"
  },
  {
    issue: "Node.js dependencies",
    solution: "Use --bun flag or install with npm instead"
  }
];

for (const { issue, solution } of issues) {
  console.log(`\nIssue: ${issue}`);
  console.log(`Solution: ${solution}`);
}

// Summary
console.log("\n📋 bunx Summary");
console.log("================");
console.log("✅ bunx is an alias for 'bun x' (both work identically)");
console.log("✅ Auto-installed with Bun - no separate installation needed");
console.log("✅ Use bunx to auto-install and run packages from npm");
console.log("✅ Bun's equivalent of npx or yarn dlx");
console.log("⚡ Speed - Roughly 100x faster than npx for locally installed packages!");
console.log("✅ Caches packages globally for reuse");
console.log("✅ Supports version pinning");
console.log("✅ Works with --bun flag for better performance");
console.log("✅ Handles shebangs automatically");

console.log("\n💡 When to use bunx:");
console.log("---------------------");
console.log("• Trying new tools without installation");
console.log("• Running one-off commands");
console.log("• CI/CD pipelines with minimal dependencies");
console.log("• Scripts and automation");
console.log("• Cross-platform package execution");

console.log("\n🔧 Remember:");
console.log("------------");
console.log("• bunx = bun eXecute (like npx or yarn dlx but faster)");
console.log("• bunx is an alias for 'bun x'");
console.log("• Uses Bun's package manager under the hood");
console.log("• Great for development workflows");
console.log("• Not a replacement for project dependencies");

console.log("\n✨ bunx demonstration complete! 🚀");
