require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    // Migration script: Set default minCGPA to 6.5 for existing jobs stored with 0.0 or null
    try {
      const { Job } = require('./src/models');
      const { Op } = require('sequelize');
      await Job.update(
        { minCGPA: 6.5 },
        { where: { [Op.or]: [{ minCGPA: 0 }, { minCGPA: 0.0 }, { minCGPA: null }] } }
      );
      console.log('Updated existing jobs with default 0.0 minCGPA to 6.5');
    } catch (migErr) {
      console.warn('minCGPA migration notice:', migErr.message);
    }
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

start();

