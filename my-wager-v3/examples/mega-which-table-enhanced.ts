#!/usr/bin/env bun
// examples/mega-which-table-enhanced.ts
// Enhanced mega table with inspect, streams, ANSI, JSC utilities

// Make this file a module
export {};

interface TestCase {
  num: number;
  exec: string;
  cwd: string;
  pathEnv?: string;
  description?: string;
}

// Comprehensive test cases covering all scenarios
const tests: TestCase[] = [
  // Basic cases
  { num: 1, exec: 'ls', cwd: '/', pathEnv: '/bin:/usr/bin', description: 'Absolute PATH, root cwd' },
  { num: 2, exec: 'ls', cwd: '/tmp', pathEnv: '/bin:/usr/bin', description: 'Absolute PATH, tmp cwd' },
  { num: 3, exec: 'ls', cwd: '/nonexistent', pathEnv: '/bin:/usr/bin', description: 'Absolute PATH, invalid cwd' },

  // Empty PATH cases
  { num: 4, exec: 'ls', cwd: '/', pathEnv: '', description: 'Empty PATH, root cwd' },
  { num: 5, exec: 'ls', cwd: '/tmp', pathEnv: '', description: 'Empty PATH, tmp cwd' },
  { num: 6, exec: 'ls', cwd: '/bin', pathEnv: '', description: 'Empty PATH, bin cwd' },

  // Relative PATH cases
  { num: 7, exec: 'ls', cwd: '/tmp', pathEnv: './', description: 'Relative PATH, current dir' },
  { num: 8, exec: 'ls', cwd: '/tmp', pathEnv: './bin', description: 'Relative PATH, bin subdir' },
  { num: 9, exec: 'ls', cwd: '/tmp', pathEnv: '../usr/bin', description: 'Relative PATH, parent dir' },

  // Mixed PATH cases
  { num: 10, exec: 'ls', cwd: '/tmp', pathEnv: './:/bin:/usr/bin', description: 'Mixed PATH, relative first' },
  { num: 11, exec: 'ls', cwd: '/tmp', pathEnv: '/bin:./:/usr/bin', description: 'Mixed PATH, relative middle' },
  { num: 12, exec: 'ls', cwd: '/tmp', pathEnv: '/bin:/usr/bin:./', description: 'Mixed PATH, relative last' },

  // Project-specific cases (my-wager-v3)
  { num: 13, exec: 'bun', cwd: '/Users/nolarose/my-wager-v3', pathEnv: './node_modules/.bin:/usr/bin', description: 'Project bun, node_modules first' },
  { num: 14, exec: 'bun', cwd: '/Users/nolarose/my-wager-v3', pathEnv: '/usr/bin:./node_modules/.bin', description: 'Project bun, node_modules last' },
  { num: 15, exec: 'eslint', cwd: '/Users/nolarose/my-wager-v3', pathEnv: './node_modules/.bin:/usr/bin', description: 'Project eslint, local first' },
  { num: 16, exec: 'tsc', cwd: '/Users/nolarose/my-wager-v3', pathEnv: './node_modules/.bin:/usr/bin', description: 'Project tsc, local first' },
  { num: 17, exec: 'npm', cwd: '/Users/nolarose/my-wager-v3', pathEnv: './node_modules/.bin:/usr/bin', description: 'Project npm, local first' },

  // Bun-specific cases
  { num: 18, exec: 'bun', cwd: '/Users/nolarose/.bun/bin', pathEnv: './', description: 'Bun in its own bin' },
  { num: 19, exec: 'bun', cwd: '/Users/nolarose', pathEnv: './.bun/bin', description: 'Bun from home, relative path' },
  { num: 20, exec: 'bun', cwd: '/tmp', pathEnv: '/Users/nolarose/.bun/bin', description: 'Bun absolute path' },

  // Homebrew cases
  { num: 21, exec: 'git', cwd: '/tmp', pathEnv: '/opt/homebrew/bin:/usr/bin', description: 'Homebrew git first' },
  { num: 22, exec: 'git', cwd: '/tmp', pathEnv: '/usr/bin:/opt/homebrew/bin', description: 'Homebrew git last' },
  { num: 23, exec: 'node', cwd: '/tmp', pathEnv: '/opt/homebrew/bin:/usr/bin', description: 'Homebrew node first' },

  // Edge cases
  { num: 24, exec: 'nonexistent', cwd: '/', pathEnv: '/bin:/usr/bin', description: 'Non-existent tool' },
  { num: 25, exec: 'ls', cwd: '', pathEnv: '/bin:/usr/bin', description: 'Empty cwd' },
  { num: 26, exec: 'ls', cwd: '/tmp', pathEnv: './nonexistent:/bin', description: 'Non-existent relative dir' },

  // Security cases
  { num: 27, exec: 'ls', cwd: '/tmp', pathEnv: '/bin:/etc:/usr/bin', description: 'Security - /etc exposed' },
  { num: 28, exec: 'cat', cwd: '/tmp', pathEnv: '/bin', description: 'Security - restricted PATH' },
  { num: 29, exec: 'sh', cwd: '/tmp', pathEnv: '/bin:/usr/bin', description: 'Security - shell access' },
];

