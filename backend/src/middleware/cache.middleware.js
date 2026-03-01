const cache = require('../utils/cache');

/**
 * Express middleware factory: caches GET responses for `ttl` seconds.
 *
 * Usage:
 *   router.get('/products', cacheResponse(120), productController.getAllProducts)
 *
 * Cache key is derived from the full URL including query string, so different
 * filter/pagination combinations get separate cache entries.
 *
 * Cache is automatically bypassed for:
 *   - Non-GET requests
 *   - Authenticated requests where personalisation matters (pass skipAuth: true)
 */
const cacheResponse = (ttlSeconds = 60, { skipAuth = false } = {}) =>
  (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Skip caching for authenticated users if skipAuth is set
    if (skipAuth && req.headers.authorization) return next();

    const key = `route:${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // Intercept res.json to store the response in cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, body, ttlSeconds);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };

module.exports = cacheResponse;
