const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CandidateProfile = sequelize.define('CandidateProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    college: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cgpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    passingYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    interestedRoles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    linkedinUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    portfolioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'candidate_profiles',
    timestamps: true,
  });

  return CandidateProfile;
};
