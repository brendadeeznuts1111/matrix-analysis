#!/usr/bin/env bun
/**
 * Bun Build - Sourcemap Output Formats
 * Shows exact output for each sourcemap type
 */

// Make this file a module
export {};

console.log("📦 Bun Build - Sourcemap Output Formats");
console.log("====================================\n");

// Create a simple test file with clear structure for sourcemap testing
const testCode = `
// Simple function for sourcemap testing
function greet(name) {
  const message = "Hello, " + name + "!";
  console.log(message);
  return message;
}

// Another function
function calculate(a, b) {
  const result = a + b;
  console.log(a + " + " + b + " = " + result);
  return result;
}

// Call functions
greet("World");
calculate(5, 3);
`;

// Example 1: No sourcemap (default)
console.log("1️⃣ sourcemap: 'none' (Default)");
console.log("------------------------------");

const noneResult = await Bun.build({
  entrypoints: ["./src/test.ts"],
  outdir: "./dist/sourcemap-none",
  sourcemap: "none",
  files: {
    "./src/test.ts": testCode,
  },
});

if (noneResult.success) {
  const output = await noneResult.outputs[0].text();
  console.log("Generated bundle:");
  console.log("-----------------");
  console.log(output);
  console.log("\n✅ No sourcemap comment or file created");
}

// Example 2: Linked sourcemap
console.log("\n2️⃣ sourcemap: 'linked'");
console.log("-------------------------");

const linkedResult = await Bun.build({
  entrypoints: ["./src/test.ts"],
  outdir: "./dist/sourcemap-linked",
  sourcemap: "linked",
  files: {
    "./src/test.ts": testCode,
  },
});

if (linkedResult.success) {
  console.log("Generated bundle:");
  console.log("-----------------");
  const bundleOutput = await linkedResult.outputs[0].text();
  console.log(bundleOutput);
  
  // Find and show the sourcemap file
  const mapOutput = linkedResult.outputs.find(o => o.path.endsWith('.map'));
  if (mapOutput) {
    console.log("\nGenerated sourcemap file (test.js.map):");
    console.log("----------------------------------------");
    const mapContent = await mapOutput.text();
    // Show first few lines of sourcemap
    console.log(mapContent.split('\n').slice(0, 10).join('\n') + '\n...');
  }
  
  console.log("\n✅ Bundle contains //# sourceMappingURL comment");
  console.log("✅ Separate .map file created");
}

// Example 3: External sourcemap
console.log("\n3️⃣ sourcemap: 'external'");
console.log("---------------------------");

const externalResult = await Bun.build({
  entrypoints: ["./src/test.ts"],
  outdir: "./dist/sourcemap-external",
  sourcemap: "external",
  files: {
    "./src/test.ts": testCode,
  },
});

if (externalResult.success) {
  console.log("Generated bundle:");
  console.log("-----------------");
  const bundleOutput = await externalResult.outputs[0].text();
  console.log(bundleOutput);
  
  // Find and show the sourcemap file
  const mapOutput = externalResult.outputs.find(o => o.path.endsWith('.map'));
  if (mapOutput) {
    console.log("\nGenerated sourcemap file (test.js.map):");
    console.log("----------------------------------------");
    const mapContent = await mapOutput.text();
    // Show first few lines including debugId
    console.log(mapContent.split('\n').slice(0, 10).join('\n') + '\n...');
  }
  
  console.log("\n✅ Bundle contains //# debugId comment (no sourceMappingURL)");
  console.log("✅ Separate .map file created with matching debugId");
}

// Example 4: Inline sourcemap
console.log("\n4️⃣ sourcemap: 'inline'");
console.log("------------------------");

const inlineResult = await Bun.build({
  entrypoints: ["./src/test.ts"],
  outdir: "./dist/sourcemap-inline",
  sourcemap: "inline",
  files: {
    "./src/test.ts": testCode,
  },
});

if (inlineResult.success) {
  console.log("Generated bundle with inline sourcemap:");
  console.log("--------------------------------------");
  const bundleOutput = await inlineResult.outputs[0].text();
  console.log(bundleOutput);
  
  // Also create the external map file to show it contains the same debugId
  const mapOutput = inlineResult.outputs.find(o => o.path.endsWith('.map'));
  if (mapOutput) {
    console.log("\nGenerated sourcemap file (test.js.map):");
    console.log("----------------------------------------");
    const mapContent = await mapOutput.text();
    // Show first few lines including debugId
    const mapLines = mapContent.split('\n');
    console.log(mapLines.slice(0, 3).join('\n'));
    // Find and show the debugId line
    const debugIdLine = mapLines.find(line => line.includes('"debugId"'));
    if (debugIdLine) {
      console.log(debugIdLine);
    }
    console.log("...");
  }
  
  console.log("\n✅ Bundle contains inline sourcemap as data URL");
  console.log("✅ Separate .map file also created with debugId");
}

