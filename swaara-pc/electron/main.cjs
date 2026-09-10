const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

let mainWindow = null;
let isMiniPlayer = false;
let normalBounds = { width: 1280, height: 840 };

// Ensure sound works without restriction
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'A1 Swaara — Desktop Studio',
    width: normalBounds.width,
    height: normalBounds.height,
    minWidth: 980,
    minHeight: 650,
    frame: false, // Obsidian frameless styling
    titleBarStyle: 'hidden',
    backgroundColor: '#08080C',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows cross-origin audio streaming & covers
    },
    show: true,
  });

  const isDev = process.env.NODE_ENV === 'development';
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const distPath = path.join(__dirname, '../dist/index.html');

  if (isDev) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(devServerUrl);
  }

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: false });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window Control IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Mini Player Mode
ipcMain.handle('toggle-mini-player', () => {
  if (!mainWindow) return false;
  isMiniPlayer = !isMiniPlayer;

  if (isMiniPlayer) {
    normalBounds = mainWindow.getBounds();
    mainWindow.setMinimumSize(340, 180);
    mainWindow.setBounds({ width: 380, height: 210 });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setResizable(false);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(980, 650);
    mainWindow.setBounds(normalBounds);
  }

  return isMiniPlayer;
});

// High-speed Native 320kbps Downloader
ipcMain.handle('download-track', async (event, { url, filename, title, artist }) => {
  try {
    const musicDir = path.join(app.getPath('music'), 'A1 Swaara');
    if (!fs.existsSync(musicDir)) {
      fs.mkdirSync(musicDir, { recursive: true });
    }

    const safeFilename = (filename || `${artist} - ${title}.mp3`).replace(/[\\/:*?"<>|]/g, '_');
    const destination = path.join(musicDir, safeFilename);

    return new Promise((resolve, reject) => {
      const proto = url.startsWith('https') ? https : http;
      const request = proto.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Handle redirect
          const redirectProto = response.headers.location.startsWith('https') ? https : http;
          redirectProto.get(response.headers.location, (redirectResponse) => {
            const fileStream = fs.createWriteStream(destination);
            redirectResponse.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              resolve({ success: true, path: destination });
            });
          }).on('error', (err) => reject(err));
          return;
        }

        const fileStream = fs.createWriteStream(destination);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve({ success: true, path: destination });
        });
      });

      request.on('error', (err) => {
        reject(err);
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Open downloads folder
ipcMain.on('open-downloads-folder', () => {
  const musicDir = path.join(app.getPath('music'), 'A1 Swaara');
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
  }
  shell.openPath(musicDir);
});
