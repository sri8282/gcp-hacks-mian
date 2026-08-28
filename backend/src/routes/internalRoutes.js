const express = require('express');
const router = express.Router();
const { checkDeadlineReminders } = require('../services/deadlineReminderService');
const { User } = require('../models');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

router.post('/run-reminders', async (req, res) => {
  const secretHeader = req.headers['x-scheduler-secret'];
  const expectedSecret = process.env.SCHEDULER_SECRET;

  if (!expectedSecret || !secretHeader || secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing X-Scheduler-Secret header' });
  }

  try {
    await checkDeadlineReminders();
    return res.status(200).json({ message: 'Deadline reminders check executed successfully' });
  } catch (error) {
    console.error('Failed to run deadline reminders via endpoint:', error);
    return res.status(500).json({ error: 'Internal server error while executing deadline reminders' });
  }
});

router.post('/deployment-alert', async (req, res) => {
  const secretHeader = req.headers['x-scheduler-secret'];
  const expectedSecret = process.env.SCHEDULER_SECRET;

  if (!expectedSecret || !secretHeader || secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing X-Scheduler-Secret header' });
  }

  try {
    const { failedRevision, rolledBackToRevision, errorSummary, timestamp } = req.body || {};

    const alertMessage =
      `Deployment Failure Alert:\n` +
      `• Failed Revision: ${failedRevision || 'N/A'}\n` +
      `• Rolled Back To Revision: ${rolledBackToRevision || 'N/A'}\n` +
      `• Error Summary: ${errorSummary || 'N/A'}\n` +
      `• Timestamp: ${timestamp || 'N/A'}`;

    const admins = await User.findAll({ where: { role: 'admin' } });

    for (const admin of admins) {
      await createNotification(admin.id, 'deployment_alert', alertMessage, {
        subject: 'HireHub: Deployment Failure Alert',
      });
    }

    // Direct email to specific address outside per-user notification loop
    await sendEmail(
      'srihari23@karunya.edu.in',
      'HireHub: Deployment Failure Alert',
      alertMessage
    );

    return res.status(200).json({
      message: 'Alert processed',
      notifiedAdmins: admins.length,
    });
  } catch (error) {
    console.error('Failed to process deployment alert:', error);
    return res.status(500).json({ error: 'Internal server error while processing deployment alert' });
  }
});

module.exports = router;

