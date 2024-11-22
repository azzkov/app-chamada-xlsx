const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  saveXLSX: (data, fileName) => ipcRenderer.invoke('save-xlsx', data, fileName),
  loadXLSX: () => ipcRenderer.invoke('load-xlsx')
});