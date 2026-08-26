require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { startDeadlineReminders } = require('./src/services/deadlineReminderService');

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync();
    console.log('Database synced');
    startDeadlineReminders();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

start();

