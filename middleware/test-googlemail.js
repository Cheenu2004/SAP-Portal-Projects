const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.googlemail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || process.env.HR_EMAIL || 'srinidhis0611@gmail.com',
    pass: process.env.SMTP_PASSWORD || process.env.HR_EMAIL_APP_PASSWORD || 'zpoulnwksgmzgkdm'
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('Verifying transporter with smtp.googlemail.com...');
transporter.verify()
  .then(() => {
    console.log('✅ SUCCESS! Connection verified with smtp.googlemail.com!');
  })
  .catch((e) => {
    console.log('❌ FAILED:', e.message);
  });
