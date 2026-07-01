const nodemailer = require('nodemailer');
require('dotenv').config();

const configs = [
  { host: '142.251.163.108', port: 587, secure: false, tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' } },
  { host: '142.250.157.108', port: 587, secure: false, tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' } },
  { host: '142.251.163.108', port: 465, secure: true, tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' } },
  { host: '142.251.163.108', port: 25, secure: false, tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' } },
  { host: 'smtp.gmail.com', port: 25, secure: false, tls: { rejectUnauthorized: false } },
  { host: 'smtp.gmail.com', port: 465, secure: true, tls: { rejectUnauthorized: false } }
];

async function testAll() {
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`\n--- Testing Config ${i + 1} ---`);
    console.log(JSON.stringify(config));
    
    const transporter = nodemailer.createTransport({
      ...config,
      auth: {
        user: process.env.SMTP_USER || process.env.HR_EMAIL,
        pass: process.env.SMTP_PASSWORD || process.env.HR_EMAIL_APP_PASSWORD
      }
    });

    try {
      const info = await transporter.sendMail({
        from: process.env.HR_EMAIL,
        to: process.env.HR_EMAIL,
        subject: `Test Email from Config ${i + 1}`,
        text: 'This is a test email.'
      });
      console.log('✅ SUCCESS!', info.response);
    } catch (error) {
      console.error('❌ FAILED:', error.message);
    }
  }
}

testAll();
