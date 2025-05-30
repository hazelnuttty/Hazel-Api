const axios = require('axios');

module.exports = function(app) {
    app.get('/random/cekkhodam', async (req, res) => {
        try {
            const { nama, tgl } = req.query;

            if (!nama || !tgl) {
                return res.status(400).json({
                    status: false,
                    message: 'Parameter "nama" dan "tgl" (DD-MM-YYYY) wajib diisi.'
                });
            }

            const linkKhodam = `https://api.botcahx.eu.org/api/cekhodam?nama=${encodeURIComponent(nama)}&tgl=${encodeURIComponent(tgl)}&apikey=free`;

            const { data } = await axios.get(linkKhodam);

            if (!data || data.status !== true) {
                return res.status(500).json({
                    status: false,
                    message: 'Gagal mengambil data khodam.'
                });
            }

            res.json({
                status: true,
                result: data.result
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                message: 'Terjadi kesalahan pada server.',
                error: err.message
            });
        }
    });
};
