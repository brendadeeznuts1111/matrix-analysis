#!/usr/bin/env bun
/**
 * FactoryWager URL Parameter Parser - Performance Test Suite
 * Comprehensive testing of URL parameter parsing with performance benchmarks
 */

import { URLParameterParser } from './factory-wager/url-parser.js';

interface TestSuite {
  name: string;
  input: string;
  expected: Map<string, string> | [string, string][] | string;
  description: string;
}

class PerformanceBenchmark {
  static runBenchmark(name: string, testFn: () => void, iterations: number = 1000): void {
    console.log(`\n🚀 ${name} Performance Test`);
    console.log(`════════════════════════════════════════════════════════════════════════════`);
    
    const start = Bun.nanoseconds();
    
    for (let i = 0; i < iterations; i++) {
      testFn();
    }
    
    const end = Bun.nanoseconds();
    const duration = (end - start) / 1_000_000;
    
    console.log(`   Iterations: ${iterations.toLocaleString()}`);
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Rate: ${(iterations / duration * 1000).toFixed(0)} ops/sec`);
  }
}

class TestRunner {
  private tests: TestSuite[] = [
    {
      name: "Basic URL encoding",
      input: "a=1;b%3D2",
      expected: [["a", "1"], ["b", "2"]],
      description: "Handles URL-encoded equals sign"
    },
    {
      name: "Empty values",
      input: "a=;b=1;;",
      expected: [["a", ""], ["b", "1"]],
      description: "Filters out empty entries"
    },
    {
      name: "Quoted values",
      input: 'user="nolarose"',
      expected: new Map([["user", "nolarose"]]),
      description: "Removes surrounding quotes"
    },
    {
      name: "Complex URL with equals",
      input: "url=https://example.com?param=value&other=test",
      expected: new Map([["url", "https://example.com?param=value&other=test"]]),
      description: "Handles values containing equals signs"
    },
    {
      name: "Multiple parameters",
      input: "name=John;age=30;city=New York",
      expected: [["name", "John"], ["age", "30"], ["city", "New York"]],
      description: "Multiple key-value pairs"
    },
    {
      name: "URL encoded quotes",
      input: 'message=%22Hello%20World%22',
      expected: new Map([["message", '"Hello World"']]),
      description: "Handles URL-encoded quotes"
    },
    {
      name: "Mixed encoding",
      input: "name=John%20Doe;age=30;city=New%20York",
      expected: [["name", "John Doe"], ["age", "30"], ["city", "New York"]],
      description: "Handles URL-encoded spaces"
    }
  ];

  runAllTests(): void {
    console.log(`🧪 URL Parameter Parser Test Suite`);
    console.log(`════════════════════════════════════════════════════════════════════════`);
    
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      console.log(`\n📊 ${test.name}`);
      console.log(`   Input: ${test.input}`);
      console.log   Description: ${test.description}`);
      
      try {
        const result = URLParameterParser.parseToMap(test.input);
        
        // Convert expected to comparable format
        let expectedComparable;
        if (test.expected instanceof Map) {
          expectedComparable = [...test.expected];
        } else if (Array.isArray(test.expected)) {
          expectedComparable = test.expected;
        } else {
          expectedComparable = test.expected;
        }
        
        const actualComparable = [...result];
        
        const success = JSON.stringify(actualComparable) === JSON.stringify(expectedComparable);
        
        if (success) {
          console.log(`   ✅ PASS: ${JSON.stringify(actualComparable)}`);
          passed++;
        } else {
          console.log(`   ❌ FAIL: Expected ${JSON.stringify(expectedComparable)}, got ${JSON.stringify(actualComparable)}`);
          failed++;
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${(error as Error).message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${passed}/${this.tests.length}`);
    console.log(`   Failed: ${failed}/${this.tests.length}`);
    console.log(`   Success Rate: ${((passed / this.tests.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log(`\n⚠️  ${failed} tests failed. Review the output above for details.`);
    }
  }

  runPerformanceTests(): void {
    console.log(`\n🚀 Performance Benchmarks`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    // Test 1: Basic parsing
    PerformanceBenchmark.runBenchmark(
      "Basic URL Parameter Parsing",
      () => {
        const h = "a=1;b%3D2";
        URLParameterParser.parseToMap(h);
      },
      10000
    );
    
    // Test 2: Complex parsing
    PerformanceBenchmark.runBenchmark(
      "Complex URL Parameter Parsing",
      () => {
        const h = "name=John%20Doe;age=30;city=New%20York;url=https://example.com?param=value&other=test";
        URLParameterParser.parseToMap(h);
      },
      5000
    );
    
    // Test 3: Array parsing
    PerformanceBenchmark.runBenchmark(
      "Array Output Parsing",
      () => {
        const h = "a=1;b=2;c=3";
        URLParameterParser.parseToArray(h);
      },
      10000
    );
    
    // Test 4: Regex parsing
    PerformanceBenchmark.runBenchmark(
      "Regex-based Parsing",
      () => {
        const h = "a=1;b=2;c=3";
        URLParameterParser.parseWithRegex(h);
      },
      5000
    );
  }
}

// Performance comparison with the user's test cases
function runUserTestCases() {
  console.log(`\n🔧 User Test Cases Comparison`);
  console.log(`════════════════════════════════════════════════════════════════════════════════`);
  
  const tests = [
    {h: "a=1;b%3D2", name: "demo"},
    {h: "a=1;;b=2", name: "malformed"}, 
    {h: 'user="nolarose"', name: "quoted"}
  ];
  
  ["demo", "malformed", "quoted"].forEach((name, i) => {
    const h = tests[i].h;
    const start = performance.now();
    
    // Run 1000 iterations
    for (let j = 0; j < 1e3; j++) {
      const c = decodeURIComponent(h);
      const m = new Map(c.split(";").map(p => p.trim().split("=")));
    }
    
    const duration = (performance.now() - start) / 1e3;
    console.log(`${name}: ${duration.toFixed(2)}ms/1k`);
  });
}

if (import.meta.main) {
  const runner = new TestRunner();
  
  // Run all tests
  runner.runAllTests();
  
  // Run performance benchmarks
  runner.runPerformanceTests();
  
  // Run user's test cases for comparison
  runUserTestCases();
  
  console.log(`\n🎉 All tests completed!`);
}

export { TestRunner, PerformanceBenchmark, URLParameterParser };
