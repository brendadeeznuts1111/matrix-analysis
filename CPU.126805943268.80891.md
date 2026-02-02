# CPU Profile

| Duration | Samples | Interval | Functions |
|----------|---------|----------|----------|
| 574.9ms | 20 | 1.0ms | 51 |

**Top 10:** `write` 59.8%, `ShellOutput` 13.6%, `(anonymous)` 11.5%, `run` 11.2%, `anonymous` 1.2%, `filter` 0.5%, `parseModule` 0.4%, `async (anonymous)` 0.2%, `async run` 0.2%, `async phaseGate` 0.2%

## Hot Functions (Self Time)

| Self% | Self | Total% | Total | Function | Location |
|------:|-----:|-------:|------:|----------|----------|
| 59.8% | 344.2ms | 59.8% | 344.2ms | `write` | `[native code]` |
| 13.6% | 78.5ms | 13.6% | 78.5ms | `ShellOutput` | `[native code]` |
| 11.5% | 66.6ms | 11.5% | 66.6ms | `(anonymous)` | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 11.2% | 64.6ms | 11.2% | 64.6ms | `run` | `[native code]` |
| 1.2% | 7.0ms | 4.6% | 26.4ms | `anonymous` | `[native code]` |
| 0.5% | 3.0ms | 0.5% | 3.0ms | `filter` | `[native code]` |
| 0.4% | 2.4ms | 1.8% | 10.8ms | `parseModule` | `[native code]` |
| 0.2% | 1.6ms | 2.5% | 14.7ms | `async (anonymous)` | `[native code]` |
| 0.2% | 1.4ms | 0.2% | 1.4ms | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 0.2% | 1.4ms | 0.2% | 1.4ms | `async phaseGate` | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 0.2% | 1.4ms | 0.2% | 1.4ms | `node:zlib` | `node:zlib:2` |
| 0.2% | 1.2ms | 0.2% | 1.2ms | `createShellInterpreter` | `[native code]` |
| 0.1% | 1.1ms | 0.1% | 1.1ms | `fetch` | `[native code]` |

## Call Tree (Total Time)

