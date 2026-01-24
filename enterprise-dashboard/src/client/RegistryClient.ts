// src/client/RegistryClient.ts
const SERVICE = "matrix-analysis";

// ============================================================================
// LRU Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: K, value: V, ttlMs: number): void {
    // Remove if exists (to update position)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data: value, expires: Date.now() + ttlMs });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  get size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// ============================================================================
// Registry Client
// ============================================================================

export class SecureRegistryClient {
  private token: string;
  private password: string;
  private registryUrl: string;
  private cache: LRUCache<string, unknown>;
  private inFlight = new Map<string, Promise<unknown>>(); // Request deduplication
  private static TTL_MS = 60 * 60 * 1000; // 1-hour cache (was 5 min)
  private static FETCH_TIMEOUT_MS = 10_000; // 10-second fetch timeout
  private static MAX_CACHE_SIZE = 1000; // LRU cache limit

  private constructor(token: string, password: string, registryUrl: string) {
    this.token = token;
    this.password = password;
    this.registryUrl = registryUrl;
    this.cache = new LRUCache(SecureRegistryClient.MAX_CACHE_SIZE);
  }

  static async create(): Promise<SecureRegistryClient> {
    const [token, password] = await Promise.all([
      Bun.secrets.get({ service: SERVICE, name: "npm-token" }),
      Bun.secrets.get({ service: SERVICE, name: "registry-password" }),
    ]);

    if (!token || !password) {
      throw new Error("Required secrets not found. Run: bun scripts/setup-secrets.ts");
    }

    const registryUrl = process.env.REGISTRY_URL ?? "https://registry.npmjs.org";

    return new SecureRegistryClient(token, password, registryUrl);
  }

  async getPackageInfo(packageName: string): Promise<unknown> {
    // Check cache first (LRU with TTL)
    const cached = this.cache.get(packageName);
    if (cached !== undefined) {
      return cached;
    }

    // Check in-flight requests (deduplication)
    const inFlightRequest = this.inFlight.get(packageName);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    // Create new request
    const fetchPromise = this.fetchFromRegistry(packageName);
    this.inFlight.set(packageName, fetchPromise);

    try {
      const data = await fetchPromise;
      this.cache.set(packageName, data, SecureRegistryClient.TTL_MS);
      return data;
    } finally {
      this.inFlight.delete(packageName);
    }
  }

  private async fetchFromRegistry(packageName: string): Promise<unknown> {
    const response = await fetch(`${this.registryUrl}/${packageName}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      signal: AbortSignal.timeout(SecureRegistryClient.FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Registry error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; maxSize: number; inFlightRequests: number } {
    return {
      ...this.cache.getStats(),
      inFlightRequests: this.inFlight.size,
    };
  }

  async getPackageVersions(packageName: string): Promise<string[]> {
    const info = (await this.getPackageInfo(packageName)) as { versions?: Record<string, unknown> };
    return Object.keys(info.versions ?? {});
  }
}
