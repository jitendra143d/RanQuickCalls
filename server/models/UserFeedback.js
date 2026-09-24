const mongoose = require('mongoose');

const userFeedbackSchema = new mongoose.Schema(
  {
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallRecord',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // The user providing the rating
    },
    ratedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // The partner being rated
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500,
      default: ''
    },
    qualityRating: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    issues: {
      type: [String],
      enum: ['audio_issue', 'connection_issue', 'inappropriate_behavior', 'other_issue'],
      default: []
    }
  },
  { timestamps: true }
);

// Indexes
userFeedbackSchema.index({ ratedUserId: 1, createdAt: -1 });
userFeedbackSchema.index({ userId: 1, createdAt: -1 });
userFeedbackSchema.index({ rating: 1 });

module.exports = mongoose.model('UserFeedback', userFeedbackSchema);
