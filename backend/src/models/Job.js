const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Job = sequelize.define('Job', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recruiterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    salaryLPA: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workplaceType: {
      type: DataTypes.ENUM('remote', 'onsite', 'hybrid'),
      allowNull: true,
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    jobDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    minCGPA: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    applicationOpenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    applicationCloseAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hiringRounds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    screeningQuestions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    adminOverrideClosed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'jobs',
    timestamps: true,
  });

  return Job;
};
