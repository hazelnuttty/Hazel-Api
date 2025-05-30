const axios = require('axios');

module.exports = function(app) {
    app.get('/search/pinterest', async (req, res) => {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ status: false, error: 'Query is required' });
        }

        try {
            const apiUrl = `https://vor-apis.biz.id/api/pin?q=${encodeURIComponent(q)}`;

            const response = await axios.get(apiUrl);

            // Cek apakah data sesuai dengan format API
            if (!response.data || !response.data.result) {
                return res.status(404).json({ status: false, error: 'No results found' });
            }

            // Kirim langsung data hasil pencarian
            res.status(200).json({
                status: true,
                result: response.data.result
            });

        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
}