async function binCheck(dir: string): Promise<{ exists: string; tools: string }> {
  try {
    const f = Bun.file(dir);
    // Check if directory exists and is accessible
    if (!(await f.exists())) return { exists: '❌', tools: 'N/A' };

    // Sample tools to check for
    const samples = ['eslint', 'tsc', 'bun', 'prettier', 'jest', 'webpack', 'vite']
      .map(t => {
        const toolFile = Bun.file(`${dir}/${t}`);
        return toolFile.exists() ? t : null;
      })
      .filter(Boolean);

    return {
      exists: samples.length ? '✅' : '⚠️ (empty)',
      tools: samples.join(', ') || 'none'
    };
  } catch (e) {
    return { exists: '❌', tools: 'Error' };
  }
}

function getTestResult(test: TestCase): {
  found: string | null;
  actualPath: string;
  strategy: string;
  duration_ns: number;
} {
  const originalPath = Bun.env.PATH;
  const start = Bun.nanoseconds();

  try {
    if (test.pathEnv !== undefined) {
      Bun.env.PATH = test.pathEnv;
    }

    const result = Bun.which(test.exec, { cwd: test.cwd });
    const duration = Bun.nanoseconds() - start;

    // Determine strategy
    let strategy = 'unknown';
    if (!test.pathEnv || test.pathEnv === '') {
      strategy = 'empty_path';
    } else if (test.pathEnv.startsWith('./') || test.pathEnv.includes('./')) {
      strategy = 'relative_path';
    } else if (test.pathEnv.includes('/opt/homebrew')) {
      strategy = 'homebrew_priority';
    } else if (test.pathEnv.includes('node_modules')) {
      strategy = 'project_local';
    } else {
      strategy = 'absolute_path';
    }

    return {
      found: result,
      actualPath: result || 'null',
      strategy,
      duration_ns: duration
    };
  } finally {
    Bun.env.PATH = originalPath;
  }
}

function getProps(type: string): Record<string, any> {
  const props: Record<string, any> = {};

  switch (type) {
    case 'empty_path':
      props.pathType = 'Empty';
      props.priority = 'None';
      props.expected = 'null';
      break;
    case 'relative_path':
      props.pathType = 'Relative';
      props.priority = 'cwd-dependent';
      props.expected = 'cwd-relative';
      break;
    case 'homebrew_priority':
      props.pathType = 'Mixed';
      props.priority = 'Homebrew first';
      props.expected = 'homebrew';
      break;
    case 'project_local':
      props.pathType = 'Mixed';
      props.priority = 'Local first';
      props.expected = 'project-local';
      break;
    case 'absolute_path':
      props.pathType = 'Absolute';
      props.priority = 'System';
      props.expected = 'system';
      break;
  }

  return props;
}

