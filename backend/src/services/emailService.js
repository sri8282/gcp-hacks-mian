const sgMail = require('@sendgrid/mail');

/**
 * Builds a clean, responsive HTML email body with inline CSS styles.
 *
 * @param {string} [name] - Recipient's name
 * @param {string} textMessage - Message content
 * @param {string} [subject] - Email subject line
 * @returns {string} HTML string
 */
const buildHtmlTemplate = (name, textMessage, subject) => {
  const recipientName = name && name.trim() ? name.trim() : 'there';
  const paragraphs = (textMessage || '')
    .split('\n\n')
    .map(
      (p) =>
        `<p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">${p.replace(
          /\n/g,
          '<br/>'
        )}</p>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'HireHub Notification'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header with Text Logo -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Hire<span style="color: #6366f1;">Hub</span></span>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff;">
              <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">Hello ${recipientName},</p>
              ${paragraphs}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">This is an automated message from <strong>HireHub</strong>.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Sends an email using SendGrid with both plain text and HTML versions.
 * Wrapped in try/catch — if sending fails, logs the error but does NOT throw.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body text content
 * @param {string} [html] - Optional HTML email body
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;

    if (!apiKey) {
      console.warn('[EmailService] SENDGRID_API_KEY is not set. Email not sent.');
      return;
    }

    if (!senderEmail) {
      console.warn('[EmailService] SENDER_EMAIL is not set. Email not sent.');
      return;
    }

    if (!to) {
      console.warn('[EmailService] Recipient email ("to") is missing. Email not sent.');
      return;
    }

    sgMail.setApiKey(apiKey);

    const emailHtml = html || buildHtmlTemplate(null, text, subject);

    const msg = {
      to,
      from: senderEmail,
      subject: subject || 'Notification from HireHub',
      text: text || '',
      html: emailHtml,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] Email sent successfully to ${to} with subject "${subject}"`);
  } catch (error) {
    const errorDetails = error.response && error.response.body ? error.response.body : error.message || error;
    console.error('[EmailService] Error sending email via SendGrid:', errorDetails);
  }
};

module.exports = {
  sendEmail,
  buildHtmlTemplate,
};
