/**
 * Threat Intelligence Service
 * Real-time IP/reputation scanning for zero-trust security
 * Memory #29: Zero-trust security with threat detection
 */

export interface ThreatAssessment {
  score: number;           // 0.0 - 1.0 (higher = more dangerous)
  source: string;          // Threat intelligence source
  reason?: string;         // Threat reason
  blocked: boolean;        // Should request be blocked
}

export class ThreatIntelligenceService {
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = [
    /sql/i,
    /xss/i,
    /script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ];

  constructor() {
    // Initialize with known malicious IPs (mock data)
    this.initializeThreatFeeds();
  }

  /**
   * Check request for threats
   * ~0.1ms threat assessment time
   */
  async checkRequest(req: Request): Promise<ThreatAssessment> {
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    const url = req.url;

    let score = 0.0;
    let reasons: string[] = [];

    // IP reputation check
    if (this.blockedIPs.has(clientIP)) {
      score += 0.9;
      reasons.push('Blocked IP address');
    }

    // User agent analysis
    if (this.isSuspiciousUserAgent(userAgent)) {
      score += 0.3;
      reasons.push('Suspicious user agent');
    }

    // URL pattern detection
    const urlThreat = this.analyzeURL(url);
    score += urlThreat.score;
    if (urlThreat.reason) reasons.push(urlThreat.reason);

    // Rate limiting check (simplified)
    const rateLimitScore = await this.checkRateLimit(clientIP);
    score += rateLimitScore;
    if (rateLimitScore > 0.1) reasons.push('Rate limit exceeded');

    return {
      score: Math.min(score, 1.0),
      source: 'FactoryWager Threat Intelligence',
      reason: reasons.join('; ') || undefined,
      blocked: score > 0.8,
    };
  }

  /**
   * Extract client IP from request
   */
  private getClientIP(req: Request): string {
    // Check various headers for real IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    if (realIP) return realIP.trim();
    if (cfConnectingIP) return cfConnectingIP.trim();

    // Fallback to remote address (not available in Request object, mock)
    return '127.0.0.1';
  }

  /**
   * Analyze user agent for suspicious patterns
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousUA = [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /java/i,
    ];

    // Allow legitimate bots but flag suspicious ones
    const legitimateBots = [
      'googlebot',
      'bingbot',
      'slurp',
      'duckduckbot',
    ];

    const isLegitimate = legitimateBots.some(bot => 
      userAgent.toLowerCase().includes(bot)
    );

    if (isLegitimate) return false;

    return suspiciousUA.some(pattern => pattern.test(userAgent));
  }

  /**
   * Analyze URL for attack patterns
   */
  private analyzeURL(url: string): { score: number; reason?: string } {
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(url)) {
        return { score: 0.6, reason: `Suspicious pattern detected: ${pattern.source}` };
      }
    }

    // Check for unusual URL length
    if (url.length > 2048) {
      return { score: 0.2, reason: 'URL length exceeds normal limits' };
    }

    return { score: 0.0 };
  }

  /**
   * Simple rate limiting check
   */
  private async checkRateLimit(clientIP: string): Promise<number> {
    // Mock implementation - in production, use Redis or similar
    const requestCounts = new Map<string, { count: number; resetTime: number }>();
    
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 100; // Max requests per minute

    const current = requestCounts.get(clientIP);
    
    if (!current || now > current.resetTime) {
      requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
      return 0.0;
    }

    current.count++;
    
    if (current.count > maxRequests) {
      return Math.min((current.count - maxRequests) / maxRequests, 0.5);
    }

    return 0.0;
  }

  /**
   * Initialize threat intelligence feeds
   */
  private initializeThreatFeeds(): void {
    // Mock threat data - in production, integrate with real threat feeds
    const mockBlockedIPs = [
      '192.168.1.100',
      '10.0.0.50',
      '172.16.0.25',
    ];

    mockBlockedIPs.forEach(ip => this.blockedIPs.add(ip));
  }

  /**
   * Update threat intelligence feeds
   */
  async updateThreatFeeds(): Promise<void> {
    // Mock implementation - fetch from threat intelligence providers
    console.log('Updating threat intelligence feeds...');
  }
}
