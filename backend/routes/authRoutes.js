const express = require('express');
const {
  loginAccountLimiter,
  loginIpLimiter,
  passwordResetLimiter,
} = require("../middleware/Ratelimiter");
const {
  Login,
  logout,
  forgotPassword,
  resetPassword,
  changeAdminPassword,
} = require('../controllers/authController');
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginAccountLimiter, loginIpLimiter, Login);
router.post("/logout", logout);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);


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