| Total% | Total | Self% | Self | Function | Location |
|-------:|------:|------:|-----:|----------|----------|
| 59.8% | 344.2ms | 59.8% | 344.2ms | `write` | `[native code]` |
| 59.8% | 344.2ms | 0.0% | 0us | `async phaseFinalize` | `/Users/nolarose/.factory-wager/fw-release.ts:294` |
| 59.8% | 344.2ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts:108` |
| 59.8% | 344.2ms | 0.0% | 0us | `async phaseFinalize` | `/Users/nolarose/.factory-wager/fw-release.ts:304` |
| 13.6% | 78.5ms | 0.0% | 0us | `resolve` | `[native code]` |
| 13.6% | 78.5ms | 13.6% | 78.5ms | `ShellOutput` | `[native code]` |
| 11.5% | 66.6ms | 11.5% | 66.6ms | `(anonymous)` | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 11.5% | 66.6ms | 0.0% | 0us | `map` | `[native code]` |
| 11.4% | 65.8ms | 0.0% | 0us | `then` | `[native code]` |
| 11.4% | 65.8ms | 0.0% | 0us | `#run` | `[native code]` |
| 11.2% | 64.6ms | 11.2% | 64.6ms | `run` | `[native code]` |
| 11.1% | 63.8ms | 0.0% | 0us | `async writeAudit` | `/Users/nolarose/.factory-wager/fw-release.ts:374` |
| 11.1% | 63.8ms | 0.0% | 0us | `async writeAudit` | `/Users/nolarose/.factory-wager/fw-release.ts:382` |
| 11.1% | 63.8ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts:117` |
| 4.6% | 26.4ms | 1.2% | 7.0ms | `anonymous` | `[native code]` |
| 2.5% | 14.7ms | 0.2% | 1.6ms | `async (anonymous)` | `[native code]` |
| 1.8% | 10.8ms | 0.4% | 2.4ms | `parseModule` | `[native code]` |
| 0.6% | 3.5ms | 0.0% | 0us | `node:fs` | `node:fs:2` |
| 0.6% | 3.4ms | 0.0% | 0us | `internal:stream` | `internal:stream:2` |
| 0.6% | 3.4ms | 0.0% | 0us | `node:stream` | `node:stream:2` |
| 0.6% | 3.4ms | 0.0% | 0us | `internal:fs/streams` | `internal:fs/streams:2` |
| 0.6% | 3.4ms | 0.0% | 0us | `get ReadStream` | `node:fs:573` |
| 0.5% | 3.3ms | 0.0% | 0us | `async loadAndEvaluateModule` | `[native code]` |
| 0.5% | 3.3ms | 0.0% | 0us | `async loadModule` | `[native code]` |
| 0.5% | 3.0ms | 0.5% | 3.0ms | `filter` | `[native code]` |
| 0.5% | 3.0ms | 0.0% | 0us | `async phaseAnalysis` | `/Users/nolarose/.factory-wager/fw-release.ts:152` |
| 0.4% | 2.8ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts:121` |
| 0.4% | 2.7ms | 0.0% | 0us | `requestInstantiate` | `[native code]` |
| 0.4% | 2.7ms | 0.0% | 0us | `requestSatisfyUtil` | `[native code]` |
| 0.3% | 2.2ms | 0.0% | 0us | `internal:streams/compose` | `internal:streams/compose:2` |
| 0.3% | 2.2ms | 0.0% | 0us | `internal:streams/operators` | `internal:streams/operators:2` |
| 0.3% | 2.2ms | 0.0% | 0us | `internal:streams/duplex` | `internal:streams/duplex:2` |
| 0.3% | 2.2ms | 0.0% | 0us | `internal:streams/pipeline` | `internal:streams/pipeline:2` |
| 0.2% | 1.6ms | 0.0% | 0us | `requestSatisfy` | `[native code]` |
| 0.2% | 1.4ms | 0.0% | 0us | `(module)` | `/Users/nolarose/.factory-wager/cli.ts:256` |
| 0.2% | 1.4ms | 0.0% | 0us | `async handleRelease` | `/Users/nolarose/.factory-wager/cli.ts:160` |
| 0.2% | 1.4ms | 0.0% | 0us | `async handleRelease` | `/Users/nolarose/.factory-wager/cli.ts:164` |
| 0.2% | 1.4ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/cli.ts:48` |
| 0.2% | 1.4ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/cli.ts:27` |
| 0.2% | 1.4ms | 0.2% | 1.4ms | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 0.2% | 1.4ms | 0.0% | 0us | `async asyncModuleEvaluation` | `[native code]` |
| 0.2% | 1.4ms | 0.0% | 0us | `evaluate` | `[native code]` |
| 0.2% | 1.4ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts:88` |
| 0.2% | 1.4ms | 0.0% | 0us | `async run` | `/Users/nolarose/.factory-wager/fw-release.ts:100` |
| 0.2% | 1.4ms | 0.0% | 0us | `async phaseGate` | `/Users/nolarose/.factory-wager/fw-release.ts:210` |
| 0.2% | 1.4ms | 0.2% | 1.4ms | `async phaseGate` | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 0.2% | 1.4ms | 0.2% | 1.4ms | `node:zlib` | `node:zlib:2` |
| 0.2% | 1.2ms | 0.2% | 1.2ms | `createShellInterpreter` | `[native code]` |
| 0.1% | 1.1ms | 0.0% | 0us | `requestFetch` | `[native code]` |
| 0.1% | 1.1ms | 0.1% | 1.1ms | `fetch` | `[native code]` |
| 0.1% | 1.1ms | 0.0% | 0us | `(anonymous)` | `[native code]` |

## Function Details

### `write`
`[native code]` | Self: 59.8% (344.2ms) | Total: 59.8% (344.2ms) | Samples: 1

**Called by:**
- `async phaseFinalize` (1)

### `ShellOutput`
`[native code]` | Self: 13.6% (78.5ms) | Total: 13.6% (78.5ms) | Samples: 1

**Called by:**
- `resolve` (1)

### `(anonymous)`
`/Users/nolarose/.factory-wager/fw-release.ts` | Self: 11.5% (66.6ms) | Total: 11.5% (66.6ms) | Samples: 2

**Called by:**
- `map` (2)

### `run`
`[native code]` | Self: 11.2% (64.6ms) | Total: 11.2% (64.6ms) | Samples: 2

**Called by:**
- `#run` (2)

