#!/usr/bin/env bun
/**
 * FactoryWager Cookie Types and Interfaces
 * Enhanced cookie management with full TypeScript support
 */

export interface CookieInit {
  name?: string;
  value?: string;
  domain?: string;
  /** Defaults to '/'. To allow the browser to set the path, use an empty string. */
  path?: string;
  expires?: number | Date | string;
  secure?: boolean;
  /** Defaults to `lax`. */
  sameSite?: CookieSameSite;
  httpOnly?: boolean;
  partitioned?: boolean;
  maxAge?: number;
}

export interface CookieStoreDeleteOptions {
  name: string;
  domain?: string | null;
  path?: string;
}

export interface CookieStoreGetOptions {
  name?: string;
  url?: string;
}

export type CookieSameSite = "strict" | "lax" | "none";

/**
 * Enhanced Cookie class with full TypeScript support
 * Implements Bun's Cookie API with additional features
 */
export class Cookie {
  readonly name: string;
  value: string;
  domain?: string;
  path: string;
  expires?: Date;
  secure: boolean;
  sameSite: CookieSameSite;
  partitioned: boolean;
  maxAge?: number;
  httpOnly: boolean;

  constructor(name: string, value: string, options?: CookieInit);
  constructor(cookieString: string);
  constructor(cookieObject?: CookieInit);

  /**
   * Check if the cookie is expired
   * @returns true if the cookie is expired, false otherwise
   */
  isExpired(): boolean;

  /**
   * Serialize the cookie to a string
   * @returns The cookie string in Set-Cookie header format
   */
  serialize(): string;

  /**
   * Serialize the cookie to a string (alias for serialize)
   * @returns The cookie string in Set-Cookie header format
   */
  toString(): string;

  /**
   * Serialize the cookie to a JSON object
   * @returns CookieInit object representation
   */
  toJSON(): CookieInit;

  /**
   * Parse a cookie string into a Cookie object
   * @param cookieString - The cookie string to parse
   * @returns Parsed Cookie object
   */
  static parse(cookieString: string): Cookie;

  /**
   * Create a new cookie from name and value with optional options
   * @param name - Cookie name
   * @param value - Cookie value
   * @param options - Cookie options
   * @returns New Cookie instance
   */
  static from(name: string, value: string, options?: CookieInit): Cookie;
}

/**
 * Enhanced CookieMap class with full TypeScript support
 * Implements Map-like interface for cookie management
 */
export class CookieMap implements Iterable<[string, string]> {
  readonly size: number;

  constructor(init?: string[][] | Record<string, string> | string);

  /**
   * Get a cookie value by name
   * @param name - Cookie name
   * @returns Cookie value or null if not found
   */
  get(name: string): string | null;

  /**
   * Generate Set-Cookie headers for all cookies
   * @returns Array of Set-Cookie header strings
   */
  toSetCookieHeaders(): string[];

  /**
   * Check if a cookie exists
   * @param name - Cookie name
   * @returns true if cookie exists, false otherwise
   */
  has(name: string): boolean;

  /**
   * Set a cookie value
   * @param name - Cookie name
   * @param value - Cookie value
   * @param options - Cookie options
   */
  set(name: string, value: string, options?: CookieInit): void;

  /**
   * Set a cookie using CookieInit object
   * @param options - Cookie options including name and value
   */
  set(options: CookieInit): void;

  /**
   * Delete a cookie by name
   * @param name - Cookie name
   */
  delete(name: string): void;

  /**
   * Delete a cookie with options
   * @param options - Cookie deletion options
   */
  delete(options: CookieStoreDeleteOptions): void;

  /**
   * Delete a cookie with name and options (overload)
   * @param name - Cookie name
   * @param options - Cookie deletion options without name
   */
  delete(name: string, options: Omit<CookieStoreDeleteOptions, "name">): void;

  /**
   * Convert cookie map to JSON object
   * @returns Object representation of cookies
   */
  toJSON(): Record<string, string>;

  /**
   * Get iterator for cookie entries
   * @returns IterableIterator of [key, value] pairs
   */
  entries(): IterableIterator<[string, string]>;

  /**
   * Get iterator for cookie keys
   * @returns IterableIterator of cookie names
   */
  keys(): IterableIterator<string>;

  /**
   * Get iterator for cookie values
   * @returns IterableIterator of cookie values
   */
  values(): IterableIterator<string>;

  /**
   * Execute callback for each cookie
   * @param callback - Function to execute for each entry
   */
  forEach(callback: (value: string, key: string, map: CookieMap) => void): void;

