const express = require('express');
const router = express.Router();
const { checkDeadlineReminders } = require('../services/deadlineReminderService');

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

module.exports = router;
