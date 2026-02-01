import { FactoryWagerSecureCookieManager } from '../security/secure-cookie-manager';
import { SecureDataRepository } from '../security/secure-data-repository';

/**
 * Registry Cookie Middleware for FactoryWager API
 * Integrates with Secure Cookie Manager for authentication
 */
export async function registryCookieMiddleware(req: Request): Promise<Response | null> {
  // Native Bun.CookieMap from request headers
  const cookies = new Bun.CookieMap(req.headers.get('cookie') || '');
  
  // Check registry auth
  const registryToken = cookies.get('fw_registry_token');
  if (!registryToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Validate with SecureDataRepository
  const manager = new FactoryWagerSecureCookieManager({
    signingKey: await getRegionKey(Bun.env.FACTORY_WAGER_REGION!),
    threatCheck: true,
    csrfBinding: true,
    partitionByRegion: true
  });

  const session = await manager.verifySessionCookie(
    new Bun.Cookie('fw_registry_token', registryToken),
    req
  );

  if (!session.valid) {
    // Delete invalid cookie
    cookies.delete('fw_registry_token');
    return new Response('Invalid session', { 
      status: 403,
      headers: {
        'Set-Cookie': cookies.toSetCookieHeaders().join(', ')
      }
    });
  }

  // Attach to request context
  (req as any).factorySession = session;
  
  return null; // Continue to handler
}

/**
 * Get region-specific signing key
 */
async function getRegionKey(region: string): Promise<CryptoKey> {
  const repo = new SecureDataRepository();
  
  // In production, load from secure key management
  // For now, generate a deterministic key per region
  const keySeed = `factory-wager-${region}-signing-key`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keySeed);
  
  // Derive key from seed (in production, use proper KMS)
  const derivedKey = await crypto.subtle.digest('SHA-256', keyData);
  
  return await crypto.subtle.importKey(
    'raw',
    derivedKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Enhanced middleware with threat intelligence integration
 */
export async function enhancedRegistryCookieMiddleware(req: Request): Promise<Response | null> {
  // Add threat intelligence headers for debugging
  const startTime = performance.now();
  
  const result = await registryCookieMiddleware(req);
  
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  if (result) {
    // Add timing headers for failed auth attempts
    const headers = new Headers(result.headers);
    headers.set('X-Auth-Processing-Time', processingTime.toFixed(2) + 'ms');
    headers.set('X-Factory-Region', Bun.env.FACTORY_WAGER_REGION || 'unknown');
    
    return new Response(result.body, {
      status: result.status,
      headers: headers
    });
  }
  
  // Add session info headers for successful auth
  const session = (req as any).factorySession;
  if (session) {
    const responseHeaders = new Headers();
    responseHeaders.set('X-Session-Region', session.region || 'unknown');
    responseHeaders.set('X-Auth-Processing-Time', processingTime.toFixed(2) + 'ms');
    
    // Store headers for potential response modification
    (req as any).factoryAuthHeaders = responseHeaders;
  }
  
  return null;
}

/**
 * Cookie management utilities
 */
export class RegistryCookieUtils {
  /**
   * Create registry auth cookie with proper settings
   */
  static createRegistryCookie(token: string, region?: string): Bun.Cookie {
    return new Bun.Cookie('fw_registry_token', token, {
      domain: region ? `${region}.factory-wager.internal` : 'registry.factory-wager.internal',
      path: '/api/v2',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 900, // 15 minutes for registry operations
      partitioned: true
    });
  }

  /**
   * Set authentication success cookies
   */
  static setAuthCookies(cookies: Bun.CookieMap, session: any): void {
    // Update last activity
    cookies.set('fw_last_activity', Date.now().toString(), {
      path: '/api/v2',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600
    });

    // Set session region for load balancing
    if (session.region) {
      cookies.set('fw_session_region', session.region, {
        path: '/api/v2',
        secure: true,
        httpOnly: false, // Allow JavaScript for client-side routing
        sameSite: 'strict',
        maxAge: 3600
      });
    }
  }

  /**
   * Clear all factory-wager cookies
   */
  static clearFactoryCookies(cookies: Bun.CookieMap): string[] {
    const factoryCookies = [
      'fw_registry_token',
      'fw_session',
      'fw_last_activity',
      'fw_session_region',
      'fw_csrf'
    ];

    factoryCookies.forEach(name => cookies.delete(name));
    
    return cookies.toSetCookieHeaders();
  }
}

// Usage example in Bun.serve
export const registryServerConfig = {
  routes: {
    '/api/registry/publish': async (req: Request) => {
      const unauthorized = await enhancedRegistryCookieMiddleware(req);
      if (unauthorized) return unauthorized;

      // Access validated session
      const session = (req as any).factorySession;
      
      // Get cookie map for response modifications
      const cookies = new Bun.CookieMap(req.headers.get('cookie') || '');
      
      // CookieMap auto-applies changes to response
      RegistryCookieUtils.setAuthCookies(cookies, session);
      cookies.set('last_publish', Date.now().toString());
      
      // Create response with cookie headers
      const response = new Response('Published', {
        headers: {
          'Set-Cookie': cookies.toSetCookieHeaders().join(', '),
          ...(req as any).factoryAuthHeaders && Object.fromEntries((req as any).factoryAuthHeaders.entries())
        }
      });
      
      return response;
    },

    '/api/registry/packages': async (req: Request) => {
      const unauthorized = await registryCookieMiddleware(req);
      if (unauthorized) return unauthorized;

      const session = (req as any).factorySession;
      
      return new Response(JSON.stringify({
        packages: [],
        session: {
          region: session.region,
          sessionId: session.sessionId?.substring(0, 8) + '...'
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    },

    '/api/auth/logout': async (req: Request) => {
      const cookies = new Bun.CookieMap(req.headers.get('cookie') || '');
      const clearHeaders = RegistryCookieUtils.clearFactoryCookies(cookies);
      
      return new Response('Logged out', {
        status: 200,
        headers: {
          'Set-Cookie': clearHeaders.join(', ')
        }
      });
    }
  }
};
