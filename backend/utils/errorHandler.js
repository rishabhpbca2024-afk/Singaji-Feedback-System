/**
 * Sanitizes error messages returned in API responses.
 *
 * In production (NODE_ENV === "production"), returns a safe, generic fallback
 * message to prevent exposing internal stack traces, DB schemas, or system errors to clients.
 * In development or testing, returns the actual error.message to aid debugging.
 *
 * @param {Error|string|any} error - The caught error
 * @param {string} [fallback="Internal server error"] - Safe user-facing message for production
 * @returns {string} Sanitized error message
 */
function safeErrorMessage(error, fallback = "Internal server error") {
  // Safe by default: only expose detailed error messages in explicit development mode
  if (process.env.NODE_ENV !== "development") {
    return fallback;
  }

  if (error && typeof error === "object" && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

module.exports = safeErrorMessage;
module.exports.safeErrorMessage = safeErrorMessage;
