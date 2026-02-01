#!/usr/bin/env bun
/**
 * Unicode Smoke Test - CJK + Emoji + ZWJ Alignment Verification
 * Pre-commit hook for FactoryWager Unicode Governance v4.3
 */

interface UnicodeTestCase {
  str: string;
  expectedWidth: number;
  description: string;
}

const testCases: UnicodeTestCase[] = [
  {
    str: "中文测试文本🇨🇳🔥",
    expectedWidth: 16,          // 5×2 + 2×2 + 2 (corrected)
    description: "Chinese text with flag and emoji"
  },
  {
    str: "FactoryWager v1.3.8",
    expectedWidth: 19,
    description: "English text with version"
  },
  {
    str: "👨‍👩‍👧‍👦 family emoji ZWJ",
    expectedWidth: 19,
    description: "Family emoji with ZWJ sequence"
  },
  {
    str: "こんにちは世界",
    expectedWidth: 14,
    description: "Japanese Hiragana text"
  },
  {
    str: "가나다라마바사",
    expectedWidth: 14,
    description: "Korean Hangul text"
  },
  {
    str: "🇺🇸🇨🇳🇯🇵🇰🇷",
    expectedWidth: 8,
    description: "Multiple flag sequences"
  },
  {
    str: "Mixed 中文 🇺🇸 Emoji 🔥‍🔥‍",
    expectedWidth: 22,
    description: "Mixed content with CJK and emoji"
  },
  {
    str: "ＦＵＬＬ－ＷＩＤＴＨ",
    expectedWidth: 20,
    description: "Full-width Latin characters"
  },
  {
    str: "🔥‍🔥‍🔥‍🔥‍",
    expectedWidth: 2,
    description: "Multiple ZWJ emoji sequences"
  },
  {
    str: "한국어🇰🇷日本語🇯🇵中文🇨🇳",
    expectedWidth: 22,
    description: "Mixed CJK with flags"
  }
];

async function runUnicodeSmokeTest(): Promise<void> {
  console.log("🔍 Unicode Smoke Test - CJK + Emoji + ZWJ");
  console.log("FactoryWager Governance v4.3 Pre-commit Validation");
  console.log("=" .repeat(60));

  let failures = 0;
  let passed = 0;
  const results: Array<{
    str: string;
    actual: number;
    expected: number;
    status: 'PASS' | 'FAIL';
    description: string;
  }> = [];

  console.log("Running Unicode width verification tests...\n");

  for (const { str, expectedWidth, description } of testCases) {
    const actualWidth = Bun.stringWidth(str);
    const status = actualWidth === expectedWidth ? 'PASS' : 'FAIL';

    results.push({
      str,
      actual: actualWidth,
      expected: expectedWidth,
      status,
      description
    });

    if (status === 'PASS') {
      console.log(`✅ PASS: "${str}"`);
      console.log(`   Width: ${actualWidth} (${description})`);
      passed++;
    } else {
      console.error(`❌ FAIL: "${str}"`);
      console.error(`   Actual: ${actualWidth}, Expected: ${expectedWidth} (${description})`);
      failures++;
    }
    console.log("");
  }

  // Summary
  console.log("=" .repeat(60));
  console.log(`📊 Test Results Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failures}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failures)) * 100).toFixed(1)}%`);

  if (failures > 0) {
    console.log("\n🚨 Unicode Smoke Test FAILED!");
    console.error("Please check Unicode rendering implementation before committing.");
    console.error("\nFailed test cases:");
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.error(`   • "${r.str}" → ${r.actual} (expected ${r.expected})`);
      });
    process.exit(1);
  }

  console.log("\n✅ Unicode Smoke Test PASSED!");
  console.log("🛡️ CJK + emoji + ZWJ alignment verified");
  console.log("🚀 Pre-commit validation successful - commit approved");

  // Additional governance checks
  console.log("\n🔍 Additional Governance Checks:");

  // Check if bun.yaml exists and has Unicode governance config
  try {
    const configContent = await Bun.file("./bun.yaml").text();
    const hasColumnOverride = configContent.includes("column-width-override");
    const hasUnicodePolicy = configContent.includes("unicode-rendering-policy");

    console.log(`   📋 bun.yaml exists: ✅`);
    console.log(`   🎛️ Column width override: ${hasColumnOverride ? '✅' : '⚠️  Not found'}`);
    console.log(`   🌍 Unicode rendering policy: ${hasUnicodePolicy ? '✅' : '⚠️  Not found'}`);

    if (!hasColumnOverride && !hasUnicodePolicy) {
      console.log("   ⚠️  Warning: No Unicode governance configuration found in bun.yaml");
    }
  } catch (error) {
    console.log(`   ⚠️  bun.yaml not found or unreadable: ${error}`);
  }

  // Check if Unicode table renderer exists
  try {
    await Bun.file("./.factory-wager/tabular/unicode-table-v43.ts").text();
    console.log(`   📊 Unicode table renderer v4.3: ✅`);
  } catch (error) {
    console.log(`   ⚠️  Unicode table renderer v4.3 not found: ${error}`);
  }

  console.log("\n🎯 All governance checks completed successfully!");
  process.exit(0);
}

// Performance benchmark
function runPerformanceBenchmark(): void {
  console.log("⚡ Unicode Performance Benchmark");
  console.log("=" .repeat(40));

  const testString = "中文测试🇺🇸🔥‍🔥‍FactoryWager v1.3.8";
  const iterations = 10000;

  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    Bun.stringWidth(testString);
  }

  const duration = performance.now() - start;
  const opsPerSec = (iterations / duration * 1000).toFixed(0);

  console.log(`📏 Test string: "${testString}"`);
  console.log(`📏 Width: ${Bun.stringWidth(testString)} cells`);
  console.log(`⚡ ${iterations} iterations in ${duration.toFixed(2)}ms`);
  console.log(`🚀 Performance: ${opsPerSec} ops/sec`);
  console.log(`✅ Performance benchmark completed`);
}

// CLI execution
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--benchmark') || args.includes('-b')) {
    runPerformanceBenchmark();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Unicode Smoke Test - FactoryWager Governance v4.3

USAGE:
  bun run unicode-smoke-test.ts [options]

OPTIONS:
  --benchmark, -b    Run performance benchmark
  --help, -h         Show this help

DESCRIPTION:
  Validates Unicode width calculations for CJK, emoji, and ZWJ sequences.
  Ensures FactoryWager Unicode Governance compliance before commits.

EXIT CODES:
  0  All tests passed
  1  One or more tests failed
    `);
  } else {
    runUnicodeSmokeTest();
  }
}

export { runUnicodeSmokeTest, runPerformanceBenchmark };
