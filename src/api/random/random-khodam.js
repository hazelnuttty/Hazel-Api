const axios = require('axios');

module.exports = function(app) {
    async function getRandomKhodam() {
        try {
            const { data } = await axios.get(
                'https://raw.githubusercontent.com/hazelnuttty/API/main/khodam.json'
            );

            const khodamList = data.khodam;
            const randomKhodam = khodamList[Math.floor(Math.random() * khodamList.length)];

            return { result: randomKhodam };
        } catch (err) {
            throw new Error('gagal ambil khodam sayangg: ' + err.message);
        }
    }

    app.get('/random/khodam', async (req, res) => {
        try {
            const khodam = await getRandomKhodam();
            res.json(khodam);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
