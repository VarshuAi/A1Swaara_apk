const { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Set Application User Model ID for Windows Taskbar pinning & notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.varshuai.a1swaara');
}

// Single Instance Lock (True "one-tap open" - prevents multiple instances & focuses running window)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;
let isMiniPlayer = false;
let normalBounds = { width: 1280, height: 840 };

// When user taps shortcut or launches exe again, focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

// Performance & Audio Low-Latency Switches
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('enable-features', 'AudioServiceOutOfProcess');
app.commandLine.appendSwitch('enable-gpu-rasterization');
// Cap V8 heap to 256MB to avoid memory bloat and force fast garbage collection
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256 --optimize_for_size');

function createWindow() {
  const iconIco = path.join(__dirname, 'icon.ico');
  const iconPng = path.join(__dirname, 'icon.png');
  const windowIcon = fs.existsSync(iconIco) ? iconIco : iconPng;

  mainWindow = new BrowserWindow({
    title: 'A1 Swaara',
    icon: windowIcon,
    width: normalBounds.width,
    height: normalBounds.height,
    minWidth: 980,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#070809',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows cross-origin audio streaming & covers
      spellcheck: false, // Saves 40-50MB RAM by disabling Chromium spellcheck dictionaries
      backgroundThrottling: false, // Prevents audio stutter when app is in background
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

function createTray() {
  const iconIco = path.join(__dirname, 'icon.ico');
  const iconPng = path.join(__dirname, 'icon.png');
  const trayIconPath = fs.existsSync(iconIco) ? iconIco : iconPng;

  if (!fs.existsSync(trayIconPath)) return;

  try {
    tray = new Tray(trayIconPath);
    tray.setToolTip('A1 Swaara — Desktop Music Player');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'A1 Swaara',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open A1 Swaara',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Play / Pause (Space)',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-command', 'play-pause');
          }
        },
      },
      {
        label: 'Next Track (Ctrl+Right)',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-command', 'next');
          }
        },
      },
      {
        label: 'Previous Track (Ctrl+Left)',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-command', 'previous');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('Tray creation warning:', err);
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register Global Hardware Media Keys
  try {
    globalShortcut.register('MediaPlayPause', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('media-command', 'play-pause');
      }
    });
    globalShortcut.register('MediaNextTrack', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('media-command', 'next');
      }
    });
    globalShortcut.register('MediaPreviousTrack', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('media-command', 'previous');
      }
    });
  } catch (err) {
    console.warn('Global media shortcuts warning:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch {}
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
