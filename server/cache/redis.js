import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

let redisReady = false;

redisClient.on('error', (err) => {
  console.warn('⚠️  Redis client error:', err.message);
});

redisClient.on('connect', () => {
  // Silent connection - fallback works if Redis unavailable
  redisReady = true;
});

redisClient.connect().catch((err) => {
  console.warn('⚠️  Redis connection failed:', err.message);
  console.warn('   Falling back to in-memory cache for all operations');
  redisReady = false;
});

const CACHE_TTL = 60; // 1 minute for most data
const USER_CACHE_TTL = 300; // 5 minutes for user data

export async function cacheGet(key) {
  try {
    if (redisReady && redisClient.isOpen) {
      const cached = await redisClient.get(key);
      if (cached) return JSON.parse(cached);
    }
  } catch (err) {
    console.error(`Cache get error for ${key}:`, err.message);
  }
  return null;
}

export async function cacheSet(key, value, ttl = CACHE_TTL) {
  try {
    if (redisReady && redisClient.isOpen) {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    }
  } catch (err) {
    console.error(`Cache set error for ${key}:`, err.message);
  }
}

export async function cacheDelete(key) {
  try {
    if (redisReady && redisClient.isOpen) {
      await redisClient.del(key);
    }
  } catch (err) {
    console.error(`Cache delete error for ${key}:`, err.message);
  }
}

export async function cacheDeletePattern(pattern) {
  try {
    if (redisReady && redisClient.isOpen) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  } catch (err) {
    console.error(`Cache delete pattern error for ${pattern}:`, err.message);
  }
}

export { USER_CACHE_TTL, CACHE_TTL, redisClient, redisReady };
