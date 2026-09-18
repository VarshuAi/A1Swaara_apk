import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Heart,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  MoreVertical,
  BarChart2,
  Trash2,
  Mic2,
  Info as InfoIcon,
  ListMusic,
  Share2,
  Download,
  SlidersHorizontal,
  Headphones,
  Gauge,
  Moon,
} from 'lucide-react';
import { Track, SyncedLyricLine, SleepTimerOption } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface NowPlayingViewProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration?: number;
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
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  track,
  isPlaying,
  currentTime,
  duration: propDuration,
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
}) => {
  const [rightTab, setRightTab] = useState<'queue' | 'lyrics' | 'info'>('queue');
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(44).fill(12));
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const duration = propDuration || track.duration || 240;

  // Real-time FFT Frequency Spectrum Loop
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
          const percent = Math.max(16, (value / 255) * 100);
          bars.push(percent);
        }
      } else {
        // Aesthetic rhythmic breathing wave when idle or paused
        idlePhase += 0.04;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(idlePhase + i * 0.28) * 22 + 32;
          bars.push(Math.max(14, wave));
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

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Derive album or movie soundtrack from title or track
  const albumSubtitle =
    track.album ||
    (track.title.includes('From')
      ? `${track.title.match(/From\s+["']?([^)"']+)["']?/i)?.[1] || 'Motion Picture'} (Original Soundtrack)`
      : `${track.artist} • Official Audio`);

  return (
    <div className="relative w-full h-full bg-[#070B0E] overflow-hidden flex flex-col p-6 sm:p-8 z-30 select-none font-sans">
      {/* 1. Soft Blurred Backdrop of Current Artwork */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <img
          src={track.artwork}
          alt=""
          className="size-full object-cover blur-[120px] scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B0E] via-[#070B0E]/80 to-[#070B0E]/60" />
      </div>

      {/* 2. Top Header Navigation */}
      <div className="relative z-10 flex items-center justify-between w-full mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2.5 text-sm font-medium text-white/95 hover:text-white transition-colors cursor-pointer group"
        >
          <ChevronLeft className="size-5 text-[#8E96A0] group-hover:text-white transition-colors" />
          <span className="text-base font-semibold tracking-tight">Now Playing</span>
        </button>

        {/* Quick Utility Docks (Spatial, Speed, Equalizer) */}
        <div className="flex items-center gap-2">
          {onToggleSpatialAudio && (
            <button
              onClick={onToggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-medium transition-colors cursor-pointer ${
                isSpatialAudio
                  ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30'
                  : 'bg-[#0E141B] text-[#8E96A0] border-white/[0.06] hover:text-white'
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
                const nextRate = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 0.8 : 1.0;
                onChangeSpeed(nextRate);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E141B] hover:bg-[#131D27] border border-white/[0.06] text-xs font-mono font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Playback Speed"
            >
              <Gauge className="size-3.5 text-[#2DD4BF]" />
              <span>{playbackSpeed}x</span>
            </button>
          )}

          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-full bg-[#0E141B] hover:bg-[#131D27] border border-white/[0.06] text-[#8E96A0] hover:text-white transition-colors cursor-pointer"
            title="Equalizer"
          >
            <SlidersHorizontal className="size-4" />
          </button>
          <button
            onClick={onOpenStoryCreator}
            className="p-2 rounded-full bg-[#0E141B] hover:bg-[#131D27] border border-white/[0.06] text-[#8E96A0] hover:text-white transition-colors cursor-pointer"
            title="Story Card"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>

      {/* 3. Main Center Stage (2-Column Hero & Integrated Right Panel) */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between w-full max-w-7xl mx-auto overflow-hidden">
        
        {/* LEFT / CENTER STAGE: Album Art + Song Controls (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-8 md:gap-10 justify-center">
          
          {/* Square Album Cover with Smooth Rounded Corners & Shadow */}
          <div className="relative size-64 sm:size-76 md:size-84 lg:size-96 rounded-2xl overflow-hidden shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/[0.08] bg-[#0E141B]">
            <img
              src={track.artwork}
              alt={track.title}
              className="size-full object-cover"
            />
          </div>

          {/* Right Column: Track Meta, Scrubber, Play Controls, Audio Waveform */}
          <div className="flex flex-col justify-center flex-1 max-w-md w-full space-y-4">
            
            {/* Top "FROM" Subtitle */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#8E96A0]">
                FROM
              </p>
              <p className="text-xs sm:text-sm text-[#94A3B8] truncate font-medium">
                {albumSubtitle}
              </p>
            </div>

            {/* Song Title & Artist */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                {track.title}
              </h1>
              <p
                onClick={() => onOpenArtist && onOpenArtist(track.artist)}
                className={`text-sm sm:text-base text-[#94A3B8] font-medium truncate ${
                  onOpenArtist ? 'hover:text-white hover:underline cursor-pointer' : ''
                }`}
              >
                {track.artist}
              </p>
            </div>

            {/* Action Row: Mint Heart, More Button, 320K Badge */}
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={onToggleLike}
                className="text-[#2DD4BF] hover:scale-110 transition-transform cursor-pointer"
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`size-5 ${isLiked ? 'fill-[#2DD4BF]' : ''}`} />
              </button>

              <button
                onClick={onOpenEqualizer}
                className="text-[#8E96A0] hover:text-white transition-colors cursor-pointer"
                title="More Options"
              >
                <MoreHorizontal className="size-5" />
              </button>

              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-[#8E96A0] bg-white/[0.06] border border-white/10">
                {track.bitrate || '320K'}
              </span>
            </div>

            {/* Progress Scrubber */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#8E96A0] pt-2">
              <span className="shrink-0 w-8 text-right">{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center group cursor-pointer h-3">
                <div className="w-full h-1 bg-white/[0.12] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2DD4BF] rounded-full"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-white shadow-md pointer-events-none"
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
              <span className="shrink-0 w-8 text-left">{formatTime(duration)}</span>
            </div>

            {/* Centered Playback Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-7 pt-2">
              <button
                onClick={onToggleShuffle}
                className={`transition-colors cursor-pointer ${
                  isShuffle ? 'text-[#2DD4BF]' : 'text-[#8E96A0] hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="size-4.5" />
              </button>

              <button
                onClick={onPrev}
                className="text-white hover:text-[#2DD4BF] transition-colors cursor-pointer"
                title="Previous"
              >
                <SkipBack className="size-5.5 fill-current" />
              </button>

              {/* Circular Mint Play/Pause Button */}
              <button
                onClick={onTogglePlay || (() => audioEngine.togglePlay())}
                className="size-13 rounded-full border-2 border-[#2DD4BF] bg-[#2DD4BF]/10 text-[#2DD4BF] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(45,212,191,0.25)]"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="size-6 fill-current stroke-current" />
                ) : (
                  <Play className="size-6 fill-current stroke-current ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="text-white hover:text-[#2DD4BF] transition-colors cursor-pointer"
                title="Next"
              >
                <SkipForward className="size-5.5 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`transition-colors cursor-pointer ${
                  isRepeat ? 'text-[#2DD4BF]' : 'text-[#8E96A0] hover:text-white'
                }`}
                title="Repeat"
              >
                <Repeat className="size-4.5" />
              </button>
            </div>

            {/* Pulsating Mint Spectrum Visualizer Under Controls */}
            <div className="flex items-end justify-center gap-1 h-9 w-full max-w-xs mx-auto pt-2">
              {spectrumBars.map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[#2DD4BF] transition-all duration-75"
                  style={{
                    height: `${height}%`,
                    opacity: isPlaying ? 0.85 : 0.2,
                  }}
                />
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Integrated Floating Card (Queue, Lyrics, Info) (lg:col-span-4) */}
        <div className="lg:col-span-4 w-full h-[480px] lg:h-[530px] rounded-2xl bg-[#0E141B] border border-white/[0.06] p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
          
          {/* Top Tabs */}
          <div className="flex items-center border-b border-white/[0.06] pb-2.5 gap-6">
            <button
              onClick={() => setRightTab('queue')}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer relative pb-1 ${
                rightTab === 'queue'
                  ? 'text-[#2DD4BF]'
                  : 'text-[#8E96A0] hover:text-white'
              }`}
            >
              Queue
              {rightTab === 'queue' && (
                <span className="absolute bottom-[-10px] left-0 right-0 h-0.5 bg-[#2DD4BF] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setRightTab('lyrics')}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer relative pb-1 ${
                rightTab === 'lyrics'
                  ? 'text-[#2DD4BF]'
                  : 'text-[#8E96A0] hover:text-white'
              }`}
            >
              Lyrics
              {rightTab === 'lyrics' && (
                <span className="absolute bottom-[-10px] left-0 right-0 h-0.5 bg-[#2DD4BF] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setRightTab('info')}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer relative pb-1 ${
                rightTab === 'info'
                  ? 'text-[#2DD4BF]'
                  : 'text-[#8E96A0] hover:text-white'
              }`}
            >
              Info
              {rightTab === 'info' && (
                <span className="absolute bottom-[-10px] left-0 right-0 h-0.5 bg-[#2DD4BF] rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: Queue View */}
          {rightTab === 'queue' && (
            <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 scrollbar-thin">
              
              {/* Section: Now Playing */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2DD4BF]">
                  <BarChart2 className="size-3.5 animate-pulse" />
                  <span>Now Playing</span>
                </div>

                {/* Active Playing Row */}
                <div className="p-2.5 rounded-xl bg-[#0F2426]/70 border border-[#2DD4BF]/25 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <span className="text-xs font-mono font-bold text-[#2DD4BF] w-3 text-center">
                      1
                    </span>
                    <div className="size-10 rounded-lg overflow-hidden shrink-0 bg-[#141416]">
                      <img src={track.artwork} alt={track.title} className="size-full object-cover" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#8E96A0] truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-[#8E96A0]">
                      {formatTime(duration)}
                    </span>
                    <button className="text-[#8E96A0] hover:text-white cursor-pointer p-1">
                      <MoreVertical className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Up Next */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <ListMusic className="size-3.5 text-[#2DD4BF]" />
                    <span>Up Next</span>
                  </div>

                  {queue.length > 0 && onClearQueue && (
                    <button
                      onClick={onClearQueue}
                      className="text-[11px] font-medium text-[#8E96A0] hover:text-white cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Up Next List */}
                <div className="space-y-1">
                  {queue.length > 0 ? (
                    queue.slice(0, 10).map((qTrack, idx) => (
                      <div
                        key={`${qTrack.id}-${idx}`}
                        onClick={() => (onPlayQueueTrack ? onPlayQueueTrack(idx) : onPlayTrack && onPlayTrack(qTrack))}
                        className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <span className="text-xs font-mono text-[#8E96A0] w-3 text-center group-hover:text-white">
                            {idx + 2}
                          </span>
                          <div className="size-9 rounded-lg overflow-hidden shrink-0 bg-[#141416]">
                            <img src={qTrack.artwork} alt={qTrack.title} className="size-full object-cover" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-medium text-white truncate group-hover:text-[#2DD4BF] transition-colors">
                              {qTrack.title}
                            </p>
                            <p className="text-[11px] text-[#8E96A0] truncate">
                              {qTrack.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-[#8E96A0]">
                            {formatTime(qTrack.duration || 210)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="text-[#8E96A0] hover:text-white cursor-pointer p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-[#8E96A0] space-y-1">
                      <p>Queue is empty</p>
                      <p className="text-[11px] text-[#71717A]">Autoplay will continuously recommend similar tracks</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Synced Lyrics View */}
          {rightTab === 'lyrics' && (
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-5 text-center scrollbar-thin">
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
                          ? 'text-white scale-102 font-bold'
                          : 'text-[#64748B] hover:text-[#94A3B8]'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })
              ) : lyrics.text ? (
                <div className="text-[#8E96A0] whitespace-pre-line text-xs leading-relaxed text-left">
                  {lyrics.text}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#8E96A0] space-y-2">
                  <Mic2 className="size-6 text-[#3F3F46]" />
                  <p className="text-xs">No lyrics found for this track</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Track Info View */}
          {rightTab === 'info' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs text-[#8E96A0] scrollbar-thin">
              <div className="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                <p className="text-white font-semibold">{track.title}</p>
                <p>{track.artist}</p>
                {track.album && <p className="text-[#94A3B8]">Album: {track.album}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Fidelity</span>
                  <span className="text-[#2DD4BF] font-mono">{track.bitrate || '320 kbps'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Audio Engine</span>
                  <span className="text-white font-mono">Web Audio Biquad DSP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Stream Protocol</span>
                  <span className="text-white font-mono">YouTube Music WEB_REMIX</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Track ID</span>
                  <span className="text-white font-mono text-[11px] truncate max-w-[140px]">{track.id}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onDownload}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#141F2B] hover:bg-[#1A2939] text-white text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download Track</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
