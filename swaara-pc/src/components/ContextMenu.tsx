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
        className="absolute w-[200px] bg-[#101214] border border-white/[0.06] rounded-lg shadow-2xl p-1 text-xs text-[#F5F5F5] select-none font-sans animate-scaleIn origin-top-left divide-y divide-white/[0.04]"
      >
        {/* Track Snapshot Header */}
        <div className="flex items-center gap-2 p-1.5 mb-0.5">
          <img
            src={track.artwork}
            alt={track.title}
            className="size-7 rounded object-cover shrink-0 bg-[#0B0D0F]"
          />
          <div className="truncate flex-1">
            <p className="font-medium text-[#F5F5F5] truncate text-[11px] leading-tight">
              {track.title}
            </p>
            <p className="text-[10px] text-[#9A9FA3] truncate mt-0.5">
              {track.artist}
            </p>
          </div>
        </div>

        {/* Action Group 1: Playback */}
        <div className="py-0.5">
          <button
            onClick={() => {
              onPlayNow(track);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer text-left text-[#F5F5F5]"
          >
            <Play className="size-3.5 fill-current text-[#10B981]" />
            <span>Play Now</span>
          </button>

          <button
            onClick={() => {
              onPlayNext(track);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer text-left text-[#9A9FA3] hover:text-[#F5F5F5]"
          >
            <ListPlus className="size-3.5" />
            <span>Play Next</span>
          </button>

          <button
            onClick={() => {
              onAddToQueue(track);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer text-left text-[#9A9FA3] hover:text-[#F5F5F5]"
          >
            <ListPlus className="size-3.5" />
            <span>Add to Queue</span>
          </button>

          {onStartRadio && (
            <button
              onClick={() => {
                onStartRadio(track);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer text-left text-[#9A9FA3] hover:text-[#F5F5F5]"
            >
              <Radio className="size-3.5" />
              <span>Start Radio</span>
            </button>
          )}
        </div>

        {/* Action Group 2: Library & Downloads */}
        <div className="py-0.5">
          <button
            onClick={() => {
              onToggleLike(track);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer text-left text-[#9A9FA3] hover:text-[#F5F5F5]"
          >
            <Heart
              className={`size-3.5 ${
                isLiked ? 'text-[#10B981] fill-[#10B981]' : ''
              }`}
            />
            <span>{isLiked ? 'Remove Like' : 'Save to Liked'}</span>
          </button>

          <button
            onClick={() => {
              onDownload(track);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors cursor-pointer text-left text-[#9A9FA3] hover:text-[#F5F5F5]"
          >
            <Download className="size-3.5" />
            <span>Download</span>
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
