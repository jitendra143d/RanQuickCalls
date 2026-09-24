const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const { AppError } = require('./errorHandler');
const ErrorCodes = require('../utils/errorCodes');
const User = require('../models/User');
const { getClient } = require('../config/redis');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401, ErrorCodes.TOKEN_INVALID));
    }

    // Verify token
    const decoded = jwt.verify(token, env.jwtSecret);

    // Optional: Check if token is blacklisted in Redis (e.g., after logging out)
    const redisClient = getClient();
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new AppError('Token has been invalidated (logged out)', 401, ErrorCodes.TOKEN_EXPIRED));
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 404, ErrorCodes.USER_NOT_FOUND));
    }

    // Check if user is suspended
    if (user.isSuspended) {
      if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        const timeLeft = Math.ceil((user.suspendedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
        return next(new AppError(`Your account is suspended for another ${timeLeft} hour(s)`, 403, ErrorCodes.INVALID_CREDENTIALS));
      } else {
        // Suspension period passed, auto-reactivate
        user.isSuspended = false;
        user.suspendedUntil = null;
        await user.save();
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('This user account is deactivated', 403, ErrorCodes.INVALID_CREDENTIALS));
    }

    // Attach user and current token to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

const adminOnly = async (req, res, next) => {
  try {
    // Standard protect checks first
    await protect(req, res, async (err) => {
      if (err) {
        // Fallback check: does it match an optional raw server ADMIN_TOKEN header?
        const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer')
          ? req.headers.authorization.split(' ')[1]
          : null;

        if (token && token === process.env.ADMIN_TOKEN) {
          // Grant mock admin access
          req.user = { username: 'admin', isGuest: false };
          return next();
        }
        return next(err);
      }

      // Check user username or role
      if (req.user && (req.user.username === 'admin' || req.user.isAdmin)) {
        return next();
      }

      next(new AppError('Access denied: Admin role required', 403, ErrorCodes.TOKEN_INVALID));
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  adminOnly
};
