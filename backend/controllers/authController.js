const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Admin = require("../models/admin");
const Faculty = require("../models/Faculty");
const { encryptToken } = require("../utils/tokenEncryption");
const { validatePassword } = require("../utils/passwordValidator");
const {
  sendPasswordResetEmail,
  sendFacultyActivationEmail,
  sendPasswordSetConfirmationEmail,
  sendAdminPasswordChangedAlertEmail,
} = require("../utils/sendEmail");
const {
  checkAccountLock,
  recordFailedLogin,
  resetAccountLock,
} = require("../utils/accountLockout");
const { DUMMY_PASSWORD_HASH } = require("../config/security");

const Login = async (req, res) => {
  try {
    const { gmail, password } = req.body || {};

    if (
      !gmail ||
      !password ||
      typeof gmail !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Gmail and password are required",
      });
    }

    const normalizedGmail = gmail.toLowerCase().trim();

    // 0. CHECK ACCOUNT-LEVEL LOCKOUT (H-3)
    const lockStatus = await checkAccountLock(normalizedGmail);
    if (lockStatus.isLocked) {
      const minutes = lockStatus.remainingMinutes || 15;
      const minutesText = minutes === 1 ? "1 minute" : `${minutes} minutes`;

      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts for this account. Please try again after ${minutesText}.`,
        remainingMinutes: minutes,
      });
    }

    // ==========================================
    // 1. CHECK ADMIN 
    // ==========================================

    const admin = await Admin.findOne({
      gmail: normalizedGmail,
    });

    if (admin) {
      const isPasswordValid = await bcrypt.compare(
        password,
        admin.password
      );

      if (!isPasswordValid) {
        const failStatus = await recordFailedLogin(normalizedGmail, req.ip);
        if (failStatus && failStatus.isLocked) {
          const minutes = failStatus.remainingMinutes || 15;
          const minutesText = minutes === 1 ? "1 minute" : `${minutes} minutes`;
          return res.status(429).json({
            success: false,
            message: `Too many failed login attempts for this account. Please try again after ${minutesText}.`,
            remainingMinutes: minutes,
          });
        }

        return res.status(401).json({
          success: false,
          message: "Invalid Gmail or password",
        });
      }

      if (admin.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Admin account is temporarily locked for security. Please use the emergency link sent to your Gmail or reset your password to unlock.",
        });
      }

      // Successful login resets any accumulated failure counter
      await resetAccountLock(normalizedGmail);

      const token = jwt.sign(
        {
          userId: admin._id,
          role: "Admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
          algorithm: "HS256",
        }
      );

      const isProduction = process.env.NODE_ENV === "production";
      const encryptedToken = encryptToken(token);

      res.cookie("accessToken", encryptedToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        role: "Admin",
        message: "Admin login successful",

        user: {
          name: admin.username,
          gmail: admin.gmail,
          role: "Admin",
        },
      });
    }

    // ==========================================
    // 2. CHECK FACULTY
    // ==========================================

    const faculty = await Faculty.findOne({
      gmail: normalizedGmail,
    });

    if (faculty) {
      const isPendingActivation =
        faculty.isActivated === false &&
        (Boolean(faculty.activationToken) || !faculty.password);

      if (faculty.isActive === false || isPendingActivation || !faculty.password) {
        await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
        await recordFailedLogin(normalizedGmail, req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid Gmail or password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        faculty.password
      );

      if (!isPasswordValid) {
        const failStatus = await recordFailedLogin(normalizedGmail, req.ip);
        if (failStatus && failStatus.isLocked) {
          const minutes = failStatus.remainingMinutes || 15;
          const minutesText = minutes === 1 ? "1 minute" : `${minutes} minutes`;
          return res.status(429).json({
            success: false,
            message: `Too many failed login attempts for this account. Please try again after ${minutesText}.`,
            remainingMinutes: minutes,
          });
        }

        return res.status(401).json({
          success: false,
          message: "Invalid Gmail or password",
        });
      }

      // Successful login resets any accumulated failure counter
      await resetAccountLock(normalizedGmail);

      const token = jwt.sign(
        {
          userId: faculty._id,
          role: "Faculty",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
          algorithm: "HS256",
        }
      );

      const isProduction = process.env.NODE_ENV === "production";
      const encryptedToken = encryptToken(token);

      res.cookie("accessToken", encryptedToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      });


      if (faculty.mustChangePassword) {
        return res.status(200).json({
          success: true,
          role: "Faculty",
          message: "Please change your password before continuing.",
          mustChangePassword: true,
          user: {
            id: faculty._id,
            facultyId: faculty.facultyId,
            name: faculty.name,
            gmail: faculty.gmail,
            department: faculty.section,
            subjects: faculty.subjects,
            role: "Faculty",
            mustChangePassword: true,
          },
        });
      }

      return res.status(200).json({
        success: true,
        role: "Faculty",
        message: "Faculty login successful",
        mustChangePassword: false,
        user: {
          id: faculty._id,
          facultyId: faculty.facultyId,
          name: faculty.name,
          gmail: faculty.gmail,
          department: faculty.section,
          subjects: faculty.subjects,
          role: "Faculty",
          mustChangePassword: false,
        },
      });
    }

    // ==========================================
    // 3. NEITHER ADMIN NOR FACULTY
    // ==========================================

    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

    const failStatus = await recordFailedLogin(normalizedGmail, req.ip);
    if (failStatus && failStatus.isLocked) {
      const minutes = failStatus.remainingMinutes || 15;
      const minutesText = minutes === 1 ? "1 minute" : `${minutes} minutes`;
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts for this account. Please try again after ${minutesText}.`,
        remainingMinutes: minutes,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid Gmail or password",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPassword = async (req, res) => {
  try {
    const { gmail } = req.body || {};

    if (!gmail || typeof gmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "Gmail address is required.",
      });
    }

    const normalizedGmail = gmail.toLowerCase().trim();

    // Look up faculty (enumeration prevention: always return identical generic response)
    const faculty = await Faculty.findOne({
      gmail: normalizedGmail,
      isActive: true,
    });

    if (faculty) {
      // Generate 32-byte cryptographically secure random token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Hash token using SHA-256 for secure database storage
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      // Reset token valid for 15 minutes
      faculty.resetPasswordToken = hashedToken;
      faculty.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await faculty.save();

      const frontendUrl = (process.env.FRONTEND_URL
        ? (process.env.FRONTEND_URL.startsWith("http")
          ? process.env.FRONTEND_URL
          : `https://${process.env.FRONTEND_URL}`)
        : "http://localhost:5173").replace(/\/$/, "");

      const resetUrl = `${frontendUrl}/reset-password#token=${encodeURIComponent(rawToken)}`;

      try {
        await sendPasswordResetEmail({
          to: faculty.gmail,
          facultyName: faculty.name,
          resetUrl,
        });
      } catch (emailErr) {
        console.error(
          "Password reset email delivery failure:",
          emailErr.message
        );
      }
    }

    // Always return generic response to prevent account enumeration
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to process forgot password request.",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    if (typeof token !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload format.",
      });
    }

    // Password complexity validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Hash the raw token with SHA-256 to lookup in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    // Verify token exists and has not expired
    const faculty = await Faculty.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token.",
      });
    }

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update faculty record:
    // 1. Set new hashed password
    // 2. Set mustChangePassword = false
    // 3. Clear reset token (single-use)
    // 4. Clear reset expiration
    // 5. Invalidate prior active sessions by updating passwordChangedAt
    faculty.password = hashedPassword;
    faculty.mustChangePassword = false;
    faculty.resetPasswordToken = null;
    faculty.resetPasswordExpires = null;
    faculty.passwordChangedAt = new Date();

    // L-10: If account was pending activation, password reset fulfills activation
    faculty.isActivated = true;
    faculty.activationToken = null;
    faculty.activationTokenExpires = null;

    await faculty.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to reset password.",
    });
  }
};

