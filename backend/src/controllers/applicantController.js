const { Application, Job, User, CandidateProfile, Notification } = require('../models');
const { createNotification } = require('../services/notificationService');

const getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this job' });
    }

    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['id', 'email', 'name', 'role'],
          include: [
            {
              model: CandidateProfile,
              as: 'candidateProfile',
            },
          ],
        },
      ],
      order: [['appliedAt', 'DESC']],
    });

    return res.json({ applications });
  } catch (error) {
    console.error('Error in getApplicantsForJob:', error);
    return res.status(500).json({ message: 'Failed to fetch applicants' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentRound } = req.body;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: 'job',
        },
      ],
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not own the job associated with this application' });
    }

    const allowedStatuses = ['applied', 'screening', 'interview', 'offer', 'rejected'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
    }

    if (status !== undefined) application.status = status;
    if (currentRound !== undefined) application.currentRound = currentRound;

    await application.save();

    if (status && application.candidateId) {
      const jobTitle = application.job?.title || 'the job';
      const companyName = application.job?.companyName || application.job?.company || 'the company';
      let notifMessage = null;

      if (status === 'screening') {
        notifMessage = `Your application for ${jobTitle} at ${companyName} has moved to the screening round.`;
      } else if (status === 'interview') {
        notifMessage = `Great news! You've been moved to the interview round for ${jobTitle} at ${companyName}.`;
      } else if (status === 'offer') {
        notifMessage = `Congratulations! You've received an offer for ${jobTitle} at ${companyName}.`;
      } else if (status === 'rejected') {
        notifMessage = `Your application for ${jobTitle} at ${companyName} was not selected to move forward.`;
      }

      if (notifMessage) {
        await createNotification(
          application.candidateId,
          'status_update',
          notifMessage
        ).catch((err) => console.error('Error creating status update notification:', err));
      }
    }

    return res.json({ application });

  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    return res.status(500).json({ message: 'Failed to update application status' });
  }
};

const bulkMessage = async (req, res) => {
  try {
    const { applicationIds, message } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'applicationIds must be a non-empty array' });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const applications = await Application.findAll({
      where: { id: applicationIds },
      include: [
        {
          model: Job,
          as: 'job',
        },
      ],
    });

    if (applications.length !== applicationIds.length) {
      return res.status(404).json({ message: 'One or more applications were not found' });
    }

    const unauthorizedApp = applications.find((app) => app.job.recruiterId !== req.user.id);
    if (unauthorizedApp) {
      return res.status(403).json({
        message: 'Forbidden: You do not own all jobs associated with the selected applications',
      });
    }

    const senderName = req.user.companyName || req.user.name || 'Recruiter';
    const createdNotifications = await Promise.all(
      applications.map((app) =>
        createNotification(app.candidateId, 'recruiter_message', message.trim(), {
          senderName: app.job?.companyName || app.job?.company || senderName,
        }).catch((err) => {
          console.error('Error creating bulk notification:', err);
          return null;
        })
      )
    );

    return res.status(201).json({
      message: 'Bulk notifications created successfully',
      count: createdNotifications.length,
    });
  } catch (error) {
    console.error('Error in bulkMessage:', error);
    return res.status(500).json({ message: 'Failed to send bulk messages' });
  }
};

module.exports = {
  getApplicantsForJob,
  updateApplicationStatus,
  bulkMessage,
};
