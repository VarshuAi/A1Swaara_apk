const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  toggleMiniPlayer: () => ipcRenderer.invoke('toggle-mini-player'),
  onWindowStateChanged: (callback) => {
    ipcRenderer.on('window-state-changed', (event, data) => callback(data));
  },
  downloadTrack: (payload) => ipcRenderer.invoke('download-track', payload),
  openDownloadsFolder: () => ipcRenderer.send('open-downloads-folder'),
});
