const express = require('express');
const { getSystemStatistics, getReports, suspendUser } = require('../controllers/adminController');
const { adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(adminOnly); // Protect all administrative routes

router.get('/statistics', getSystemStatistics);
router.get('/reports', getReports);
router.post('/users/suspend', suspendUser);

module.exports = router;
