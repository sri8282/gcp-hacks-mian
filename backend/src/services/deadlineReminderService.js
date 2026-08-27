const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { Op } = require('sequelize');
const { Job, Application, Notification } = require('../models');
const { createNotification } = require('./notificationService');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Checks open jobs and dispatches deadline reminder notifications for 3-day and 1-day warnings.
 */
async function checkDeadlineReminders() {
  try {
    const nowIst = dayjs().tz('Asia/Kolkata');
    const now = new Date();

    const openJobs = await Job.findAll({
      where: {
        isOpen: true,
        adminOverrideClosed: false,
        applicationCloseAt: { [Op.ne]: null, [Op.gt]: now },
      },
    });

    for (const job of openJobs) {
      const closeIst = dayjs(job.applicationCloseAt).tz('Asia/Kolkata');
      const diffHours = closeIst.diff(nowIst, 'hour');
      const diffDays = Math.ceil(diffHours / 24);

      if (diffDays === 3 || diffDays === 1) {
        const applications = await Application.findAll({
          where: {
            jobId: job.id,
            status: { [Op.in]: ['applied', 'screening'] },
          },
        });

        for (const app of applications) {
          const message = `Reminder: Application deadline for "${job.title}" is in ${diffDays} day(s).`;

          // Spam prevention: check if identical reminder already exists
          const existingNotification = await Notification.findOne({
            where: {
              userId: app.candidateId,
              type: 'deadline_reminder',
              message: { [Op.like]: `%${job.title}%${diffDays} day%` },
            },
          });

          if (!existingNotification) {
            await createNotification(
              app.candidateId,
              'deadline_reminder',
              message
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in checkDeadlineReminders:', error);
    throw error;
  }
}

module.exports = {
  checkDeadlineReminders,
};

