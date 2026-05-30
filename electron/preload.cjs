const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  createFolderStructure: (data) => ipcRenderer.invoke('create-folder-structure', data),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update-now'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  onUpdateCheckStarted: (callback) => ipcRenderer.on('update-check-started', () => callback()),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (_, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_, msg) => callback(msg)),
  
  removeAllUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-check-started');
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-not-available');
    ipcRenderer.removeAllListeners('update-download-progress');
    ipcRenderer.removeAllListeners('update-downloaded');
    ipcRenderer.removeAllListeners('update-error');
  }
});