  /**
   * Default iterator for for...of loops
   * @returns IterableIterator of [key, value] pairs
   */
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

/**
 * Enhanced CookieStore interface with full TypeScript support
 */
export interface CookieStore {
  get(options?: CookieStoreGetOptions): Promise<string | undefined>;
  set(options: CookieInit): Promise<void>;
  delete(options: CookieStoreDeleteOptions): Promise<void>;
}

/**
 * Cookie parsing utilities
 */
export class CookieParser {
  /**
   * Parse cookie string into Map with enhanced error handling
   * @param header - Cookie header string
   * @returns Map of cookie key-value pairs
   */
  static parse(header: string): Map<string, string> {
    const pairs = decodeURIComponent(header).split(";").map(p => p.trim().split("="));
    const map = new Map();
    for (const pair of pairs) {
      if (pair.length >= 2) {
        const key = pair[0].trim();
        const val = decodeURIComponent(pair.slice(1).join("=").trim().replace(/^"|"$/g, ""));
        map.set(key, val);
      }
    }
    return map;
  }

  /**
   * Parse cookie string into CookieMap with enhanced features
   * @param header - Cookie header string
   * @returns CookieMap instance
   */
  static parseToCookieMap(header: string): CookieMap {
    const map = this.parse(header);
    const cookieMap = new CookieMap();
    for (const [key, value] of map) {
      cookieMap.set(key, value);
    }
    return cookieMap;
  }

  /**
   * Parse cookie string into array of key-value pairs
   * @param header - Cookie header string
   * @returns Array of [key, value] pairs
   */
  static parseToArray(header: string): [string, string][] {
    return Array.from(this.parse(header));
  }

  /**
   * Validate cookie string format
   * @param header - Cookie header string
   *returns true if valid, false otherwise
   */
  static isValid(header: string): boolean {
    try {
      this.parse(header);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract cookie names from header
   * @param header - Cookie header string
   * @returns Array of cookie names
   */
  static getCookieNames(header: string): string[] {
    const map = this.parse(header);
    return Array.from(map.keys());
  }

  /**
   * Extract cookie values from header
   * @param header - Cookie header string
   * @returns Array of cookie values
   */
  static getCookieValues(header: string): string[] {
    const map = this.parse(header);
    return Array.from(map.values());
  }
}

/**
 * Cookie security utilities
 */
export class CookieSecurity {
  /**
   * Check if cookie is secure (HTTPS only)
   * @param cookie - Cookie object
   * @returns true if secure, false otherwise
   */
  static isSecure(cookie: Cookie): boolean {
    return cookie.secure === true;
  }

  /**
   * Check if cookie is HTTP-only
   * @param cookie - Cookie object
   * @returns true if HTTP-only, false otherwise
   */
  static isHttpOnly(cookie: Cookie): boolean {
    return cookie.httpOnly === true;
  }

  /**
   * Check if cookie has SameSite policy
   * @param cookie - Cookie object
   @param policy - SameSite policy to check
   @returns true if matches, false otherwise
   */
  static hasSameSite(cookie: Cookie, policy: CookieSameSite): boolean {
    return cookie.sameSite === policy;
  }

  /**
   * Check if cookie is partitioned (CHIPS)
   * @param cookie - Cookie object
   @returns true if partitioned, false otherwise
   */
  static isPartitioned(cookie: Cookie): boolean {
    return cookie.partitioned === true;
  }

  /**
   * Validate cookie security settings
   * @param cookie - Cookie object
   @returns Security score (0-100)
   */
  static getSecurityScore(cookie: Cookie): number {
    let score = 0;
    
    if (this.isSecure(cookie)) score += 25;
    if (this.isHttpOnly(cookie)) score += 25;
    if (this.hasSameSite(cookie, 'strict')) score += 25;
    if (this.isPartitioned(cookie)) score += 25;
    
    return score;
  }
}

/**
 * Cookie performance utilities
 */
export class CookiePerformance {
  /**
   * Benchmark cookie parsing performance
   * @param iterations - Number of iterations to run
   @param cookieString - Cookie string to parse
   *returns Performance metrics
   */
  static benchmarkParsing(iterations: number, cookieString: string): { time: number; opsPerSec: number } {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      CookieParser.parse(cookieString);
    }
    
    const time = performance.now() - start;
    const opsPerSec = Math.round(iterations / (time / 1000));
    
    return { time, opsPerSec };
  }

  /**
   * Benchmark CookieMap operations
   * @param iterations - Number of iterations to run
   @param operations - Operations to benchmark
   *returns Performance metrics
   */
  static benchmarkCookieMap(iterations: number, operations: string[]): { [key: string]: number } {
    const results: [key: string]: number = {};
    
    for (const op of operations) {
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const map = new CookieMap();
        switch (op) {
          case 'get':
            map.get('test');
            break;
          case 'set':
            map.set('test', 'value');
            break;
          case 'has':
            map.has('test');
            break;
          case 'delete':
            map.delete('test');
            break;
          case 'toJSON':
            map.toJSON();
            break;
          case 'entries':
            Array.from(map.entries());
            break;
        }
      }
      
      const time = performance.now() - start;
      results[op] = time;
    }
    
    return results;
  }
}

/**
 * Cookie validation utilities
 */
export class CookieValidator {
  /**
   * Validate cookie name according to RFC 6265
   @param name - Cookie name to validate
   @returns true if valid, false otherwise
   */
  static isValidName(name: string): boolean {
    // RFC 6265: cookie-name = token *( "=" * token)
    // token = 1*<any CHAR, except CTLs or separators>
    const namePattern = /^[^\x00-\x20\x7F]*$/;
    const separators = ['\x09', '\x20-\x2F', '\x3B-\x40', '\x5B-\x60', '\x7B-\x7E'];
    
    return namePattern.test(name) && !separators.some(sep => name.includes(sep));
  }

