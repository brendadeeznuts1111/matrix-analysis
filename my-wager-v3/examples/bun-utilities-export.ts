#!/usr/bin/env bun
// examples/bun-utilities-export.ts
// Export Bun utilities data as CSV/JSON with real samples

// Make this file a module
export {};

import { writeFileSync } from 'fs';
import { resolveOmegaTool } from "../utils/omega-tool-resolver";

console.log('📊 Bun Utilities Data Export');
console.log('==========================\n');

// Collect all utility data
const exportData = {
  timestamp: new Date().toISOString(),
  bun_version: Bun.version,
  bun_revision: Bun.revision,
  utilities: {
    which: {
      description: "Finds executable path via PATH",
      samples: {} as Record<string, string | null>,
      performance_ms: 0,
    },
    uuidv7: {
      description: "Monotonic UUIDv7 generation",
      samples: [] as string[],
      performance_ms: 0,
    },
    peek: {
      description: "Non-blocking promise inspection",
      samples: {
        immediate: null as any,
        pending: null as any,
        fulfilled: null as any,
        rejected: null as any,
      },
      performance_ms: 0,
    },
    stringWidth: {
      description: "Terminal string width calculation",
      samples: {} as Record<string, number>,
      performance_ms: 0,
    },
    deepEquals: {
      description: "Deep equality comparison",
      samples: {
        equal: false,
        not_equal: false,
        strict_sparse: false,
      },
      performance_ms: 0,
    },
    escapeHTML: {
      description: "HTML character escaping",
      samples: {} as Record<string, string>,
      performance_ms: 0,
    },
    urlPath: {
      description: "URL/Path conversion",
      samples: [] as Array<{path: string, url: string, roundtrip: boolean}>,
      performance_ms: 0,
    }
  }
};

// 1. Bun.which() samples
console.log('1. Collecting Bun.which() samples...');
const whichStart = Bun.nanoseconds();
const tools = ['bun', 'git', 'node', 'npm', 'sqlite3', 'code', 'eslint', 'tsc', 'prettier', 'jest'];
for (const tool of tools) {
  exportData.utilities.which.samples[tool] = await resolveOmegaTool(tool);
}
exportData.utilities.which.performance_ms = (Bun.nanoseconds() - whichStart) / 1000000;

// 2. UUIDv7 samples
console.log('2. Generating UUIDv7 samples...');
const uuidStart = Bun.nanoseconds();
for (let i = 0; i < 10; i++) {
  exportData.utilities.uuidv7.samples.push(Bun.randomUUIDv7());
  // Also test different encodings
  if (i === 0) {
    exportData.utilities.uuidv7.samples.push(Bun.randomUUIDv7('base64'));
    exportData.utilities.uuidv7.samples.push(Bun.randomUUIDv7('hex'));
  }
}
exportData.utilities.uuidv7.performance_ms = (Bun.nanoseconds() - uuidStart) / 1000000;

// 3. Peek samples
console.log('3. Testing Bun.peek()...');
const peekStart = Bun.nanoseconds();
const immediate = Promise.resolve('immediate value');
const pending = new Promise(() => {});
const fulfilled = Promise.resolve({ data: 'test' });
const rejected = Promise.reject(new Error('test error'));
rejected.catch(() => {});

exportData.utilities.peek.samples.immediate = Bun.peek(immediate);
exportData.utilities.peek.samples.pending = Bun.peek(pending);
exportData.utilities.peek.samples.fulfilled = Bun.peek(fulfilled);
try {
  exportData.utilities.peek.samples.rejected = Bun.peek(rejected);
} catch {
  exportData.utilities.peek.samples.rejected = '[Error caught]';
}
exportData.utilities.peek.performance_ms = (Bun.nanoseconds() - peekStart) / 1000000;

// 4. String width samples
console.log('4. Calculating string widths...');
const widthStart = Bun.nanoseconds();
const testStrings: Record<string, string> = {
  'Hello World': 'Simple ASCII',
  '🔥🚀💡': 'Emojis only',
  '\x1b[31mRed\x1b[0m': 'ANSI colored',
  '中文测试': 'Chinese characters',
  '👩‍💻‍🚀': 'Complex emoji ZWJ',
  '┌─┬─┐└┴┘': 'Box drawing',
  [ 'a'.repeat(100) ]: 'Long string',
};

for (const [str, desc] of Object.entries(testStrings)) {
  exportData.utilities.stringWidth.samples[`${desc}: "${str}"`] = Bun.stringWidth(str);
}
exportData.utilities.stringWidth.performance_ms = (Bun.nanoseconds() - widthStart) / 1000000;

// 5. Deep equals samples
console.log('5. Testing deep equality...');
const equalsStart = Bun.nanoseconds();
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };
const obj3 = { a: 1, b: { c: 3 } };
const sparse1 = [1, , 3];
const sparse2 = [1, undefined, 3];

exportData.utilities.deepEquals.samples.equal = Bun.deepEquals(obj1, obj2);
exportData.utilities.deepEquals.samples.not_equal = Bun.deepEquals(obj1, obj3);
exportData.utilities.deepEquals.samples.strict_sparse = Bun.deepEquals(sparse1, sparse2, true);
exportData.utilities.deepEquals.performance_ms = (Bun.nanoseconds() - equalsStart) / 1000000;

