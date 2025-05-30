const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const fs = require('node:fs').promises;
const { promisify } = require('node:util');
const execPromise = promisify(exec);

async function bilibilidl(url, quality = '480P') {
    try {
        // Parsing aid dari URL yang lebih aman
        const aidMatch = url.match(/\/video\/(\d+)/);
        if (!aidMatch) throw new Error('ID Video not found');
        const aid = aidMatch[1];

        // Fetch halaman video
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        // Parsing metadata dari meta tag
        const title = $('meta[property="og:title"]').attr('content')?.split('|')[0].trim() || 'No Title';
        const description = $('meta[property="og:description"]').attr('content') || '';
        const type = $('meta[property="og:video:type"]').attr('content') || 'video/mp4';
        const cover = $('meta[property="og:image"]').attr('content') || '';
        const like = $('.interactive__btn.interactive__like .interactive__text').text().trim() || '0';
        const views = $('.bstar-meta__tips-left .bstar-meta-text').first().text().replace(' Ditonton', '').trim() || '0';

        // Panggil API playurl
        const { data: response } = await axios.get('https://api.bilibili.tv/intl/gateway/web/playurl', {
            params: {
                s_locale: 'id_ID',
                platform: 'web',
                aid,
                qn: '64', // ini biasanya kunci kualitas, bisa disesuaikan
                type: '0',
                device: 'wap',
                tf: '0',
                spm_id: 'bstar-web.ugc-video-detail.0.0',
                from_spm_id: 'bstar-web.homepage.trending.all',
                fnval: '16',
                fnver: '0',
            },
            timeout: 15000
        });

        if (!response?.data?.playurl?.video) throw new Error('Video playurl data not found');

        // Cari video dengan kualitas yang sesuai
        const selectedVideo = response.data.playurl.video.find(v => v.stream_info.desc_words === quality);
        if (!selectedVideo) throw new Error('No video found for specified quality');

        const videoUrl = selectedVideo.video_resource.url || selectedVideo.video_resource.backup_url?.[0];
        const audioResource = response.data.playurl.audio_resource?.[0];
        const audioUrl = audioResource?.url || audioResource?.backup_url?.[0];

        if (!videoUrl || !audioUrl) throw new Error('Video or audio URL missing');

        // Fungsi download buffer dengan range
        async function downloadBuffer(url) {
            const buffers = [];
            let start = 0;
            let fileSize = 0;
            const chunkSize = 5 * 1024 * 1024; // 5 MB

            while (true) {
                let end = start + chunkSize - 1;
                if (fileSize && end > fileSize - 1) end = fileSize - 1;

                const res = await axios.get(url, {
                    headers: {
                        DNT: '1',
                        Origin: 'https://www.bilibili.tv',
                        Referer: 'https://www.bilibili.tv/video/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
                        Range: `bytes=${start}-${end}`
                    },
                    responseType: 'arraybuffer',
                    timeout: 15000
                });

                if (!fileSize) {
                    const contentRange = res.headers['content-range'];
                    if (!contentRange) throw new Error('Content-Range header missing');
                    fileSize = parseInt(contentRange.split('/')[1]);
                }

                buffers.push(Buffer.from(res.data));

                if (end >= fileSize - 1) break;
                start = end + 1;
            }
            return Buffer.concat(buffers);
        }

        // Download video dan audio
        const [videoBuffer, audioBuffer] = await Promise.all([
            downloadBuffer(videoUrl),
            downloadBuffer(audioUrl)
        ]);

        // Simpan sementara dan gabungkan dengan ffmpeg
        const tempVideoPath = 'temp_video.mp4';
        const tempAudioPath = 'temp_audio.mp3';
        const tempOutputPath = 'temp_output.mp4';

        await fs.writeFile(tempVideoPath, videoBuffer);
        await fs.writeFile(tempAudioPath, audioBuffer);

        await execPromise(`ffmpeg -y -i "${tempVideoPath}" -i "${tempAudioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${tempOutputPath}"`);

        const mergedBuffer = await fs.readFile(tempOutputPath);

        // Bersihkan file sementara
        await Promise.all([
            fs.unlink(tempVideoPath).catch(() => {}),
            fs.unlink(tempAudioPath).catch(() => {}),
            fs.unlink(tempOutputPath).catch(() => {})
        ]);

        return {
            title,
            description,
            type,
            cover,
            views,
            like,
            videoBuffer: mergedBuffer
        };

    } catch (err) {
        console.error('Error:', err.message);
        throw new Error('No result found');
    }
}

// Contoh pemakaian async function
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
            videoBufferLength: resp.videoBuffer.length
        });
    } catch (e) {
        console.error(e.message);
    }
})();
