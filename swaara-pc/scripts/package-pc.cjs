const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const projectRootDir = path.resolve(rootDir, '..');
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
const outputDir = path.join(projectRootDir, 'A1_Swaara_PC');

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
  console.log('[1/5] Cleaning existing output directory...');
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// 3. Copy Electron binary runtime
console.log('[2/5] Copying Electron 34 runtime binaries...');
fs.cpSync(electronDist, outputDir, { recursive: true });

// 4. Rename executable
const oldExe = path.join(outputDir, 'electron.exe');
const newExe = path.join(outputDir, 'A1_Swaara.exe');
if (fs.existsSync(oldExe)) {
  fs.renameSync(oldExe, newExe);
  console.log('[3/5] Renamed electron.exe -> A1_Swaara.exe');
}

// 5. Clean default app asar
const resourcesDir = path.join(outputDir, 'resources');
const defaultApp = path.join(resourcesDir, 'default_app.asar');
if (fs.existsSync(defaultApp)) {
  fs.rmSync(defaultApp, { force: true });
}

// 6. Assemble App Bundle
console.log('[4/5] Assembling production application bundle...');
const tempAppDir = path.join(resourcesDir, 'app');
fs.mkdirSync(tempAppDir, { recursive: true });

// Minimal runtime package.json
const appPkg = {
  name: 'a1swaara-pc',
  version: '1.0.0',
  description: 'A1 Swaara Desktop Music Player & Studio',
  main: 'electron/main.cjs'
};
fs.writeFileSync(path.join(tempAppDir, 'package.json'), JSON.stringify(appPkg, null, 2));

// Copy electron main & preload
const electronSrcDir = path.join(rootDir, 'electron');
const electronDestDir = path.join(tempAppDir, 'electron');
fs.cpSync(electronSrcDir, electronDestDir, { recursive: true });

// Copy compiled UI dist
const distSrcDir = path.join(rootDir, 'dist');
const distDestDir = path.join(tempAppDir, 'dist');
fs.cpSync(distSrcDir, distDestDir, { recursive: true });

// 7. Pack into app.asar using asar
console.log('[5/5] Packaging into high-integrity app.asar archive...');
const asarTarget = path.join(resourcesDir, 'app.asar');

try {
  execSync(`npx asar pack "${tempAppDir}" "${asarTarget}"`, { stdio: 'inherit' });
  // Clean up unpacked temporary directory
  fs.rmSync(tempAppDir, { recursive: true, force: true });
  console.log('Successfully created app.asar!');
} catch (err) {
  console.warn('Asar pack warning, falling back to unpacked app directory:', err.message);
  // If asar fails for any reason, Electron will still run directly from resources/app
}

console.log('\n========================================================');
console.log('       A1 SWAARA PC EXECUTABLE READY FOR TESTING!');
console.log('========================================================');
console.log(`Executable Path: ${newExe}`);
console.log(`Bundle Directory: ${outputDir}`);
