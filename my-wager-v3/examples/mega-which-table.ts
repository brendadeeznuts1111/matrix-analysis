#!/usr/bin/env bun
// examples/mega-which-table.ts
// Runs ALL Bun.which() checks live with comprehensive analysis

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

function binCheck(dir: string): { exists: string; tools: string } {
  try {
    const f = Bun.file(dir);
    // Check if directory exists and is accessible
    if (!f.exists()) return { exists: '❌', tools: 'N/A' };

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

async function binCheckAsync(dir: string): Promise<{ exists: string; tools: string }> {
  try {
    const f = Bun.file(dir);
    // Check if directory exists and is accessible
    if (!(await f.exists())) return { exists: '❌', tools: 'N/A' };

    // Sample tools to check for
    const toolChecks = await Promise.all(
      ['eslint', 'tsc', 'bun', 'prettier', 'jest', 'webpack', 'vite'].map(async t => {
        const toolFile = Bun.file(`${dir}/${t}`);
        return (await toolFile.exists()) ? t : null;
      })
    );

    const samples = toolChecks.filter(Boolean);

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
} {
  const originalPath = Bun.env.PATH;

  try {
    if (test.pathEnv !== undefined) {
      Bun.env.PATH = test.pathEnv;
    }

    const result = Bun.which(test.exec, { cwd: test.cwd });

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
      strategy
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

async function runMegaAnalysis() {
  console.log('🔍 Mega Bun.which() Analysis Table');
  console.log('==================================\n');

  // Generate markdown table
  let md = '| # | Exec | CWD | PATH Env | Found | Actual Path | Strategy | Project .bin | .bin Exists | npm .bin | npm Exists | Bin Tools | Notes |\\n';
  md += '|---|------|-----|----------|-------|------------|----------|--------------|-------------|-----------|------------|-----------|-------|\\n';

  const results: Array<{
    test: TestCase;
    result: ReturnType<typeof getTestResult>;
    projectBin: ReturnType<typeof binCheck>;
    npmBin: ReturnType<typeof binCheck>;
  }> = [];

  for (const test of tests) {
    const result = getTestResult(test);
    const projectBin = binCheck(test.cwd + '/.bin');
    const npmBin = binCheck(test.cwd + '/node_modules/.bin');

    results.push({ test, result, projectBin, npmBin });

    const foundIcon = result.found ? '✅' : '❌';
    const pathDisplay = test.pathEnv || '(default)';
    const pathShort = pathDisplay.length > 30 ? pathDisplay.substring(0, 27) + '...' : pathDisplay;
    const actualShort = result.actualPath.length > 40 ? result.actualPath.substring(0, 37) + '...' : result.actualPath;

    md += '| ' + test.num;
    md += ' | ' + test.exec;
    md += ' | ' + test.cwd;
    md += ' | ' + pathShort;
    md += ' | ' + foundIcon;
    md += ' | ' + actualShort;
    md += ' | ' + result.strategy;
    md += ' | ' + test.cwd + '/.bin';
    md += ' | ' + projectBin.exists;
    md += ' | ' + test.cwd + '/node_modules/.bin';
    md += ' | ' + npmBin.exists;
    md += ' | ' + (npmBin.tools || projectBin.tools);
    md += ' | ' + (test.description || '') + ' |\n';
  }

  console.log(md);

  // Analysis summary
  console.log('\n📊 Analysis Summary');
  console.log('==================\n');

  const totalTests = tests.length;
  const foundCount = results.filter(r => r.result.found).length;
  const notFoundCount = totalTests - foundCount;

  console.log('Total tests: ' + totalTests);
  console.log('Found: ' + foundCount + ' ✅');
  console.log('Not found: ' + notFoundCount + ' ❌');
  console.log('Success rate: ' + ((foundCount / totalTests) * 100).toFixed(1) + '%\n');

  // Strategy breakdown
  const strategyCounts = results.reduce((acc, r) => {
    acc[r.result.strategy] = (acc[r.result.strategy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Strategy Breakdown:');
  Object.entries(strategyCounts).forEach(([strategy, count]) => {
    const props = getProps(strategy);
    console.log('  ' + strategy + ': ' + count + ' tests (' + props.pathType + ' - ' + props.priority + ')');
  });

  // Interesting findings
  console.log('\n🔍 Interesting Findings');
  console.log('=====================\n');

  // Find cases where relative paths work
  const relativeWorking = results.filter(r => r.result.strategy === 'relative_path' && r.result.found);
  if (relativeWorking.length > 0) {
    console.log('✅ Relative paths work in ' + relativeWorking.length + ' cases:');
    relativeWorking.forEach(r => {
      console.log('   Test ' + r.test.num + ': ' + r.test.exec + ' in ' + r.test.cwd);
    });
  } else {
    console.log('❌ No relative paths found working (as expected with current Bun behavior)');
  }

  // Homebrew priority
  const homebrewResults = results.filter(r => r.result.strategy === 'homebrew_priority');
  const homebrewFromHomebrew = homebrewResults.filter(r => r.result.actualPath.includes('homebrew'));
  console.log('\n🍺 Homebrew Analysis:');
  console.log('  Tests with Homebrew in PATH: ' + homebrewResults.length);
  console.log('  Actually using Homebrew: ' + homebrewFromHomebrew.length);

  // Project local tools
  const projectResults = results.filter(r => r.result.strategy === 'project_local');
  const projectLocalFound = projectResults.filter(r => r.result.found);
  console.log('\n📦 Project Local Tools:');
  console.log('  Tests with node_modules in PATH: ' + projectResults.length);
  console.log('  Tools found locally: ' + projectLocalFound.length);

  // Security concerns
  const securityTests = results.filter(r => r.test.description?.includes('Security'));
  console.log('\n🔒 Security Tests:');
  securityTests.forEach(r => {
    const risk = r.result.found ? '⚠️ Accessible' : '✅ Blocked';
    console.log('  Test ' + r.test.num + ' (' + r.test.exec + '): ' + risk);
  });

  console.log('\n✅ Mega analysis complete!');
}

// Run the analysis
runMegaAnalysis().catch(console.error);
