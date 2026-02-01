#!/usr/bin/env bun
/**
 * Bun Update - Complete Demonstration
 * Shows how to use bun update to manage dependencies
 */

// Make this file a module
export {};

console.log("📦 Bun Update - Complete Demonstration");
console.log("=====================================\n");

// Example 1: Basic usage
console.log("1️⃣ Basic bun update Usage");
console.log("--------------------------");

console.log("Update all dependencies:");
console.log("  bun update");
console.log();

console.log("Update a specific dependency:");
console.log("  bun update react");
console.log("  bun update [package]");
console.log();

console.log("Update to specific version:");
console.log("  bun update [email protected]");
console.log();

// Example 2: Interactive mode
console.log("2️⃣ Interactive Update Mode");
console.log("---------------------------");

console.log("Launch interactive interface:");
console.log("  bun update --interactive");
console.log("  bun update -i");
console.log();

console.log("Interactive interface shows:");
console.log();
console.log("? Select packages to update - Space to toggle, Enter to confirm");
console.log();
console.log("  dependencies                Current  Target   Latest");
console.log("    □ react                   17.0.2   18.2.0   18.3.1");
console.log("    □ lodash                  4.17.20  4.17.21  4.17.21");
console.log();
console.log("  devDependencies             Current  Target   Latest");
console.log("    □ typescript              4.8.0    5.0.0    5.3.3");
console.log("    □ @types/node             16.11.7  18.0.0   20.11.5");
console.log();

// Example 3: Keyboard controls
console.log("3️⃣ Interactive Mode - Keyboard Controls");
console.log("----------------------------------------");

const keyboardControls = [
  { category: "Selection", keys: [
    { key: "Space", action: "Toggle package selection" },
    { key: "Enter", action: "Confirm selections and update" },
    { key: "a/A", action: "Select all packages" },
    { key: "n/N", action: "Select none" },
    { key: "i/I", action: "Invert selection" }
  ]},
  { category: "Navigation", keys: [
    { key: "↑/↓ or j/k", action: "Move cursor" },
    { key: "l/L", action: "Toggle between target and latest version" }
  ]},
  { category: "Exit", keys: [
    { key: "Ctrl+C/Ctrl+D", action: "Cancel without updating" }
  ]}
];

for (const { category, keys } of keyboardControls) {
  console.log(`\n${category}:`);
  keys.forEach(({ key, action }) => {
    console.log(`  ${key.padEnd(15)} - ${action}`);
  });
}

// Example 4: Visual indicators
console.log("\n4️⃣ Visual Indicators");
console.log("--------------------");

console.log("☑ Selected packages (will be updated)");
console.log("□ Unselected packages");
console.log("> Current cursor position");
console.log("🔴 Major version change");
console.log("🟡 Minor version change");
console.log("🟢 Patch version change");
console.log("⎯ Currently selected update target");

// Example 5: Advanced flags
console.log("\n5️⃣ Advanced Update Flags");
console.log("-------------------------");

const flags = [
  {
    flag: "--latest",
    description: "Update packages to their latest versions (ignores semver)",
    example: "bun update --latest"
  },
  {
    flag: "--recursive",
    description: "Update dependencies across all workspaces in a monorepo",
    example: "bun update -i -r"
  },
  {
    flag: "--production",
    description: "Don't install devDependencies",
    example: "bun update --production"
  },
  {
    flag: "--global",
    description: "Install globally",
    example: "bun update --global"
  },
  {
    flag: "--dry-run",
    description: "Show what would be updated without installing",
    example: "bun update --dry-run"
  },
  {
    flag: "--force",
    description: "Always request latest versions & reinstall all",
    example: "bun update --force"
  }
];

for (const { flag, description, example } of flags) {
  console.log(`\n${flag}:`);
  console.log(`  ${description}`);
  console.log(`  Example: ${example}`);
}

// Example 6: Version comparison example
console.log("\n6️⃣ Version Comparison Example");
console.log("------------------------------");

console.log("Given package.json:");
console.log(`{
  "dependencies": {
    "react": "^17.0.2"
  }
}`);
console.log();

console.log("Different update behaviors:");
console.log("  bun update        → Updates to latest 17.x (e.g., 17.0.3)");
console.log("  bun update --latest → Updates to latest (e.g., 18.3.1)");
console.log();

// Example 7: Workflow examples
console.log("7️⃣ Common Update Workflows");
console.log("--------------------------");

const workflows = [
  {
    name: "Update all packages safely",
    commands: [
      "bun update --dry-run  # See what would update",
      "bun update -i         # Select packages interactively",
      "bun test              # Run tests after update"
    ]
  },
  {
    name: "Update a specific package",
    commands: [
      "bun update react      # Update react to latest compatible",
      "bun update [email protected]  # Update to specific version"
    ]
  },
  {
    name: "Monorepo workspace update",
    commands: [
      "bun update -i -r      # Interactive update across all workspaces"
    ]
  },
  {
    name: "Production update",
    commands: [
      "bun update --production  # Only update production dependencies"
    ]
  }
];

for (const { name, commands } of workflows) {
  console.log(`\n${name}:`);
  commands.forEach(cmd => console.log(`  ${cmd}`));
}

// Example 8: Best practices
console.log("\n8️⃣ Best Practices");
console.log("-----------------");

const practices = [
  "Always use --dry-run first to see what will change",
  "Use interactive mode (-i) for selective updates",
  "Pin major versions in package.json for stability",
  "Test after updating dependencies",
  "Use --latest with caution (may break compatibility)",
  "Commit package.json and lockfile before updating",
  "Review changelogs for major version updates",
  "Use --recursive for monorepo updates"
];

practices.forEach((practice, index) => {
  console.log(`${index + 1}. ${practice}`);
});

// Example 9: Troubleshooting
console.log("\n9️⃣ Common Issues & Solutions");
console.log("------------------------------");

const issues = [
  {
    issue: "Update fails due to peer dependency conflicts",
    solution: "Use --force or manually resolve conflicts"
  },
  {
    issue: "Package doesn't update to latest",
    solution: "Check semver range in package.json or use --latest"
  },
  {
    issue: "Lockfile conflicts",
    solution: "Delete lockfile and run bun install"
  },
  {
    issue: "Network timeouts",
    solution: "Check internet connection or use --registry"
  }
];

for (const { issue, solution } of issues) {
  console.log(`\nIssue: ${issue}`);
  console.log(`Solution: ${solution}`);
}

// Summary
console.log("\n📋 bun update Summary");
console.log("====================");
console.log("✅ Update all dependencies: bun update");
console.log("✅ Update specific package: bun update [package]");
console.log("✅ Interactive selection: bun update -i");
console.log("✅ Update to latest (ignore semver): bun update --latest");
console.log("✅ Monorepo support: bun update -i -r");
console.log("✅ Preview changes: bun update --dry-run");
console.log("✅ Production only: bun update --production");

console.log("\n💡 Remember:");
console.log("------------");
console.log("• bun update = Update project dependencies");
console.log("• bun upgrade = Upgrade Bun CLI itself");
console.log("• Always test after updating dependencies");
console.log("• Use interactive mode for control");

console.log("\n✨ Happy updating! 🚀");
