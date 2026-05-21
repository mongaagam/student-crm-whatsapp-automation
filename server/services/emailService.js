const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Sends an email report or logs it to a file if SMTP credentials are missing.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email body
 * @param {Array} attachments - Optional Nodemailer attachments array (e.g. for CSV export)
 * @returns {Promise<Object>} - Status object
 */
const sendEmailReport = async (to, subject, htmlContent, attachments = []) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || 'admissions@studentcrm.com';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`Sending live email report to ${to}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort == 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const mailOptions = {
        from: `"Student CRM Onboarding" <${fromEmail}>`,
        to,
        subject,
        html: htmlContent,
        attachments
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error('Failed to send live email via SMTP:', err.message);
      // Fall through to simulator
    }
  }

  // Simulator / Local Fallback Mode
  console.log(`[SIMULATOR EMAIL] To: ${to}`);
  console.log(`[SIMULATOR EMAIL] Subject: "${subject}"`);
  console.log(`[SIMULATOR EMAIL] HTML content size: ${htmlContent.length} chars`);
  if (attachments.length > 0) {
    console.log(`[SIMULATOR EMAIL] Attachments count: ${attachments.length}`);
  }

  const logDir = path.join(__dirname, '..');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFilePath = path.join(logDir, 'email_logs.txt');
  const timestamp = new Date().toISOString();
  
  let attachmentInfo = '';
  if (attachments.length > 0) {
    attachmentInfo = `\nAttachments: ${attachments.map(a => a.filename).join(', ')}`;
  }
  
  const logEntry = `
========================================
TIMESTAMP: ${timestamp}
TO: ${to}
SUBJECT: ${subject}${attachmentInfo}
----------------------------------------
BODY:
${htmlContent}
========================================
\n`;

  try {
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
    console.log(`Simulated email saved locally to server/email_logs.txt`);
  } catch (err) {
    console.error('Failed to write local email log:', err.message);
  }

  return { success: true, simulated: true, filePath: logFilePath };
};

module.exports = { sendEmailReport };
