import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Heart,
  ListMusic,
  SlidersHorizontal,
  Mic2,
  Download,
  Info,
  Disc3,
  Loader2,
  Sparkles,
  Radio,
  Headphones,
  Gauge,
} from 'lucide-react';
import { Track, AlgorithmMode } from '../types/music';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  isLiked: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: () => void;
  onChangeVolume: (volume: number) => void;
  onOpenLyrics: () => void;
  onOpenEqualizer: () => void;
  onToggleQueue: () => void;
  onToggleFullscreen: () => void;
  onExpandNowPlaying: () => void;
  onDownloadTrack: (track: Track) => void;
  onToggleInsights?: () => void;
  onOpenArtist?: (artistName: string) => void;
  isLyricsActive?: boolean;
  isInsightsActive?: boolean;
  isQueueActive?: boolean;
  isDownloading?: boolean;
  isSpatialAudio?: boolean;
  onToggleSpatialAudio?: () => void;
  playbackSpeed?: number;
  onChangeSpeed?: (speed: number) => void;
  isAutoDJ?: boolean;
  onToggleAutoDJ?: () => void;
  algorithmMode?: AlgorithmMode;
  onChangeAlgorithmMode?: (mode: AlgorithmMode) => void;
}

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  buffered,
  volume,
  isShuffle,
  isRepeat,
  isLiked,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onChangeVolume,
  onOpenLyrics,
  onOpenEqualizer,
  onToggleQueue,
  onToggleFullscreen,
  onExpandNowPlaying,
  onDownloadTrack,
  onToggleInsights,
  onOpenArtist,
  isLyricsActive = false,
  isInsightsActive = false,
  isQueueActive = false,
  isDownloading = false,
  isSpatialAudio = false,
  onToggleSpatialAudio,
  playbackSpeed = 1.0,
  onChangeSpeed,
  isAutoDJ = true,
  onToggleAutoDJ,
  algorithmMode = 'flow',
  onChangeAlgorithmMode,
}) => {
  const [isScrubHovered, setIsScrubHovered] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleToggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      onChangeVolume(0);
    } else {
      onChangeVolume(previousVolume || 0.85);
    }
  };

  const cycleAlgorithmMode = () => {
    if (!onChangeAlgorithmMode) return;
    const modes: AlgorithmMode[] = ['flow', 'high_energy', 'chill', 'vocal_acoustic', 'deep_cuts'];
    const currIdx = modes.indexOf(algorithmMode);
    const nextMode = modes[(currIdx + 1) % modes.length];
    onChangeAlgorithmMode(nextMode);
  };

  return (
    <footer className="h-21 w-full bg-[#080811]/95 backdrop-blur-3xl border-t border-white/[0.08] px-5 flex items-center justify-between select-none z-40 relative font-sans shadow-[0_-10px_35px_rgba(0,0,0,0.8)]">
      {/* 1. Left Column: Track Info & Artwork */}
      <div className="flex items-center gap-3.5 w-[30%] min-w-[200px] max-w-[340px]">
        {currentTrack ? (
          <>
            {/* Artwork with Click-to-Expand Stage */}
            <div
              onClick={onExpandNowPlaying}
              className="relative size-14 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-black/60 group cursor-pointer bg-[#141420] border border-white/10"
              title="Expand Now Playing Stage"
            >
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="size-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="size-4 text-white" />
              </div>
            </div>

            {/* Track Title & Artist */}
            <div className="truncate flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <p
                  onClick={onExpandNowPlaying}
                  className="font-bold text-sm text-white hover:text-[#00F59B] transition-colors cursor-pointer truncate"
                >
                  {currentTrack.title}
                </p>
                {/* Mini audio reactive wave indicator */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0" title="Lossless 320k Audio Stream">
                    <span className="w-0.5 bg-[#00F59B] rounded-full animate-eq-1 shadow-[0_0_6px_#00F59B]" />
                    <span className="w-0.5 bg-[#1ED760] rounded-full animate-eq-2" />
                    <span className="w-0.5 bg-[#20CFFF] rounded-full animate-eq-3 shadow-[0_0_6px_#20CFFF]" />
                    <span className="w-0.5 bg-[#8B35FF] rounded-full animate-eq-4" />
                  </div>
                )}
              </div>
              <p
                onClick={() => onOpenArtist && currentTrack.artist && onOpenArtist(currentTrack.artist)}
                className="text-xs text-[#9A9AA8] hover:underline hover:text-white cursor-pointer truncate mt-0.5"
              >
                {currentTrack.artist}
              </p>
            </div>

            {/* Favorite Heart */}
            <button
              onClick={onToggleLike}
              className={`p-1.5 transition-all hover:scale-110 active:scale-90 cursor-pointer ${
                isLiked ? 'text-[#00F59B]' : 'text-[#9A9AA8] hover:text-white'
              }`}
              title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
            >
              <Heart className={`size-4.5 ${isLiked ? 'fill-[#00F59B] drop-shadow-[0_0_8px_rgba(0,245,155,0.5)]' : ''}`} />
            </button>

            {/* 1-Click 320k Download */}
            <button
              onClick={() => onDownloadTrack(currentTrack)}
              disabled={isDownloading}
              className="p-1.5 text-[#9A9AA8] hover:text-[#00F59B] transition-all hover:scale-110 active:scale-90 cursor-pointer"
              title="Download 320 kbps file"
            >
              {isDownloading ? (
                <Loader2 className="size-4.5 animate-spin text-[#00F59B]" />
              ) : (
                <Download className="size-4.5" />
              )}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-xs text-[#9A9AA8]">
            <div className="size-14 rounded-xl bg-[#12121E] border border-white/5 flex items-center justify-center">
              <Disc3 className="size-6 text-[#555566]" />
            </div>
            <span>No track loaded</span>
          </div>
        )}
      </div>

      {/* 2. Center Column: Master Transport Controls & Progress Scrub Bar */}
      <div className="flex flex-col items-center justify-center w-[40%] max-w-[720px] gap-2">
        {/* Playback Action Buttons */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Smart Auto-DJ Flow & Persona Indicator */}
          {onToggleAutoDJ && (
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleAutoDJ}
                className={`transition-colors cursor-pointer relative p-1 ${
                  isAutoDJ ? 'text-[#00F59B]' : 'text-[#777788] hover:text-white'
                }`}
                title={isAutoDJ ? 'Smart AI DJ: Continuous Flow ON' : 'Smart AI DJ: OFF'}
              >
                <Radio className="size-4" />
                {isAutoDJ && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#00F59B] shadow-[0_0_6px_#00F59B]" />
                )}
              </button>

              {isAutoDJ && onChangeAlgorithmMode && (
                <button
                  onClick={cycleAlgorithmMode}
                  className="hidden md:inline-flex items-center text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Click to cycle AI DJ vibe"
                >
                  {algorithmMode === 'flow' && 'Flow'}
                  {algorithmMode === 'high_energy' && '🔥 Hype'}
                  {algorithmMode === 'chill' && '🌙 Chill'}
                  {algorithmMode === 'vocal_acoustic' && '✨ Vocal'}
                  {algorithmMode === 'deep_cuts' && '🌌 Deep'}
                </button>
              )}
            </div>
          )}

          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`transition-colors cursor-pointer relative p-1 ${
              isShuffle ? 'text-[#00F59B]' : 'text-[#9A9AA8] hover:text-white'
            }`}
            title={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <Shuffle className="size-4" />
            {isShuffle && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#00F59B]" />}
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrev}
            className="text-[#B3B3C2] hover:text-white transition-colors cursor-pointer p-1"
            title="Previous (Shift+P)"
          >
            <SkipBack className="size-5 fill-current" />
          </button>

          {/* Hero Play / Pause Circle (Neon Cyber Accent) */}
          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="size-9 rounded-full bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-[0_0_20px_rgba(0,245,155,0.4)] cursor-pointer disabled:opacity-50 font-bold"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isLoading ? (
              <Loader2 className="size-4.5 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="size-4.5 fill-black stroke-black" />
            ) : (
              <Play className="size-4.5 fill-black stroke-black ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            className="text-[#B3B3C2] hover:text-white transition-colors cursor-pointer p-1"
            title="Next (Shift+N)"
          >
            <SkipForward className="size-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={onToggleRepeat}
            className={`transition-colors cursor-pointer relative p-1 ${
              isRepeat ? 'text-[#00F59B]' : 'text-[#9A9AA8] hover:text-white'
            }`}
            title={isRepeat ? 'Disable repeat' : 'Enable repeat'}
          >
            <Repeat className="size-4" />
            {isRepeat && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#00F59B]" />}
          </button>
        </div>

        {/* Scrubber Timeline Bar */}
        <div className="w-full flex items-center gap-2.5 text-xs font-mono text-[#8E8E9F]">
          <span className="w-10 text-right text-[11px] font-semibold">
            {formatTime(currentTime)}
          </span>

          <div
            className="relative flex-1 h-1.5 bg-white/[0.08] rounded-full group cursor-pointer overflow-visible"
            onMouseEnter={() => setIsScrubHovered(true)}
            onMouseLeave={() => setIsScrubHovered(false)}
          >
            {/* Buffer bar */}
            <div
              className="absolute top-0 left-0 h-full bg-white/[0.15] rounded-full pointer-events-none transition-all duration-200"
              style={{ width: `${bufferedPercent}%` }}
            />

            {/* Active Playback Progress (Illuminated Cyber Gradient) */}
            <div
              className={`absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all ${
                isScrubHovered
                  ? 'bg-gradient-to-r from-[#00F59B] to-[#20CFFF] shadow-[0_0_12px_rgba(0,245,155,0.7)]'
                  : 'bg-gradient-to-r from-[#00F59B] via-[#1ED760] to-[#20CFFF]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />

            {/* Hover thumb scrubber dot */}
            {isScrubHovered && (
              <div
                className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-white shadow-[0_0_10px_#00F59B] border-2 border-[#00F59B] pointer-events-none"
                style={{ left: `calc(${progressPercent}% - 7px)` }}
              />
            )}

            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="w-10 text-left text-[11px] font-semibold">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right Column: Studio Tools, Queue, Lyrics, Insights, Volume */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-[200px]">
        {/* Spatial 3D Surround Audio Pill */}
        {onToggleSpatialAudio && (
          <button
            onClick={onToggleSpatialAudio}
            className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              isSpatialAudio
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)] scale-105'
                : 'text-[#888888] hover:text-white border-white/10 hover:border-white/20 bg-white/[0.03]'
            }`}
            title={isSpatialAudio ? 'Spatial 3D Audio: ON' : 'Spatial 3D Audio: OFF'}
          >
            <Headphones className="size-3" />
            <span>3D</span>
          </button>
        )}

        {/* Playback Speed Controller Pill */}
        {onChangeSpeed && (
          <button
            onClick={() => {
              const nextRate = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 0.8 : 1.0;
              onChangeSpeed(nextRate);
            }}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono font-bold text-[#A7A7A7] hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.03] transition-all cursor-pointer"
            title="Cycle Playback Speed (0.8x, 1x, 1.25x, 1.5x)"
          >
            <Gauge className="size-3 text-[#1ED760]" />
            <span>{playbackSpeed}x</span>
          </button>
        )}

        {/* Karaoke Lyrics */}
        <button
          onClick={onOpenLyrics}
          className={`p-1.5 transition-colors cursor-pointer ${
            isLyricsActive ? 'text-[#1ED760]' : 'text-[#B3B3B3] hover:text-white'
          }`}
          title="Karaoke Lyrics"
        >
          <Mic2 className="size-4.5" />
        </button>

        {/* Up Next Queue */}
        <button
          onClick={onToggleQueue}
          className={`p-1.5 transition-colors cursor-pointer ${
            isQueueActive ? 'text-[#1ED760]' : 'text-[#B3B3B3] hover:text-white'
          }`}
          title="Up Next Queue"
        >
          <ListMusic className="size-4.5" />
        </button>

        {/* Song Insights & Acoustic Profile */}
        {onToggleInsights && (
          <button
            onClick={onToggleInsights}
            className={`p-1.5 transition-colors cursor-pointer ${
              isInsightsActive ? 'text-[#1ED760]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            title="Song Insights & Listener Comments"
          >
            <Info className="size-4.5" />
          </button>
        )}

        {/* Studio Equalizer */}
        <button
          onClick={onOpenEqualizer}
          className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer"
          title="BOOM BASS Studio EQ"
        >
          <SlidersHorizontal className="size-4.5" />
        </button>

        {/* Volume Scrub */}
        <div
          className="flex items-center gap-2 group w-28"
          onMouseEnter={() => setIsVolumeHovered(true)}
          onMouseLeave={() => setIsVolumeHovered(false)}
        >
          <button
            onClick={handleToggleMute}
            className="text-[#B3B3B3] hover:text-white transition-colors cursor-pointer shrink-0"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="size-4.5 text-[#E81123]" />
            ) : volume < 0.5 ? (
              <Volume1 className="size-4.5" />
            ) : (
              <Volume2 className="size-4.5" />
            )}
          </button>

          <div className="relative flex-1 h-1.5 bg-white/[0.08] rounded-full cursor-pointer overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isVolumeHovered
                  ? 'bg-gradient-to-r from-[#00F59B] to-[#20CFFF] shadow-[0_0_8px_rgba(0,245,155,0.6)]'
                  : 'bg-white'
              }`}
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer hidden sm:block"
          title="Fullscreen Stage Mode"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </footer>
  );
};
