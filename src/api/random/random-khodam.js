const axios = require('axios');

module.exports = function(app) {
    // Array URL gambar langsung di sini
    const images = [
        "https://files.catbox.moe/u8xnb9.jpg",
        "https://files.catbox.moe/6o9ixt.jpg"
    ];

    async function khodam() {
        try {
            // Pilih URL random dari array langsung
            const imageUrl = images[Math.floor(Math.random() * images.length)];

            // Download gambar
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            return {
                buffer: Buffer.from(response.data),
                ext: imageUrl.split('.').pop().toLowerCase()
            };
        } catch (error) {
            throw error;
        }
    }

    app.get('/random/khodam', async (req, res) => {
        try {
            const { buffer, ext } = await khodam();

            // Map ekstensi ke content-type sederhana
            const mimeTypes = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif': 'image/gif',
                'webp': 'image/webp'
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
