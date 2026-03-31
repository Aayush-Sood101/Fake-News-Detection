import Redis from "ioredis";
import logger from "../utils/logger.js";

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
}

export const cacheMiddleware = (duration = 300) => async (req, res, next) => {
  if (!redis || req.method !== "GET") {
    next();
    return;
  }

  const key = `cache:${req.originalUrl}:${req.user?.id || "anon"}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }
  } catch (error) {
    logger.warn("Cache read error", { error: error.message });
  }

  const originalJson = res.json.bind(res);
  res.json = (data) => {
    redis
      .setex(key, duration, JSON.stringify(data))
      .catch((error) => logger.warn("Cache write error", { error: error.message }));
    return originalJson(data);
  };

  next();
};

export const invalidateCache = async (pattern) => {
  if (!redis) {
    return;
  }

  const keys = await redis.keys(`cache:${pattern}`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