// ==========================================
// ADMIN CHANGE PASSWORD (WITH STRONG VALIDATION, SESSION INVALIDATION & EMAIL ALERT)
// ==========================================

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be a valid string.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    // Institutional Password Complexity Validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const changeTimestamp = new Date();

    // Generate 32-byte emergency security lock token (valid for 48 hours)
    const rawLockToken = crypto.randomBytes(32).toString("hex");
    const hashedLockToken = crypto
      .createHash("sha256")
      .update(rawLockToken)
      .digest("hex");

    admin.password = hashedPassword;
    admin.passwordChangedAt = changeTimestamp;
    admin.securityLockToken = hashedLockToken;
    admin.securityLockExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await admin.save();

    // Re-issue cookie for this active admin session so they remain logged in
    const token = jwt.sign(
      {
        userId: admin._id,
        role: "Admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const encryptedToken = encryptToken(token);

    res.cookie("accessToken", encryptedToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    // Send security alert email with emergency lock link
    let frontendUrl = "http://localhost:5173";
    if (process.env.NODE_ENV === "production" && process.env.FRONTEND_URL) {
      frontendUrl = (process.env.FRONTEND_URL.startsWith("http")
        ? process.env.FRONTEND_URL
        : `https://${process.env.FRONTEND_URL}`).replace(/\/$/, "");
    } else if (req.headers.origin) {
      frontendUrl = req.headers.origin.replace(/\/$/, "");
    } else if (process.env.FRONTEND_URL) {
      frontendUrl = (process.env.FRONTEND_URL.startsWith("http")
        ? process.env.FRONTEND_URL
        : `https://${process.env.FRONTEND_URL}`).replace(/\/$/, "");
    }

    const lockUrl = `${frontendUrl}/admin/security-lock#token=${encodeURIComponent(rawLockToken)}`;

    try {
      await sendAdminPasswordChangedAlertEmail({
        to: admin.gmail,
        adminName: admin.username,
        lockUrl,
        timestamp: changeTimestamp,
      });
    } catch (emailErr) {
      console.error("[ADMIN SECURITY ALERT EMAIL FAILED]:", emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully. A security notification has been sent to your registered Gmail.",
    });
  } catch (error) {
    console.error("Admin change password error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to change admin password.",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to logout.",
    });
  }
};

