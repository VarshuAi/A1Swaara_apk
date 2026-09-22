# A1 Swaara — Desktop Music Player for Windows 🎵

> **Audiophile-Grade Desktop Music Player with Real-Time Lossless DSP, Over-The-Air (OTA) Updates & Synchronized Regional Lyrics**

A1 Swaara PC is an original, restrained, high-performance desktop music player built for Windows. Engineered with a hardware-accelerated audio pipeline, custom 10-band graphic equalizer, binaural spatial audio widener, and instant OTA in-app updates.

---

## ✨ Features

- **Audiophile DSP Engine**:
  - High-precision 10-Band Graphic Equalizer (32Hz to 16kHz) with live spline response curve
  - Dynamic Psychoacoustic Bass Boost (`+8 dB` resonant filter)
  - 3D Spatial Audio Widener with real-time stereo field visualizer
  - Zero-latency hardware media key integration (`Play/Pause`, `Next`, `Previous`)
- **Over-The-Air (OTA) Auto-Updater**:
  - Seamless background update checks via GitHub release registry (`version.json`)
  - Instant delta updates (~1.5 MB `app.asar`) applied in under 3 seconds without full reinstallations
  - Automatic fallback to full executable binary updates
- **Rich Synchronized Lyrics**:
  - Multi-lingual karaoke scrolling and active line highlighting (Hindi, Kannada, Tamil, Telugu, English) powered by LRCLIB & JioSaavn
- **Ultra-Fast Search & Infinite Radio**:
  - Instant search across tracks, artists, and playlists
  - Infinite Radio mode generating continuous kindred track queues
- **Desktop First**:
  - Frameless dark aesthetic (`#070809` Obsidian theme with Emerald `#10B981` accents)
  - Native Windows taskbar pinning, system tray integration, and desktop context menus
  - 320 kbps high-speed offline track downloads to your local Music directory

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 20+
- npm or yarn
- Windows 10/11

### Installation
```bash
# Clone the repository
git clone https://github.com/VarshuAi/A1Swaara_PC.git
cd A1Swaara_PC

# Install dependencies
npm install

# Start Vite dev server with Electron
npm run electron:dev
# In a second terminal (or npm start):
npm run electron
```

### Production Build & Packaging
```bash
# Build web dist
npm run build

# Package standalone Windows PC Executable (A1_Swaara.exe)
npm run package:pc
```

The packaged portable suite and executable will be generated at `../A1_Swaara_PC/A1_Swaara.exe`.

---

## 📦 Downloads & Releases

Get the latest pre-compiled standalone executable from the [Releases](https://github.com/VarshuAi/A1Swaara_PC/releases) page.

1. Download `A1_Swaara.exe`
2. Run directly — no complex setup required!
3. Automatic updates will keep your player running on the latest build.

---

## 📄 License

MIT © [VarshuAi](https://github.com/VarshuAi)
