const axios = require('axios');
const fs = require('fs').promises;

async function githubStalk(username) {
  try {
    const { data } = await axios.get(`https://api.github.com/users/${username}`);

    const info = {
      username: data.login,
      nama: data.name,
      bio: data.bio,
      lokasi: data.location,
      pengikut: data.followers,
      mengikuti: data.following,
      repoPublik: data.public_repos,
      dibuat: data.created_at,
      avatar: data.avatar_url,
      link: data.html_url
    };

    console.table(info);
    await fs.writeFile(`${username}_github.json`, JSON.stringify(info, null, 2));
    console.log(`✅ Info ${username} disimpan`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}
