/**
 * mockApi.js — Demo Mode
 * Returns realistic fake responses for every API call so the frontend
 * works fully on Vercel without a running backend.
 */

// Small helper: simulate async network latency
const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// ─── Seeded fake user stored in sessionStorage so it persists across nav ──────
const DEMO_USER_KEY = 'rqc_demo_user';

function getDemoUser() {
  const stored = sessionStorage.getItem(DEMO_USER_KEY);
  if (stored) return JSON.parse(stored);
  return null;
}

function setDemoUser(u) {
  sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(u));
}

function clearDemoUser() {
  sessionStorage.removeItem(DEMO_USER_KEY);
}

function makeUser(overrides = {}) {
  return {
    id: 'demo-user-001',
    username: 'DemoUser',
    email: 'demo@ranquickcalls.app',
    isGuest: false,
    role: 'user',
    country: 'US',
    languageLevel: 'Intermediate',
    timezone: 'UTC',
    interests: ['travel', 'coding', 'music'],
    profilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    isSuspended: false,
    ...overrides,
  };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const mockAuthService = {
  register: async (data) => {
    await delay(600);
    const user = makeUser({ username: data.username, email: data.email });
    setDemoUser(user);
    return { success: true, token: 'demo-token-xyz', user };
  },

  login: async (data) => {
    await delay(600);
    const user = makeUser({ email: data.email });
    setDemoUser(user);
    return { success: true, token: 'demo-token-xyz', user };
  },

  guestLogin: async (data) => {
    await delay(500);
    const user = makeUser({
      username: `Guest_${Math.floor(Math.random() * 9000) + 1000}`,
      email: '',
      isGuest: true,
      country: data.country || 'US',
      languageLevel: data.languageLevel || 'Intermediate',
    });
    setDemoUser(user);
    return { success: true, token: 'demo-token-guest', user };
  },

  logout: async () => {
    await delay(200);
    clearDemoUser();
    return { success: true };
  },

  socialLogin: async (data) => {
    await delay(700);
    const user = makeUser({
      username: data.name || 'SocialUser',
      email: data.email || 'social@ranquickcalls.app',
    });
    setDemoUser(user);
    return { success: true, token: 'demo-token-social', user };
  },

  mobileLogin: async () => {
    await delay(800);
    const user = makeUser({ username: 'MobileUser' });
    setDemoUser(user);
    return { success: true, token: 'demo-token-mobile', user };
  },
};

// ─── User Service ─────────────────────────────────────────────────────────────
export const mockUserService = {
  getProfile: async () => {
    await delay(300);
    const user = getDemoUser() || makeUser();
    return { success: true, user };
  },

  updateProfile: async (data) => {
    await delay(500);
    const existing = getDemoUser() || makeUser();
    const updated = { ...existing, ...data };
    setDemoUser(updated);
    return { success: true, user: updated };
  },

  uploadPicture: async (imageUrl) => {
    await delay(400);
    const existing = getDemoUser() || makeUser();
    const updated = { ...existing, profilePicture: imageUrl };
    setDemoUser(updated);
    return { success: true, imageUrl };
  },

  blockUser: async (blockedUserId) => {
    await delay(300);
    return { success: true, message: `User ${blockedUserId} blocked.` };
  },

  unblockUser: async (blockedUserId) => {
    await delay(300);
    return { success: true, message: `User ${blockedUserId} unblocked.` };
  },

  getBlockedUsers: async () => {
    await delay(300);
    return { success: true, blockedUsers: [] };
  },
};

// ─── Call Service ─────────────────────────────────────────────────────────────
const DEMO_CALLS = [
  { callId: 'c1', otherUserName: 'Alice_UK', otherUserProfilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice', duration: 540, date: new Date(Date.now() - 86400000).toISOString() },
  { callId: 'c2', otherUserName: 'Bob_CA', otherUserProfilePicture: null, duration: 1200, date: new Date(Date.now() - 172800000).toISOString() },
  { callId: 'c3', otherUserName: 'Chen_SG', otherUserProfilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chen', duration: 320, date: new Date(Date.now() - 259200000).toISOString() },
  { callId: 'c4', otherUserName: 'Maria_BR', otherUserProfilePicture: null, duration: 890, date: new Date(Date.now() - 345600000).toISOString() },
  { callId: 'c5', otherUserName: 'Kenji_JP', otherUserProfilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kenji', duration: 450, date: new Date(Date.now() - 432000000).toISOString() },
];

export const mockCallService = {
  getActiveCall: async () => {
    await delay(300);
    return { success: true, call: null };
  },

  endCall: async (callId, duration) => {
    await delay(400);
    return { success: true, message: 'Call ended.' };
  },

  getHistory: async (limit = 10, skip = 0) => {
    await delay(500);
    const page = DEMO_CALLS.slice(skip, skip + limit);
    return { success: true, calls: page, hasMore: skip + limit < DEMO_CALLS.length };
  },

  getStatistics: async () => {
    await delay(400);
    return {
      success: true,
      stats: {
        totalCalls: 47,
        totalMinutes: 312,
        averageDuration: 398,
        thisWeekCalls: 8,
        thisMonthCalls: 23,
        streak: 5,
      },
    };
  },
};

// ─── Feedback Service ─────────────────────────────────────────────────────────
export const mockFeedbackService = {
  submitFeedback: async (data) => {
    await delay(400);
    return { success: true, message: 'Feedback submitted.' };
  },

  reportAbuse: async (data) => {
    await delay(400);
    return { success: true, message: 'Report received. Thank you.' };
  },

  getUserRating: async (userId) => {
    await delay(300);
    return {
      success: true,
      rating: {
        averageRating: 4.6,
        totalRatings: 38,
        ratingDistribution: { 5: 24, 4: 9, 3: 3, 2: 1, 1: 1 },
      },
    };
  },
};

// ─── Admin Service ────────────────────────────────────────────────────────────
export const mockAdminService = {
  getStatistics: async () => {
    await delay(500);
    return {
      success: true,
      stats: {
        totalUsers: 1284,
        activeUsers: 87,
        totalCalls: 4392,
        averageCallDuration: 412,
        systemUptime: '99.97%',
        apiResponseTime: 94,
        callSuccessRate: '98.2%',
      },
    };
  },

  getReports: async (status = 'under_review') => {
    await delay(500);
    const reports = status === 'under_review'
      ? [
          { _id: 'r1', reportedUser: { _id: 'u2', username: 'SpamUser99' }, reporter: { username: 'Alice_UK' }, reason: 'spam', description: 'Repeated promotional messages', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'under_review' },
          { _id: 'r2', reportedUser: { _id: 'u3', username: 'OffensiveUser' }, reporter: { username: 'Bob_CA' }, reason: 'harassment', description: 'Used abusive language during call', createdAt: new Date(Date.now() - 7200000).toISOString(), status: 'under_review' },
        ]
      : [
          { _id: 'r3', reportedUser: { _id: 'u4', username: 'ResolvedUser' }, reporter: { username: 'Maria_BR' }, reason: 'inappropriate', description: 'Resolved after warning', createdAt: new Date(Date.now() - 86400000).toISOString(), status: 'resolved' },
        ];
    return { success: true, reports };
  },

  suspendUser: async (userId, duration, reason) => {
    await delay(600);
    return { success: true, message: `User suspended for ${duration} days.` };
  },
};
