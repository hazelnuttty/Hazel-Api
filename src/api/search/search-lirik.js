const axios = require('axios');
const cheerio = require('cheerio');

async function getLyrics(query) {
    try {
        const searchRes = await axios.get(`https://www.musixmatch.com/search/${encodeURIComponent(query)}`);
        const $ = cheerio.load(searchRes.data);

        const firstResult = $('.media-card-body > h2 > a').attr('href');
        if (!firstResult) throw new Error('Lagu tidak ditemukan');

        const songRes = await axios.get(`https://www.musixmatch.com${firstResult}`);
        const _$ = cheerio.load(songRes.data);

        const lyrics = _$('.lyrics__content__ok').text().trim();
        const title = _$('.mxm-track-title__track').text().trim();
        const artist = _$('.mxm-track-title__artist').text().trim();

        return {
            status: true,
            title,
            artist,
            lyrics: lyrics || 'Lirik tidak tersedia 😔'
        };
    } catch (error) {
        return {
            status: false,
            message: error.message
        };
    }
}

module.exports = getLyrics;
