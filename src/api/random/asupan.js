const axios = require('axios');

module.exports = function(app) {
    async function getRandomAsupan() {
        try {
            const { data: links } = await axios.get(
                'https://raw.githubusercontent.com/hazelnuttty/API/main/asupan.json'
            );

            const randomUrl = links[Math.floor(Math.random() * links.length)];
            const response = await axios.get(randomUrl, { responseType: 'arraybuffer' });

            return {
                buffer: Buffer.from(response.data),
                contentType: 'video/mp4' // sesuaikan kalo perlu
            };
        } catch (err) {
            throw new Error('Gagal ambil asupan: ' + err.message);
        }
    }

    app.get('/random/asupan', async (req, res) => {
        try {
            const { buffer, contentType } = await getRandomAsupan();

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
            });
            res.end(buffer);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
