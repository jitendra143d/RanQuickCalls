const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./environment');
const logger = require('../utils/logger');
const User = require('../models/User');
const CallRecord = require('../models/CallRecord');
const { addToQueue, removeFromQueue, removeSocketFromQueue, findMatch } = require('../services/matchingService');

// Map to track user socket associations and active call rooms
// socketId -> { userId, username, ageRange, languageLevel, interests, activeCallId }
const activeSockets = new Map();

// Map of active calls: callId -> { user1: { socketId, userId, username, accepted }, user2: { socketId, userId, username, accepted }, timer, dbRecordId }
const activeCalls = new Map();

const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: env.corsOrigin.split(','),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token;

      // Fallback check handshake headers
      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.isSuspended) {
        return next(new Error('Authentication error: Account is suspended'));
      }

      // Attach user details to socket
      socket.user = {
        id: user._id.toString(),
        username: user.username,
        languageLevel: user.languageLevel,
        ageRange: user.ageRange,
        interests: user.interests,
        country: user.country || 'US'
      };

      next();
    } catch (err) {
      logger.error(`Socket auth failure: ${err.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`User connected to socket: ${user.username} (Socket: ${socket.id})`);

    // Track active connection
    activeSockets.set(socket.id, {
      userId: user.id,
      username: user.username,
      languageLevel: user.languageLevel,
      ageRange: user.ageRange,
      interests: user.interests,
      country: user.country,
      activeCallId: null
    });

    // Mark user online in DB
    User.findByIdAndUpdate(user.id, { isOnline: true, lastActive: new Date() }).catch(err => {
      logger.error(`Failed to update online state for ${user.id}: ${err.message}`);
    });

    /**
     * Client joins the match queue
     */
    socket.on('user:join-queue', async (data = {}) => {
      try {
        const { preferredCountry = 'Global', callMode = 'video' } = data;
        const socketData = activeSockets.get(socket.id);
        if (!socketData) return;

        // Clean up any existing call they might be in
        if (socketData.activeCallId) {
          terminateCall(io, socketData.activeCallId, socket.id);
        }

        const queueItem = await addToQueue({
          socketId: socket.id,
          userId: user.id,
          username: user.username,
          languageLevel: user.languageLevel,
          ageRange: user.ageRange,
          interests: user.interests,
          country: socketData.country || 'US',
          preferredCountry,
          callMode
        });

        // Inform user they are waiting
        socket.emit('match:waiting', { queuePosition: 1, estimatedWait: 15 });

        // Run matching lookup
        const partner = findMatch(queueItem);
        if (partner) {
          // Match Found! Remove both from the queue
          removeFromQueue(user.id);
          removeFromQueue(partner.userId);

          const matchId = `match_${Date.now()}_${user.id}_${partner.userId}`;

          try {
            // 1. Create Call Record in Database
            const callRecord = await CallRecord.create({
              user1Id: user.id,
              user2Id: partner.userId,
              status: 'completed',
              startTime: new Date()
            });

            // 2. Create the call room active session
            activeCalls.set(matchId, {
              user1: { socketId: socket.id, userId: user.id, username: user.username, accepted: true },
              user2: { socketId: partner.socketId, userId: partner.userId, username: partner.username, accepted: true },
              status: 'calling',
              dbRecordId: callRecord._id.toString()
            });

            // Update socket active call contexts
            socketData.activeCallId = matchId;
            const partnerSocketData = activeSockets.get(partner.socketId);
            if (partnerSocketData) {
              partnerSocketData.activeCallId = matchId;
            }

            // 3. Emit match:accepted events with otherUser info immediately (Instaconnect)
            io.to(socket.id).emit('match:accepted', {
              matchId,
              otherUserSocketId: partner.socketId,
              otherUser: {
                id: partner.userId,
                username: partner.username,
                ageRange: partner.ageRange,
                languageLevel: partner.languageLevel,
                country: partner.country
              }
            });

            io.to(partner.socketId).emit('match:accepted', {
              matchId,
              otherUserSocketId: socket.id,
              otherUser: {
                id: user.id,
                username: user.username,
                ageRange: user.ageRange,
                languageLevel: user.languageLevel,
                country: socketData.country || 'US'
              }
            });

            logger.info(`Auto-Match Call started between ${user.username} and ${partner.username}. MatchId: ${matchId}`);
          } catch (err) {
            logger.error(`Failed to initialize automatic call database record: ${err.message}`);
          }
        }
      } catch (err) {
        logger.error(`Error in join-queue socket handler: ${err.message}`);
      }
    });

    /**
     * User accepts the match (Deprecated - Handled automatically)
     */
    socket.on('user:accept-match', (data) => {
      logger.debug(`user:accept-match ignored (call matching is automatic)`);
    });

    /**
     * User rejects/declines the match (Deprecated - Handled automatically)
     */
    socket.on('user:reject-match', (data) => {
      logger.debug(`user:reject-match ignored (call matching is automatic)`);
    });

    /**
     * WebRTC signaling - forward SDP offer
     */
    socket.on('call:webrtc-offer', (data) => {
      const { to, offer } = data;
      logger.debug(`Relaying WebRTC offer from ${socket.id} to ${to}`);
      io.to(to).emit('call:webrtc-offer', {
        from: socket.id,
        offer
      });
    });

    /**
     * WebRTC signaling - forward SDP answer
     */
    socket.on('call:webrtc-answer', (data) => {
      const { to, answer } = data;
      logger.debug(`Relaying WebRTC answer from ${socket.id} to ${to}`);
      io.to(to).emit('call:webrtc-answer', {
        from: socket.id,
        answer
      });
    });

    /**
     * WebRTC signaling - forward ICE Candidate
     */
    socket.on('call:ice-candidate', (data) => {
      const { to, candidate } = data;
      logger.debug(`Relaying ICE Candidate from ${socket.id} to ${to}`);
      io.to(to).emit('call:ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    /**
     * User manually ends the call
     */
    socket.on('user:end-call', () => {
      const socketData = activeSockets.get(socket.id);
      if (socketData && socketData.activeCallId) {
        terminateCall(io, socketData.activeCallId, socket.id);
      }
    });

    /**
     * User sends a chat message during a call
     */
    socket.on('chat:message', (data) => {
      const { message } = data;
      const socketData = activeSockets.get(socket.id);
      if (socketData && socketData.activeCallId) {
        const call = activeCalls.get(socketData.activeCallId);
        if (call && call.status === 'calling') {
          const partnerSocketId = call.user1.socketId === socket.id ? call.user2.socketId : call.user1.socketId;
          io.to(partnerSocketId).emit('chat:message', {
            from: socket.user.username,
            message
          });
        }
      }
    });

    /**
     * User reports abusive behavior during call
     */
    socket.on('user:report-abuse', (data) => {
      // In Socket context we can end the call immediately for safety
      const socketData = activeSockets.get(socket.id);
      if (socketData && socketData.activeCallId) {
        logger.warn(`Abuse reported by ${user.username} in call ${socketData.activeCallId}`);
        terminateCall(io, socketData.activeCallId, socket.id);
      }
    });

    /**
     * Handle Disconnect
     */
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${user.username} (Socket: ${socket.id})`);

      // 1. Remove from matching queue
      removeSocketFromQueue(socket.id);
      removeFromQueue(user.id);

      // 2. End any active call
      const socketData = activeSockets.get(socket.id);
      if (socketData && socketData.activeCallId) {
        terminateCall(io, socketData.activeCallId, socket.id);
      }

      // 3. Mark user offline in DB
      User.findByIdAndUpdate(user.id, { isOnline: false, lastActive: new Date() }).catch(err => {
        logger.error(`Failed to update offline state for ${user.id}: ${err.message}`);
      });

      activeSockets.delete(socket.id);
    });
  });
};

