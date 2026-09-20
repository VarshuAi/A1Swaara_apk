import React, { useState, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Minimize2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Track } from '../types/music';

interface TitleBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onToggleMiniPlayer: () => void;
  isMiniPlayer?: boolean;
  onOpenSearch?: () => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onToggleMiniPlayer,
  isMiniPlayer = false,
  onOpenSearch,
  onNavigateBack,
  onNavigateForward,
  canGoBack,
  canGoForward,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = !!window.electronAPI?.isElectron;

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized);
      window.electronAPI.onWindowStateChanged((data) => {
        setIsMaximized(data.isMaximized);
      });
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <header className="h-10 w-full bg-[#070809] border-b border-white/[0.06] flex items-center justify-between px-3 select-none drag-region z-50 text-xs text-[#9A9FA3]">
      {/* Left: History Navigation */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={onNavigateBack || (() => window.history.back())}
          disabled={canGoBack === false}
          className={`size-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            canGoBack === false
              ? 'opacity-25 cursor-not-allowed'
              : 'hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5]'
          }`}
          title="Back"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={onNavigateForward || (() => window.history.forward())}
          disabled={canGoForward === false}
          className={`size-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            canGoForward === false
              ? 'opacity-25 cursor-not-allowed'
              : 'hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5]'
          }`}
          title="Forward"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-sm mx-4 flex items-center justify-center no-drag">
        <button
          onClick={onOpenSearch}
          className="w-full h-7 px-3 rounded-md bg-[#0B0D0F] hover:bg-[#101214] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="size-3.5 text-[#9A9FA3] shrink-0" />
            <span className="text-xs text-[#9A9FA3] group-hover:text-[#F5F5F5] truncate font-normal">
              Search songs, artists, albums...
            </span>
          </div>
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.04] font-mono text-[9px] text-[#9A9FA3]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-0.5 no-drag">
        {/* Mini Player */}
        <button
          onClick={onToggleMiniPlayer}
          title={isMiniPlayer ? 'Exit Mini Player' : 'Mini Player'}
          className="size-7 rounded hover:bg-white/[0.04] hover:text-[#F5F5F5] flex items-center justify-center text-[#9A9FA3] transition-colors cursor-pointer"
        >
          <Minimize2 className="size-3.5" />
        </button>

        {isElectron && (
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={handleMinimize}
              className="size-7 rounded hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5] flex items-center justify-center transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="size-7 rounded hover:bg-white/[0.04] text-[#9A9FA3] hover:text-[#F5F5F5] flex items-center justify-center transition-colors cursor-pointer"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Copy className="size-3" /> : <Square className="size-3" />}
            </button>
            <button
              onClick={handleClose}
              className="size-7 rounded hover:bg-[#E81123] text-[#9A9FA3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
