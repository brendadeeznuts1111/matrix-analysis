# Nolarose Unified Benchmark Suite

A comprehensive benchmark suite combining performance tests, utilities, and optimization measurements for the Nolarose MCP Config workspace.

## 📁 Structure

```
benchmarks-combined/
├── core/           # Core test configuration benchmarks (Tier-1380)
├── utils/          # Mitata-based benchmark utilities
├── performance/    # Bun v1.3.7+ performance benchmarks
├── skills/         # Skills registry performance benchmarks
├── reports/        # Benchmark reports and results
└── package.json    # Unified benchmark configuration
```

## 🚀 Quick Start

```bash
# Run all benchmarks
bun run all

# Run with JSON output (CI/CD)
bun run all:json

# Run specific categories
bun run utils      # Mitata utilities
bun run performance # Performance benchmarks
bun run core       # Core configuration
bun run skills     # Skills benchmarks
```

## 📊 Categories

### Core Benchmarks (`core/`)

- **test-config-bench.ts** - Tier-1380 configuration loading and validation
- Target: <1ms config loading time
- Features security validation and inheritance resolution

### Utils (`utils/`)

Mitata-based benchmark utilities aligned with Bun's official structure:

- `crc32-bench-mitata.ts` - Hardware-accelerated CRC32 (20x faster)
- `spawn-bench-mitata.ts` - Process spawning performance
- `archive-bench-mitata.ts` - Archive creation benchmarks
- `utils.ts` - Standardized benchmark wrapper

### Performance (`performance/`)

Bun v1.3.7+ performance improvements:

- `buffer-simd-benchmark.ts` - SIMD-optimized Buffer operations
- `bun-hash-benchmark.ts` - Hardware-accelerated hashing
- `spawn-benchmark.ts` - Process spawning tests
- `spawnsync-benchmark.ts` - Synchronous spawn tests

### Skills (`skills/`)

- `perf-optimizations.bench.ts` - Skills registry performance
- `perf-snapshot.json` - Performance snapshot data

## 🎯 Key Results

### Buffer SIMD Performance
- `indexOf (found)`: ~8.13 µs/iter
- `includes (found)`: ~7.93 µs/iter
- **Status**: ✅ SIMD optimized (up to 2x faster)

### CRC32 Hardware Acceleration
- Throughput: ~9.7 GB/s
- **Status**: ✅ Hardware accelerated (20x faster)

### Process Spawning
- `Bun.spawnSync(['true'])`: ~1.28 ms/iter
- **Status**: ✅ Fixed 30x slowdown on Linux ARM64

## 📝 Usage Examples

### Running Individual Benchmarks

```bash
# CRC32 benchmark
bun run crc32

# Buffer SIMD benchmark
bun run buffer

# Configuration benchmark
bun run config
```

### Creating New Benchmarks

```typescript
import { bench, group, run } from "./utils";

group("My Feature", () => {
  bench("fast operation", () => {
    // Your code here
  });

  bench("slow operation", () => {
    // Your code here
  });
});

await run();
```

### CI/CD Integration

```bash
# Set for JSON output
export BENCHMARK_RUNNER=1

# Run benchmarks
bun run all:json

# Results will be in JSON format for easy parsing
```

## 📈 Performance Targets

- **Config Load**: <1ms (Tier-1380 compliance)
- **Security Scan**: <5ms (threat detection)
- **Inheritance**: <2ms (12-dimensional)
- **Validation**: <3ms (zero-trust)

## 🔧 Dependencies

- `mitata@^1.0.34` - Modern benchmark runner
- `benchmark@^2.1.4` - Legacy benchmark support

## 🧹 Cleanup (After Migration)

Once you've verified the new benchmark suite works correctly, you can remove the old directories:

```bash
# Remove old benchmark directories
rm -rf ../bench
rm -rf ../benchmarks
rm -rf ../test/scripts/bench
rm -rf ../skills/benchmarks

# Commit the cleanup
git add -A
git commit -m "[INFRA][COMPONENT:BENCHMARK][TIER:500] Remove old benchmark directories after migration"
```

⚠️ **Important**: Only perform cleanup after:
- All tests pass with the new structure
- CI/CD pipelines have been updated
- Team members have been notified

## 📚 Related Documentation

- [Bun 1.3.6 Improvements](../docs/BUN_1_3_6_IMPROVEMENTS.md)
- [Buffer SIMD Performance](../docs/benchmarks/BUFFER_SIMD_PERFORMANCE.md)
- [Tier-1380 Requirements](../docs/TIER_1380_REQUIREMENTS.md)

## 🏆 Best Practices

1. **Warmup**: Always include warmup iterations
2. **Grouping**: Use `group()` to organize benchmarks
3. **Consistency**: Use same setup across runs
4. **Documentation**: Document what each benchmark measures
5. **Baselines**: Keep baseline measurements for comparison
