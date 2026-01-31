# Testing and Performance Profiles

This directory contains specialized profiles for testing and performance scenarios, integrated with the CIDetector for optimal CI/CD automation.

## Available Profiles

### 1. **test-performance**

High-performance testing profile optimized for CI/CD pipelines

- **Environment**: `test`
- **Features**:
  - Optimized Bun settings (GC, interpreter, threads)
  - Extended timeout (30s)
  - No coverage collection for speed
  - Parallel execution enabled
  - Minimal logging
  - Real services (no mocks)

### 2. **test-comprehensive**

Full-featured testing profile with complete CI integration

- **Environment**: `test`
- **Features**:
  - GitHub Actions integration
  - Full coverage reporting (lcov, json, html)
  - Coverage threshold enforcement (80%)
  - CI annotations enabled
  - Hybrid mock strategy
  - Test reports generation
  - Flaky test detection

### 3. **benchmark**

Dedicated benchmarking profile for performance testing

- **Environment**: `benchmark`
- **Features**:
  - Profiling enabled (chrome, cpuprofile)
  - Flamegraph generation
  - Memory and CPU measurement
  - Metrics export (Prometheus)
  - LRU caching strategy
  - Extended timeouts (60s)

## Usage

### Quick Start

```bash
# Run with automatic profile selection
bun run test:profile

# Performance testing
bun run test:perf

# Comprehensive testing with coverage
bun run test:comprehensive

# Benchmarking
bun run test:benchmark
```

### Manual Profile Selection

```bash
# Use specific profile
bun run matrix:profile:use test-performance
bun test

# Or use the integrated script
bun run profile:test-perf
bun run profile:test-full
bun run profile:benchmark
```

### CI Integration

The profiles automatically integrate with the CIDetector:

1. **GitHub Actions PR**: Automatically uses `test-performance`
2. **GitHub Actions Push**: Automatically uses `test-comprehensive`
3. **Local Development**: Uses `test-local`

### Environment Variables

Each profile sets specific environment variables:

#### test-performance

```bash
BUN_GC_FORCE=1                    # Force garbage collection
BUN_JSC_FORCE_INTERPRETER=false   # Use JIT compiler
TEST_TIMEOUT=30000                 # 30 second timeout
PARALLEL_TESTS=true                # Enable parallel execution
DISABLE_MOCK_DATA=true             # Use real services
```

#### test-comprehensive

```bash
GITHUB_ACTIONS=true                # Enable GitHub Actions mode
BUN_GITHUB_ACTIONS_ANNOTATIONS=true # Enable annotations
TEST_COVERAGE=true                 # Enable coverage
COVERAGE_REPORTER=lcov,json,html   # Multiple report formats
COVERAGE_THRESHOLD=80              # Enforce 80% coverage
```

#### benchmark

```bash
ENABLE_PROFILING=true              # Enable profiling
PROFILER_OUTPUT=chrome,cpuprofile  # Output formats
BENCHMARK_ITERATIONS=1000          # Number of iterations
MEASURE_MEMORY=true                # Measure memory usage
METRICS_EXPORT=prometheus          # Export metrics
```

## Integration with CIDetector

The profile system integrates seamlessly with the CIDetector:

```typescript
import { CIDetector } from './src/lib/ci-detector.ts';

const detector = await CIDetector.getInstance();
const ci = detector.detectSync();

// Auto-select profile based on CI environment
if (ci.isPR) {
  // Use performance profile for PRs
} else if (ci.isCI) {
  // Use comprehensive profile for main branch
} else {
  // Use local profile for development
}
```

## Best Practices

1. **PR Builds**: Use `test-performance` for fast feedback
2. **Main Branch**: Use `test-comprehensive` for full validation
3. **Performance Tests**: Use `benchmark` profile for regression testing
4. **Local Development**: Use `test-local` for debugging

## Creating Custom Profiles

Create a new profile in `~/.matrix/profiles/`:

```json
{
  "name": "my-custom-profile",
  "version": "1.0.0",
  "environment": "test",
  "env": {
    "NODE_ENV": "test",
    "CUSTOM_SETTING": "value"
  }
}
```

Then use it:

```bash
bun run matrix:profile:use my-custom-profile
```

## Scripts Reference

| Script         | Description                                               |
|----------------|-----------------------------------------------------------|
| `test:profile` | Auto-select and run with appropriate profile              |
| `test:perf`    | Run with performance profile                             |
| `test:comprehensive` | Run with comprehensive profile                        |
| `test:benchmark` | Run with benchmark profile                               |
| `profile:integration` | Demo profile integration with CI detection         |
| `profile:test-perf` | Apply test-performance profile and run tests          |
| `profile:test-full` | Apply test-comprehensive profile with coverage         |
| `profile:benchmark` | Apply benchmark profile and run tests                  |
