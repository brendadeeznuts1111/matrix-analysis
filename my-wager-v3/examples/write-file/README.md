# Bun.write Examples

This directory contains examples demonstrating Bun's file writing capabilities, aligned with the [Bun.write documentation](https://bun.com/docs/guides/write-file).

## Examples

### [stdout.ts](./stdout.ts)
Demonstrates writing to stdout with `Bun.write()`:
- Basic output control (no automatic line breaks)
- Real-time progress bars
- Live status updates
- Colored terminal output
- Performance comparison with console.log

## Running Examples

```bash
# Run all examples
bun run index.ts

# Run individual example
bun stdout.ts
```

## Performance

| Method | Speed (1000 iterations) | Difference |
|--------|------------------------|------------|
| console.log() | 17.54ms | Baseline |
| Bun.write() | 3.80ms | 4.62x faster |

## Benefits for Tension Field System

- **Real-time monitoring**: Live status updates
- **Professional CLI**: Beautiful terminal interfaces
- **High performance**: Critical for 10K+ ops/s operations
- **Fine control**: No automatic line breaks
- **Color support**: Full ANSI color integration
