const axios = require('axios');

module.exports = function(app) {
    async function getRandomAsupan() {
        try {
            const { data } = await axios.get(
                'https://raw.githubusercontent.com/hazelnuttty/API/main/asupan.json'
            );

            const list = data.asupan;
            let attempt = 0;
            let response;

            while (attempt < 5) {
                const randomUrl = list[Math.floor(Math.random() * list.length)];
                try {
                    response = await axios.get(randomUrl, {
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'Accept': '*/*'
                        }
                    });

                    const contentType = response.headers['content-type'];
                    if (!contentType || !contentType.startsWith('video')) {
                        throw new Error('Bukan konten video: ' + contentType);
                    }

                    return {
                        buffer: Buffer.from(response.data),
                        contentType
                    };
                } catch (e) {
                    attempt++;
                }
            }

            throw new Error('Semua percobaan gagal dapatkan video valid.');
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
