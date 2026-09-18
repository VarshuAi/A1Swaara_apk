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
  ChevronUp,
  ChevronDown,
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
  isNowPlayingOpen?: boolean;
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
  isNowPlayingOpen = false,
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
    <footer className="h-18 w-full bg-[#070B0E] border-t border-white/[0.06] px-5 flex items-center justify-between select-none z-40 relative font-sans">
      {/* 1. Left: Track Info & Artwork */}
      <div className="flex items-center gap-3 w-[28%] min-w-[180px] max-w-[300px]">
        {currentTrack ? (
          <>
            <div
              onClick={onExpandNowPlaying}
              className="relative size-11 rounded-md overflow-hidden shrink-0 cursor-pointer bg-[#141418] border border-white/[0.06] group"
              title="Expand Player"
            >
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="size-full object-cover"
              />
            </div>

            <div className="truncate flex-1 min-w-0">
              <p
                onClick={onExpandNowPlaying}
                className="font-medium text-xs text-[#F4F4F5] hover:text-white transition-colors cursor-pointer truncate"
              >
                {currentTrack.title}
              </p>
              <p
                onClick={() => onOpenArtist && currentTrack.artist && onOpenArtist(currentTrack.artist)}
                className="text-[11px] text-[#8E8E93] hover:text-[#F4F4F5] cursor-pointer truncate mt-0.5"
              >
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={onToggleLike}
              className={`p-1.5 transition-colors cursor-pointer ${
                isLiked ? 'text-[#2DD4BF] fill-[#2DD4BF]' : 'text-[#71717A] hover:text-[#F4F4F5]'
              }`}
              title={isLiked ? 'Saved' : 'Save to Library'}
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-[#2DD4BF]' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-[#71717A]">
            <div className="size-10 rounded-md bg-[#141418] border border-white/[0.04] flex items-center justify-center">
              <Disc3 className="size-4 text-[#52525B]" />
            </div>
            <span>No track</span>
          </div>
        )}
      </div>

      {/* 2. Center: Transport Controls & Scrubber */}
      <div className="flex flex-col items-center justify-center w-[44%] max-w-[620px] gap-1.5">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleShuffle}
            className={`transition-colors cursor-pointer p-1 ${
              isShuffle ? 'text-[#2DD4BF]' : 'text-[#71717A] hover:text-[#F4F4F5]'
            }`}
            title="Shuffle"
          >
            <Shuffle className="size-3.5" />
          </button>

          <button
            onClick={onPrev}
            className="text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer p-1"
            title="Previous"
          >
            <SkipBack className="size-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="size-8 rounded-full bg-[#F4F4F5] text-black hover:bg-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 disabled:opacity-40"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="size-3.5 fill-black stroke-black" />
            ) : (
              <Play className="size-3.5 fill-black stroke-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer p-1"
            title="Next"
          >
            <SkipForward className="size-4 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`transition-colors cursor-pointer p-1 ${
              isRepeat ? 'text-[#2DD4BF]' : 'text-[#71717A] hover:text-[#F4F4F5]'
            }`}
            title="Repeat"
          >
            <Repeat className="size-3.5" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#71717A]">
          <span className="w-8 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="relative flex-1 h-1 hover:h-1.5 bg-white/[0.08] rounded-full group cursor-pointer transition-all"
            onMouseEnter={() => setIsScrubHovered(true)}
            onMouseLeave={() => setIsScrubHovered(false)}
          >
            <div
              className="absolute top-0 left-0 h-full bg-white/[0.12] rounded-full pointer-events-none"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full rounded-full pointer-events-none bg-[#2DD4BF]"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-white shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="w-8 text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right: Queue, Lyrics, Equalizer & Volume */}
      <div className="flex items-center justify-end gap-3 w-[28%] min-w-[180px]">
        {/* Lyrics */}
        <button
          onClick={onOpenLyrics}
          className={`p-1.5 transition-colors cursor-pointer rounded ${
            isLyricsActive ? 'text-[#2DD4BF]' : 'text-[#71717A] hover:text-[#F4F4F5]'
          }`}
          title="Lyrics"
        >
          <Mic2 className="size-4" />
        </button>

        {/* Queue */}
        <button
          onClick={onToggleQueue}
          className={`p-1.5 transition-colors cursor-pointer rounded ${
            isQueueActive ? 'text-[#2DD4BF]' : 'text-[#71717A] hover:text-[#F4F4F5]'
          }`}
          title="Queue"
        >
          <ListMusic className="size-4" />
        </button>

        {/* Equalizer */}
        <button
          onClick={onOpenEqualizer}
          className="p-1.5 text-[#71717A] hover:text-[#F4F4F5] transition-colors cursor-pointer"
          title="Equalizer"
        >
          <SlidersHorizontal className="size-3.5" />
        </button>

        {/* Volume */}
        <div
          className="flex items-center gap-2 group w-24"
          onMouseEnter={() => setIsVolumeHovered(true)}
          onMouseLeave={() => setIsVolumeHovered(false)}
        >
          <button
            onClick={handleToggleMute}
            className="text-[#71717A] hover:text-[#F4F4F5] transition-colors cursor-pointer shrink-0"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="size-3.5 text-zinc-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
          </button>

          <div className="relative flex-1 h-1 bg-white/[0.08] hover:h-1.5 transition-all rounded-full cursor-pointer overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2DD4BF]"
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

        {/* Expand / Collapse Now Playing View */}
        <button
          onClick={onExpandNowPlaying}
          className="p-1 text-[#8E96A0] hover:text-white transition-colors cursor-pointer rounded ml-1"
          title={isNowPlayingOpen ? 'Collapse Now Playing' : 'Expand Now Playing'}
        >
          {isNowPlayingOpen ? (
            <ChevronDown className="size-4.5" />
          ) : (
            <ChevronUp className="size-4.5" />
          )}
        </button>
      </div>
    </footer>
  );
};
