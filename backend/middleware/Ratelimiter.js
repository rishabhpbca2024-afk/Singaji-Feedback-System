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

const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Maximum 5 FAILED login attempts

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many failed login attempts for this account. Please try again after 15 minutes.",
  },

  skipSuccessfulRequests: false,

  keyGenerator: (req) => {
    const email = String(req.body?.gmail || req.body?.email || "")
      .trim()
      .toLowerCase();

    const ip = ipKeyGenerator(req.ip);

    return `${email}:${ip}`;
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

module.exports = {
  apiLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  passwordResetLimiter,
};
