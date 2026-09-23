const express = require('express');
const {
  loginAccountLimiter,
  loginIpLimiter,
  passwordResetLimiter,
  activationResendLimiter,
} = require("../middleware/Ratelimiter");
const {
  Login,
  logout,
  forgotPassword,
  resetPassword,
  changeAdminPassword,
  activateFacultyAccount,
  resendActivationLink,
} = require('../controllers/authController');
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginAccountLimiter, loginIpLimiter, Login);
router.post("/logout", logout);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Faculty Account Activation Flow (R-4, R-8)
router.post("/activate-account", activateFacultyAccount);
router.post("/resend-activation", activationResendLimiter, resendActivationLink);


// Admin simple change password route (optional, at-will)
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