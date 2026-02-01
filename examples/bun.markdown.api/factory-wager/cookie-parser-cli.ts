#!/usr/bin/env bun
/**
 * Cookie Parser CLI - Production Cookie Parsing Tool
 * Features: parse, benchmark, test, and validation
 */

// CookieParser class definition
class CookieParser {
  static parse(header: string): Map<string, string> {
    const pairs = decodeURIComponent(header).split(";").map(p => p.trim().split("="));
    const map = new Map();
    for (const pair of pairs) {
      if (pair.length >= 2) {
        const key = pair[0].trim();
        const val = decodeURIComponent(pair.slice(1).join("=").trim().replace(/^"|"$/g, ""));
        map.set(key, val);
      }
    }
    return map;
  }
}

interface CLIOptions {
  parse?: string;
  benchmark?: boolean;
  test?: boolean;
  iterations?: number;
  verbose?: boolean;
}

class CookieParserCLI {
  static parseCookie(cookieString: string, verbose: boolean = false): void {
    console.log(`🍪 Parsing Cookie: ${cookieString}`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    const result = CookieParser.parse(cookieString);
    
    if (verbose) {
      console.log(`📊 Raw Result:`, Array.from(result));
      console.log(`📋 Map Size: ${result.size} entries`);
    }
    
    console.log(`🎯 Parsed Cookies:`);
    for (const [key, value] of result) {
      console.log(`  ${key}: ${value}`);
    }
    
    console.log(`\n✅ Parsing Complete!`);
  }
  
  static runBenchmark(iterations: number = 100000): void {
    console.log(`⚡ Cookie Parser Benchmark`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    const testCases = [
      { name: "Simple", cookie: "session=abc123;user=nolarose;theme=dark" },
      { name: "URL-encoded", cookie: "session=abc%20123;user=nol%20arose;theme=dark%20mode" },
      { name: "Quoted", cookie: 'user="nolarose";theme="dark mode";session="abc123"' },
      { name: "Complex", cookie: "data=a=b&c=d;url=https://example.com?param=value&other=test" },
      { name: "Mixed", cookie: "session=abc123;user=nol%20arose;theme=\"dark mode\";pool=5" }
    ];
    
    console.log(`\n📊 Benchmark Results (${iterations.toLocaleString()} iterations each):`);
    console.log(`| Test Case | Time (ms) | μs/op | Throughput |`);
    console.log(`|-----------|-----------|--------|------------|`);
    
    for (const testCase of testCases) {
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        CookieParser.parse(testCase.cookie);
      }
      
      const time = performance.now() - start;
      const microsPerOp = time / iterations * 1000;
      const throughput = Math.round(iterations / (time / 1000));
      
      console.log(`| ${testCase.name.padEnd(9)} | ${time.toFixed(2).padStart(9)} | ${microsPerOp.toFixed(2).padStart(6)} | ${throughput.toLocaleString().padStart(10)} |`);
    }
    
    console.log(`\n🎯 Benchmark Complete!`);
  }
  
  static runTests(): void {
    console.log(`🧪 Cookie Parser Test Suite`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    const tests = [
      { input: 'a=1;b%3D2', expected: [['a', '1'], ['b', '2']] },
      { input: 'a=;b=1;;', expected: [['a', ''], ['b', '1']] },
      { input: 'user="nolarose"', expected: [['user', 'nolarose']] },
      { input: 'path=%2Fhome;val=%22quoted%22', expected: [['path', '/home'], ['val', 'quoted']] },
      { input: 'empty=;missing=;valid=test', expected: [['empty', ''], ['missing', ''], ['valid', 'test']] },
      { input: 'complex=a=b&c=d;simple=1', expected: [['complex', 'a=b&c=d'], ['simple', '1']] }
    ];
    
    let passed = 0;
    let failed = 0;
    
    console.log(`\n📋 Running ${tests.length} tests...\n`);
    
    tests.forEach((test, index) => {
      const actual = Array.from(CookieParser.parse(test.input));
      const success = JSON.stringify(actual) === JSON.stringify(test.expected);
      
      if (success) {
        console.log(`✅ Test ${index + 1}: PASS`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1}: FAIL`);
        console.log(`   Input: ${test.input}`);
        console.log(`   Expected: ${JSON.stringify(test.expected)}`);
        console.log(`   Got: ${JSON.stringify(actual)}`);
        failed++;
      }
    });
    
    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${passed}/${tests.length}`);
    console.log(`   Failed: ${failed}/${tests.length}`);
    console.log(`   Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log(`\n🎉 All tests passed! Cookie parser is production ready.`);
    } else {
      console.log(`\n⚠️  ${failed} tests failed. Review the output above.`);
    }
  }
  
  static showHelp(): void {
    console.log(`🍪 Cookie Parser CLI - Production Cookie Parsing Tool`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    console.log(``);
    console.log(`📋 Usage:`);
    console.log(`   bun cookie-parser-cli.ts --parse "<cookie-string>"`);
    console.log(`   bun cookie-parser-cli.ts --benchmark [--iterations N]`);
    console.log(`   bun cookie-parser-cli.ts --test`);
    console.log(`   bun cookie-parser-cli.ts --help`);
    console.log(``);
    console.log(`🔧 Options:`);
    console.log(`   --parse <string>     Parse a cookie string`);
    console.log(`   --benchmark          Run performance benchmark`);
    console.log(`   --iterations <n>     Number of iterations for benchmark (default: 100000)`);
    console.log(`   --test               Run test suite`);
    console.log(`   --verbose            Show detailed output`);
    console.log(`   --help               Show this help message`);
    console.log(``);
    console.log(`📊 Examples:`);
    console.log(`   bun cookie-parser-cli.ts --parse "session=abc123;user=nolarose"`);
    console.log(`   bun cookie-parser-cli.ts --parse "session=abc%20123;user=nol%20arose" --verbose`);
    console.log(`   bun cookie-parser-cli.ts --benchmark --iterations 50000`);
    console.log(`   bun cookie-parser-cli.ts --test`);
    console.log(``);
    console.log(`🚀 Features:`);
    console.log(`   • URL decoding support`);
    console.log(`   • Quote stripping`);
    console.log(`   • Empty value handling`);
    console.log(`   • Complex value parsing`);
    console.log(`   • Performance benchmarking`);
    console.log(`   • Comprehensive test suite`);
  }
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--parse':
        options.parse = args[++i];
        break;
      case '--benchmark':
        options.benchmark = true;
        break;
      case '--iterations':
        options.iterations = parseInt(args[++i]);
        break;
      case '--test':
        options.test = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        CookieParserCLI.showHelp();
        process.exit(0);
        break;
      default:
        console.error(`❌ Unknown option: ${arg}`);
        console.error(`Use --help for available options`);
        process.exit(1);
    }
  }
  
  return options;
}

function main() {
  const options = parseArgs();
  
  if (options.parse) {
    CookieParserCLI.parseCookie(options.parse, options.verbose);
  } else if (options.benchmark) {
    CookieParserCLI.runBenchmark(options.iterations);
  } else if (options.test) {
    CookieParserCLI.runTests();
  } else {
    console.error(`❌ No action specified. Use --help for available options.`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { CookieParserCLI };
