const axios = require('axios');

module.exports = function(app) {
    async function getMaidImage() {
        try {
            const { data } = await axios.get('https://api.nekorinn.my.id/waifuim/maid');
            const imageUrl = data?.url || data?.result || data; // antisipasi format respon
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }

    app.get('/waifulm/maid', async (req, res) => {
        try {
            const image = await getMaidImage();
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
