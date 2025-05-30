const axios = require('axios');
const fs = require('fs').promises;

async function lacakIP() {
  try {
    const { data } = await axios.get('https://ipwho.is/');
    const ipInfo = {
      ip: data.ip,
      negara: data.country,
      kota: data.city,
      region: data.region,
      org: data.connection?.org,
      isp: data.connection?.isp,
      timezone: data.timezone?.id,
      koordinat: `${data.latitude}, ${data.longitude}`,
    };

    console.table(ipInfo);

    // simpan ke file JSON
    await fs.writeFile('hasil_ip.json', JSON.stringify(ipInfo, null, 2));
    console.log('✅ Data IP berhasil disimpan di file hasil_ip.json');
  } catch (err) {
    console.error('❌ Gagal lacak IP:', err.message);
  }
}

lacakIP();
