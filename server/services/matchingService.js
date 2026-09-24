const BlockedUser = require('../models/BlockedUser');
const CallRecord = require('../models/CallRecord');
const logger = require('../utils/logger');

// The active match queue in memory
// Each item has: { socketId, userId, username, ageRange, languageLevel, interests, joinedAt, blockList }
let queue = [];

/**
 * Add a user to the call matching queue
 */
const addToQueue = async (userQueueItem) => {
  try {
    // 1. Remove if already in queue to prevent duplicate entries
    removeFromQueue(userQueueItem.userId);

    // 2. Fetch block lists to check compatibility during matching
    const blocks = await BlockedUser.find({
      $or: [
        { userId: userQueueItem.userId },
        { blockedUserId: userQueueItem.userId }
      ]
    });

    const blockList = blocks.map(b => 
      b.userId.toString() === userQueueItem.userId.toString() 
        ? b.blockedUserId.toString() 
        : b.userId.toString()
    );

    // 3. Get recent call history to avoid repeat calls
    const recentCalls = await CallRecord.find({
      $or: [{ user1Id: userQueueItem.userId }, { user2Id: userQueueItem.userId }],
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // past 30 mins
    });

    const recentPartners = recentCalls.map(c => 
      c.user1Id.toString() === userQueueItem.userId.toString() 
        ? c.user2Id.toString() 
        : c.user1Id.toString()
    );

    const enrichedItem = {
      ...userQueueItem,
      joinedAt: Date.now(),
      blockList,
      recentPartners
    };

    queue.push(enrichedItem);
    logger.debug(`User ${userQueueItem.username} (${userQueueItem.userId}) joined matching queue. Queue size: ${queue.length}`);
    
    return enrichedItem;
  } catch (error) {
    logger.error(`Error adding user to queue: ${error.message}`);
    // Safe push even if DB query fails
    queue.push({ ...userQueueItem, joinedAt: Date.now(), blockList: [], recentPartners: [] });
  }
};

/**
 * Remove a user from the call matching queue
 */
const removeFromQueue = (userId) => {
  const initialLength = queue.length;
  queue = queue.filter(item => item.userId.toString() !== userId.toString());
  if (queue.length < initialLength) {
    logger.debug(`Removed user ${userId} from queue. Queue size: ${queue.length}`);
  }
};

/**
 * Remove a socket from the queue
 */
const removeSocketFromQueue = (socketId) => {
  queue = queue.filter(item => item.socketId !== socketId);
};

/**
 * Get current queue length
 */
const getQueueLength = () => queue.length;

/**
 * Scoring algorithm to find the best match for a user
 */
const findMatch = (userItem) => {
  if (queue.length < 2) return null;

  // Filter out: self, blocked users, and who blocked us
  const candidates = queue.filter(item => {
    const isSelf = item.userId.toString() === userItem.userId.toString();
    const isSocketSelf = item.socketId === userItem.socketId;
    if (isSelf || isSocketSelf) return false;

    // Check call mode compatibility
    if (item.callMode !== userItem.callMode) return false;

    // Check blocks
    const isBlocked = userItem.blockList.includes(item.userId.toString()) || 
                      item.blockList.includes(userItem.userId.toString());
    if (isBlocked) return false;

    // Check country matching preferences
    if (userItem.preferredCountry && userItem.preferredCountry !== 'Global') {
      if (item.country !== userItem.preferredCountry) return false;
    }
    if (item.preferredCountry && item.preferredCountry !== 'Global') {
      if (userItem.country !== item.preferredCountry) return false;
    }

    return true;
  });

  if (candidates.length === 0) return null;

  let bestMatch = null;
  let highestScore = -1;

  for (const candidate of candidates) {
    let score = 0;

    // 1. Language level compatibility (Base points: 40 for identical, 20 for near)
    if (userItem.languageLevel === candidate.languageLevel) {
      score += 40;
    } else {
      const levels = ['Beginner', 'Intermediate', 'Advanced', 'Native'];
      const idxA = levels.indexOf(userItem.languageLevel);
      const idxB = levels.indexOf(candidate.languageLevel);
      if (idxA !== -1 && idxB !== -1) {
        const diff = Math.abs(idxA - idxB);
        if (diff === 1) score += 20; // adjacent levels
      }
    }

    // 2. Interests overlap (10 points per shared interest)
    const interestsA = userItem.interests || [];
    const interestsB = candidate.interests || [];
    const sharedInterests = interestsA.filter(i => interestsB.includes(i));
    score += sharedInterests.length * 10;

    // 3. Age range similarity (20 points for exact match)
    if (userItem.ageRange === candidate.ageRange) {
      score += 20;
    }

    // 4. Avoid repeat matches (penalty of -30 if called in the last 30 minutes)
    if (userItem.recentPartners.includes(candidate.userId.toString())) {
      score -= 30;
    }

    // Capture highest compatibility score
    if (score > highestScore) {
      highestScore = score;
      bestMatch = candidate;
    }
  }

  // We require a minimum compatibility score or select the best if positive
  return bestMatch;
};

module.exports = {
  addToQueue,
  removeFromQueue,
  removeSocketFromQueue,
  getQueueLength,
  findMatch,
  getQueue: () => queue
};
