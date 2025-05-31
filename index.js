const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // untuk webhook
const app = express();
const PORT = process.env.PORT || 4000;

// ========== ANTI DDoS CONFIG ==========
let ipLogs = {};
const WEBHOOK_URL = "https://discord.com/api/webhooks/1378430227277152357/-XjNAJKbxC6tj3Ihsr1oCRWzixvPuglPFU6WJGOAqchPi-ALtodQA7ixvmFK6hFjPcHH"; // GANTI SAMA WEBHOOK KAMU YAA SAYANGG 😚

// middleware deteksi DDoS
app.use((req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipLogs[ip]) ipLogs[ip] = [];

    // hanya simpan request 5 detik terakhir
    ipLogs[ip] = ipLogs[ip].filter(t => now - t < 5000);
    ipLogs[ip].push(now);

    if (ipLogs[ip].length > 10) {
        axios.post(WEBHOOK_URL, {
            content: `🚨 **DDoS Detected**\nIP: \`${ip}\`\nRequests in 5s: \`${ipLogs[ip].length}\``
        }).catch(err => {
            console.error("Gagal kirim webhook:", err.message);
        });

        ipLogs[ip] = []; // reset biar ga spam terus
    }

    next();
});

// ========== SETUP DASAR ==========
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// ========== CUSTOM JSON RESPON ==========
const settingsPath = path.join(__dirname, './src/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status,
                creator: settings.apiSettings.creator || "Created Using Rynn UI",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// ========== LOAD API ROUTES ==========
let totalRoutes = 0;
const apiFolder = path.join(__dirname, './src/api');
fs.readdirSync(apiFolder).forEach((subfolder) => {
    const subfolderPath = path.join(apiFolder, subfolder);
    if (fs.statSync(subfolderPath).isDirectory()) {
        fs.readdirSync(subfolderPath).forEach((file) => {
            const filePath = path.join(subfolderPath, file);
            if (path.extname(file) === '.js') {
                require(filePath)(app);
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${path.basename(file)} `));
            }
        });
    }
});
console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

// ========== ROUTE UTAMA ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-page', 'index.html'));
});

// ========== ERROR HANDLER ==========
app.use((req, res, next) => {
    res.status(404).sendFile(process.cwd() + "/api-page/404.html");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(process.cwd() + "/api-page/500.html");
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
});

module.exports = app;
