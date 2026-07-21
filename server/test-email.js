require('dotenv').config();
const nodemailer = require('nodemailer');

async function runTest() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  const passLength = emailPass ? emailPass.length : 0;

  console.log(`Using email: ${emailUser}, Password length: ${passLength}`);

  if (!emailUser || !emailPass) {
    console.error('ERROR: Missing EMAIL_USER or EMAIL_APP_PASSWORD in environment variables.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    debug: true,
    logger: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP Connection verified successfully.');
  } catch (error) {
    console.error('Transporter verification failed. Email Error:', error);
    process.exit(1);
  }

  try {
    console.log(`Sending test email to ${emailUser}...`);
    const info = await transporter.sendMail({
      from: `"GovVerify System" <${emailUser}>`,
      to: emailUser,
      subject: 'GovVerify SMTP Debug Test',
      html: '<h3>GovVerify Test Email</h3><p>If you receive this message, Nodemailer SMTP configuration is working!</p>',
    });

    console.log(`✓ Test email sent successfully to ${emailUser} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error('Email Error:', error);
    process.exit(1);
  }
}

runTest();
