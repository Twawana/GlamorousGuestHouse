// Simple in-memory cache with TTL
class SimpleCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttl = 60000) {
    const expires = Date.now() + ttl;
    this.store.set(key, { value, expires });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { 
      this.store.delete(key); 
      return null; 
    }
    return entry.value;
  }

  del(key) { 
    this.store.delete(key); 
  }

  clear() { 
    this.store.clear(); 
  }
}

module.exports = new SimpleCache();