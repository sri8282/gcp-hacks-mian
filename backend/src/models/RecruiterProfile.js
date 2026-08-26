const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RecruiterProfile = sequelize.define('RecruiterProfile', {
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
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'recruiter_profiles',
    timestamps: true,
  });

  return RecruiterProfile;
};
