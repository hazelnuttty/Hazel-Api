const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    // fungsi scraping jadwal sholat
    async function getPrayerTimes() {
        try {
            const url = 'https://www.islamicfinder.org/world/indonesia/43667277/sambas-kalimantan-barat-id-prayer-times/?language=id';
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            const $ = cheerio.load(data);
            const prayerTimes = {};

            $('.prayerTiles').each((i, el) => {
                const prayerName = $(el).find('.prayername')?.text()?.trim();
                const prayerTime = $(el).find('.prayertime')?.text()?.trim();

                if (prayerName && prayerTime) {
                    prayerTimes[prayerName] = prayerTime;
                }
            });

            const dateGregorian = $('.pt-date p').first().text().trim();
            const dateHijri = $('.pt-date .pt-date-right').first().text().trim();

            return {
                date: dateGregorian || 'Tanggal tidak ditemukan',
                hijri_date: dateHijri || 'Tanggal Hijriah tidak ditemukan',
                schedule: Object.keys(prayerTimes).length > 0 ? prayerTimes : 'Jadwal tidak ditemukan'
            };
        } catch (error) {
            console.error('❌ Gagal scraping:', error.message);
            return null;
        }
    }

    // endpoint GET /sholat/sambas
    app.get('/sholat/sambas', async (req, res) => {
        const result = await getPrayerTimes();

        if (result) {
            res.status(200).json({
                status: true,
                location: 'Sambas, Kalimantan Barat',
                ...result
            });
        } else {
            res.status(500).json({
                status: false,
                error: 'Gagal mengambil jadwal sholat dari IslamicFinder.'
            });
        }
    });
};
