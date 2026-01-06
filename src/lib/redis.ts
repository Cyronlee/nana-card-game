import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

const redis = globalForRedis.redis ?? createClient({
  url: process.env.REDIS_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Connect to Redis if not already connected
const getRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
};

export { getRedis };

