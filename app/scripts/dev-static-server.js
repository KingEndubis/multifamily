// Simple static file server for validating the exported web UI offline
// Serves the Expo classic web export from ../web-build
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 8080;

// Resolve web-build relative to this scripts directory
const buildDir = path.resolve(__dirname, '..', 'web-build');

app.use(compression());
app.use(
  express.static(buildDir, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// SPA fallback to index.html
app.use((_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Dev static server: http://localhost:${port}/ (serving ${buildDir})`);
});
// Serves files from ../dist on http://localhost:5173
// No external dependencies required

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const ROOT = path.resolve(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/octet-stream',
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body) res.end(body);
  else res.end();
}

function serveFile(filePath, res) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Fallback to index.html for SPA routes
      const indexPath = path.join(ROOT, 'index.html');
      fs.readFile(indexPath, (err2, data) => {
        if (err2) {
          return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
        }
        send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': type });
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  try {
    // Prevent directory traversal
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const safePath = urlPath.replace(/\\+/g, '/').replace(/\.\.+/g, '');
    let relPath = safePath;
    if (relPath === '/' || relPath === '') relPath = '/index.html';
    const filePath = path.join(ROOT, relPath);
    serveFile(filePath, res);
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`[static] Serving ${ROOT} at http://localhost:${PORT}`);
});