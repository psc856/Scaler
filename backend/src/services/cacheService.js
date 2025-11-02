// Simple in-memory cache service for performance optimization
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxSize = 1000; // Prevent memory leaks
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key, value, ttl = this.defaultTTL) {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid cache key');
      }

      // Prevent memory overflow
      if (this.cache.size >= this.maxSize) {
        this.cleanup();
        if (this.cache.size >= this.maxSize) {
          // Remove oldest entries
          const oldestKey = this.cache.keys().next().value;
          this.delete(oldestKey);
        }
      }

      this.cache.set(key, value);
      this.ttl.set(key, Date.now() + ttl);
    } catch (error) {
      console.error('Cache set error:', error.message);
    }
  }

  get(key) {
    try {
      if (!key || typeof key !== 'string') {
        return null;
      }

      if (!this.cache.has(key)) return null;
      
      const expiry = this.ttl.get(key);
      if (Date.now() > expiry) {
        this.delete(key);
        return null;
      }
      
      return this.cache.get(key);
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  // Cache wrapper for functions
  async cached(key, fn, ttl = this.defaultTTL) {
    try {
      if (!key || typeof fn !== 'function') {
        throw new Error('Invalid cache key or function');
      }

      let result = this.get(key);
      if (result === null) {
        result = await fn();
        if (result !== undefined) {
          this.set(key, result, ttl);
        }
      }
      return result;
    } catch (error) {
      console.error('Cache wrapper error:', error.message);
      // Execute function without caching on error
      try {
        return await fn();
      } catch (fnError) {
        console.error('Function execution error:', fnError.message);
        return null;
      }
    }
  }

  // Generate cache key for events
  getEventsCacheKey(userEmail, start, end) {
    return `events:${userEmail}:${start}:${end}`;
  }

  // Generate cache key for AI suggestions
  getAISuggestionsCacheKey(input, userEmail) {
    return `ai:suggestions:${userEmail}:${input}`;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  if (global.cacheService?.cleanupInterval) {
    clearInterval(global.cacheService.cleanupInterval);
  }
});

const cacheService = new CacheService();
global.cacheService = cacheService;

export default cacheService;