const {app, BrowserWindow, ipcMain, dialog, shell} = require('electron');
const path = require('path');
const fs = require('fs').promises;

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
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (e) {
        return "";
    }
});

ipcMain.handle('write-file', async (event, {filePath, content}) => {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
});

ipcMain.handle('scan-dir', async (event, dirPath) => {
    const dirents = await fs.readdir(dirPath, {withFileTypes: true});
    return dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

app.whenReady().then(createWindow);