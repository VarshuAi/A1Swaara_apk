import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Maximize2,
  X,
  Disc3,
  Loader2,
  Sparkles,
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

  return (
    <div className="w-full h-full bg-[#08080E] border border-white/20 rounded-2xl flex flex-col justify-between p-3.5 select-none overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-36 h-20 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Drag Header */}
      <div className="flex items-center justify-between drag-region text-zinc-400 pb-1 relative z-10">
        <div className="flex items-center gap-2 no-drag">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono font-extrabold text-white tracking-wider uppercase">
            Swaara Mini
          </span>
          <span className="text-[9px] font-mono px-1 rounded bg-white/[0.08] text-zinc-400">
            320K
          </span>
        </div>

        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={onRestore}
            className="p-1 rounded-lg hover:bg-white/[0.1] hover:text-white transition-all cursor-pointer"
            title="Expand Full App"
          >
            <Maximize2 className="size-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
            title="Close"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* Center Track Card */}
      {track ? (
        <div className="flex items-center gap-3 py-1 relative z-10">
          <div className="relative size-14 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/15 bg-zinc-900">
            <img src={track.artwork} alt={track.title} className="size-full object-cover" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <Disc3 className="size-5 text-[#FF2DAA] animate-spin-slow" />
              </div>
            )}
          </div>

          <div className="truncate flex-1">
            <h4 className="font-bold text-xs text-white truncate">{track.title}</h4>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={onToggleLike}
                className={`p-0.5 rounded cursor-pointer transition-colors ${
                  isLiked ? 'text-[#FF2DAA]' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Heart className={`size-3.5 ${isLiked ? 'fill-[#FF2DAA]' : ''}`} />
              </button>
              <span className="text-[9px] font-mono text-zinc-500">NewPipe Audio</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-2 text-center text-xs text-zinc-500">No song selected</div>
      )}

      {/* Scrub Bar */}
      <div className="space-y-1 relative z-10">
        <div className="relative h-1 bg-white/10 rounded-full cursor-pointer overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF2DAA] to-[#20CFFF] rounded-full pointer-events-none"
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

        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-center gap-5 pt-1 relative z-10">
        <button
          onClick={onPrev}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <SkipBack className="size-4 fill-current" />
        </button>

        <button
          onClick={onTogglePlay}
          className="size-9 rounded-full bg-gradient-to-tr from-[#FF2DAA] to-[#8B35FF] text-white flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <SkipForward className="size-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
