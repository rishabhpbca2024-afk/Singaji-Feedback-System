/**
 * calculateRating
 * Calculates the average rating from an array of question responses.
 * TODO: Call this in feedbackController.submitFeedback when implemented.
 *
 * @param {Array} responses - Array of { question, rating } objects
 * @returns {number} average rating rounded to 2 decimal places, or 0 if empty
 */
const calculateRating = (responses) => {
  if (!responses || responses.length === 0) return 0;

  const total = responses.reduce((sum, item) => sum + (item.rating || 0), 0);
  const average = total / responses.length;

  return Math.round(average * 100) / 100;
};

module.exports = calculateRating;
