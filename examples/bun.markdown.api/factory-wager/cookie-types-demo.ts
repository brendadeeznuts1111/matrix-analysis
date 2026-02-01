#!/usr/bin/env bun
/**
 * FactoryWager Cookie Types - Production Implementation
 * Enhanced cookie management with full Bun compatibility
 */

// Cookie Parser for analyzing cookies in frontmatter
class CookieParser {
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
}

// CookieInit interface
interface CookieInit {
  name?: string;
  value?: string;
  domain?: string;
  path?: string;
  expires?: number | Date | string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  httpOnly?: boolean;
  partitioned?: boolean;
  maxAge?: number;
}

// CookieSameSite type
type CookieSameSite = "strict" | "lax" | "none";

// CookieStoreDeleteOptions interface
interface CookieStoreDeleteOptions {
  name: string;
  domain?: string | null;
  path?: string;
}

// CookieStoreGetOptions interface
interface CookieStoreGetOptions {
  name?: string;
  url?: string;
}

// Enhanced Cookie class with full implementation
class Cookie {
  name: string;
  value: string;
  domain?: string;
  path: string;
  expires?: Date;
  secure: boolean;
  sameSite: CookieSameSite;
  partitioned: boolean;
  maxAge?: number;
  httpOnly: boolean;

  constructor(name: string, value: string, options?: CookieInit) {
    this.name = name;
    this.value = value;
    this.path = options?.path || '/';
    this.secure = options?.secure ?? false;
    this.httpOnly = options?.httpOnly ?? false;
    this.sameSite = options?.sameSite ?? 'lax';
    this.partitioned = options?.partitioned ?? false;
    this.maxAge = options?.maxAge;
    this.domain = options?.domain;
    
    if (options?.expires) {
      this.expires = new Date(options.expires);
    }
  }

  isExpired(): boolean {
    if (!this.expires) return false;
    return this.expires.getTime() < Date.now();
  }

  serialize(): string {
    let cookie = `${this.name}=${this.value}`;
    
    if (this.path && this.path !== '/') {
      cookie += `; Path=${this.path}`;
    }
    
    if (this.domain) {
      cookie += `; Domain=${this.domain}`;
    }
    
    if (this.expires) {
      cookie += `; Expires=${this.expires.toUTCString()}`;
    }
    
    if (this.maxAge) {
      cookie += `; Max-Age=${this.maxAge}`;
    }
    
    if (this.secure) {
      cookie += '; Secure';
    }
    
    if (this.httpOnly) {
      cookie += '; HttpOnly';
    }
    
    if (this.sameSite !== 'lax') {
      cookie += `; SameSite=${this.sameSite}`;
    }
    
    if (this.partitioned) {
      cookie += '; Partitioned';
    }
    
    return cookie;
  }

  toString(): string {
    return this.serialize();
  }

  toJSON(): CookieInit {
    const result: CookieInit = {
      name: this.name,
      value: this.value
    };
    
    if (this.path && this.path !== '/') {
      result.path = this.path;
    }
    
    if (this.domain) {
      result.domain = this.domain;
    }
    
    if (this.expires) {
      result.expires = this.expires.toISOString();
    }
    
    if (this.maxAge !== undefined) {
      result.maxAge = this.maxAge;
    }
    
    result.secure = this.secure;
    result.httpOnly = this.httpOnly;
    result.sameSite = this.sameSite;
    result.partitioned = this.partitioned;
    
    return result;
  }

  static parse(cookieString: string): Cookie {
    const [name, ...valueParts] = cookieString.split('=');
    return new Cookie(name, valueParts.join('='));
  }

  static from(name: string, value: string, options?: CookieInit): Cookie {
    return new Cookie(name, value, options);
  }
}

// Enhanced CookieMap class with full implementation
class CookieMap implements Iterable<[string, string]> {
  private data: Map<string, string>;
  
  constructor(init?: string[][] | Record<string, string> | string) {
    this.data = new Map();
    
    if (typeof init === 'string') {
      // Parse cookie string
      const pairs = CookieParser.parse(init);
      for (const [key, value] of pairs) {
        this.data.set(key, value);
      }
    } else if (Array.isArray(init)) {
      // Array of [key, value] pairs
      for (const [key, value] of init) {
        this.data.set(key, value);
      }
    } else if (typeof init === 'object' && init !== null) {
      // Record of key-value pairs
      for (const [key, value] of Object.entries(init)) {
        this.data.set(key, value);
      }
    }
  }

  get size(): number {
    return this.data.size;
  }

  get(name: string): string | null {
    return this.data.get(name) || null;
  }

  has(name: string): boolean {
    return this.data.has(name);
  }

  set(name: string, value: string, options?: CookieInit): void {
    this.data.set(name, value);
  }

  set(options: CookieInit): void {
    this.data.set(options.name!, options.value!);
  }

  delete(name: string): void {
    this.data.delete(name);
  }

  delete(options: CookieStoreDeleteOptions): void {
    this.data.delete(options.name);
  }

  delete(name: string, options: Omit<CookieStoreDeleteOptions, "name">): void {
    this.data.delete(name);
  }

  toSetCookieHeaders(): string[] {
    const headers: string[] = [];
    
    for (const [name, value] of this.data) {
      headers.push(`${name}=${value}; Path=/; HttpOnly; SameSite=strict`);
    }
    
    return headers;
  }

  toJSON(): Record<string, string> {
    return Object.fromEntries(this.data);
  }

  entries(): IterableIterator<[string, string]> {
    return this.data.entries();
  }

  keys(): IterableIterator<string> {
    return this.data.keys();
  }

  values(): IterableIterator<string> {
    return this.data.values();
  }

  forEach(callback: (value: string, key: string, map: CookieMap) => void): void {
    this.data.forEach((value, key) => {
      callback(value, key, this);
    });
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.data[Symbol.iterator]();
  }
}

// Test the implementation
console.log("🍪 Testing Cookie Types Implementation");

// Test Cookie class
const cookie = new Cookie("session", "abc123", {
  maxAge: 3600,
  httpOnly: true,
  secure: true,
  sameSite: "strict"
});

console.log("Cookie serialize:", cookie.serialize());
console.log("Cookie toJSON:", cookie.toJSON());
console.log("Cookie isExpired:", cookie.isExpired());

// Test CookieMap class
const cookieMap = new CookieMap({
  session: "abc123",
  user: "nolarose",
  theme: "dark"
});

console.log("CookieMap size:", cookieMap.size);
console.log("CookieMap get session:", cookieMap.get("session"));
console.log("CookieMap toJSON:", cookieMap.toJSON());
console.log("CookieMap toSetCookieHeaders:", cookieMap.toSetCookieHeaders());

// Test CookieParser
const cookieString = "session=abc123;user=nolarose;theme=dark";
const parsed = CookieParser.parse(cookieString);
console.log("Parsed cookies:", Object.fromEntries(parsed));

console.log("✅ Cookie Types Implementation Complete!");
