const UserFeedback = require('../models/UserFeedback');
const User = require('../models/User');
const CallRecord = require('../models/CallRecord');
const BlockedUser = require('../models/BlockedUser');
const Report = require('../models/Report');
const { AppError } = require('../middleware/errorHandler');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @desc    Submit call rating feedback
 * @route   POST /api/feedback/call
 * @access  Private
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { callId, rating, comment, qualityRating, issues } = req.body;
    const userId = req.user._id;

    if (!callId || !rating) {
      return next(new AppError('Please provide callId and rating', 400, ErrorCodes.INVALID_INPUT));
    }

    // Verify call exists
    const call = await CallRecord.findById(callId);
    if (!call) {
      return next(new AppError('Call not found', 404, ErrorCodes.CALL_NOT_FOUND));
    }

    // Determine partner ID
    const isUser1 = call.user1Id.toString() === userId.toString();
    const ratedUserId = isUser1 ? call.user2Id : call.user1Id;

    // Create feedback
    const feedback = await UserFeedback.create({
      callId,
      userId,
      ratedUserId,
      rating,
      comment: comment || '',
      qualityRating,
      issues: issues || []
    });

    // Recalculate partner ratings
    const stats = await UserFeedback.aggregate([
      { $match: { ratedUserId: ratedUserId } },
      {
        $group: {
          _id: '$ratedUserId',
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const roundedAvg = Math.round(stats[0].avgRating * 10) / 10;
      await User.findByIdAndUpdate(ratedUserId, {
        averageRating: roundedAvg,
        totalRatings: stats[0].totalCount
      });
    }

    res.status(201).json({
      success: true,
      feedback: {
        feedbackId: feedback._id,
        callId: feedback.callId,
        rating: feedback.rating,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Report abuse during a call
 * @route   POST /api/feedback/report
 * @access  Private
 */
exports.reportAbuse = async (req, res, next) => {
  try {
    const { reportedUserId, callId, reason, description, severity } = req.body;
    const userId = req.user._id;

    if (!reportedUserId || !callId || !reason) {
      return next(new AppError('Please provide reportedUserId, callId and reason', 400, ErrorCodes.INVALID_INPUT));
    }

    // Create Report
    const report = await Report.create({
      reportedUserId,
      reportedByUserId: userId,
      callId,
      reason,
      description: description || '',
      severity: severity || 'medium',
      status: 'under_review'
    });

    // Auto-block the reported user to prevent matching again
    try {
      await BlockedUser.create({
        userId,
        blockedUserId: reportedUserId
      });
    } catch (err) {
      // already blocked, skip
    }

    res.status(201).json({
      success: true,
      report: {
        reportId: report._id,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get rating stats and score distribution for a user
 * @route   GET /api/feedback/user-rating/:userId
 * @access  Private
 */
exports.getUserRating = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND));
    }

    // Get feedback scores list
    const feedbacks = await UserFeedback.find({ ratedUserId: userId });

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    feedbacks.forEach(f => {
      const score = Math.round(f.rating);
      if (ratingDistribution[score] !== undefined) {
        ratingDistribution[score]++;
      }
    });

    res.status(200).json({
      success: true,
      rating: {
        userId,
        averageRating: user.averageRating,
        totalRatings: user.totalRatings || feedbacks.length,
        ratingDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
