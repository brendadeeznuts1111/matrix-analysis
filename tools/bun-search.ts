#!/usr/bin/env bun
// Bun Package Search Tool
// Usage: bun run bun-search.ts <query>
import { EXIT_CODES } from "../.claude/lib/exit-codes.ts";

const query = Bun.argv.slice(2).join(" ");

if (!query) {
  console.error("Usage: bun run bun-search.ts <package-name>");
  process.exit(EXIT_CODES.USAGE_ERROR);
}

// Search npm registry using npm's API
const searchPackages = async (q: string) => {
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=20`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`\n🔍 Search results for "${q}":\n`);
    
    for (const pkg of data.objects || []) {
      const p = pkg.package;
      console.log(`📦 ${p.name}@${p.version}`);
      console.log(`   ${p.description?.slice(0, 80) || "No description"}${p.description?.length > 80 ? "..." : ""}`);
      console.log(`   ⬇️  Weekly downloads: ${pkg.downloads?.weekly?.toLocaleString() || "N/A"}`);
      console.log(`   🔗 https://www.npmjs.com/package/${p.name}\n`);
    }
    
    console.log(`Found ${data.total} packages total`);
    
  } catch (err) {
    console.error("Search failed:", err);
    process.exit(EXIT_CODES.USAGE_ERROR);
  }
};

searchPackages(query);
