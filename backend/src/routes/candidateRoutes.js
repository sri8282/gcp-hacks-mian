const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/candidateController');
const { upsertCandidateProfile, getCandidateProfile } = require('../controllers/profileController');
const { getResumeUploadUrl } = require('../controllers/applicationController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('candidate'));

router.get('/dashboard', getDashboardStats);
router.put('/profile', upsertCandidateProfile);
router.get('/profile', getCandidateProfile);
router.post('/resume-upload-url', getResumeUploadUrl);

module.exports = router;

