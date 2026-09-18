const jwt = require("jsonwebtoken");
const Faculty = require("../models/Faculty");
const Admin = require("../models/admin");

const {
  decryptToken,
} = require("../utils/tokenEncryption");

const protect = async (req, res, next) => {
  try {
    // 1. Cookie se encrypted token read karna
    const encryptedToken = req.cookies?.accessToken;

    if (!encryptedToken) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    // 2. Encrypted token ko decrypt karna
    const token = decryptToken(encryptedToken);

    // 3. Decrypted JWT ko verify karna
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 4. DB Re-check for existence and isActive (H-4)
    if (decoded.role === "Faculty") {
      const faculty = await Faculty.findById(decoded.userId)
        .select("isActive facultyId section")
        .lean();

      if (!faculty || faculty.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Faculty account is inactive or does not exist.",
        });
      }
    } else if (decoded.role === "Admin") {
      const admin = await Admin.findById(decoded.userId)
        .select("_id")
        .lean();

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin account not found.",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid token role.",
      });
    }

    // 5. User data request ke andar store karna
    req.user = decoded;

    // 6. Next middleware/controller par jaana
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission.",
      });
    }

    next();
  };
};

const allowOwnFacultyOrAdmin = async (req, res, next) => {
  try {
    // Admin kisi bhi faculty ka data dekh sakta hai
    if (req.user.role === "Admin") {
      return next();
    }

    // URL params ya query se requested faculty ID
    const requestedFacultyId = String(
      req.params.facultyId || req.query.facultyId || ""
    ).trim();

    // If route doesn't specify a facultyId (e.g. /my-feedback), allow through as controller derives it from authenticated user
    if (!requestedFacultyId) {
      return next();
    }

    // Logged-in Faculty ka account nikalo
    const loggedInFaculty = await Faculty.findById(req.user.userId)
      .select("facultyId isActive")
      .lean();

    if (!loggedInFaculty || loggedInFaculty.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Faculty account not found.",
      });
    }

    const loggedInFacultyId = String(
      loggedInFaculty.facultyId
    ).trim();

    // Requested ID aur logged-in Faculty ID compare karo
    if (loggedInFacultyId !== requestedFacultyId) {
      return res.status(403).json({
        success: false,
        message: "You can access only your own feedback data.",
      });
    }

    next();
  } catch (error) {
    console.error("Faculty ownership error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  protect,
  authorize,
  allowOwnFacultyOrAdmin,
};