#!/usr/bin/env bun

/**
 * Bun v1.3.6+ API Test Suite Summary
 * Comprehensive overview of all tested APIs
 */

// Type definitions for summary data structures
interface TestFileEntry {
  File: string;
  Type: "test" | "bench" | "cli";
  Tests: string;
  Focus: string;
  $PATH: string;
}

interface ApiCoverageEntry {
  Category: string;
  API: string;
  Type: "function" | "method" | "class" | "option" | "static" | "namespace" | "tagged tmpl" | "symbol" | "object" | "string";
  Properties: string;
  Status: "✓" | "✗" | "⚠";
  Tests: string;
}

interface ReplacementEntry {
  "Bun API": string;
  Type: "function" | "class" | "namespace" | "tagged tmpl";
  Properties: string;
  Replaces: string;
  DLs: string;
}

interface PerfEntry {
  Metric: string;
  Type: "I/O" | "CPU" | "HTTP" | "Build" | "Test";
  Result: string;
  Properties: string;
  Notes: string;
}

const ansi = (color: string): string => Bun.color(color, "ansi") as string;
const green = ansi("hsl(145, 63%, 42%)");
const blue = ansi("hsl(210, 90%, 55%)");
const orange = ansi("hsl(25, 85%, 55%)");
const cyan = ansi("hsl(195, 85%, 55%)");
const magenta = ansi("hsl(300, 70%, 60%)");
const reset = ansi("white");
const dim = "\x1b[2m";
const bold = "\x1b[1m";

console.log(`
${bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
${bold}   Bun v1.3.6+ API Test Suite Summary${reset}
${bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}
`);

// Test file summary
const testFiles: TestFileEntry[] = [
  {
    File: `${green}bun-apis.integration.test.ts${reset}`,
    Type: "test",
    Tests: "21",
    Focus: "Server, cookies, HTTP, runtime utils",
    "$PATH": "~/test/bun-apis.integration.test.ts",
  },
  {
    File: `${blue}bun-build.integration.test.ts${reset}`,
    Type: "test",
    Tests: "17",
    Focus: "Virtual files, metafile, bundler options",
    "$PATH": "~/test/bun-build.integration.test.ts",
  },
  {
    File: `${orange}bun-zero-deps.test.ts${reset}`,
    Type: "test",
    Tests: "47",
    Focus: "Archive, JSONC, color, hash, shell",
    "$PATH": "~/test/bun-zero-deps.test.ts",
  },
  {
    File: `${cyan}bun-extended.test.ts${reset}`,
    Type: "test",
    Tests: "57",
    Focus: "Glob, password, semver, compression, DNS",
    "$PATH": "~/test/bun-extended.test.ts",
  },
  {
    File: `${green}s3-project.test.ts${reset}`,
    Type: "test",
    Tests: "37",
    Focus: "ProjectManager, ProjectStorage, S3 schema",
    "$PATH": "~/test/s3-project/s3-project.test.ts",
  },
  {
    File: `${blue}dataview.test.ts${reset}`,
    Type: "test",
    Tests: "60",
    Focus: "Uint8Array→DataView, binary parsing, safety",
    "$PATH": "~/test/dataview/dataview.test.ts",
  },
  {
    File: `${orange}string-width.test.ts${reset}`,
    Type: "test",
    Tests: "83",
    Focus: "Bun.stringWidth, V8 type checks, emoji/ANSI",
    "$PATH": "~/test/string-width/string-width.test.ts",
  },
  {
    File: `${magenta}bun-file-benchmark.ts${reset}`,
    Type: "bench",
    Tests: "—",
    Focus: "File I/O performance benchmarks",
    "$PATH": "~/test/bun-file-benchmark.ts",
  },
  {
    File: `${magenta}bun-apis.bench.ts${reset}`,
    Type: "bench",
    Tests: "—",
    Focus: "Hash, compression, UUID, string ops",
    "$PATH": "~/test/bun-apis.bench.ts",
  },
  {
    File: `${dim}bun-summary.ts${reset}`,
    Type: "cli",
    Tests: "—",
    Focus: "API reference dashboard",
    "$PATH": "~/test/bun-summary.ts",
  },
];

