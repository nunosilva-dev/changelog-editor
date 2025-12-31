const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('write-file', {filePath: path, content}),
    scanDir: (path) => ipcRenderer.invoke('scan-dir', path)
});