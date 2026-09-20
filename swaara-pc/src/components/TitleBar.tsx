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
  Sparkles,
  ShieldCheck,
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
  currentTrack,
  isPlaying,
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
    <header className="h-11 w-full bg-[#070B0E] border-b border-white/[0.05] flex items-center justify-between px-4 select-none drag-region z-50 text-xs text-[#8E8E93]">
      {/* Left: Window History Navigation Buttons */}
      <div className="flex items-center gap-2 no-drag">
        <button
          onClick={onNavigateBack || (() => window.history.back())}
          disabled={canGoBack === false}
          className={`size-7 rounded-md bg-white/[0.04] flex items-center justify-center transition-colors cursor-pointer ${
            canGoBack === false ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.08] hover:text-[#F4F4F5]'
          }`}
          title="Go back"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={onNavigateForward || (() => window.history.forward())}
          disabled={canGoForward === false}
          className={`size-7 rounded-md bg-white/[0.04] flex items-center justify-center transition-colors cursor-pointer ${
            canGoForward === false ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.08] hover:text-[#F4F4F5]'
          }`}
          title="Go forward"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Center: Clean Search Trigger */}
      <div className="flex-1 max-w-sm mx-4 flex items-center justify-center no-drag">
        <button
          onClick={onOpenSearch}
          className="w-full h-8 px-3.5 rounded-full bg-[#0E141B] hover:bg-[#131B24] border border-white/[0.08] flex items-center justify-between text-[#8E96A0] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="size-3.5 text-[#8E96A0] group-hover:text-[#2DD4BF] shrink-0 transition-colors" />
            <span className="text-xs text-[#8E96A0] group-hover:text-white truncate font-medium">
              Search songs, artists, albums...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[9px] text-[#8E96A0]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Window Controls & Mini Player */}
      <div className="flex items-center gap-1 no-drag">
        {/* Lossless DSP Engine Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#10B981] font-mono text-[10px] font-bold mr-1 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
          <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>320K HI-FI</span>
        </div>

        {/* Mini Player Toggle */}
        <button
          onClick={onToggleMiniPlayer}
          title={isMiniPlayer ? 'Exit Mini Player' : 'Mini Player'}
          className="size-7 rounded-md hover:bg-white/[0.08] hover:text-[#F4F4F5] flex items-center justify-center text-[#8E8E93] transition-colors cursor-pointer"
        >
          <Minimize2 className="size-3.5" />
        </button>

        {/* Electron Window Management Buttons */}
        {isElectron ? (
          <div className="flex items-center gap-0.5 ml-2">
            <button
              onClick={handleMinimize}
              className="size-8 rounded hover:bg-white/10 text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="size-8 rounded hover:bg-white/10 text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isMaximized ? <Copy className="size-3" /> : <Square className="size-3" />}
            </button>
            <button
              onClick={handleClose}
              className="size-8 rounded hover:bg-[#E81123] text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] text-[#B3B3B3] text-[10px] font-mono">
            <span>WEB</span>
          </div>
        )}
      </div>
    </header>
  );
};
