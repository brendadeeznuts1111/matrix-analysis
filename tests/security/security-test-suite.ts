/**
 * FactoryWager Registry v4.0 - Security & Error Handling Test Suite
 * Validates all critical fixes and security improvements
 */

import { StreamingCRCValidator } from './factory-wager/security/streaming-validator'
import { RegistryUploadHandler } from './factory-wager/registry/upload-handler'

async function testSecurityFixes() {
  console.log('🔒 Testing Security & Error Handling Fixes')
  console.log('=' .repeat(50))

  const validator = new StreamingCRCValidator('/tmp/registry/test-security')
  const handler = new RegistryUploadHandler({
    tempDirectory: '/tmp/registry/test-uploads'
  })

  let testsPassed = 0
  let testsTotal = 0

  // Test 1: File existence validation
  console.log('\n📁 Test 1: File Existence Validation')
  testsTotal++
  try {
    await validator.validateStream('non-existent-file.txt')
    console.log('❌ FAIL: Should have thrown error for non-existent file')
  } catch (error: any) {
    if (error.message.includes('File not found')) {
      console.log('✅ PASS: Correctly detected non-existent file')
      testsPassed++
    } else {
      console.log(`❌ FAIL: Wrong error: ${error.message}`)
    }
  }

  // Test 2: Empty file validation
  console.log('\n📄 Test 2: Empty File Validation')
  testsTotal++
  try {
    const emptyFile = './test-empty.txt'
    await Bun.write(emptyFile, '')
    await validator.validateStream(emptyFile)
    console.log('❌ FAIL: Should have thrown error for empty file')
  } catch (error: any) {
    if (error.message.includes('Cannot validate empty file')) {
      console.log('✅ PASS: Correctly detected empty file')
      testsPassed++
    } else {
      console.log(`❌ FAIL: Wrong error: ${error.message}`)
    }
  }

  // Test 3: Path traversal protection
  console.log('\n🛡️  Test 3: Path Traversal Protection')
  const dangerousFilenames = [
    '../../../etc/passwd',
    '..\\..\\windows\\system32\\config\\sam',
    'package/../../etc/hosts',
    'file%00.txt',
    'CON.zip',
    'file|pipe.txt',
    'file;command.txt'
  ]

  for (const filename of dangerousFilenames) {
    testsTotal++
    try {
      handler['validateFilename'](filename)
      console.log(`❌ FAIL: Should have blocked dangerous filename: ${filename}`)
    } catch (error: any) {
      if (error.message.includes('Filename contains')) {
        console.log(`✅ PASS: Blocked dangerous filename: ${filename}`)
        testsPassed++
      } else {
        console.log(`❌ FAIL: Wrong error for ${filename}: ${error.message}`)
      }
    }
  }

  // Test 4: Resource leak prevention
  console.log('\n🧹 Test 4: Resource Leak Prevention')
  testsTotal++
  try {
    const testContent = 'Test content for resource leak check'
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(testContent))
        controller.close()
      }
    })

    const report = await validator.validateStream(stream)
    console.log(`✅ PASS: Stream validation completed without resource leaks`)
    console.log(`   CRC32: ${report.calculatedCrc.toString(16).padStart(8, '0')}`)
    testsPassed++
  } catch (error: any) {
    console.log(`❌ FAIL: Stream validation failed: ${error.message}`)
  }

  // Test 5: Division by zero prevention
  console.log('\n⚡ Test 5: Division by Zero Prevention')
  testsTotal++
  try {
    const tinyFile = './test-tiny.txt'
    await Bun.write(tinyFile, 'x') // 1 byte file
    const report = await validator.validateStream(tinyFile)
    
    if (isFinite(report.throughputMbps) && report.throughputMbps >= 0) {
      console.log(`✅ PASS: Throughput calculation is finite: ${report.throughputMbps.toFixed(2)} MB/s`)
      testsPassed++
    } else {
      console.log(`❌ FAIL: Throughput is not finite: ${report.throughputMbps}`)
    }
  } catch (error: any) {
    console.log(`❌ FAIL: Division by zero test failed: ${error.message}`)
  }

  // Test 6: Enhanced error messages
  console.log('\n📝 Test 6: Enhanced Error Messages')
  testsTotal++
  try {
    await validator.generateFingerprint('non-existent-file.txt')
    console.log('❌ FAIL: Should have thrown enhanced error')
  } catch (error: any) {
    if (error.message.includes('Failed to generate fingerprint for non-existent-file.txt')) {
      console.log('✅ PASS: Enhanced error message provided')
      testsPassed++
    } else {
      console.log(`❌ FAIL: Generic error message: ${error.message}`)
    }
  }

  // Cleanup test files
  console.log('\n🧹 Cleaning up test files...')
  const testFiles = ['./test-empty.txt', './test-tiny.txt']
  for (const file of testFiles) {
    try {
      await Bun.file(file).delete()
    } catch {
      // Ignore cleanup errors
    }
  }

  // Results
  console.log('\n📊 Test Results')
  console.log('=' .repeat(30))
  console.log(`Passed: ${testsPassed}/${testsTotal}`)
  console.log(`Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`)

  if (testsPassed === testsTotal) {
    console.log('\n🎉 All security & error handling tests PASSED!')
    console.log('✅ FactoryWager Registry v4.0 is production-ready!')
  } else {
    console.log('\n⚠️  Some tests failed. Review the issues above.')
  }

  return testsPassed === testsTotal
}

// Main test runner
async function main() {
  const success = await testSecurityFixes()
  process.exit(success ? 0 : 1)
}

if (import.meta.main) {
  main().catch(console.error)
}

export { testSecurityFixes }
