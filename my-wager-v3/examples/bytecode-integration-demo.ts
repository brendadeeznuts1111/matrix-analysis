#!/usr/bin/env bun
// Bytecode Profiling Integration Demo
// Shows how bytecode profiling is integrated into the Tier-1380 Test Runner

import { SecureTestRunner } from '../packages/test/secure-test-runner-enhanced';
import { bytecodeProfiler } from '../packages/test/bytecode-profiler';

async function demo() {
  console.log('🔥 Bytecode Profiling Integration Demo');
  console.log('=====================================\n');

  // Create test runner
  const runner = await SecureTestRunner.create('local', './bunfig.toml');

  // 1. Profile config loading
  console.log('1️⃣ Profiling config loading...');
  const configMetrics = runner.profileConfigLoading();
  if (configMetrics) {
    console.log(`   Config load optimization: ${configMetrics.optimizationScore}/100`);
  }

  // 2. Run tests with bytecode profiling
  console.log('\n2️⃣ Running tests with bytecode profiling...');
  const result = await runner.runWithSecurity({
    files: ['examples/**/*.test.ts'] // Example test files
  });

  // 3. Display bytecode metrics from results
  if (result.bytecodeMetrics) {
    console.log('\n3️⃣ Bytecode Analysis Results:');
    console.log(`   Optimization Score: ${result.bytecodeMetrics.optimizationScore}/100`);
    
    // Check Tier-1380 compliance
    if (result.bytecodeMetrics.tierBreakdown.llint < 5 && 
        result.bytecodeMetrics.optimizationScore > 80) {
      console.log('   ✅ Meets Tier-1380 performance targets');
    } else {
      console.log('   ⚠️ Below Tier-1380 performance targets');
    }

    // Show recommendations
    if (result.bytecodeMetrics.recommendations.length > 0) {
      console.log('\n💡 Performance Recommendations:');
      result.bytecodeMetrics.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
  }

  // 4. Compare multiple runs
  console.log('\n4️⃣ Running multiple tests for comparison...');
  
  for (let i = 0; i < 3; i++) {
    await runner.runWithSecurity({
      files: ['examples/**/*.test.ts']
    });
    console.log(`   Run ${i + 1} complete`);
  }

  // Show comparison
  bytecodeProfiler.compareMetrics('test-run-local');

  console.log('\n✅ Demo complete! Check artifacts/ for detailed bytecode profiles.');
}

// Run demo
if (import.meta.main) {
  demo().catch(console.error);
}
