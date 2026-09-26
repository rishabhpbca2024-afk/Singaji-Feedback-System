/**
 * Environment & Security Configuration Validator (C-2, C-1)
 * Refuses server startup if critical cryptographic secrets are missing,
 * too weak, or malformed.
 */

const validateEnv = () => {
  const errors = [];

  // 1. JWT_SECRET Check (C-2)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push("JWT_SECRET is required but missing from environment.");
  } else if (typeof jwtSecret !== "string" || jwtSecret.length < 32) {
    errors.push(
      `JWT_SECRET is critically weak (${jwtSecret.length} chars). HS256 requires at least 32 characters (recommended >= 64).`
    );
  }

  // 2. TOKEN_ENCRYPTION_KEY Check
  const tokenKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!tokenKey) {
    errors.push("TOKEN_ENCRYPTION_KEY is required for AES-256-GCM cookie encryption.");
  } else {
    try {
      const buffer = Buffer.from(tokenKey, "base64");
      if (buffer.length !== 32) {
        errors.push("TOKEN_ENCRYPTION_KEY must be a valid 32-byte key encoded in base64.");
      }
    } catch {
      errors.push("TOKEN_ENCRYPTION_KEY could not be parsed as valid base64.");
    }
  }

  // 3. Database URL Check
  if (!process.env.DB_URL) {
    errors.push("DB_URL is missing from environment.");
  }

  // If critical security requirements fail, refuse to boot
  if (errors.length > 0) {
    console.error("\n=======================================================");
    console.error("🔴 [FATAL SECURITY MISCONFIGURATION - REFUSING TO BOOT]");
    console.error("=======================================================");
    errors.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`);
    });
    console.error("=======================================================\n");
    process.exit(1);
  }

  console.log("🛡️  Environment & cryptographic keys verified successfully.");
};

module.exports = validateEnv;
