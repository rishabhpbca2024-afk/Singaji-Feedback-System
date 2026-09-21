const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Admin = require("../models/admin");
const Faculty = require("../models/Faculty");
const { encryptToken } = require("../utils/tokenEncryption");
const { validatePassword } = require("../utils/passwordValidator");
const { sendPasswordResetEmail } = require("../utils/sendEmail");

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
        return res.status(401).json({
          success: false,
          message: "Invalid Gmail or password",
        });
      }

      const token = jwt.sign(
        {
          userId: admin._id,
          role: "Admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
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
      if (faculty.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Faculty account is inactive",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        faculty.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid Gmail or password",
        });
      }

      const token = jwt.sign(
        {
          userId: faculty._id,
          role: "Faculty",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
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
          token,
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
        token,
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

      const frontendUrl = process.env.FRONTEND_URL
        ? (process.env.FRONTEND_URL.startsWith("http")
            ? process.env.FRONTEND_URL
            : `https://${process.env.FRONTEND_URL}`)
        : "http://localhost:5173";

      const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

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
        process.env.NODE_ENV === "production"
          ? "Failed to process forgot password request."
          : error.message,
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
        process.env.NODE_ENV === "production"
          ? "Failed to reset password."
          : error.message,
    });
  }
};

// ==========================================
// ADMIN CHANGE PASSWORD (SIMPLE & AT-WILL)
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

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
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
    admin.password = hashedPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully.",
    });
  } catch (error) {
    console.error("Admin change password error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Failed to change admin password."
          : error.message,
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
        process.env.NODE_ENV === "production"
          ? "Failed to logout."
          : error.message,
    });
  }
};

module.exports = {
  Login,
  logout,
  forgotPassword,
  resetPassword,
  changeAdminPassword,
};