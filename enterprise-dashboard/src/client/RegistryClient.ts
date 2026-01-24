// src/client/RegistryClient.ts
import { LRUCache } from "../utils/lru-cache.ts";
import {
  DEFAULT_CACHE_TTL_MS,
  FETCH_TIMEOUT_MS,
  REGISTRY_CACHE_MAX_SIZE,
  NPM_REGISTRY_URL,
} from "../config/constants.ts";

const SERVICE = "matrix-analysis";

// ============================================================================
// Registry Client
// ============================================================================

export class SecureRegistryClient {
  private token: string;
  private password: string;
  private registryUrl: string;
  private cache: LRUCache<string, unknown>;
  private inFlight = new Map<string, Promise<unknown>>(); // Request deduplication

  private constructor(token: string, password: string, registryUrl: string) {
    this.token = token;
    this.password = password;
    this.registryUrl = registryUrl;
    this.cache = new LRUCache(REGISTRY_CACHE_MAX_SIZE, DEFAULT_CACHE_TTL_MS);
  }

  static async create(): Promise<SecureRegistryClient> {
    const [token, password] = await Promise.all([
      Bun.secrets.get({ service: SERVICE, name: "npm-token" }),
      Bun.secrets.get({ service: SERVICE, name: "registry-password" }),
    ]);

    if (!token || !password) {
      throw new Error("Required secrets not found. Run: bun scripts/setup-secrets.ts");
    }

    const registryUrl = NPM_REGISTRY_URL;

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

    // Create new request with proper cleanup
    // Use a deferred promise pattern to avoid unhandled rejections
    const fetchPromise = this.fetchFromRegistry(packageName)
      .then((data) => {
        this.cache.set(packageName, data); // Uses default TTL from config
        return data;
      })
      .finally(() => {
        this.inFlight.delete(packageName);
      });

    this.inFlight.set(packageName, fetchPromise);
    return fetchPromise;
  }

  private async fetchFromRegistry(packageName: string): Promise<unknown> {
    const response = await fetch(`${this.registryUrl}/${packageName}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
