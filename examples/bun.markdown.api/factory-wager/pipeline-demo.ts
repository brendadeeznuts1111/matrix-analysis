#!/usr/bin/env bun
// factory-wager/pipeline-demo.ts
import { ANSIRenderer } from './render/ansi-renderer';
import { ANSIDiffer } from './render/ansi-diff';
import { OpenGraphASCIICard } from './render/opengraph-ascii';

console.log('🏭 FactoryWager v4.0 Pipeline Demonstration\n');
console.log('=' .repeat(50));

// Sample markdown content
const testDoc = `---
title: FactoryWager Test Configuration
description: Demo for fw-analyze → fw-validate → fw-changelog pipeline
author: Security Team
date: 2026-02-01
draft: false
tags: [demo, v4, crc32]
---

# FactoryWager Pipeline Demo

This demonstrates **Bun.markdown.html** integration with ANSI rendering.

## Features

- ✅ CRC32 Hardware Acceleration
- ✅ Tiered Validation
- ✅ Streaming Validation
- ✅ ANSI Terminal Output

\`\`\`ts
const result = await validator.validateStream(file);
console.log(result.throughputMbps + ' MB/s');
\`\`\``;

// 1. Test Bun.markdown.html
console.log('\n1️⃣  Bun.markdown.html Output:');
const html = Bun.markdown.html('# Hello **world**', { headingIds: true });
console.log('   Input: # Hello **world**');
console.log('   Output:', html.trim());

// 2. ANSI Frontmatter Table
console.log('\n2️⃣  ANSI Frontmatter Table:');
const ansi = new ANSIRenderer();
const fmMatch = testDoc.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (fmMatch) {
  const fm: Record<string, any> = {};
  fmMatch[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  });
  console.log(ansi.renderFrontmatter(fm));
}

// 3. OpenGraph Card
console.log('\n3️⃣  OpenGraph ASCII Card:');
const og = new OpenGraphASCIICard();
console.log(og.render({
  title: 'FactoryWager v4.0',
  description: 'Hardware-accelerated validation with PCLMULQDQ instructions',
  author: 'Security Team',
  date: '2026-02-01'
}));

// 4. Diff Demo
console.log('\n4️⃣  ANSI Diff Demo:');
const oldDoc = `---
title: Old Config
version: 1.0
---
# Old Title`;

const newDoc = `---
title: New Config
version: 2.0
status: active
---
# New Title

Updated content.`;

const differ = new ANSIDiffer();
console.log(differ.diffFiles(oldDoc, newDoc));

console.log('\n' + '=' .repeat(50));
console.log('✅ Pipeline demonstration complete!');
console.log('\nNext steps:');
console.log('  bun run fw:analyze config.yaml');
console.log('  bun run fw:validate config.yaml --strict');
console.log('  bun run fw:changelog --from=HEAD~1');
