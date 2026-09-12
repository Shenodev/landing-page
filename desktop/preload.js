const { contextBridge, ipcRenderer } = require('electron');

// Securely expose window controls for frameless UI
// Renderer can call: window.desktopAPI.minimize() etc.
contextBridge.exposeInMainWorld('desktopAPI', {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close'),
  // Generic send with allowlist (per electron-development skill)
  send: (channel, data) => {
    const validChannels = ['window-control'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, callback) => {
    const validChannels = ['window-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  }
});
