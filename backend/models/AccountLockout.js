const mongoose = require("mongoose");

const accountLockoutSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
      index: true,
    },
    lockCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFailedAt: {
      type: Date,
      default: null,
    },
    lastAlertSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "AccountLockouts",
  }
);

module.exports = mongoose.model("AccountLockout", accountLockoutSchema);
