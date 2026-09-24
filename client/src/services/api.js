import axios from 'axios';
import {
  mockAuthService,
  mockUserService,
  mockCallService,
  mockFeedbackService,
  mockAdminService,
} from './mockApi';

const envTokenKey = 'ranquickcalls_token';
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * DEMO MODE activates when:
 *  - VITE_API_URL env var is not set, OR
 *  - explicitly set to "mock" / "demo"
 *
 * In production (Vercel), set VITE_API_URL to your backend URL to disable demo mode.
 * Leave it empty (or unset) to run in demo mode with no backend required.
 */
const IS_DEMO_MODE =
  !API_URL ||
  API_URL === 'mock' ||
  API_URL === 'demo' ||
  API_URL.startsWith('http://localhost');

// ─── Real Axios Client (used when backend is available) ────────────────────────
const api = axios.create({
  baseURL: IS_DEMO_MODE ? '' : `${API_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(envTokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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

// ─── Exported Services (auto-switch between real and mock) ────────────────────

export const authService = IS_DEMO_MODE
  ? mockAuthService
  : {
      register: (data) => api.post('/auth/register', data),
      login: (data) => api.post('/auth/login', data),
      guestLogin: (data) => api.post('/auth/guest', data),
      logout: () => api.post('/auth/logout'),
      socialLogin: (data) => api.post('/auth/social', data),
      mobileLogin: (data) => api.post('/auth/mobile', data),
    };

export const userService = IS_DEMO_MODE
  ? mockUserService
  : {
      getProfile: () => api.get('/users/profile'),
      updateProfile: (data) => api.put('/users/profile', data),
      uploadPicture: (imageUrl) => api.post('/users/profile/picture', { imageUrl }),
      blockUser: (blockedUserId) => api.post('/users/block', { blockedUserId }),
      unblockUser: (blockedUserId) => api.post('/users/unblock', { blockedUserId }),
      getBlockedUsers: () => api.get('/users/blocked'),
    };

export const callService = IS_DEMO_MODE
  ? mockCallService
  : {
      getActiveCall: () => api.get('/calls/active'),
      endCall: (callId, duration) => api.post('/calls/end', { callId, duration }),
      getHistory: (limit = 20, skip = 0) => api.get(`/calls/history?limit=${limit}&skip=${skip}`),
      getStatistics: () => api.get('/calls/statistics'),
    };

export const feedbackService = IS_DEMO_MODE
  ? mockFeedbackService
  : {
      submitFeedback: (data) => api.post('/feedback/call', data),
      reportAbuse: (data) => api.post('/feedback/report', data),
      getUserRating: (userId) => api.get(`/feedback/user-rating/${userId}`),
    };

export const adminService = IS_DEMO_MODE
  ? mockAdminService
  : {
      getStatistics: () => api.get('/admin/statistics'),
      getReports: (status = 'under_review') => api.get(`/admin/reports?status=${status}`),
      suspendUser: (userId, duration, reason) =>
        api.post('/admin/users/suspend', { userId, duration, reason }),
    };

export { IS_DEMO_MODE };
export default api;
