const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallRecord',
      required: true
    },
    reason: {
      type: String,
      enum: ['inappropriate_language', 'harassment', 'spam', 'nudity', 'underage', 'other'],
      required: true
    },
    description: {
      type: String,
      maxlength: 1000,
      default: ''
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'dismissed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
