const crypto = require("crypto");

/**
 * Generates a deterministic HMAC SHA-256 hash of a student's email.
 * This allows deduplication and attendance/completion tracking without storing plain PII.
 *
 * @param {string} email - The student's email address
 * @returns {string} - Hex-encoded HMAC hash
 */
const hashStudentEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "";
  }
  const normalized = email.trim().toLowerCase();
  const salt =
    process.env.FEEDBACK_SALT ||
    process.env.JWT_SECRET ||
    "singaji_feedback_system_salt_key_2026";

  return crypto
    .createHmac("sha256", salt)
    .update(normalized)
    .digest("hex");
};

/**
 * Masks an email for safe logging (e.g., "rahul@gmail.com" -> "r***l@gmail.com")
 *
 * @param {string} email - The email to mask
 * @returns {string} - Masked email string
 */
const maskEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "***";
  }
  const parts = email.trim().split("@");
  if (parts.length !== 2) {
    return "***";
  }
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0] || "*"}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

module.exports = {
  hashStudentEmail,
  maskEmail,
};
