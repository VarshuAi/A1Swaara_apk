import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Mic2,
  Info as InfoIcon,
  Share2,
  Download,
  SlidersHorizontal,
  Headphones,
  Gauge,
  Moon,
  Sparkles,
  X,
  Loader2,
  Disc3,
  Radio,
} from 'lucide-react';
import { Track, SyncedLyricLine, SleepTimerOption } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface NowPlayingViewProps {
  track: Track;
  isPlaying: boolean;
  isLoading?: boolean;
  currentTime: number;
  duration?: number;
  buffered?: number;
  volume?: number;
  onChangeVolume?: (volume: number) => void;
  onClose: () => void;
  onTogglePlay?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleShuffle?: () => void;
  isShuffle?: boolean;
  onToggleRepeat?: () => void;
  isRepeat?: boolean;
  queue?: Track[];
  onPlayTrack?: (track: Track) => void;
  onPlayQueueTrack?: (index: number) => void;
  onRemoveFromQueue?: (index: number) => void;
  onClearQueue?: () => void;
  onOpenArtist?: (artistName: string) => void;
  onToggleLike: () => void;
  isLiked: boolean;
  onDownload: () => void;
  onOpenEqualizer: () => void;
  onOpenStoryCreator: () => void;
  lyrics: { text: string; synced: SyncedLyricLine[] };
  onSeek: (time: number) => void;
  isSpatialAudio?: boolean;
  onToggleSpatialAudio?: () => void;
  playbackSpeed?: number;
  onChangeSpeed?: (speed: number) => void;
  sleepTimerOption?: SleepTimerOption;
  onSelectSleepTimer?: (opt: SleepTimerOption) => void;
  isAutoDJ?: boolean;
}

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${mins}:${s < 10 ? '0' : ''}${s}`;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  track,
  isPlaying,
  isLoading = false,
  currentTime,
  duration: propDuration,
  buffered = 0,
  volume = 0.85,
  onChangeVolume,
  onClose,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleShuffle,
  isShuffle = false,
  onToggleRepeat,
  isRepeat = false,
  queue = [],
  onPlayTrack,
  onPlayQueueTrack,
  onRemoveFromQueue,
  onClearQueue,
  onOpenArtist,
  onToggleLike,
  isLiked,
  onDownload,
  onOpenEqualizer,
  onOpenStoryCreator,
  lyrics,
  onSeek,
  isSpatialAudio = false,
  onToggleSpatialAudio,
  playbackSpeed = 1.0,
  onChangeSpeed,
  sleepTimerOption = null,
  onSelectSleepTimer,
  isAutoDJ = true,
}) => {
  const [rightTab, setRightTab] = useState<'queue' | 'lyrics' | 'info'>('queue');
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(36).fill(12));
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const duration = propDuration || track.duration || 240;

  // Listen for Escape key to cleanly exit full Now Playing mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Real-time FFT Audio Frequency Spectrum Visualizer Loop
  useEffect(() => {
    const dataArray = new Uint8Array(64);
    let idlePhase = 0;

    const updateVisualizer = () => {
      audioEngine.getFrequencyData(dataArray);

      const hasAudio = dataArray.some((val) => val > 0);
      const bars: number[] = [];
      const barCount = 36;
      const step = 64 / barCount;

      if (hasAudio && isPlaying) {
        for (let i = 0; i < barCount; i++) {
          const index = Math.floor(i * step);
          const value = dataArray[index] || 0;
          const percent = Math.max(14, (value / 255) * 100);
          bars.push(percent);
        }
      } else {
        // Aesthetic rhythmic breathing wave when idle or paused
        idlePhase += 0.04;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(idlePhase + i * 0.28) * 18 + 24;
          bars.push(Math.max(10, wave));
        }
      }
      setSpectrumBars(bars);

      animFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animFrameRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Auto-scroll active synced lyric line
  useEffect(() => {
    if (rightTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, rightTab]);

  const activeLyricIndex = lyrics.synced.findIndex((line, i) => {
    const nextLine = lyrics.synced[i + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  // Derive album or movie soundtrack subtitle
  const albumSubtitle =
    track.album ||
    (track.title.includes('From')
      ? `${track.title.match(/From\s+["']?([^)"']+)["']?/i)?.[1] || 'Motion Picture'} (Soundtrack)`
      : `${track.artist} • Single`);

  return (
    <div className="relative w-full h-full bg-[#070B0E] overflow-hidden flex flex-col z-30 select-none font-sans">
      {/* 1. Cinematic Ambient Glow Canvas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={track.artwork}
          alt=""
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] object-cover blur-[140px] opacity-25 scale-125 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070B0E]/70 via-[#070B0E]/90 to-[#070B0E]" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#070B0E]/40 to-[#070B0E]/95" />
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/[0.06] bg-[#070B0E]/40 backdrop-blur-md shrink-0">
        {/* Left: Back to Browse with Escape Key Hint */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-medium text-white/90 hover:text-white transition-all cursor-pointer group"
            title="Back to Browse (Esc)"
          >
            <ChevronLeft className="size-4 text-[#8E96A0] group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
            <span className="text-xs font-semibold tracking-tight">Back to Browse</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#71717A] border border-white/[0.06]">
              Esc
            </kbd>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/[0.08]">
            <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Now Playing
            </span>
          </div>
        </div>

        {/* Right: Quick Tools Dock */}
        <div className="flex items-center gap-2">
          {onToggleSpatialAudio && (
            <button
              onClick={onToggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-medium transition-all cursor-pointer ${
                isSpatialAudio
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Spatial 3D Audio"
            >
              <Headphones className="size-3.5" />
              <span>3D Audio</span>
            </button>
          )}

          {onChangeSpeed && (
            <button
              onClick={() => {
                const nextRate =
                  playbackSpeed === 1.0
                    ? 1.25
                    : playbackSpeed === 1.25
                    ? 1.5
                    : playbackSpeed === 1.5
                    ? 0.8
                    : 1.0;
                onChangeSpeed(nextRate);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-mono font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Playback Speed"
            >
              <Gauge className="size-3.5 text-[#10B981]" />
              <span>{playbackSpeed}x</span>
            </button>
          )}

          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="10-Band EQ & Spatial DSP"
          >
            <SlidersHorizontal className="size-4" />
          </button>

          <button
            onClick={onOpenStoryCreator}
            className="p-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Share Story Card"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Stage Viewport (2-Column Balanced Grid) */}
      <div className="relative z-10 flex-1 overflow-hidden px-6 sm:px-10 py-6 max-w-7xl mx-auto w-full flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full h-full max-h-[720px]">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Large Hero Album Art & Playback Deck (lg:col-span-7) */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col md:flex-row items-center gap-6 lg:gap-8 justify-center h-full min-w-0">
            
            {/* Square Album Cover with Smooth Corners & Ambient Shadow */}
            <div className="relative size-52 sm:size-64 md:size-72 lg:size-80 xl:size-88 rounded-2xl overflow-hidden shrink-0 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/[0.1] bg-[#0E141B] group">
              <img
                src={track.artwork}
                alt={track.title}
                className="size-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
            </div>

            {/* Song Meta, Scrubber, Controls & Spectrum Visualizer */}
            <div className="flex flex-col justify-center flex-1 min-w-0 w-full space-y-3.5">
              
              {/* Album / Movie Soundtrack Breadcrumb */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#10B981] block">
                  {albumSubtitle.startsWith('From') ? 'ORIGINAL SOUNDTRACK' : 'ALBUM / RELEASE'}
                </span>
                <p className="text-xs sm:text-sm text-zinc-400 truncate font-medium">
                  {albumSubtitle}
                </p>
              </div>

              {/* Title & Artist */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                  {track.title}
                </h1>
                <p
                  onClick={() => onOpenArtist && onOpenArtist(track.artist)}
                  className={`text-sm sm:text-base text-zinc-300 font-medium truncate ${
                    onOpenArtist ? 'hover:text-[#10B981] hover:underline cursor-pointer transition-colors' : ''
                  }`}
                >
                  {track.artist}
                </p>
              </div>

              {/* Action Strip: Heart, Fidelity Badge & Download */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onToggleLike}
                  className="size-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-all cursor-pointer group"
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart
                    className={`size-4.5 transition-transform group-hover:scale-110 ${
                      isLiked ? 'text-[#10B981] fill-[#10B981]' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                </button>

                <button
                  onClick={onDownload}
                  className="size-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer group"
                  title="Download Lossless 320kbps Audio"
                >
                  <Download className="size-4.5 group-hover:scale-110 transition-transform" />
                </button>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[11px] font-mono font-semibold text-[#10B981]">
                    {track.bitrate || '320 kbps'} High Fidelity
                  </span>
                </div>
              </div>

              {/* Progress Scrubber */}
              <div className="space-y-1.5 pt-2">
                <div className="relative flex items-center group cursor-pointer h-3">
                  {/* Track Background */}
                  <div className="w-full h-1 bg-white/[0.1] rounded-full overflow-hidden relative">
                    {/* Buffered Fill */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-white/[0.15] rounded-full transition-all"
                      style={{ width: `${Math.min(100, buffered)}%` }}
                    />
                    {/* Active Played Fill */}
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                  {/* Thumb Knob */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none group-hover:scale-125 transition-transform"
                    style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-center gap-6 sm:gap-7 pt-2">
                <button
                  onClick={onToggleShuffle}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isShuffle ? 'text-[#10B981]' : 'text-zinc-400 hover:text-white'
                  }`}
                  title={isShuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}
                >
                  <Shuffle className="size-4.5" />
                </button>

                <button
                  onClick={onPrev}
                  className="p-2 rounded-full text-white hover:text-[#10B981] transition-colors cursor-pointer active:scale-95"
                  title="Previous"
                >
                  <SkipBack className="size-5.5 fill-current" />
                </button>

                {/* Big Center Play / Pause Button */}
                <button
                  onClick={onTogglePlay || (() => audioEngine.togglePlay())}
                  disabled={isLoading}
                  className="size-15 rounded-full bg-[#10B981] hover:bg-[#059669] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <Loader2 className="size-6 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="size-6 fill-current stroke-current" />
                  ) : (
                    <Play className="size-6 fill-current stroke-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="p-2 rounded-full text-white hover:text-[#10B981] transition-colors cursor-pointer active:scale-95"
                  title="Next"
                >
                  <SkipForward className="size-5.5 fill-current" />
                </button>

                <button
                  onClick={onToggleRepeat}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isRepeat ? 'text-[#10B981]' : 'text-zinc-400 hover:text-white'
                  }`}
                  title={isRepeat ? 'Repeat: ON' : 'Repeat: OFF'}
                >
                  <Repeat className="size-4.5" />
                </button>
              </div>

              {/* Volume Slider & Real-time Web Audio Visualizer */}
              <div className="space-y-3 pt-2">
                {/* Volume Bar */}
                {onChangeVolume && (
                  <div className="flex items-center gap-3 px-2">
                    <button
                      onClick={() => onChangeVolume(volume === 0 ? 0.8 : 0)}
                      className="text-zinc-400 hover:text-white cursor-pointer transition-colors"
                      title={volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      {volume === 0 ? (
                        <VolumeX className="size-4 text-red-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="size-4" />
                      ) : (
                        <Volume2 className="size-4" />
                      )}
                    </button>
                    <div className="relative flex-1 flex items-center h-2 group cursor-pointer">
                      <div className="w-full h-1 bg-white/[0.1] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-300 group-hover:bg-[#10B981] rounded-full transition-colors"
                          style={{ width: `${volume * 100}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => onChangeVolume(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 w-7 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                )}

                {/* 36-Bar Real-Time Frequency Spectrum Visualizer */}
                <div className="flex items-end justify-center gap-1 h-8 w-full max-w-xs mx-auto">
                  {spectrumBars.map((height, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-[#10B981] transition-all duration-75"
                      style={{
                        height: `${height}%`,
                        opacity: isPlaying ? 0.85 : 0.25,
                      }}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Full-Height Integrated Card (Queue, Lyrics, Info) (lg:col-span-5) */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 h-[480px] sm:h-[520px] lg:h-full max-h-[640px] w-full rounded-2xl bg-[#0E141B]/85 backdrop-blur-xl border border-white/[0.08] p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
            
            {/* Top Segmented Tab Switcher */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.04]">
                <button
                  onClick={() => setRightTab('queue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    rightTab === 'queue'
                      ? 'bg-[#10B981] text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ListMusic className="size-3.5" />
                  <span>Queue</span>
                  {queue.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        rightTab === 'queue'
                          ? 'bg-black/20 text-black font-bold'
                          : 'bg-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {queue.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setRightTab('lyrics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    rightTab === 'lyrics'
                      ? 'bg-[#10B981] text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Mic2 className="size-3.5" />
                  <span>Lyrics</span>
                  {lyrics.synced.length > 0 && (
                    <span
                      className={`text-[9px] font-semibold uppercase px-1 rounded ${
                        rightTab === 'lyrics' ? 'bg-black/20 text-black' : 'bg-[#10B981]/20 text-[#10B981]'
                      }`}
                    >
                      Live
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setRightTab('info')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    rightTab === 'info'
                      ? 'bg-[#10B981] text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <InfoIcon className="size-3.5" />
                  <span>Info</span>
                </button>
              </div>

              {rightTab === 'queue' && queue.length > 0 && onClearQueue && (
                <button
                  onClick={onClearQueue}
                  className="text-xs font-medium text-zinc-400 hover:text-red-400 cursor-pointer transition-colors px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* TAB 1: Clean Up Next Queue */}
            {rightTab === 'queue' && (
              <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 scrollbar-thin">
                <div className="flex items-center justify-between pb-1 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="size-1.5 rounded-full bg-[#10B981]" />
                    <span>Up Next {isAutoDJ ? '• Continuous Stream' : ''}</span>
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {queue.length} songs
                  </span>
                </div>

                {/* Queue Track List */}
                <div className="space-y-1">
                  {queue.length > 0 ? (
                    queue.map((qTrack, idx) => (
                      <div
                        key={`${qTrack.id}-${idx}`}
                        onClick={() =>
                          onPlayQueueTrack ? onPlayQueueTrack(idx) : onPlayTrack && onPlayTrack(qTrack)
                        }
                        className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                          <span className="text-xs font-mono text-zinc-500 w-4 text-center group-hover:hidden shrink-0">
                            {idx + 1}
                          </span>
                          <Play className="size-3 text-[#10B981] fill-[#10B981] hidden group-hover:block shrink-0 ml-0.5 mr-0.5" />

                          <div className="size-9 rounded-lg overflow-hidden shrink-0 bg-[#141416] border border-white/[0.06]">
                            <img src={qTrack.artwork} alt={qTrack.title} className="size-full object-cover" />
                          </div>
                          <div className="truncate pr-2">
                            <p className="text-xs font-medium text-white truncate group-hover:text-[#10B981] transition-colors">
                              {qTrack.title}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {qTrack.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-zinc-500">
                            {formatTime(qTrack.duration || 210)}
                          </span>
                          {onRemoveFromQueue && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromQueue(idx);
                              }}
                              className="text-zinc-500 hover:text-red-400 cursor-pointer p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove from queue"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-zinc-400 space-y-2">
                      <div className="size-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-zinc-500">
                        <ListMusic className="size-5" />
                      </div>
                      <p className="text-xs font-semibold text-white">Queue is empty</p>
                      <p className="text-[11px] text-zinc-500 max-w-[200px] mx-auto">
                        Smart AI DJ is active and will generate next songs automatically
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Synchronized Karaoke Lyrics */}
            {rightTab === 'lyrics' && (
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-center scrollbar-thin">
                {lyrics.synced.length > 0 ? (
                  lyrics.synced.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <p
                        key={idx}
                        ref={isActive ? activeLyricRef : null}
                        onClick={() => onSeek(line.time)}
                        className={`cursor-pointer transition-all duration-200 text-sm sm:text-base font-semibold leading-relaxed ${
                          isActive
                            ? 'text-white scale-103 font-extrabold drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : lyrics.text ? (
                  <div className="text-zinc-400 whitespace-pre-line text-xs leading-relaxed text-left p-2 font-medium">
                    {lyrics.text}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3">
                    <Mic2 className="size-8 text-zinc-600" />
                    <p className="text-xs font-medium">No synced lyrics found for this track</p>
                    <p className="text-[11px] text-zinc-500">Audio plays with 10-band DSP master sound</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Track Info & Audiophile Specs */}
            {rightTab === 'info' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs text-zinc-400 scrollbar-thin">
                <div className="space-y-1.5 bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
                  <p className="text-white font-bold text-sm">{track.title}</p>
                  <p className="text-zinc-300 font-medium">{track.artist}</p>
                  {track.album && <p className="text-zinc-400 text-[11px]">Album: {track.album}</p>}
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span>Fidelity Stream</span>
                    <span className="text-[#10B981] font-mono font-semibold">
                      {track.bitrate || '320 kbps High Fidelity'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span>Audio Processing</span>
                    <span className="text-white font-mono">10-Band Biquad EQ Graph</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span>3D Spatial Sound</span>
                    <span className={isSpatialAudio ? 'text-[#10B981] font-mono' : 'text-zinc-500 font-mono'}>
                      {isSpatialAudio ? 'Convolution 3D ON' : 'Stereo Normal'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span>Stream Engine</span>
                    <span className="text-white font-mono">YouTube Music WEB_REMIX</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span>Track ID</span>
                    <span className="text-white font-mono text-[11px] truncate max-w-[140px]">
                      {track.id}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={onDownload}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Download className="size-4" />
                    <span>Download Lossless 320 kbps</span>
                  </button>

                  {onOpenArtist && (
                    <button
                      onClick={() => onOpenArtist(track.artist)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.06] transition-colors cursor-pointer"
                    >
                      <span>View Artist Discography</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Card Footer */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <Disc3 className="size-3.5 text-[#10B981] animate-spin" />
                <span className="truncate max-w-[180px]">{track.title}</span>
              </span>
              <span className="font-mono text-[#10B981]">{track.bitrate || '320k'}</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

