const jwt = require("jsonwebtoken");
const Faculty = require("../models/Faculty");
const Admin = require("../models/admin");

const {
  decryptToken,
} = require("../utils/tokenEncryption");

const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Read token from encrypted cookie or Authorization header
    const encryptedToken = req.cookies?.accessToken;

    if (encryptedToken) {
      try {
        token = decryptToken(encryptedToken);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid session cookie.",
        });
      }
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const headerToken = req.headers.authorization.split(" ")[1];
      // Support both encrypted token and raw JWT in Authorization header
      try {
        token = decryptToken(headerToken);
      } catch (e) {
        token = headerToken;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    // 2. Decrypted JWT ko verify karna
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 3. DB Re-check for existence, isActive, passwordChangedAt and mustChangePassword
    if (decoded.role === "Faculty") {
      const faculty = await Faculty.findById(decoded.userId)
        .select("isActive isActivated activationToken password facultyId section mustChangePassword passwordChangedAt")
        .lean();

      if (!faculty || faculty.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Faculty account is inactive or does not exist.",
        });
      }

      // Block unactivated accounts from accessing protected routes (R-6)
      const isPendingActivation =
        faculty.isActivated === false &&
        (faculty.activationToken || !faculty.password);

      if (isPendingActivation) {
        return res.status(401).json({
          success: false,
          message: "Faculty account is not activated.",
        });
      }

      // Invalidate existing sessions/tokens after a password reset or change
      if (faculty.passwordChangedAt) {
        const changedTimestamp = Math.floor(
          new Date(faculty.passwordChangedAt).getTime() / 1000
        );
        if (decoded.iat && decoded.iat < changedTimestamp) {
          return res.status(401).json({
            success: false,
            message: "Password was recently changed. Please login again.",
          });
        }
      }

      // If mustChangePassword === true, do not allow normal access to protected faculty functionality.
      // Only permit calling the change-password endpoint.
      const isChangePasswordEndpoint =
        (req.baseUrl === "/api/faculty" || req.originalUrl?.startsWith("/api/faculty")) &&
        (req.path === "/change-password" || req.path === "/change-password/");

      if (faculty.mustChangePassword && !isChangePasswordEndpoint) {
        return res.status(403).json({
          success: false,
          mustChangePassword: true,
          message: "Please change your password before continuing.",
        });
      }

      decoded.mustChangePassword = faculty.mustChangePassword;
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

    // 4. User data request ke andar store karna
    req.user = decoded;

    // 5. Next middleware/controller par jaana
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