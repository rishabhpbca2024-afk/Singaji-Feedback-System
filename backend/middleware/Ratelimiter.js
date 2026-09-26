const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// ==========================================
// GENERAL API RATE LIMIT
// ==========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Maximum 500 requests per IP

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ==========================================
// LOGIN IP RATE LIMIT
// ==========================================

// Ye poore IP ko protect karega
// Isse attacker bahut saare different accounts
// try karke limiter bypass nahi kar payega.

const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Maximum 20 login requests per IP

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many login attempts from this IP. Please try again later.",
  },

  skipSuccessfulRequests: false,
});

// ==========================================
// LOGIN ACCOUNT RATE LIMIT
// ==========================================

// Ye email + IP ke basis par limit karega
// Isliye Gmail A block hone par Gmail B block nahi hoga.

const { checkAccountLock } = require("../utils/accountLockout");

const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Outer DoS protection envelope; strict attempt threshold is managed by database-level AccountLockout

  standardHeaders: "draft-8",
  legacyHeaders: false,

  skipSuccessfulRequests: false,

  keyGenerator: (req) => {
    const email = String(req.body?.gmail || req.body?.email || "")
      .trim()
      .toLowerCase();

    const ip = ipKeyGenerator(req.ip);

    return `${email}:${ip}`;
  },

  handler: async (req, res) => {
    const email = String(req.body?.gmail || req.body?.email || "")
      .trim()
      .toLowerCase();

    const lockStatus = await checkAccountLock(email);
    const minutes = lockStatus.isLocked && lockStatus.remainingMinutes ? lockStatus.remainingMinutes : 15;
    const minutesText = minutes === 1 ? "1 minute" : `${minutes} minutes`;

    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts for this account. Please try again after ${minutesText}.`,
      remainingMinutes: minutes,
    });
  },
});

// ==========================================
// PASSWORD RESET RATE LIMIT
// ==========================================

// Prevents brute force token guessing and email flooding
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Maximum 10 password reset requests per IP per 15 minutes
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password reset requests from this IP. Please try again after 15 minutes.",
  },
});

// ==========================================
// ACTIVATION LINK RESEND RATE LIMIT
// ==========================================

// Prevents email flooding (1 request per 2 minutes per email + IP)
const activationResendLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  limit: 1, // Maximum 1 request per 2 minutes
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many activation link requests. Please wait 2 minutes before requesting another link.",
  },
  keyGenerator: (req) => {
    const rawEmail = String(req.body?.gmail || req.body?.email || "")
      .trim()
      .toLowerCase();
    const ip = ipKeyGenerator(req.ip);
    return `activate:${rawEmail}:${ip}`;
  },
});

// ==========================================
// TOKEN VERIFICATION & ACTIVATION RATE LIMIT (L-3)
// ==========================================

// Prevents CPU exhaustion via repeated bcrypt hashing and brute-force token scanning
const tokenActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // 30 requests per IP per 15 min
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many token verification requests from this IP. Please try again later.",
  },
});

module.exports = {
  apiLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  passwordResetLimiter,
  activationResendLimiter,
  tokenActionLimiter,
};

