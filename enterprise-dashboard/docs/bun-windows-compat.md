# Bun Windows Compatibility & Stability (v1.3.6+)

This document outlines critical fixes in Bun 1.3.6 that impact Windows development and production WebSocket stability.

## Overview

| Issue | Before 1.3.6 | After 1.3.6 | Impact |
|-------|--------------|-------------|--------|
| WebSocket compression | Random crashes | Rock-solid | High |
| CLI argument parsing | Panics on edge cases | Graceful handling | Medium |
| Native module HMR | Fails on reload | Works everywhere | High |
| TLS state tracking | Inaccurate under load | Always correct | Medium |
| `domainToASCII` | Throws on invalid | Returns `''` (spec) | Low |

## WebSocket Stability

### Root Causes Fixed

- **Zlib DLL mismatch:** Different zlib versions in headers vs runtime
- **Memory corruption:** Wrong struct sizes causing buffer overflows
- **Thread safety:** Compression/decompression context issues

### Production Configuration

```javascript
// Safe on all platforms including Windows
const ws = new WebSocket("wss://api.example.com", {
  perMessageDeflate: {
    serverMaxWindowBits: 15,
    clientMaxWindowBits: 15,
    serverNoContextTakeover: true,
    clientNoContextTakeover: true
  }
});

ws.send(hugePayload);  // No crash, proper compression
```

### Bandwidth Impact

- Without compression: ~100KB/s
- With compression: ~30KB/s (70% savings)
- Critical for mobile users and real-time apps

## CLI & Tooling

### Metadata Recovery

```javascript
// BEFORE: Panic on corruption
function readMetadata() {
  return JSON.parse(fs.readFileSync(".bunx-cache"));  // Throws
}

// AFTER: Graceful fallback
function readMetadata() {
  try {
    return JSON.parse(fs.readFileSync(".bunx-cache"));
  } catch {
    return rebuildMetadata();  // Silent recovery
  }
}
```

### Argument Parsing

```bash
# All work correctly now:
bunx create-react-app "My Project"           # Spaces
bunx some-tool --env="production" --debug="" # Empty strings
bunx my-cli "C:\Users\Name\file.txt"         # Windows paths
```

## Native Module Support

### Hot Module Replacement

```javascript
// Native modules now reload cleanly
const nativeCompiler = require("./native-compiler.node");

// HMR works without "napi_register_module_v1 already loaded" error
```

### Worker Thread Safety

```javascript
// Safe module sharing between threads
const { Worker } = require("worker_threads");

new Worker(`require("./crypto-native.node")`);  // Works
```

## Node.js Compatibility

### URL API Compliance

```javascript
import { domainToASCII } from "url";

// Now matches Node.js behavior
domainToASCII("invalid..domain");  // Returns "" instead of throwing

// Validation pattern
const isValid = domainToASCII(domain) !== "";
```

## Security Implications

### TLS State Accuracy

```javascript
// Reliable HTTPS enforcement under concurrent load
app.use((req, res, next) => {
  if (!req.socket._secureEstablished) {
    return res.status(403).send("HTTPS required");
  }
  next();
});
```

## CI/CD Configuration

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for our Windows-enabled matrix.

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
runs-on: ${{ matrix.os }}
steps:
  - uses: oven-sh/setup-bun@v2
    with:
      bun-version: ">=1.3.6"  # Critical
```

## Testing Checklist

- [ ] WebSocket stress test passes on Windows
- [ ] Native modules work with `bun --hot`
- [ ] `bunx` handles paths with spaces
- [ ] CI passes on `windows-latest` runner

## Related

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Windows development prerequisites
- [SECURITY.md](../SECURITY.md) - Native module security and `trustedDependencies`
