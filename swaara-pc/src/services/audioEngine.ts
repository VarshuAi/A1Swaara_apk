import { EqualizerPreset, Track } from '../types/music';

// Frequency bands for 10-Band Studio Equalizer
export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const DEFAULT_PRESETS: Record<string, EqualizerPreset> = {
  'BOOM BASS': {
    name: 'BOOM BASS',
    gains: [8, 7, 5, 2, 0, 0, 1, 2, 4, 5],
    bassBoost: 8,
  },
  'Acoustic': {
    name: 'Acoustic',
    gains: [3, 2, 0, 1, 3, 3, 2, 4, 3, 2],
    bassBoost: 2,
  },
  'Vocal Clarity': {
    name: 'Vocal Clarity',
    gains: [-2, -1, 0, 2, 4, 5, 4, 2, 0, -1],
    bassBoost: 1,
  },
  'Club / EDM': {
    name: 'Club / EDM',
    gains: [6, 5, 2, 0, 1, 3, 4, 5, 6, 6],
    bassBoost: 7,
  },
  'Rock': {
    name: 'Rock',
    gains: [4, 3, 1, -1, -2, 1, 3, 4, 4, 3],
    bassBoost: 4,
  },
  'Pop': {
    name: 'Pop',
    gains: [2, 3, 2, 0, 1, 2, 3, 3, 4, 2],
    bassBoost: 3,
  },
  'Flat': {
    name: 'Flat',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
  },
};

class AudioEngine {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private bassBoostFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  // Dual-Engine Hybrid: HTML5 Direct Audio + YouTube Background Engine (for web/datacenter fallback)
  private ytPlayer: any = null;
  private ytPlayerPromise: Promise<any> | null = null;
  private isYtReady = false;
  private isYtPlaying = false;
  private currentEngine: 'html5' | 'youtube' = 'html5';
  private currentVolume = 0.85;
  private ytPollTimer: any = null;
  private activeTrack: Track | null = null;

  private onTimeUpdateCb?: (current: number, duration: number, buffered: number) => void;
  private onEndCb?: () => void;
  private onPlayChangeCb?: (isPlaying: boolean) => void;
  private onLoadingCb?: (isLoading: boolean) => void;
  private onErrorCb?: (msg: string) => void;

