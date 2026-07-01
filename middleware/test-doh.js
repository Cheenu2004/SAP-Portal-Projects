const axios = require('axios');

async function testDoH() {
  console.log('Testing Cloudflare DoH...');
  try {
    const res = await axios.get('https://cloudflare-dns.com/dns-query?name=smtp.gmail.com&type=A', {
      headers: { 'accept': 'application/dns-json' }
    });
    console.log('Cloudflare DNS response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Cloudflare DoH failed:', e.message);
  }

  console.log('Testing Google DoH...');
  try {
    const res = await axios.get('https://dns.google/resolve?name=smtp.gmail.com');
    console.log('Google DNS response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Google DoH failed:', e.message);
  }
}

testDoH();
