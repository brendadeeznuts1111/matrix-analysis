#!/usr/bin/env bun
// factory-wager/cli/fw-nexus-status.ts
import { MarkdownEngine } from '../render/markdown-engine';

interface EndpointStatus {
  key: string;
  url: string;
  health: '✓' | '⚠' | '✗';
  latency: number | null;
  drift: 'match' | 'mismatch';
  headers?: Record<string, string>;
}

interface HealthReport {
  score: number;
  endpoints: EndpointStatus[];
  timestamp: string;
  up: number;
  down: number;
  warning: number;
  drift: number;
  avgLatency: number;
}

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Helper functions for improved table formatting
function getServiceName(key: string): string {
  if (key.includes('dev.api')) return 'Dev API';
  if (key.includes('dev.registry')) return 'Dev Registry';
  if (key.includes('dev.r2')) return 'Dev R2';
  if (key.includes('dev.cdn')) return 'Dev CDN';
  if (key.includes('dev.monitoring') || key.includes('dev.status')) return 'Dev Status';
  if (key.includes('development')) return 'Development';
  if (key.includes('staging')) return 'Staging';
  if (key.includes('production')) return 'Production';
  if (key.includes('registry')) return 'Registry';
  if (key.includes('r2')) return 'R2 Storage';
  if (key.includes('cdn')) return 'CDN';
  if (key.includes('monitoring') || key.includes('status')) return 'Monitoring';
  return key.split('.')[0] || 'Unknown';
}

function truncateUrl(url: string, maxLen: number): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '...';
}

function formatHealth(health: '✓' | '⚠' | '✗'): string {
  const label = health === '✓' ? 'OK  ' : health === '⚠' ? 'WARN' : 'DOWN';
  const color = health === '✓' ? colors.green : health === '⚠' ? colors.yellow : colors.red;
  return `${color}${label}${colors.reset}`;
}

function formatLatency(latency: number | null): string {
  if (latency === null) return `${colors.gray}timeout ${colors.reset}`;
  const color = latency < 100 ? colors.green : latency < 500 ? colors.yellow : colors.red;
  return `${color}${latency.toFixed(0).padStart(4)}ms${colors.reset}`;
}

async function probeEndpoint(key: string, url: string, expectedHeaders?: Record<string, string>): Promise<EndpointStatus> {
  const start = Bun.nanoseconds();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    // Special handling for different endpoint types
    let headers: Record<string, string> = {};
    if (url.includes('workers.dev') || url.includes('factory-wager.com')) {
      headers = {
        'User-Agent': 'FactoryWager-Nexus-Status/1.1',
        'Accept': 'application/json',
        'X-Factory-Health-Check': 'true'
      };
    } else if (url.includes('r2.cloudflarestorage.com')) {
      headers = {
        'User-Agent': 'FactoryWager-R2-Status/1.1'
      };
    } else {
      headers = { 'Accept': 'application/json' };
    }
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers
    });
    
    clearTimeout(timeout);
    const latency = (Bun.nanoseconds() - start) / 1e6;
    
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });
    
    // Determine health with different thresholds for different endpoint types
    let health: '✓' | '⚠' | '✗' = '✗';
    if (response.ok) {
      const threshold = url.includes('r2.cloudflarestorage.com') ? 1000 : 500;
      health = latency < threshold ? '✓' : '⚠';
    }
    
    // Check header drift
    let drift: 'match' | 'mismatch' = 'match';
    if (expectedHeaders) {
      for (const [k, v] of Object.entries(expectedHeaders)) {
        if (responseHeaders[k.toLowerCase()] !== v) {
          drift = 'mismatch';
          break;
        }
      }
    }
    
    // Special validation for Cloudflare Workers
    if (url.includes('workers.dev')) {
      const cfRay = responseHeaders['cf-ray'];
      if (!cfRay) {
        drift = 'mismatch'; // Missing Cloudflare header
      }
    }
    
    return { key, url, health, latency, drift, headers: responseHeaders };
    
  } catch (error) {
    return { key, url, health: '✗', latency: null, drift: 'match' };
  }
}