console.log(`${bold}Test Files${reset}\n`);
console.log(Bun.inspect.table(testFiles, { colors: true }));

// API coverage by category
console.log(`\n${bold}API Coverage by Category${reset}\n`);

const apiCoverage: ApiCoverageEntry[] = [
  // File & I/O
  { Category: `${green}File I/O${reset}`, API: "Bun.file()", Type: "function", Properties: "size, type, name, lastModified", Status: "✓", Tests: "8" },
  { Category: "", API: "Bun.write()", Type: "function", Properties: "path, data, options", Status: "✓", Tests: "5" },
  { Category: "", API: ".stream()", Type: "method", Properties: "ReadableStream<Uint8Array>", Status: "✓", Tests: "2" },
  { Category: "", API: ".bytes()", Type: "method", Properties: "Promise<Uint8Array>", Status: "✓", Tests: "2" },
  { Category: "", API: ".text()", Type: "method", Properties: "Promise<string>", Status: "✓", Tests: "2" },
  { Category: "", API: ".json()", Type: "method", Properties: "Promise<T>", Status: "✓", Tests: "2" },
  { Category: "", API: ".arrayBuffer()", Type: "method", Properties: "Promise<ArrayBuffer>", Status: "✓", Tests: "2" },
  { Category: "", API: ".exists()", Type: "method", Properties: "Promise<boolean>", Status: "✓", Tests: "1" },

  // Build & Bundle
  { Category: `${blue}Build${reset}`, API: "Bun.build()", Type: "function", Properties: "entrypoints, outdir, target, format", Status: "✓", Tests: "14" },
  { Category: "", API: "files: {}", Type: "option", Properties: "Record<string, string | Uint8Array>", Status: "✓", Tests: "5" },
  { Category: "", API: "metafile: true", Type: "option", Properties: "inputs, outputs, bytes, imports", Status: "✓", Tests: "3" },
  { Category: "", API: "define: {}", Type: "option", Properties: "Record<string, string>", Status: "✓", Tests: "1" },
  { Category: "", API: "minify: true", Type: "option", Properties: "boolean | MinifyOptions", Status: "✓", Tests: "1" },
  { Category: "", API: "sourcemap", Type: "option", Properties: "inline | external | none", Status: "✓", Tests: "1" },
  { Category: "", API: "naming", Type: "option", Properties: "[name], [hash], [dir], [ext]", Status: "✓", Tests: "1" },

  // Utilities
  { Category: `${orange}Utils${reset}`, API: "Bun.color()", Type: "function", Properties: "hex, [rgb], {rgba}, ansi, ansi-16m", Status: "✓", Tests: "8" },
  { Category: "", API: "Bun.hash()", Type: "function", Properties: "bigint (wyhash default)", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.hash.crc32()", Type: "function", Properties: "number (32-bit)", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.hash.adler32()", Type: "function", Properties: "number (32-bit)", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.deepEquals()", Type: "function", Properties: "a, b, strict?", Status: "✓", Tests: "5" },
  { Category: "", API: "Bun.stringWidth()", Type: "function", Properties: "string → number", Status: "✓", Tests: "5" },
  { Category: "", API: "Bun.JSONC.parse()", Type: "function", Properties: "comments, trailing commas", Status: "✓", Tests: "5" },

  // Archive
  { Category: `${cyan}Archive${reset}`, API: "new Bun.Archive()", Type: "class", Properties: "files, options: {compress, level}", Status: "✓", Tests: "4" },

  // Shell
  { Category: `${magenta}Shell${reset}`, API: "Bun.$``", Type: "tagged tmpl", Properties: "stdout, stderr, exitCode", Status: "✓", Tests: "6" },
  { Category: "", API: ".quiet()", Type: "method", Properties: "suppress stderr", Status: "✓", Tests: "2" },
  { Category: "", API: ".nothrow()", Type: "method", Properties: "don't throw on non-zero", Status: "✓", Tests: "1" },
  { Category: "", API: ".text()", Type: "method", Properties: "Promise<string>", Status: "✓", Tests: "2" },

  // HTTP
  { Category: `${green}HTTP${reset}`, API: "Bun.serve()", Type: "function", Properties: "port, fetch, websocket", Status: "✓", Tests: "3" },
  { Category: "", API: "Response.json()", Type: "static", Properties: "data, init?", Status: "✓", Tests: "2" },
  { Category: "", API: ".getSetCookie()", Type: "method", Properties: "string[]", Status: "✓", Tests: "2" },

  // Inspect
  { Category: `${blue}Inspect${reset}`, API: "Bun.inspect.table()", Type: "function", Properties: "data, columns?, {colors}", Status: "✓", Tests: "4" },
  { Category: "", API: "Bun.inspect.custom", Type: "symbol", Properties: "custom formatter hook", Status: "✓", Tests: "1" },

  // Extended APIs
  { Category: `${cyan}Glob${reset}`, API: "new Bun.Glob()", Type: "class", Properties: "pattern, scan(), scanSync(), match()", Status: "✓", Tests: "5" },
  { Category: `${cyan}Password${reset}`, API: "Bun.password.hash()", Type: "function", Properties: "bcrypt, argon2id, cost", Status: "✓", Tests: "3" },
  { Category: "", API: "Bun.password.verify()", Type: "function", Properties: "password, hash → boolean", Status: "✓", Tests: "2" },
  { Category: `${magenta}Semver${reset}`, API: "Bun.semver.order()", Type: "function", Properties: "v1, v2 → -1|0|1", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.semver.satisfies()", Type: "function", Properties: "version, range → boolean", Status: "✓", Tests: "3" },
  { Category: `${orange}Compress${reset}`, API: "Bun.gzipSync()", Type: "function", Properties: "data, {level} → Uint8Array", Status: "✓", Tests: "3" },
  { Category: "", API: "Bun.gunzipSync()", Type: "function", Properties: "compressed → Uint8Array", Status: "✓", Tests: "1" },
  { Category: "", API: "Bun.deflateSync()", Type: "function", Properties: "data → Uint8Array (raw)", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.inflateSync()", Type: "function", Properties: "compressed → Uint8Array", Status: "✓", Tests: "1" },
  { Category: `${green}UUID${reset}`, API: "Bun.randomUUIDv7()", Type: "function", Properties: "time-ordered, sortable", Status: "✓", Tests: "4" },
  { Category: `${green}Timing${reset}`, API: "Bun.nanoseconds()", Type: "function", Properties: "number (high precision)", Status: "✓", Tests: "3" },
  { Category: "", API: "Bun.sleep()", Type: "function", Properties: "ms → Promise<void>", Status: "✓", Tests: "1" },
  { Category: "", API: "Bun.sleepSync()", Type: "function", Properties: "ms → void (blocking)", Status: "✓", Tests: "1" },
  { Category: `${blue}Security${reset}`, API: "Bun.escapeHTML()", Type: "function", Properties: "string → escaped string", Status: "✓", Tests: "4" },
  { Category: `${blue}Promise${reset}`, API: "Bun.peek()", Type: "function", Properties: "promise → value or promise", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.peek.status()", Type: "function", Properties: "fulfilled|pending|rejected", Status: "✓", Tests: "1" },
  { Category: `${orange}DNS${reset}`, API: "Bun.dns.lookup()", Type: "function", Properties: "hostname, {family} → addresses", Status: "✓", Tests: "3" },
  { Category: `${cyan}Stream${reset}`, API: "Bun.readableStreamToText()", Type: "function", Properties: "stream → string", Status: "✓", Tests: "1" },
  { Category: "", API: "Bun.readableStreamToBytes()", Type: "function", Properties: "stream → ArrayBuffer", Status: "✓", Tests: "1" },
  { Category: "", API: "Bun.readableStreamToJSON()", Type: "function", Properties: "stream → T", Status: "✓", Tests: "1" },
  { Category: `${green}Process${reset}`, API: "Bun.spawn()", Type: "function", Properties: "cmd, {stdin, stdout, env}", Status: "✓", Tests: "3" },
  { Category: "", API: "Bun.which()", Type: "function", Properties: "cmd → path | null", Status: "✓", Tests: "3" },
  { Category: `${blue}Runtime${reset}`, API: "Bun.gc()", Type: "function", Properties: "sync? → void", Status: "✓", Tests: "2" },
  { Category: "", API: "Bun.env", Type: "object", Properties: "get/set/delete env vars", Status: "✓", Tests: "3" },
  { Category: "", API: "Bun.version", Type: "string", Properties: "semver (e.g. 1.3.6)", Status: "✓", Tests: "1" },
  { Category: "", API: "Bun.revision", Type: "string", Properties: "git commit hash", Status: "✓", Tests: "1" },
];

console.log(Bun.inspect.table(apiCoverage, { colors: true }));

// NPM package replacements
console.log(`\n${bold}NPM Packages Replaced (Zero Dependencies)${reset}\n`);

const replacements: ReplacementEntry[] = [
  { "Bun API": `${green}Bun.Archive${reset}`, Type: "class", Properties: "files, compress, level", "Replaces": "tar, archiver, node-tar", "DLs": "~15M" },
  { "Bun API": `${green}Bun.JSONC${reset}`, Type: "namespace", Properties: "parse()", "Replaces": "jsonc-parser, strip-json-comments", "DLs": "~30M" },
  { "Bun API": `${blue}Bun.color${reset}`, Type: "function", Properties: "input, format → output", "Replaces": "chalk, picocolors, ansi-colors", "DLs": "~200M" },
  { "Bun API": `${blue}Bun.hash${reset}`, Type: "function", Properties: "crc32, adler32, wyhash", "Replaces": "crc32, hash-wasm, xxhash", "DLs": "~5M" },
  { "Bun API": `${orange}Bun.deepEquals${reset}`, Type: "function", Properties: "a, b, strict?", "Replaces": "lodash.isequal, deep-equal", "DLs": "~25M" },
  { "Bun API": `${orange}Bun.stringWidth${reset}`, Type: "function", Properties: "string → number", "Replaces": "string-width", "DLs": "~80M" },
  { "Bun API": `${cyan}Bun.inspect.table${reset}`, Type: "function", Properties: "data, cols?, opts?", "Replaces": "cli-table3, table", "DLs": "~15M" },
  { "Bun API": `${cyan}Bun.$${reset}`, Type: "tagged tmpl", Properties: "stdout, exitCode, text()", "Replaces": "execa, shelljs, zx", "DLs": "~100M" },
  { "Bun API": `${magenta}Bun.file${reset}`, Type: "function", Properties: "size, type, bytes(), json()", "Replaces": "fs-extra, mime-types", "DLs": "~150M" },
  { "Bun API": `${green}Bun.Glob${reset}`, Type: "class", Properties: "scan(), match()", "Replaces": "glob, fast-glob, minimatch", "DLs": "~120M" },
  { "Bun API": `${green}Bun.password${reset}`, Type: "namespace", Properties: "hash(), verify()", "Replaces": "bcrypt, argon2", "DLs": "~10M" },
  { "Bun API": `${blue}Bun.semver${reset}`, Type: "namespace", Properties: "order(), satisfies()", "Replaces": "semver", "DLs": "~50M" },
  { "Bun API": `${blue}Bun.gzip/deflate${reset}`, Type: "function", Properties: "compress/decompress", "Replaces": "pako, zlib, fflate", "DLs": "~30M" },
  { "Bun API": `${orange}Bun.escapeHTML${reset}`, Type: "function", Properties: "XSS prevention", "Replaces": "escape-html, he", "DLs": "~40M" },
  { "Bun API": `${orange}Bun.dns${reset}`, Type: "namespace", Properties: "lookup()", "Replaces": "dns-lookup, node:dns wrapper", "DLs": "~5M" },
];

console.log(Bun.inspect.table(replacements, { colors: true }));

// Performance highlights
console.log(`\n${bold}Performance Highlights${reset}\n`);

const perfData: PerfEntry[] = [
  { Metric: "File read (bytes())", Type: "I/O", Result: `${green}7.3 GB/s${reset}`, Properties: "Uint8Array direct", Notes: "100MB binary" },
  { Metric: "File read (stream())", Type: "I/O", Result: `${blue}2.5 GB/s${reset}`, Properties: "64KB chunks", Notes: "Memory efficient" },
  { Metric: "Hash (wyhash)", Type: "CPU", Result: `${green}35.9 GB/s${reset}`, Properties: "bigint (64-bit)", Notes: "SIMD optimized" },
  { Metric: "Hash (CRC32)", Type: "CPU", Result: `${blue}9.1 GB/s${reset}`, Properties: "number (32-bit)", Notes: "SSE4.2 accel" },
  { Metric: "Hash (Adler32)", Type: "CPU", Result: `${orange}3.9 GB/s${reset}`, Properties: "number (32-bit)", Notes: "zlib compat" },
  { Metric: "Response.json()", Type: "HTTP", Result: `${blue}1.5x faster${reset}`, Properties: "SIMD stringify", Notes: "vs JSON.stringify" },
  { Metric: "Minification", Type: "Build", Result: `${orange}58% smaller${reset}`, Properties: "whitespace, names", Notes: "Bun.build()" },
  { Metric: "Test suite", Type: "Test", Result: `${cyan}322 tests / 639ms${reset}`, Properties: "7 files parallel", Notes: "bun:test" },
];

console.log(Bun.inspect.table(perfData, { colors: true }));

// Quick reference
console.log(`\n${bold}Quick Reference${reset}`);
console.log(`${dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);

const examples = `
${green}// File I/O${reset}
const bytes = await Bun.file("data.bin").bytes();    // Uint8Array
const json = await Bun.file("config.json").json();   // Parsed object
const mime = Bun.file("image.png").type;             // "image/png"

${blue}// Build with virtual files${reset}
await Bun.build({
  entrypoints: ["./src/index.ts"],
  files: { "./src/config.ts": \`export const VERSION = "1.0";\` },
  metafile: true,
});

${orange}// Colors & formatting${reset}
const hex = Bun.color("hsl(210, 90%, 55%)", "hex");  // "#2b8cf4"
const ansi = Bun.color("#22c55e", "ansi-16m");       // Terminal color
console.log(Bun.inspect.table(data, { colors: true }));

${cyan}// Hashing${reset}
const crc = Bun.hash.crc32(bytes);                   // Hardware accelerated
const hash = Bun.hash("content");                    // wyhash (bigint)

${magenta}// Shell${reset}
const result = await Bun.$\`ls -la\`.text();
await Bun.$\`rm -rf ./dist\`.quiet();
`;

console.log(examples);

console.log(`${bold}Run Tests${reset}`);
console.log(`${dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
console.log(`  bun test ~/test/bun-*.test.ts ~/test/*/*.test.ts  ${dim}# All 322 tests${reset}`);
console.log(`  bun run ~/test/bun-file-benchmark.ts ${dim}# I/O benchmark${reset}`);
console.log(`  bun run ~/test/bun-apis.bench.ts     ${dim}# API benchmarks${reset}`);
console.log(`  bun run ~/test/bun-summary.ts        ${dim}# This summary${reset}\n`);
