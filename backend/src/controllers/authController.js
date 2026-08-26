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

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
      const isProfileComplete = Boolean(
        profile &&
        profile.college &&
        profile.college.trim() !== '' &&
        profile.cgpa !== null &&
        profile.cgpa !== undefined &&
        profile.passingYear !== null &&
        profile.passingYear !== undefined
      );
      userData.isProfileComplete = isProfileComplete;
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
