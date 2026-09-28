const mongoose = require("mongoose");

/**
 * Shared MongoDB Rate Limit Store (L-4)
 * Stores rate-limit counters in MongoDB so limits persist across server restarts
 * and are shared across multiple instances (e.g. Render scaling).
 * Gracefully falls back to local memory if MongoDB is temporarily unavailable.
 */
class MongoRateLimitStore {
  constructor(windowMs, prefix = "rl:") {
    this.windowMs = windowMs;
    this.prefix = prefix;
    this.memoryFallback = new Map();
  }

  init(options) {
    if (options && options.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.windowMs);

    // 1. If MongoDB is connected, atomically record hit in DB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const RateLimit = require("../models/RateLimit");

        // Try to atomically increment an active window
        const doc = await RateLimit.findOneAndUpdate(
          { key: fullKey, resetTime: { $gt: now } },
          { $inc: { hits: 1 } },
          { new: true }
        );

        if (doc) {
          return { totalHits: doc.hits, resetTime: doc.resetTime };
        }

        // Active window not found or expired; start a new window
        const newDoc = await RateLimit.findOneAndUpdate(
          { key: fullKey },
          {
            $set: {
              hits: 1,
              resetTime,
              expiresAt: new Date(resetTime.getTime() + 60000), // 1-min safety margin for TTL
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return { totalHits: newDoc.hits, resetTime: newDoc.resetTime };
      } catch (err) {
        console.error("[MONGO RATE LIMIT STORE ERROR]:", err.message);
        // Fall back to memory on DB transient failure
      }
    }

    // 2. In-memory fallback
    const mem = this.memoryFallback.get(fullKey);
    if (mem && mem.resetTime > now) {
      mem.hits += 1;
      return { totalHits: mem.hits, resetTime: mem.resetTime };
    }

    const newMem = { hits: 1, resetTime };
    this.memoryFallback.set(fullKey, newMem);
    return { totalHits: newMem.hits, resetTime: newMem.resetTime };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const RateLimit = require("../models/RateLimit");
        await RateLimit.updateOne(
          { key: fullKey, hits: { $gt: 0 } },
          { $inc: { hits: -1 } }
        );
      } catch (err) {}
    }
    const mem = this.memoryFallback.get(fullKey);
    if (mem && mem.hits > 0) {
      mem.hits -= 1;
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const RateLimit = require("../models/RateLimit");
        await RateLimit.deleteOne({ key: fullKey });
      } catch (err) {}
    }
    this.memoryFallback.delete(fullKey);
  }
}

module.exports = MongoRateLimitStore;
