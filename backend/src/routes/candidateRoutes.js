const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/candidateController');
const { upsertCandidateProfile, getCandidateProfile } = require('../controllers/profileController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('candidate'));

router.get('/dashboard', getDashboardStats);
router.put('/profile', upsertCandidateProfile);
router.get('/profile', getCandidateProfile);

module.exports = router;