async function runEnhancedMegaAnalysis() {
  console.log('🔍 Enhanced Mega Bun.which() Analysis Table');
  console.log('==========================================\n');

  const results: Array<{
    test: TestCase;
    result: ReturnType<typeof getTestResult>;
    projectBin: { exists: string; tools: string };
    npmBin: { exists: string; tools: string };
  }> = [];

  // Collect all results with timing
  console.log('Running tests...');
  const totalStart = Bun.nanoseconds();

  for (const test of tests) {
    const result = getTestResult(test);
    const projectBin = await binCheck(test.cwd + '/.bin');
    const npmBin = await binCheck(test.cwd + '/node_modules/.bin');

    results.push({ test, result, projectBin, npmBin });
  }

  const totalDuration = Bun.nanoseconds() - totalStart;

  // Create enhanced data structure for inspect.table
  const tableData = results.map(r => ({
    '#': r.test.num,
    'Exec': r.test.exec,
    'CWD': r.test.cwd,
    'PATH': r.test.pathEnv || '(default)',
    'Found': r.result.found ? '✅' : '❌',
    'Path': r.result.actualPath,
    'Strategy': r.result.strategy,
    'Duration (ns)': r.result.duration_ns,
    'Duration (ms)': (r.result.duration_ns / 1000000).toFixed(3),
    'Project .bin': r.test.cwd + '/.bin',
    '.bin Exists': r.projectBin.exists,
    'npm .bin': r.test.cwd + '/node_modules/.bin',
    'npm Exists': r.npmBin.exists,
    'Bin Tools': r.npmBin.tools || r.projectBin.tools,
    'Notes': r.test.description || ''
  }));

  // Display using Bun.inspect.table with colors
  console.log('\n📊 Colored Table Output (Bun.inspect.table)');
  console.log('============================================');

  const coloredTable = Bun.inspect.table(tableData, ['#', 'Exec', 'Found', 'Path', 'Strategy', 'Duration (ms)'], { colors: true });
  console.log(coloredTable);

  // Display wrapped version for narrow terminals
  console.log('\n📱 Wrapped Table (80 columns)');
  console.log('=============================');

  const wrappedTable = Bun.wrapAnsi(coloredTable, 80, {
    wordWrap: true,
    trim: true,
    ambiguousIsNarrow: false
  });
  console.log(wrappedTable);

  // Display stripped version for clean export
  console.log('\n📄 Plain Text Table (ANSI stripped)');
  console.log('===================================');

  const plainTable = Bun.stripANSI(coloredTable);
  console.log(plainTable);

  // Analysis summary with enhanced metrics
  console.log('\n📊 Enhanced Analysis Summary');
  console.log('============================\n');

  const totalTests = tests.length;
  const foundCount = results.filter(r => r.result.found).length;
  const notFoundCount = totalTests - foundCount;

  console.log(`Total tests: ${totalTests}`);
  console.log(`Found: ${foundCount} ✅`);
  console.log(`Not found: ${notFoundCount} ❌`);
  console.log(`Success rate: ${((foundCount / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total duration: ${(totalDuration / 1000000).toFixed(3)}ms`);
  console.log(`Avg per test: ${(totalDuration / totalTests / 1000000).toFixed(3)}ms\n`);

  // Performance breakdown by strategy
  const strategyStats = results.reduce((acc, r) => {
    if (!acc[r.result.strategy]) {
      acc[r.result.strategy] = { count: 0, totalDuration: 0, found: 0 };
    }
    acc[r.result.strategy].count++;
    acc[r.result.strategy].totalDuration += r.result.duration_ns;
    if (r.result.found) acc[r.result.strategy].found++;
    return acc;
  }, {} as Record<string, { count: number; totalDuration: number; found: number }>);

  console.log('Strategy Performance Breakdown:');
  Object.entries(strategyStats).forEach(([strategy, stats]) => {
    const props = getProps(strategy);
    const avgDuration = stats.totalDuration / stats.count / 1000000;
    const successRate = (stats.found / stats.count * 100).toFixed(1);
    console.log(`  ${strategy}:`);
    console.log(`    Count: ${stats.count}`);
    console.log(`    Success: ${stats.found}/${stats.count} (${successRate}%)`);
    console.log(`    Avg duration: ${avgDuration.toFixed(3)}ms`);
    console.log(`    Type: ${props.pathType} - ${props.priority}`);
  });

  // Serialize results using JSC
  console.log('\n💾 Data Serialization (JSC)');
  console.log('===========================');

  const { serialize, deserialize, estimateShallowMemoryUsageOf } = await import('bun:jsc');
  const serialized = serialize(results);
  console.log(`Serialized size: ${serialized.byteLength} bytes`);

  // Estimate memory usage
  const memUsage = estimateShallowMemoryUsageOf(results);
  console.log(`Shallow memory usage: ${memUsage} bytes`);

  // Create a custom inspector for results
  console.log('\n🔍 Custom Inspector Output');
  console.log('=========================');

  const customResults = results.slice(0, 3).map(r => ({
    test: {
      num: r.test.num,
      exec: r.test.exec,
      description: r.test.description
    },
    result: {
      found: !!r.result.found,
      strategy: r.result.strategy,
      performance: `${(r.result.duration_ns / 1000000).toFixed(3)}ms`
    }
  }));

  // Add custom inspect method
  (customResults as any)[Symbol.for('nodejs.util.inspect.custom')] = function() {
    return `EnhancedWhichResults(${this.length} items) {
  ${this.map((r: any, i: number) => `  [${i}]: ${r.test.exec} -> ${r.result.found ? r.result.actualPath : 'not found'} (${r.result.performance})`).join('\n  ')}
}`;
  };

  console.log(Bun.inspect(customResults));

  // Export options
  console.log('\n💾 Export Options');
  console.log('=================');

  // CSV export
  const csvHeader = Object.keys(tableData[0]).join(',');
  const csvRows = tableData.map(row =>
    Object.values(row).map(v =>
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(',')
  );
  const csvContent = [csvHeader, ...csvRows].join('\n');

  try {
    await Bun.write('./enhanced-which-results.csv', csvContent);
    console.log('✅ CSV exported to: enhanced-which-results.csv');
  } catch (e) {
    console.log('❌ CSV export failed:', e);
  }

  // JSON export
  try {
    const { serialize } = await import('bun:jsc');
    const jsonContent = serialize({
      metadata: {
        timestamp: new Date().toISOString(),
        totalTests,
        foundCount,
        totalDuration,
        bunVersion: Bun.version
      },
      results: results.map(r => ({
        test: r.test,
        result: r.result,
        bins: {
          project: r.projectBin,
          npm: r.npmBin
        }
      }))
    });
    await Bun.write('./enhanced-which-results.bin', jsonContent);
    console.log('✅ Binary JSON exported to: enhanced-which-results.bin');
  } catch (e) {
    console.log('❌ JSON export failed:', e);
  }

  // Performance comparison with different methods
  console.log('\n⚡ Performance Comparison');
  console.log('=========================');

  // Test Bun.which performance
  const perfStart = Bun.nanoseconds();
  for (let i = 0; i < 1000; i++) {
    Bun.which('ls');
  }
  const whichPerf = Bun.nanoseconds() - perfStart;

  // Test resolveSync performance
  const resolveStart = Bun.nanoseconds();
  for (let i = 0; i < 1000; i++) {
    try {
      Bun.resolveSync('ls', '/bin');
    } catch {
      // Ignore errors
    }
  }
  const resolvePerf = Bun.nanoseconds() - resolveStart;

  console.log(`Bun.which (1000x): ${(whichPerf / 1000000).toFixed(3)}ms`);
  console.log(`Bun.resolveSync (1000x): ${(resolvePerf / 1000000).toFixed(3)}ms`);
  console.log(`Ratio: ${(whichPerf / resolvePerf).toFixed(2)}x`);

  console.log('\n✅ Enhanced mega analysis complete!');
}

// Run the enhanced analysis
runEnhancedMegaAnalysis().catch(console.error);
