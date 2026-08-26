# A1 Swaara 🎵
### *The Ultimate High-Fidelity Music Streaming & Social Studio for Android*

<p align="center">
  <b>A1 Swaara</b> is a modern, cinematic Android music streaming application designed for pure audio fidelity, instant offline caching, intelligent multi-language discovery, and interactive social story creation.
</p>

---

## 🌟 Architecture & Core Pillars

A1 Swaara is built on a clean modern Android architecture separating **Frontend Presentation**, **Core Audio & Playback Engine**, and **Backend Data & Cloud Services**.

```
  ┌────────────────────────────────────────────────────────┐
  │                 A1 Swaara Application                  │
  └───────────────────────────┬────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    ▼                         ▼                         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     Frontend     │  │   Audio Engine   │  │  Backend & Data  │
│  (Jetpack Compose│  │ (AndroidX Media3 │  │ (Room DB, Cache  │
│    + Material 3) │  │  + Equalizer)    │  │  + HTTP/3 Stack) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 📱 Frontend (UI / UX & Experience)

* **Cinematic Dark Design System**:
  * Obsidian glass surfaces (`#08080C`, `#111119`), elevated containers (`#191924`), and signature neon magenta (`#FF2DAA`), violet (`#8B35FF`), and cyan (`#20CFFF`) accents.
* **Now Playing Studio**:
  * Large **335dp** centered album artwork hero with 24dp rounded corners, ambient glow shadow, and horizontal swipe navigation for instant track skipping.
  * **Animated Shimmer Placeholder**: Displays dynamic pulsing equalizer bars and glowing music emblems while high-res artwork loads over the network.
  * Seamless **[ ◉ Player | ♫ Lyrics ]** toggle capsule to transition between album art and real-time synchronized karaoke lyrics.
* **Social Story Creator Studio**:
  * **9:16 Image Story Card**: Generates vertical Instagram Story & WhatsApp Status cards with album artwork, frosted backdrop, track metadata, and glowing waveform graphics with direct 1-tap share.
  * **Video Music Snippet Creator**: Interactive timeline range slider with **30s / 60s duration switcher**, live audio preview scrub, animated floating music notes (`♪ ♫ ♬`), and direct video export.
* **Swaara Welcome & Language Matrix**:
  * Interactive multi-language onboarding with artist tiles and native script support (Kannada, Hindi, English, Tamil, Telugu, Punjabi, Malayalam, Marathi, Bengali, Gujarati, Bhojpuri, Haryanvi).
* **Downloads & Offline Hub**:
  * Clean library view featuring **Play All** and **Shuffle** buttons, instant track search filter, and individual track management.

---

## ⚡ Core Audio Engine & Streaming Pipeline

* **High-Fidelity Playback (AndroidX Media3 / ExoPlayer)**:
  * Low-latency audio streaming supporting bitrates up to **320 kbps (Ultra HQ)**, **192 kbps (High)**, and **128 kbps (Saver)**.
* **High-Speed Native Direct Stream Downloader (`SwaaraFastDownloader`)**:
  * Direct audio stream resolution with parallel chunk streaming written directly into the shared cache with live circular percentage progress indicators.
* **Selective Offline Cache Manager**:
  * Prevents automatic disk bloat during casual streaming; saves offline tracks **only** when the user explicitly taps the Download button.
* **Studio Parametric Equalizer**:
  * 5-Band custom frequency equalizer with Bass Boost virtualizer, audio normalization, and customizable acoustic presets.
* **Background & Lock Screen Playback**:
  * Continuous background service with native Android MediaSession integration, rich notification controls, and sleep timer functionality.

---

## ☁️ Backend & Data Infrastructure

* **Local Room Database**:
  * Structured SQLite storage via Android Jetpack Room for persistent user libraries, playlists, liked songs, playback queues, and custom song metadata.
* **Continuous Radio & Infinite Auto-Queue**:
  * Dynamic automated stream queuing that generates continuous matching music tracks based on the currently playing song without user intervention.
* **High-Performance Network Transport (HTTP/3 & QUIC)**:
  * Modern HTTP/3 stack (`dev.kathttp3`) providing multiplexed streaming and minimal packet re-transmissions on cellular and Wi-Fi networks.
* **Over-The-Air (OTA) Air-Updates Engine**:
  * Direct GitHub release integration (`https://github.com/VarshuAi/A1Swaara_apk`) with startup version checking and non-dismissable force-update dialogs for mandatory releases.

---

## 🛠️ Technology Stack & Libraries

| Layer | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Language** | Kotlin 2.x | Primary language with Coroutines & StateFlow |
| **UI Toolkit** | Jetpack Compose + Material 3 | Declarative UI, glassmorphism, animations |
| **Audio Core** | AndroidX Media3 (ExoPlayer) | Audio rendering, session management & caching |
| **Image Pipeline** | Coil 3 | Image loading, blur transformations, memory caching |
| **Database** | Android Jetpack Room | Local relational database for music libraries |
| **Networking** | Ktor Client + HTTP/3 (QUIC) | Cloud API queries and audio stream extraction |
| **Storage & Sharing** | Android FileProvider | Secure URI generation for Image & Video Stories |
| **Background Tasks** | AndroidX WorkManager | Periodic background version checks |

---

## 🚀 Building & Exporting Release APK

### Prerequisites
* JDK 17 or higher
* Android SDK (API 34+ / Build Tools 34+)

### Build Release APK
To compile the official signed release APK, run:

```bash
# Windows
.\gradlew.bat assembleHttp3Release

# Linux / macOS
./gradlew assembleHttp3Release
```

The compiled release APK will be located at:
`app/build/outputs/apk/http3/release/app-http3-release.apk`

---

## 📄 Support & Community

* **Repository**: [https://github.com/VarshuAi/A1Swaara_apk](https://github.com/VarshuAi/A1Swaara_apk)
* **Bug Reports & Issues**: [https://github.com/VarshuAi/A1Swaara_apk/issues/new](https://github.com/VarshuAi/A1Swaara_apk/issues/new)
* **Feature Requests**: [https://github.com/VarshuAi/A1Swaara_apk/issues/new](https://github.com/VarshuAi/A1Swaara_apk/issues/new)

---

<p align="center">
  <b>A1 Swaara</b> • <i>Pure Sonic Experience</i>
</p>
