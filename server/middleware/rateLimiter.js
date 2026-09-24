const rateLimit = require('express-rate-limit');
const ErrorCodes = require('../utils/errorCodes');

// Helper to create limiters
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      errorCode: ErrorCodes.INTERNAL_SERVER_ERROR // standard rate limit block
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// 1. Auth endpoints: 5 requests per 15 minutes
const authLimiter = createLimiter(
  15 * 60 * 1000, 
  5, 
  'Too many authentication requests, please try again after 15 minutes.'
);

// 2. Call endpoints: 100 requests per minute
const callLimiter = createLimiter(
  1 * 60 * 1000, 
  100, 
  'Too many call requests. Please wait a minute.'
);

// 3. Feedback endpoints: 10 requests per hour
const feedbackLimiter = createLimiter(
  60 * 60 * 1000, 
  10, 
  'Too many feedback submissions. Please try again later.'
);

// 4. General / default: 1000 requests per hour
const generalLimiter = createLimiter(
  60 * 60 * 1000, 
  1000, 
  'Too many requests. Please try again after an hour.'
);

module.exports = {
  authLimiter,
  callLimiter,
  feedbackLimiter,
  generalLimiter
};
