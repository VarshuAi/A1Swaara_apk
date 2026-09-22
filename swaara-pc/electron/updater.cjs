const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app, spawn } = require('electron');

const GITHUB_REPO = 'VarshuAi/A1Swaara_PC';
const VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json`;
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Compare two semver version strings (e.g. "1.0.1" vs "1.0.0")
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareSemver(v1, v2) {
  const parse = (s) => (s || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * HTTP GET request that follows redirects
 */
function fetchJsonWithRedirect(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects'));
    }

    const client = url.startsWith('http:') ? http : https;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'A1Swaara-Desktop-Updater',
        'Cache-Control': 'no-cache',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJsonWithRedirect(res.headers.location, maxRedirects - 1));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Invalid JSON response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Download file following redirects with progress tracking
 */
function downloadFile(url, destPath, onProgress, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects'));
    }

    const client = url.startsWith('http:') ? http : https;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'A1Swaara-Desktop-Updater',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location, destPath, onProgress, maxRedirects - 1));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      const fileStream = fs.createWriteStream(destPath);

      res.on('data', chunk => {
        downloadedBytes += chunk.length;
        fileStream.write(chunk);
        if (totalBytes > 0 && onProgress) {
          const percent = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
          onProgress({ percent, downloadedBytes, totalBytes });
        }
      });

      res.on('end', () => {
        fileStream.end();
        fileStream.on('finish', () => resolve(destPath));
      });

      res.on('error', err => {
        fileStream.close();
        try { fs.unlinkSync(destPath); } catch (_) {}
        reject(err);
      });
    });

    req.on('error', err => {
      try { fs.unlinkSync(destPath); } catch (_) {}
      reject(err);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      try { fs.unlinkSync(destPath); } catch (_) {}
      reject(new Error('Download timed out'));
    });
  });
}

class AutoUpdater {
  constructor(mainWindow, currentVersion) {
    this.mainWindow = mainWindow;
    this.currentVersion = currentVersion;
    this.updateInfo = null;
    this.downloading = false;
    this.updateDownloaded = false;
  }

  setMainWindow(win) {
    this.mainWindow = win;
  }

  sendStatus(status, payload = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', { status, ...payload });
    }
  }

  async checkForUpdates() {
    try {
      this.sendStatus('checking');
      const cacheBustUrl = `${VERSION_URL}?_t=${Date.now()}`;
      let remoteData = null;

      try {
        remoteData = await fetchJsonWithRedirect(cacheBustUrl);
      } catch (err) {
        console.warn('version.json fetch failed, trying releases API:', err.message);
        const release = await fetchJsonWithRedirect(RELEASES_API);
        const tag = (release.tag_name || '').replace(/^v/, '');
        remoteData = {
          version: tag,
          name: release.name || `v${tag}`,
          notes: release.body || '',
          asarUrl: release.assets?.find(a => a.name === 'app.asar')?.browser_download_url,
          exeUrl: release.assets?.find(a => a.name.endsWith('.exe'))?.browser_download_url,
        };
      }

      if (!remoteData || !remoteData.version) {
        this.sendStatus('no-update', { currentVersion: this.currentVersion });
        return { updateAvailable: false, currentVersion: this.currentVersion };
      }

      const isNewer = compareSemver(remoteData.version, this.currentVersion) > 0;

      this.updateInfo = {
        updateAvailable: isNewer,
        currentVersion: this.currentVersion,
        remoteVersion: remoteData.version,
        name: remoteData.name || `v${remoteData.version}`,
        notes: remoteData.notes || '',
        releaseDate: remoteData.releaseDate,
        mandatory: !!remoteData.mandatory,
        asarUrl: remoteData.asarUrl,
        exeUrl: remoteData.exeUrl,
      };

      if (isNewer) {
        this.sendStatus('available', this.updateInfo);
      } else {
        this.sendStatus('up-to-date', { currentVersion: this.currentVersion });
      }

      return this.updateInfo;
    } catch (err) {
      console.error('Update check failed:', err);
      this.sendStatus('error', { error: err.message });
      return { updateAvailable: false, error: err.message, currentVersion: this.currentVersion };
    }
  }

  async downloadUpdate() {
    if (!this.updateInfo || !this.updateInfo.updateAvailable) {
      throw new Error('No update available to download');
    }
    if (this.downloading) {
      return { downloading: true };
    }

    this.downloading = true;
    this.sendStatus('downloading', { percent: 0 });

    try {
      const resourcesPath = process.resourcesPath;
      const targetAsarPath = path.join(resourcesPath, 'app.asar');
      const updateAsarPath = path.join(resourcesPath, 'app.asar.update');

      // If running unpackaged / in dev mode, test update downloads to temp directory
      const isPackaged = app.isPackaged;
      const finalDest = isPackaged ? updateAsarPath : path.join(app.getPath('temp'), 'a1swaara_test_app.asar');

      if (!this.updateInfo.asarUrl) {
        throw new Error('No OTA asar download URL found in release metadata');
      }

      await downloadFile(this.updateInfo.asarUrl, finalDest, (progress) => {
        this.sendStatus('download-progress', progress);
      });

      this.downloading = false;
      this.updateDownloaded = true;
      this.sendStatus('downloaded', {
        version: this.updateInfo.remoteVersion,
        file: finalDest,
      });

      return { success: true, version: this.updateInfo.remoteVersion };
    } catch (err) {
      this.downloading = false;
      this.sendStatus('error', { error: err.message });
      throw err;
    }
  }

  installAndRestart() {
    if (!this.updateDownloaded) {
      throw new Error('Update has not been downloaded yet');
    }

    const resourcesPath = process.resourcesPath;
    const currentAsar = path.join(resourcesPath, 'app.asar');
    const updateAsar = path.join(resourcesPath, 'app.asar.update');
    const exePath = process.execPath;

    if (!app.isPackaged) {
      console.log('[Updater] Running in development mode, restarting without file swap');
      app.relaunch();
      app.quit();
      return;
    }

    if (!fs.existsSync(updateAsar)) {
      throw new Error('Downloaded update file not found');
    }

    // Windows batch helper to swap app.asar after current process releases file lock
    const batPath = path.join(app.getPath('temp'), `update_swaara_${Date.now()}.bat`);
    const batScript = `@echo off
timeout /t 1 /nobreak >nul
:retry
move /y "${updateAsar}" "${currentAsar}" >nul 2>&1
if exist "${updateAsar}" (
  timeout /t 1 /nobreak >nul
  goto retry
)
start "" "${exePath}"
del "%~f0"
`;

    fs.writeFileSync(batPath, batScript, 'utf8');

    // Launch batch detached and quit application cleanly
    const child = spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();

    app.quit();
  }
}

module.exports = {
  AutoUpdater,
  compareSemver,
};
