const axios = require('axios');

module.exports = function(app) {
    async function getWaifuImage() {
        try {
            const { data } = await axios.get('https://api.nekorinn.my.id/waifuim/waifu');
            const imageUrl = data?.url || data?.result || data;
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }

    app.get('/waifulm/waifu', async (req, res) => {
        try {
            const image = await getWaifuImage();
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': image.length,
            });
            res.end(image);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
