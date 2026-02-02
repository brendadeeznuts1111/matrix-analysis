// lib/perf.ts - Performance & benchmark utilities
// ═══════════════════════════════════════════════════════════════════════════════
// Reusable Bun-native helpers for timing, buffer ops, hashing, and runtime metrics
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-010: Benchmark Harness
// ─────────────────────────────────────────────────────────────────────────────
export interface BenchResult {
  label: string;
  runs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  times: number[];
}

export const bench = async (
  label: string,
  fn: () => void | Promise<void>,
  runs = 3
): Promise<BenchResult> => {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }
  return {
    label,
    runs,
    avgMs: times.reduce((a, b) => a + b, 0) / runs,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    times,
  };
};

export const benchSync = (
  label: string,
  fn: () => void,
  runs = 3
): BenchResult => {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  return {
    label,
    runs,
    avgMs: times.reduce((a, b) => a + b, 0) / runs,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    times,
  };
};

export const printBench = (results: BenchResult[]): void => {
  const rows = results.map((r) => ({
    label: r.label,
    avg: r.avgMs.toFixed(2) + "ms",
    min: r.minMs.toFixed(2) + "ms",
    max: r.maxMs.toFixed(2) + "ms",
    runs: r.runs,
  }));
  console.log(Bun.inspect.table(rows, ["label", "avg", "min", "max", "runs"]));
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-011: Buffer Conversion Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** TypedArray → Buffer (zero-copy when possible) */
export const typedArrayToBuffer = (arr: Uint8Array | Int8Array | Uint16Array): Buffer =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);

/** Benchmark Buffer.from on a typed array for N iterations */
export const benchBufferFrom = (arr: Uint8Array, iterations = 1e5): BenchResult =>
  benchSync(`Buffer.from(${arr.byteLength}B × ${iterations})`, () => {
    for (let i = 0; i < iterations; i++) Buffer.from(arr.buffer);
  });

// ─────────────────────────────────────────────────────────────────────────────
// BN-012: Hash Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** CRC32 via Bun's hardware-accelerated path */
export const crc32 = (data: string | Buffer | ArrayBuffer): number =>
  Bun.hash.crc32(data);

/** SHA-256 hex digest */
export const sha256 = (data: string | Buffer): string => {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(data);
  return hasher.digest("hex");
};

/** Benchmark CRC32 on an allocated buffer of given size */
export const benchCrc32 = (sizeBytes: number): BenchResult =>
  benchSync(`crc32(${(sizeBytes / 1024).toFixed(0)}KB)`, () => {
    Bun.hash.crc32(Buffer.alloc(sizeBytes));
  });

/** Benchmark SHA-256 for N iterations */
export const benchSha256 = (data: string | Buffer, iterations = 1e5): BenchResult =>
  benchSync(`sha256 × ${iterations}`, () => {
    for (let i = 0; i < iterations; i++) {
      const h = new Bun.CryptoHasher("sha256");
      h.update(data);
      h.digest("hex");
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// BN-013: File I/O Benchmark
// ─────────────────────────────────────────────────────────────────────────────

/** Benchmark Buffer → Bun.write() for N iterations (writes to /dev/null) */
export const benchFileWrite = (data: number[], iterations = 1e4): BenchResult =>
  benchSync(`Bun.write(${data.length}B × ${iterations})`, () => {
    for (let i = 0; i < iterations; i++) {
      Bun.write("/dev/null", Buffer.from(data));
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// BN-014: Runtime Metrics
// ─────────────────────────────────────────────────────────────────────────────
export interface RuntimeMetrics {
  startupMs: number;
  heapMB: number;
  threads: number;
  bunVersion: string;
  nodeCompat: string;
}

export const getRuntimeMetrics = (): RuntimeMetrics => ({
  startupMs: Math.round(performance.now()),
  heapMB: +(process.memoryUsage().heapUsed / 1e6).toFixed(1),
  threads: navigator.hardwareConcurrency ?? 0,
  bunVersion: Bun.version,
  nodeCompat: process.versions.node,
});

export const printRuntimeMetrics = (): void => {
  const m = getRuntimeMetrics();
  const rows = Object.entries(m).map(([k, v]) => ({ metric: k, value: String(v) }));
  console.log(Bun.inspect.table(rows, ["metric", "value"]));
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-015: Response Helpers (re-exported from http.ts)
// ─────────────────────────────────────────────────────────────────────────────
export { jsonResponse, cachedJsonResponse, streamResponse } from "./http.ts";

// ─────────────────────────────────────────────────────────────────────────────
// BN-016: Nano Timer (Bun.nanoseconds wrapper)
// ─────────────────────────────────────────────────────────────────────────────

export const nanoTimer = () => {
  const start = Bun.nanoseconds();
  return {
    /** Elapsed nanoseconds */
    ns: () => Bun.nanoseconds() - start,
    /** Elapsed milliseconds */
    ms: () => (Bun.nanoseconds() - start) / 1e6,
    /** Elapsed microseconds */
    us: () => (Bun.nanoseconds() - start) / 1e3,
  };
};
