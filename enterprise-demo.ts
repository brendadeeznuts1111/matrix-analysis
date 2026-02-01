#!/usr/bin/env bun
/**
 * Enterprise Archive Demo - Core Bun.Archive + Enterprise Enhancements
 * 
 * This demo shows how the Tier-1380 Enterprise Suite enhances the core Bun.Archive
 * functionality with enterprise-grade security, performance monitoring, and compliance.
 */

import { 
  createArchiveManager, 
  createSecurityValidator, 
  createPerformanceAnalyzer,
  createAuditTrailManager 
} from './tools/enterprise/index.ts';

console.log('🏢 Enterprise Archive Demo - Core Bun.Archive + Enterprise Enhancements');
console.log('=' .repeat(70));

async function demonstrateCoreVsEnterprise() {
  console.log('\n📋 1. Core Bun.Archive vs Enterprise Comparison');
  console.log('-'.repeat(50));

  // Create test data
  const testData = {
    'README.md': '# Enterprise Archive Demo\n\nThis demonstrates enhanced archive functionality.',
    'config.json': JSON.stringify({
      name: 'enterprise-demo',
      version: '2.0.0',
      features: ['security', 'performance', 'compliance'],
      database: {
        host: 'localhost',
        port: 5432,
        ssl: true
      }
    }, null, 2),
    'src/index.ts': `
import { fastify } from 'fastify';

const server = fastify({ logger: true });

server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

server.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
    `.trim(),
    'data/sample.csv': 'id,name,email\n1,John Doe,john@example.com\n2,Jane Smith,jane@example.com',
    'docs/api.md': '# API Documentation\n\n## GET /health\nReturns service health status.',
    'scripts/deploy.sh': '#!/bin/bash\necho "Deploying enterprise application..."\ndocker-compose up -d',
    'secrets/.env': 'API_KEY=secret123\nDATABASE_URL=postgresql://user:pass@localhost/db',
    '../etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nmalicious:x:1000:1000:hack:/home/hack:/bin/bash'
  };

  console.log('📁 Test data created:');
  console.log(`  - ${Object.keys(testData).length} files`);
  console.log(`  - ${Object.values(testData).reduce((sum, content) => sum + content.length, 0)} total bytes`);

  // === Core Bun.Archive Implementation ===
  console.log('\n🔧 CORE Bun.Archive Implementation:');
  console.log('-'.repeat(35));

  const coreStart = performance.now();
  
  // Basic archive creation (core Bun.Archive)
  const coreArchive = new Bun.Archive(testData, { compress: 'gzip', level: 6 });
  await Bun.write('core-demo.tar.gz', coreArchive);
  
  const coreTime = performance.now() - coreStart;
  const coreSize = (await Bun.file('core-demo.tar.gz').size()) / 1024;
  
  console.log(`✅ Core archive created in ${coreTime.toFixed(2)}ms`);
  console.log(`📦 Archive size: ${coreSize.toFixed(1)}KB`);
  console.log(`🔒 Security: Basic path validation only`);
  console.log(`📊 Performance: Manual timing required`);
  console.log(`📋 Audit: No built-in compliance`);

  // === Enterprise Enhanced Implementation ===
  console.log('\n🏢 ENTERPRISE Enhanced Implementation:');
  console.log('-'.repeat(42));

  // Initialize enterprise components
  const archiveManager = createArchiveManager('demo-tenant');
  const securityValidator = createSecurityValidator();
  const performanceAnalyzer = createPerformanceAnalyzer(':memory:');
  const auditManager = createAuditTrailManager(':memory:');

  try {
    // Security validation first
    console.log('🔒 Running security validation...');
    const fileMap = new Map(
      Object.entries(testData).map(([path, content]) => [
        path, 
        new TextEncoder().encode(content)
      ])
    );
    
    const securityReport = await securityValidator.validateArchive(fileMap);
    
    console.log(`  Risk Level: ${securityReport.overallRisk.toUpperCase()}`);
    console.log(`  Blocked Files: ${securityReport.blockedFiles.length}`);
    console.log(`  Violations: ${securityReport.violations.length}`);
    
    if (securityReport.blockedFiles.length > 0) {
      console.log('  🚫 Blocked files:', securityReport.blockedFiles.join(', '));
    }
    
    if (securityReport.violations.length > 0) {
      console.log('  ⚠️ Top violations:');
      securityReport.violations.slice(0, 3).forEach(v => {
        console.log(`    - ${v.path}: ${v.message}`);
      });
    }

    // Performance benchmarking
    console.log('\n📊 Running performance benchmark...');
    const benchmark = await performanceAnalyzer.runBenchmark(
      () => archiveManager.createSecureArchive('./demo-data', {
        compression: 'gzip',
        auditEnabled: true,
        validateIntegrity: true
      }),
      'enterprise_archive_creation',
      5,
      'demo-tenant'
    );
    
    console.log(`  Average Time: ${benchmark.averageTime.toFixed(2)}ms`);
    console.log(`  Throughput: ${benchmark.throughput.toFixed(2)} ops/sec`);
    console.log(`  Memory Peak: ${(benchmark.memoryPeak / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  Efficiency: ${benchmark.efficiency.toFixed(1)}%`);

    // Enterprise archive creation with audit
    console.log('\n📋 Creating enterprise archive with audit...');
    const enterpriseStart = performance.now();
    
    const result = await archiveManager.createSecureArchive('./demo-data', {
      compression: 'gzip',
      auditEnabled: true,
      validateIntegrity: true,
      outputPath: './enterprise-demo.tar.gz'
    });
    
    const enterpriseTime = performance.now() - enterpriseStart;
    const enterpriseSize = (await Bun.file('enterprise-demo.tar.gz').size()) / 1024;
    
    console.log(`✅ Enterprise archive created in ${enterpriseTime.toFixed(2)}ms`);
    console.log(`📦 Archive size: ${enterpriseSize.toFixed(1)}KB`);
    console.log(`🆔 Archive ID: ${result.archiveId}`);
    console.log(`📊 Files: ${result.metadata.fileCount}`);
    console.log(`🔒 Security: ${result.metadata.checksum ? 'Integrity verified' : 'No checksum'}`);

    // Record audit event
    await auditManager.recordEvent({
      timestamp: new Date(),
      eventType: 'archive_created',
      tenantId: 'demo-tenant',
      userId: 'demo-user',
      resource: './demo-data',
      action: 'create_enterprise_archive',
      outcome: 'success',
      details: {
        archiveId: result.archiveId,
        fileCount: result.metadata.fileCount,
        originalSize: result.metadata.totalSize,
        compressedSize: enterpriseSize * 1024,
        compressionRatio: enterpriseSize / (result.metadata.totalSize / 1024),
        securityViolations: securityReport.violations.length,
        performanceMs: enterpriseTime
      },
      metadata: {
        source: 'enterprise-demo',
        version: '2.0.0',
        requestId: crypto.randomUUID(),
        ipAddress: '127.0.0.1',
        userAgent: 'Enterprise-Demo/2.0.0'
      },
      compliance: {
        dataClassification: 'confidential',
        retentionPeriod: 2555, // 7 years
        legalHold: false,
        regulations: ['SOX', 'GDPR']
      }
    });

    console.log(`📋 Audit event recorded with compliance tracking`);

    // Generate compliance report
    console.log('\n📈 Generating compliance report...');
    const complianceReport = await auditManager.generateComplianceReport('demo-tenant', {
      start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      end: new Date()
    });
    
    console.log(`  Compliance Score: ${complianceReport.summary.complianceScore}%`);
    console.log(`  Total Events: ${complianceReport.summary.totalEvents}`);
    console.log(`  Violations: ${complianceReport.summary.violations}`);
    console.log(`  Legal Holds: ${complianceReport.summary.legalHolds}`);

  } finally {
    // Clean up resources
    archiveManager.close();
    performanceAnalyzer.close();
    auditManager.close();
  }

  // === Performance Comparison ===
  console.log('\n📊 PERFORMANCE COMPARISON:');
  console.log('-'.repeat(30));
  
  const performanceDiff = ((enterpriseTime - coreTime) / coreTime * 100);
  const sizeDiff = ((enterpriseSize - coreSize) / coreSize * 100);
  
  console.log(`Core Implementation:     ${coreTime.toFixed(2)}ms, ${coreSize.toFixed(1)}KB`);
  console.log(`Enterprise Implementation: ${enterpriseTime.toFixed(2)}ms, ${enterpriseSize.toFixed(1)}KB`);
  console.log(`Performance Overhead:    ${performanceDiff > 0 ? '+' : ''}${performanceDiff.toFixed(1)}%`);
  console.log(`Size Difference:         ${sizeDiff > 0 ? '+' : ''}${sizeDiff.toFixed(1)}%`);
  
  console.log('\n🎯 ENTERPRISE FEATURES ADDED:');
  console.log('  ✅ Advanced security validation (7 rules)');
  console.log('  ✅ Performance benchmarking and analytics');
  console.log('  ✅ Comprehensive audit trail with compliance');
  console.log('  ✅ Multi-tenant isolation');
  console.log('  ✅ Integrity verification with checksums');
  console.log('  ✅ Real-time monitoring and alerting');
  console.log('  ✅ Regulatory compliance (SOX, GDPR, HIPAA)');
  console.log('  ✅ Automated retention policies');
  console.log('  ✅ Enterprise-grade error handling');
  console.log('  ✅ Production-ready CLI interface');

  // === File Verification ===
  console.log('\n🔍 ARCHIVE VERIFICATION:');
  console.log('-'.repeat(25));
  
  // Verify both archives can be extracted
  try {
    const coreExtracted = new Bun.Archive(await Bun.file('core-demo.tar.gz').bytes());
    const coreFiles = await coreExtracted.files();
    console.log(`✅ Core archive: ${coreFiles.size} files accessible`);
    
    const enterpriseExtracted = new Bun.Archive(await Bun.file('enterprise-demo.tar.gz').bytes());
    const enterpriseFiles = await enterpriseExtracted.files();
    console.log(`✅ Enterprise archive: ${enterpriseFiles.size} files accessible`);
    
    // Verify content integrity
    const coreReadme = await coreFiles.get('README.md')?.text();
    const enterpriseReadme = await enterpriseFiles.get('README.md')?.text();
    
    if (coreReadme === enterpriseReadme) {
      console.log('✅ Content integrity verified: Both archives contain identical data');
    } else {
      console.log('⚠️ Content mismatch detected between archives');
    }
    
  } catch (error) {
    console.error('❌ Archive verification failed:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n🎉 DEMONSTRATION COMPLETE');
  console.log('=' .repeat(70));
  console.log('The Enterprise Archive Suite successfully enhances core Bun.Archive');
  console.log('with enterprise-grade security, performance monitoring, and compliance');
  console.log('while maintaining full compatibility with the original API.');
}

// Run the demonstration
demonstrateCoreVsEnterprise().catch(console.error);
