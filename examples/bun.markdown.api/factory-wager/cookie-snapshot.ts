#!/usr/bin/env bun
/**
 * FactoryWager Cookie Compression & Snapshot System
 * Demonstrates cookie map compression and serialization
 */

class CookieSnapshot {
  static serializeCookieMap(cookieMap: Map<string, string>): string {
    return JSON.stringify([...cookieMap]);
  }
  
  static deserializeCookieMap(serialized: string): Map<string, string> {
    return new Map(JSON.parse(serialized));
  }
  
  static compressCookieMap(cookieMap: Map<string, string>): Uint8Array {
    const serialized = this.serializeCookieMap(cookieMap);
    return Bun.gzipSync(serialized);
  }
  
  static decompressCookieMap(compressed: Uint8Array): Map<string, string> {
    const decompressed = Bun.gunzipSync(compressed);
    return this.deserializeCookieMap(decompressed.toString());
  }
  
  static analyzeCompression(cookieMap: Map<string, string>) {
    const serialized = this.serializeCookieMap(cookieMap);
    const compressed = this.compressCookieMap(cookieMap);
    
    const originalSize = serialized.length;
    const compressedSize = compressed.byteLength;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    return {
      original: originalSize,
      compressed: compressedSize,
      ratio: compressionRatio,
      savings: originalSize - compressedSize
    };
  }
}

