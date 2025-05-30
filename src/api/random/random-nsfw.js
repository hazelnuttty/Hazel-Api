const axios = require('axios');
const path = require('path');

async function nsfw() {
    try {
        const { data } = await axios.get('https://raw.githubusercontent.com/hazelnuttty/API/main/nsfw.json');

        // Filter hanya URL dengan ekstensi gambar yang valid
        const validExtensions = ['.jpg', '.jpeg', '.png'];
        const filteredData = data.filter(url => validExtensions.includes(path.extname(url).toLowerCase()));

        if (filteredData.length === 0) {
            throw new Error('No valid image URLs found in JSON');
        }

        const imageUrl = filteredData[Math.floor(Math.random() * filteredData.length)];
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
