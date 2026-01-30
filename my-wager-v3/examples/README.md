# Tension Field System Examples

This directory contains examples demonstrating Bun's runtime features integrated with the Tension Field System. The examples are organized to align with Bun's official documentation structure.

## Directory Structure

```
examples/
├── index.ts              # Main examples runner
├── README.md             # This file
├── color/                # Bun.color API examples
│   ├── index.ts          # Color examples runner
│   ├── README.md         # Color examples documentation
│   ├── flexible-input.ts # Various color input formats
│   ├── database-integration.ts # Color storage in databases
│   ├── ansi-output.ts    # ANSI color output formats
│   └── mcp-integration.ts # MCP server color integration
└── write-file/           # Bun.write API examples
    ├── index.ts          # Write-file examples runner
    ├── README.md         # Write-file examples documentation
    └── stdout.ts         # Writing to stdout
```

## Running Examples

### Run All Examples in a Category
```bash
# Run all color examples
bun index.ts color

# Run all write-file examples
bun index.ts write-file
```

### Run Individual Examples
```bash
# Color examples
bun color/flexible-input.ts
bun color/database-integration.ts
bun color/ansi-output.ts
bun color/mcp-integration.ts

# Write-file examples
bun write-file/stdout.ts
```

## Example Categories

### 🎨 Color Formatting
Demonstrates `Bun.color()` API capabilities:
- **Flexible Input**: All supported color formats
- **Database Integration**: Storing colors as numbers
- **ANSI Output**: Terminal color formatting
- **MCP Integration**: Color-coded server responses

### 📝 File Writing
Demonstrates `Bun.write()` API capabilities:
- **stdout Writing**: High-performance terminal output
- **Progress Bars**: Real-time progress indicators
- **Colored Output**: ANSI color integration

## Performance Highlights

- **Color Conversion**: 3.6M+ ops/sec
- **ANSI Formatting**: 670K+ ops/sec
- **stdout Writing**: 4.62x faster than console.log
- **Database Storage**: 43% space savings with number format

## Integration with Tension Field System

These examples showcase practical applications:
- **Status Visualization**: Color-coded node states
- **Tension Gradients**: Visual tension level representation
- **Real-time Monitoring**: Live dashboard updates
- **MCP Responses**: Beautiful tool output formatting

## Documentation References

- [Bun.color Documentation](https://bun.com/docs/runtime/color)
- [Bun.write Documentation](https://bun.com/docs/guides/write-file)
- [Tension Field System](../README.md)
