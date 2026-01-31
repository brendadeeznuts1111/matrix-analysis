#!/usr/bin/env bun
// Bun v1.3.8 Markdown Parser Preview
// This demonstrates how to use the new markdown parser when available

// Make this a module
export {};

console.log('📝 Bun v1.3.8 Markdown Parser Preview');
console.log('====================================\n');

// Check if Bun.markdown is available
if (!Bun.markdown) {
  console.log('⚠️  Bun.markdown is not available in this version');
  console.log('   Update to Bun v1.3.8 to use these features\n');
  console.log('   To update: bun upgrade\n');
}

// Sample content for demonstration
const content = `
# Tension Field Status

## System Overview
Current status: **Operational**

### Metrics
| Component | Status | Performance |
|-----------|--------|-------------|
| Propagator | ✅ Active | 9,344 req/s |
| Monitor | ✅ Active | 0.11ms latency |
| Database | ✅ Active | 0 errors |

### Tasks
- [x] Deploy MCP server
- [ ] Optimize queries
- [ ] Add caching layer

~~Legacy system deprecated~~
`;

// Function to use Bun.markdown when available, fallback to basic formatting
function renderMarkdown(markdown: string, options?: any): string {
  if ((Bun as any).markdown?.html) {
    // Use Bun v1.3.8+ markdown parser
    console.log('✅ Using Bun v1.3.8+ markdown parser\n');
    return (Bun as any).markdown.html(markdown, options);
  } else {
    // Fallback: very basic markdown conversion
    console.log('⚠️  Using fallback markdown parser\n');
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/^- \[ \] (.+)$/gim, '<li class="task">☐ $1</li>')
      .replace(/^- \[x\] (.+)$/gim, '<li class="task checked">☑ $1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/^\|(.+)\|$/gim, (match: string, cells: string) => {
        const cellArray = cells.split('|').map((c: string) => c.trim());
        return `<table><tr>${cellArray.map((c: string) => `<td>${c}</td>`).join('')}</tr></table>`;
      })
      .replace(/\n/g, '<br>');
  }
}

// Demo 1: Basic HTML rendering
console.log('1️⃣ Basic HTML Rendering:');
console.log('========================\n');
const html = renderMarkdown(content, { headingIds: true });
console.log(html.substring(0, 300) + '...\n');

// Demo 2: Custom rendering (when available)
if ((Bun as any).markdown?.render) {
  console.log('2️⃣ Custom Rendering with Classes:');
  console.log('=================================\n');

  const custom = (Bun as any).markdown.render(content, {
    heading: (children: any, { level }: any) =>
      `<h${level} class="tension-header level-${level}">${children}</h${level}>`,
    paragraph: (children: any) =>
      `<p class="tension-content">${children}</p>`,
    strong: (children: any) =>
      `<strong class="tension-emphasis">${children}</strong>`,
    task: (checked: any, children: any) =>
      `<li class="tension-task ${checked ? 'completed' : 'pending'}">${children}</li>`
  });

  console.log(custom.substring(0, 300) + '...\n');
} else {
  console.log('2️⃣ Custom Rendering (Available in v1.3.8):');
  console.log('==========================================\n');
  console.log('Custom rendering allows you to:\n');
  console.log('   - Add custom CSS classes');
  console.log('   - Create ANSI terminal output');
  console.log('   - Generate React elements');
  console.log('   - Filter or transform content\n');
}

// Demo 3: React Elements (if React is available)
if ((Bun as any).markdown?.react) {
  console.log('3️⃣ React Element Generation:');
  console.log('============================\n');

  const element = (Bun as any).markdown.react('# Simple Title\n\nHello **world**!', {
    h1: ({ children }: any) => `<h1 className="title">{children}</h1>`
  });

  console.log('React element:', element.type);
  console.log('Note: Full React rendering requires React environment\n');
} else {
  console.log('3️⃣ React Integration (Available in v1.3.8):');
  console.log('=======================================\n');
  console.log('React integration provides:\n');
  console.log('   - Direct React element creation');
  console.log('   - Custom component mapping');
  console.log('   - Server-side rendering support\n');
}

// Demo 4: GFM Extensions
console.log('4️⃣ GitHub Flavored Markdown Features:');
console.log('=====================================\n');
console.log('Bun v1.3.8 markdown supports:\n');
console.log('   ✅ Tables');
console.log('   ✅ Strikethrough (~~text~~)');
console.log('   ✅ Task lists (- [x] done)');
console.log('   ✅ Autolinks');
console.log('   ✅ Wiki links');
console.log('   ✅ LaTeX math');
console.log('   ✅ Heading IDs');
console.log('   ✅ Autolink headings\n');

// Demo 5: Integration with Tension Field System
console.log('5️⃣ Integration with Tension Field:');
console.log('===================================\n');
console.log('Once upgraded to v1.3.8, you can:\n');
console.log('\n   // Generate HTML reports from analysis results');
console.log('   const report = `# Tension Analysis\\n\\n${results}`;');
console.log('   const html = Bun.markdown.html(report);\n');
console.log('   // Create custom formatted logs');
console.log('   const log = Bun.markdown.render(data, {');
console.log('     heading: (c) => `\\x1b[1m${c}\\x1b[0m`,');
console.log('     code: (c) => `\\x1b[36m${c}\\x1b[0m`');
console.log('   });\n');
console.log('   // Build React components from markdown');
console.log('   const Component = () => Bun.markdown.react(content);\n');

// Save example for when upgraded
const upgradeScript = `
// Upgrade to Bun v1.3.8 to use these features:

// 1. Install/Update Bun
bun upgrade

// 2. Use in your MCP server
app.post('/report', (req) => {
  const markdown = generateReport(req.body);
  const html = Bun.markdown.html(markdown, {
    headingIds: true,
    autolinkHeadings: true
  });
  return html;
});

// 3. Create custom CLI output
const output = Bun.markdown.render(data, {
  heading: (c) => \`\x1b[1;34m\${c}\x1b[0m\`,
  strong: (c) => \`\x1b[1m\${c}\x1b[22m\`,
  table: (c) => \`\x1b[36m\${c}\x1b[0m\`
});

// 4. Generate React components
const MarkdownComponent = ({ content }) =>
  Bun.markdown.react(content, {
    h1: ({ children }) => <h1 className="title">{children}</h1>,
    p: ({ children }) => <p className="content">{children}</p>
  });
`;

await Bun.write('markdown-v1.3.8-examples.ts', upgradeScript);
console.log('💾 Saved upgrade examples to: markdown-v1.3.8-examples.ts');

console.log('\n🚀 Ready to upgrade to Bun v1.3.8!');
console.log('   Run: bun upgrade');
console.log('   Then enjoy the built-in markdown parser! 📝✨');
