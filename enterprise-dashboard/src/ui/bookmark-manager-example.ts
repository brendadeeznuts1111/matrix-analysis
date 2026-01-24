/**
 * Chrome Bookmark Manager - Usage Examples
 * Demonstrates how to use ChromeSpecBookmarkManager
 */

import { ChromeSpecBookmarkManager, startEnterpriseBookmarkManager } from "./chrome-bookmark-manager.ts";

// Example 1: Basic Usage
async function basicExample() {
  console.log("📚 Example 1: Basic Bookmark Manager Usage\n");
  
  const manager = new ChromeSpecBookmarkManager();
  
  // Sync with Chrome (automatically checks for workspace profile)
  console.log("🔄 Syncing with Chrome...");
  const syncResult = await manager.syncWithChrome();
  
  if (syncResult.imported > 0) {
    console.log(`✅ Loaded ${syncResult.imported} bookmarks from Chrome\n`);
  } else {
    console.log("⚠️  No Chrome bookmarks found, using empty manager\n");
  }
  
  // Add some bookmarks manually
  const added = manager.batchAddBookmarks([
    { title: "Bun Documentation", url: "https://bun.sh/docs" },
    { title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs" },
    { title: "React Docs", url: "https://react.dev" },
  ]);
  
  console.log(`✅ Added ${added} bookmarks\n`);
  
  // Render the bookmark tree
  manager.render();
  
  return manager;
}

// Example 2: Sync with Specific Profile
async function profileSpecificExample() {
  console.log("📚 Example 2: Sync with Specific Chrome Profile\n");
  
  const manager = new ChromeSpecBookmarkManager();
  
  // List available profiles
  const profiles = await manager.listChromeProfiles();
  console.log(`📋 Available Chrome Profiles:`);
  profiles.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.directory})`);
  });
  
  if (profiles.length > 0) {
    // Sync with first profile
    const firstProfile = profiles[0];
    console.log(`\n🔄 Syncing with profile: ${firstProfile.name}`);
    await manager.syncWithChrome(firstProfile.name);
  }
  
  return manager;
}

// Example 3: Search and Navigation
async function searchExample() {
  console.log("📚 Example 3: Search Functionality\n");
  
  const manager = new ChromeSpecBookmarkManager();
  await manager.syncWithChrome();
  
  // Search for bookmarks
  const results = manager.search("react");
  console.log(`\n🔍 Found ${results.length} bookmarks matching "react"`);
  
  results.forEach((bookmark, i) => {
    console.log(`   ${i + 1}. ${bookmark.title}`);
    console.log(`      ${bookmark.url}`);
    console.log(`      Folder: ${bookmark.folderPath.join(" › ")}`);
  });
  
  return manager;
}

// Example 4: Export Bookmarks
async function exportExample() {
  console.log("📚 Example 4: Export Bookmarks\n");
  
  const manager = new ChromeSpecBookmarkManager();
  await manager.syncWithChrome();
  
  // Export to JSON file
  const exportPath = "./my-bookmarks-export.json";
  manager.exportToFile(exportPath);
  console.log(`✅ Bookmarks exported to ${exportPath}\n`);
  
  return manager;
}

// Example 5: Interactive Mode
async function interactiveExample() {
  console.log("📚 Example 5: Interactive Tree Mode\n");
  console.log("This will start the interactive bookmark manager...\n");
  
  // Start the full interactive interface
  await startEnterpriseBookmarkManager();
}

// Example 6: Error Handling with Workspace Profile
async function errorHandlingExample() {
  console.log("📚 Example 6: Error Handling\n");
  
  const manager = new ChromeSpecBookmarkManager();
  
  // Ensure workspace profile exists (will create if needed)
  console.log("🔍 Checking workspace profile...");
  const profileReady = await manager.ensureWorkspaceProfile();
  
  if (profileReady) {
    console.log("✅ Workspace profile ready\n");
  } else {
    console.log("⚠️  Workspace profile setup incomplete\n");
    console.log("   Error details should open in browser tab\n");
  }
  
  // Try to sync (will show error page if Chrome not found)
  await manager.syncWithChrome();
  
  return manager;
}

// Example 7: Batch Operations
async function batchOperationsExample() {
  console.log("📚 Example 7: Batch Bookmark Operations\n");
  
  const manager = new ChromeSpecBookmarkManager();
  
  // Add multiple bookmarks at once
  const bookmarks = [
    { title: "GitHub", url: "https://github.com", folderId: "1" }, // Bookmarks Bar
    { title: "Stack Overflow", url: "https://stackoverflow.com", folderId: "1" },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org", folderId: "2" }, // Other Bookmarks
    { title: "Can I Use", url: "https://caniuse.com", folderId: "2" },
  ];
  
  const added = manager.batchAddBookmarks(bookmarks);
  console.log(`✅ Added ${added} bookmarks in batch\n`);
  
  // Render to see them
  manager.render();
  
  return manager;
}

// Main execution
if (import.meta.main) {
  console.log("🚀 Chrome Bookmark Manager - Examples\n");
  console.log("=".repeat(60) + "\n");
  
  // Run examples based on command line argument
  const example = process.argv[2] || "1";
  
  switch (example) {
    case "1":
      await basicExample();
      break;
    case "2":
      await profileSpecificExample();
      break;
    case "3":
      await searchExample();
      break;
    case "4":
      await exportExample();
      break;
    case "5":
      await interactiveExample();
      break;
    case "6":
      await errorHandlingExample();
      break;
    case "7":
      await batchOperationsExample();
      break;
    default:
      console.log("Available examples:");
      console.log("  1 - Basic Usage");
      console.log("  2 - Profile-Specific Sync");
      console.log("  3 - Search");
      console.log("  4 - Export");
      console.log("  5 - Interactive Mode");
      console.log("  6 - Error Handling");
      console.log("  7 - Batch Operations");
      console.log("\nUsage: bun bookmark-manager-example.ts [1-7]");
      console.log("Or: bun bookmark-manager-example.ts 5  (for interactive mode)");
  }
}

export {
  basicExample,
  profileSpecificExample,
  searchExample,
  exportExample,
  interactiveExample,
  errorHandlingExample,
  batchOperationsExample,
};
