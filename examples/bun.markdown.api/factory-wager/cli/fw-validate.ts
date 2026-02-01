#!/usr/bin/env bun
// factory-wager/cli/fw-validate.ts
import { MarkdownEngine } from '../render/markdown-engine';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  checks: {
    frontmatter: boolean;
    requiredFields: boolean;
    schema: boolean;
    secrets: boolean;
  };
}

const REQUIRED_FIELDS = ['title'];
const ALLOWED_FIELDS = [
  'title', 'description', 'date', 'author', 'tags', 'draft', 'slug', 'image',
  // Infrastructure endpoints
  'development.api.url', 'staging.api.url', 'production.api.url', 
  'registry.url', 'r2.bucket', 'r2.endpoint', 'cdn.url', 'monitoring.url',
  // Dev subdomain endpoints
  'dev.api.url', 'dev.registry.url', 'dev.r2.endpoint', 'dev.cdn.url', 'dev.monitoring.url',
  'environment', 'subdomain'
];

async function validateFile(filePath: string, strict: boolean = false, env: string = 'production'): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: {
      frontmatter: false,
      requiredFields: false,
      schema: false,
      secrets: false
    }
  };
  
  try {
    const content = await Bun.file(filePath).text();
    
    // Check frontmatter exists
    if (!content.match(/^---\r?\n/)) {
      result.errors.push({ field: 'frontmatter', message: 'Missing frontmatter block', severity: 'error' });
      result.valid = false;
    } else {
      result.checks.frontmatter = true;
    }
    
    const engine = new MarkdownEngine();
    const doc = await engine.renderDocument(filePath, { frontmatter: true });
    
    // Check required fields
    const missing = REQUIRED_FIELDS.filter(f => !(f in doc.frontmatter));
    if (missing.length > 0) {
      result.errors.push({ 
        field: 'required', 
        message: `Missing required fields: ${missing.join(', ')}`, 
        severity: 'error' 
      });
      result.valid = false;
    } else {
      result.checks.requiredFields = true;
    }
    
    // Check schema (allowed fields)
    const unknown = Object.keys(doc.frontmatter).filter(k => !ALLOWED_FIELDS.includes(k));
    if (unknown.length > 0) {
      const severity = strict ? 'error' : 'warning';
      result[severity === 'error' ? 'errors' : 'warnings'].push({
        field: 'schema',
        message: `Unknown fields: ${unknown.join(', ')}`,
        severity
      });
      if (strict) result.valid = false;
    } else {
      result.checks.schema = true;
    }
    
    // Check for potential secrets
    const contentStr = JSON.stringify(doc.frontmatter);
    const secretPatterns = [/password/i, /token/i, /key/i, /secret/i];
    const hasSecrets = secretPatterns.some(p => p.test(contentStr));
    if (hasSecrets) {
      result.warnings.push({
        field: 'secrets',
        message: 'Potential secrets detected in frontmatter',
        severity: 'warning'
      });
    } else {
      result.checks.secrets = true;
    }
    
  } catch (error) {
    result.errors.push({
      field: 'parse',
      message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'error'
    });
    result.valid = false;
  }
  
  return result;
}

// CLI entry
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const envIdx = args.findIndex(a => a.startsWith('--env='));
const env = envIdx >= 0 ? args[envIdx].split('=')[1] : 'production';
const files = args.filter(a => !a.startsWith('--'));

if (files.length === 0) {
  console.log('Usage: fw-validate [--env=<env>] [--strict] <file1> [file2...]');
  process.exit(1);
}

(async () => {
console.log(`🔐 Validating in ${env} mode${strict ? ' (strict)' : ''}...\n`);

let allValid = true;
for (const file of files) {
  const result = await validateFile(file, strict, env);
  
  console.log(`${result.valid ? '✅' : '❌'} ${file}`);
  
  if (result.errors.length > 0) {
    allValid = false;
    result.errors.forEach(e => console.log(`   ❌ ${e.field}: ${e.message}`));
  }
  
  if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.log(`   ⚠️  ${w.field}: ${w.message}`));
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('   ✅ All checks passed');
  }
}

console.log(`\n${allValid ? '✅' : '❌'} Validation ${allValid ? 'passed' : 'failed'}`);
process.exit(allValid ? 0 : 1);
})();
