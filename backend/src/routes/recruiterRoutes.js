const express = require('express');
const router = express.Router();
const {
  createJob,
  getMyJobs,
  updateJob,
  toggleJobOpen,
} = require('../controllers/recruiterJobController');
const {
  getApplicantsForJob,
  updateApplicationStatus,
  bulkMessage,
} = require('../controllers/applicantController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('recruiter'));

router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.patch('/jobs/:id', updateJob);
router.patch('/jobs/:id/toggle', toggleJobOpen);

router.get('/jobs/:jobId/applicants', getApplicantsForJob);
router.patch('/applications/:id/status', updateApplicationStatus);
router.post('/bulk-message', bulkMessage);

module.exports = router;
