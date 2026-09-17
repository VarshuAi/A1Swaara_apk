import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Maximize2,
  X,
  Loader2,
} from 'lucide-react';
import { Track } from '../types/music';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isLiked: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleLike: () => void;
  onSeek: (time: number) => void;
  onRestore: () => void;
  onClose: () => void;
}

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  isLiked,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleLike,
  onSeek,
  onRestore,
  onClose,
}) => {
  const seekPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isElectron);

  return (
    <div className={`w-full h-full select-none font-sans ${isElectron ? '' : 'fixed inset-0 z-50 flex items-center justify-center bg-[#080809]/80 backdrop-blur-md p-6'}`}>
      {/* Mini Player Capsule */}
      <div className="w-full max-w-xs h-52 bg-[#0D0D10] border border-white/[0.08] rounded-2xl flex flex-col justify-between p-4 relative shadow-2xl overflow-hidden">
        {/* Top Drag Header */}
        <div className="flex items-center justify-between drag-region text-[#8E8E93] pb-1 relative z-10">
          <div className="flex items-center gap-2 no-drag">
            <div className="size-2 rounded-full bg-[#10B981]" />
            <span className="text-[11px] font-semibold text-white tracking-wide">
              Swaara Mini
            </span>
          </div>

          <div className="flex items-center gap-1.5 no-drag">
            <button
              onClick={onRestore}
              className="px-2 py-1 rounded-lg bg-[#18181B] hover:bg-[#202024] text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium border border-white/[0.06]"
              title="Expand"
            >
              <Maximize2 className="size-3 text-[#10B981]" />
              <span>Expand</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/[0.04] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Center Track Card */}
        {track ? (
          <div className="flex items-center gap-3 py-1 relative z-10">
            <div className="relative size-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/[0.06] bg-[#18181B]">
              <img src={track.artwork} alt={track.title} className="size-full object-cover" />
            </div>

            <div className="truncate flex-1">
              <h4 className="font-semibold text-xs text-white truncate">{track.title}</h4>
              <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">{track.artist}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={onToggleLike}
                  className={`p-0.5 rounded cursor-pointer transition-colors ${
                    isLiked ? 'text-[#10B981]' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Heart className={`size-3.5 ${isLiked ? 'fill-[#10B981]' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[#71717A] font-medium">No track currently active</div>
        )}

        {/* Scrub Bar */}
        <div className="space-y-1 relative z-10">
          <div className="relative h-1 bg-white/[0.08] rounded-full cursor-pointer overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full pointer-events-none"
              style={{ width: `${seekPercent}%` }}
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

          <div className="flex items-center justify-between text-[9px] font-mono text-[#71717A] px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Actions */}
        <div className="flex items-center justify-center gap-5 pt-1 relative z-10">
          <button
            onClick={onPrev}
            className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <SkipBack className="size-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="size-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-md"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-4 fill-black stroke-black" />
            ) : (
              <Play className="size-4 fill-black stroke-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <SkipForward className="size-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
