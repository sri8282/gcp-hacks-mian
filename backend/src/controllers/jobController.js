const { Op } = require('sequelize');
const { Job, CandidateProfile } = require('../models');

const computeJobBadges = (job, candidateProfile) => {
  const jobPlain = job.toJSON ? job.toJSON() : { ...job };

  if (!candidateProfile) {
    return {
      ...jobPlain,
      recommended: false,
      eligible: true,
    };
  }

  // Recommended computation: overlap between job.skills & candidateProfile.interestedRoles
  const jobSkills = (jobPlain.skills || []).map((s) => (s || '').toLowerCase());
  const candidateRoles = (candidateProfile.interestedRoles || []).map((r) => (r || '').toLowerCase());

  const recommended = jobSkills.some((skill) =>
    candidateRoles.some((role) => role.includes(skill) || skill.includes(role))
  );

  // Eligible computation: candidate CGPA >= job minCGPA
  let eligible = true;
  if (jobPlain.minCGPA !== null && jobPlain.minCGPA !== undefined) {
    const candidateCgpa = candidateProfile.cgpa !== null && candidateProfile.cgpa !== undefined
      ? Number(candidateProfile.cgpa)
      : null;
    const minCgpa = Number(jobPlain.minCGPA);

    if (candidateCgpa === null || candidateCgpa < minCgpa) {
      eligible = false;
    }
  }

  return {
    ...jobPlain,
    recommended,
    eligible,
  };
};

const getJobs = async (req, res) => {
  try {
    const { search, location, workplaceType } = req.query;
    const now = new Date();

    const whereClause = {
      isOpen: true,
      adminOverrideClosed: false,
      [Op.or]: [
        { applicationCloseAt: null },
        { applicationCloseAt: { [Op.gt]: now } },
      ],
    };

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { companyName: { [Op.iLike]: `%${search}%` } },
          ],
        },
      ];
    }

    if (location) {
      whereClause.location = { [Op.iLike]: `%${location}%` };
    }

    if (workplaceType) {
      whereClause.workplaceType = workplaceType;
    }

    const jobs = await Job.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    let candidateProfile = null;
    if (req.user && req.user.role === 'candidate') {
      candidateProfile = await CandidateProfile.findOne({
        where: { userId: req.user.id },
      });
    }

    const formattedJobs = jobs.map((job) =>
      req.user && req.user.role === 'candidate'
        ? computeJobBadges(job, candidateProfile)
        : job
    );

    return res.json({ jobs: formattedJobs });
  } catch (error) {
    console.error('Error in getJobs:', error);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let candidateProfile = null;
    if (req.user && req.user.role === 'candidate') {
      candidateProfile = await CandidateProfile.findOne({
        where: { userId: req.user.id },
      });
    }

    const formattedJob = req.user && req.user.role === 'candidate'
      ? computeJobBadges(job, candidateProfile)
      : job;

    return res.json({ job: formattedJob });
  } catch (error) {
    console.error('Error in getJobById:', error);
    return res.status(500).json({ message: 'Failed to fetch job details' });
  }
};

module.exports = {
  getJobs,
  getJobById,
};
