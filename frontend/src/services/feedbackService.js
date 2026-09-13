import api from './api.js';

/**
 * Feedback Service
 * Handles all feedback-related API calls.
 * Real implementation will be connected to the backend.
 */

// Submit feedback
export const submitFeedback = async (feedbackData) => {
  // TODO: implement when backend is ready
  // const response = await api.post('/feedback', feedbackData);
  // return response.data;
  throw new Error('submitFeedback() not yet implemented');
};

// Get feedback history for a student
export const getFeedbackHistory = async () => {
  // TODO: implement when backend is ready
  // const response = await api.get('/feedback/history');
  // return response.data;
  throw new Error('getFeedbackHistory() not yet implemented');
};

// Get all feedback (for faculty/admin)
export const getAllFeedback = async () => {
  // TODO: implement when backend is ready
  // const response = await api.get('/feedback');
  // return response.data;
  throw new Error('getAllFeedback() not yet implemented');
};

// Get feedback reports (admin)
export const getFeedbackReports = async () => {
  // TODO: implement when backend is ready
  // const response = await api.get('/feedback/reports');
  // return response.data;
  throw new Error('getFeedbackReports() not yet implemented');
};
