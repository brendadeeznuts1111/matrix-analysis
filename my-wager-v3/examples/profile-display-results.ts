#!/usr/bin/env bun
// Simple example: Profiling displayTestResults with jsc.profile
// [TIER-1380-PROFILING-002]

// @ts-ignore - jsc might not be available in all Bun versions
let jsc: any;
try {
  jsc = require('bun').jsc;
} catch {
  console.log('⚠️ jsc profiling not available in this Bun version');
  jsc = null;
}

// Check if jsc is available
if (!jsc) {
  console.log('❌ Cannot run profiling example: jsc not available');
  process.exit(1);
}

// Export to make this file a module
export {};

// Mock the displayTestResults function for demonstration
function displayTestResults(result: any, options: any): void {
  const config = result.config;

  console.log(`
🎯 TIER-1380 SECURE TEST RUN COMPLETE
┌─────────────────────────────────────────┐
│ Context:       ${(options.config || 'local').padEnd(20)} │
│ Status:        ${result.success ? '✅ PASSED' : '❌ FAILED'}         │
│ Duration:      ${result.duration.toFixed(2)}ms           │
│ Config Load:   <1ms (Tier-1380)        │
│ Coverage:      ${result.coverage ? '📊 Generated' : '📭 Disabled'}      │
│ Artifacts:     ${result.artifacts ? '🔒 Sealed' : '📭 None'}          │
└─────────────────────────────────────────┘

📋 CONFIGURATION INHERITANCE:
  • Registry:    ${config._inherited?.registry || 'default'}
  • Timeout:     ${config.timeout || 5000}ms
  • Coverage:    ${config.coverage ? 'enabled' : 'disabled'}
  • Preload:     ${config.preload?.length || 0} security hooks
  • Environment: .env.${options.config || 'local'}

🔒 SECURITY VALIDATIONS:
  ✅ Environment isolation verified
  ✅ No production secrets detected
  ✅ Registry token scope validated
  ✅ Coverage thresholds enforced
  ✅ Artifacts quantum-sealed
`);
}

// Create mock test data
const mockResult = {
  success: true,
  duration: 847,
  coverage: {
    summary: {
      lines: 0.92,
      functions: 0.89,
      statements: 0.94,
      branches: 0.87
    }
  },
  artifacts: { sealDir: './artifacts/seal-123' },
  config: {
    _inherited: { registry: 'npm.pkg.github.com' },
    timeout: 5000,
    coverage: true,
    preload: ['security-hook-1', 'security-hook-2', 'audit-logger']
  }
};

const mockOptions = {
  config: 'ci',
  files: ['test/**/*.test.ts'],
  filter: 'smoke',
  updateSnapshots: false
};

// Example 1: Basic profiling
console.log('=== Example 1: Basic Profiling ===\n');
const basicProfile = jsc.profile(displayTestResults, 1000, mockResult, mockOptions);

// Extract and display key metrics
const tierBreakdown = basicProfile.bytecodes.split('\n')[0];
console.log('JIT Tier Breakdown:');
console.log(tierBreakdown);

// Example 2: High-resolution profiling
console.log('\n=== Example 2: High-Resolution Profiling ===\n');
const highResProfile = jsc.profile(displayTestResults, 100, mockResult, mockOptions);

// Parse FTL optimization percentage
const ftlMatch = highResProfile.bytecodes.match(/FTL: \d+ \(([\d.]+)%\)/);
const ftlPercentage = ftlMatch ? ftlMatch[1] : '0';

console.log(`FTL Optimization: ${ftlPercentage}%`);
if (parseFloat(ftlPercentage) > 10) {
  console.log('✅ Excellent optimization - hot paths in FTL');
} else {
  console.log('⚠️ Low FTL usage - consider warming up functions');
}

// Example 3: Compare multiple runs
console.log('\n=== Example 3: Performance Comparison ===\n');
const profiles = [];

for (let i = 0; i < 5; i++) {
  const profile = jsc.profile(displayTestResults, 500, mockResult, mockOptions);
  profiles.push(profile);

  const dfgMatch = profile.bytecodes.match(/DFG: \d+ \(([\d.]+)%\)/);
  const dfgPercentage = dfgMatch ? dfgMatch[1] : '0';

  console.log(`Run ${i + 1}: DFG ${dfgPercentage}%`);
}

// Calculate average DFG usage
const avgDfg = profiles.reduce((sum, p) => {
  const match = p.bytecodes.match(/DFG: \d+ \(([\d.]+)%\)/);
  return sum + parseFloat(match ? match[1] : '0');
}, 0) / profiles.length;

console.log(`\n📊 Average DFG usage: ${avgDfg.toFixed(2)}%`);

// Example 4: Profile with different data sizes
console.log('\n=== Example 4: Scaling Test ===\n');

const smallResult = { ...mockResult, coverage: null };
const largeResult = {
  ...mockResult,
  coverage: {
    summary: {
      lines: 0.95,
      functions: 0.93,
      statements: 0.96,
      branches: 0.91
    },
    files: Array.from({ length: 1000 }, (_, i) => ({
      path: `test/file-${i}.ts`,
      lines: 100,
      covered: 95
    }))
  }
};

console.log('Small dataset:');
const smallProfile = jsc.profile(displayTestResults, 500, smallResult, mockOptions);
console.log(smallProfile.bytecodes.split('\n').slice(0, 3).join('\n'));

console.log('\nLarge dataset:');
const largeProfile = jsc.profile(displayTestResults, 500, largeResult, mockOptions);
console.log(largeProfile.bytecodes.split('\n').slice(0, 3).join('\n'));

// Save profiles for analysis
await Bun.write(
  './artifacts/display-profile-small.json',
  JSON.stringify(smallProfile, null, 2)
);

await Bun.write(
  './artifacts/display-profile-large.json',
  JSON.stringify(largeProfile, null, 2)
);

console.log('\n✅ Profiles saved to artifacts/');

// Example 5: Identify bottlenecks
console.log('\n=== Example 5: Bottleneck Analysis ===\n');

// Find the hottest bytecode
const bytecodeLines = highResProfile.bytecodes.split('\n');
const hotBytecodes = bytecodeLines
  .filter((line: string) => line.includes("'#<nil>:") || line.includes("'displayTestResults"))
  .slice(0, 5);

if (hotBytecodes.length > 0) {
  console.log('🔥 Hottest bytecodes:');
  hotBytecodes.forEach((line: string) => console.log(`  ${line.trim()}`));
}

// Check interpreter usage
const llintMatch = highResProfile.bytecodes.match(/LLInt: \d+ \(([\d.]+)%\)/);
const llintPercentage = llintMatch ? llintMatch[1] : '0';

if (parseFloat(llintPercentage) > 5) {
  console.warn(`\n⚠️ High interpreter usage: ${llintPercentage}%`);
  console.log('Recommendation: Run functions multiple times to warm up JIT');
} else {
  console.log(`\n✅ Low interpreter usage: ${llintPercentage}%`);
}

console.log('\n🎯 Profiling complete!');
