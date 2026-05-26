const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  createFolderStructure: (data) => ipcRenderer.invoke('create-folder-structure', data)
});
