const { Op } = require('sequelize');
const { Application, Job, CandidateProfile } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const candidateId = req.user.id;

    // Fetch candidate applications
    const applications = await Application.findAll({
      where: { candidateId },
      attributes: ['status'],
    });

    const totalApplications = applications.length;

    const byStatus = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      if (byStatus.hasOwnProperty(app.status)) {
        byStatus[app.status]++;
      }
    });

    // Fetch candidate profile for CGPA check
    const candidateProfile = await CandidateProfile.findOne({
      where: { userId: candidateId },
    });

    const candidateCgpa = candidateProfile && candidateProfile.cgpa !== null && candidateProfile.cgpa !== undefined
      ? Number(candidateProfile.cgpa)
      : null;

    const now = new Date();
    const openJobs = await Job.findAll({
      where: {
        isOpen: true,
        adminOverrideClosed: false,
        [Op.or]: [
          { applicationCloseAt: null },
          { applicationCloseAt: { [Op.gt]: now } },
        ],
      },
      attributes: ['id', 'minCGPA'],
    });

    const eligibleJobsCount = openJobs.filter((job) => {
      if (job.minCGPA === null || job.minCGPA === undefined) {
        return true;
      }
      if (candidateCgpa === null) {
        return false;
      }
      return candidateCgpa >= Number(job.minCGPA);
    }).length;

    return res.json({
      totalApplications,
      byStatus,
      eligibleJobsCount,
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json({ message: 'Failed to fetch candidate dashboard stats' });
  }
};

module.exports = {
  getDashboardStats,
};
