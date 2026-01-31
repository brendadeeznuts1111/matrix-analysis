#!/usr/bin/env bun
// MCP Server Markdown Integration Example
// Shows how to integrate Bun v1.3.8 markdown parser with the MCP server

// Make this a module
export {};

console.log('🔌 MCP Server + Markdown Integration');
console.log('===================================\n');

// Example: Enhanced MCP server with markdown reporting
const enhancedMCPServer = `
// Enhanced MCP Server with Markdown Support (Bun v1.3.8+)

import { serve } from 'bun';
import { Database } from 'bun:sqlite';

// Add markdown reporting tool to existing MCP server
const MCP_TOOLS_WITH_MARKDOWN = {
  // ... existing tools ...

  generate_report: {
    name: 'generate_report',
    description: 'Generate a formatted markdown report of system status',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['markdown', 'html', 'ansi'],
          default: 'markdown'
        },
        includeHistory: {
          type: 'boolean',
          default: false
        },
        timeRange: {
          type: 'number',
          description: 'Hours to include in report',
          default: 24
        }
      }
    }
  }
};

// Report generation function
async function generateReport(args: any) {
  const { format = 'markdown', includeHistory = false, timeRange = 24 } = args;

  // Gather system data
  const status = await getSystemStatus();
  const errors = await getRecentErrors(timeRange);
  const history = includeHistory ? await getHistory(timeRange) : null;

  // Build markdown report
  const markdown = buildMarkdownReport(status, errors, history);

  // Convert based on requested format
  switch (format) {
    case 'html':
      if (Bun?.markdown?.html) {
        return Bun.markdown.html(markdown, {
          headingIds: true,
          autolinkHeadings: true
        });
      }
      break;

    case 'ansi':
      if (Bun?.markdown?.render) {
        return Bun.markdown.render(markdown, {
          heading: (children, { level }) => {
            const colors = ['\\x1b[1;34m', '\\x1b[1;32m', '\\x1b[1;33m'];
            return \`\${colors[level - 1] || '\\x1b[1m'}\${children}\\x1b[0m\\n\`;
          },
          table: (children) => \`\\x1b[36m\${children}\\x1b[0m\`,
          strong: (children) => \`\\x1b[1m\${children}\\x1b[22m\`,
          task: (checked, children) =>
            \`\${checked ? '\\x1b[32m✓\\x1b[0m' : '\\x1b[31m○\\x1b[0m'} \${children}\n\`
        });
      }
      break;

    default:
      return markdown;
  }

  return markdown;
}

// Build markdown report
function buildMarkdownReport(status: any, errors: any[], history: any) {
  const timestamp = new Date().toISOString();

  return \`
# Tension Field System Report
Generated: \${timestamp}

## System Overview
- **Status**: \${status.propagator.nodeCount > 0 ? '🟢 Operational' : '🟡 Idle'}
- **Nodes**: \${status.propagator.nodeCount}
- **Edges**: \${status.propagator.edgeCount}
- **Uptime**: \${(status.uptime / 3600).toFixed(1)} hours

## Performance Metrics
| Metric | Value | Status |
|--------|-------|---------|
| Memory Usage | \${(status.memory.heapUsed / 1024 / 1024).toFixed(2)} MB | \${status.memory.heapUsed < 100_000_000 ? '🟢' : '🟡'} |
| Database Size | \${(status.database.size / 1024).toFixed(2)} KB | 🟢 |
| Total Propagations | \${status.propagator.stats.totalPropagations || 0} | 🟢 |

## Recent Errors
\${errors.length === 0
  ? '✅ No errors in the last ' + timeRange + ' hours'
  : errors.map(err =>
      \`- **\${err.code}** (\${err.severity}): \${err.message}\`
    ).join('\\n')
}

\${history ? \`
## Historical Data
\${history.length > 0
  ? \`Average tension: \${history.reduce((sum, h) => sum + h.tension, 0) / history.length}\`
  : 'No historical data available'
}
\` : ''}

## Recommendations
\${generateRecommendations(status, errors)}
\`;
}

// Generate recommendations based on status
function generateRecommendations(status: any, errors: any[]): string {
  const recommendations = [];

  if (errors.some(e => e.severity === 'critical')) {
    recommendations.push('- 🔴 **Critical errors detected** - Immediate attention required');
  }

  if (status.memory.heapUsed > 500_000_000) {
    recommendations.push('- 🟡 **High memory usage** - Consider optimizing or scaling');
  }

  if (status.propagator.nodeCount === 0) {
    recommendations.push('- ℹ️ **No active nodes** - System appears to be idle');
  }

  if (recommendations.length === 0) {
    recommendations.push('- ✅ **System healthy** - No immediate actions required');
  }

  return recommendations.join('\\n');
}

// Example usage in MCP server
console.log('Example MCP API call:');
console.log('POST /call');
console.log(JSON.stringify({
  tool: 'generate_report',
  arguments: {
    format: 'html',
    includeHistory: true,
    timeRange: 24
  }
}, null, 2));

console.log('\\nWould return HTML report ready for dashboard display\\n');
`;

console.log('📄 Enhanced MCP Server Code:');
console.log('===========================\n');
console.log(enhancedMCPServer);

// Example report output
const sampleReport = `
# Tension Field System Report
Generated: 2026-01-30T21:30:00.000Z

## System Overview
- **Status**: 🟢 Operational
- **Nodes**: 1,247
- **Edges**: 3,892
- **Uptime**: 72.5 hours

## Performance Metrics
| Metric | Value | Status |
|--------|-------|---------|
| Memory Usage | 45.67 MB | 🟢 |
| Database Size | 1,234 KB | 🟢 |
| Total Propagations | 15,234 | 🟢 |

## Recent Errors
✅ No errors in the last 24 hours

## Recommendations
- ✅ **System healthy** - No immediate actions required
`;

console.log('📊 Sample Report Output:');
console.log('======================\n');
console.log(sampleReport);

// Show how it would look with Bun v1.3.8
console.log('🎨 With Bun v1.3.8, you could:');
console.log('==============================\n');
console.log('1. Convert to HTML for web dashboard:');
console.log('   const html = Bun.markdown.html(report, { headingIds: true });\n');

console.log('2. Create ANSI output for terminal:');
console.log('   const ansi = Bun.markdown.render(report, ansiOptions);\n');

console.log('3. Generate React components:');
console.log('   const element = Bun.markdown.react(report, reactComponents);\n');

console.log('4. Add custom styling:');
console.log('   const styled = Bun.markdown.render(report, {');
console.log('     heading: (c) => `<h1 class="report-title">\\${c}</h1>`,');
console.log('     table: (c) => `<table class="report-table">\\${c}</table>`');
console.log('   });\n');

// Save the enhanced server example
await Bun.write('mcp-server-markdown-enhanced.ts', enhancedMCPServer);
console.log('💾 Saved enhanced MCP server to: mcp-server-markdown-enhanced.ts');

console.log('\n🚀 Integration Benefits:');
console.log('========================');
console.log('✅ Beautiful reports without external dependencies');
console.log('✅ Multiple output formats (HTML, ANSI, React)');
console.log('✅ Custom styling and branding');
console.log('✅ GitHub Flavored Markdown support');
console.log('✅ Performance: Native Zig implementation');

console.log('\n📝 Ready to upgrade? Run: bun upgrade');
console.log('Then integrate markdown into your MCP server! ✨');
