const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const { AppError } = require('../middleware/errorHandler');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        ageRange: user.ageRange,
        languageLevel: user.languageLevel,
        interests: user.interests,
        timezone: user.timezone,
        country: user.country,
        isGuest: user.isGuest,
        isVerified: user.isVerified,
        totalCalls: user.callCount,
        totalMinutes: Math.round(user.totalCallMinutes),
        averageRating: user.averageRating,
        isOnline: user.isOnline,
        settings: user.settings,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, languageLevel, interests, timezone, settings, country } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND));
    }

    // If changing username, check duplicates
    if (username && username !== user.username) {
      const duplicate = await User.findOne({ username });
      if (duplicate) {
        return next(new AppError('Username already taken', 400, ErrorCodes.USER_ALREADY_EXISTS));
      }
      user.username = username;
    }

    if (languageLevel) user.languageLevel = languageLevel;
    if (interests) user.interests = interests;
    if (timezone) user.timezone = timezone;
    if (country) user.country = country;
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        ageRange: user.ageRange,
        languageLevel: user.languageLevel,
        interests: user.interests,
        timezone: user.timezone,
        country: user.country,
        isGuest: user.isGuest,
        settings: user.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/users/profile/picture
 * @access  Private
 */
exports.uploadPicture = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id;

    if (!imageUrl) {
      return next(new AppError('Please provide image source URL', 400, ErrorCodes.INVALID_INPUT));
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { profilePicture: imageUrl }, 
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      imageUrl: user.profilePicture
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Block a user
 * @route   POST /api/users/block
 * @access  Private
 */
exports.blockUser = async (req, res, next) => {
  try {
    const { blockedUserId } = req.body;
    const userId = req.user._id;

    if (!blockedUserId) {
      return next(new AppError('Please provide blockedUserId', 400, ErrorCodes.INVALID_INPUT));
    }

    if (userId.toString() === blockedUserId.toString()) {
      return next(new AppError('You cannot block yourself', 400, ErrorCodes.INVALID_INPUT));
    }

    // Check if target user exists
    const targetUser = await User.findById(blockedUserId);
    if (!targetUser) {
      return next(new AppError('User to block not found', 404, ErrorCodes.USER_NOT_FOUND));
    }

    // Record block
    try {
      await BlockedUser.create({
        userId,
        blockedUserId
      });
    } catch (err) {
      // Duplicate block, ignore and treat as success
    }

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unblock a user
 * @route   POST /api/users/unblock
 * @access  Private
 */
exports.unblockUser = async (req, res, next) => {
  try {
    const { blockedUserId } = req.body;
    const userId = req.user._id;

    if (!blockedUserId) {
      return next(new AppError('Please provide blockedUserId', 400, ErrorCodes.INVALID_INPUT));
    }

    const result = await BlockedUser.findOneAndDelete({
      userId,
      blockedUserId
    });

    if (!result) {
      return next(new AppError('Block relation not found', 404, ErrorCodes.USER_NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of blocked users
 * @route   GET /api/users/blocked
 * @access  Private
 */
exports.getBlockedUsers = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const blocks = await BlockedUser.find({ userId })
      .populate('blockedUserId', 'username profilePicture languageLevel');

    const formattedBlocks = blocks
      .filter(b => b.blockedUserId !== null)
      .map(b => ({
        userId: b.blockedUserId._id,
        username: b.blockedUserId.username,
        profilePicture: b.blockedUserId.profilePicture,
        blockedDate: b.createdAt
      }));

    res.status(200).json({
      success: true,
      blockedUsers: formattedBlocks
    });
  } catch (error) {
    next(error);
  }
};
