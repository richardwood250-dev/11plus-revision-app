const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env / .env.local into process.env for local preview
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.resolve(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Local handler for /api/explain
  if (pathname === '/api/explain' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        req.body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        req.body = {};
      }
      const expressLikeRes = {
        setHeader(k, v) {
          res.setHeader(k, v);
        },
        status(code) {
          res.statusCode = code;
          return this;
        },
        json(payload) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        },
        end() {
          res.end();
        },
      };
      const explainHandler = require(path.resolve(__dirname, '..', 'api', 'explain.js'));
      await explainHandler(req, expressLikeRes);
    });
    return;
  }

  // Mock Vercel insights
  if (pathname.startsWith('/_vercel/')) {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end('// Vercel Insights local stub');
    return;
  }

  // Prevent directory traversal
  let filePath = path.normalize(path.join(DIST_DIR, pathname));
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check local file
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // If request is for an ESM package dependency (starts with /@, /nanoid, /v*, etc.)
    if (pathname.startsWith('/@') || pathname.startsWith('/nanoid') || pathname.startsWith('/v') || pathname.includes('@') && !pathname.endsWith('.html')) {
      const proxyUrl = 'https://esm.sh' + req.url;
      https.get(proxyUrl, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }).on('error', (proxyErr) => {
        console.error('ESM Proxy Error:', proxyErr.message);
        res.writeHead(502);
        res.end('Proxy Error');
      });
      return;
    }

    // If request has a file extension (.js, .css, .png, etc.) and was not found, return 404
    const ext = path.extname(pathname);
    if (ext && ext !== '.html') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    // SPA fallback: for any route without file extension (like /classroom), serve index.html
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found - Make sure to run build first');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 11+ Ninja Classroom Server running at:`);
  console.log(`👉 http://localhost:${PORT}/classroom`);
  console.log(`👉 http://localhost:${PORT}/`);
  console.log(`======================================================\n`);
});
