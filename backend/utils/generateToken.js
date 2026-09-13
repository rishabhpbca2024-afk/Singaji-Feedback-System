const jwt = require('jsonwebtoken');

/**
 * generateToken
 * Creates a signed JWT for a given user ID.
 * TODO: Call this in authController.loginUser when auth is implemented.
 *
 * @param {string} userId - The MongoDB _id of the user
 * @returns {string} signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
