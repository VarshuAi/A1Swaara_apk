import React, { useState, useRef, useEffect } from 'react';
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
  Heart,
  ListMusic,
  Mic2,
  MoreHorizontal,
  SlidersHorizontal,
  Headphones,
  Download,
  Maximize2,
  Loader2,
  Disc3,
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
  onOpenArtist,
  isLyricsActive = false,
  isQueueActive = false,
  isSpatialAudio = false,
  onToggleSpatialAudio,
}) => {
  const [isScrubHovered, setIsScrubHovered] = useState(false);
  const [scrubHoverTime, setScrubHoverTime] = useState<number | null>(null);
  const [scrubHoverX, setScrubHoverX] = useState<number>(0);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [previousVolume, setPreviousVolume] = useState<number>(volume);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  // Close More menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      onChangeVolume(0);
    } else {
      onChangeVolume(previousVolume || 0.85);
    }
  };

  const handleScrubMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, pos));
    setScrubHoverTime(clamped * (duration || 1));
    setScrubHoverX(e.clientX - rect.left);
  };

  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const nextVol = Math.max(0, Math.min(1, volume + delta));
    onChangeVolume(nextVol);
  };

  return (
    <footer className="h-18 w-full bg-[#0B0D0F] border-t border-white/[0.06] px-5 flex items-center justify-between select-none z-40 relative font-sans">
      {/* 1. Left: Track Info & Artwork */}
      <div className="flex items-center gap-3 w-[28%] min-w-[180px] max-w-[300px]">
        {currentTrack ? (
          <>
            <div
              onClick={onExpandNowPlaying}
              className="relative size-11 rounded overflow-hidden shrink-0 cursor-pointer bg-[#101214] border border-white/[0.06] group"
              title="Expand Now Playing"
            >
              <img
                src={currentTrack.artwork}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0';
                }}
              />
            </div>

            <div className="truncate flex-1 min-w-0">
              <p
                onClick={onExpandNowPlaying}
                className="font-medium text-xs text-[#F5F5F5] hover:underline cursor-pointer truncate"
              >
                {currentTrack.title}
              </p>
              <p
                onClick={() => onOpenArtist && currentTrack.artist && onOpenArtist(currentTrack.artist)}
                className="text-[11px] text-[#9A9FA3] hover:text-[#F5F5F5] cursor-pointer truncate mt-0.5"
              >
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={onToggleLike}
              className={`p-1.5 transition-colors cursor-pointer shrink-0 ${
                isLiked ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
              }`}
              title={isLiked ? 'Saved to Liked Songs' : 'Save to Liked Songs'}
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-[#10B981]' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-[#9A9FA3]">
            <div className="size-10 rounded bg-[#101214] border border-white/[0.04] flex items-center justify-center">
              <Disc3 className="size-4 text-[#9A9FA3]/50" />
            </div>
            <span>No track playing</span>
          </div>
        )}
      </div>

      {/* 2. Center: Transport Controls & Scrubber */}
      <div className="flex flex-col items-center justify-center w-[44%] max-w-[580px] gap-1.5">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleShuffle}
            className={`transition-colors cursor-pointer p-1 ${
              isShuffle ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
            }`}
            title="Shuffle"
          >
            <Shuffle className="size-3.5" />
          </button>

          <button
            onClick={onPrev}
            className="text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer p-1"
            title="Previous"
          >
            <SkipBack className="size-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="size-8 rounded-full bg-[#F5F5F5] text-black hover:bg-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 disabled:opacity-30"
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
            className="text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer p-1"
            title="Next"
          >
            <SkipForward className="size-4 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`transition-colors cursor-pointer p-1 ${
              isRepeat ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
            }`}
            title="Repeat"
          >
            <Repeat className="size-3.5" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#9A9FA3]">
          <span className="w-8 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="relative flex-1 h-1 hover:h-1.5 bg-white/[0.08] rounded-full group cursor-pointer transition-all"
            onMouseEnter={() => setIsScrubHovered(true)}
            onMouseLeave={() => {
              setIsScrubHovered(false);
              setScrubHoverTime(null);
            }}
            onMouseMove={handleScrubMouseMove}
          >
            {/* Scrubber Hover Time Preview Tooltip */}
            {isScrubHovered && scrubHoverTime !== null && (
              <div
                style={{ left: `${scrubHoverX}px` }}
                className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#101214] border border-white/[0.08] text-[9px] font-mono text-[#F5F5F5] pointer-events-none shadow-lg z-50 whitespace-nowrap"
              >
                {formatTime(scrubHoverTime)}
              </div>
            )}

            <div
              className="absolute top-0 left-0 h-full bg-white/[0.10] rounded-full pointer-events-none"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full rounded-full pointer-events-none bg-[#10B981]"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* 3. Right: Queue, Lyrics, Volume & More */}
      <div className="flex items-center justify-end gap-3 w-[28%] min-w-[180px]">
        {/* Lyrics */}
        <button
          onClick={onOpenLyrics}
          className={`p-1.5 transition-colors cursor-pointer rounded ${
            isLyricsActive ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
          }`}
          title="Lyrics"
        >
          <Mic2 className="size-4" />
        </button>

        {/* Queue */}
        <button
          onClick={onToggleQueue}
          className={`p-1.5 transition-colors cursor-pointer rounded ${
            isQueueActive ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
          }`}
          title="Queue"
        >
          <ListMusic className="size-4" />
        </button>

        {/* Volume with Mouse Wheel Desktop Scrolling */}
        <div
          className="flex items-center gap-2 group w-24 relative"
          onWheel={handleVolumeWheel}
          onMouseEnter={() => setIsVolumeHovered(true)}
          onMouseLeave={() => setIsVolumeHovered(false)}
        >
          {isVolumeHovered && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#101214] border border-white/[0.08] text-[9px] font-mono text-[#F5F5F5] pointer-events-none shadow-lg z-50 whitespace-nowrap">
              {Math.round(volume * 100)}%
            </div>
          )}

          <button
            onClick={handleToggleMute}
            className="text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer p-1 shrink-0"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="size-4" />
            ) : volume < 0.5 ? (
              <Volume1 className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>

          <div className="relative flex-1 h-1 hover:h-1.5 bg-white/[0.08] rounded-full group cursor-pointer transition-all">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-[#9A9FA3] group-hover:bg-[#10B981] transition-colors pointer-events-none"
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

        {/* More Options Popover Menu */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`p-1.5 transition-colors cursor-pointer rounded ${
              isMoreOpen ? 'text-[#F5F5F5] bg-white/[0.06]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
            }`}
            title="More Options"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {isMoreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg bg-[#101214] border border-white/[0.06] shadow-xl py-1 text-xs text-[#F5F5F5] z-50">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenEqualizer();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
              >
                <SlidersHorizontal className="size-3.5 text-[#9A9FA3]" />
                <span>Equalizer (10-Band)</span>
              </button>

              {onToggleSpatialAudio && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onToggleSpatialAudio();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Headphones className="size-3.5 text-[#9A9FA3]" />
                    <span>Spatial Audio</span>
                  </div>
                  {isSpatialAudio && (
                    <span className="text-[10px] font-mono text-[#10B981]">ON</span>
                  )}
                </button>
              )}

              {currentTrack && (
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onDownloadTrack(currentTrack);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                >
                  <Download className="size-3.5 text-[#9A9FA3]" />
                  <span>Download Track</span>
                </button>
              )}

              <div className="border-t border-white/[0.06] my-1" />

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onToggleFullscreen();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
              >
                <Maximize2 className="size-3.5 text-[#9A9FA3]" />
                <span>Fullscreen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
