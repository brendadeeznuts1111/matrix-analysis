#!/usr/bin/env bun
// Bun Markdown Parser Demo
// Demonstrating Bun v1.3.8's built-in markdown capabilities

import { write } from 'bun';

console.log('📝 Bun Markdown Parser Demo');
console.log('==========================\n');

// Sample tension field report in markdown
const tensionReport = `
# Tension Field Analysis Report

## Overview
Generated on ${new Date().toLocaleDateString()}

### System Status
- ✅ All nodes operational
- ⚠️ 3 nodes with elevated tension
- 📊 Average tension: 0.73

## Performance Metrics

| Metric | Value | Status |
|--------|-------|---------|
| Throughput | 9,344 req/s | 🟢 Excellent |
| Latency | 0.11ms | 🟢 Excellent |
| Error Rate | 0.00% | 🟢 Perfect |

## Recent Alerts

### High Priority
- [x] Node A-42 tension spike resolved
- [ ] Node B-17 requires attention
- [ ] Memory usage trending upward

### Low Priority
- [x] Dashboard update completed
- [ ] Documentation review scheduled

## Code Examples

\`\`\`typescript
// Analyze tension with error handling
const result = await BunErrorUtils.createTimedError(
  TensionErrorCode.PROPAGATION_FAILED,
  async () => {
    return await propagator.propagateFullGraph(sourceNodes);
  }
);
\`\`\`

## ~~Deprecated~~ Features
The legacy tension calculator is no longer supported.

## Next Steps
1. Review elevated tension nodes
2. Optimize memory usage
3. Schedule maintenance window
`;

// 1. Render to HTML
console.log('1️⃣ Rendering to HTML:');
console.log('====================\n');
const html = Bun.markdown.html(tensionReport, { headingIds: true });
console.log(html.substring(0, 500) + '...\n');

// 2. Custom rendering with classes
console.log('2️⃣ Custom HTML with Classes:');
console.log('==========================\n');
const customHtml = Bun.markdown.render(tensionReport, {
  heading: (children, { level }) => 
    `<h${level} class="tension-heading level-${level}">${children}</h${level}>`,
  paragraph: (children) => 
    `<p class="tension-paragraph">${children}</p>`,
  table: (children) => 
    `<table class="tension-table">${children}</table>`,
  code: (children) => 
    `<code class="tension-code">${children}</code>`,
  strong: (children) => 
    `<strong class="tension-bold">${children}</strong>`,
  listItem: (children) => 
    `<li class="tension-list-item">${children}</li>`,
  task: (checked, children) => 
    `<li class="tension-task ${checked ? 'checked' : 'pending'}">${children}</li>`
});
console.log(customHtml.substring(0, 500) + '...\n');

// 3. ANSI Terminal Output
console.log('3️⃣ ANSI Terminal Output:');
console.log('========================\n');
const ansi = Bun.markdown.render(tensionReport, {
  heading: (children, { level }) => {
    const colors = ['\x1b[1;34m', '\x1b[1;32m', '\x1b[1;33m', '\x1b[1;31m', '\x1b[1;35m'];
    return `${colors[level - 1] || '\x1b[1m'}${children}\x1b[0m\n`;
  },
  paragraph: (children) => `  ${children}\n`,
  table: (children) => `\n${children}\n`,
  code: (children) => `\x1b[36m${children}\x1b[0m`,
  strong: (children) => `\x1b[1m${children}\x1b[22m`,
  strikethrough: (children) => `\x1b[9m${children}\x1b[29m`,
  task: (checked, children) => 
    `  ${checked ? '\x1b[32m✓\x1b[0m' : '\x1b[31m○\x1b[0m'} ${children}\n`,
  listItem: (children) => `  • ${children}\n`
});
console.log(ansi);

// 4. React Elements (if React is available)
console.log('4️⃣ React Elements:');
console.log('==================\n');
try {
  // This would work in a React project
  const reactElement = Bun.markdown.react('# Simple Title\n\nHello **world**!');
  console.log('React element created:', reactElement.type);
  console.log('Note: Full React rendering requires React environment\n');
} catch (e) {
  console.log('React rendering requires React dependencies\n');
}

// 5. Save HTML report
console.log('5️⃣ Saving HTML Report:');
console.log('=====================\n');
const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Tension Field Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .checked { color: green; }
    .pending { color: orange; }
  </style>
</head>
<body>
${Bun.markdown.html(tensionReport, { headingIds: true, autolinkHeadings: true })}
</body>
</html>
`;

await write('tension-report.html', fullHtml);
console.log('✅ Report saved to: tension-report.html');

// 6. Markdown processing for MCP server
console.log('\n6️⃣ MCP Integration Example:');
console.log('==========================\n');

// Process error reports to markdown
const errorReport = {
  errors: [
    { code: 'TENSION_001', severity: 'high', message: 'Propagation failed' },
    { code: 'TENSION_401', severity: 'medium', message: 'Memory limit exceeded' }
  ],
  timestamp: new Date().toISOString()
};

const errorMarkdown = `
# Error Report
Generated: ${errorReport.timestamp}

## Errors Summary
${errorReport.errors.map(err => 
  `- **${err.code}** (${err.severity}): ${err.message}`
).join('\n')}

## Recommendations
${errorReport.errors.some(e => e.severity === 'high') 
  ? '⚠️ High severity errors detected. Immediate attention required.'
  : '✅ No critical errors found.'
}
`;

console.log('Generated error markdown:');
console.log(errorMarkdown);

// Convert to HTML for API response
const errorHtml = Bun.markdown.html(errorMarkdown);
console.log('\nHTML for API response:');
console.log(errorHtml);

console.log('\n✅ Markdown demo complete!');
console.log('\n💡 Features demonstrated:');
console.log('   - HTML rendering with options');
console.log('   - Custom element rendering');
console.log('   - ANSI terminal output');
console.log('   - React element creation');
console.log('   - File output generation');
console.log('   - Integration with error reporting');
