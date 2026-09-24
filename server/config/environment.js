require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ranquickcalls',
  redisUrl: process.env.NODE_ENV === 'test' ? null : (process.env.REDIS_URL || 'redis://localhost:6379'),
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key-12345',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  sentryDsn: process.env.SENTRY_DSN || '',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || ''
};
