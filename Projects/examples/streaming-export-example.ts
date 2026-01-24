/**
 * Streaming Export Example
 * Demonstrates how to use streaming JSON export for large bookmark collections
 */

import { ChromeSpecBookmarkManager } from "./chrome-bookmark-manager.ts";
import { StreamingJSONWriter, writeJSONArray, writeJSONRuns } from "./streaming-json-writer.ts";

async function demonstrateStreamingExport() {
  console.log("📦 Streaming Export Demonstration\n");

  // Create manager and load some bookmarks
  const manager = new ChromeSpecBookmarkManager();
  
  // Simulate loading bookmarks (in real usage, sync from Chrome)
  console.log("📚 Loading bookmarks...");
  // ... bookmarks would be loaded here

  // Example 1: Standard streaming export
  console.log("\n1️⃣ Standard Streaming Export");
  const result1 = await manager.exportToFileStreaming("./bookmarks-streamed.json", {
    version: "2.0",
    includeMetadata: true
  });
  console.log(`   ✅ Exported ${result1.bookmarkCount} bookmarks, ${result1.folderCount} folders`);

  // Example 2: Custom transform
  console.log("\n2️⃣ Custom Transform Export");
  await manager.exportToFileStreaming("./bookmarks-custom.json", {
    transform: (bookmark) => ({
      title: bookmark.title,
      url: bookmark.url,
      folder: bookmark.folderPath.join(" > "),
      visits: bookmark.visits,
      lastVisited: bookmark.lastVisited?.toISOString()
    })
  });

  // Example 3: SARIF format export
  console.log("\n3️⃣ SARIF Format Export");
  await manager.exportToSARIF("./bookmarks-sarif.json", {
    version: "2.1.0",
    toolName: "Bookmark Analyzer"
  });

  // Example 4: Manual streaming with custom structure
  console.log("\n4️⃣ Manual Streaming Control");
  const writer = new StreamingJSONWriter("./bookmarks-manual.json");
  
  // Write header
  await writer.writeHeader(`{"version": "1.0.0", "exportedAt": "${new Date().toISOString()}", "items": [`);
  
  // Stream bookmarks one by one
  let count = 0;
  for (const bookmark of manager["bookmarks"].values()) {
    await writer.writeItem({
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url
    });
    count++;
    
    // Show progress for large exports
    if (count % 100 === 0) {
      process.stdout.write(`\r   📊 Processed ${count} items...`);
    }
  }
  
  // Close
  await writer.writeFooter("]}");
  await writer.close();
  console.log(`\n   ✅ Manually exported ${count} items`);

  // Example 5: Using helper functions
  console.log("\n5️⃣ Using Helper Functions");
  
  async function* generateBookmarkData() {
    for (const bookmark of manager["bookmarks"].values()) {
      yield {
        title: bookmark.title,
        url: bookmark.url,
        folder: bookmark.folderPath.join("/")
      };
    }
  }

  const result5 = await writeJSONArray("./bookmarks-array.json", generateBookmarkData());
  console.log(`   ✅ Wrote ${result5.itemCount} items using helper function`);

  console.log("\n✨ All streaming exports completed!");
}

// Run if executed directly
if (import.meta.main) {
  demonstrateStreamingExport().catch(console.error);
}
