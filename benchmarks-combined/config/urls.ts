#!/usr/bin/env bun
/**
 * Benchmark Configuration with URLs
 * 
 * Example configuration showing how to use various URLs
 * for benchmark storage, CDN, and management
 */

interface BenchmarkConfig {
  // Core settings
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // Storage endpoints
  storage: {
    r2Bucket: string;
    cdnUrl: string;
    backupUrl: string;
  };
  
  // Management endpoints
  management: {
    dashboard: string;
    admin: string;
    logs: string;
    health: string;
  };
  
  // API endpoints
  apis: {
    main: string;
    metrics: string;
    dev?: string;
    devMetrics?: string;
  };
  
  // Local development
  local: {
    url: string;
    port: number;
  };
}

// Production configuration
export const prodConfig: BenchmarkConfig = {
  name: 'benchmarks-prod',
  version: '1.0.0',
  environment: 'production',
  
  storage: {
    r2Bucket: 'https://benchmarks.factory-wager.com',
    cdnUrl: 'https://cdn.factory-wager.com/benchmarks',
    backupUrl: 'https://backup.factory-wager.com'
  },
  
  management: {
    dashboard: 'https://dashboard.factory-wager.com',
    admin: 'https://admin.factory-wager.com',
    logs: 'https://logs.factory-wager.com',
    health: 'https://health.factory-wager.com'
  },
  
  apis: {
    main: 'https://api.factory-wager.com',
    metrics: 'https://metrics.factory-wager.com'
  },
  
  local: {
    url: 'http://localhost:3000',
    port: 3000
  }
};

// Staging configuration
export const stagingConfig: BenchmarkConfig = {
  ...prodConfig,
  environment: 'staging',
  apis: {
    ...prodConfig.apis,
    main: 'https://staging.factory-wager.com',
    dev: 'https://dev-api.factory-wager.com',
    devMetrics: 'https://dev-metrics.factory-wager.com'
  }
};

// Development configuration
export const devConfig: BenchmarkConfig = {
  ...prodConfig,
  environment: 'development',
  storage: {
    r2Bucket: 'https://test.factory-wager.com',
    cdnUrl: 'http://localhost:3000/static',
    backupUrl: 'https://dev-backup.factory-wager.com'
  },
  apis: {
    main: 'https://dev-api.factory-wager.com',
    metrics: 'https://dev-metrics.factory-wager.com'
  }
};

// Get configuration based on environment
export function getBenchmarkConfig(env?: string): BenchmarkConfig {
  switch (env || process.env.NODE_ENV) {
    case 'production':
      return prodConfig;
    case 'staging':
      return stagingConfig;
    default:
      return devConfig;
  }
}

// Example usage
console.log('Benchmark Configuration:');
console.log(JSON.stringify(getBenchmarkConfig(), null, 2));
