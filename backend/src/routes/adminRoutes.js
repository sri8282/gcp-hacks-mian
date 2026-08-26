const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserActive,
  adminUpdateUser,
  getAllJobs,
  adminUpdateJob,
  forceCloseJob,
  forceReopenJob,
  getPlatformStats,
  getApplicantsForJobAdmin,
  adminUpdateApplicationStatus,
  broadcastNotification,
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserActive);
router.patch('/users/:id', adminUpdateUser);

router.get('/jobs', getAllJobs);
router.patch('/jobs/:id', adminUpdateJob);
router.patch('/jobs/:id/force-close', forceCloseJob);
router.patch('/jobs/:id/force-reopen', forceReopenJob);
router.get('/jobs/:jobId/applicants', getApplicantsForJobAdmin);

router.patch('/applications/:id/status', adminUpdateApplicationStatus);

router.get('/stats', getPlatformStats);
router.post('/broadcast', broadcastNotification);

module.exports = router;

