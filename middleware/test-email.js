const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.HR_EMAIL,
    pass: process.env.SMTP_PASSWORD || process.env.HR_EMAIL_APP_PASSWORD
  },
  tls: {
    servername: 'smtp.gmail.com'
  }
});

async function test() {
  console.log('Testing SMTP connection with:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('User:', process.env.SMTP_USER);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.HR_EMAIL,
      to: process.env.HR_EMAIL,
      subject: 'Test Email',
      text: 'This is a test email to verify SMTP configuration.'
    });
    console.log('Success!', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

test();
