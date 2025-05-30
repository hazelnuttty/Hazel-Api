const http = require('http');

function generateRandomPhoneNumber(options = {}) {
  const {
    country = 'id',
    format = 'local',
    length = 10,
    prefix = null,
  } = options;

  let defaultPrefix;
  if (country === 'id') {
    defaultPrefix = format === 'intl' ? '+62' : '08';
  } else {
    defaultPrefix = prefix || '';
  }

  const numberLength = length - defaultPrefix.length;
  let number = '';
  for (let i = 0; i < numberLength; i++) {
    number += Math.floor(Math.random() * 10);
  }

  return defaultPrefix + number;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/api/random-phone')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const country = url.searchParams.get('country') || 'id';
    const format = url.searchParams.get('format') || 'local';
    const length = parseInt(url.searchParams.get('length')) || 10;
    const prefix = url.searchParams.get('prefix');

    try {
      const phone = generateRandomPhoneNumber({ country, format, length, prefix });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: true, phone }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: false, error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: false, error: 'Not Found' }));
  }
});