  constructor() {
    this.audio = new Audio();
    // Only set crossOrigin in Electron where webSecurity is disabled.
    // In web browsers, crossOrigin='anonymous' causes GoogleVideo streams to fail with MEDIA_ELEMENT_ERROR.
    if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
      this.audio.crossOrigin = 'anonymous';
    }
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCb) {
        const buffered = this.audio.buffered.length > 0 ? this.audio.buffered.end(this.audio.buffered.length - 1) : 0;
        this.onTimeUpdateCb(this.audio.currentTime, this.audio.duration || 0, buffered);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.onEndCb) this.onEndCb();
    });

    this.audio.addEventListener('play', () => {
      if (this.onPlayChangeCb) this.onPlayChangeCb(true);
    });

    this.audio.addEventListener('pause', () => {
      if (this.onPlayChangeCb) this.onPlayChangeCb(false);
    });

    this.audio.addEventListener('waiting', () => {
      if (this.onLoadingCb) this.onLoadingCb(true);
    });

    this.audio.addEventListener('playing', () => {
      if (this.onLoadingCb) this.onLoadingCb(false);
    });

    this.audio.addEventListener('error', () => {
      if (this.onErrorCb) {
        this.onErrorCb('Audio playback error encountered');
      }
      if (this.onLoadingCb) this.onLoadingCb(false);
    });
  }

  // Initialize Web Audio API nodes on first user interaction
  public initWebAudio() {
    if (this.isInitialized) return;

    // Check if running in Electron (where webSecurity: false allows MediaElementAudioSourceNode without CORS silencing)
    const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isElectron);

    // In a standard web browser, calling createMediaElementSource on cross-origin GoogleVideo streams
    // causes the browser to mute/silence audio output ("MediaElementAudioSource outputs zeroes").
    // Only connect the Web Audio graph in Electron. In browser, audio plays directly through <audio> element to physical speakers!
    if (!isElectron) {
      this.isInitialized = true;
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

      // Create 10 Equalizer Filters
      this.filters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Dedicated BOOM BASS Sub-filter (50Hz resonant bass pump)
      this.bassBoostFilter = this.audioCtx.createBiquadFilter();
      this.bassBoostFilter.type = 'lowshelf';
      this.bassBoostFilter.frequency.value = 60;
      this.bassBoostFilter.gain.value = 0;

      // Master Gain
      this.masterGain = this.audioCtx.createGain();

      // Analyser Node for Spectrum Visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128; // 64 frequency bins
      this.analyser.smoothingTimeConstant = 0.82;

      // Connect Graph: source -> filters[0..9] -> bassBoost -> masterGain -> analyser -> destination
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.bassBoostFilter);
      this.bassBoostFilter.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio API not fully available, falling back to basic audio:', err);
    }
  }

  private initYouTubeApi(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve();

      if ((window as any).YT && (window as any).YT.Player) {
        return resolve();
      }

      const existingScript = document.getElementById('swaara-yt-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'swaara-yt-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        resolve();
      };

      setTimeout(resolve, 3000);
    });
  }

  private async ensureYouTubePlayer(): Promise<any> {
    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      return this.ytPlayer;
    }
    if (this.ytPlayerPromise) {
      return this.ytPlayerPromise;
    }

    this.ytPlayerPromise = new Promise(async (resolve) => {
      await this.initYouTubeApi();
      if (typeof window === 'undefined') return resolve(null);

      // Clean up any stale container
      const existing = document.getElementById('swaara-yt-player-box');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.id = 'swaara-yt-player-box';
      container.style.position = 'fixed';
      container.style.bottom = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.pointerEvents = 'none';
      container.style.opacity = '0';
      document.body.appendChild(container);

      try {
        const player = new (window as any).YT.Player('swaara-yt-player-box', {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              this.ytPlayer = event.target;
              this.isYtReady = true;
              try {
                this.ytPlayer.setVolume(Math.round(this.currentVolume * 100));
              } catch {}
              resolve(this.ytPlayer);
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === 1) { // playing
                this.isYtPlaying = true;
                if (this.onPlayChangeCb) this.onPlayChangeCb(true);
                if (this.onLoadingCb) this.onLoadingCb(false);
              } else if (state === 2) { // paused
                this.isYtPlaying = false;
                if (this.onPlayChangeCb) this.onPlayChangeCb(false);
              } else if (state === 3) { // buffering
                if (this.onLoadingCb) this.onLoadingCb(true);
              } else if (state === 0) { // ended
                this.isYtPlaying = false;
                if (this.onPlayChangeCb) this.onPlayChangeCb(false);
                if (this.onEndCb) this.onEndCb();
              }
            },
            onError: (event: any) => {
              console.error('YouTube background engine playback error:', event.data);
              if (this.onErrorCb) {
                this.onErrorCb('Audio stream playback error');
              }
              if (this.onLoadingCb) this.onLoadingCb(false);
            },
          },
        });
      } catch (err) {
        console.error('Failed to instantiate YouTube player:', err);
        this.ytPlayerPromise = null;
        resolve(null);
      }
    });

    return this.ytPlayerPromise;
  }

  private async playYouTubeTrack(track: Track) {
    this.currentEngine = 'youtube';
    this.activeTrack = track;
    this.audio.pause();

    const player = await this.ensureYouTubePlayer();
    if (!player) return;

    try {
      player.loadVideoById(track.id);
      player.playVideo();
      player.setVolume(Math.round(this.currentVolume * 100));
      this.startYtPolling(track);
      this.updateMediaSession(track);
    } catch (err) {
      console.error('Error invoking YouTube track playback:', err);
    }
  }

  private startYtPolling(track: Track) {
    if (this.ytPollTimer) clearInterval(this.ytPollTimer);
    this.ytPollTimer = setInterval(() => {
      if (this.currentEngine === 'youtube' && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
        try {
          const current = this.ytPlayer.getCurrentTime() || 0;
          const dur = this.ytPlayer.getDuration() || track.duration || 0;
          const loadedFraction = this.ytPlayer.getVideoLoadedFraction ? this.ytPlayer.getVideoLoadedFraction() : 0;
          const buffered = loadedFraction * dur;

          if (this.onTimeUpdateCb) {
            this.onTimeUpdateCb(current, dur, buffered);
          }
        } catch {
          // ignore
        }
      }
    }, 250);
  }

  public async playTrack(track: Track) {
    this.activeTrack = track;
    this.initWebAudio();

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // 1. If direct stream URL is available (e.g. Electron desktop app), attempt HTML5 audio
    if (track.streamUrl) {
      this.currentEngine = 'html5';
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try { this.ytPlayer.pauseVideo(); } catch {}
      }
      if (this.ytPollTimer) clearInterval(this.ytPollTimer);

      if (this.audio.src !== track.streamUrl) {
        this.audio.src = track.streamUrl;
        this.audio.load();
      }

      try {
        await this.audio.play();
        this.updateMediaSession(track);
        return;
      } catch (err) {
        console.warn('HTML5 direct play failed, falling back to YouTube background engine:', err);
      }
    }

    // 2. Web mode / datacenter fallback: Instant YouTube playback with 100% reliability
    await this.playYouTubeTrack(track);
  }

  public async togglePlay() {
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.currentEngine === 'youtube' && this.ytPlayer && this.isYtReady) {
      try {
        const state = this.ytPlayer.getPlayerState();
        if (state === 1) {
          this.ytPlayer.pauseVideo();
        } else {
          this.ytPlayer.playVideo();
        }
      } catch (e) {
        console.error('Failed to toggle YouTube playback:', e);
      }
      return;
    }

    if (this.audio.paused) {
      try {
        await this.audio.play();
      } catch (e) {
        console.error('Failed to resume playback:', e);
      }
    } else {
      this.audio.pause();
    }
  }

  public seek(seconds: number) {
    if (isNaN(seconds)) return;

    if (this.currentEngine === 'youtube' && this.ytPlayer && this.isYtReady) {
      try {
        this.ytPlayer.seekTo(seconds, true);
      } catch {}
      return;
    }

    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds));
  }

  public setVolume(vol: number) {
    // vol 0 to 1
    const clamped = Math.max(0, Math.min(1, vol));
    this.currentVolume = clamped;
    this.audio.volume = clamped;
    if (this.ytPlayer && this.isYtReady) {
      try {
        this.ytPlayer.setVolume(Math.round(clamped * 100));
      } catch {}
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  // Apply Equalizer Preset and Bass Boost
  public applyPreset(preset: EqualizerPreset) {
    if (!this.filters.length) return;
    preset.gains.forEach((gain, i) => {
      if (this.filters[i]) {
        this.filters[i].gain.value = gain;
      }
    });
    if (this.bassBoostFilter) {
      this.bassBoostFilter.gain.value = preset.bassBoost;
    }
  }

  public setBandGain(bandIndex: number, gain: number) {
    if (this.filters[bandIndex]) {
      this.filters[bandIndex].gain.value = Math.max(-12, Math.min(12, gain));
    }
  }

  public setBassBoost(val: number) {
    if (this.bassBoostFilter) {
      this.bassBoostFilter.gain.value = Math.max(0, Math.min(12, val));
    }
  }

  // Real-time FFT Frequency Data for 48/64 Bar Visualizer
  public getFrequencyData(outputArray: Uint8Array): void {
    let hasRealData = false;
    if (this.analyser) {
      (this.analyser as any).getByteFrequencyData(outputArray);
      for (let i = 0; i < outputArray.length; i++) {
        if (outputArray[i] > 0) {
          hasRealData = true;
          break;
        }
      }
    }

    const isPlaying =
      this.currentEngine === 'youtube'
        ? this.isYtPlaying
        : (!this.audio.paused && this.audio.currentTime > 0);

    // If running in browser or YouTube background player, animate spectrum dynamically
    if (!hasRealData && isPlaying) {
      const t = performance.now() * 0.006;
      for (let i = 0; i < outputArray.length; i++) {
        const wave = Math.sin(t + i * 0.35) * 0.5 + 0.5;
        const wave2 = Math.cos(t * 1.8 + i * 0.2) * 0.3 + 0.3;
        const bass = i < 10 ? Math.sin(t * 4) * 50 + 70 : 0;
        outputArray[i] = Math.min(
          255,
          Math.max(10, Math.floor((wave * 110 + wave2 * 60 + bass) * (1 - (i / outputArray.length) * 0.4)))
        );
      }
    } else if (!hasRealData && !isPlaying) {
      outputArray.fill(0);
    }
  }

  // Windows Media Session / System Media Transport Controls (SMTC)
  public updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'A1 Swaara',
        artwork: [
          { src: track.artwork, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    }
  }

  public setupMediaSessionHandlers(actions: {
    play: () => void;
    pause: () => void;
    next: () => void;
    previous: () => void;
    seek: (time: number) => void;
  }) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', actions.play);
      navigator.mediaSession.setActionHandler('pause', actions.pause);
      navigator.mediaSession.setActionHandler('nexttrack', actions.next);
      navigator.mediaSession.setActionHandler('previoustrack', actions.previous);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) actions.seek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        this.seek(this.audio.currentTime - (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        this.seek(this.audio.currentTime + (details.seekOffset || 10));
      });
    }
  }

  public setCallbacks(callbacks: {
    onTimeUpdate?: (current: number, duration: number, buffered: number) => void;
    onEnd?: () => void;
    onPlayChange?: (isPlaying: boolean) => void;
    onLoading?: (isLoading: boolean) => void;
    onError?: (msg: string) => void;
  }) {
    this.onTimeUpdateCb = callbacks.onTimeUpdate;
    this.onEndCb = callbacks.onEnd;
    this.onPlayChangeCb = callbacks.onPlayChange;
    this.onLoadingCb = callbacks.onLoading;
    this.onErrorCb = callbacks.onError;
  }
}

export const audioEngine = new AudioEngine();
