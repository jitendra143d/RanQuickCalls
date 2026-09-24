const ErrorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');
const env = require('../config/environment');

class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR;

  // Log error
  if (err.statusCode >= 500) {
    logger.error(`${err.message}\nStack: ${err.stack}`);
  } else {
    logger.warn(`Operational Warning: ${err.message}`);
  }

  // Response structure
  const response = {
    success: false,
    message: err.message || 'Something went wrong',
    errorCode: err.errorCode
  };

  // Include stack trace in development mode
  if (!env.isProduction) {
    response.stack = err.stack;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    response.message = 'Duplicate field value entered';
    response.statusCode = 400;
    response.errorCode = ErrorCodes.USER_ALREADY_EXISTS;
    return res.status(400).json(response);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    response.message = Object.values(err.errors).map(val => val.message).join(', ');
    response.statusCode = 400;
    response.errorCode = ErrorCodes.VALIDATION_ERROR;
    return res.status(400).json(response);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    response.message = 'Invalid token. Please log in again.';
    response.statusCode = 401;
    response.errorCode = ErrorCodes.TOKEN_INVALID;
    return res.status(401).json(response);
  }

  if (err.name === 'TokenExpiredError') {
    response.message = 'Your token has expired. Please log in again.';
    response.statusCode = 401;
    response.errorCode = ErrorCodes.TOKEN_EXPIRED;
    return res.status(401).json(response);
  }

  res.status(err.statusCode).json(response);
};

module.exports = {
  AppError,
  errorHandler
};