### `anonymous`
`[native code]` | Self: 1.2% (7.0ms) | Total: 4.6% (26.4ms) | Samples: 5

**Called by:**
- `node:stream` (3)
- `internal:stream` (3)
- `get ReadStream` (3)
- `internal:fs/streams` (3)
- `internal:streams/pipeline` (2)
- `internal:streams/operators` (2)
- `internal:streams/compose` (2)
- `node:fs` (2)
- `internal:streams/duplex` (2)

**Calls:**
- `node:stream` (3)
- `internal:stream` (3)
- `internal:fs/streams` (3)
- `internal:streams/compose` (2)
- `internal:streams/operators` (2)
- `internal:streams/pipeline` (2)
- `internal:streams/duplex` (2)

### `filter`
`[native code]` | Self: 0.5% (3.0ms) | Total: 0.5% (3.0ms) | Samples: 1

**Called by:**
- `async phaseAnalysis` (1)

### `parseModule`
`[native code]` | Self: 0.4% (2.4ms) | Total: 1.8% (10.8ms) | Samples: 2

**Called by:**
- `async (anonymous)` (8)

**Calls:**
- `get ReadStream` (3)
- `node:fs` (2)
- `node:zlib` (1)

### `async (anonymous)`
`[native code]` | Self: 0.2% (1.6ms) | Total: 2.5% (14.7ms) | Samples: 1

**Called by:**
- `requestInstantiate` (2)
- `async (anonymous)` (1)

**Calls:**
- `parseModule` (8)
- `requestFetch` (1)
- `async (anonymous)` (1)

### `async run`
`/Users/nolarose/.factory-wager/fw-release.ts` | Self: 0.2% (1.4ms) | Total: 0.2% (1.4ms) | Samples: 1

**Called by:**
- `async run` (1)

### `async phaseGate`
`/Users/nolarose/.factory-wager/fw-release.ts` | Self: 0.2% (1.4ms) | Total: 0.2% (1.4ms) | Samples: 1

**Called by:**
- `async phaseGate` (1)

### `node:zlib`
`node:zlib:2` | Self: 0.2% (1.4ms) | Total: 0.2% (1.4ms) | Samples: 1

**Called by:**
- `parseModule` (1)

### `createShellInterpreter`
`[native code]` | Self: 0.2% (1.2ms) | Total: 0.2% (1.2ms) | Samples: 1

**Called by:**
- `#run` (1)

### `fetch`
`[native code]` | Self: 0.1% (1.1ms) | Total: 0.1% (1.1ms) | Samples: 1

**Called by:**
- `requestFetch` (1)

### `node:fs`
`node:fs:2` | Self: 0.0% (0us) | Total: 0.6% (3.5ms) | Samples: 0

**Called by:**
- `parseModule` (2)

**Calls:**
- `anonymous` (2)

### `then`
`[native code]` | Self: 0.0% (0us) | Total: 11.4% (65.8ms) | Samples: 0

**Calls:**
- `#run` (3)

### `internal:fs/streams`
`internal:fs/streams:2` | Self: 0.0% (0us) | Total: 0.6% (3.4ms) | Samples: 0

**Called by:**
- `anonymous` (3)

**Calls:**
- `anonymous` (3)

### `async handleRelease`
`/Users/nolarose/.factory-wager/cli.ts:160` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `async run` (1)

