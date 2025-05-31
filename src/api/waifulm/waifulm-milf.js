const axios = require('axios');

module.exports = function(app) {
    async function getMilfImage() {
        try {
            const { data } = await axios.get('https://api.nekorinn.my.id/waifuim/milf');
            const imageUrl = data?.url || data?.result || data;
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }

    app.get('/waifulm/milf', async (req, res) => {
        try {
            const image = await getMilfImage();
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
