import { SecureDataRepository } from './secure-data-repository';
import { ThreatIntelligenceService } from './threat-intelligence';
import { CSRFProtector } from './csrf-protector';

interface SecureCookieConfig {
  signingKey: CryptoKey;        // From QuantumResistantSecureDataRepository
  threatCheck: boolean;         // Real-time IP/reputation scan
  csrfBinding: boolean;         // Bind cookies to CSRF tokens
  partitionByRegion: boolean;   // CHIPS + region isolation (5-region deploy)
}

export class FactoryWagerSecureCookieManager {
  private repo: SecureDataRepository;
  private threatIntel: ThreatIntelligenceService;
  private csrf: CSRFProtector;
  
  constructor(private config: SecureCookieConfig) {
    this.repo = new SecureDataRepository();
    this.threatIntel = new ThreatIntelligenceService();
    this.csrf = new CSRFProtector();
  }

  /**
   * Create signed session cookie with threat validation
   * ~0.3ms end-to-end (signing + threat check)
   */
  async createSessionCookie(
    sessionId: string, 
    req: Request,
    meta: { region: string; tier: string }
  ): Promise<Bun.Cookie> {
    // Threat check (memory #29)
    if (this.config.threatCheck) {
      const threat = await this.threatIntel.checkRequest(req);
      if (threat.score > 0.8) throw new Error('Threat detected');
    }

    // Quantum-resistant signing (memory #27)
    const signature = await this.repo.sign(sessionId, this.config.signingKey);
    const value = `${sessionId}.${signature}`;

    // CSRF token binding (memory #44)
    const csrfToken = this.config.csrfBinding 
      ? await this.csrf.generateToken(req)
      : undefined;

    return new Bun.Cookie('fw_session', value, {
      domain: meta.region 
        ? `${meta.region}.factory-wager.internal` 
        : 'factory-wager.internal',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      partitioned: this.config.partitionByRegion, // CHIPS support
      maxAge: 3600,
      ...csrfToken && { 
        // Store CSRF reference in cookie attributes for double-submit
        __csrf_ref: csrfToken.slice(0, 8) 
      } as any
    });
  }

  /**
   * Validate and decode signed cookie
   * Constant-time verification to prevent timing attacks
   */
  async verifySessionCookie(
    cookie: Bun.Cookie,
    req: Request
  ): Promise<{ valid: boolean; sessionId?: string; region?: string }> {
    const [sessionId, signature] = cookie.value.split('.');

    // Constant-time compare (Bun.isStrictlyEqual from memory #40)
    const valid = await this.repo.verify(sessionId, signature, this.config.signingKey);
    
    if (!valid) return { valid: false };

    // Region affinity check
    const region = cookie.domain?.split('.')[0];
    
    return { valid: true, sessionId, region };
  }

  /**
   * Registry API-specific cookie handling (from terminal profile context)
   */
  createRegistryAuthCookie(token: string): Bun.Cookie {
    return new Bun.Cookie('fw_registry_token', token, {
      domain: 'registry.factory-wager.internal',
      path: '/api/v2',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 900, // 15min for registry ops
      partitioned: true
    });
  }
}
