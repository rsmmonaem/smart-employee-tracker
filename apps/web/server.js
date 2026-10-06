const http = require('http');
const https = require('https');
const next = require('next');

const dev = false;
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT, 10) || 3000;

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    // Sanitize origin header if duplicated by upstream reverse proxies (OLS)
    if (req.headers.origin && typeof req.headers.origin === 'string') {
      const parts = req.headers.origin.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        req.headers.origin = parts[0];
      }
    }

    // Sanitize host or x-forwarded-host if duplicated
    if (req.headers['x-forwarded-host'] && typeof req.headers['x-forwarded-host'] === 'string') {
      const parts = req.headers['x-forwarded-host'].split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        req.headers['x-forwarded-host'] = parts[0];
      }
    }

    // Sanitize x-forwarded-proto if duplicated
    if (req.headers['x-forwarded-proto'] && typeof req.headers['x-forwarded-proto'] === 'string') {
      const parts = req.headers['x-forwarded-proto'].split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        req.headers['x-forwarded-proto'] = parts[0];
      }
    }

    handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
