const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://data.worldbank.org/indicator/NY.GDP.MKTP.CD');

    // Scrape data
    const data = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('div.item').forEach(item => {
            const texts = item.querySelectorAll('div');
            if (texts.length >= 3) {
                items.push({
                    country: texts[0].innerText.trim(),
                    year: texts[1].innerText.trim(),
                    value: texts[2].innerText.trim()
                });
            }
        });
        return items;
    });

    // Save data to JSON file
    const jsonFilePath = path.join(__dirname, 'data.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));

    // Start HTTP server to serve the JSON file
    const PORT = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
        if (req.url === '/data.json') {
            fs.readFile(jsonFilePath, (err, fileData) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error loading file');
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(fileData);
                }
            });
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Data Viewer</title>
                </head>
                <body>
                    <h1>Data Viewer</h1>
                    <pre id="data"></pre>
                    <script>
                        fetch('/data.json')
                            .then(response => response.json())
                            .then(data => {
                                document.getElementById('data').textContent = JSON.stringify(data, null, 2);
                            })
                            .catch(error => {
                                document.getElementById('data').textContent = 'Error loading data';
                            });
                    </script>
                </body>
                </html>
            `);
        }
    });

    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${port}`);
    });

    // Keep the browser and server running
})();
