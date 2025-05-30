const axios = require('axios');

async function katakata() {
    try {
        const { data } = await axios.get('https://raw.githubusercontent.com/hazelnuttty/API/main/baskara.json');
        return data[Math.floor(Math.random() * data.length)];
    } catch (error) {
        throw error;
    }
}

module.exports = function(app) {
    app.get('/random/katakata', async (req, res) => {
        try {
            const imageUrl = await katakata();
            res.json({
                status: true,
                creator: "Hazel",
                result: imageUrl
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "Hazel",
                result: `Error: ${error.message}`
            });
        }
    });
};
