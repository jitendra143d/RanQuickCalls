const envTokenKey = 'ranquickcalls_token';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import axios from 'axios';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor to append Authorization Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(envTokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to format API errors consistently
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Network error occurred';
    const errorCode = error.response?.data?.errorCode || 5000;
    const err = new Error(message);
    err.status = error.response?.status || 500;
    err.errorCode = errorCode;
    err.errors = error.response?.data?.errors || null;
    return Promise.reject(err);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  guestLogin: (data) => api.post('/auth/guest', data),
  logout: () => api.post('/auth/logout'),
  socialLogin: (data) => api.post('/auth/social', data),
  mobileLogin: (data) => api.post('/auth/mobile', data),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadPicture: (imageUrl) => api.post('/users/profile/picture', { imageUrl }),
  blockUser: (blockedUserId) => api.post('/users/block', { blockedUserId }),
  unblockUser: (blockedUserId) => api.post('/users/unblock', { blockedUserId }),
  getBlockedUsers: () => api.get('/users/blocked'),
};

export const callService = {
  getActiveCall: () => api.get('/calls/active'),
  endCall: (callId, duration) => api.post('/calls/end', { callId, duration }),
  getHistory: (limit = 20, skip = 0) => api.get(`/calls/history?limit=${limit}&skip=${skip}`),
  getStatistics: () => api.get('/calls/statistics'),
};

export const feedbackService = {
  submitFeedback: (data) => api.post('/feedback/call', data),
  reportAbuse: (data) => api.post('/feedback/report', data),
  getUserRating: (userId) => api.get(`/feedback/user-rating/${userId}`),
};

export const adminService = {
  getStatistics: () => api.get('/admin/statistics'),
  getReports: (status = 'under_review') => api.get(`/admin/reports?status=${status}`),
  suspendUser: (userId, duration, reason) => api.post('/admin/users/suspend', { userId, duration, reason }),
};

export default api;
