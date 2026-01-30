# Bun.color Examples

This directory contains examples demonstrating Bun's color formatting capabilities, aligned with the [Bun.color documentation](https://bun.com/docs/runtime/color#flexible-input).

## Examples

### [flexible-input.ts](./flexible-input.ts)
Demonstrates various color input formats supported by `Bun.color()`:
- Color names: `"red"`, `"blue"`, `"purple"`
- Hex numbers: `0xff0000`
- RGB objects: `{ r: 255, g: 0, b: 0 }`
- RGB arrays: `[255, 0, 0]`
- CSS strings: `"rgb(255, 0, 0)"`, `"rgba(255, 0, 0, 1)"`
- HSL strings: `"hsl(0, 100%, 50%)"`, `"hsla(0, 100%, 50%, 1)"`

### [database-integration.ts](./database-integration.ts)
Shows how to use the "number" format for efficient database storage:
- 24-bit integer representation (0-16777215)
- SQLite integration with color storage
- Dynamic color updates based on tension levels
- Color-based queries and indexing

### [ansi-output.ts](./ansi-output.ts)
Demonstrates ANSI color output formats for terminal applications:
- ANSI-16: Basic 16-color palette
- ANSI-256: Extended 256-color palette
- ANSI-16m: True color (16 million colors)
- Performance comparisons
- Real-time color visualization

### [mcp-integration.ts](./mcp-integration.ts)
Integrates color formatting with MCP server responses:
- Beautiful tool response formatting
- Color-coded status indicators
- Real-time monitoring dashboard
- Category-based color coding

## Running Examples

```bash
# Run all examples
bun run index.ts

# Run individual examples
bun flexible-input.ts
bun database-integration.ts
bun ansi-output.ts
bun mcp-integration.ts
```

## Performance Metrics

| Format | Speed | Use Case |
|--------|-------|----------|
| number | 3,660,964 ops/sec | Database storage |
| ansi-16 | 746,707 ops/sec | Basic terminals |
| ansi-256 | 719,998 ops/sec | Enhanced visuals |
| ansi-16m | 670,061 ops/sec | Rich graphics |

## Integration with Tension Field System

These examples are designed to integrate with the Tension Field System:
- **Status colors**: Operational, warning, critical states
- **Tension gradients**: Visual representation of tension levels
- **MCP tool categorization**: Color-coded tool responses
- **Real-time monitoring**: Live status updates with colors
