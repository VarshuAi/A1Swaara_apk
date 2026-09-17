import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Heart,
  Share2,
  Download,
  SlidersHorizontal,
  Mic2,
  Activity,
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
  onClose: () => void;
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
  onClose,
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
  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics'>('visualizer');
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(48).fill(8));
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Real-time FFT Frequency Spectrum Loop
  useEffect(() => {
    const dataArray = new Uint8Array(64);

    const updateVisualizer = () => {
      audioEngine.getFrequencyData(dataArray);

      const bars: number[] = [];
      const step = 64 / 48;
      for (let i = 0; i < 48; i++) {
        const index = Math.floor(i * step);
        const value = dataArray[index] || 0;
        const percent = Math.max(8, (value / 255) * 100);
        bars.push(percent);
      }
      setSpectrumBars(bars);

      animFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animFrameRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Auto-scroll active synced lyric line
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, activeTab]);

  const activeLyricIndex = lyrics.synced.findIndex((line, i) => {
    const nextLine = lyrics.synced[i + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  return (
    <div className="relative w-full h-full bg-[#080809] overflow-hidden flex flex-col p-6 sm:p-8 z-30 select-none">
      {/* Subtle Artwork Blur Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        <img src={track.artwork} alt="" className="size-full object-cover blur-[100px] scale-125" />
      </div>

      {/* Top Header Deck */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto mb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-xs font-medium text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
        >
          <ChevronDown className="size-4" />
          <span>Minimize</span>
        </button>

        {/* Tab Capsule */}
        <div className="flex items-center bg-[#121214] p-1 rounded-full border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'visualizer'
                ? 'bg-[#202024] text-white'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Activity className="size-3.5" />
            <span>Now Playing</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'lyrics'
                ? 'bg-[#202024] text-white'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Mic2 className="size-3.5" />
            <span>Lyrics</span>
          </button>
        </div>

        {/* Action Dock */}
        <div className="flex items-center gap-2">
          {/* Spatial 3D Audio */}
          {onToggleSpatialAudio && (
            <button
              onClick={onToggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
                isSpatialAudio
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#141416] text-[#8E8E93] border-white/[0.08] hover:text-white'
              }`}
              title="Spatial 3D Audio"
            >
              <Headphones className="size-3.5" />
              <span>3D Audio</span>
            </button>
          )}

          {/* Playback Speed */}
          {onChangeSpeed && (
            <button
              onClick={() => {
                const nextRate = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 0.8 : 1.0;
                onChangeSpeed(nextRate);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-xs font-mono font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Playback Speed"
            >
              <Gauge className="size-3.5 text-[#10B981]" />
              <span>{playbackSpeed}x</span>
            </button>
          )}

          {/* Sleep Timer */}
          {onSelectSleepTimer && (
            <button
              onClick={() => {
                const options: SleepTimerOption[] = [null, 15, 30, 45, 60, 'track_end'];
                const currIdx = options.indexOf(sleepTimerOption);
                const nextOpt = options[(currIdx + 1) % options.length];
                onSelectSleepTimer(nextOpt);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
                sleepTimerOption
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#141416] text-[#8E8E93] border-white/[0.08] hover:text-white'
              }`}
              title="Sleep Timer"
            >
              <Moon className="size-3.5" />
              <span>{sleepTimerOption ? (sleepTimerOption === 'track_end' ? 'END' : `${sleepTimerOption}m`) : 'Timer'}</span>
            </button>
          )}

          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            title="Equalizer"
          >
            <SlidersHorizontal className="size-4" />
          </button>
          <button
            onClick={onOpenStoryCreator}
            className="p-2 rounded-xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            title="Share"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Experience */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full overflow-hidden">
        {activeTab === 'visualizer' ? (
          <div className="flex flex-col items-center justify-center text-center w-full">
            {/* Artwork Card */}
            <div className="relative size-64 sm:size-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#141416] my-3">
              <img
                src={track.artwork}
                alt={track.title}
                className="size-full object-cover"
              />
            </div>

            {/* Song Metadata */}
            <div className="mt-2 max-w-xl px-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                {track.title}
              </h1>
              <p className="text-base text-[#8E8E93] font-medium mt-1 truncate">
                {track.artist}
              </p>
            </div>

            {/* Clean Real-time Spectrum Visualizer */}
            <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-md my-6 px-4">
              {spectrumBars.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-[#10B981] transition-all duration-75"
                  style={{
                    height: `${height}%`,
                    opacity: isPlaying ? 0.75 : 0.2,
                  }}
                />
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isLiked
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : 'bg-[#141416] text-[#8E8E93] border-white/[0.08] hover:text-white'
                }`}
              >
                <Heart className={`size-4 ${isLiked ? 'fill-[#10B981]' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141416] text-[#8E8E93] border border-white/[0.08] hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="size-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ) : (
          /* Apple-Style Clean Synced Lyrics View */
          <div className="w-full max-w-2xl h-[460px] overflow-y-auto px-6 py-8 text-center space-y-7 scroll-smooth scrollbar-thin">
            {lyrics.synced.length > 0 ? (
              lyrics.synced.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <p
                    key={idx}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => onSeek(line.time)}
                    className={`cursor-pointer transition-all duration-200 text-xl sm:text-2xl font-bold leading-relaxed ${
                      isActive
                        ? 'text-white scale-102'
                        : 'text-[#52525B] hover:text-[#A1A1AA]'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : lyrics.text ? (
              <div className="text-[#8E8E93] whitespace-pre-line text-base font-normal leading-loose">
                {lyrics.text}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#71717A] space-y-3">
                <Mic2 className="size-8 text-[#3F3F46]" />
                <p className="text-sm font-medium text-[#8E8E93]">No lyrics available for this song</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
