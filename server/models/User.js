const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_-]+$/
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      type: String,
      sparse: true
    },
    passwordHash: {
      type: String,
      required: function() {
        return !this.isGuest;
      }
    },
    profilePicture: {
      type: String,
      default: ''
    },
    ageRange: {
      type: String,
      enum: ['13-18', '18-25', '25-30', '30-40', '40-50', '50+'],
      required: true
    },
    languageLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Native'],
      default: 'Intermediate'
    },
    interests: {
      type: [String],
      default: []
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    country: {
      type: String,
      default: 'US'
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    suspendedUntil: {
      type: Date,
      default: null
    },
    totalCallMinutes: {
      type: Number,
      default: 0
    },
    callCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    settings: {
      notifications: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password candidate
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGuest) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Auto index fields for query optimizations
// Note: email index is already defined via schema field (unique: true, sparse: true)
userSchema.index({ isOnline: 1, lastActive: -1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
