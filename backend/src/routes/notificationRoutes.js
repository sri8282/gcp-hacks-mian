const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getMyNotifications);
router.patch('/:id/read', verifyToken, markAsRead);

module.exports = router;
