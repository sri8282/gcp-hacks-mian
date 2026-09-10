const { Application, Job, CandidateProfile, Notification } = require('../models');
const { calculateATS } = require('../services/atsService');
const { generateUploadUrl } = require('../services/storageService');
const { analyzeResumeMatch } = require('../services/geminiService');
const { createNotification } = require('../services/notificationService');

const checkAtsScore = async (req, res) => {
  try {
    const { jobId, resumeText: reqResumeText, candidateSkills } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    let job = await Job.findByPk(jobId);
    if (!job) {
      job = await Job.findOne();
    }
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let resumeText = reqResumeText || '';
    if (!resumeText && req.user) {
      const profile = await CandidateProfile.findOne({ where: { userId: req.user.id } });
      if (profile) {
        resumeText = [
          profile.college ? `College: ${profile.college}` : '',
          profile.cgpa ? `CGPA: ${profile.cgpa}` : '',
          Array.isArray(profile.certifications) ? `Certifications: ${profile.certifications.join(', ')}` : '',
          Array.isArray(profile.interestedRoles) ? `Interested Roles: ${profile.interestedRoles.join(', ')}` : '',
        ].filter(Boolean).join('\n');
      }
    }

    if (Array.isArray(candidateSkills) && candidateSkills.length > 0) {
      resumeText += `\nSkills: ${candidateSkills.join(', ')}`;
    }

    const targetJobDescription = job.jobDescription || job.description || `${job.title} at ${job.companyName || 'Company'}`;

    try {
      const aiResult = await analyzeResumeMatch(resumeText, targetJobDescription, job.skills);
      return res.json({
        success: true,
        source: 'gemini-ai',
        ...aiResult,
      });
    } catch (aiError) {
      console.warn('Gemini API resume analysis failed, falling back to keyword ATS calculation:', aiError.message);
      const score = calculateATS(resumeText, { ...job.toJSON(), jobDescription: targetJobDescription });
      return res.json({
        success: true,
        source: 'keyword-fallback',
        matchScore: score,
        strengths: [],
        gaps: [],
        summary: 'Basic keyword matching analysis was used.',
      });
    }
  } catch (error) {
    console.error('Error in checkAtsScore:', error);
    return res.status(500).json({ message: 'Failed to evaluate ATS score' });
  }
};

const getResumeUploadUrl = async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName) {
      return res.status(400).json({ message: 'fileName is required' });
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFileName = `${req.user.id}_${Date.now()}_${sanitizedFileName}`;

    const { uploadUrl, filePath } = await generateUploadUrl(uniqueFileName, contentType || 'application/pdf');

    return res.json({ uploadUrl, filePath });
  } catch (error) {
    console.error('Error in getResumeUploadUrl:', error);
    return res.status(500).json({ message: 'Failed to generate resume upload URL' });
  }
};

const applyToJob = async (req, res) => {
  try {
    const { jobId, resumeUrl, resumeText, screeningAnswers } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const now = new Date();
    if (!job.isOpen || job.adminOverrideClosed || (job.applicationCloseAt && job.applicationCloseAt <= now)) {
      return res.status(400).json({ message: 'Job is closed for applications' });
    }

    const candidateProfile = await CandidateProfile.findOne({
      where: { userId: req.user.id },
    });

    if (job.minCGPA !== null && job.minCGPA !== undefined) {
      const candidateCgpa = candidateProfile && candidateProfile.cgpa !== null && candidateProfile.cgpa !== undefined
        ? Number(candidateProfile.cgpa)
        : null;
      const minCgpa = Number(job.minCGPA);

      if (candidateCgpa === null || candidateCgpa < minCgpa) {
        return res.status(403).json({ message: 'Ineligible to apply: Minimum CGPA requirement not met' });
      }
    }

    const existingApplication = await Application.findOne({
      where: {
        candidateId: req.user.id,
        jobId,
      },
    });

    if (existingApplication) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }

    let atsScore = 0;
    try {
      const targetJobDescription = job.jobDescription || job.description || `${job.title} at ${job.companyName || 'Company'}`;
      const aiRes = await analyzeResumeMatch(resumeText || '', targetJobDescription, job.skills);
      atsScore = aiRes.matchScore;
    } catch (aiErr) {
      console.warn('Gemini ATS score generation failed during applyToJob, using fallback:', aiErr.message);
      atsScore = calculateATS(resumeText, job);
    }

    const application = await Application.create({
      candidateId: req.user.id,
      jobId,
      status: 'applied',
      currentRound: 0,
      screeningAnswers: screeningAnswers || {},
      atsScore,
      resumeUrl: resumeUrl || (candidateProfile ? candidateProfile.resumeUrl : null),
      appliedAt: new Date(),
    });

    // Format IST application close date for notification
    let closeDateStr = '';
    if (job.applicationCloseAt) {
      closeDateStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(job.applicationCloseAt));
    }

    const companyName = job.companyName || 'the company';
    const notifMessage = job.applicationCloseAt
      ? `You applied to ${job.title} at ${companyName}. Applications close ${closeDateStr} IST.`
      : `You applied to ${job.title} at ${companyName}.`;

    // Create automatic confirmation notification for candidate
    await createNotification(
      req.user.id,
      'application_confirmation',
      notifMessage
    ).catch((err) => console.error('Error creating application confirmation notification:', err));



    return res.status(201).json({ application });
  } catch (error) {
    console.error('Error in applyToJob:', error);
    return res.status(500).json({ message: 'Failed to submit application' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { candidateId: req.user.id },
      include: [
        {
          model: Job,
          as: 'job',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ applications });
  } catch (error) {
    console.error('Error in getMyApplications:', error);
    return res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (req.user.role === 'candidate' && application.candidateId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    return res.json({ application });
  } catch (error) {
    console.error('Error in getApplicationById:', error);
    return res.status(500).json({ message: 'Failed to fetch application details' });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.candidateId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Not your application' });
    }

    await application.destroy();

    return res.json({ message: 'Application removed successfully' });
  } catch (error) {
    console.error('Error in deleteApplication:', error);
    return res.status(500).json({ message: 'Failed to delete application' });
  }
};

module.exports = {
  checkAtsScore,
  getResumeUploadUrl,
  applyToJob,
  getMyApplications,
  getApplicationById,
  deleteApplication,
};

