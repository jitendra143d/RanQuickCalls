const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const ErrorCodes = require('../utils/errorCodes');
const env = require('../config/environment');
const { getClient } = require('../config/redis');

// Helper to sign JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, env.jwtSecret, {
    expiresIn: env.jwtExpire
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, ageRange, languageLevel, interests, country } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return next(new AppError('Username or Email already registered', 400, ErrorCodes.USER_ALREADY_EXISTS));
    }

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash: password, // Schema pre-save will hash this
      ageRange,
      languageLevel: languageLevel || 'Intermediate',
      interests: interests || [],
      country: country || 'US',
      isGuest: false
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ageRange: user.ageRange,
        languageLevel: user.languageLevel,
        interests: user.interests,
        country: user.country,
        isGuest: false
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400, ErrorCodes.INVALID_INPUT));
    }

    // Find user
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || user.isGuest) {
      return next(new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS));
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS));
    }

    // Update active fields
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ageRange: user.ageRange,
        languageLevel: user.languageLevel,
        interests: user.interests,
        isGuest: false
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Guest Login
 * @route   POST /api/auth/guest
 * @access  Public
 */
exports.guestLogin = async (req, res, next) => {
  try {
    const { ageRange, languageLevel, country } = req.body;

    if (!ageRange) {
      return next(new AppError('Please select age range', 400, ErrorCodes.INVALID_INPUT));
    }

    // Generate unique random username
    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const username = `Guest_${uniqueId}`;

    // Create guest user
    const guestUser = await User.create({
      username,
      ageRange,
      languageLevel: languageLevel || 'Intermediate',
      country: country || 'US',
      isGuest: true,
      passwordHash: 'guest' // Filler string
    });

    const token = generateToken(guestUser._id);

    res.status(200).json({
      success: true,
      user: {
        id: guestUser._id,
        username: guestUser.username,
        ageRange: guestUser.ageRange,
        languageLevel: guestUser.languageLevel,
        country: guestUser.country,
        isGuest: true
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout User / Blacklist Token
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    const token = req.token;
    const user = req.user;

    // Optional: Blacklist token in Redis
    const redisClient = getClient();
    // Blacklist token for 7 days (604800 seconds)
    await redisClient.set(`blacklist:${token}`, 'true', { EX: 604800 });

    // Set offline
    if (user) {
      user.isOnline = false;
      user.lastActive = new Date();
      await user.save();
    }

    // If it was a guest account, we can optionally delete/cleanup later
    // For now, just mark offline and return success

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Social Authentication (Google / Facebook)
 * @route   POST /api/auth/social
 * @access  Public
 */
exports.socialLogin = async (req, res, next) => {
  try {
    const { provider, email, name, ageRange, languageLevel, country, avatar } = req.body;

    if (!email || !name) {
      return next(new AppError('Missing email or profile name', 400, ErrorCodes.INVALID_INPUT));
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user for this social account
      const sanitizedUsername = name.replace(/\s+/g, '_').toLowerCase() + '_' + Math.floor(100 + Math.random() * 900);
      user = await User.create({
        username: sanitizedUsername,
        email,
        passwordHash: `social_${provider}_${Math.random()}`,
        ageRange: ageRange || '18-25',
        languageLevel: languageLevel || 'Intermediate',
        country: country || 'US',
        isGuest: false,
        profilePicture: avatar || ''
      });
    } else {
      user.isOnline = true;
      user.lastActive = new Date();
      if (avatar && !user.profilePicture) {
        user.profilePicture = avatar;
      }
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ageRange: user.ageRange,
        languageLevel: user.languageLevel,
        interests: user.interests,
        country: user.country,
        profilePicture: user.profilePicture,
        isGuest: false
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mobile OTP Authentication
 * @route   POST /api/auth/mobile
 * @access  Public
 */
exports.mobileLogin = async (req, res, next) => {
  try {
    const { phoneNumber, ageRange, languageLevel, country } = req.body;

    if (!phoneNumber) {
      return next(new AppError('Phone number is required', 400, ErrorCodes.INVALID_INPUT));
    }

    // Normalize phone number to use as email or username
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const fakeEmail = `phone_${cleanPhone}@ranquickcalls.com`;
    const username = `phone_${cleanPhone.slice(-4)}_${Math.floor(100 + Math.random() * 900)}`;

    let user = await User.findOne({ email: fakeEmail });
    if (!user) {
      user = await User.create({
        username,
        email: fakeEmail,
        passwordHash: `phone_${cleanPhone}_${Math.random()}`,
        ageRange: ageRange || '18-25',
        languageLevel: languageLevel || 'Intermediate',
        country: country || 'US',
        isGuest: false
      });
    } else {
      user.isOnline = true;
      user.lastActive = new Date();
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ageRange: user.ageRange,
        languageLevel: user.languageLevel,
        interests: user.interests,
        country: user.country,
        isGuest: false
      },
      token
    });
  } catch (error) {
    next(error);
  }
};
