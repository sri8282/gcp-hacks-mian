const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyGoogleToken } = require('../services/googleAuth');
const { User, CandidateProfile, RecruiterProfile } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

const formatCandidateProfilePayload = (candidateProfile, userName) => {
  if (!candidateProfile) return null;
  return {
    fullName: userName || 'Candidate',
    collegeName: candidateProfile.college || '',
    cgpa: candidateProfile.cgpa ? parseFloat(candidateProfile.cgpa) : 0,
    certifications: candidateProfile.certifications || [],
    passingYear: candidateProfile.passingYear ? String(candidateProfile.passingYear) : '',
    interestedRoles: candidateProfile.interestedRoles || [],
    linkedInUrl: candidateProfile.linkedinUrl || '',
    portfolioUrl: candidateProfile.portfolioUrl || '',
    isOnboarded: Boolean(candidateProfile.isProfileComplete || candidateProfile.college),
  };
};

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const payload = await verifyGoogleToken(idToken);
    const { email, sub: googleId, name } = payload;

    let user = await User.findOne({
      where: { email },
    });

    if (user) {
      if (user.role !== 'candidate') {
        return res.status(403).json({
          message: 'Google sign-in is restricted to candidate accounts only',
        });
      }
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        googleId,
        role: 'candidate',
        passwordHash: null,
        isActive: true,
      });

      await CandidateProfile.create({
        userId: user.id,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const token = generateToken(user);

    const candidateProfile = user.role === 'candidate' ? await CandidateProfile.findOne({ where: { userId: user.id } }) : null;
    const avatarUrl = user.avatarUrl || candidateProfile?.avatarUrl || null;
    const isProfileComplete = user.role === 'candidate'
      ? Boolean(
          user.isProfileComplete ||
          candidateProfile?.isProfileComplete ||
          candidateProfile?.college ||
          candidateProfile?.cgpa ||
          (candidateProfile?.certifications && candidateProfile.certifications.length > 0) ||
          (candidateProfile?.interestedRoles && candidateProfile.interestedRoles.length > 0)
        )
      : true;

    const formattedProfile = formatCandidateProfilePayload(candidateProfile, user.name);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: avatarUrl,
        avatarUrl: avatarUrl,
        isProfileComplete,
        hasProfilePicture: Boolean(avatarUrl && avatarUrl.trim() !== ''),
        seekerProfile: formattedProfile,
        candidateProfile: formattedProfile,
      },
    });
  } catch (error) {
    console.error('Error in googleLogin:', error);
    return res.status(401).json({ message: error.message || 'Google authentication failed' });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, name, password, role, companyName } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ message: 'Email, name, password, and role are required' });
    }

    if (!['recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be recruiter or admin' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      name,
      passwordHash,
      role,
      isActive: true,
    });

    if (role === 'recruiter') {
      await RecruiterProfile.create({
        userId: user.id,
        companyName: companyName || `${name}'s Company`,
      });
    }

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    return res.status(500).json({ message: 'Failed to create user' });
  }
};

const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.passwordHash || !user.isActive) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const candidateProfile = user.role === 'candidate' ? await CandidateProfile.findOne({ where: { userId: user.id } }) : null;
    const avatarUrl = user.avatarUrl || candidateProfile?.avatarUrl || null;
    const isProfileComplete = user.role === 'candidate'
      ? Boolean(
          user.isProfileComplete ||
          candidateProfile?.isProfileComplete ||
          candidateProfile?.college ||
          candidateProfile?.cgpa ||
          (candidateProfile?.certifications && candidateProfile.certifications.length > 0) ||
          (candidateProfile?.interestedRoles && candidateProfile.interestedRoles.length > 0)
        )
      : true;

    const formattedProfile = formatCandidateProfilePayload(candidateProfile, user.name);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: avatarUrl,
        avatarUrl: avatarUrl,
        isProfileComplete,
        hasProfilePicture: Boolean(avatarUrl && avatarUrl.trim() !== ''),
        seekerProfile: formattedProfile,
        candidateProfile: formattedProfile,
      },
    });
  } catch (error) {
    console.error('Error in loginWithPassword:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: CandidateProfile, as: 'candidateProfile', required: false },
        { model: RecruiterProfile, as: 'recruiterProfile', required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = user.toJSON();

    if (user.role === 'candidate') {
      const profile = user.candidateProfile;
      const avatarUrl = user.avatarUrl || profile?.avatarUrl || null;
      const isProfileComplete = Boolean(
        user.isProfileComplete ||
        profile?.isProfileComplete ||
        profile?.college ||
        profile?.cgpa ||
        (profile?.certifications && profile.certifications.length > 0) ||
        (profile?.interestedRoles && profile.interestedRoles.length > 0)
      );
      const formattedProfile = formatCandidateProfilePayload(profile, user.name);
      userData.avatar_url = avatarUrl;
      userData.avatarUrl = avatarUrl;
      userData.isProfileComplete = isProfileComplete;
      userData.hasProfilePicture = Boolean(avatarUrl && avatarUrl.trim() !== '');
      userData.seekerProfile = formattedProfile;
      userData.candidateProfile = formattedProfile;
    }

    return res.json({ user: userData });
  } catch (error) {
    console.error('Error in getMe:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};


module.exports = {
  googleLogin,
  createUser,
  loginWithPassword,
  getMe,
};
