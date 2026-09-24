const express = require('express');
const { getActiveCall, endCall, getCallHistory, getCallStatistics } = require('../controllers/callController');
const { protect } = require('../middleware/auth.middleware');
const { callLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect); // Secure all calling routes

router.get('/active', callLimiter, getActiveCall);
router.post('/end', endCall);
router.get('/history', getCallHistory);
router.get('/statistics', getCallStatistics);

module.exports = router;
