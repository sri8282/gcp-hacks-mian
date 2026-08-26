const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    candidateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('applied', 'screening', 'interview', 'offer', 'rejected'),
      defaultValue: 'applied',
      allowNull: false,
    },
    currentRound: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    screeningAnswers: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    atsScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appliedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'applications',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['candidateId', 'jobId'],
        name: 'unique_candidate_job_application',
      },
    ],
  });

  return Application;
};