  /**
   * Validate cookie value according to RFC 6265
   * @param value - Cookie value to validate
   * @returns true if valid, false otherwise
   */
  static isValidValue(value: string): boolean {
    // RFC 6265: cookie-value = *cookie-value or cookie-version
    // cookie-value = *any US-ASCII characters except CTLs, space, or tab
    // cookie-version = *any CHAR, except separators, CTLs, or whitespace
    const valuePattern = /^[\x21\x23-\x7E]*$/;
    return valuePattern.test(value);
  }

  /**
   * Validate cookie string format
   * @param cookieString - Cookie string to validate
   @returns Validation result with errors
   */
  static validateCookieString(cookieString: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!cookieString.includes('=')) {
      errors.push('Cookie string must contain at least one "=" character');
    }
    
    const pairs = cookieString.split(';');
    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (trimmed && !trimmed.includes('=')) {
        errors.push(`Invalid cookie pair: "${trimmed}" (missing "=")`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Cookie utilities for common operations
 */
export class CookieUtils {
  /**
   * Create a session cookie with default settings
   * @param sessionId - Session identifier
   * @param options - Additional cookie options
   * @returns Cookie object
   */
  static createSessionCookie(sessionId: string, options?: Partial<CookieInit>): Cookie {
    const defaultOptions: CookieInit = {
      name: 'session',
      value: sessionId,
      path: '/',
      maxAge: 3600, // 1 hour
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    };
    
    return new Cookie(sessionId, defaultOptions, { ...options });
  }

  /**
   * Create a preference cookie
   * @param key - Preference key
   * @param value - Preference value
   * @param options - Additional cookie options
   * @returns Cookie object
   */
  static createPreferenceCookie(key: string, value: string, options?: Partial<CookieInit>): Cookie {
    const defaultOptions: CookieInit = {
      name: key,
      value: value,
      path: '/',
      maxAge: 86400 * 30, // 30 days
      httpOnly: false,
      secure: true,
      sameSite: 'lax'
    };
    
    return new Cookie(key, defaultOptions, { ...options });
  }
  
  /**
   * Create a security cookie
   * @param name - Security cookie name
   * @param value - Security cookie value
   * @param options - Additional cookie options
   * @returns Cookie object
   */
  static createSecurityCookie(name: string, value: string, options?: Partial<CookieInit>): Cookie {
    const defaultOptions: CookieInit = {
      name: name,
      value: value,
      path: '/',
      maxAge: 86400 * 7, // 7 days
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    };
    
    return new Cookie(name, defaultOptions, { ...options });
  }

  /**
   * Merge multiple cookie strings
   * @param cookieStrings - Array of cookie strings
   * @returns Merged cookie string
   */
  static mergeCookieStrings(cookieStrings: string[]): string {
    const cookieMap = new Map<string, string>();
    
    for (const cookieString of cookieStrings) {
      const pairs = CookieParser.parse(cookieString);
      for (const [key, value] of pairs) {
        cookieMap.set(key, value);
      }
    }
    
    return Array.from(cookieMap)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  /**
   * Filter cookies by domain
   * @param cookies - Array of Cookie objects
   * @param domain - Domain to filter by
   @returns Filtered array of cookies
   */
  static filterByDomain(cookies: Cookie[], domain: string): Cookie[] {
    return cookies.filter(cookie => 
      !cookie.domain || cookie.domain === domain
    );
  }

  /**
   * Filter cookies by path
   * @param cookies - Array of Cookie objects
   * @param path - Path to filter by
   @returns Filtered array of cookies
   */
  static filterByPath(cookies: Cookie[], path: string): Cookie[] {
    return cookies.filter(cookie => 
      cookie.path === path || cookie.path === '/'
    );
  }

  /**
   * Get cookies that are about to expire
   * @param cookies - Array of Cookie objects
   @param thresholdMinutes - Minutes before expiration to consider "about to expire"
   @returns Array of cookies about to expire
   */
  static getExpiringCookies(cookies: Cookie[], thresholdMinutes: number = 5): Cookie[] {
    const now = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    
    return cookies.filter(cookie => {
      if (cookie.expires) {
        const expiresTime = cookie.expires instanceof Date ? cookie.expires.getTime() : new Date(cookie.expires).getTime();
        return expiresTime - now <= thresholdMs;
      }
      return false;
    });
  }
}

// Export all types and classes for easy importing
export default {
  Cookie,
  CookieMap,
  CookieParser,
  CookieSecurity,
  CookiePerformance,
  CookieValidator,
  CookieUtils,
  CookieInit,
  CookieStoreDeleteOptions,
  CookieStoreGetOptions,
  CookieSameSite
};
