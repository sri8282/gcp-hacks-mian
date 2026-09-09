const { Job, CandidateProfile, Notification, User } = require('../models');
const { createNotification } = require('../services/notificationService');

const createJob = async (req, res) => {
  try {
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
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    if (applicationOpenAt && applicationCloseAt) {
      if (new Date(applicationCloseAt) <= new Date(applicationOpenAt)) {
        return res.status(400).json({
          message: 'applicationCloseAt must be after applicationOpenAt',
        });
      }
    }

    const job = await Job.create({
      recruiterId: req.user.id,
      title,
      companyName,
      salaryLPA,
      location,
      workplaceType,
      skills: skills || [],
      jobDescription,
      minCGPA,
      applicationOpenAt: applicationOpenAt ? new Date(applicationOpenAt) : null,
      applicationCloseAt: applicationCloseAt ? new Date(applicationCloseAt) : null,
      hiringRounds: hiringRounds || [],
      screeningQuestions: screeningQuestions || [],
      isOpen: true,
      adminOverrideClosed: false,
    });

    // Asynchronously send email notification to ALL registered candidate users in background
    (async () => {
      try {
        const candidates = await User.findAll({
          where: { role: 'candidate', isActive: true },
          attributes: ['id', 'email', 'name'],
        });

        const companyStr = job.companyName || 'HireHub';
        const skillsStr = Array.isArray(job.skills) && job.skills.length > 0 ? job.skills.join(', ') : 'N/A';
        const salaryStr = job.salaryLPA ? `${job.salaryLPA} LPA` : 'Not specified';
        const locationStr = job.location ? `${job.location} (${job.workplaceType || 'Remote'})` : (job.workplaceType || 'N/A');

        const subject = `New Job Opening: ${job.title} at ${companyStr}`;
        const messageBody =
          `A new job opportunity has just been posted on HireHub!\n\n` +
          `• Job Title: ${job.title}\n` +
          `• Company: ${companyStr}\n` +
          `• Location: ${locationStr}\n` +
          `• Salary / Package: ${salaryStr}\n` +
          `• Required Skills: ${skillsStr}\n\n` +
          `Log in to your HireHub candidate dashboard to view full details and submit your application.`;

        await Promise.all(
          candidates.map((cand) =>
            createNotification(
              cand.id,
              'new_eligible_job',
              messageBody,
              {
                subject,
                title: subject,
              }
            ).catch((err) => console.error(`Error sending job post auto-email to candidate ${cand.id}:`, err))
          )
        );
      } catch (err) {
        console.error('Error dispatching job creation candidate auto-emails:', err);
      }
    })();

    return res.status(201).json({ job });
  } catch (error) {
    console.error('Error in createJob:', error);
    return res.status(500).json({ message: 'Failed to create job' });
  }
};


const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { recruiterId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.json({ jobs });
  } catch (error) {
    console.error('Error in getMyJobs:', error);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this job' });
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
    } = req.body;

    const openAt = applicationOpenAt !== undefined ? applicationOpenAt : job.applicationOpenAt;
    const closeAt = applicationCloseAt !== undefined ? applicationCloseAt : job.applicationCloseAt;

    if (openAt && closeAt && new Date(closeAt) <= new Date(openAt)) {
      return res.status(400).json({
        message: 'applicationCloseAt must be after applicationOpenAt',
      });
    }

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

    await job.save();

    return res.json({ job });
  } catch (error) {
    console.error('Error in updateJob:', error);
    return res.status(500).json({ message: 'Failed to update job' });
  }
};

const toggleJobOpen = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this job' });
    }

    if (job.adminOverrideClosed) {
      return res.status(403).json({
        message: 'Admin has closed this job. Recruiter cannot toggle status.',
      });
    }

    job.isOpen = !job.isOpen;
    await job.save();

    return res.json({
      message: `Job is now ${job.isOpen ? 'open' : 'closed'}`,
      job,
    });
  } catch (error) {
    console.error('Error in toggleJobOpen:', error);
    return res.status(500).json({ message: 'Failed to toggle job status' });
  }
};

module.exports = {
  createJob,
  getMyJobs,
  updateJob,
  toggleJobOpen,
};
