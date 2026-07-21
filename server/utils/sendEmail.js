const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlBody) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log(`[Email Skipped] EMAIL_USER or EMAIL_APP_PASSWORD not configured. Subject: "${subject}" to ${to}`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      debug: true,
      logger: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"GovVerify System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlBody,
    });

    console.log(`✓ Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('Email Error:', error);
    return false;
  }
};

module.exports = sendEmail;
