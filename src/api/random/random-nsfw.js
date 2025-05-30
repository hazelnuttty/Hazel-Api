const axios = require('axios');

async function nsfw() {
    try {
        // Ambil data dari API nekorinn
        const { data } = await axios.get('https://api.nekorinn.my.id/nsfwhub/bdsm');

        // Validasi URL gambar dari respons
        const imageUrl = data?.url;
        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('Invalid image URL in API response');
        }

        // Ambil gambar dalam bentuk buffer
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

        // Deteksi content-type berdasarkan ekstensi
        const ext = imageUrl.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';

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
