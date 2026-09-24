const mongoose = require('mongoose');

const callRecordSchema = new mongoose.Schema(
  {
    user1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    user2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      default: 0 // In seconds
    },
    qualityMetrics: {
      audioQuality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      },
      latency: {
        type: Number
      },
      packetLoss: {
        type: Number
      },
      jitter: {
        type: Number
      }
    },
    status: {
      type: String,
      enum: ['completed', 'abandoned', 'failed', 'timeout'],
      default: 'completed'
    },
    endedBy: {
      type: String,
      enum: ['user1', 'user2', 'system']
    }
  },
  { timestamps: true }
);

// TTL index to automatically purge records older than 90 days (7776000 seconds)
callRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
// Indexing user ids for call history queries
callRecordSchema.index({ user1Id: 1, createdAt: -1 });
callRecordSchema.index({ user2Id: 1, createdAt: -1 });
callRecordSchema.index({ duration: 1 });

module.exports = mongoose.model('CallRecord', callRecordSchema);
