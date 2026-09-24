const express = require('express');
const { body } = require('express-validator');
const { submitFeedback, reportAbuse, getUserRating } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth.middleware');
const { feedbackLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // Require auth for all rating operations

const feedbackValidation = [
  body('callId').notEmpty().withMessage('callId is required').isMongoId().withMessage('Invalid callId format'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5')
];

router.post('/call', feedbackLimiter, feedbackValidation, validate, submitFeedback);
router.post('/report', reportAbuse);
router.get('/user-rating/:userId', getUserRating);

module.exports = router;
