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

  public async playTrack(track: Track) {
    this.initWebAudio();

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (!track.streamUrl) {
      if (this.onErrorCb) this.onErrorCb('No stream URL available');
      return;
    }

    if (this.audio.src !== track.streamUrl) {
      this.audio.src = track.streamUrl;
      this.audio.load();
    }

    try {
      await this.audio.play();
      this.updateMediaSession(track);
    } catch (err) {
      console.error('Play error:', err);
    }
  }

  public async togglePlay() {
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
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
    if (!isNaN(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds));
    }
  }

  public setVolume(vol: number) {
    // vol 0 to 1
    const clamped = Math.max(0, Math.min(1, vol));
    this.audio.volume = clamped;
  }

  public getVolume(): number {
    return this.audio.volume;
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

    // If running in browser and analyser outputs zeroes due to browser cross-origin policy,
    // animate spectrum dynamically based on music playback state
    if (!hasRealData && !this.audio.paused && this.audio.currentTime > 0) {
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
    } else if (!hasRealData && this.audio.paused) {
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