// ==========================================
// ACTIVATE FACULTY ACCOUNT (SET PASSWORD)
// ==========================================

const activateFacultyAccount = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Activation token and new password are required.",
      });
    }

    if (typeof token !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload format.",
      });
    }

    // Password complexity validation (R-4)
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Hash token with SHA-256 for lookup (R-2, R-4)
    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    // Verify token exists and has not expired (R-2, R-5)
    const faculty = await Faculty.findOne({
      activationToken: hashedToken,
      activationTokenExpires: { $gt: new Date() },
    });

    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired activation link. Please request a new activation link.",
      });
    }

    // Hash new password using bcrypt (R-4)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update faculty record:
    // 1. Store hashed password
    // 2. Mark account as activated (R-4, R-6)
    // 3. Clear token & expiry immediately (single-use) (R-5)
    faculty.password = hashedPassword;
    faculty.isActivated = true;
    faculty.activationToken = null;
    faculty.activationTokenExpires = null;
    faculty.mustChangePassword = false;
    faculty.passwordChangedAt = new Date();

    await faculty.save();

    // Send confirmation email to registered email from DB (R-3, R-9)
    try {
      await sendPasswordSetConfirmationEmail({
        to: faculty.gmail,
        facultyName: faculty.name,
        facultyId: faculty.facultyId,
      });
    } catch (emailErr) {
      console.error(
        "Failed to send password set confirmation email:",
        emailErr.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Your account has been activated and your password has been set successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Account activation error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to activate account.",
    });
  }
};

// ==========================================
// RESEND FACULTY ACTIVATION LINK
// ==========================================

const resendActivationLink = async (req, res) => {
  try {
    const { gmail } = req.body || {};

    if (!gmail || typeof gmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedGmail = gmail.toLowerCase().trim();

    // Look up unactivated faculty (R-3, R-8)
    const faculty = await Faculty.findOne({
      gmail: normalizedGmail,
      isActive: true,
    });

    if (faculty && (faculty.isActivated === false || faculty.activationToken)) {
      // Generate new 32-byte secure token (R-1, R-2)
      const rawToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      faculty.activationToken = hashedToken;
      faculty.activationTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await faculty.save();

      const frontendUrl = (process.env.FRONTEND_URL
        ? (process.env.FRONTEND_URL.startsWith("http")
          ? process.env.FRONTEND_URL
          : `https://${process.env.FRONTEND_URL}`)
        : "http://localhost:5173").replace(/\/$/, "");

      const activationUrl = `${frontendUrl}/activate-account#token=${encodeURIComponent(rawToken)}`;

      try {
        await sendFacultyActivationEmail({
          to: faculty.gmail, // Strictly from DB document (R-3)
          facultyName: faculty.name,
          facultyId: faculty.facultyId,
          activationUrl,
        });
      } catch (emailErr) {
        console.error(
          "Failed to resend faculty activation email:",
          emailErr.message
        );
      }
    }

    // Always return generic response to prevent account enumeration
    return res.status(200).json({
      success: true,
      message:
        "If an unactivated faculty account with that email exists, a new activation link has been sent.",
    });
  } catch (error) {
    console.error("Resend activation link error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to process request.",
    });
  }
};

// ==========================================
// ADMIN EMERGENCY LOCK (TRIGGERED FROM EMAIL LINK)
// ==========================================

const adminEmergencyLock = async (req, res) => {
  try {
    const { token } = req.body || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Emergency security token is required.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    const admin = await Admin.findOne({
      securityLockToken: hashedToken,
      securityLockExpires: { $gt: new Date() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired, or already used security emergency link.",
      });
    }

    // 1. Immediately freeze account & invalidate all active sessions
    const emergencyTimestamp = new Date();
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(rawResetToken)
      .digest("hex");

    admin.isActive = false;
    admin.passwordChangedAt = emergencyTimestamp;
    admin.securityLockToken = null;
    admin.securityLockExpires = null;
    admin.resetPasswordToken = hashedResetToken;
    admin.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes to complete recovery
    await admin.save();

    // Clear session cookies if any
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Account has been successfully locked and all sessions terminated. Please set a new secure password.",
      resetToken: rawResetToken,
      adminGmail: admin.gmail,
    });
  } catch (error) {
    console.error("Admin emergency lock error:", error);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to lock account.",
    });
  }
};

// ==========================================
// ADMIN EMERGENCY RESET PASSWORD
// ==========================================

const adminEmergencyReset = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body || {};

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (typeof resetToken !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid payload format.",
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken.trim())
      .digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired recovery session. Please use the link from your email again.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.isActive = true;
    admin.passwordChangedAt = new Date();
    admin.resetPasswordToken = null;
    admin.resetPasswordExpires = null;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully and your account has been unlocked. You may now log in.",
    });
  } catch (error) {
    console.error("Admin emergency reset error:", error);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to reset password.",
    });
  }
};

module.exports = {
  Login,
  logout,
  forgotPassword,
  resetPassword,
  changeAdminPassword,
  activateFacultyAccount,
  resendActivationLink,
  adminEmergencyLock,
  adminEmergencyReset,
};
