#!/usr/bin/env bun
/**
 * FactoryWager Domain Configuration with Cookie Management
 * Production-ready domain and endpoint configuration with governance headers
 */

// Domain configuration with cookie management
export const DOMAIN_CONFIG = {
  // Primary domain
  primary: "factory-wager.com",
  
  // Subdomains
  subdomains: {
    api: "api.factory-wager.com",
    cdn: "cdn.factory-wager.com",
    registry: "registry.factory-wager.com",
    monitoring: "status.factory-wager.com",
    dev: "dev.factory-wager.com",
    staging: "staging.factory-wager.com"
  },
  
  // Cookie domains for security
  cookieDomains: {
    main: ".factory-wager.com",
    api: ".api.factory-wager.com",
    secure: ".secure.factory-wager.com"
  },
  
  // Endpoint configurations
  endpoints: {
    // API endpoints
    api: {
      base: "https://api.factory-wager.com",
      v1: "https://api.factory-wager.com/v1",
      v2: "https://api.factory-wager.com/v2",
      health: "https://api.factory-wager.com/health",
      metrics: "https://api.factory-wager.com/metrics"
    },
    
    // Registry endpoints
    registry: {
      base: "https://registry.factory-wager.com",
      packages: "https://registry.factory-wager.com/packages",
      artifacts: "https://registry.factory-wager.com/artifacts",
      security: "https://registry.factory-wager.com/security"
    },
    
    // CDN endpoints
    cdn: {
      base: "https://cdn.factory-wager.com",
      assets: "https://cdn.factory-wager.com/assets",
      images: "https://cdn.factory-wager.com/images",
      scripts: "https://cdn.factory-wager.com/scripts"
    },
    
    // Monitoring endpoints
    monitoring: {
      base: "https://status.factory-wager.com",
      health: "https://status.factory-wager.com/health",
      metrics: "https://status.factory-wager.com/metrics",
      alerts: "https://status.factory-wager.com/alerts"
    },
    
    // Development endpoints
    dev: {
      base: "https://dev.factory-wager.com",
      api: "https://dev.api.factory-wager.com",
      registry: "https://dev.registry.factory-wager.com",
      monitoring: "https://dev.status.factory-wager.com"
    }
  }
};

// R2 Bucket configuration
export const BUCKET_CONFIG = {
  primary: "factory-wager-artifacts",
  sessions: "factory-wager-sessions",
  backups: "factory-wager-backups",
  logs: "factory-wager-logs",
  metrics: "factory-wager-metrics",
  security: "factory-wager-security",
  
  // Regional buckets for performance
  regions: {
    us_east_1: "factory-wager-us-east-1",
    us_west_2: "factory-wager-us-west-2",
    eu_west_1: "factory-wager-eu-west-1",
    ap_southeast_1: "factory-wager-ap-southeast-1"
  }
};

// Security headers configuration
export const SECURITY_HEADERS = {
  // Standard security headers
  standard: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
  },
  
  // Cookie security headers
  cookie: {
    "Set-Cookie": {
      "SameSite": "Strict",
      "Secure": true,
      "HttpOnly": true,
      "Path": "/",
      "Domain": ".factory-wager.com"
    }
  },
  
  // CORS headers
  cors: {
    "Access-Control-Allow-Origin": "https://factory-wager.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  },
  
  // Rate limiting headers
  rateLimit: {
    "X-RateLimit-Limit": "1000",
    "X-RateLimit-Remaining": "999",
    "X-RateLimit-Reset": "3600"
  },
  
  // Cache headers
  cache: {
    "Cache-Control": "public, max-age=3600",
    "ETag": "W/\"factory-wager-v1.0\"",
    "Last-Modified": new Date().toUTCString()
  }
};

// Governance headers for compliance
export const GOVERNANCE_HEADERS = {
  // Compliance headers
  compliance: {
    "X-Compliance-Level": "Tier-1380",
    "X-Security-Posture": "High",
    "X-Data-Classification": "Confidential",
    "X-Audit-Trail": "Enabled",
    "X-Privacy-Shield": "Active"
  },
  
  // Audit headers
  audit: {
    "X-Audit-ID": () => crypto.randomUUID().toString(),
    "X-Audit-Timestamp": new Date().toISOString(),
    "X-Audit-User": "system",
    "X-Audit-Action": "cookie-management",
    "X-Audit-Resource": "domain-config"
  },
  
  // Monitoring headers
  monitoring: {
    "X-Monitoring-ID": () => crypto.randomUUID().toString(),
    "X-Performance-Metrics": "Enabled",
    "X-Health-Check": "Pass",
    "X-Service-Version": "v1.3.8",
    "X-Environment": "production"
  },
  
  // Governance headers
  governance: {
    "X-Governance-Policy": "Cookie-Management-Policy-v2.0",
    "X-Governance-Compliance": "GDPR-CCPA-Compliant",
    "X-Governance-Audit": "Quarterly-Audit-Required",
    "X-Governance-Review": "Security-Review-Approved",
    "X-Governance-Documentation": "https://docs.factory-wager.com/governance"
  }
};

// Cookie configuration for different domains
export const COOKIE_CONFIG = {
  // Session cookies
  session: {
    name: "session",
    domain: ".factory-wager.com",
    path: "/",
    maxAge: 3600, // 1 hour
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    partitioned: false
  },
  
  // User preference cookies
  preferences: {
    name: "preferences",
    domain: ".factory-wager.com",
    path: "/",
    maxAge: 86400 * 30, // 30 days
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    partitioned: false
  },
  
  // Security cookies
  security: {
    name: "security_token",
    domain: ".factory-wager.com",
    path: "/",
    maxAge: 86400 * 7, // 7 days
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    partitioned: true
  },
  
  // Analytics cookies
  analytics: {
    name: "analytics_id",
    domain: ".factory-wager.com",
    path: "/",
    maxAge: 86400 * 365, // 1 year
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    partitioned: false
  },
  
  // CSRF protection cookies
  csrf: {
    name: "csrf_token",
    domain: ".factory-wager.com",
    path: "/",
    maxAge: 3600, // 1 hour
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    partitioned: false
  }
};

