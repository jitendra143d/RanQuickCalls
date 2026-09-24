const mongoose = require('mongoose');
const env = require('./environment');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri);
    logger.info(`MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
