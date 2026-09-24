const User = require('../models/User');
const CallRecord = require('../models/CallRecord');
const Report = require('../models/Report');
const { AppError } = require('../middleware/errorHandler');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @desc    Get overall system statistics
 * @route   GET /api/admin/statistics
 * @access  Private (Admin Only)
 */
exports.getSystemStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ isGuest: false });
    const totalGuests = await User.countDocuments({ isGuest: true });
    
    // Active users: online in the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      $or: [
        { isOnline: true },
        { lastActive: { $gte: fiveMinsAgo } }
      ]
    });

    const totalCalls = await CallRecord.countDocuments();
    const completedCalls = await CallRecord.countDocuments({ status: 'completed' });

    // Average call duration
    const stats = await CallRecord.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);
    const averageCallDuration = stats.length > 0 ? Math.round(stats[0].avgDuration) : 0;

    // Call success rate
    const callSuccessRate = totalCalls > 0 
      ? `${Math.round((completedCalls / totalCalls) * 1000) / 10}%` 
      : '100%';

    // Mock/fixed metrics for hosting statistics
    const systemUptime = '99.9%';
    const apiResponseTime = 124; // ms

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: totalUsers + totalGuests,
        activeUsers,
        totalCalls,
        averageCallDuration, // in seconds
        systemUptime,
        apiResponseTime,
        callSuccessRate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reports listing
 * @route   GET /api/admin/reports
 * @access  Private (Admin Only)
 */
exports.getReports = async (req, res, next) => {
  try {
    const status = req.query.status || 'under_review';

    const reports = await Report.find({ status })
      .populate('reportedUserId', 'username ageRange languageLevel profilePicture')
      .populate('reportedByUserId', 'username')
      .sort({ createdAt: -1 });

    const formattedReports = reports.map(r => ({
      reportId: r._id,
      reportedUserId: r.reportedUserId ? r.reportedUserId._id : null,
      reportedUserName: r.reportedUserId ? r.reportedUserId.username : 'Deleted User',
      reportedByUserId: r.reportedByUserId ? r.reportedByUserId._id : null,
      reportedByUserName: r.reportedByUserId ? r.reportedByUserId.username : 'Deleted User',
      reason: r.reason,
      severity: r.severity,
      status: r.status,
      description: r.description,
      createdAt: r.createdAt
    }));

    res.status(200).json({
      success: true,
      reports: formattedReports
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend a user
 * @route   POST /api/admin/users/suspend
 * @access  Private (Admin Only)
 */
exports.suspendUser = async (req, res, next) => {
  try {
    const { userId, reason, duration } = req.body; // duration in days

    if (!userId || !duration) {
      return next(new AppError('Please provide userId and duration', 400, ErrorCodes.INVALID_INPUT));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND));
    }

    const durationDays = parseInt(duration, 10);
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);

    user.isSuspended = true;
    user.suspendedUntil = suspendedUntil;
    user.isOnline = false; // Disconnect
    await user.save();

    // Update report status if associated
    await Report.updateMany(
      { reportedUserId: userId, status: 'pending' },
      { status: 'resolved' }
    );
    await Report.updateMany(
      { reportedUserId: userId, status: 'under_review' },
      { status: 'resolved' }
    );

    res.status(200).json({
      success: true,
      message: `User suspended for ${durationDays} days`
    });
  } catch (error) {
    next(error);
  }
};
