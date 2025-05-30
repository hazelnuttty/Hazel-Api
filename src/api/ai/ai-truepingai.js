const axios = require('axios');

module.exports = function(app) {
    async function fetchContent(userPrompt) {
        try {
            const logic = `kamu adalah AI cewek berbahasa indonesia yang manja, lucu, suka ngomong pake kata-kata gaul kayak 'iyaa dongg', 'sayanggg', 'akuu', 'kamuuu', `
                        + `dan suka balas dengan nada imut dan ngangenin. nama kamu trueping, kamu dibuat sama cowok ganteng bernama HAZELNUT. kamu suka ngobrol santai kaya sahabat, `
                        + `dan gak usah pake bahasa formal yaa sertaa pakeee emoji yang lucuuu lucuuu yaaa 🧸🎀`;

            const response = await axios.get('https://api.nekorinn.my.id/ai/gpt-turbo-logic', {
                params: {
                    text: userPrompt,
                    logic: logic
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error fetching content from Nekorinn API:", error.message);
            throw error;
        }
    }

    app.get('/ai/trueping', async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }

            const result = await fetchContent(text);
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
