const AccountLockout = require("../models/AccountLockout");
const { sendBruteForceAlertEmail } = require("./sendEmail");

// Configurable thresholds via environment variables (with institutional safe defaults)
const getMaxAttempts = (lockCount = 0) => {
  if (lockCount > 0) {
    // If account was already locked before, reduce allowed attempts to 2 before next lockout
    const repeatVal = parseInt(process.env.LOGIN_ACCOUNT_REPEAT_MAX_ATTEMPTS, 10);
    return Number.isFinite(repeatVal) && repeatVal > 0 ? repeatVal : 2;
  }
  const val = parseInt(process.env.LOGIN_ACCOUNT_MAX_ATTEMPTS, 10);
  return Number.isFinite(val) && val > 0 ? val : 5;
};

const getBaseLockMinutes = () => {
  const val = parseInt(process.env.LOGIN_ACCOUNT_LOCK_MINUTES, 10);
  return Number.isFinite(val) && val > 0 ? val : 15;
};

const getBackoffMultiplier = () => {
  const val = parseFloat(process.env.LOGIN_ACCOUNT_BACKOFF_MULTIPLIER);
  return Number.isFinite(val) && val >= 1 ? val : 2;
};

const getMaxLockMinutes = () => {
  const val = parseInt(process.env.LOGIN_ACCOUNT_MAX_LOCK_MINUTES, 10);
  return Number.isFinite(val) && val > 0 ? val : 1440; // 24 hours max
};

/**
 * Checks if the given normalized email is currently locked out.
 * 
 * @param {string} normalizedEmail 
 * @returns {Promise<{ isLocked: boolean, remainingMinutes?: number, lockUntil?: Date }>}
 */
const checkAccountLock = async (normalizedEmail) => {
  if (!normalizedEmail || typeof normalizedEmail !== "string") {
    return { isLocked: false };
  }

  try {
    const record = await AccountLockout.findOne({ email: normalizedEmail.toLowerCase().trim() });
    if (!record || !record.lockUntil) {
      return { isLocked: false };
    }

    const now = Date.now();
    const lockTime = new Date(record.lockUntil).getTime();

    if (lockTime > now) {
      const remainingMinutes = Math.max(1, Math.ceil((lockTime - now) / (60 * 1000)));
      return {
        isLocked: true,
        remainingMinutes,
        lockUntil: record.lockUntil,
      };
    }

    // Lock duration expired: lazily clear the lock state
    // If more than 24 hours of inactivity since last failure, also reset lockCount to 0
    const hoursSinceLastFail = (now - new Date(record.lastFailedAt || now).getTime()) / (60 * 60 * 1000);
    const resetLockCount = hoursSinceLastFail >= 24;

    await AccountLockout.updateOne(
      { _id: record._id },
      {
        $set: {
          failedAttempts: 0,
          lockUntil: null,
          ...(resetLockCount ? { lockCount: 0 } : {}),
        },
      }
    );

    return { isLocked: false };
  } catch (err) {
    console.error("[ACCOUNT LOCKOUT CHECK ERROR]:", err.message);
    // Defense-in-depth: fail open on internal database errors so legitimate users are not permanently blocked
    return { isLocked: false };
  }
};

/**
 * Records a failed login attempt for a normalized email.
 * Applies atomic counter increments, evaluates lockout threshold,
 * calculates progressive backoff, and triggers alert if necessary.
 * 
 * @param {string} normalizedEmail 
 * @param {string} clientIp 
 * @returns {Promise<{ isLocked: boolean, failedAttempts: number, remainingMinutes?: number }>}
 */
const recordFailedLogin = async (normalizedEmail, clientIp) => {
  if (!normalizedEmail || typeof normalizedEmail !== "string") {
    return { isLocked: false, failedAttempts: 0 };
  }

  const email = normalizedEmail.toLowerCase().trim();
  const baseMinutes = getBaseLockMinutes();
  const multiplier = getBackoffMultiplier();
  const maxMinutes = getMaxLockMinutes();

  try {
    // 1. Atomic increment of failed attempts and update lastFailedAt
    const record = await AccountLockout.findOneAndUpdate(
      { email },
      {
        $inc: { failedAttempts: 1 },
        $set: { lastFailedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const currentLockCount = record.lockCount || 0;
    const maxAttempts = getMaxAttempts(currentLockCount);

    // 2. Check if failed attempts reached or exceeded the threshold
    if (record.failedAttempts >= maxAttempts) {
      const currentLockCount = record.lockCount || 0;
      
      // Calculate progressive backoff: baseMinutes * (multiplier ^ currentLockCount)
      const calculatedDuration = Math.round(baseMinutes * Math.pow(multiplier, currentLockCount));
      const effectiveMinutes = Math.min(calculatedDuration, maxMinutes);
      const lockUntil = new Date(Date.now() + effectiveMinutes * 60 * 1000);

      // Determine if an alert email should be sent (rate-limited to 1 alert per 15 minutes per account)
      const now = Date.now();
      const lastAlertTime = record.lastAlertSentAt ? new Date(record.lastAlertSentAt).getTime() : 0;
      const shouldSendAlert = !lastAlertTime || (now - lastAlertTime) >= 15 * 60 * 1000;

      // Update lockout and increment lockCount atomically
      await AccountLockout.updateOne(
        { _id: record._id },
        {
          $set: {
            lockUntil,
            ...(shouldSendAlert ? { lastAlertSentAt: new Date(now) } : {}),
          },
          $inc: { lockCount: 1 },
        }
      );

      // Send alert email asynchronously (fire-and-forget: does not block the login response)
      if (shouldSendAlert) {
        sendBruteForceAlertEmail({
          to: process.env.MAIL_USER,
          targetedEmail: email,
          failedAttempts: record.failedAttempts,
          lockDurationMinutes: effectiveMinutes,
          clientIp,
          timestamp: new Date(),
        }).catch((emailErr) => {
          console.error("[BRUTE FORCE ALERT DISPATCH FAILED]:", emailErr.message);
        });
      }

      return {
        isLocked: true,
        failedAttempts: record.failedAttempts,
        remainingMinutes: effectiveMinutes,
      };
    }

    return {
      isLocked: false,
      failedAttempts: record.failedAttempts,
    };
  } catch (err) {
    console.error("[RECORD FAILED LOGIN ERROR]:", err.message);
    return { isLocked: false, failedAttempts: 0 };
  }
};

/**
 * Resets the failed attempts and lock status upon successful login.
 * 
 * @param {string} normalizedEmail 
 */
const resetAccountLock = async (normalizedEmail) => {
  if (!normalizedEmail || typeof normalizedEmail !== "string") {
    return;
  }

  const email = normalizedEmail.toLowerCase().trim();

  try {
    await AccountLockout.updateOne(
      { email },
      {
        $set: {
          failedAttempts: 0,
          lockUntil: null,
          lockCount: 0,
        },
      }
    );
  } catch (err) {
    console.error("[RESET ACCOUNT LOCK ERROR]:", err.message);
  }
};

module.exports = {
  checkAccountLock,
  recordFailedLogin,
  resetAccountLock,
};
