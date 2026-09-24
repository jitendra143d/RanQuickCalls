const redis = require('redis');
const env = require('./environment');
const logger = require('../utils/logger');

let redisClient;
let isRedisConnected = false;

// Simple promise-based In-Memory Key-Value store fallback
const memoryStore = new Map();
const memorySets = new Map();

const memoryClientFallback = {
  connect: async () => {
    logger.warn('Redis connection failed or not configured. Using in-memory fallback cache store.');
    isRedisConnected = false;
    return true;
  },
  disconnect: async () => {
    return true;
  },
  get: async (key) => {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },
  set: async (key, value, options = {}) => {
    let expiry = null;
    if (options.EX) {
      expiry = Date.now() + options.EX * 1000;
    }
    memoryStore.set(key, { value: String(value), expiry });
    return 'OK';
  },
  del: async (key) => {
    const deleted = memoryStore.delete(key);
    return deleted ? 1 : 0;
  },
  sAdd: async (key, value) => {
    if (!memorySets.has(key)) {
      memorySets.set(key, new Set());
    }
    const set = memorySets.get(key);
    const added = !set.has(String(value));
    set.add(String(value));
    return added ? 1 : 0;
  },
  sRem: async (key, value) => {
    if (!memorySets.has(key)) return 0;
    const set = memorySets.get(key);
    const removed = set.delete(String(value));
    return removed ? 1 : 0;
  },
  sMembers: async (key) => {
    if (!memorySets.has(key)) return [];
    return Array.from(memorySets.get(key));
  },
  sIsMember: async (key, value) => {
    if (!memorySets.has(key)) return 0;
    return memorySets.get(key).has(String(value)) ? 1 : 0;
  },
  keys: async (pattern) => {
    const keysArray = Array.from(memoryStore.keys());
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return keysArray.filter(key => regexPattern.test(key));
  },
  flushAll: async () => {
    memoryStore.clear();
    memorySets.clear();
    return 'OK';
  },
  on: (event, handler) => {
    // No-op for events in memory mode
  }
};

const initializeRedis = async () => {
  if (env.redisUrl) {
    try {
      redisClient = redis.createClient({
        url: env.redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries >= 3) {
              logger.warn('Redis reconnection limit reached. Falling back to memory store.');
              redisClient = memoryClientFallback;
              isRedisConnected = false;
              return new Error('Redis connection failed');
            }
            return 1000; // reconnect after 1s
          }
        }
      });

      redisClient.on('error', (err) => {
        logger.error(`Redis client error: ${err.message}`);
      });

      redisClient.on('connect', () => {
        logger.info('Connecting to Redis...');
      });

      redisClient.on('ready', () => {
        logger.info('Redis connection established successfully.');
        isRedisConnected = true;
      });

      await redisClient.connect();
    } catch (err) {
      logger.error(`Failed to connect to Redis: ${err.message}. Using in-memory fallback.`);
      redisClient = memoryClientFallback;
      await redisClient.connect();
    }
  } else {
    redisClient = memoryClientFallback;
    await redisClient.connect();
  }
  return redisClient;
};

module.exports = {
  initializeRedis,
  getClient: () => redisClient || memoryClientFallback,
  isRedisConnected: () => isRedisConnected
};
