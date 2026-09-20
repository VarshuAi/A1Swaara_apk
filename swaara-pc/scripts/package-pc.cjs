const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { rcedit } = require('rcedit');

const rootDir = path.resolve(__dirname, '..');
const projectRootDir = path.resolve(rootDir, '..');
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
const outputDir = path.join(projectRootDir, 'A1_Swaara_PC');
const iconIco = path.join(rootDir, 'build', 'icon.ico');
const iconPng = path.join(rootDir, 'build', 'icon.png');

async function packagePC() {
  console.log('=== Compiling A1 Swaara PC Executable Suite ===');
  console.log('Source:', rootDir);
  console.log('Target Output:', outputDir);

  // 1. Check Electron distribution binary
  if (!fs.existsSync(electronDist)) {
    console.error('[ERROR] Electron dist binary not found in node_modules/electron/dist');
    process.exit(1);
  }

  // 2. Clean previous build if exists
  if (fs.existsSync(outputDir)) {
    console.log('[1/6] Cleaning existing output directory...');
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // 3. Copy Electron binary runtime
  console.log('[2/6] Copying Electron 34 runtime binaries...');
  fs.cpSync(electronDist, outputDir, { recursive: true });

  // 4. Rename executable
  const oldExe = path.join(outputDir, 'electron.exe');
  const newExe = path.join(outputDir, 'A1_Swaara.exe');
  if (fs.existsSync(oldExe)) {
    fs.renameSync(oldExe, newExe);
    console.log('[3/6] Renamed electron.exe -> A1_Swaara.exe');
  }

  // 5. Clean default app asar
  const resourcesDir = path.join(outputDir, 'resources');
  const defaultApp = path.join(resourcesDir, 'default_app.asar');
  if (fs.existsSync(defaultApp)) {
    fs.rmSync(defaultApp, { force: true });
  }

  // 6. Copy Icon Assets to root folder
  if (fs.existsSync(iconIco)) {
    fs.copyFileSync(iconIco, path.join(outputDir, 'icon.ico'));
  }
  if (fs.existsSync(iconPng)) {
    fs.copyFileSync(iconPng, path.join(outputDir, 'icon.png'));
  }

  // 7. Embed Icon & Metadata into A1_Swaara.exe via rcedit
  console.log('[4/6] Embedding custom icon and Windows PE metadata into A1_Swaara.exe...');
  try {
    await rcedit(newExe, {
      icon: iconIco,
      'version-string': {
        ProductName: 'A1 Swaara',
        FileDescription: 'A1 Swaara — Desktop Music Player',
        CompanyName: 'VarshuAi',
        LegalCopyright: 'Copyright © 2026 VarshuAi',
        OriginalFilename: 'A1_Swaara.exe',
      },
      'file-version': '1.0.0',
      'product-version': '1.0.0',
    });
    console.log('Successfully embedded icon and metadata into A1_Swaara.exe!');
  } catch (err) {
    console.warn('rcedit warning:', err.message);
  }

  // 8. Assemble App Bundle
  console.log('[5/6] Assembling production application bundle...');
  const tempAppDir = path.join(resourcesDir, 'app');
  fs.mkdirSync(tempAppDir, { recursive: true });

  // Minimal runtime package.json
  const appPkg = {
    name: 'a1swaara-pc',
    version: '1.0.0',
    description: 'A1 Swaara Desktop Music Player',
    main: 'electron/main.cjs'
  };
  fs.writeFileSync(path.join(tempAppDir, 'package.json'), JSON.stringify(appPkg, null, 2));

  // Copy electron main, preload and icons
  const electronSrcDir = path.join(rootDir, 'electron');
  const electronDestDir = path.join(tempAppDir, 'electron');
  fs.cpSync(electronSrcDir, electronDestDir, { recursive: true });

  // Copy compiled UI dist
  const distSrcDir = path.join(rootDir, 'dist');
  const distDestDir = path.join(tempAppDir, 'dist');
  fs.cpSync(distSrcDir, distDestDir, { recursive: true });

  // 9. Pack into app.asar using asar
  console.log('[6/6] Packaging into high-integrity app.asar archive...');
  const asarTarget = path.join(resourcesDir, 'app.asar');

  try {
    execSync(`npx asar pack "${tempAppDir}" "${asarTarget}"`, { stdio: 'inherit' });
    fs.rmSync(tempAppDir, { recursive: true, force: true });
    console.log('Successfully created app.asar!');
  } catch (err) {
    console.warn('Asar pack warning, falling back to unpacked app directory:', err.message);
  }

  // 10. Generate Desktop Shortcut Creator script for portable suite
  const batContent = `@echo off
title Create A1 Swaara Desktop Shortcut
echo ========================================================
echo       Creating A1 Swaara Desktop Shortcut...
echo ========================================================
(
echo Set oWS = CreateObject("WScript.Shell"^)
echo sLinkFile = oWS.SpecialFolders("Desktop"^) ^& "\\A1 Swaara.lnk"
echo Set oLink = oWS.CreateShortcut(sLinkFile^)
echo oLink.TargetPath = "%~dp0A1_Swaara.exe"
echo oLink.WorkingDirectory = "%~dp0"
echo oLink.IconLocation = "%~dp0icon.ico"
echo oLink.Description = "A1 Swaara Desktop Music Player"
echo oLink.Save
) > "%temp%\\create_shortcut.vbs"
cscript //nologo "%temp%\\create_shortcut.vbs"
del "%temp%\\create_shortcut.vbs"
echo [SUCCESS] Shortcut 'A1 Swaara' created on Desktop with custom icon!
timeout /t 3 >nul
`;
  fs.writeFileSync(path.join(outputDir, 'Create_Desktop_Shortcut.bat'), batContent, 'utf8');

  // 11. Create Desktop & Start Menu shortcuts directly
  try {
    const os = require('os');
    const home = os.homedir();
    const desktop = path.join(home, 'Desktop');
    const startMenu = path.join(home, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const vbsPath = path.join(os.tmpdir(), 'create_swaara_shortcuts.vbs');
    const vbsLines = [
      'Set oWS = CreateObject("WScript.Shell")',
      `desktopLnk = "${desktop.replace(/\\/g, '\\\\')}\\\\A1 Swaara.lnk"`,
      `startLnk = "${startMenu.replace(/\\/g, '\\\\')}\\\\A1 Swaara.lnk"`,
      'Set oLink1 = oWS.CreateShortcut(desktopLnk)',
      `oLink1.TargetPath = "${newExe.replace(/\\/g, '\\\\')}"`,
      `oLink1.WorkingDirectory = "${outputDir.replace(/\\/g, '\\\\')}"`,
      `oLink1.IconLocation = "${path.join(outputDir, 'icon.ico').replace(/\\/g, '\\\\')}"`,
      'oLink1.Description = "A1 Swaara Desktop Music Player"',
      'oLink1.Save',
      'Set oLink2 = oWS.CreateShortcut(startLnk)',
      `oLink2.TargetPath = "${newExe.replace(/\\/g, '\\\\')}"`,
      `oLink2.WorkingDirectory = "${outputDir.replace(/\\/g, '\\\\')}"`,
      `oLink2.IconLocation = "${path.join(outputDir, 'icon.ico').replace(/\\/g, '\\\\')}"`,
      'oLink2.Description = "A1 Swaara Desktop Music Player"',
      'oLink2.Save',
    ];
    fs.writeFileSync(vbsPath, vbsLines.join('\r\n'), 'utf8');
    execSync(`cscript //nologo "${vbsPath}"`);
    fs.unlinkSync(vbsPath);
    console.log('[+] Created Desktop & Start Menu shortcuts for one-tap opening!');
  } catch (err) {
    console.warn('Direct shortcut creation warning:', err.message);
  }

  console.log('\n========================================================');
  console.log('       A1 SWAARA PC EXECUTABLE SUITE READY!');
  console.log('========================================================');
  console.log(`Executable Path: ${newExe}`);
  console.log(`Bundle Directory: ${outputDir}`);
  console.log(`Desktop Shortcut: Ready on Desktop & Start Menu`);
  console.log(`Portable Helper:  ${path.join(outputDir, 'Create_Desktop_Shortcut.bat')}`);
}

packagePC().catch(err => {
  console.error('Fatal packaging error:', err);
  process.exit(1);
});
