# Matrix Analysis

URLPattern performance analysis matrix with 247 columns. Built for Bun 1.3.6+.

## Features

- **URLPattern Analysis** - Compile-time caching with `Bun.peek()` for sync access
- **Performance Tiers** - Elite (>900K ops/s), Strong, Medium, Caution classifications
- **Security Scanning** - Path traversal, SSRF, XSS, SQL injection, credential exposure detection
- **DNS Prefetch** - Hardware-accelerated lookups with 150x faster cached resolution
- **Color Palette** - HSL-based tier visualization using `Bun.color()`

## Quick Start

```bash
bun install
bun run matrix           # Run analysis
bun run matrix:audit     # Security audit mode
bun run matrix:benchmark # Performance benchmarks
bun run matrix:ci        # CI mode with threshold
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run matrix` | Run the 247-column analysis matrix |
| `bun run matrix:audit` | Security-focused audit |
| `bun run matrix:benchmark` | Performance benchmarks |
| `bun run matrix:fix` | Auto-fix detected issues |
| `bun run matrix:ci` | CI mode with medium threshold |
| `bun run test` | Run test suite |
| `bun run typecheck` | TypeScript validation |

## Performance Tiers

| Tier | Ops/sec | Color | Description |
|------|---------|-------|-------------|
| Elite | >900K | Green | Simple matched patterns |
| Strong | 700-900K | Teal | Fast exit patterns |
| Medium | 500-700K | Amber | RegExp patterns (deopt risk) |
| Caution | <500K | Purple | Wildcards, complex patterns |

## Bun APIs Used

- `Bun.peek()` - Sync promise inspection for cache hits
- `Bun.color()` - HSL/RGB/Hex color conversion
- `Bun.hash.crc32()` - Hardware-accelerated hashing
- `Bun.dns.prefetch()` - DNS cache warming
- `Bun.nanoseconds()` - High-resolution timing
- `Bun.inspect.table()` - Formatted output
- `URLPattern` - Route matching with RegExp validation

## Requirements

- Bun >= 1.3.6
- TypeScript 5.7+

## License

MIT
