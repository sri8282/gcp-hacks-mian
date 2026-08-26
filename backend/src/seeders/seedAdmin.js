require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Platform Admin';

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existingAdmin = await User.findOne({ where: { email } });
    if (existingAdmin) {
      console.log(`Admin user with email "${email}" already exists. Skipping seed.`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      email,
      name,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    console.log(`Successfully created admin user: ${admin.email} (ID: ${admin.id})`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
