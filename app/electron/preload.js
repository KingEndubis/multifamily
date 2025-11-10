// Minimal preload to keep a secure, isolated context.
// We can expose limited APIs here later if needed.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('mulfa', {
  version: '1.0.0'
});