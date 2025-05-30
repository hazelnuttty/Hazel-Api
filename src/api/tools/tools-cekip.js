const fetch = require('node-fetch');

module.exports = function(app) {
    app.get('/search/cek-ip', async (req, res) => {
        const { ip } = req.query;
        if (!ip) {
            return res.status(400).json({ status: false, error: 'IP address is required' });
        }
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}`);

            // Tambahan pengecekan jika HTTP error
            if (!response.ok) {
                return res.status(response.status).json({
                    status: false,
                    error: `HTTP error! status: ${response.status} - ${response.statusText}`
                });
            }

            const data = await response.json();

            if (data.status === 'fail') {
                return res.status(404).json({ status: false, error: data.message || 'IP not found or invalid' });
            }

            res.status(200).json({
                status: true,
                ip: data.query,
                country: data.country,
                region: data.regionName,
                city: data.city,
                isp: data.isp,
                org: data.org,
                timezone: data.timezone,
                lat: data.lat,
                lon: data.lon
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
}
