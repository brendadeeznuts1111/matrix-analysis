/**
 * FactoryWager Registry v4.0 - Streaming CRC32 Performance Demo
 * Demonstrates hardware-accelerated validation for massive files
 */

import { StreamingCRCValidator } from './factory-wager/security/streaming-validator'
import { RegistryUploadHandler } from './factory-wager/registry/upload-handler'

async function performanceDemo() {
  console.log('🚀 FactoryWager Registry v4.0 - Streaming CRC32 Performance Demo')
  console.log('=' .repeat(70))

  const validator = new StreamingCRCValidator()
  
  // Create test files of different sizes
  const testSizes = [
    { name: 'small', size: 1024 * 1024 },           // 1MB
    { name: 'medium', size: 10 * 1024 * 1024 },     // 10MB
    { name: 'large', size: 100 * 1024 * 1024 },     // 100MB
    { name: 'massive', size: 1024 * 1024 * 1024 }   // 1GB
  ]

  console.log('📊 Creating test files...')
  
  for (const test of testSizes) {
    const filePath = `./test-${test.name}.bin`
    
    // Create test file if it doesn't exist
    try {
      const file = Bun.file(filePath)
      if (!await file.exists()) {
        console.log(`   Creating ${test.name} test file (${test.size / 1024 / 1024}MB)...`)
        
        // Generate pseudo-random content
        const content = new Uint8Array(test.size)
        for (let i = 0; i < test.size; i++) {
          content[i] = Math.floor(Math.random() * 256)
        }
        
        await Bun.write(filePath, content)
      }
    } catch (error) {
      console.warn(`   Warning: Could not create ${test.name} test file`)
    }
  }

  console.log('\n🔄 Performance Comparison: Standard vs Streaming')
  console.log('=' .repeat(70))

  for (const test of testSizes) {
    const filePath = `./test-${test.name}.bin`
    const file = Bun.file(filePath)
    
    if (!await file.exists()) {
      console.log(`⚠️  Skipping ${test.name} - file not found`)
      continue
    }

    console.log(`\n📁 ${test.name.toUpperCase()} FILE (${test.size / 1024 / 1024}MB)`)
    console.log('-'.repeat(50))

    // Test streaming validation
    const streamStart = performance.now()
    const streamReport = await validator.validateStream(filePath)
    const streamEnd = performance.now()

    // Test fingerprint (head+tail)
    const fingerprintStart = performance.now()
    const fingerprintReport = await validator.generateFingerprint(filePath)
    const fingerprintEnd = performance.now()

    // Test standard full read (for comparison)
    const standardStart = performance.now()
    const buffer = await file.arrayBuffer()
    const standardCrc = Bun.hash.crc32(buffer)
    const standardEnd = performance.now()

    console.log(`Streaming Validation:`)
    console.log(`   CRC32: ${streamReport.calculatedCrc.toString(16).padStart(8, '0')}`)
    console.log(`   Strategy: ${streamReport.strategy}`)
    console.log(`   Throughput: ${streamReport.throughputMbps.toFixed(1)} MB/s`)
    console.log(`   Memory: ${streamReport.memoryUsageMb.toFixed(1)} MB`)
    console.log(`   Duration: ${(streamEnd - streamStart).toFixed(2)} ms`)

    console.log(`Fingerprint (Head+Tail):`)
    console.log(`   CRC32: ${fingerprintReport.crc32.toString(16).padStart(8, '0')}`)
    console.log(`   Strategy: ${fingerprintReport.strategy}`)
    console.log(`   Latency: ${fingerprintReport.latencyMs.toFixed(2)} ms`)

    console.log(`Standard Full Read:`)
    console.log(`   CRC32: ${standardCrc.toString(16).padStart(8, '0')}`)
    console.log(`   Memory: ${(test.size / 1024 / 1024).toFixed(1)} MB`)
    console.log(`   Duration: ${(standardEnd - standardStart).toFixed(2)} ms`)

    // Performance comparison
    const streamSpeedup = (standardEnd - standardStart) / (streamEnd - streamStart)
    const fingerprintSpeedup = (standardEnd - standardStart) / fingerprintReport.latencyMs
    const memorySavings = ((test.size / 1024 / 1024) / streamReport.memoryUsageMb)

    console.log(`\n📈 Performance Gains:`)
    console.log(`   Streaming speedup: ${streamSpeedup.toFixed(1)}x`)
    console.log(`   Fingerprint speedup: ${fingerprintSpeedup.toFixed(1)}x`)
    console.log(`   Memory savings: ${memorySavings.toFixed(1)}x`)
  }

  console.log('\n🎯 Use Case Recommendations:')
  console.log('=' .repeat(70))
  console.log('📦 Package Uploads: Use Streaming CRC32 for real-time validation')
  console.log('⚡ Cache Invalidation: Use Fingerprint for instant checks')
  console.log('🔒 Security Scans: Use Full Hash for forensic analysis')
  console.log('📊 Telemetry: Use Head+Tail for high-volume monitoring')

  // Cleanup test files
  console.log('\n🧹 Cleaning up test files...')
  for (const test of testSizes) {
    const filePath = `./test-${test.name}.bin`
    try {
      await Bun.file(filePath).delete()
    } catch {
      // Ignore cleanup errors
    }
  }

  console.log('\n✅ Performance demo complete!')
  console.log('🚀 FactoryWager Registry is ready for multi-terabyte datasets!')
}

// Upload handler demo
async function uploadDemo() {
  console.log('\n📥 Upload Handler Demo')
  console.log('=' .repeat(30))

  const handler = new RegistryUploadHandler()
  
  // Create a test package
  const testPackage = './demo-package.tgz'
  const testContent = 'Demo package content for FactoryWager Registry'
  await Bun.write(testPackage, testContent)

  try {
    const stream = Bun.file(testPackage).stream()
    const size = testContent.length
    
    const result = await handler.handleUpload(stream, 'demo-package.tgz', size)
    
    console.log('✅ Upload successful!')
    console.log(`   Path: ${result.path}`)
    console.log(`   Integrity: ${result.integrity.algorithm}-${result.integrity.crc32.toString(16).padStart(8, '0')}`)
    console.log(`   Throughput: ${result.throughput.toFixed(1)} MB/s`)
    
  } catch (error: any) {
    console.error(`❌ Upload failed: ${error.message}`)
  }

  // Cleanup
  try {
    await Bun.file(testPackage).delete()
  } catch {
    // Ignore cleanup errors
  }
}

// Main demo
async function main() {
  await performanceDemo()
  await uploadDemo()
}

if (import.meta.main) {
  main().catch(console.error)
}

export { performanceDemo, uploadDemo }
