const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

const User = require('./User')(sequelize);
const CandidateProfile = require('./CandidateProfile')(sequelize);
const RecruiterProfile = require('./RecruiterProfile')(sequelize);
const Job = require('./Job')(sequelize);
const Application = require('./Application')(sequelize);
const Notification = require('./Notification')(sequelize);

// User Associations
User.hasOne(CandidateProfile, { foreignKey: 'userId', as: 'candidateProfile', onDelete: 'CASCADE' });
CandidateProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(RecruiterProfile, { foreignKey: 'userId', as: 'recruiterProfile', onDelete: 'CASCADE' });
RecruiterProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Job, { foreignKey: 'recruiterId', as: 'jobs', onDelete: 'CASCADE' });
Job.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' });

User.hasMany(Application, { foreignKey: 'candidateId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Job Associations
Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  CandidateProfile,
  RecruiterProfile,
  Job,
  Application,
  Notification,
};
