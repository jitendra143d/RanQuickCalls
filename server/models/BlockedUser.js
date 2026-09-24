const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // The user performing the block
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // The user being blocked
    }
  },
  { timestamps: true }
);

// Ensure a user can only block another user once
blockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
blockedUserSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
