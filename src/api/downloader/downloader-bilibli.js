const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const fs = require('node:fs').promises;
const { promisify } = require('node:util');
const execPromise = promisify(exec);

async function downloadBuffer(url) {
  let buffers = [];
  let start = 0;
  let chunkSize = 5 * 1024 * 1024; // 5 MB
  let end = start + chunkSize - 1;
  let fileSize = 0;

  while (true) {
    try {
      const headers = {
        'DNT': '1',
        'Origin': 'https://www.bilibili.tv',
        'Referer': 'https://www.bilibili.tv/video/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
        Range: `bytes=${start}-${end}`
      };

      const response = await axios.get(url, {
        headers,
        responseType: 'arraybuffer',
        validateStatus: status => status >= 200 && status < 300 || status === 206
      });

      if (fileSize === 0) {
        const contentRange = response.headers['content-range'];
        if (contentRange) {
          fileSize = parseInt(contentRange.split('/')[1]);
        } else {
          // Server gak support partial content, ambil sekaligus
          fileSize = response.data.byteLength;
          buffers.push(Buffer.from(response.data));
          break;
        }
      }

      buffers.push(Buffer.from(response.data));

      if (end >= fileSize - 1) break;

      start = end + 1;
      end = Math.min(start + chunkSize - 1, fileSize - 1);
    } catch (err) {
      if (buffers.length === 0) {
        // fallback download full jika chunk gagal
        const fullResponse = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(fullResponse.data);
      }
      throw err;
    }
  }

  return Buffer.concat(buffers);
}

async function bilibilidl(url, quality = '480P') {
  try {
    // ambil aid dari URL (pastikan format URL bener)
    let aid = /\/video\/(\d+)/.exec(url)?.[1];
    if (!aid) throw new Error('ID Video tidak ditemukan. Periksa format URL.');

    // ambil halaman web untuk meta data
    const pageHtml = await axios.get(url).then(res => res.data);
    const $ = cheerio.load(pageHtml);

    // meta info
    const title = $('meta[property="og:title"]').attr('content')?.split('|')[0].trim() || 'No Title';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const type = $('meta[property="og:video:type"]').attr('content') || '';
    const cover = $('meta[property="og:image"]').attr('content') || '';

    // like dan views — bisa error jika selector berubah, handle fallback
    const like = $('.interactive__btn.interactive__like .interactive__text').text().trim() || '0';
    const views = $('.bstar-meta__tips-left .bstar-meta-text').first().text().replace(' Ditonton', '').trim() || '0';

    // ambil API data untuk video & audio
    const apiUrl = 'https://api.bilibili.tv/intl/gateway/web/playurl';
    const params = {
      s_locale: 'id_ID',
      platform: 'web',
      aid: aid,
      qn: '64', // default quality, nanti kita pilih lagi
      type: '0',
      device: 'wap',
      tf: '0',
      spm_id: 'bstar-web.ugc-video-detail.0.0',
      from_spm_id: 'bstar-web.homepage.trending.all',
      fnval: '16',
      fnver: '0',
    };

    const apiResponse = await axios.get(apiUrl, { params }).then(res => res.data);

    if (!apiResponse.data || !apiResponse.data.playurl) throw new Error('Data video tidak ditemukan dari API.');

    // cari video sesuai quality yang diinginkan (case insensitive)
    const videos = apiResponse.data.playurl.video || [];
    const selectedVideo = videos.find(v => 
      v.stream_info.desc_words?.toLowerCase().includes(quality.toLowerCase())
    );

    if (!selectedVideo) throw new Error(`Video dengan kualitas ${quality} tidak ditemukan.`);

    const videoUrl = selectedVideo.video_resource.url || selectedVideo.video_resource.backup_url?.[0];
    if (!videoUrl) throw new Error('URL video tidak ditemukan.');

    const audios = apiResponse.data.playurl.audio_resource || [];
    if (audios.length === 0) throw new Error('Sumber audio tidak ditemukan.');
    const audioUrl = audios[0].url || audios[0].backup_url?.[0];
    if (!audioUrl) throw new Error('URL audio tidak ditemukan.');

    // download video & audio buffer
    const videoBuffer = await downloadBuffer(videoUrl);
    const audioBuffer = await downloadBuffer(audioUrl);

    // buat nama file sementara unik
    const now = Date.now();
    const tempVideoPath = `temp_video_${now}.mp4`;
    const tempAudioPath = `temp_audio_${now}.mp3`;
    const tempOutputPath = `temp_output_${now}.mp4`;

    // simpan buffer ke file
    await fs.writeFile(tempVideoPath, videoBuffer);
    await fs.writeFile(tempAudioPath, audioBuffer);

    // gabungkan video & audio pakai ffmpeg
    const ffmpegCmd = `ffmpeg -y -i "${tempVideoPath}" -i "${tempAudioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -f mp4 "${tempOutputPath}"`;
    await execPromise(ffmpegCmd);

    // baca hasil file output
    const mergedBuffer = await fs.readFile(tempOutputPath);

    // hapus file sementara
    await Promise.all([
      fs.unlink(tempVideoPath).catch(() => {}),
      fs.unlink(tempAudioPath).catch(() => {}),
      fs.unlink(tempOutputPath).catch(() => {})
    ]);

    // return data lengkap
    return {
      title,
      description,
      type,
      cover,
      views,
      like,
      videoBuffer: mergedBuffer
    };

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

module.exports = { bilibilidl };
