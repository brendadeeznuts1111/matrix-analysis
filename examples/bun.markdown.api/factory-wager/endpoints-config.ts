#!/usr/bin/env bun
/**
 * FactoryWager Endpoints Configuration with Cookie Management
 * Production-ready endpoint configurations with security headers
 */

// API endpoint configurations
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: {
      url: "/auth/login",
      method: "POST",
      description: "User authentication endpoint",
      cookies: {
        set: ["session", "security_token"],
        delete: [],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0",
        "X-Auth-Method": "password"
      },
      rateLimit: {
        requests: 5,
        window: 300000, // 5 minutes
        blockDuration: 900000 // 15 minutes
      }
    },
    
    logout: {
      url: "/auth/logout",
      method: "POST",
      description: "User logout endpoint",
      cookies: {
        set: [],
        delete: ["session", "security_token"],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    },
    
    refresh: {
      url: "/auth/refresh",
      method: "POST",
      description: "Token refresh endpoint",
      cookies: {
        set: ["session"],
        delete: [],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    },
    
    verify: {
      url: "/auth/verify",
      method: "GET",
      description: "Token verification endpoint",
      cookies: {
        set: [],
        delete: [],
        secure: true,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    }
  },
  
  // User management endpoints
  users: {
    profile: {
      url: "/users/profile",
      method: "GET",
      description: "Get user profile",
      cookies: {
        set: [],
        delete: [],
        secure: true,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    },
    
    update: {
      url: "/users/profile",
      method: "PUT",
      description: "Update user profile",
      cookies: {
        set: [],
        delete: [],
        secure: true,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    },
    
    preferences: {
      url: "/users/preferences",
      method: "GET",
      description: "Get user preferences",
      cookies: {
        set: ["preferences"],
        delete: [],
        secure: true,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    }
  },
  
  // Session management endpoints
  sessions: {
    create: {
      url: "/sessions",
      method: "POST",
      description: "Create new session",
      cookies: {
        set: ["session"],
        delete: [],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    },
    
    validate: {
      url: "/sessions/validate",
      method: "POST",
      description: "Validate session",
      cookies: {
        set: [],
        delete: [],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    },
    
    destroy: {
      url: "/sessions",
      method: "DELETE",
      description: "Destroy session",
      cookies: {
        set: [],
        delete: ["session"],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v2.0"
      }
    }
  },
  
  // Registry endpoints
  registry: {
    packages: {
      list: {
        url: "/registry/packages",
        method: "GET",
        description: "List packages",
        cookies: {
          set: [],
          delete: [],
          secure: true,
          httpOnly: false,
          sameSite: "lax"
        },
        headers: {
          "Content-Type": "application/json",
          "X-Registry-Version": "v1.0"
        }
      },
      
      get: {
        url: "/registry/packages/:name",
        method: "GET",
        description: "Get package details",
        cookies: {
          set: [],
          delete: [],
          secure: true,
          httpOnly: false,
          sameSite: "lax"
        },
        headers: {
          "Content-Type": "application/json",
          "X-Registry-Version": "v1.0"
        }
      },
      
      upload: {
        url: "/registry/packages",
        method: "POST",
        description: "Upload package",
        cookies: {
          set: ["upload_token"],
          delete: [],
          secure: true,
          httpOnly: true,
          sameSite: "strict"
        },
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Registry-Version": "v1.0"
        }
      },
      
      download: {
        url: "/registry/packages/:name/download",
        method: "GET",
        description: "Download package",
        cookies: {
          set: [],
          delete: [],
          secure: true,
          httpOnly: false,
          sameSite: "lax"
        },
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Registry-Version": "v1.0"
        }
      }
    },
    
    security: {
      scan: {
        url: "/registry/security/scan",
        method: "POST",
        description: "Security scan package",
        cookies: {
          set: ["security_token"],
          delete: [],
          secure: true,
          httpOnly: true,
          sameSite: "strict"
        },
        headers: {
          "Content-Type": "application/json",
          "X-Registry-Version": "v1.0"
        }
      },
      
      validate: {
        url: "/registry/security/validate",
        method: "POST",
        description: "Validate package security",
        cookies: {
          set: [],
          delete: [],
          secure: true,
          httpOnly: true,
          sameSite: "strict"
        },
        headers: {
          "Content-Type": "application/json",
          "X-Registry-Version": "v1.0"
        }
      }
    }
  },
  
  // CDN endpoints
  cdn: {
    assets: {
      serve: {
        url: "/cdn/assets/*",
        method: "GET",
        description: "Serve static assets",
        cookies: {
          set: ["analytics"],
          delete: [],
          secure: true,
          httpOnly: false,
          sameSite: "lax"
        },
        headers: {
          "Cache-Control": "public, max-age=31536000", // 1 year
          "X-CDN-Cache": "HIT"
        }
      }
    },
    
    purge: {
      url: "/cdn/purge",
      method: "POST",
      description: "Purge CDN cache",
      cookies: {
        set: [],
        delete: [],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-CDN-Purge": "PURGE"
      }
    }
  },
  
  // Monitoring endpoints
  monitoring: {
    health: {
      url: "/health",
      method: "GET",
      description: "Health check endpoint",
      cookies: {
        set: [],
        delete: [],
        secure: false,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Health-Check": "Pass"
      }
    },
    
    metrics: {
      url: "/metrics",
      method: "GET",
      description: "Application metrics",
      cookies: {
        set: ["analytics"],
        delete: [],
        secure: true,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Metrics-Version": "v1.0"
      }
    },
    
    alerts: {
      url: "/alerts",
      method: "GET",
      description: "System alerts",
      cookies: {
        set: [],
        delete: [],
        secure: true,
        httpOnly: true,
        sameSite: "strict"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Alerts-Version": "v1.0"
      }
    },
    
    status: {
      url: "/status",
      method: "GET",
      description: "System status",
      cookies: {
        set: [],
        delete: [],
        secure: false,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Status-Version": "v1.0"
      }
    }
  },
  
  // Development endpoints
  dev: {
    debug: {
      url: "/dev/debug",
      method: "GET",
      description: "Debug information",
      cookies: {
        set: ["debug"],
        delete: [],
        secure: false,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Mode": "Enabled"
      }
    },
    
    test: {
      url: "/dev/test",
      method: "GET",
      description: "Test endpoint",
      cookies: {
        set: ["test"],
        delete: [],
        secure: false,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Test-Mode": "Enabled"
      }
    },
    
    benchmark: {
      url: "/dev/benchmark",
      method: "GET",
      description: "Performance benchmark",
      cookies: {
        set: [],
        delete: [],
        secure: false,
        httpOnly: false,
        sameSite: "lax"
      },
      headers: {
        "Content-Type": "application/json",
        "X-Benchmark-Mode": "Enabled"
      }
    }
  }
};

// Endpoint security configurations
export const ENDPOINT_SECURITY = {
  // Authentication security
  auth: {
    requiredCookies: ["session"],
    allowedMethods: ["POST"],
    maxRequestSize: "1MB",
    rateLimiting: {
      enabled: true,
      requests: 10,
      window: 300000,
      blockDuration: 900000
    },
    cors: {
      enabled: true,
      origins: ["https://factory-wager.com"],
      credentials: true
    }
  },
  
  // User management security
  users: {
    requiredCookies: ["session"],
    allowedMethods: ["GET", "PUT"],
    maxRequestSize: "10MB",
    rateLimiting: {
      enabled: true,
      requests: 100,
      window: 60000,
      blockDuration: 300000
    },
    cors: {
      enabled: true,
      origins: ["https://factory-wager.com"],
      credentials: true
    }
  },
  
  // Registry security
  registry: {
    requiredCookies: ["session"],
    allowedMethods: ["GET", "POST", "DELETE"],
    maxRequestSize: "100MB",
    rateLimiting: {
      enabled: true,
      requests: 50,
      window: 60000,
      blockDuration: 300000
    },
    cors: {
      enabled: true,
      origins: ["https://factory-wager.com"],
      credentials: true
    }
  },
  
  // CDN security
  cdn: {
    requiredCookies: [],
    allowedMethods: ["GET", "POST"],
    maxRequestSize: "50MB",
    rateLimiting: {
      enabled: false,
      requests: 1000,
      window: 60000,
      blockDuration: 60000
    },
    cors: {
      enabled: true,
      origins: ["*"],
      credentials: false
    }
  },
  
  // Monitoring security
  monitoring: {
    requiredCookies: [],
    allowedMethods: ["GET"],
    maxRequestSize: "1MB",
    rateLimiting: {
      enabled: false,
      requests: 1000,
      window: 60000,
      blockDuration: 60000
    },
    cors: {
      enabled: true,
      origins: ["*"],
      credentials: false
    }
  },
  
  // Development security
  dev: {
    requiredCookies: [],
    allowedMethods: ["GET", "POST"],
    maxRequestSize: "10MB",
    rateLimiting: {
      enabled: false,
      requests: 100,
      window: 60000,
      blockDuration: 60000
    },
    cors: {
      enabled: true,
      origins: ["*"],
      credentials: true
    }
  }
};

// Endpoint performance configurations
export const ENDPOINT_PERFORMANCE = {
  // Authentication performance
  auth: {
    timeout: 5000, // 5 seconds
    retries: 3,
    cache: {
      enabled: false,
      ttl: 0
    },
    compression: {
      enabled: true,
      threshold: 1024
    }
  },
  
  // User management performance
  users: {
    timeout: 10000, // 10 seconds
    retries: 2,
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    },
    compression: {
      enabled: true,
      threshold: 2048
    }
  },
  
  // Registry performance
  registry: {
    timeout: 30000, // 30 seconds
    retries: 3,
    cache: {
      enabled: true,
      ttl: 600000 // 10 minutes
    },
    compression: {
      enabled: true,
      threshold: 4096
    }
  },
  
  // CDN performance
  cdn: {
    timeout: 30000, // 30 seconds
    retries: 2,
    cache: {
      enabled: true,
      ttl: 86400000 // 24 hours
    },
    compression: {
      enabled: true,
      threshold: 1024
    }
  },
  
  // Monitoring performance
  monitoring: {
    timeout: 5000, // 5 seconds
    retries: 1,
    cache: {
      enabled: true,
      ttl: 60000 // 1 minute
    },
    compression: {
      enabled: false,
      threshold: 0
    }
  },
  
  // Development performance
  dev: {
    timeout: 30000, // 30 seconds
    retries: 1,
    cache: {
      enabled: false,
      ttl: 0
    },
    compression: {
      enabled: false,
      threshold: 0
    }
  }
};

// Endpoint monitoring configurations
export const ENDPOINT_MONITORING = {
  // Authentication monitoring
  auth: {
    metrics: ["request_count", "response_time", "error_rate", "success_rate"],
    alerts: ["high_error_rate", "slow_response_time", "authentication_failures"],
    logging: {
      enabled: true,
      level: "info",
      includeHeaders: false
    }
  },
  
  // User management monitoring
  users: {
    metrics: ["request_count", "response_time", "error_rate", "profile_updates"],
    alerts: ["high_error_rate", "slow_response_time", "profile_update_failures"],
    logging: {
      enabled: true,
      level: "info",
      includeHeaders: false
    }
  },
  
  // Registry monitoring
  registry: {
    metrics: ["request_count", "response_time", "error_rate", "package_uploads", "security_scans"],
    alerts: ["high_error_rate", "slow_response_time", "upload_failures", "security_violations"],
    logging: {
      enabled: true,
      level: "info",
      includeHeaders: false
    }
  },
  
  // CDN monitoring
  cdn: {
    metrics: ["request_count", "response_time", "cache_hit_rate", "bandwidth_usage"],
    alerts: ["high_error_rate", "slow_response_time", "cache_miss_rate"],
    logging: {
      enabled: true,
      level: "warn",
      includeHeaders: false
    }
  },
  
  // Monitoring monitoring
  monitoring: {
    metrics: ["request_count", "response_time", "system_health", "alert_count"],
    alerts: ["system_unhealthy", "alert_count_high", "monitoring_failures"],
    logging: {
      enabled: true,
      level: "error",
      includeHeaders: false
    }
  },
  
  // Development monitoring
  dev: {
    metrics: ["request_count", "response_time", "debug_calls", "test_results"],
    alerts: ["debug_errors", "test_failures", "performance_issues"],
    logging: {
      enabled: true,
      level: "debug",
      includeHeaders: true
    }
  }
};

// Export all endpoint configurations
export default {
  API_ENDPOINTS,
  ENDPOINT_SECURITY,
  ENDPOINT_PERFORMANCE,
  ENDPOINT_MONITORING
};
