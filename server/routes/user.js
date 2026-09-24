const express = require('express');
const { getProfile, updateProfile, uploadPicture, blockUser, unblockUser, getBlockedUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All user profile routes require auth

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/picture', uploadPicture);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked', getBlockedUsers);

module.exports = router;
