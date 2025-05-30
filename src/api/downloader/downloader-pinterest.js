const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function getPinterestMedia(url) {
        try {
            const { data: html } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                },
            });

            const $ = cheerio.load(html);
            const jsonText = $('script[data-test-id="video-snippet"]').html() || $('script[id="__PWS_DATA__"]').html();
            
            if (!jsonText) throw new Error('Media tidak ditemukan.');

            const jsonData = JSON.parse(jsonText);
            const mediaUrl = jsonData.props?.initialReduxState?.pins?.[Object.keys(jsonData.props.initialReduxState.pins)[0]]?.videos?.video_list?.V_720P?.url;

            if (!mediaUrl) throw new Error('Gagal ambil link media.');

            const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });

            return {
                buffer: Buffer.from(response.data),
                contentType: 'video/mp4',
            };
        } catch (err) {
            throw new Error('Gagal ambil media Pinterest: ' + err.message);
        }
    }

    app.get('/dl/pinterest', async (req, res) => {
        const { url } = req.query;

        if (!url || !url.includes('pinterest')) {
            return res.status(400).json({ error: 'URL tidak valid atau tidak ada.' });
        }

        try {
            const { buffer, contentType } = await getPinterestMedia(url);

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
