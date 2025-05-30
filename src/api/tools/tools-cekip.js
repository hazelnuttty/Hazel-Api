const fetch = require('node-fetch');

module.exports = function(app) {
    app.get('/search/ip', async (req, res) => {
        const { ip } = req.query;
        if (!ip) {
            return res.status(400).json({ status: false, error: 'IP address is required' });
        }
        try {
            // Contoh API: ip-api.com/json/{ip}
            const response = await fetch(`http://ip-api.com/json/${ip}`);
            const data = await response.json();

            if (data.status === 'fail') {
                return res.status(404).json({ status: false, error: 'IP not found or invalid' });
            }

            // Kirim hasil info IP yang relevan
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
