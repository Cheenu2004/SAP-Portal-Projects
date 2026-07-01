const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

async function resolveDoH() {
  try {
    const res = await axios.get('https://cloudflare-dns.com/dns-query?name=smtp.gmail.com&type=A', {
      headers: { 'accept': 'application/dns-json' },
      timeout: 5000
    });
    if (res.data && res.data.Answer && res.data.Answer.length > 0) {
      return res.data.Answer[0].data;
    }
  } catch (e) {
    console.log('DoH resolution failed:', e.message);
  }
  return null;
}

async function run() {
  const ip = await resolveDoH();
  console.log('Resolved IP:', ip);
  if (!ip) {
    console.log('Could not resolve IP');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: ip,
    port: 465,
    secure: true, // Direct SSL
    auth: {
      user: process.env.SMTP_USER || process.env.HR_EMAIL || 'srinidhis0611@gmail.com',
      pass: process.env.SMTP_PASSWORD || process.env.HR_EMAIL_APP_PASSWORD || 'zpoulnwksgmzgkdm'
    },
    tls: {
      servername: 'smtp.gmail.com',
      rejectUnauthorized: false // bypass intermediate corporate certs if any
    }
  });

  console.log('Verifying transporter...');
  try {
    await transporter.verify();
    console.log('✅ Success! Nodemailer verified connection using DoH IP + servername config.');
  } catch (e) {
    console.log('❌ Failed:', e.message);
  }
}

run();