class CookieSnapshotBenchmark {
  static runCompressionTests() {
    console.log(`🍪 Cookie Compression & Snapshot System`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    // Test 1: Small cookie map
    console.log(`\n📊 Test 1: Small Cookie Map`);
    const smallMap = new Map([
      ['session', 'abc123'],
      ['user', 'nolarose']
    ]);
    
    const smallAnalysis = CookieSnapshot.analyzeCompression(smallMap);
    console.log(`Original: ${smallAnalysis.original} B`);
    console.log(`Compressed: ${smallAnalysis.compressed} B`);
    console.log(`Ratio: ${smallAnalysis.ratio}%`);
    console.log(`Savings: ${smallAnalysis.savings} B`);
    
    // Test 2: Medium cookie map
    console.log(`\n📊 Test 2: Medium Cookie Map`);
    const mediumMap = new Map([
      ['session', 'abc123'],
      ['user', 'nolarose'],
      ['pool', '5'],
      ['max-age', '3600'],
      ['path', '/']
    ]);
    
    const mediumAnalysis = CookieSnapshot.analyzeCompression(mediumMap);
    console.log(`Original: ${mediumAnalysis.original} B`);
    console.log(`Compressed: ${mediumAnalysis.compressed} B`);
    console.log(`Ratio: ${mediumAnalysis.ratio}%`);
    console.log(`Savings: ${mediumAnalysis.savings} B`);
    
    // Test 3: Large cookie map
    console.log(`\n📊 Test 3: Large Cookie Map`);
    const largeMap = new Map([
      ['session', 'abc123'],
      ['user', 'nolarose'],
      ['pool', '5'],
      ['max-age', '3600'],
      ['path', '/'],
      ['secure', 'true'],
      ['httponly', 'true'],
      ['samesite', 'strict'],
      ['domain', '.example.com'],
      ['expires', 'Wed, 09 Jun 2021 10:18:14 GMT']
    ]);
    
    const largeAnalysis = CookieSnapshot.analyzeCompression(largeMap);
    console.log(`Original: ${largeAnalysis.original} B`);
    console.log(`Compressed: ${largeAnalysis.compressed} B`);
    console.log(`Ratio: ${largeAnalysis.ratio}%`);
    console.log(`Savings: ${largeAnalysis.savings} B`);
    
    // Test 4: Very large cookie map (20 cookies)
    console.log(`\n📊 Test 4: Very Large Cookie Map (20 cookies)`);
    const veryLargeMap = new Map();
    for (let i = 0; i < 20; i++) {
      veryLargeMap.set(`cookie${i}`, `value${i}_with_some_longer_content`);
    }
    
    const veryLargeAnalysis = CookieSnapshot.analyzeCompression(veryLargeMap);
    console.log(`Original: ${veryLargeAnalysis.original} B`);
    console.log(`Compressed: ${veryLargeAnalysis.compressed} B`);
    console.log(`Ratio: ${veryLargeAnalysis.ratio}%`);
    console.log(`Savings: ${veryLargeAnalysis.savings} B`);
  }
  
  static demonstrateSnapshotWorkflow() {
    console.log(`\n🔄 Cookie Snapshot Workflow`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    // Create original cookie map
    const originalMap = new Map([
      ['session', 'abc123'],
      ['user', 'nolarose'],
      ['pool', '5'],
      ['max-age', '3600'],
      ['path', '/'],
      ['secure', 'true'],
      ['httponly', 'true']
    ]);
    
    console.log(`\n📋 Original Cookie Map:`);
    console.log(`Size: ${originalMap.size} cookies`);
    console.log(`Content: ${JSON.stringify([...originalMap])}`);
    
    // Create snapshot
    console.log(`\n📸 Creating Snapshot...`);
    const snapshot = CookieSnapshot.compressCookieMap(originalMap);
    console.log(`Snapshot Size: ${snapshot.byteLength} B`);
    
    // Restore from snapshot
    console.log(`\n🔄 Restoring from Snapshot...`);
    const restoredMap = CookieSnapshot.decompressCookieMap(snapshot);
    console.log(`Restored Size: ${restoredMap.size} cookies`);
    console.log(`Restored Content: ${JSON.stringify([...restoredMap])}`);
    
    // Verify integrity
    console.log(`\n✅ Integrity Check:`);
    const originalJSON = CookieSnapshot.serializeCookieMap(originalMap);
    const restoredJSON = CookieSnapshot.serializeCookieMap(restoredMap);
    const integrity = originalJSON === restoredJSON;
    console.log(`Integrity: ${integrity ? 'PASS' : 'FAIL'}`);
    
    if (!integrity) {
      console.log(`Original: ${originalJSON}`);
      console.log(`Restored: ${restoredJSON}`);
    }
  }
  
  static performanceBenchmark() {
    console.log(`\n⚡ Performance Benchmark`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    // Create test data
    const testMap = new Map();
    for (let i = 0; i < 100; i++) {
      testMap.set(`cookie${i}`, `value${i}_with_content`);
    }
    
    console.log(`\n📊 Benchmark Data: 100 cookies`);
    
    // Serialization benchmark
    console.time("serialization");
    for (let i = 0; i < 1000; i++) {
      CookieSnapshot.serializeCookieMap(testMap);
    }
    console.timeEnd("serialization");
    
    // Compression benchmark
    console.time("compression");
    for (let i = 0; i < 1000; i++) {
      CookieSnapshot.compressCookieMap(testMap);
    }
    console.timeEnd("compression");
    
    // Decompression benchmark
    const compressed = CookieSnapshot.compressCookieMap(testMap);
    console.time("decompression");
    for (let i = 0; i < 1000; i++) {
      CookieSnapshot.decompressCookieMap(compressed);
    }
    console.timeEnd("decompression");
    
    // Full workflow benchmark
    console.time("full_workflow");
    for (let i = 0; i < 1000; i++) {
      const snap = CookieSnapshot.compressCookieMap(testMap);
      CookieSnapshot.decompressCookieMap(snap);
    }
    console.timeEnd("full_workflow");
  }
  
  static generateRecommendations() {
    console.log(`\n🎯 Compression Recommendations`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    console.log(`\n✅ When to Use Compression:`);
    console.log(`• Cookie sets with >5 cookies`);
    console.log(`• Long cookie values (>50 chars)`);
    console.log(`• Session storage with many cookies`);
    console.log(`• Network transmission of cookie data`);
    
    console.log(`\n⚠️ When to Skip Compression:`);
    console.log(`• Small cookie sets (<3 cookies)`);
    console.log(`• Short cookie values (<20 chars)`);
    console.log(`• In-memory operations`);
    console.log(`• Real-time cookie parsing`);
    
    console.log(`\n🚀 Production Tips:`);
    console.log(`• Cache compressed snapshots`);
    console.log(`• Use compression for cookie persistence`);
    console.log(`• Implement integrity checks`);
    console.log(`• Consider compression level trade-offs`);
    
    console.log(`\n💾 Storage Recommendations:`);
    console.log(`• Use compression for session storage`);
    console.log(`• Store compressed snapshots in Redis`);
    console.log(`• Implement expiration policies`);
    console.log(`• Monitor compression ratios`);
  }
}

if (import.meta.main) {
  CookieSnapshotBenchmark.runCompressionTests();
  CookieSnapshotBenchmark.demonstrateSnapshotWorkflow();
  CookieSnapshotBenchmark.performanceBenchmark();
  CookieSnapshotBenchmark.generateRecommendations();
  
  console.log(`\n🎉 Cookie Compression & Snapshot System Complete!`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
}

export { CookieSnapshot, CookieSnapshotBenchmark };
