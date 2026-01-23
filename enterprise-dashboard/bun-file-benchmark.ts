#!/usr/bin/env bun

/**
 * Bun.file() Read Methods Benchmark
 * Compares: stream(), arrayBuffer(), bytes(), text()
 */

const FILE_PATH = "/tmp/large.bin";
const ITERATIONS = 3;

// ANSI color helpers using Bun.color()
const ansi = (color: string) => Bun.color(color, "ansi") as string;
const reset = ansi("white");
const green = ansi("hsl(145, 63%, 42%)");
const blue = ansi("hsl(210, 90%, 55%)");
const orange = ansi("hsl(25, 85%, 55%)");
const red = ansi("hsl(0, 75%, 60%)");
const cyan = ansi("hsl(195, 85%, 55%)");
const dim = "\x1b[2m";
const bold = "\x1b[1m";

interface BenchResult {
  method: string;
  description: string;
  returnType: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
  throughputMBps: number;
  memoryMB: number;
  memoryPattern: string;
  useCase: string;
  icon: string;
}

async function benchmark() {
  const file = Bun.file(FILE_PATH);
  const fileSizeMB = file.size / 1024 / 1024;
  const fileSizeBytes = file.size;

  console.log(`\n${bold}Bun.file() Read Methods Benchmark${reset}`);
  console.log(`${dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
  console.log(`  File: ${cyan}${FILE_PATH}${reset}`);
  console.log(`  Size: ${cyan}${fileSizeMB.toFixed(1)} MB${reset} (${fileSizeBytes.toLocaleString()} bytes)`);
  console.log(`  MIME: ${cyan}${file.type}${reset}`);
  console.log(`  Iterations: ${cyan}${ITERATIONS}${reset}\n`);

  const results: BenchResult[] = [];

  // Method 1: Streaming (chunked)
  {
    const times: number[] = [];
    let peakMemory = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      Bun.gc(true);
      const baseMemory = process.memoryUsage().heapUsed;
      const start = performance.now();
      const stream = file.stream();
      let totalBytes = 0;
      for await (const chunk of stream) {
        totalBytes += chunk.length;
        peakMemory = Math.max(peakMemory, process.memoryUsage().heapUsed - baseMemory);
      }
      times.push(performance.now() - start);
    }
    const avgMs = times.reduce((a, b) => a + b) / times.length;
    results.push({
      method: "stream()",
      description: "Async iterator yielding chunks",
      returnType: "ReadableStream<Uint8Array>",
      avgMs,
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      throughputMBps: fileSizeMB / (avgMs / 1000),
      memoryMB: peakMemory / 1024 / 1024,
      memoryPattern: "Chunked (~64KB)",
      useCase: "Large files, memory constrained",
      icon: "🌊",
    });
  }

  // Method 2: ArrayBuffer (single allocation)
  {
    const times: number[] = [];
    let peakMemory = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      Bun.gc(true);
      const baseMemory = process.memoryUsage().heapUsed;
      const start = performance.now();
      const buffer = await file.arrayBuffer();
      const view = new Uint8Array(buffer);
      const _ = view[0] + view[view.length - 1];
      peakMemory = Math.max(peakMemory, process.memoryUsage().heapUsed - baseMemory);
      times.push(performance.now() - start);
    }
    const avgMs = times.reduce((a, b) => a + b) / times.length;
    results.push({
      method: "arrayBuffer()",
      description: "Single contiguous allocation",
      returnType: "ArrayBuffer",
      avgMs,
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      throughputMBps: fileSizeMB / (avgMs / 1000),
      memoryMB: peakMemory / 1024 / 1024,
      memoryPattern: "Full file in memory",
      useCase: "WebAssembly, typed arrays",
      icon: "📦",
    });
  }

  // Method 3: Bytes (Uint8Array directly)
  {
    const times: number[] = [];
    let peakMemory = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      Bun.gc(true);
      const baseMemory = process.memoryUsage().heapUsed;
      const start = performance.now();
      const bytes = await file.bytes();
      const _ = bytes[0] + bytes[bytes.length - 1];
      peakMemory = Math.max(peakMemory, process.memoryUsage().heapUsed - baseMemory);
      times.push(performance.now() - start);
    }
    const avgMs = times.reduce((a, b) => a + b) / times.length;
    results.push({
      method: "bytes()",
      description: "Direct Uint8Array (no wrapper)",
      returnType: "Uint8Array",
      avgMs,
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      throughputMBps: fileSizeMB / (avgMs / 1000),
      memoryMB: peakMemory / 1024 / 1024,
      memoryPattern: "Full file in memory",
      useCase: "Binary processing, hashing",
      icon: "⚡",
    });
  }

  // Method 4: text() for comparison
  {
    const times: number[] = [];
    let peakMemory = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      Bun.gc(true);
      const baseMemory = process.memoryUsage().heapUsed;
      const start = performance.now();
      try {
        const text = await file.text();
        const _ = text.length;
        peakMemory = Math.max(peakMemory, process.memoryUsage().heapUsed - baseMemory);
      } catch {
        // Binary file may have invalid UTF-8
      }
      times.push(performance.now() - start);
    }
    const avgMs = times.reduce((a, b) => a + b) / times.length;
    results.push({
      method: "text()",
      description: "UTF-8 decode to string",
      returnType: "string",
      avgMs,
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      throughputMBps: fileSizeMB / (avgMs / 1000),
      memoryMB: peakMemory / 1024 / 1024,
      memoryPattern: "~2x file size (UTF-16)",
      useCase: "Text/JSON files only",
      icon: "📄",
    });
  }

  // Sort by throughput (fastest first)
  results.sort((a, b) => b.throughputMBps - a.throughputMBps);
  const bestThroughput = results[0].throughputMBps;

  // Build performance bar
  const perfBar = (ratio: number) => {
    const filled = Math.round(ratio * 8);
    return green + "█".repeat(filled) + dim + "░".repeat(8 - filled) + reset;
  };

  // Main results table
  console.log(`${bold}Performance Results${reset}\n`);

  const mainTable = results.map((r, i) => {
    const ratio = r.throughputMBps / bestThroughput;
    const rankIcon = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
    const speedColor = ratio >= 0.9 ? green : ratio >= 0.5 ? orange : red;

    return {
      "Rank": `${rankIcon}`,
      "Method": `${r.icon} ${r.method}`,
      "Avg": `${r.avgMs.toFixed(1)}ms`,
      "Min/Max": `${r.minMs.toFixed(1)}/${r.maxMs.toFixed(1)}ms`,
      "Throughput": `${speedColor}${r.throughputMBps.toFixed(0)} MB/s${reset}`,
      "Perf": perfBar(ratio),
      "vs Best": i === 0 ? `${green}baseline${reset}` : `${dim}${(bestThroughput / r.throughputMBps).toFixed(1)}x slower${reset}`,
    };
  });

  console.log(Bun.inspect.table(mainTable, { colors: true }));

  // Detailed breakdown table
  console.log(`\n${bold}Method Details${reset}\n`);

  const detailTable = results.map((r) => ({
    "Method": `${r.icon} ${r.method}`,
    "Return Type": `${cyan}${r.returnType}${reset}`,
    "Memory Pattern": r.memoryPattern,
    "Best For": r.useCase,
  }));

  console.log(Bun.inspect.table(detailTable, { colors: true }));

  // API reference table
  console.log(`\n${bold}API Quick Reference${reset}\n`);

  const apiTable = [
    {
      "Method": `${green}bytes()${reset}`,
      "Async": "Yes",
      "Copies": "No",
      "Description": "Fastest for binary data, returns Uint8Array directly",
    },
    {
      "Method": `${blue}arrayBuffer()${reset}`,
      "Async": "Yes",
      "Copies": "No",
      "Description": "Returns ArrayBuffer, wrap with typed array view",
    },
    {
      "Method": `${orange}stream()${reset}`,
      "Async": "Yes",
      "Copies": "Chunked",
      "Description": "Memory efficient, ~64KB chunks via async iterator",
    },
    {
      "Method": `${red}text()${reset}`,
      "Async": "Yes",
      "Copies": "Yes",
      "Description": "UTF-8 decode overhead, ~2x memory (UTF-16 strings)",
    },
  ];

  console.log(Bun.inspect.table(apiTable, { colors: true }));

  // Decision guide
  console.log(`\n${bold}When to Use Each Method${reset}`);
  console.log(`${dim}━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
  console.log(`  ${green}bytes()${reset}       → Binary processing, hashing, crypto, image manipulation`);
  console.log(`  ${blue}arrayBuffer()${reset} → WebAssembly, DataView, shared with workers`);
  console.log(`  ${orange}stream()${reset}      → Files > available RAM, real-time processing, piping`);
  console.log(`  ${red}text()${reset}        → JSON.parse(), config files, source code, logs\n`);
}

// CRC32 checksum comparison
async function checksumBenchmark() {
  const file = Bun.file(FILE_PATH);
  const fileSizeMB = file.size / 1024 / 1024;
  const bytes = await file.bytes();

  console.log(`${bold}Checksum / Hashing Benchmark${reset}`);
  console.log(`${dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}\n`);

  const hashResults: Array<{
    method: string;
    time: number;
    throughput: number;
    result: string;
    accelerated: boolean;
  }> = [];

  // Bun.hash.crc32 (hardware accelerated)
  {
    const start = performance.now();
    const hash = Bun.hash.crc32(bytes);
    const time = performance.now() - start;
    hashResults.push({
      method: "Bun.hash.crc32()",
      time,
      throughput: fileSizeMB / (time / 1000),
      result: `0x${hash.toString(16).padStart(8, "0")}`,
      accelerated: true,
    });
  }

  // Bun.hash (default - wyhash)
  {
    const start = performance.now();
    const hash = Bun.hash(bytes);
    const time = performance.now() - start;
    hashResults.push({
      method: "Bun.hash() [wyhash]",
      time,
      throughput: fileSizeMB / (time / 1000),
      result: `0x${hash.toString(16).padStart(16, "0")}`,
      accelerated: true,
    });
  }

  // Bun.hash.adler32
  {
    const start = performance.now();
    const hash = Bun.hash.adler32(bytes);
    const time = performance.now() - start;
    hashResults.push({
      method: "Bun.hash.adler32()",
      time,
      throughput: fileSizeMB / (time / 1000),
      result: `0x${hash.toString(16).padStart(8, "0")}`,
      accelerated: true,
    });
  }

  // Simple JS sum (baseline comparison)
  {
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < bytes.length; i++) {
      sum = (sum + bytes[i]) >>> 0;
    }
    const time = performance.now() - start;
    hashResults.push({
      method: "JS loop sum",
      time,
      throughput: fileSizeMB / (time / 1000),
      result: `0x${sum.toString(16).padStart(8, "0")}`,
      accelerated: false,
    });
  }

  // Sort by throughput
  hashResults.sort((a, b) => b.throughput - a.throughput);
  const bestThroughput = hashResults[0].throughput;

  const hashTable = hashResults.map((r, i) => {
    const speedColor = r.throughput > 5000 ? green : r.throughput > 1000 ? blue : r.throughput > 500 ? orange : red;
    const accelIcon = r.accelerated ? "🚀" : "🐢";
    const ratio = bestThroughput / r.throughput;

    return {
      "Rank": i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`,
      "Method": `${accelIcon} ${r.method}`,
      "Time": `${r.time.toFixed(2)}ms`,
      "Throughput": `${speedColor}${(r.throughput / 1000).toFixed(1)} GB/s${reset}`,
      "Result": `${dim}${r.result}${reset}`,
      "vs Best": i === 0 ? `${green}baseline${reset}` : `${dim}${ratio.toFixed(1)}x slower${reset}`,
    };
  });

  console.log(Bun.inspect.table(hashTable, { colors: true }));

  // Hash algorithm comparison
  console.log(`\n${bold}Hash Algorithm Properties${reset}\n`);

  const algoTable = [
    {
      "Algorithm": `${green}wyhash${reset}`,
      "Bits": "64",
      "Crypto": "No",
      "Use Case": "Hash tables, fast checksums",
      "Notes": "Default Bun.hash(), extremely fast",
    },
    {
      "Algorithm": `${blue}CRC32${reset}`,
      "Bits": "32",
      "Crypto": "No",
      "Use Case": "File integrity, archives (ZIP, PNG)",
      "Notes": "Hardware accelerated (SSE4.2)",
    },
    {
      "Algorithm": `${orange}Adler32${reset}`,
      "Bits": "32",
      "Crypto": "No",
      "Use Case": "zlib, fast checksum",
      "Notes": "Faster than CRC32, less collision resistance",
    },
    {
      "Algorithm": `${cyan}xxHash${reset}`,
      "Bits": "32/64",
      "Crypto": "No",
      "Use Case": "Content addressing",
      "Notes": "Available via Bun.hash.xxHash32/64",
    },
  ];

  console.log(Bun.inspect.table(algoTable, { colors: true }));
}

await benchmark();
await checksumBenchmark();
