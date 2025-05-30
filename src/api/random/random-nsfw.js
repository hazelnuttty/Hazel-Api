const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function nsfw() {
    try {
        // Coba ambil data dari API utama
        const { data } = await axios.get('https://api.nekorinn.my.id/nsfwhub/bdsm');
        if (!data?.url) throw new Error('Invalid image URL from API');
        const imageUrl = data.url;
        const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const ext = path.extname(imageUrl).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return { buffer: Buffer.from(imageRes.data), contentType };
    } catch (error) {
        console.warn('API utama gagal, menggunakan fallback...');
        // Gunakan file JSON lokal sebagai fallback
        const fallbackData = JSON.parse(fs.readFileSync(path.join(__dirname, 'nsfw.json'), 'utf8'));
        const validImages = fallbackData.filter(url => ['.jpg', '.jpeg', '.png'].includes(path.extname(url).toLowerCase()));
        if (validImages.length === 0) throw new Error('No valid images in fallback data');
        const imageUrl = validImages[Math.floor(Math.random() * validImages.length)];
        const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const ext = path.extname(imageUrl).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return { buffer: Buffer.from(imageRes.data), contentType };
    }
}

module.exports = function (app) {
    app.get('/random/nsfw', async (req, res) => {
        try {
            const { buffer, contentType } = await nsfw();
            res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': buffer.length });
            res.end(buffer);
        } catch (error) {
            console.error('Error in /random/nsfw:', error.message);
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
