const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 5000;

// Serve the exported web build (Expo classic output)
const buildDir = path.join(process.cwd(), 'web-build');
app.use(compression());
app.use(
  express.static(buildDir, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // Ensure HTML is always fresh so SPA routing works correctly
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// Fallback to index.html for SPA routes
app.use((_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Mulfa static web server (web-build) running at http://localhost:${port}/`);
});