const axios = require('axios');

// ganti ini dengan IP yang mau dicek
const targetIP = process.argv[2];

if (!targetIP) {
  console.error('Usage: node cek-ip.js <alamat-ip>');
  process.exit(1);
}

axios.get(`https://ipwho.is/${targetIP}`)
  .then(response => {
    const data = response.data;
    if (data.success) {
      console.log('Info IP:');
      console.log(`IP      : ${data.ip}`);
      console.log(`Negara  : ${data.country}`);
      console.log(`Region  : ${data.region}`);
      console.log(`Kota    : ${data.city}`);
      console.log(`ISP     : ${data.connection?.isp || 'Unknown'}`);
      console.log(`Latitude: ${data.latitude}`);
      console.log(`Longitude: ${data.longitude}`);
    } else {
      console.log(`Gagal: ${data.message}`);
    }
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
