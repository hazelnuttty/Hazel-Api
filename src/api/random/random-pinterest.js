const axios = require('axios');

async function pinterestSearch(query) {
  try {
    const res = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`);
    const matches = res.data.match(/"url":"https:\/\/i\.pinimg\.com\/[^"]+/g);
    if (!matches) return [];

    const urls = matches.map(m => m.replace('"url":"', '').replace(/\\u002F/g, '/'));
    return [...new Set(urls)];
  } catch (err) {
    console.error('Pinterest error:', err);
    return [];
  }
}

// ambil query dari command line
const query = process.argv.slice(2).join(" ");
if (!query) {
  console.log(JSON.stringify({ status: false, message: 'query kosong!' }, null, 2));
  process.exit();
}

pinterestSearch(query).then(results => {
  if (!results.length) {
    console.log(JSON.stringify({ status: false, message: 'gak ketemu 😿' }, null, 2));
  } else {
    const random = results[Math.floor(Math.random() * results.length)];
    console.log(JSON.stringify({
      status: true,
      creator: 'hazelnut',
      result: random
    }, null, 2));
  }
});