/**
 * Handle match connection timeout (user(s) did not click accept in time)
 */
const handleMatchTimeout = (io, matchId) => {
  const call = activeCalls.get(matchId);
  if (!call) return;

  logger.info(`Match ${matchId} timed out. At least one user did not accept.`);

  // Notify clients of timeout
  io.to(call.user1.socketId).emit('match:timeout');
  io.to(call.user2.socketId).emit('match:timeout');

  // Clear call contexts
  clearCallContexts(matchId);
};

/**
 * Handle match rejection by one user
 */
const handleMatchRejection = (io, matchId, rejectingSocketId) => {
  const call = activeCalls.get(matchId);
  if (!call) return;

  logger.info(`Match ${matchId} rejected by socket ${rejectingSocketId}`);

  const partnerSocketId = call.user1.socketId === rejectingSocketId ? call.user2.socketId : call.user1.socketId;

  // Inform matching partner
  io.to(partnerSocketId).emit('match:rejected', { reason: 'user_declined' });
  io.to(rejectingSocketId).emit('match:rejected', { reason: 'you_declined' });

  // Clear contexts
  clearCallContexts(matchId);
};

/**
 * Gracefully end an active call
 */
const terminateCall = async (io, callId, endedBySocketId) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  logger.info(`Terminating call ${callId}`);

  // Determine who ended it for DB record
  let endedBy = 'system';
  if (endedBySocketId === call.user1.socketId) endedBy = 'user1';
  if (endedBySocketId === call.user2.socketId) endedBy = 'user2';

  // 1. Notify both peers
  io.to(call.user1.socketId).emit('call:ended', { endedBy, callId });
  io.to(call.user2.socketId).emit('call:ended', { endedBy, callId });

  // 2. Save duration & end state in Database if record exists
  if (call.dbRecordId && call.status === 'calling') {
    try {
      const record = await CallRecord.findById(call.dbRecordId);
      if (record) {
        record.endTime = new Date();
        const durationSec = Math.floor((record.endTime.getTime() - record.startTime.getTime()) / 1000);
        record.duration = durationSec;
        record.endedBy = endedBy;
        record.status = 'completed';
        await record.save();

        // Increment user calling statistics
        const durationMin = durationSec / 60;
        await User.findByIdAndUpdate(call.user1.userId, { 
          $inc: { totalCallMinutes: durationMin, callCount: 1 } 
        });
        await User.findByIdAndUpdate(call.user2.userId, { 
          $inc: { totalCallMinutes: durationMin, callCount: 1 } 
        });

        logger.info(`Call duration recorded: ${durationSec}s. Database updated.`);
      }
    } catch (err) {
      logger.error(`Error saving final call details: ${err.message}`);
    }
  }

  // Clear timeouts if any
  if (call.timer) clearTimeout(call.timer);

  // 3. Clear call associations
  clearCallContexts(callId);
};

/**
 * Helper to wipe mappings after calls end
 */
const clearCallContexts = (callId) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  const user1Sock = activeSockets.get(call.user1.socketId);
  if (user1Sock && user1Sock.activeCallId === callId) {
    user1Sock.activeCallId = null;
  }

  const user2Sock = activeSockets.get(call.user2.socketId);
  if (user2Sock && user2Sock.activeCallId === callId) {
    user2Sock.activeCallId = null;
  }

  activeCalls.delete(callId);
};

module.exports = setupSocket;
