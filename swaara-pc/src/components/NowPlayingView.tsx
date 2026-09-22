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
  ListMusic,
  Mic2,
  Info as InfoIcon,
  Download,
  SlidersHorizontal,
  Headphones,
  Gauge,
  X,
  Loader2,
  Copy,
  Check,
  FileText,
  Sparkles,
  Moon,
} from 'lucide-react';
import { Track, SyncedLyricLine, SleepTimerOption } from '../types/music';

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
  onOpenStoryCreator?: () => void;
  lyrics: {
    text: string;
    synced: SyncedLyricLine[];
    isSynced?: boolean;
    provider?: string;
    isLoading?: boolean;
  };
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
  lyrics,
  onSeek,
  isSpatialAudio = false,
  onToggleSpatialAudio,
  playbackSpeed = 1.0,
  onChangeSpeed,
  sleepTimerOption,
  onSelectSleepTimer,
}) => {
  const [rightTab, setRightTab] = useState<'lyrics' | 'queue' | 'info'>('lyrics');
  const [lyricsViewMode, setLyricsViewMode] = useState<'karaoke' | 'full'>('karaoke');
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [isScrubHovered, setIsScrubHovered] = useState(false);
  const [scrubHoverTime, setScrubHoverTime] = useState<number | null>(null);
  const [scrubHoverX, setScrubHoverX] = useState<number>(0);

  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const duration = propDuration || track.duration || 240;

  // Listen for Escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeLyricIndex = lyrics.synced.findIndex((line, i) => {
    const nextLine = lyrics.synced[i + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  // Auto-scroll active synced lyric line
  useEffect(() => {
    if (rightTab === 'lyrics' && lyricsViewMode === 'karaoke' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex, rightTab, lyricsViewMode]);

  const handleCopyLyrics = () => {
    const textToCopy = lyrics.text || lyrics.synced.map((s) => s.text).join('\n');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  const handleScrubMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, pos));
    setScrubHoverTime(clamped * (duration || 1));
    setScrubHoverX(e.clientX - rect.left);
  };

  return (
    <div className="relative w-full h-full bg-[#070809] overflow-hidden flex flex-col z-30 select-none font-sans">
      {/* 1. Subtle Blurred Background Atmosphere (Restrained & Dark) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={track.artwork}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] object-cover blur-[140px] opacity-[0.06] pointer-events-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-[#070809]/92" />
      </div>

      {/* 2. Top Minimal Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-8 py-3 border-b border-white/[0.06] shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer"
          title="Back (Esc)"
        >
          <ChevronLeft className="size-4" />
          <span>Back</span>
        </button>

        <span className="text-[11px] font-medium text-[#9A9FA3]">
          Now Playing
        </span>

        <div className="w-12" />
      </header>

      {/* 3. Cinematic 3-Column Layout */}
      <div className="relative z-10 flex-1 overflow-hidden p-6 sm:p-8 max-w-7xl mx-auto w-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full h-full max-h-[640px]">
          
          {/* ======================================================== */}
          {/* COLUMN 1: Large Album Artwork (lg:col-span-4)            */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="size-60 sm:size-72 md:size-80 rounded-lg overflow-hidden shadow-2xl bg-[#101214] border border-white/[0.06]">
              <img
                src={track.artwork}
                alt={track.title}
                referrerPolicy="no-referrer"
                className="size-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0';
                }}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUMN 2: Song Info, Progress & Controls (lg:col-span-4) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-6">
            {/* Title & Metadata */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] tracking-tight line-clamp-2">
                {track.title}
              </h1>
              <p
                onClick={() => onOpenArtist && onOpenArtist(track.artist)}
                className="text-sm text-[#9A9FA3] hover:text-[#F5F5F5] cursor-pointer transition-colors truncate"
              >
                {track.artist}
              </p>
              {track.album && (
                <p className="text-xs text-[#9A9FA3]/60 truncate">
                  {track.album}
                </p>
              )}
            </div>

            {/* Timeline Progress Scrubber */}
            <div className="space-y-1.5">
              <div
                className="relative flex items-center group cursor-pointer h-3"
                onMouseEnter={() => setIsScrubHovered(true)}
                onMouseLeave={() => {
                  setIsScrubHovered(false);
                  setScrubHoverTime(null);
                }}
                onMouseMove={handleScrubMouseMove}
              >
                {/* Scrubber Hover Preview Tooltip */}
                {isScrubHovered && scrubHoverTime !== null && (
                  <div
                    style={{ left: `${scrubHoverX}px` }}
                    className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#101214] border border-white/[0.08] text-[9px] font-mono text-[#F5F5F5] pointer-events-none shadow-lg z-50 whitespace-nowrap"
                  >
                    {formatTime(scrubHoverTime)}
                  </div>
                )}

                <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-white/[0.12] rounded-full transition-all"
                    style={{ width: `${Math.min(100, buffered)}%` }}
                  />
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-[#9A9FA3]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-5">
              <button
                onClick={onToggleShuffle}
                className={`transition-colors cursor-pointer p-1.5 ${
                  isShuffle ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                }`}
                title="Shuffle"
              >
                <Shuffle className="size-4" />
              </button>

              <button
                onClick={onPrev}
                className="text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer p-1.5"
                title="Previous"
              >
                <SkipBack className="size-5 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="size-12 rounded-full bg-[#F5F5F5] text-black hover:bg-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-lg"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause className="size-5 fill-black stroke-black" />
                ) : (
                  <Play className="size-5 fill-black stroke-black ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer p-1.5"
                title="Next"
              >
                <SkipForward className="size-5 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`transition-colors cursor-pointer p-1.5 ${
                  isRepeat ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                }`}
                title="Repeat"
              >
                <Repeat className="size-4" />
              </button>
            </div>

            {/* Secondary Actions Row */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/[0.04]">
              <button
                onClick={onToggleLike}
                className={`p-2 rounded hover:bg-white/[0.04] transition-colors cursor-pointer ${
                  isLiked ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                }`}
                title={isLiked ? 'Liked' : 'Like'}
              >
                <Heart className={`size-4 ${isLiked ? 'fill-[#10B981]' : ''}`} />
              </button>

              <button
                onClick={onDownload}
                className="p-2 rounded hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                title="Download"
              >
                <Download className="size-4" />
              </button>

              <button
                onClick={onOpenEqualizer}
                className="p-2 rounded hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                title="Equalizer"
              >
                <SlidersHorizontal className="size-4" />
              </button>

              {onToggleSpatialAudio && (
                <button
                  onClick={onToggleSpatialAudio}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSpatialAudio
                      ? 'text-[#10B981] bg-[#101214]'
                      : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                  }`}
                  title="Spatial Audio"
                >
                  <Headphones className="size-3.5" />
                  <span>3D</span>
                </button>
              )}

              {onChangeSpeed && (
                <button
                  onClick={() => {
                    const next = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1.0;
                    onChangeSpeed(next);
                  }}
                  className="px-2 py-1 rounded text-xs text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer font-mono"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
              )}

              {onSelectSleepTimer && (
                <button
                  onClick={() => {
                    const cycle: SleepTimerOption[] = [null, 15, 30, 45, 60, 'track_end'];
                    const currentIdx = cycle.indexOf(sleepTimerOption ?? null);
                    const next = cycle[(currentIdx + 1) % cycle.length];
                    onSelectSleepTimer(next);
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                    sleepTimerOption
                      ? 'text-[#10B981] bg-[#101214]'
                      : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                  }`}
                  title={
                    sleepTimerOption === 'track_end'
                      ? 'Sleep Timer: End of Track'
                      : sleepTimerOption
                      ? `Sleep Timer: ${sleepTimerOption}m`
                      : 'Sleep Timer: Off'
                  }
                >
                  <Moon className="size-3.5" />
                  <span>
                    {sleepTimerOption === 'track_end'
                      ? 'End'
                      : sleepTimerOption
                      ? `${sleepTimerOption}m`
                      : 'Timer'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUMN 3: Queue / Lyrics / Info Tabs (lg:col-span-4)     */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex flex-col h-[480px] sm:h-[520px] bg-[#0B0D0F] border border-white/[0.06] rounded-xl p-4 overflow-hidden">
            {/* Header Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRightTab('lyrics')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    rightTab === 'lyrics'
                      ? 'text-[#F5F5F5] bg-[#101214]'
                      : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                  }`}
                >
                  Lyrics
                </button>

                <button
                  onClick={() => setRightTab('queue')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    rightTab === 'queue'
                      ? 'text-[#F5F5F5] bg-[#101214]'
                      : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                  }`}
                >
                  Queue {queue.length > 0 && `(${queue.length})`}
                </button>

                <button
                  onClick={() => setRightTab('info')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    rightTab === 'info'
                      ? 'text-[#F5F5F5] bg-[#101214]'
                      : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                  }`}
                >
                  Info
                </button>
              </div>

              {/* Action Buttons for Tab */}
              {rightTab === 'lyrics' && (lyrics.text || lyrics.synced.length > 0) && (
                <div className="flex items-center gap-1">
                  {lyrics.synced.length > 0 && lyrics.text && (
                    <button
                      onClick={() => setLyricsViewMode(lyricsViewMode === 'karaoke' ? 'full' : 'karaoke')}
                      className="p-1 rounded hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer text-[11px]"
                      title={lyricsViewMode === 'karaoke' ? 'Full Text' : 'Karaoke'}
                    >
                      {lyricsViewMode === 'karaoke' ? <FileText className="size-3.5" /> : <Sparkles className="size-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={handleCopyLyrics}
                    className="p-1 rounded hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                    title="Copy Lyrics"
                  >
                    {copiedLyrics ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              )}

              {rightTab === 'queue' && queue.length > 0 && onClearQueue && (
                <button
                  onClick={onClearQueue}
                  className="text-xs text-[#9A9FA3] hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto pt-3 scrollbar-thin">
              {/* LYRICS TAB */}
              {rightTab === 'lyrics' && (
                <div className="h-full">
                  {lyrics.isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#9A9FA3] space-y-2 py-12">
                      <Loader2 className="size-4 animate-spin text-[#10B981]" />
                      <span className="text-xs">Finding lyrics...</span>
                    </div>
                  ) : lyricsViewMode === 'karaoke' && lyrics.synced.length > 0 ? (
                    <div className="space-y-4 text-center py-4">
                      {lyrics.synced.map((line, idx) => {
                        const isActive = idx === activeLyricIndex;
                        return (
                          <p
                            key={idx}
                            ref={isActive ? activeLyricRef : null}
                            onClick={() => onSeek(line.time)}
                            className={`cursor-pointer transition-colors duration-150 text-xs sm:text-sm font-medium leading-relaxed px-2 rounded ${
                              isActive
                                ? 'text-[#F5F5F5] font-semibold text-sm sm:text-base'
                                : 'text-[#9A9FA3]/60 hover:text-[#9A9FA3]'
                            }`}
                          >
                            {line.text}
                          </p>
                        );
                      })}
                    </div>
                  ) : lyrics.text ? (
                    <div className="text-xs leading-relaxed text-[#F5F5F5]/90 whitespace-pre-line p-2 font-normal">
                      {lyrics.text}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#9A9FA3] space-y-2 py-16">
                      <Mic2 className="size-5 text-[#9A9FA3]/40" />
                      <p className="text-xs">No lyrics found for this track</p>
                    </div>
                  )}
                </div>
              )}

              {/* QUEUE TAB */}
              {rightTab === 'queue' && (
                <div className="space-y-1">
                  {queue.length > 0 ? (
                    queue.map((qTrack, idx) => (
                      <div
                        key={`${qTrack.id}-${idx}`}
                        onClick={() =>
                          onPlayQueueTrack ? onPlayQueueTrack(idx) : onPlayTrack && onPlayTrack(qTrack)
                        }
                        className="p-2 rounded hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-2.5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                          <span className="text-xs font-mono text-[#9A9FA3]/60 w-4 text-center group-hover:hidden shrink-0">
                            {idx + 1}
                          </span>
                          <Play className="size-3 text-[#10B981] fill-[#10B981] hidden group-hover:block shrink-0 ml-0.5 mr-0.5" />

                          <div className="size-8 rounded overflow-hidden shrink-0 bg-[#101214]">
                            <img src={qTrack.artwork} alt={qTrack.title} className="size-full object-cover" />
                          </div>
                          <div className="truncate pr-1">
                            <p className="text-xs font-medium text-[#F5F5F5] truncate">
                              {qTrack.title}
                            </p>
                            <p className="text-[11px] text-[#9A9FA3] truncate">
                              {qTrack.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-[#9A9FA3]">
                            {formatTime(qTrack.duration || 210)}
                          </span>
                          {onRemoveFromQueue && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromQueue(idx);
                              }}
                              className="text-[#9A9FA3] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-[#9A9FA3] space-y-1">
                      <ListMusic className="size-5 mx-auto text-[#9A9FA3]/40 mb-2" />
                      <p className="text-xs">Queue is empty</p>
                    </div>
                  )}
                </div>
              )}

              {/* INFO TAB */}
              {rightTab === 'info' && (
                <div className="p-2 space-y-3 text-xs text-[#9A9FA3]">
                  <div className="space-y-1 pb-3 border-b border-white/[0.06]">
                    <p className="text-[#F5F5F5] font-semibold text-sm">{track.title}</p>
                    <p className="text-[#9A9FA3]">{track.artist}</p>
                    {track.album && <p className="text-[#9A9FA3]/60 text-[11px]">{track.album}</p>}
                  </div>

                  <div className="space-y-2 pt-1 text-[11px]">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span>Source</span>
                      <span className="text-[#F5F5F5] font-medium capitalize">{track.source || 'Swaara'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span>Duration</span>
                      <span className="font-mono text-[#F5F5F5]">{formatTime(duration)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span>Audio Processing</span>
                      <span className="text-[#F5F5F5]">10-Band Biquad EQ</span>
                    </div>
                    {lyrics.provider && (
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span>Lyrics Source</span>
                        <span className="text-[#F5F5F5]">{lyrics.provider}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