// 6. HTML escaping samples
console.log('6. Escaping HTML samples...');
const escapeStart = Bun.nanoseconds();
const htmlSamples = {
  '<script>alert("xss")</script>': 'XSS attempt',
  'Tom & Jerry & "Friends"': 'Special chars',
  '5 > 3 && 2 < 4': 'Operators',
  '© ™ ®': 'Entities',
  '"quoted" and \'single\'': 'Quotes',
};

for (const [input, desc] of Object.entries(htmlSamples)) {
  exportData.utilities.escapeHTML.samples[desc] = Bun.escapeHTML(input);
}
exportData.utilities.escapeHTML.performance_ms = (Bun.nanoseconds() - escapeStart) / 1000000;

// 7. URL/Path conversion samples
console.log('7. Converting URLs/Paths...');
const urlStart = Bun.nanoseconds();
const paths = [
  '/Users/nolarose/my-wager-v3/package.json',
  './examples/bun-utilities-export.ts',
  '/tmp/test.txt',
  '../relative/path.js',
  '/usr/local/bin/bun',
];

for (const path of paths) {
  const url = Bun.pathToFileURL(path);
  const backToPath = Bun.fileURLToPath(url);
  exportData.utilities.urlPath.samples.push({
    path,
    url: url.toString(),
    roundtrip: path === backToPath
  });
}
exportData.utilities.urlPath.performance_ms = (Bun.nanoseconds() - urlStart) / 1000000;

// Export as JSON
console.log('\n8. Exporting data...');
const jsonPath = './bun-utilities-data.json';
writeFileSync(jsonPath, JSON.stringify(exportData, null, 2));
console.log(`✅ JSON exported to: ${jsonPath}`);

// Export as CSV
const csvPath = './bun-utilities-data.csv';
let csv = 'Utility,Description,Sample Type,Sample Value,Performance (ms)\n';

// Add which samples
for (const [tool, path] of Object.entries(exportData.utilities.which.samples)) {
  csv += `which,${exportData.utilities.which.description},Tool,${tool},${path || 'null'},\n`;
}
csv += `which,,,,,${exportData.utilities.which.performance_ms}\n`;

// Add UUID samples
exportData.utilities.uuidv7.samples.forEach((uuid, i) => {
  const type = i === 0 ? 'Default' : i === 1 ? 'Base64' : i === 2 ? 'Hex' : 'Generated';
  csv += `uuidv7,${exportData.utilities.uuidv7.description},${type},${uuid},\n`;
});
csv += `uuidv7,,,,,${exportData.utilities.uuidv7.performance_ms}\n`;

// Add peek samples
for (const [type, value] of Object.entries(exportData.utilities.peek.samples)) {
  csv += `peek,${exportData.utilities.peek.description},${type},"${value}",\n`;
}
csv += `peek,,,,,${exportData.utilities.peek.performance_ms}\n`;

// Add string width samples
for (const [desc, width] of Object.entries(exportData.utilities.stringWidth.samples)) {
  csv += `stringWidth,${exportData.utilities.stringWidth.description},Width,"${desc}",${width}\n`;
}
csv += `stringWidth,,,,,${exportData.utilities.stringWidth.performance_ms}\n`;

// Add deep equals samples
for (const [type, result] of Object.entries(exportData.utilities.deepEquals.samples)) {
  csv += `deepEquals,${exportData.utilities.deepEquals.description},${type},${result},\n`;
}
csv += `deepEquals,,,,,${exportData.utilities.deepEquals.performance_ms}\n`;

// Add HTML escape samples
for (const [desc, escaped] of Object.entries(exportData.utilities.escapeHTML.samples)) {
  csv += `escapeHTML,${exportData.utilities.escapeHTML.description},Escape,"${desc}","${escaped}"\n`;
}
csv += `escapeHTML,,,,,${exportData.utilities.escapeHTML.performance_ms}\n`;

// Add URL/Path samples
exportData.utilities.urlPath.samples.forEach(sample => {
  csv += `urlPath,${exportData.utilities.urlPath.description},Conversion,"${sample.path}","${sample.url}",${sample.roundtrip}\n`;
});
csv += `urlPath,,,,,${exportData.utilities.urlPath.performance_ms}\n`;

writeFileSync(csvPath, csv);
console.log(`✅ CSV exported to: ${csvPath}`);

// Summary
console.log('\n📋 Export Summary');
console.log('================');
console.log(`Total tools tested: ${Object.keys(exportData.utilities.which.samples).length}`);
console.log(`UUIDs generated: ${exportData.utilities.uuidv7.samples.length}`);
console.log(`String widths calculated: ${Object.keys(exportData.utilities.stringWidth.samples).length}`);
console.log(`HTML samples escaped: ${Object.keys(exportData.utilities.escapeHTML.samples).length}`);
console.log(`URL/Path conversions: ${exportData.utilities.urlPath.samples.length}`);

console.log('\n⚡ Performance Summary (all times in ms)');
console.log('==========================================');
for (const [util, data] of Object.entries(exportData.utilities)) {
  console.log(`${util.padEnd(12)}: ${data.performance_ms.toFixed(3)}ms`);
}

console.log('\n✅ Export complete! Check the generated files.');
