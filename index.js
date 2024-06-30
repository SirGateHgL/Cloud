const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

const httpProxyUrls = [
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
    'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt',
    'https://raw.githubusercontent.com/zloi-user/hideip.me/main/http.txt',
    'https://raw.githubusercontent.com/ArrayIterator/proxy-lists/main/proxies/http.txt',
    'https://yakumo.rei.my.id/HTTP',
    'https://raw.githubusercontent.com/cybercrafttool/proxylist/results/all/http.proxy.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'
];

const httpsProxyUrls = [
    'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/https.txt',
    'https://raw.githubusercontent.com/zloi-user/hideip.me/main/https.txt',
    'https://raw.githubusercontent.com/ArrayIterator/proxy-lists/main/proxies/https.txt',
    'https://raw.githubusercontent.com/cybercrafttool/proxylist/results/all/https.proxy.txt'
];

const HTTP_FILE = 'http_proxies.txt';
const HTTPS_FILE = 'https_proxies.txt';

let totalRequestsToday = 0;
let requestsPerSecond = 0;
let maxRequestsPerSecond = 0;
let requestTimestamps = [];

async function fetchProxies(proxyUrls) {
    let proxies = [];
    for (let url of proxyUrls) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            proxies.push(...text.split('\n').filter(Boolean));
        } catch (error) {
            console.error(`Error fetching proxies from ${url}:`, error);
        }
    }
    return proxies;
}

async function updateProxies() {
    const httpProxies = await fetchProxies(httpProxyUrls);
    const httpsProxies = await fetchProxies(httpsProxyUrls);

    fs.writeFileSync(HTTP_FILE, httpProxies.join('\n'), 'utf8');
    fs.writeFileSync(HTTPS_FILE, httpsProxies.join('\n'), 'utf8');

    console.log('Proxy files updated');
}

function trackRequest() {
    const now = Date.now();
    requestTimestamps.push(now);
    totalRequestsToday++;

    // Remove timestamps older than 1 second
    requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp <= 1000);
    requestsPerSecond = requestTimestamps.length;
    if (requestsPerSecond > maxRequestsPerSecond) {
        maxRequestsPerSecond = requestsPerSecond;
    }
}

app.use((req, res, next) => {
    trackRequest();
    next();
});

app.get('/http', (req, res) => {
    res.set('Content-Type', 'text/plain');
    fs.readFile(HTTP_FILE, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading proxy file');
            return;
        }
        res.send(data);
    });
});

app.get('/https', (req, res) => {
    res.set('Content-Type', 'text/plain');
    fs.readFile(HTTPS_FILE, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading proxy file');
            return;
        }
        res.send(data);
    });
});

app.get('/all', (req, res) => {
    res.set('Content-Type', 'text/plain');
    fs.readFile(HTTP_FILE, 'utf8', (err, httpData) => {
        if (err) {
            res.status(500).send('Error reading HTTP proxy file');
            return;
        }
        fs.readFile(HTTPS_FILE, 'utf8', (err, httpsData) => {
            if (err) {
                res.status(500).send('Error reading HTTPS proxy file');
                return;
            }
            res.send(httpData + '\n' + httpsData);
        });
    });
});

app.get('/info', (req, res) => {
    res.json({
        totalRequestsToday,
        requestsPerSecond,
        maxRequestsPerSecond
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    updateProxies(); // Initial fetch
    cron.schedule('*/5 * * * *', updateProxies); // Fetch every 5 minutes
});
