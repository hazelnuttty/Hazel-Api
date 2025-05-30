const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    app.get('/search/pinterest', async (req, res) => {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ status: false, error: 'Query is required' });
        }

        try {
            // Encode query
            const query = encodeURIComponent(q);

            // URL search Pinterest
            const url = `https://www.pinterest.com/search/pins/?q=${query}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    // Pinterest kadang butuh headers untuk mencegah block
                }
            });

            const $ = cheerio.load(response.data);

            // Pinterest sekarang banyak data dari javascript, jadi ambil data dari tag <script> atau JSON?  
            // Tapi kita coba ambil gambar dan link dari elemen <img> dan link <a> di halaman

            const results = [];

            $('a[href^="/pin/"]').each((i, el) => {
                const link = 'https://www.pinterest.com' + $(el).attr('href');
                const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
                const title = $(el).find('img').attr('alt') || null;

                if (img && link) {
                    results.push({
                        title,
                        imageUrl: img,
                        link
                    });
                }
            });

            res.status(200).json({
                status: true,
                result: results.slice(0, 20) // ambil 20 hasil pertama
            });

        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
}
