const CallRecord = require('../models/CallRecord');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const ErrorCodes = require('../utils/errorCodes');

/**
 * @desc    Get active call for the authenticated user
 * @route   GET /api/calls/active
 * @access  Private
 */
exports.getActiveCall = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find a call record that hasn't ended yet
    const call = await CallRecord.findOne({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      endTime: { $exists: false }
    })
    .populate('user1Id', 'username ageRange languageLevel profilePicture')
    .populate('user2Id', 'username ageRange languageLevel profilePicture');

    if (!call) {
      return res.status(200).json({
        success: true,
        call: null
      });
    }

    // Determine who is the partner
    const isUser1 = call.user1Id._id.toString() === userId.toString();
    const partner = isUser1 ? call.user2Id : call.user1Id;

    res.status(200).json({
      success: true,
      call: {
        callId: call._id,
        userId: userId,
        otherUserId: partner._id,
        otherUserInfo: {
          username: partner.username,
          ageRange: partner.ageRange,
          languageLevel: partner.languageLevel,
          profilePicture: partner.profilePicture
        },
        startTime: call.startTime,
        status: 'active'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    End active call manually
 * @route   POST /api/calls/end
 * @access  Private
 */
exports.endCall = async (req, res, next) => {
  try {
    const { callId, duration } = req.body;
    const userId = req.user._id;

    const call = await CallRecord.findById(callId);
    if (!call) {
      return next(new AppError('Call not found', 404, ErrorCodes.CALL_NOT_FOUND));
    }

    // Verify user belongs to the call
    if (call.user1Id.toString() !== userId.toString() && call.user2Id.toString() !== userId.toString()) {
      return next(new AppError('Unauthorized access to this call', 403, ErrorCodes.NO_ACTIVE_CALL));
    }

    // If call is already ended, just respond success
    if (call.endTime) {
      return res.status(200).json({
        success: true,
        message: 'Call already ended'
      });
    }

    call.endTime = new Date();
    call.duration = duration || Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);
    call.status = 'completed';
    call.endedBy = call.user1Id.toString() === userId.toString() ? 'user1' : 'user2';
    await call.save();

    // Update stats
    const durationMin = call.duration / 60;
    await User.findByIdAndUpdate(call.user1Id, { $inc: { totalCallMinutes: durationMin, callCount: 1 } });
    await User.findByIdAndUpdate(call.user2Id, { $inc: { totalCallMinutes: durationMin, callCount: 1 } });

    res.status(200).json({
      success: true,
      message: 'Call ended successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated call history
 * @route   GET /api/calls/history
 * @access  Private
 */
exports.getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = parseInt(req.query.skip, 10) || 0;

    const query = {
      $or: [{ user1Id: userId }, { user2Id: userId }],
      endTime: { $exists: true } // only completed/ended calls
    };

    const total = await CallRecord.countDocuments(query);
    const calls = await CallRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user1Id', 'username profilePicture')
      .populate('user2Id', 'username profilePicture');

    // Map to clean format
    const formattedCalls = calls.map(c => {
      const isUser1 = c.user1Id._id.toString() === userId.toString();
      const partner = isUser1 ? c.user2Id : c.user1Id;
      return {
        callId: c._id,
        otherUserName: partner ? partner.username : 'Deleted User',
        otherUserProfilePicture: partner ? partner.profilePicture : '',
        duration: c.duration,
        date: c.startTime,
        status: c.status
      };
    });

    res.status(200).json({
      success: true,
      calls: formattedCalls,
      total,
      hasMore: skip + limit < total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get call metrics and streaks dashboard
 * @route   GET /api/calls/statistics
 * @access  Private
 */
exports.getCallStatistics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user details
    const user = await User.findById(userId);

    // Call stats
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

    const startOfMonth = new Date();
    startOfMonth.setHours(0,0,0,0);
    startOfMonth.setDate(1);

    const weeklyCount = await CallRecord.countDocuments({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      startTime: { $gte: startOfWeek }
    });

    const monthlyCount = await CallRecord.countDocuments({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      startTime: { $gte: startOfMonth }
    });

    // Compute average duration
    const allRecords = await CallRecord.find({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      duration: { $gt: 0 }
    });

    const totalCalls = allRecords.length;
    const totalDuration = allRecords.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    // Simple streak calculation (based on consecutive active days with at least 1 call)
    // We can count call days in descending order
    const callDates = await CallRecord.find({
      $or: [{ user1Id: userId }, { user2Id: userId }]
    })
    .sort({ startTime: -1 })
    .select('startTime');

    let streak = 0;
    if (callDates.length > 0) {
      const activeDays = new Set();
      callDates.forEach(c => {
        activeDays.add(new Date(c.startTime).toDateString());
      });

      const today = new Date().toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      // Check if user called today or yesterday to continue streak
      if (activeDays.has(today) || activeDays.has(yesterdayStr)) {
        let checkDate = activeDays.has(today) ? new Date() : yesterday;
        while (activeDays.has(checkDate.toDateString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalCalls: user.callCount || totalCalls,
        totalMinutes: Math.round(user.totalCallMinutes || (totalDuration / 60)),
        averageDuration, // in seconds
        thisWeekCalls: weeklyCount,
        thisMonthCalls: monthlyCount,
        averageRating: user.averageRating,
        streak
      }
    });
  } catch (error) {
    next(error);
  }
};
