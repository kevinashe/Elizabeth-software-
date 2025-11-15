const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  isOnline: () => ipcRenderer.invoke('is-online'),
  checkConnection: () => ipcRenderer.invoke('check-connection'),
  saveLocalData: (key, data) => ipcRenderer.invoke('save-local-data', key, data),
  loadLocalData: (key) => ipcRenderer.invoke('load-local-data', key),
  isElectron: true
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('SD Platform Desktop App Loaded');
});
