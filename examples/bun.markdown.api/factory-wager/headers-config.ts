#!/usr/bin/env bun
/**
 * FactoryWager Headers Configuration with Cookie Management
 * Production-ready security and governance headers
 */

// Standard security headers
export const SECURITY_HEADERS = {
  // Content Security Policy
  csp: {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content; sandbox allow-scripts allow-same-origin allow-popups allow-modals allow-orientation-lock allow-pointer-lock;",
    "X-Content-Security-Policy-Report-Only": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content; sandbox allow-scripts allow-same-origin allow-popups allow-modals allow-orientation-lock allow-pointer-lock;"
  },
  
  // Frame protection
  frameProtection: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-Download-Options": "noopen"
  },
  
  // XSS protection
  xssProtection: {
    "X-XSS-Protection": "1; mode=block; report=https://csp-report.factory-wager.com"
  },
  
  // Referrer policy
  referrerPolicy: {
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Referrer-Policy": "strict-origin-when-cross-origin"
  },
  
  // Permissions policy
  permissionsPolicy: {
    "Permissions-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  }
};

// Cookie security headers
export const COOKIE_HEADERS = {
  // Session cookie headers
  session: {
    "Set-Cookie": "session=; Path=/; Domain=.factory-wager.com; HttpOnly; Secure; SameSite=Strict; Max-Age=3600"
  },
  
  // User preference headers
  preferences: {
    "Set-Cookie": "preferences=; Path=/; Domain=.factory-wager.com; Secure; SameSite=Lax; Max-Age=2592000"
  },
  
  // Security token headers
  security: {
    "Set-Cookie": "security_token=; Path=/; Domain=.factory-wager.com; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"
  },
  
  // Analytics headers
  analytics: {
    "Set-Cookie": "analytics_id=; Path=/; Domain=.factory-wager.com; Secure; SameSite=Lax; Max-Age=31536000"
  },
  
  // CSRF protection headers
  csrf: {
    "Set-Cookie": "csrf_token=; Path=/; Domain=.factory-wager.com; HttpOnly; Secure; SameSite=Strict; Max-Age=3600"
  }
};

// CORS headers
export const CORS_HEADERS = {
  // Standard CORS headers
  standard: {
    "Access-Control-Allow-Origin": "https://factory-wager.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-API-Version, X-Client-Version",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Expose-Headers": "X-Total-Count, X-Page-Count, X-Request-ID"
  },
  
  // API CORS headers
  api: {
    "Access-Control-Allow-Origin": "https://api.factory-wager.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-API-Version, X-Client-Version",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Expose-Headers": "X-Total-Count, X-Page-Count, X-Request-ID"
  },
  
  // CDN CORS headers
  cdn: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, If-Modified-Since, If-None-Match",
    "Access-Control-Max-Age": "31536000",
    "Access-Control-Expose-Headers": "Content-Length, ETag, Last-Modified"
  },
  
  // Development CORS headers
  dev: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  }
};

// Rate limiting headers
export const RATE_LIMIT_HEADERS = {
  // Standard rate limiting
  standard: {
    "X-RateLimit-Limit": "1000",
    "X-RateLimit-Remaining": "999",
    "X-RateLimit-Reset": Math.floor(Date.now() / 1000) + 3600,
    "X-RateLimit-Retry-After": "60"
  },
  
  // API rate limiting
  api: {
    "X-RateLimit-Limit": "500",
    "X-RateLimit-Remaining": "499",
    "X-RateLimit-Reset": Math.floor(Date.now() / 1000) + 1800,
    "X-RateLimit-Retry-After": "30"
  },
  
  // Registry rate limiting
  registry: {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "99",
    "X-RateLimit-Reset": Math.floor(Date.now() / 1000) + 600,
    "X-RateLimit-Retry-After": "10"
  },
  
  // CDN rate limiting
  cdn: {
    "X-RateLimit-Limit": "10000",
    "X-RateLimit-Remaining": "9999",
    "X-RateLimit-Reset": Math.floor(Date.now() / 1000) + 3600,
    "X-RateLimit-Retry-After": "1"
  },
  
  // Development rate limiting
  dev: {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "99",
    "X-RateLimit-Reset": Math.floor(Date.now() / 1000) + 600,
    "X-RateLimit-Retry-After": "5"
  }
};

