import React, { useEffect, useRef } from 'react';
import {
  Play,
  ListPlus,
  Heart,
  Download,
  User,
  Copy,
  Radio,
} from 'lucide-react';
import { Track } from '../types/music';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: ContextMenuPosition;
  track: Track;
  isLiked?: boolean;
  onClose: () => void;
  onPlayNow: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onDownload: (track: Track) => void;
  onOpenArtist?: (artist: string) => void;
  onStartRadio?: (track: Track) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  track,
  isLiked = false,
  onClose,
  onPlayNow,
  onPlayNext,
  onAddToQueue,
  onToggleLike,
  onDownload,
  onOpenArtist,
  onStartRadio,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Viewport Boundary Clamping
  const menuWidth = 220;
  const menuHeight = 310;
  const left = Math.min(position.x, window.innerWidth - menuWidth - 12);
  const top = Math.min(position.y, window.innerHeight - menuHeight - 12);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanId = `SW-${track.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    navigator.clipboard?.writeText(cleanId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[999] pointer-events-auto"
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={menuRef}
        style={{ left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` }}
        className="absolute w-[220px] bg-[#0E1318]/95 backdrop-blur-2xl border border-white/[0.1] rounded-xl shadow-2xl p-1.5 text-xs text-[#CCCCCC] select-none font-sans animate-scaleIn origin-top-left divide-y divide-white/[0.05]"
      >
        {/* Track Snapshot Header */}
        <div className="flex items-center gap-2.5 p-2 mb-1">
          <img
            src={track.artwork}
            alt={track.title}
            className="size-8 rounded-md object-cover shrink-0 border border-white/[0.08]"
          />
          <div className="truncate flex-1">
            <p className="font-semibold text-white truncate text-[11px] leading-tight">
              {track.title}
            </p>
            <p className="text-[10px] text-[#8E8E93] truncate mt-0.5">
              {track.artist}
            </p>
          </div>
        </div>

        {/* Action Group 1: Playback */}
        <div className="py-1">
          <button
            onClick={() => {
              onPlayNow(track);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#10B981] hover:text-black transition-colors cursor-pointer text-left font-medium"
          >
            <Play className="size-3.5 fill-current" />
            <span>Play Now</span>
          </button>

          <button
            onClick={() => {
              onPlayNext(track);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
          >
            <ListPlus className="size-3.5 text-[#10B981]" />
            <span>Play Next</span>
          </button>

          <button
            onClick={() => {
              onAddToQueue(track);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
          >
            <ListPlus className="size-3.5 text-zinc-400" />
            <span>Add to Queue</span>
          </button>

          {onStartRadio && (
            <button
              onClick={() => {
                onStartRadio(track);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
            >
              <Radio className="size-3.5 text-[#10B981]" />
              <span>Start Song Radio</span>
            </button>
          )}
        </div>

        {/* Action Group 2: Library & Downloads */}
        <div className="py-1">
          <button
            onClick={() => {
              onToggleLike(track);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
          >
            <Heart
              className={`size-3.5 ${
                isLiked ? 'text-[#10B981] fill-[#10B981]' : 'text-zinc-400'
              }`}
            />
            <span>{isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}</span>
          </button>

          <button
            onClick={() => {
              onDownload(track);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
          >
            <Download className="size-3.5 text-[#10B981]" />
            <span>Download Lossless (320k)</span>
          </button>
        </div>

        {/* Action Group 3: Artist & Copy */}
        <div className="pt-1">
          {onOpenArtist && track.artist && (
            <button
              onClick={() => {
                onOpenArtist(track.artist);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
            >
              <User className="size-3.5 text-zinc-400" />
              <span>Go to Artist</span>
            </button>
          )}

          <button
            onClick={handleCopyId}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left font-mono text-[11px]"
          >
            <Copy className="size-3.5 text-zinc-400" />
            <span>Copy Track ID</span>
          </button>
        </div>
      </div>
    </div>
  );
};
