import api from './api.js';

/**
 * Auth Service
 * Handles login, registration, and logout API calls.
 * Real implementation will be connected to the backend.
 */

// Login a user
export const login = async (credentials) => {
  // TODO: implement when backend is ready
  // const response = await api.post('/auth/login', credentials);
  // return response.data;
  throw new Error('login() not yet implemented');
};

// Register a new user
export const register = async (userData) => {
  // TODO: implement when backend is ready
  // const response = await api.post('/auth/register', userData);
  // return response.data;
  throw new Error('register() not yet implemented');
};

// Logout (client-side)
export const logout = () => {
  localStorage.removeItem('token');
};
