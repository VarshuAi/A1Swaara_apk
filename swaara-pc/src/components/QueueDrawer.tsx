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
    <div className="fixed inset-y-11 right-0 w-80 bg-[#0D0D10] border-l border-white/[0.08] z-40 p-4 flex flex-col justify-between select-none shadow-2xl animate-slideLeft">
      {/* Top Header Deck */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-[#18181B] border border-white/[0.08] flex items-center justify-center text-[#10B981]">
              <ListMusic className="size-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white tracking-tight">Queue</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181B] text-[#8E8E93] font-medium border border-white/[0.06]">
                {queue.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-red-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Clear Queue"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="p-2.5 rounded-xl bg-[#141416] border border-white/[0.06] flex items-center gap-3">
            <div className="relative size-10 rounded-lg overflow-hidden shrink-0 bg-[#18181B] border border-white/[0.06]">
              <img src={currentTrack.artwork} alt={currentTrack.title} className="size-full object-cover" />
            </div>
            <div className="truncate flex-1">
              <span className="text-[9px] text-[#10B981] font-semibold uppercase tracking-wider block">
                Now Playing
              </span>
              <p className="font-semibold text-xs text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>
        )}
      </div>

      {/* Up Next List */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent pr-1 my-3 space-y-0.5 scrollbar-thin">
        {queue.length > 0 ? (
          queue.map((track, i) => (
            <div
              key={track.id + i}
              onClick={() => onPlayQueueTrack(i)}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                <span className="text-[10px] font-mono text-[#71717A] w-4 text-center group-hover:hidden shrink-0">
                  {i + 1}
                </span>
                <Play className="size-3 text-[#10B981] fill-[#10B981] hidden group-hover:block shrink-0" />

                <img
                  src={track.artwork}
                  alt={track.title}
                  className="size-8 rounded-md object-cover bg-[#18181B] shrink-0 border border-white/[0.06]"
                />
                <div className="truncate pr-2">
                  <p className="font-medium text-xs text-[#F4F4F5] truncate group-hover:text-[#10B981] transition-colors">
                    {track.title}
                  </p>
                  <p className="text-[10px] text-[#8E8E93] truncate mt-0.5">
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
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-[#8E8E93] space-y-2 text-center">
            <div className="size-10 rounded-xl bg-[#141416] border border-white/[0.06] flex items-center justify-center text-[#71717A]">
              <ListMusic className="size-5" />
            </div>
            <p className="text-xs font-semibold text-white">Queue is empty</p>
            <p className="text-[11px] text-[#71717A] max-w-[180px]">
              Click "+" on any track to add it to the queue
            </p>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#10B981]" />
          <span>Autoplay next songs</span>
        </span>
      </div>
    </div>
  );
};