**Calls:**
- `async handleRelease` (1)

### `async run`
`/Users/nolarose/.factory-wager/fw-release.ts:100` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Calls:**
- `async phaseGate` (1)

### `requestSatisfyUtil`
`[native code]` | Self: 0.0% (0us) | Total: 0.4% (2.7ms) | Samples: 0

**Called by:**
- `(anonymous)` (1)
- `requestSatisfy` (1)

**Calls:**
- `requestInstantiate` (2)

### `requestSatisfy`
`[native code]` | Self: 0.0% (0us) | Total: 0.2% (1.6ms) | Samples: 0

**Called by:**
- `async loadModule` (1)

**Calls:**
- `requestSatisfyUtil` (1)

### `async phaseFinalize`
`/Users/nolarose/.factory-wager/fw-release.ts:294` | Self: 0.0% (0us) | Total: 59.8% (344.2ms) | Samples: 0

**Called by:**
- `async run` (1)

**Calls:**
- `async phaseFinalize` (1)

### `(anonymous)`
`[native code]` | Self: 0.0% (0us) | Total: 0.1% (1.1ms) | Samples: 0

**Calls:**
- `requestSatisfyUtil` (1)

### `internal:streams/compose`
`internal:streams/compose:2` | Self: 0.0% (0us) | Total: 0.3% (2.2ms) | Samples: 0

**Called by:**
- `anonymous` (2)

**Calls:**
- `anonymous` (2)

### `get ReadStream`
`node:fs:573` | Self: 0.0% (0us) | Total: 0.6% (3.4ms) | Samples: 0

**Called by:**
- `parseModule` (3)

**Calls:**
- `anonymous` (3)

### `(module)`
`/Users/nolarose/.factory-wager/cli.ts:256` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `evaluate` (1)

**Calls:**
- `async run` (1)

### `async phaseGate`
`/Users/nolarose/.factory-wager/fw-release.ts:210` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `async run` (1)

**Calls:**
- `async phaseGate` (1)

### `async run`
`/Users/nolarose/.factory-wager/fw-release.ts:117` | Self: 0.0% (0us) | Total: 11.1% (63.8ms) | Samples: 0

**Calls:**
- `async writeAudit` (1)

### `#run`
`[native code]` | Self: 0.0% (0us) | Total: 11.4% (65.8ms) | Samples: 0

**Called by:**
- `then` (3)

**Calls:**
- `run` (2)
- `createShellInterpreter` (1)

### `async phaseAnalysis`
`/Users/nolarose/.factory-wager/fw-release.ts:152` | Self: 0.0% (0us) | Total: 0.5% (3.0ms) | Samples: 0

**Calls:**
- `filter` (1)

### `async run`
`/Users/nolarose/.factory-wager/cli.ts:27` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `(module)` (1)

**Calls:**
- `async run` (1)

### `async run`
`/Users/nolarose/.factory-wager/cli.ts:48` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `async run` (1)

**Calls:**
- `async handleRelease` (1)

### `map`
`[native code]` | Self: 0.0% (0us) | Total: 11.5% (66.6ms) | Samples: 0

**Called by:**
- `async run` (1)
- `async writeAudit` (1)

**Calls:**
- `(anonymous)` (2)

### `async writeAudit`
`/Users/nolarose/.factory-wager/fw-release.ts:382` | Self: 0.0% (0us) | Total: 11.1% (63.8ms) | Samples: 0

**Called by:**
- `async writeAudit` (1)

**Calls:**
- `map` (1)

### `internal:streams/pipeline`
`internal:streams/pipeline:2` | Self: 0.0% (0us) | Total: 0.3% (2.2ms) | Samples: 0

**Called by:**
- `anonymous` (2)

**Calls:**
- `anonymous` (2)

### `async run`
`/Users/nolarose/.factory-wager/fw-release.ts:108` | Self: 0.0% (0us) | Total: 59.8% (344.2ms) | Samples: 0

**Calls:**
- `async phaseFinalize` (1)

