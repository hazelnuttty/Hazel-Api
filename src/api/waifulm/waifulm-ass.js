const axios = require('axios');

module.exports = function(app) {
    async function getAssImage() {
        try {
            const { data } = await axios.get('https://api.nekorinn.my.id/waifuim/ass');
            const imageUrl = data?.url || data?.result || data;
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }

    app.get('/waifulm/ass', async (req, res) => {
        try {
            const image = await getAssImage();
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