async function checkR2Health(bucket: string, endpoint: string): Promise<EndpointStatus> {
  const start = Bun.nanoseconds();
  
  try {
    // Simulate R2 health check (would use AWS SDK in production)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${endpoint}?list-type=2`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'FactoryWager-R2-Status/1.1'
      }
    });
    
    clearTimeout(timeout);
    const latency = (Bun.nanoseconds() - start) / 1e6;
    
    const health = response.status === 200 || response.status === 403 
      ? (latency < 1000 ? '✓' : '⚠') 
      : '✗';
    
    return { 
      key: 'r2.health', 
      url: endpoint, 
      health, 
      latency, 
      drift: 'match' 
    };
    
  } catch (error) {
    return { key: 'r2.health', url: endpoint, health: '✗', latency: null, drift: 'match' };
  }
}

async function checkNexusStatus(configPath: string, watch: boolean = false, alertThreshold: number = 90): Promise<void> {
  const engine = new MarkdownEngine();
  
  console.log(`${colors.cyan}${colors.bold}████████████████████████████████████████████████████████████████${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold} 🔌 FACTORYWAGER NEXUS STATUS v1.1${colors.reset}`);
  
  try {
    const doc = await engine.renderDocument(configPath, { frontmatter: true });
    const fm = doc.frontmatter;
    
    // Extract endpoints from frontmatter with Cloudflare infrastructure support
    const endpoints: { key: string; url: string }[] = [];
    let r2Bucket: string | null = null;
    let r2Endpoint: string | null = null;
    
    for (const [key, value] of Object.entries(fm)) {
      if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        endpoints.push({ key, url: value });
      } else if (key === 'r2.bucket' && typeof value === 'string') {
        r2Bucket = value;
      } else if (key === 'r2.endpoint' && typeof value === 'string') {
        r2Endpoint = value;
      }
    }
    
    // Add R2 health check if configured
    if (r2Bucket && r2Endpoint) {
      const r2Health = await checkR2Health(r2Bucket, r2Endpoint);
      endpoints.push({ key: r2Health.key, url: r2Health.url });
    }
    
    // Add default endpoints if none found
    if (endpoints.length === 0) {
      endpoints.push(
        { key: 'dev.api.url', url: 'http://localhost:3000' },
        { key: 'registry.url', url: 'https://registry.factory-wager.workers.dev' }
      );
    }
    
    console.log(`${colors.gray} Probing ${endpoints.length} endpoints (including Cloudflare infrastructure)...${colors.reset}\n`);
    
    // Probe all endpoints
    const results = await Promise.all(
      endpoints.map(e => probeEndpoint(e.key, e.url))
    );
    
    // Calculate metrics
    const up = results.filter(r => r.health === '✓').length;
    const warning = results.filter(r => r.health === '⚠').length;
    const down = results.filter(r => r.health === '✗').length;
    const drift = results.filter(r => r.drift === 'mismatch').length;
    
    const validLatencies = results.filter(r => r.latency !== null).map(r => r.latency!);
    const avgLatency = validLatencies.length > 0 
      ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length 
      : 0;
    
    // Calculate score
    let score = 100;
    score -= (10 * down);
    score -= (5 * warning);
    score -= (15 * drift);
    score = Math.max(0, score);
    
    // Color code score
    const scoreColor = score >= 90 ? colors.green : score >= 70 ? colors.yellow : colors.red;
    const scoreLabel = score >= 90 ? 'GREEN' : score >= 70 ? 'YELLOW' : 'RED';
    
    console.log(`${colors.bold} Overall Health: ${scoreColor}${score}/100 [${scoreLabel}]${colors.reset}`);
    console.log(`${colors.gray} Last Checked: ${new Date().toISOString()}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}████████████████████████████████████████████████████████████████${colors.reset}\n`);
    
    // Print improved table header
    console.log(`${colors.bold}#   │Service          │Endpoint URL                          │Health │Latency │Drift  ${colors.reset}`);
    console.log(`${colors.gray}────┼─────────────────┼──────────────────────────────────────┼───────┼────────┼───────${colors.reset}`);
    
    // Print results with improved formatting
    results.forEach((r, i) => {
      const num = (i + 1).toString().padStart(3);
      const service = getServiceName(r.key).padEnd(16);
      const url = truncateUrl(r.url, 38).padEnd(38);
      const health = formatHealth(r.health);
      const latency = formatLatency(r.latency);
      const driftStr = r.drift === 'match' ? 
        `${colors.green}✓ match${colors.reset}` : 
        `${colors.red}✗ mismatch${colors.reset}`;
      
      console.log(`${num} │${service}│${url}│ ${health} │${latency}│ ${driftStr}`);
    });
    
    console.log(`\n${colors.gray}─────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  Endpoints: ${up} up, ${warning} warning, ${down} down (total: ${results.length})`);
    console.log(`  Avg Latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  Config Drift: ${drift} mismatches`);
    
    // Cloudflare-specific insights
    const cloudflareEndpoints = results.filter(r => 
      r.url.includes('workers.dev') || r.url.includes('factory-wager.com')
    );
    if (cloudflareEndpoints.length > 0) {
      console.log(`  Cloudflare Workers: ${cloudflareEndpoints.length} endpoints`);
      const cfHealthy = cloudflareEndpoints.filter(r => r.health === '✓').length;
      console.log(`    Workers healthy: ${cfHealthy}/${cloudflareEndpoints.length}`);
    }
    
    const r2Endpoints = results.filter(r => r.url.includes('r2.cloudflarestorage.com'));
    if (r2Endpoints.length > 0) {
      console.log(`  R2 Storage: ${r2Endpoints.length} endpoints`);
      const r2Healthy = r2Endpoints.filter(r => r.health === '✓').length;
      console.log(`    R2 healthy: ${r2Healthy}/${r2Endpoints.length}`);
    }
    
    if (score < alertThreshold) {
      console.log(`\n${colors.yellow}⚠ RECOMMENDATION: Health score ${score} (< ${alertThreshold})${colors.reset}`);
      console.log(`  Run ${colors.cyan}/fw-deploy --sync${colors.reset} to reconcile configuration drift`);
      if (warning > 0) console.log(`  Investigate high latency endpoints (>500ms threshold)`);
      if (down > 0) console.log(`  Check failed endpoint accessibility`);
      
      // Cloudflare-specific recommendations
      const cfDown = cloudflareEndpoints.filter(r => r.health === '✗').length;
      if (cfDown > 0) {
        console.log(`  ${colors.cyan}Cloudflare:${colors.reset} Check Workers deployment and DNS configuration`);
      }
      const r2Down = r2Endpoints.filter(r => r.health === '✗').length;
      if (r2Down > 0) {
        console.log(`  ${colors.cyan}R2:${colors.reset} Verify bucket permissions and API tokens`);
      }
    }
    
    console.log(`\n${colors.cyan}${colors.bold}████████████████████████████████████████████████████████████████${colors.reset}`);
    
    // Exit with appropriate code
    process.exit(score < alertThreshold ? 1 : 0);
    
  } catch (error) {
    console.error(`${colors.red}❌ Failed to load config: ${error}${colors.reset}`);
    process.exit(2);
  }
}

// CLI entry
const args = process.argv.slice(2);
const configIdx = args.findIndex(a => a.startsWith('--config='));
const configPath = configIdx >= 0 ? args[configIdx].split('=')[1] : './config.yaml';
const watch = args.includes('--watch');
const alertIdx = args.findIndex(a => a.startsWith('--alert='));
const alertThreshold = alertIdx >= 0 ? parseInt(args[alertIdx].split('=')[1]) : 90;

checkNexusStatus(configPath, watch, alertThreshold);
