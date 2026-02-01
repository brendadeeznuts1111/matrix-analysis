# Tier-1380 Registry

## Features

- **DNS Prefetch** - Fast endpoint resolution
- **R2 Integration** - Cloudflare object storage
- **Bun-native APIs** - Maximum performance

## Quick Start

```bash
bun run tier1380:registry check
bun run tier1380:registry r2:upload file.txt
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| port   | 8787    | TCP server port |
| bucket | fw-registry | R2 bucket name |

> **Note**: Requires Bun v1.3.7+

[Documentation](https://factory-wager.com/docs)