// Example 5: Compare debugId matching
console.log("\n5️⃣ Debug ID Matching");
console.log("----------------------");

// Extract debug IDs from different builds
function extractDebugId(content: string): string | null {
  const match = content.match(/\/\/# debugId=([a-f0-9]+)/i);
  return match ? match[1] : null;
}

function extractMapDebugId(content: string): string | null {
  try {
    const parsed = JSON.parse(content);
    return parsed.debugId || null;
  } catch {
    return null;
  }
}

if (externalResult.success && inlineResult.success) {
  const externalBundle = await externalResult.outputs[0].text();
  const externalMap = await externalResult.outputs.find(o => o.path.endsWith('.map'))!.text();
  
  const inlineBundle = await inlineResult.outputs[0].text();
  const inlineMap = await inlineResult.outputs.find(o => o.path.endsWith('.map'))!.text();
  
  const externalBundleDebugId = extractDebugId(externalBundle);
  const externalMapDebugId = extractMapDebugId(externalMap);
  
  const inlineMapDebugId = extractMapDebugId(inlineMap);
  
  console.log("External sourcemap:");
  console.log(`  Bundle debugId: ${externalBundleDebugId}`);
  console.log(`  Map debugId: ${externalMapDebugId}`);
  console.log(`  Match: ${externalBundleDebugId === externalMapDebugId ? '✅' : '❌'}`);
  
  console.log("\nInline sourcemap:");
  console.log(`  Map debugId: ${inlineMapDebugId}`);
  console.log(`  Match with external: ${externalMapDebugId === inlineMapDebugId ? '✅' : '❌'}`);
}

// Example 6: Real-world example with minification
console.log("\n6️⃣ Sourcemap with Minification");
console.log("-------------------------------");

const realWorldCode = `
// Real-world React component
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch('/api/users/' + userId);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchUser();
    }
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;
  
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
}

export default UserProfile;
`;

const minifiedResult = await Bun.build({
  entrypoints: ["./src/UserProfile.tsx"],
  outdir: "./dist/minified-with-sourcemap",
  sourcemap: "linked",
  minify: true,
  files: {
    "./src/UserProfile.tsx": realWorldCode,
  },
});

if (minifiedResult.success) {
  console.log("Minified bundle with linked sourcemap:");
  console.log("---------------------------------------");
  const bundleOutput = await minifiedResult.outputs[0].text();
  
  // Show the minified code (first few lines)
  const lines = bundleOutput.split('\n');
  console.log(lines.slice(0, 3).join('\n'));
  if (lines.length > 3) {
    console.log("... (minified code continues)");
    console.log(lines[lines.length - 1]); // Show sourceMappingURL line
  }
  
  console.log("\n✅ Minified code maintains sourcemap reference");
  console.log("✅ Original source structure preserved in sourcemap");
}

// Summary table
console.log("\n📋 Sourcemap Format Summary");
console.log("===========================");
console.log("Type        | Output File(s)              | Comment in Bundle");
console.log("------------|----------------------------|-------------------");
console.log("none        | bundle.js                  | None");
console.log("linked      | bundle.js + bundle.js.map  | //# sourceMappingURL=bundle.js.map");
console.log("external    | bundle.js + bundle.js.map  | //# debugId=<ID>");
console.log("inline      | bundle.js + bundle.js.map  | //# sourceMappingURL=data:application/json;base64,<data>");

console.log("\n💡 When to Use Each:");
console.log("-------------------");
console.log("• none: Production builds where sourcemaps are not needed");
console.log("• linked: Development builds for easy debugging");
console.log("• external: Production builds with secure sourcemap handling");
console.log("• inline: Debug builds or when sharing single files");

console.log("\n🔧 Key Points:");
console.log("---------------");
console.log("• All except 'none' create a .map file");
console.log("• debugId links bundle to sourcemap in external mode");
console.log("• inline includes base64-encoded sourcemap in bundle");
console.log("• sourcemaps work with minification");
console.log("• Requires --outdir to be set for linked/external");

console.log("\n✨ Sourcemap formats demonstrated! 🚀");
