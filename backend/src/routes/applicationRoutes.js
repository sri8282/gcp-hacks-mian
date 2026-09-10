const express = require('express');
const router = express.Router();
const {
  extractResumeText,
  checkAtsScore,
  applyToJob,
  getMyApplications,
  getApplicationById,
  deleteApplication,
} = require('../controllers/applicationController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/extract-text', verifyToken, extractResumeText);
router.post('/check-ats', verifyToken, checkAtsScore);
router.post('/', verifyToken, requireRole('candidate'), applyToJob);
router.get('/me', verifyToken, requireRole('candidate'), getMyApplications);
router.get('/:id', verifyToken, getApplicationById);
router.delete('/:id', verifyToken, requireRole('candidate'), deleteApplication);

module.exports = router;


