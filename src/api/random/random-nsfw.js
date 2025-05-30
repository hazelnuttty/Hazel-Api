const axios = require('axios');
const path = require('path');

async function nsfw() {
    try {
        const { data } = await axios.get('https://raw.githubusercontent.com/hazelnuttty/API/main/nsfw.json');

        // Daftar ekstensi gambar valid yang mau diterima
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

        // Filter URL berdasarkan ekstensi
        const filteredData = data.filter(url => validExtensions.includes(path.extname(url).toLowerCase()));

        if (filteredData.length === 0) {
            throw new Error('No valid image URLs found in JSON');
        }

        // Ambil URL gambar random
        const imageUrl = filteredData[Math.floor(Math.random() * filteredData.length)];

        // Fetch gambar dalam bentuk buffer
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

        // Tentukan Content-Type berdasarkan ekstensi
        const ext = path.extname(imageUrl).toLowerCase();
        let contentType = 'application/octet-stream';
        switch (ext) {
            case '.png': contentType = 'image/png'; break;
            case '.jpg':
            case '.jpeg': contentType = 'image/jpeg'; break;
            case '.gif': contentType = 'image/gif'; break;
            case '.webp': contentType = 'image/webp'; break;
        }

        return {
            buffer: Buffer.from(response.data),
            contentType
        };

    } catch (error) {
        throw new Error(`NSFW fetch failed: ${error.message}`);
    }
}

module.exports = function (app) {
    app.get('/random/nsfw', async (req, res) => {
        try {
            const { buffer, contentType } = await nsfw();
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
            });
            res.end(buffer);
        } catch (error) {
            console.error('Error in /random/nsfw:', error.message);
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
