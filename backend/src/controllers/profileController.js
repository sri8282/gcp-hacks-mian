const { CandidateProfile, User } = require('../models');

const upsertCandidateProfile = async (req, res) => {
  try {
    const {
      college,
      cgpa,
      certifications,
      passingYear,
      interestedRoles,
      linkedinUrl,
      portfolioUrl,
      resumeUrl,
      avatarUrl,
      avatar_url,
    } = req.body;

    const finalAvatarUrl = avatarUrl || avatar_url;

    let profile = await CandidateProfile.findOne({
      where: { userId: req.user.id },
    });

    if (profile) {
      if (college !== undefined) profile.college = college;
      if (cgpa !== undefined) profile.cgpa = cgpa;
      if (certifications !== undefined) profile.certifications = certifications;
      if (passingYear !== undefined) profile.passingYear = passingYear;
      if (interestedRoles !== undefined) profile.interestedRoles = interestedRoles;
      if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
      if (portfolioUrl !== undefined) profile.portfolioUrl = portfolioUrl;
      if (resumeUrl !== undefined) profile.resumeUrl = resumeUrl;
      if (finalAvatarUrl !== undefined) profile.avatarUrl = finalAvatarUrl;
      profile.isProfileComplete = true;

      await profile.save();
    } else {
      profile = await CandidateProfile.create({
        userId: req.user.id,
        college,
        cgpa,
        certifications: certifications || [],
        passingYear,
        interestedRoles: interestedRoles || [],
        linkedinUrl,
        portfolioUrl,
        resumeUrl,
        avatarUrl: finalAvatarUrl,
        isProfileComplete: true,
      });
    }

    const user = await User.findByPk(req.user.id);
    if (user) {
      if (finalAvatarUrl !== undefined) {
        user.avatarUrl = finalAvatarUrl;
      }
      user.isProfileComplete = true;
      await user.save();
    }

    return res.json({ profile });
  } catch (error) {
    console.error('Error in upsertCandidateProfile:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

const getCandidateProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      where: { userId: req.user.id },
    });

    return res.json({ profile: profile || null });
  } catch (error) {
    console.error('Error in getCandidateProfile:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

module.exports = {
  upsertCandidateProfile,
  getCandidateProfile,
};
