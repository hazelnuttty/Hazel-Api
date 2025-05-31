const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function tiktokStalk(user) {
  try {
    const url = await fetch(`https://tiktok.com/@${user}`, {
      headers: {
        'User-Agent': 'PostmanRuntime/7.32.2'
      }
    });
    const html = await url.text();
    const $ = cheerio.load(html);
    const data = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').text();
    const result = JSON.parse(data);

    if (result['__DEFAULT_SCOPE__']['webapp.user-detail'].statusCode !== 0) {
      return {
        status: 'error',
        message: 'User not found!',
      };
    }

    const res = result['__DEFAULT_SCOPE__']['webapp.user-detail']['userInfo'];
    return res;
  } catch (err) {
    console.log(err);
    return String(err);
  }
}

module.exports = function(app) {
  app.get('/stalk/tiktok', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.json({ status: false, error: 'User is required' });

    try {
      const anu = await tiktokStalk(username);
      if (anu.status === 'error') return res.status(404).json(anu);

      anu.user.heart = anu.stats.heart;
      anu.user.followerCount = anu.stats.followerCount;
      anu.user.followingCount = anu.stats.followingCount;

      res.status(200).json({
        status: true,
        result: anu.user
      });
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });
};
