import Redis from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('⚠️ [Redis] Connection failed. Using in-memory fallback cache.');
        return null;
      }
      return Math.min(times * 100, 1000);
    },
  });

  redisClient.on('error', (err) => {
    // Suppress unhandled error log when fallback is used
    if (process.env.NODE_ENV === 'development') {
      // quiet in dev
    }
  });

  redisClient.on('connect', () => {
    console.log('✅ [Redis] Connected successfully');
  });
} catch (e) {
  console.warn('⚠️ [Redis] Failed to initialize Redis. Fallback to in-memory cache.');
}

export const cache = {
  async get(key: string): Promise<string | null> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        return await redisClient.get(key);
      } catch {
        // Fallback to memory
      }
    }
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, ttlSeconds = 3600): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
      } catch {
        // Fallback
      }
    }
    memoryCache.delete(key);
  },
};
