# Bun Profiling Reference (CPU + Heap)

> Source: Official Bun documentation (bun.sh/docs/runtime/profiling)

## CPU Profiling

Generate CPU profiles to analyze performance bottlenecks.

```bash
bun --cpu-prof script.js
```

### Markdown Output

Use `--cpu-prof-md` for grep-friendly, LLM-friendly markdown profiles:

```bash
bun --cpu-prof-md script.js
```

Both formats together:

```bash
bun --cpu-prof --cpu-prof-md script.js
```

Via environment variable:

```bash
BUN_OPTIONS="--cpu-prof-md" bun script.js
```

### CPU Profiling Options

```bash
bun --cpu-prof --cpu-prof-name my-profile.cpuprofile script.js
bun --cpu-prof --cpu-prof-dir ./profiles script.js
```

| Flag | Description |
|------|-------------|
| `--cpu-prof` | Generate `.cpuprofile` JSON file (Chrome DevTools format) |
| `--cpu-prof-md` | Generate markdown CPU profile (grep/LLM-friendly) |
| `--cpu-prof-name <filename>` | Set output filename |
| `--cpu-prof-dir <dir>` | Set output directory |

## Heap Profiling

Generate heap snapshots on exit to analyze memory usage and find leaks.

```bash
bun --heap-prof script.js
```

Generates a V8 `.heapsnapshot` file loadable in Chrome DevTools (Memory tab > Load).

### Markdown Output

Use `--heap-prof-md` for CLI-friendly markdown heap profiles:

```bash
bun --heap-prof-md script.js
```

Note: If both `--heap-prof` and `--heap-prof-md` are specified, the markdown format is used.

### Heap Profiling Options

```bash
bun --heap-prof --heap-prof-name my-snapshot.heapsnapshot script.js
bun --heap-prof --heap-prof-dir ./profiles script.js
```

| Flag | Description |
|------|-------------|
| `--heap-prof` | Generate V8 `.heapsnapshot` file on exit |
| `--heap-prof-md` | Generate markdown heap profile on exit |
| `--heap-prof-name <filename>` | Set output filename |
| `--heap-prof-dir <dir>` | Set output directory |
