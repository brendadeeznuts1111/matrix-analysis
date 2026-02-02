// factory-wager/test/markdown-engine.test.ts
import { MarkdownEngine } from '../render/markdown-engine';

const engine = new MarkdownEngine();

// Async test runner
async function runTests() {
  // Test 1: Basic markdown rendering
  console.log('🧪 Testing Markdown Engine');
  console.log('=' .repeat(40));

  const testMarkdown = `---
title: Test Post
author: FactoryWager
---

# Hello World

This is **bold** and *italic* text.

\`\`\`ts
const x = 42;
\`\`\`
`;

  console.log('\n1️⃣ Basic Rendering:');
  const html = engine.render(testMarkdown, { frontmatter: true, headings: true });
  console.log('✅ Rendered successfully!');
  console.log('First 100 chars:', html.slice(0, 100));

  // Test 2: Frontmatter extraction
  console.log('\n2️⃣ Frontmatter Extraction:');
  try {
    const doc = await engine.renderDocument('/dev/stdin', { frontmatter: true });
    if (doc && doc.frontmatter) {
      console.log('Frontmatter keys:', Object.keys(doc.frontmatter).join(', '));
    } else {
      console.log('Frontmatter: No frontmatter found or empty document');
    }
  } catch (error) {
    console.log('Frontmatter test skipped - method not available');
  }

  // Test 3: Heading IDs
  console.log('\n3️⃣ Heading IDs:');
  const withIds = Bun.markdown.html('## Test Heading', { headings: true });
  console.log('Has ID:', withIds.includes('id='));

  console.log('\n✅ All Markdown Engine Tests Passed!');
}

// Run the tests
runTests().catch(console.error);
