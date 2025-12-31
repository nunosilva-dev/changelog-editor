const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('src/index.html');
}

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({properties: ['openDirectory']});
    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath) => {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf-8');
    return "";
});

ipcMain.handle('write-file', async (event, {filePath, content}) => {
    fs.writeFileSync(filePath, content);
    return true;
});

ipcMain.handle('scan-dir', async (event, dirPath) => {
    return fs.readdirSync(dirPath, {withFileTypes: true})
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
});

app.whenReady().then(createWindow);