const axios = require('axios');

module.exports = function(app) {
    async function fetchFromOpenAIBot(content) {
        try {
            const payload = {
                messages: [
                    {
                        role: "user",
                        content: content
                    }
                ]
            };

            const response = await axios.post('https://chat.openaibot.org/api/chat', payload);
            return response.data;
        } catch (error) {
            console.error("🔴 Error fetching from OpenAIBot:", error.message);
            throw new Error("Gagal menghubungi server OpenAIBot");
        }
    }

    app.get('/ai/chatgpt', async (req, res) => {
        const { text } = req.query;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'Parameter "text" wajib diisi sebagai string.'
            });
        }

        try {
            const response = await fetchFromOpenAIBot(text);

            const result = response?.choices?.[0]?.message?.content;

            if (!result) {
                return res.status(500).json({
                    status: false,
                    error: 'Respon dari AI tidak valid atau kosong.'
                });
            }

            res.status(200).json({
                status: true,
                creator: 'Hazel',
                result: result.trim()
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message || 'Terjadi kesalahan tidak diketahui.'
            });
        }
    });
};
