const axios = require('axios');
const path = require('path');

async function nsfw() {
    try {
        const { data } = await axios.get(`https://raw.githubusercontent.com/hazelnuttty/API/main/nsfw.json`);
        const imageUrl = data[Math.floor(data.length * Math.random())];
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

        const ext = path.extname(imageUrl).toLowerCase();

        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

        return {
            buffer: Buffer.from(response.data),
            contentType
        };
    } catch (error) {
        throw error;
    }
}

module.exports = function(app) {
    app.get('/random/nsfw', async (req, res) => {
        try {
            const { buffer, contentType } = await nsfw();
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
}; // <== KAMU LUPA BAGIAN INI
