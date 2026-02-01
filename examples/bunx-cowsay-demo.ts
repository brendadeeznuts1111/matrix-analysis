#!/usr/bin/env bun
/**
 * bunx cowsay Demonstration
 * Shows what the command `bunx cowsay "Hello world!"` would produce
 */

console.log("🐮 bunx cowsay Demonstration");
console.log("============================\n");

console.log("Command: bunx cowsay \"Hello world!\"");
console.log("This would auto-install and run the cowsay package from npm");
console.log();

console.log("Expected Output:");
console.log(" _______________");
console.log("< Hello world! >");
console.log(" ---------------");
console.log("        \\   ^__^");
console.log("         \\  (oo)\\_______");
console.log("            (__)\\       )\\/\\");
console.log("                ||----w |");
console.log("                ||     ||");
console.log();

console.log("💡 What's happening:");
console.log("1. bunx checks if cowsay is installed locally");
console.log("2. If not, it downloads and caches cowsay from npm");
console.log("3. Runs cowsay with the argument \"Hello world!\"");
console.log("4. The ASCII art cow says \"Hello world!\"");
console.log();

console.log("🚀 Alternative commands that work the same:");
console.log("bun x cowsay \"Hello world!\"  # bunx is an alias for bun x");
console.log("npx cowsay \"Hello world!\"   # npm version (slower)");
console.log("yarn dlx cowsay \"Hello world!\" # yarn version");
console.log();

console.log("📋 Other fun examples:");
console.log("bunx cowsay \"Moo!\"");
console.log("bunx cowsay \"Bun is fast!\"");
console.log("bunx cowsay -f dragon \"Rawr!\"");
console.log("bunx cowsay -l  # List all cow files");
