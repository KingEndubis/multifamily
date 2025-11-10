const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const isDev = !app.isPackaged;
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
    show: false,
  });

  // Load the static web build for offline usage
  // Prefer exported 'dist' from `expo export --platform web`
  const appPath = app.getAppPath();
  const distIndex = path.join(appPath, 'dist', 'index.html');
  const webBuildIndex = path.join(appPath, 'web-build', 'index.html');
  const indexPath = fs.existsSync(distIndex) ? distIndex : webBuildIndex;
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    // Graceful error page if export hasn't been generated
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!doctype html>
      <html><head><meta charset="utf-8"><title>Mulfa</title></head>
      <body style="font-family: system-ui, sans-serif; padding: 2rem;">
        <h1>Web build not found</h1>
        <p>Expected to find one of:</p>
        <ul>
          <li>${distIndex}</li>
          <li>${webBuildIndex}</li>
        </ul>
        <p>Please run: <code>npx expo export:web</code> and then package again.</p>
      </body></html>
    `));
  }

  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});