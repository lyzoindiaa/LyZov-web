const emailService = require("../services/emailService");

/**
 * Universal email helper for backward compatibility.
 * Safely delegates to the centralized EmailService.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  return emailService.dispatch({
    to,
    subject,
    html,
    text,
    template: "custom_notification",
  });
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
