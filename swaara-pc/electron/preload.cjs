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
  onMediaCommand: (callback) => {
    ipcRenderer.on('media-command', (event, cmd) => callback(cmd));
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
});
