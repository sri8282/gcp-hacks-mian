const express = require('express');
const router = express.Router();
const {
  googleLogin,
  createUser,
  loginWithPassword,
  getMe,
} = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/google', googleLogin);
router.post('/login', loginWithPassword);
router.post('/admin/create-user', verifyToken, requireRole('admin'), createUser);
router.get('/me', verifyToken, getMe);

module.exports = router;
