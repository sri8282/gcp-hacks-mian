const { User, Job, Application, CandidateProfile, RecruiterProfile, Notification } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('../services/notificationService');
const { getRecentLogs, getPlatformHealth } = require('../services/loggingService');

const getAllUsers = async (req, res) => {
  try {
    const { role, search, query, q } = req.query;
    const searchTerm = (search || query || q || '').trim();
    const whereClause = {};

    if (role && ['candidate', 'recruiter', 'admin'].includes(role)) {
      whereClause.role = role;
    }

    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
        { '$candidateProfile.college$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$recruiterProfile.companyName$': { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: RecruiterProfile, as: 'recruiterProfile' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ users });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      message: `User is now ${user.isActive ? 'active' : 'inactive'}`,
      user,
    });
  } catch (error) {
    console.error('Error in toggleUserActive:', error);
    return res.status(500).json({ message: 'Failed to toggle user status' });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, companyName } = req.body;

    const user = await User.findByPk(id, {
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: RecruiterProfile, as: 'recruiterProfile' },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({
        where: {
          email: normalizedEmail,
          id: { [Op.ne]: id },
        },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'Email address is already in use by another user' });
      }

      user.email = normalizedEmail;
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    await user.save();

    if (user.role === 'recruiter' && companyName !== undefined) {
      let recruiterProfile = user.recruiterProfile;
      if (recruiterProfile) {
        recruiterProfile.companyName = companyName.trim();
        await recruiterProfile.save();
      } else {
        recruiterProfile = await RecruiterProfile.create({
          userId: user.id,
          companyName: companyName.trim(),
        });
      }
    }

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: RecruiterProfile, as: 'recruiterProfile' },
      ],
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error in adminUpdateUser:', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      include: [
        {
          model: User,
          as: 'recruiter',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Application,
          as: 'applications',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const jobsWithCount = jobs.map((j) => {
      const plain = j.get({ plain: true });
      const applicantCount = plain.applications ? plain.applications.length : 0;
      delete plain.applications;
      return {
        ...plain,
        applicantCount,
        applicationsCount: applicantCount,
      };
    });

    return res.json({ jobs: jobsWithCount });
  } catch (error) {
    console.error('Error in getAllJobs:', error);
    return res.status(500).json({ message: 'Failed to fetch platform jobs' });
  }
};

const adminUpdateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const {
      title,
      companyName,
      salaryLPA,
      location,
      workplaceType,
      skills,
      jobDescription,
      minCGPA,
      applicationOpenAt,
      applicationCloseAt,
      hiringRounds,
      screeningQuestions,
      isOpen,
      adminOverrideClosed,
    } = req.body;

    if (title !== undefined) job.title = title;
    if (companyName !== undefined) job.companyName = companyName;
    if (salaryLPA !== undefined) job.salaryLPA = salaryLPA;
    if (location !== undefined) job.location = location;
    if (workplaceType !== undefined) job.workplaceType = workplaceType;
    if (skills !== undefined) job.skills = skills;
    if (jobDescription !== undefined) job.jobDescription = jobDescription;
    if (minCGPA !== undefined) job.minCGPA = minCGPA;
    if (applicationOpenAt !== undefined) job.applicationOpenAt = applicationOpenAt ? new Date(applicationOpenAt) : null;
    if (applicationCloseAt !== undefined) job.applicationCloseAt = applicationCloseAt ? new Date(applicationCloseAt) : null;
    if (hiringRounds !== undefined) job.hiringRounds = hiringRounds;
    if (screeningQuestions !== undefined) job.screeningQuestions = screeningQuestions;
    if (isOpen !== undefined) job.isOpen = isOpen;
    if (adminOverrideClosed !== undefined) job.adminOverrideClosed = adminOverrideClosed;

    await job.save();

    return res.json({ job });
  } catch (error) {
    console.error('Error in adminUpdateJob:', error);
    return res.status(500).json({ message: 'Failed to update job' });
  }
};

const forceCloseJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.adminOverrideClosed = true;
    job.isOpen = false;
    await job.save();

    return res.json({
      message: 'Job has been force-closed by admin',
      job,
    });
  } catch (error) {
    console.error('Error in forceCloseJob:', error);
    return res.status(500).json({ message: 'Failed to force-close job' });
  }
};

const forceReopenJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.adminOverrideClosed = false;
    job.isOpen = true;
    await job.save();

    return res.json({
      message: 'Admin override removed from job',
      job,
    });
  } catch (error) {
    console.error('Error in forceReopenJob:', error);
    return res.status(500).json({ message: 'Failed to reopen job' });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const totalCandidates = await User.count({ where: { role: 'candidate' } });
    const totalRecruiters = await User.count({ where: { role: 'recruiter' } });
    const totalJobs = await Job.count();
    const totalOpenJobs = await Job.count({
      where: {
        isOpen: true,
        adminOverrideClosed: false,
      },
    });
    const totalApplications = await Application.count();

    const applications = await Application.findAll({
      attributes: ['status'],
    });

    const applicationsByStatus = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      if (applicationsByStatus.hasOwnProperty(app.status)) {
        applicationsByStatus[app.status]++;
      }
    });

    return res.json({
      totalCandidates,
      totalRecruiters,
      totalJobs,
      totalOpenJobs,
      totalApplications,
      applicationsByStatus,
    });
  } catch (error) {
    console.error('Error in getPlatformStats:', error);
    return res.status(500).json({ message: 'Failed to fetch platform statistics' });
  }
};

const getApplicantsForJobAdmin = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['id', 'name', 'email'],
          include: [{ model: CandidateProfile, as: 'candidateProfile' }],
        },
      ],
      order: [['atsScore', 'DESC'], ['appliedAt', 'ASC']],
    });

    return res.json({ job, applications });
  } catch (error) {
    console.error('Error in getApplicantsForJobAdmin:', error);
    return res.status(500).json({ message: 'Failed to fetch applicants' });
  }
};

const adminUpdateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentRound } = req.body;

    const application = await Application.findByPk(id, {
      include: [{ model: Job, as: 'job' }],
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const validStatuses = ['applied', 'screening', 'interview', 'offer', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (status) application.status = status;
    if (currentRound !== undefined) application.currentRound = currentRound;

    await application.save();

    if (status) {
      await createNotification(
        application.candidateId,
        'status_update',
        `Your application status for "${application.job ? application.job.title : 'Job'}" has been updated to "${status}".`
      ).catch((err) => console.error('Error creating status notification:', err));
    }

    return res.json({ application });
  } catch (error) {
    console.error('Error in adminUpdateApplicationStatus:', error);
    return res.status(500).json({ message: 'Failed to update application status' });
  }
};

const broadcastNotification = async (req, res) => {
  try {
    const { targetType, candidateIds, subject, title, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Notification message body is required' });
    }

    let targetCandidates = [];
    if (targetType === 'all' || !candidateIds || candidateIds.length === 0) {
      targetCandidates = await User.findAll({
        where: { role: 'candidate', isActive: true },
        attributes: ['id', 'email', 'name'],
      });
    } else {
      targetCandidates = await User.findAll({
        where: { id: candidateIds, role: 'candidate' },
        attributes: ['id', 'email', 'name'],
      });
    }

    if (targetCandidates.length === 0) {
      return res.status(404).json({ message: 'No active candidate recipients found' });
    }

    const notifSubject = title || subject || '';
    const fullMessage = notifSubject ? `${notifSubject}\n\n${message.trim()}` : message.trim();
    const senderName = req.user?.name || 'HireHub Admin';

    const notifPromises = targetCandidates.map((c) =>
      createNotification(c.id, 'admin_broadcast', fullMessage, {
        senderName,
      }).catch((err) => console.error(`Error creating notification for candidate ${c.id}:`, err))
    );

    await Promise.all(notifPromises);

    return res.json({
      message: `Notification broadcast successfully to ${targetCandidates.length} candidate(s)`,
      count: targetCandidates.length,
    });
  } catch (error) {
    console.error('Error in broadcastNotification:', error);
    return res.status(500).json({ message: 'Failed to broadcast notification' });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const [logs, health] = await Promise.all([
      getRecentLogs(limit),
      getPlatformHealth(),
    ]);

    return res.json({
      logs,
      health,
    });
  } catch (error) {
    console.error('Error in getSystemLogs:', error);
    return res.status(500).json({ message: 'Failed to fetch system logs' });
  }
};

const adminDeleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Application.destroy({ where: { jobId: id } });
    await job.destroy();

    return res.json({ message: 'Job posting permanently deleted' });
  } catch (error) {
    console.error('Error in adminDeleteJob:', error);
    return res.status(500).json({ message: 'Failed to delete job' });
  }
};

module.exports = {
  getAllUsers,
  toggleUserActive,
  adminUpdateUser,
  getAllJobs,
  adminUpdateJob,
  forceCloseJob,
  forceReopenJob,
  adminDeleteJob,
  getPlatformStats,
  getApplicantsForJobAdmin,
  adminUpdateApplicationStatus,
  broadcastNotification,
  getSystemLogs,
};

