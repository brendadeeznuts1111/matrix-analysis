#!/usr/bin/env bun
// Bun.inspect.custom with Table Formatting for CLI
// Shows how to create custom table displays using Bun's inspect API

import { inspect } from 'bun';

// Example 1: Custom inspect for test results
class TestResult {
  constructor(
    public name: string,
    public status: 'passed' | 'failed' | 'skipped',
    public duration: number,
    public coverage?: number
  ) {}

  [inspect.custom]() {
    const statusIcon = this.status === 'passed' ? '✅' : 
                      this.status === 'failed' ? '❌' : '⏭️';
    
    return {
      'Test Name': this.name,
      'Status': `${statusIcon} ${this.status}`,
      'Duration': `${this.duration.toFixed(2)}ms`,
      'Coverage': this.coverage ? `${(this.coverage * 100).toFixed(1)}%` : 'N/A'
    };
  }
}

// Example 2: Custom inspect for bytecode metrics
class BytecodeMetrics {
  constructor(
    public llint: number,
    public baseline: number,
    public dfg: number,
    public ftl: number,
    public score: number
  ) {}

  [inspect.custom]() {
    const tiers = [
      { name: 'LLInt', value: this.llint, icon: '🐌' },
      { name: 'Baseline', value: this.baseline, icon: '📦' },
      { name: 'DFG', value: this.dfg, icon: '⚡' },
      { name: 'FTL', value: this.ftl, icon: '🚀' }
    ];

    // Create a visual bar chart
    const bar = (value: number, max: number = 100) => {
      const filled = Math.round(value / max * 20);
      return '█'.repeat(filled) + '░'.repeat(20 - filled);
    };

    return {
      'Optimization Score': `${this.score}/100 ${bar(this.score)}`,
      '': '', // Spacer
      ...Object.fromEntries(
        tiers.map(tier => [
          `${tier.icon} ${tier.name}`,
          `${tier.value.toFixed(1)}% ${bar(tier.value)}`
        ])
      )
    };
  }
}

// Example 3: Custom inspect for regional status
class RegionalStatus {
  constructor(
    public region: string,
    public status: 'active' | 'idle' | 'error',
    public metrics: {
      parseTime: number;
      testCount: number;
      passRate: number;
    }
  ) {}

  [inspect.custom]() {
    const statusColor = this.status === 'active' ? '\x1b[32m' : 
                       this.status === 'error' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';

    return {
      'Region': this.region,
      'Status': `${statusColor}${this.status}${reset}`,
      'Parse Time': `${this.metrics.parseTime.toFixed(3)}ms`,
      'Tests': this.metrics.testCount,
      'Pass Rate': `${(this.metrics.passRate * 100).toFixed(1)}%`
    };
  }
}

// Example 4: Custom table formatter
class TableFormatter {
  static createTable<T>(items: T[], columns: (keyof T)[]): string {
    if (items.length === 0) return 'No data to display';

    // Calculate column widths
    const widths: Record<string, number> = {};
    columns.forEach(col => {
      widths[col as string] = Math.max(
        col.toString().length,
        ...items.map(item => String(item[col] || '').length)
      );
    });

    // Build table
    let table = '';
    
    // Header
    table += '┌' + columns.map(col => '─'.repeat(widths[col as string] + 2)).join('┬') + '┐\n';
    table += '│' + columns.map(col => 
      ` ${col.toString().padEnd(widths[col as string])} `
    ).join('│') + '│\n';
    table += '├' + columns.map(col => '─'.repeat(widths[col as string] + 2)).join('┼') + '┤\n';

    // Rows
    items.forEach(item => {
      table += '│' + columns.map(col => 
        ` ${String(item[col] || '').padEnd(widths[col as string])} `
      ).join('│') + '│\n';
    });

    // Footer
    table += '└' + columns.map(col => '─'.repeat(widths[col as string] + 2)).join('┴') + '┘';

    return table;
  }
}

// Demo function
async function demo() {
  console.log('🎨 Bun.inspect.custom Table Formatting Demo');
  console.log('==========================================\n');

  // 1. Single object with custom inspect
  console.log('1️⃣ Custom Test Result:');
  const testResult = new TestResult('user-auth.test.ts', 'passed', 234, 0.92);
  console.log(testResult);
  console.log();

  // 2. Bytecode metrics with visual bars
  console.log('2️⃣ Bytecode Metrics Visualization:');
  const metrics = new BytecodeMetrics(2.1, 25.3, 52.8, 19.8, 85);
  console.log(metrics);
  console.log();

  // 3. Array of objects with custom inspect
  console.log('3️⃣ Regional Status Array:');
  const regions = [
    new RegionalStatus('us-east-1', 'active', { parseTime: 0.8, testCount: 42, passRate: 0.95 }),
    new RegionalStatus('us-west-2', 'idle', { parseTime: 1.2, testCount: 38, passRate: 0.88 }),
    new RegionalStatus('eu-west-1', 'error', { parseTime: 2.5, testCount: 0, passRate: 0 })
  ];
  console.log(regions);
  console.log();

  // 4. Using Bun.inspect.table with custom objects
  console.log('4️⃣ Bun.inspect.table with Custom Objects:');
  const tableData = regions.map(r => ({
    Region: r.region,
    Status: r.status,
    'Parse Time': `${r.metrics.parseTime}ms`,
    Tests: r.metrics.testCount,
    'Pass Rate': `${(r.metrics.passRate * 100).toFixed(1)}%`
  }));
  
  console.log(inspect.table(tableData));
  console.log();

  // 5. Custom table formatter
  console.log('5️⃣ Custom Table Formatter:');
  const customTable = TableFormatter.createTable(tableData, ['Region', 'Status', 'Parse Time', 'Tests', 'Pass Rate']);
  console.log(customTable);
  console.log();

  // 6. Complex nested object with custom inspect
  console.log('6️⃣ Complex Test Suite Report:');
  class TestSuiteReport {
    constructor(public name: string, public results: TestResult[], public metrics: BytecodeMetrics) {}

    [inspect.custom]() {
      return {
        'Suite': this.name,
        'Tests': `${this.results.length} total`,
        'Passed': this.results.filter(r => r.status === 'passed').length,
        'Failed': this.results.filter(r => r.status === 'failed').length,
        '': '─'.repeat(30),
        'Performance': this.metrics
      };
    }
  }

  const suite = new TestSuiteReport(
    'Authentication Tests',
    [
      new TestResult('login.test.ts', 'passed', 123, 0.89),
      new TestResult('logout.test.ts', 'passed', 45, 0.92),
      new TestResult('register.test.ts', 'failed', 567, 0.76)
    ],
    new BytecodeMetrics(1.2, 22.5, 55.3, 21.0, 88)
  );

  console.log(suite);
}

// CLI integration example
export class CLIDisplayer {
  static displayTestResults(results: TestResult[]) {
    console.log('\n📊 Test Results Summary');
    console.log('=====================\n');
    
    // Using Bun.inspect.table
    const tableData = results.map(r => ({
      Test: r.name,
      Status: r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⏭️',
      Time: `${r.duration}ms`,
      Coverage: r.coverage ? `${(r.coverage * 100).toFixed(1)}%` : 'N/A'
    }));
    
    console.log(inspect.table(tableData));
    
    // Summary
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total = results.length;
    
    console.log(`\nSummary: ${passed}/${total} passed (${((passed/total) * 100).toFixed(1)}%)`);
  }
}

// Run demo
if (import.meta.main) {
  demo().catch(console.error);
}