### `requestFetch`
`[native code]` | Self: 0.0% (0us) | Total: 0.1% (1.1ms) | Samples: 0

**Called by:**
- `async (anonymous)` (1)

**Calls:**
- `fetch` (1)

### `async phaseFinalize`
`/Users/nolarose/.factory-wager/fw-release.ts:304` | Self: 0.0% (0us) | Total: 59.8% (344.2ms) | Samples: 0

**Called by:**
- `async phaseFinalize` (1)

**Calls:**
- `write` (1)

### `node:stream`
`node:stream:2` | Self: 0.0% (0us) | Total: 0.6% (3.4ms) | Samples: 0

**Called by:**
- `anonymous` (3)

**Calls:**
- `anonymous` (3)

### `async run`
`/Users/nolarose/.factory-wager/fw-release.ts:121` | Self: 0.0% (0us) | Total: 0.4% (2.8ms) | Samples: 0

**Calls:**
- `map` (1)

### `requestInstantiate`
`[native code]` | Self: 0.0% (0us) | Total: 0.4% (2.7ms) | Samples: 0

**Called by:**
- `requestSatisfyUtil` (2)

**Calls:**
- `async (anonymous)` (2)

### `async handleRelease`
`/Users/nolarose/.factory-wager/cli.ts:164` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `async handleRelease` (1)

**Calls:**
- `async run` (1)

### `internal:streams/duplex`
`internal:streams/duplex:2` | Self: 0.0% (0us) | Total: 0.3% (2.2ms) | Samples: 0

**Called by:**
- `anonymous` (2)

**Calls:**
- `anonymous` (2)

### `async asyncModuleEvaluation`
`[native code]` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Calls:**
- `evaluate` (1)

### `async run`
`/Users/nolarose/.factory-wager/fw-release.ts:88` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `async handleRelease` (1)

**Calls:**
- `async run` (1)

### `internal:stream`
`internal:stream:2` | Self: 0.0% (0us) | Total: 0.6% (3.4ms) | Samples: 0

**Called by:**
- `anonymous` (3)

**Calls:**
- `anonymous` (3)

### `evaluate`
`[native code]` | Self: 0.0% (0us) | Total: 0.2% (1.4ms) | Samples: 0

**Called by:**
- `async asyncModuleEvaluation` (1)

**Calls:**
- `(module)` (1)

### `internal:streams/operators`
`internal:streams/operators:2` | Self: 0.0% (0us) | Total: 0.3% (2.2ms) | Samples: 0

**Called by:**
- `anonymous` (2)

**Calls:**
- `anonymous` (2)

### `async loadModule`
`[native code]` | Self: 0.0% (0us) | Total: 0.5% (3.3ms) | Samples: 0

**Called by:**
- `async loadModule` (1)
- `async loadAndEvaluateModule` (1)

**Calls:**
- `async loadModule` (1)
- `requestSatisfy` (1)

### `async loadAndEvaluateModule`
`[native code]` | Self: 0.0% (0us) | Total: 0.5% (3.3ms) | Samples: 0

**Called by:**
- `async loadAndEvaluateModule` (1)

**Calls:**
- `async loadModule` (1)
- `async loadAndEvaluateModule` (1)

### `resolve`
`[native code]` | Self: 0.0% (0us) | Total: 13.6% (78.5ms) | Samples: 0

**Calls:**
- `ShellOutput` (1)

### `async writeAudit`
`/Users/nolarose/.factory-wager/fw-release.ts:374` | Self: 0.0% (0us) | Total: 11.1% (63.8ms) | Samples: 0

**Called by:**
- `async run` (1)

**Calls:**
- `async writeAudit` (1)

## Files

| Self% | Self | File |
|------:|-----:|------|
| 87.6% | 503.9ms | `[native code]` |
| 12.1% | 69.6ms | `/Users/nolarose/.factory-wager/fw-release.ts` |
| 0.2% | 1.4ms | `node:zlib` |
