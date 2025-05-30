const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = function(app) {
    // Fungsi untuk baca API key dari file
    function getApiKey() {
        const filePath = path.join(__dirname, 'database', 'gemini.json');
        const data = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(data);
        return json.apiKey || json.API_KEY || json.key; // sesuaikan key di JSON kamu
    }

    async function fetchGeminiContent(prompt) {
        const apiKey = getApiKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // request body sesuai docs Gemini
        const requestBody = {
            prompt: {
                text: prompt
            }
        };

        try {
            const response = await axios.post(url, requestBody);
            // response bentuknya bisa berbeda, contoh:
            // { candidates: [{ output: "hasil jawaban" }] }
            return response.data;
        } catch (error) {
            console.error("Error fetching content from Gemini:", error.response?.data || error.message);
            throw error;
        }
    }

    app.get('/ai/gemini', async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }

            const data = await fetchGeminiContent(text);

            // contoh parsing hasil output
            const result = data?.candidates?.[0]?.output || 'No output from Gemini';

            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
