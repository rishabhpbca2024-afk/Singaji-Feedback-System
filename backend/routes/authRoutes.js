const express = require('express');
const {
  loginAccountLimiter,
  loginIpLimiter,
  passwordResetLimiter,
  activationResendLimiter,
  tokenActionLimiter,
} = require("../middleware/Ratelimiter");
const {
  Login,
  logout,
  forgotPassword,
  resetPassword,
  changeAdminPassword,
  activateFacultyAccount,
  resendActivationLink,
  adminEmergencyLock,
  adminEmergencyReset,
} = require('../controllers/authController');
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginAccountLimiter, loginIpLimiter, Login);
router.post("/logout", logout);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Faculty Account Activation Flow (R-4, R-8, L-3)
router.post("/activate-account", tokenActionLimiter, activateFacultyAccount);
router.post("/resend-activation", activationResendLimiter, resendActivationLink);

// Admin Emergency Security Lockdown & Recovery
router.post("/admin-emergency-lock", passwordResetLimiter, adminEmergencyLock);
router.post("/admin-emergency-reset", passwordResetLimiter, adminEmergencyReset);

// Admin change password route (with strong validation, session invalidation & security alert)
router.post(
  "/admin/change-password",
  protect,
  authorize("Admin"),
  changeAdminPassword
);
router.post(
  "/change-password",
  protect,
  authorize("Admin"),
  changeAdminPassword
);

module.exports = router;