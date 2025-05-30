const axios = require('axios');
const cheerio = require('cheerio');

async function bilibilidl(url, quality = '480P') {
    try {
        // ambil aid dari URL
        let aid = /\/video\/(\d+)/.exec(url)?.[1];
        if (!aid) throw new Error('ID Video not found');

        // ambil meta dari halaman
        const appInfo = await axios.get(url).then(res => res.data);
        const $ = cheerio.load(appInfo);
        const title = $('meta[property="og:title"]').attr('content')?.split('|')[0].trim() || 'No Title';
        const description = $('meta[property="og:description"]').attr('content') || '';
        const type = $('meta[property="og:video:type"]').attr('content') || 'video/mp4';
        const cover = $('meta[property="og:image"]').attr('content') || '';
        const like = $('.interactive__btn.interactive__like .interactive__text').text() || '0';
        const views = $('.bstar-meta__tips-left .bstar-meta-text').first().text().replace(' Ditonton', '') || '0';

        // ambil data stream video & audio dari API Bilibili
        const response = await axios.get('https://api.bilibili.tv/intl/gateway/web/playurl', {
            params: {
                's_locale': 'id_ID',
                'platform': 'web',
                'aid': aid,
                'qn': '64',
                'type': '0',
                'device': 'wap',
                'tf': '0',
                'spm_id': 'bstar-web.ugc-video-detail.0.0',
                'from_spm_id': 'bstar-web.homepage.trending.all',
                'fnval': '16',
                'fnver': '0',
            }
        }).then(res => res.data);

        // pilih video sesuai quality
        const selectedVideo = response.data.playurl.video.find(v => v.stream_info.desc_words === quality);
        if (!selectedVideo) throw new Error('No video found for specified quality');

        const videoUrl = selectedVideo.video_resource.url || selectedVideo.video_resource.backup_url?.[0];
        const audioUrl = response.data.playurl.audio_resource[0].url || response.data.playurl.audio_resource[0].backup_url?.[0];

        if (!videoUrl || !audioUrl) throw new Error('Video or Audio URL not found');

        // fungsi download buffer dengan range request chunk 5MB
        async function downloadBuffer(url) {
            let buffers = [];
            let start = 0;
            let end = 5 * 1024 * 1024 - 1; // chunk 5MB
            let fileSize = 0;

            while (true) {
                const range = `bytes=${start}-${end}`;
                const response = await axios.get(url, {
                    headers: {
                        'DNT': '1',
                        'Origin': 'https://www.bilibili.tv',
                        'Referer': `https://www.bilibili.tv/video/`,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                        Range: range
                    },
                    responseType: 'arraybuffer'
                });

                if (fileSize === 0) {
                    const contentRange = response.headers['content-range'];
                    if (contentRange) {
                        fileSize = parseInt(contentRange.split('/')[1]);
                    } else {
                        fileSize = response.data.byteLength;
                    }
                }

                buffers.push(Buffer.from(response.data));

                if (end >= fileSize - 1) break;

                start = end + 1;
                end = Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1);
            }

            return Buffer.concat(buffers);
        }

        // download video & audio buffer (belum merge)
        const videoBuffer = await downloadBuffer(videoUrl);
        const audioBuffer = await downloadBuffer(audioUrl);

        return {
            title,
            description,
            type,
            cover,
            views,
            like,
            videoBuffer,
            audioBuffer
        };
    } catch (error) {
        console.error(error.message);
        throw new Error('No result found');
    }
}

// contoh pakai
(async () => {
    try {
        const resp = await bilibilidl('https://www.bilibili.tv/video/4793817472438784', '480P');
        console.log({
            title: resp.title,
            description: resp.description,
            type: resp.type,
            cover: resp.cover,
            views: resp.views,
            like: resp.like,
            videoBufferLength: resp.videoBuffer.length,
            audioBufferLength: resp.audioBuffer.length
        });

        // simpan buffer video dan audio ke file (opsional)
        const fs = require('fs');
        fs.writeFileSync('video.mp4', resp.videoBuffer);
        fs.writeFileSync('audio.mp3', resp.audioBuffer);
        console.log('Video dan audio sudah tersimpan sebagai video.mp4 dan audio.mp3');
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
