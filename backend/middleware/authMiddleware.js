const jwt = require("jsonwebtoken");

const {
  decryptToken,
} = require("../utils/tokenEncryption");

const protect = (req, res, next) => {
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

module.exports = {
  protect,
  authorize,
};