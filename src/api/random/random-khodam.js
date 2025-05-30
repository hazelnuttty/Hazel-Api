const axios = require('axios');
const path = require('path');

module.exports = function(app) {
    async function bluearchive() {
        try {
            // Ambil array URL dari JSON
            const { data } = await axios.get('https://raw.githubusercontent.com/hazelnuttty/API/refs/heads/main/khodam.json');

            // Pilih URL gambar secara acak
            const imageUrl = data[Math.floor(Math.random() * data.length)];

            // Dapatkan ekstensi file untuk tentukan Content-Type nanti
            const ext = path.extname(imageUrl).toLowerCase();

            // Download gambar sebagai arraybuffer
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            // Return objek dengan buffer data dan ekstensi
            return { buffer: Buffer.from(response.data), ext };
        } catch (error) {
            throw error;
        }
    }

    app.get('/random/khodam', async (req, res) => {
        try {
            const { buffer, ext } = await bluearchive();

            // Map ekstensi ke content-type
            const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
