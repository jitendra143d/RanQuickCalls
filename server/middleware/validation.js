const { validationResult } = require('express-validator');
const ErrorCodes = require('../utils/errorCodes');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
      errorCode: ErrorCodes.VALIDATION_ERROR
    });
  }
  next();
};

module.exports = {
  validate
};