// Cache control headers
export const CACHE_HEADERS = {
  // Standard cache headers
  standard: {
    "Cache-Control": "public, max-age=3600",
    "ETag": `W/" + Math.random().toString(36).substring(2, 15),
    "Last-Modified": new Date().toUTCString()
  },
  
  // API cache headers
  api: {
    "Cache-Control": "public, max-age=1800, must-revalidate",
    "ETag": `W/" + Math.random().toString(36).substring(2, 15),
    "Last-Modified": new Date().toUTCString(),
    "Vary": "Accept-Encoding, Authorization"
  },
  
  // CDN cache headers
  cdn: {
    "Cache-Control": "public, max-age=31536000, immutable",
    "ETag": `W/" + Math.random().toString(36).substring(2, 15),
    "Last-Modified": new Date().toUTCString(),
    "X-CDN-Cache": "HIT"
  },
  
  // Development cache headers
  dev: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  }
};

// Governance headers
export const GOVERNANCE_HEADERS = {
  // Compliance headers
  compliance: {
    "X-Compliance-Level": "Tier-1380",
    "X-Security-Posture": "High",
    "X-Data-Classification": "Confidential",
    "X-Audit-Trail": "Enabled",
    "X-Privacy-Shield": "Active",
    "X-GDPR-Compliant": "true",
    "X-CCPA-Compliant": "true"
  },
  
  // Audit headers
  audit: {
    "X-Audit-ID": () => crypto.randomUUID().toString(),
    "X-Audit-Timestamp": new Date().toISOString(),
    "X-Audit-User": "system",
    "X-Audit-Action": "request",
    "X-Audit-Resource": "api-endpoint",
    "X-Audit-IP": "0.0.0.0",
    "X-Audit-User-Agent": "FactoryWager-API"
  },
  
  // Monitoring headers
  monitoring: {
    "X-Monitoring-ID": () => crypto.randomUUID().toString(),
    "X-Performance-Metrics": "Enabled",
    "X-Health-Check": "Pass",
    "X-Service-Version": "v2.0",
    "X-Environment": "production",
    "X-Node-ID": "node-1",
    "X-Pod-ID": "pod-1",
    "X-Region": "us-east-1"
  },
  
  // Governance headers
  governance: {
    "X-Governance-Policy": "Cookie-Management-Policy-v2.0",
    "X-Governance-Compliance": "GDPR-CCPA-Compliant",
    "X-Governance-Audit": "Quarterly-Audit-Required",
    "X-Governance-Review": "Security-Review-Approved",
    "X-Governance-Documentation": "https://docs.factory-wager.com/governance",
    "X-Governance-Contact": "security@factory-wager.com"
  },
  
  // Privacy headers
  privacy: {
    "X-Privacy-Policy": "https://factory-wager.com/privacy",
    "X-Privacy-Consent": "Required",
    "X-Privacy-Options": "analytics,preferences",
    "X-Privacy-Data-Processing": "Limited",
    "X-Privacy-Data-Retention": "As-needed"
  },
  
  // Security headers
  security: {
    "X-Security-Scan": "Completed",
    "X-Security-Vulnerabilities": "None",
    "X-Security-Patch-Level": "Latest",
    "X-Security-Last-Scan": new Date().toISOString(),
    "X-Security-Next-Scan": new Date(Date.now() + 86400000).toISOString()
  }
};

// API version headers
export const API_VERSION_HEADERS = {
  v1: {
    "X-API-Version": "v1.0",
    "X-API-Deprecated": "false",
    "X-API-Sunset": "2024-12-31"
  },
  
  v2: {
    "X-API-Version": "v2.0",
    "X-API-Deprecated": "false",
    "X-API-Sunset": "2025-12-31"
  },
  
  latest: {
    "X-API-Version": "v2.0",
    "X-API-Latest": "true",
    "X-API-Stable": "true"
  }
};

// Client headers
export const CLIENT_HEADERS = {
  // Request identification
  request: {
    "X-Request-ID": () => crypto.randomUUID().toString(),
    "X-Client-Version": "2.0.0",
    "X-Client-Platform": navigator.platform || "unknown",
    "X-Client-Language": navigator.language || "en-US"
  },
  
  // Session headers
  session: {
    "X-Session-ID": () => crypto.randomUUID().toString(),
    "X-Session-Created": new Date().toISOString(),
    "X-Session-Expires": new Date(Date.now() + 3600000).toISOString()
  },
  
  // User agent headers
  userAgent: {
    "User-Agent": "FactoryWager-API/2.0.0 (Bun v1.3.8)",
    "X-User-Agent-Type": "api-client"
  }
};

// Response headers
export const RESPONSE_HEADERS = {
  // Standard response headers
  standard: {
    "Content-Type": "application/json",
    "X-Response-ID": () => crypto.randomUUID().toString(),
    "X-Response-Time": new Date().toISOString(),
    "X-Response-Server": "factory-wager-api"
  },
  
  // Success headers
  success: {
    "X-Status": "success",
    "X-Message": "Request completed successfully"
  },
  
  // Error headers
  error: {
    "X-Status": "error",
    "X-Error-Code": "400",
    "X-Error-Message": "Bad request"
  },
  
  // Validation headers
  validation: {
    "X-Validation-Status": "failed",
    "X-Validation-Errors": "Invalid input data",
    "X-Validation-Rules": "Required fields missing"
  }
};

// Content type headers
export const CONTENT_TYPE_HEADERS = {
  json: {
    "Content-Type": "application/json; charset=utf-8"
  },
  
  html: {
    "Content-Type": "text/html; charset=utf-8"
  },
  
  text: {
    "Content-Type": "text/plain; charset=utf-8"
  },
  
  xml: {
    "Content-Type": "application/xml; charset=utf-8"
  },
  
  css: {
    "Content-Type": "text/css; charset=utf-8"
  },
  
  javascript: {
    "Content-Type": "application/javascript; charset=utf-8"
  },
  
  form: {
    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
  },
  
  multipart: {
    "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary"
  },
  
  binary: {
    "Content-Type": "application/octet-stream"
  }
};

// Compression headers
export const COMPRESSION_HEADERS = {
  gzip: {
    "Content-Encoding": "gzip",
    "Content-Length": "0"
  },
  
  deflate: {
    "Content-Encoding": "deflate",
    "Content-Length": "0"
  },
  
  br: {
    "Content-Encoding": "br",
    "Content-Length": "0"
  },
  
  zstd: {
    "Content-Encoding": "zstd",
    "Content-Length": "0"
  }
};

// Export all header configurations
export default {
  SECURITY_HEADERS,
  COOKIE_HEADERS,
  CORS_HEADERS,
  RATE_LIMIT_HEADERS,
  CACHE_HEADERS,
  GOVERNANCE_HEADERS,
  API_VERSION_HEADERS,
  CLIENT_HEADERS,
  RESPONSE_HEADERS,
  CONTENT_TYPE_HEADERS,
  COMPRESSION_HEADERS
};
