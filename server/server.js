const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const cookieParser = require('cookie-parser');

const env = require('./config/environment');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const { initializeRedis } = require('./config/redis');
const setupSocket = require('./config/socket');
const { errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/call');
const userRoutes = require('./routes/user');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Configure CORS Options
const allowedOrigins = env.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      // Always permit localhost in non-production for local dev
      (env.nodeEnv !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin))
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Global Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'Server is running',
    timestamp: new Date()
  });
});

// 404 Route handler
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API Endpoint not found'
  });
});

// Global Error Handler
app.use(errorHandler);

// Startup Initialization
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Connect to Redis (or fallback to Memory)
    await initializeRedis();

    // 3. Setup Socket.io Signaling
    setupSocket(server);

    // 4. Listen on port
    const PORT = env.port;
    if (process.env.NODE_ENV !== 'test') {
      server.listen(PORT, () => {
        logger.info(`RanQuickCalls Server running in ${env.nodeEnv} mode on port ${PORT}`);
      });
    }
  } catch (error) {
    logger.error(`Critical Server Startup Failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Export for testing
