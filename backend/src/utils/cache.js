/**
 * Lightweight in-process TTL cache.
 *
 * Why not Redis for MVP?
 *   Redis requires an extra managed service + connection overhead.
 *   For a single-process API with read-heavy product listings, a simple
 *   Map-based cache eliminates the majority of repeat DB hits at zero cost.
 *
 * When to upgrade to Redis:
 *   - Running multiple Node processes / replicas (in-process caches diverge)
 *   - Cache size grows beyond ~50 MB (memory pressure on the Node heap)
 *   - You need pub/sub, sorted sets, or distributed locking
 *
 * API:
 *   cache.get(key)           → value | null
 *   cache.set(key, value, ttlSeconds)
 *   cache.del(key)
 *   cache.delByPrefix(prefix) → invalidate groups (e.g. 'products:*')
 *   cache.flush()
 *   cache.stats()            → { size, hits, misses }
 */
class TTLCache {
  constructor() {
    this._store  = new Map(); // key → { value, expiresAt }
    this._hits   = 0;
    this._misses = 0;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) { this._misses++; return null; }
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      this._misses++;
      return null;
    }
    this._hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds = 60) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key) {
    this._store.delete(key);
  }

  // Delete all keys that start with a given prefix — used for cache busting.
  // e.g. cache.delByPrefix('products:') after creating/updating a product.
  delByPrefix(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) this._store.delete(key);
    }
  }

  flush() {
    this._store.clear();
  }

  stats() {
    return { size: this._store.size, hits: this._hits, misses: this._misses };
  }
}

// Export a single shared instance — module cache makes this a singleton
module.exports = new TTLCache();
