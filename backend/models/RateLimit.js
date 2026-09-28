const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hits: {
      type: Number,
      required: true,
      default: 1,
    },
    resetTime: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL auto-cleanup (L-4)
    },
  },
  {
    timestamps: true,
    collection: "RateLimits",
  }
);

module.exports = mongoose.model("RateLimit", rateLimitSchema);
