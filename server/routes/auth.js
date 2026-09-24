const express = require('express');
const { body } = require('express-validator');
const { register, login, guestLogin, logout, socialLogin, mobileLogin } = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Input validation schemas
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain alphanumeric characters, underscores, and hyphens'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'),
  body('ageRange')
    .isIn(['13-18', '18-25', '25-30', '30-40', '40-50', '50+'])
    .withMessage('Please select a valid age range'),
  body('languageLevel')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Native'])
    .withMessage('Please select a valid language level')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const guestValidation = [
  body('ageRange')
    .isIn(['13-18', '18-25', '25-30', '30-40', '40-50', '50+'])
    .withMessage('Please select a valid age range'),
  body('languageLevel')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Native'])
    .withMessage('Please select a valid language level')
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/guest', authLimiter, guestValidation, validate, guestLogin);
router.post('/logout', protect, logout);
router.post('/social', socialLogin);
router.post('/mobile', mobileLogin);

module.exports = router;
