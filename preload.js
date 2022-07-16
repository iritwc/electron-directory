// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
      'getDirectory': (dirPath) => ipcRenderer.invoke('get-directory', dirPath),
      'getPics': () => ipcRenderer.invoke('get-pics'),
      'startDrag': (fileName) => ipcRenderer.send('dragstart', path.join(process.cwd(), fileName)),
});