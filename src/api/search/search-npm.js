const axios = require("axios");

module.exports = function (app) {
  app.get('/search/npm', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          status: false,
          message: 'Query parameter "q" is required'
        });
      }

      const data = await axios.get(`https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(q)}`)
        .then(i => i.data);

      const hasil = data.objects.slice(0, 20).map(i => ({
        title: `${i.package.name}@^${i.package.version}`,
        author: i.package.publisher.username,
        update: i.package.date,
        links: i.package.links
      }));

      res.status(200).json({
        status: true,
        result: hasil
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: `Error: ${error.message}`
      });
    }
  });
};
