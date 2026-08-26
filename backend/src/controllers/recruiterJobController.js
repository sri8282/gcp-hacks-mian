const { Job, CandidateProfile, Notification } = require('../models');

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

    // Asynchronously notify eligible candidates whose CGPA meets minCGPA & interestedRoles overlap job.skills
    (async () => {
      try {
        const candidateProfiles = await CandidateProfile.findAll();
        const jobSkills = (job.skills || []).map((s) => (s || '').toString().toLowerCase());

        const matchingProfiles = candidateProfiles.filter((profile) => {
          if (job.minCGPA !== null && job.minCGPA !== undefined) {
            if (profile.cgpa === null || profile.cgpa === undefined || Number(profile.cgpa) < Number(job.minCGPA)) {
              return false;
            }
          }

          const interested = (profile.interestedRoles || []).map((r) => (r || '').toString().toLowerCase());
          if (jobSkills.length === 0 || interested.length === 0) {
            return false;
          }

          return jobSkills.some((skill) =>
            interested.some((role) => role.includes(skill) || skill.includes(role))
          );
        });

        const notificationsToCreate = matchingProfiles.map((profile) => ({
          userId: profile.userId,
          type: 'new_eligible_job',
          message: `New job opportunity: "${job.title}" at ${job.companyName || 'a company'} matches your profile.`,
          isRead: false,
        }));

        if (notificationsToCreate.length > 0) {
          await Notification.bulkCreate(notificationsToCreate);
        }
      } catch (err) {
        console.error('Error dispatching new job notifications:', err);
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
