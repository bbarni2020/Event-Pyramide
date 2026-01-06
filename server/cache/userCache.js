class UserCache {
  constructor() {
    this.cache = new Map();
    this.configCache = null;
    this.configCacheTime = 0;
    this.CONFIG_TTL = 60000; // 1 minute for config
  }

  setUser(userId, userData) {
    this.cache.set(userId, { ...userData, cached_at: Date.now() });
  }

  getUser(userId) {
    const cached = this.cache.get(userId);
    if (cached) {
      return cached;
    }
    return null;
  }

  invalidateUser(userId) {
    this.cache.delete(userId);
  }

  setConfig(configData) {
    this.configCache = { ...configData, cached_at: Date.now() };
    this.configCacheTime = Date.now();
  }

  getConfig() {
    if (this.configCache && Date.now() - this.configCacheTime < this.CONFIG_TTL) {
      return this.configCache;
    }
    return null;
  }

  invalidateConfig() {
    this.configCache = null;
    this.configCacheTime = 0;
  }

  invalidateAll() {
    this.cache.clear();
    this.invalidateConfig();
  }
}

export const userCache = new UserCache();
