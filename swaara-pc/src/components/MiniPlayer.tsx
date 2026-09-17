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
  const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isElectron);

  return (
    <div className={`w-full h-full select-none font-sans ${isElectron ? '' : 'fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/85 backdrop-blur-2xl p-6'}`}>
      {/* Floating Glassmorphic Mini Capsule */}
      <div className="w-full max-w-sm h-56 bg-[#0D0D18]/95 border border-white/15 rounded-3xl flex flex-col justify-between p-4 relative shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-10 -right-10 size-40 bg-[#FF2DAA]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 size-40 bg-[#00F59B]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Drag Header */}
        <div className="flex items-center justify-between drag-region text-zinc-400 pb-1 relative z-10">
          <div className="flex items-center gap-2 no-drag">
            <div className="size-2 rounded-full bg-[#00F59B] animate-pulse shadow-[0_0_8px_#00F59B]" />
            <span className="text-[10px] font-mono font-extrabold text-white tracking-widest uppercase">
              Swaara Mini
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-[#00F59B] border border-[#00F59B]/20 font-bold">
              320K MASTER
            </span>
          </div>

          <div className="flex items-center gap-1.5 no-drag">
            <button
              onClick={onRestore}
              className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
              title="Expand Studio"
            >
              <Maximize2 className="size-3 text-[#00F59B]" />
              <span>Full Studio</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-all cursor-pointer"
              title="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Center Track Card */}
        {track ? (
          <div className="flex items-center gap-3.5 py-1 relative z-10">
            <div className="relative size-14 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/15 bg-zinc-900">
              <img src={track.artwork} alt={track.title} className="size-full object-cover" />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Disc3 className="size-6 text-[#00F59B] animate-spin-slow" />
                </div>
              )}
            </div>

            <div className="truncate flex-1">
              <h4 className="font-bold text-xs text-white truncate drop-shadow-sm">{track.title}</h4>
              <p className="text-[11px] text-[#9A9AA8] truncate mt-0.5 font-medium">{track.artist}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={onToggleLike}
                  className={`p-0.5 rounded cursor-pointer transition-colors ${
                    isLiked ? 'text-[#FF2DAA]' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Heart className={`size-3.5 ${isLiked ? 'fill-[#FF2DAA]' : ''}`} />
                </button>
                <span className="text-[9px] font-mono text-[#00F59B] font-semibold tracking-wider">
                  STUDIO LOSSLESS
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-zinc-500 font-medium">No track currently active</div>
        )}

        {/* Scrub Bar */}
        <div className="space-y-1 relative z-10">
          <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00F59B] via-[#1ED760] to-[#20CFFF] rounded-full pointer-events-none shadow-[0_0_8px_rgba(0,245,155,0.6)]"
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

          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 px-0.5 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Actions */}
        <div className="flex items-center justify-center gap-6 pt-1 relative z-10">
          <button
            onClick={onPrev}
            className="text-[#9A9AA8] hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <SkipBack className="size-4.5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="size-10 rounded-full bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,245,155,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="size-4.5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-4.5 fill-black stroke-black" />
            ) : (
              <Play className="size-4.5 fill-black stroke-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-[#9A9AA8] hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <SkipForward className="size-4.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
