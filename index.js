const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');

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

let httpProxies = [];
let httpsProxies = [];

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
    httpProxies = await fetchProxies(httpProxyUrls);
    httpsProxies = await fetchProxies(httpsProxyUrls);
    console.log('Proxy lists updated');
}

app.get('/http', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(httpProxies.join('\n'));
});

app.get('/https', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(httpsProxies.join('\n'));
});

app.get('/all', (req, res) => {
    res.set('Content-Type', 'text/plain');
    const allProxies = [...httpProxies, ...httpsProxies];
    res.send(allProxies.join('\n'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    updateProxies(); // Initial fetch
    cron.schedule('*/10 * * * *', updateProxies); // Fetch every 10 minutes
});
