import React from 'react';
import { X, Trash2, ListMusic, Play, Disc3, Sparkles } from 'lucide-react';
import { Track } from '../types/music';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  onPlayQueueTrack: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrack,
  onPlayQueueTrack,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-11 right-0 w-84 bg-[#0A0A12]/95 border-l border-white/10 backdrop-blur-3xl z-40 p-5 flex flex-col justify-between select-none shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-slideLeft">
      {/* Top Header Deck */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#FF2DAA] to-[#8B35FF] p-[1.5px]">
              <div className="size-full bg-[#0E0E18] rounded-[10px] flex items-center justify-center">
                <ListMusic className="size-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-tight">Up Next Queue</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-[#FF2DAA] font-bold border border-pink-500/30">
                  {queue.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-white/[0.05] transition-all cursor-pointer"
                title="Clear All in Queue"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-transparent border border-pink-500/30 flex items-center gap-3 shadow-lg">
            <div className="relative size-12 rounded-xl overflow-hidden shrink-0 border border-pink-500/40 shadow-md">
              <img src={currentTrack.artwork} alt={currentTrack.title} className="size-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Disc3 className="size-5 text-[#FF2DAA] animate-spin-slow" />
              </div>
            </div>
            <div className="truncate flex-1">
              <span className="text-[9px] font-mono text-[#FF2DAA] font-bold uppercase tracking-wider block">
                Now Playing
              </span>
              <p className="font-bold text-xs text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>
        )}
      </div>

      {/* Up Next List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] pr-1 my-3 scrollbar-thin scrollbar-thumb-white/10">
        {queue.length > 0 ? (
          queue.map((track, i) => (
            <div
              key={track.id + i}
              onClick={() => onPlayQueueTrack(i)}
              className="flex items-center justify-between py-2.5 px-2.5 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 truncate flex-1">
                <span className="text-[10px] font-mono text-zinc-500 w-4 text-center group-hover:hidden">
                  {i + 1}
                </span>
                <Play className="size-3.5 text-[#FF2DAA] fill-[#FF2DAA] hidden group-hover:block shrink-0" />

                <img
                  src={track.artwork}
                  alt={track.title}
                  className="size-9 rounded-lg object-cover bg-zinc-900 shrink-0 border border-white/10"
                />
                <div className="truncate pr-2">
                  <p className="font-semibold text-xs text-white truncate group-hover:text-pink-200">
                    {track.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromQueue(i);
                  }}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 hover:bg-white/10 transition-all cursor-pointer"
                  title="Remove from Queue"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 space-y-2.5 text-center">
            <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <ListMusic className="size-6 text-zinc-600" />
            </div>
            <p className="text-xs font-semibold text-zinc-300">Queue is empty</p>
            <p className="text-[11px] text-zinc-500 max-w-[200px]">
              Tap "+" on any track across Discover or Search to queue it up
            </p>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3 text-[#20CFFF]" />
          <span>NewPipe Auto-Buffer</span>
        </span>
        <span className="text-zinc-600">320K OPUS</span>
      </div>
    </div>
  );
};