// Domain-specific cookie policies
export const DOMAIN_COOKIE_POLICIES = {
  // Main domain policy
  main: {
    allowedCookies: ["session", "preferences", "security", "analytics"],
    strictSameSite: true,
    requireSecure: true,
    maxAge: {
      session: 3600,
      preferences: 86400 * 30,
      security: 86400 * 7,
      analytics: 86400 * 365
    }
  },
  
  // API domain policy
  api: {
    allowedCookies: ["session", "security", "csrf"],
    strictSameSite: true,
    requireSecure: true,
    maxAge: {
      session: 1800, // 30 minutes for API
      security: 3600,
      csrf: 3600
    }
  },
  
  // CDN domain policy
  cdn: {
    allowedCookies: ["analytics", "preferences"],
    strictSameSite: false,
    requireSecure: true,
    maxAge: {
      analytics: 86400 * 365,
      preferences: 86400 * 30
    }
  },
  
  // Development domain policy
  dev: {
    allowedCookies: ["session", "preferences", "debug"],
    strictSameSite: false,
    requireSecure: false,
    maxAge: {
      session: 7200, // 2 hours for dev
      preferences: 86400 * 7, // 1 week for dev
      debug: 3600
    }
  }
};

// Endpoint-specific cookie configurations
export const ENDPOINT_COOKIE_CONFIG = {
  // API endpoints
  api: {
    "/auth/login": {
      setCookies: ["session", "security_token"],
      deleteCookies: [],
      secure: true,
      httpOnly: true
    },
    "/auth/logout": {
      setCookies: [],
      deleteCookies: ["session", "security_token"],
      secure: true,
      httpOnly: true
    },
    "/api/v1/*": {
      setCookies: [],
      deleteCookies: [],
      secure: true,
      httpOnly: false
    }
  },
  
  // Registry endpoints
  registry: {
    "/packages/*": {
      setCookies: ["preferences"],
      deleteCookies: [],
      secure: true,
      httpOnly: false
    },
    "/security/*": {
      setCookies: ["security_token"],
      deleteCookies: [],
      secure: true,
      httpOnly: true
    }
  },
  
  // Monitoring endpoints
  monitoring: {
    "/health": {
      setCookies: [],
      deleteCookies: [],
      secure: false,
      httpOnly: false
    },
    "/metrics": {
      setCookies: ["analytics"],
      deleteCookies: [],
      secure: true,
      httpOnly: false
    }
  }
};

// Cookie validation rules
export const COOKIE_VALIDATION_RULES = {
  // Name validation
  name: {
    minLength: 1,
    maxLength: 64,
    allowedChars: /^[a-zA-Z0-9_-]+$/,
    reservedNames: ["sessionid", "phpsessid", "jsessionid", "aspnetsessionid"]
  },
  
  // Value validation
  value: {
    maxLength: 4096,
    allowedChars: /^[a-zA-Z0-9._~!@#$%^&*()+=\-\[\]{}|\\;:,<>?\/]/,
    forbiddenPatterns: [/<script/i, /javascript:/i, /data:/i]
  },
  
  // Domain validation
  domain: {
    allowedDomains: [".factory-wager.com", ".api.factory-wager.com", ".cdn.factory-wager.com"],
    requireSecure: true,
    enforceSubdomains: true
  },
  
  // Path validation
  path: {
    allowedPaths: ["/", "/api", "/auth", "/registry", "/cdn", "/monitoring"],
    enforceTrailingSlash: true,
    preventDirectoryTraversal: true
  },
  
  // Expiration validation
  expiration: {
    minMaxAge: 60, // 1 minute
    maxMaxAge: 86400 * 365, // 1 year
    requireExpirationFor: ["session", "security_token"]
  },
  
  // Security validation
  security: {
    requireSecureFor: ["session", "security_token", "csrf"],
    requireHttpOnlyFor: ["session", "security_token", "csrf"],
    requireSameSiteStrictFor: ["session", "security_token"]
  }
};

// Cookie governance policies
export const COOKIE_GOVERNANCE_POLICIES = {
  // Data retention policies
  retention: {
    session: "1 hour",
    preferences: "30 days",
    security: "7 days",
    analytics: "1 year",
    audit: "90 days"
  },
  
  // Consent policies
  consent: {
    required: ["analytics"],
    optional: ["preferences"],
    essential: ["session", "security"]
  },
  
  // Privacy policies
  privacy: {
    dataMinimization: true,
    purposeLimitation: true,
    storageLimitation: true,
    accessLimitation: true
  },
  
  // Compliance policies
  compliance: {
    gdpr: true,
    ccpa: true,
    hipaa: false,
    sox: false
  },
  
  // Audit policies
  audit: {
    logging: true,
    monitoring: true,
    reporting: true,
    review: "quarterly"
  }
};

// Export all configurations
export default {
  DOMAIN_CONFIG,
  BUCKET_CONFIG,
  SECURITY_HEADERS,
  GOVERNANCE_HEADERS,
  COOKIE_CONFIG,
  DOMAIN_COOKIE_POLICIES,
  ENDPOINT_COOKIE_CONFIG,
  COOKIE_VALIDATION_RULES,
  COOKIE_GOVERNANCE_POLICIES
};
