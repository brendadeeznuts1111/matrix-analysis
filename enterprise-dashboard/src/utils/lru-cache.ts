/**
 * Shared LRU Cache with TTL Support
 * Consolidates duplicate cache implementations across the codebase
 */

interface CacheEntry<V> {
  data: V;
  expires: number;
}

/**
 * Generic LRU (Least Recently Used) cache with TTL support.
 *
 * Features:
 * - Configurable max size with LRU eviction
 * - Per-entry or default TTL
 * - Statistics for monitoring
 * - Type-safe generic implementation
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(maxSize: number, defaultTtlMs: number = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Get a value from cache, returning undefined if not found or expired.
   * Accessing a key moves it to the most-recently-used position.
   */
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

  /**
   * Set a value in cache with optional custom TTL.
   * Evicts the least-recently-used entry if at capacity.
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Remove if exists (to update position)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data: value,
      expires: Date.now() + (ttlMs ?? this.defaultTtlMs)
    });
  }

  /**
   * Check if key exists and is not expired.
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a key from cache.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics for monitoring.
   */
  getStats(): { size: number; maxSize: number; utilizationPercent: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }
}
