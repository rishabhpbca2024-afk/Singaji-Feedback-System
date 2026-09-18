const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/admin");
const Faculty = require("../models/Faculty");
const { encryptToken } = require("../utils/tokenEncryption");

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


      return res.status(200).json({
        success: true,
        role: "Faculty",
        message: "Faculty login successful",

        user: {
          name: faculty.name,
          gmail: faculty.gmail,
          department: faculty.section,
          subjects: faculty.subjects,
          role: "Faculty",
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

module.exports = {
  Login,
};