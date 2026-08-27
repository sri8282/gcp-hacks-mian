const { Notification, User } = require('../models');
const { sendEmail, buildHtmlTemplate } = require('./emailService');

/**
 * Derives a user-friendly email subject line based on notification type and message context.
 */
const getSubjectForType = (type, message, extraFields = {}) => {
  if (extraFields.subject) return extraFields.subject;
  if (extraFields.title) return `HireHub: ${extraFields.title}`;

  switch (type) {
    case 'application_confirmation': {
      const match = message && message.match(/You applied to (.*?) at /);
      if (match && match[1]) {
        return `Your application to ${match[1]} was received`;
      }
      return 'HireHub: Application Confirmation';
    }
    case 'status_update': {
      const match = message && (message.match(/for (.*?) at /) || message.match(/for "(.*?)"/));
      if (match && match[1]) {
        return `HireHub: Application Update - ${match[1]}`;
      }
      return 'HireHub: Application Update';
    }
    case 'new_eligible_job': {
      const match = message && message.match(/New job opportunity: "(.*?)"/);
      if (match && match[1]) {
        return `HireHub: New Job Opportunity - ${match[1]}`;
      }
      return 'HireHub: New Job Match';
    }
    case 'recruiter_message':
      return 'HireHub: Recruiter Message';
    case 'admin_broadcast':
      return 'HireHub: Important Announcement';
    case 'deadline_reminder': {
      const match = message && message.match(/for "(.*?)"/);
      if (match && match[1]) {
        return `HireHub: Application Deadline Reminder - ${match[1]}`;
      }
      return 'HireHub: Application Deadline Reminder';
    }
    default:
      return 'HireHub: Notification';
  }
};

/**
 * Shared helper to create a Notification record and trigger email sending to the user.
 *
 * Can be invoked with positional arguments: createNotification(userId, type, message, extraFields)
 * or as an object: createNotification({ userId, type, message, ...extraFields })
 *
 * @returns {Promise<Object>} Created Notification record
 */
const createNotification = async (userIdOrObj, typeParam, messageParam, extraFieldsParam = {}) => {
  let userId, type, message, extraFields;

  if (typeof userIdOrObj === 'object' && userIdOrObj !== null) {
    const { userId: uid, type: t, message: m, ...rest } = userIdOrObj;
    userId = uid;
    type = t;
    message = m;
    extraFields = rest;
  } else {
    userId = userIdOrObj;
    type = typeParam;
    message = messageParam;
    extraFields = extraFieldsParam;
  }

  // 1. Create the notification row in the database
  const notification = await Notification.create({
    userId,
    type,
    message,
    isRead: false,
    ...extraFields,
  });

  // 2. Fetch user's email address and name to send personalized HTML email
  try {
    const user = await User.findByPk(userId, { attributes: ['email', 'name'] });
    if (user && user.email) {
      const subject = getSubjectForType(type, message, extraFields);
      const html = buildHtmlTemplate(user.name, message, subject);
      await sendEmail(user.email, subject, message, html);
    } else {
      console.warn(`[NotificationService] No user/email found for userId ${userId}`);
    }
  } catch (emailErr) {
    console.error(`[NotificationService] Error sending email for userId ${userId}:`, emailErr);
  }

  return notification;
};

module.exports = {
  createNotification,
};
