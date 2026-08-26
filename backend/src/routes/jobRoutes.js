const express = require('express');
const router = express.Router();
const { getJobs, getJobById } = require('../controllers/jobController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getJobs);
router.get('/:id', verifyToken, getJobById);

module.exports = router;
