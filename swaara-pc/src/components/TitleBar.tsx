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
    <header className="h-12 w-full bg-[#000000] border-b border-[#181818] flex items-center justify-between px-4 select-none drag-region z-50 text-xs text-[#B3B3B3]">
      {/* Left: Window History Navigation Buttons & Brand */}
      <div className="flex items-center gap-3 no-drag">
        {/* Navigation History Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateBack || (() => window.history.back())}
            disabled={canGoBack === false}
            className={`size-8 rounded-full bg-[#090909] text-[#B3B3B3] flex items-center justify-center transition-colors cursor-pointer ${
              canGoBack === false ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1a1a1a] hover:text-white'
            }`}
            title="Go back"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={onNavigateForward || (() => window.history.forward())}
            disabled={canGoForward === false}
            className={`size-8 rounded-full bg-[#090909] text-[#B3B3B3] flex items-center justify-center transition-colors cursor-pointer ${
              canGoForward === false ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1a1a1a] hover:text-white'
            }`}
            title="Go forward"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Engine Status Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#B3B3B3] font-mono text-[11px] font-semibold border border-white/[0.08] transition-colors">
          <span className="size-2 rounded-full bg-[#1ED760] animate-pulse shadow-[0_0_8px_#1ED760]" />
          <span className="text-white font-medium">Swaara Studio</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1ED760]/15 text-[#1ED760] font-bold">320K LOSSLESS</span>
        </div>
      </div>

      {/* Center: Spotify-Style Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4 flex items-center justify-center no-drag">
        <button
          onClick={onOpenSearch}
          className="w-full max-w-sm h-9 px-3 rounded-full bg-[#242424] hover:bg-[#2a2a2a] hover:ring-1 hover:ring-white/20 flex items-center justify-between text-[#B3B3B3] hover:text-white transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="size-4 text-[#B3B3B3] group-hover:text-white transition-colors shrink-0" />
            <span className="text-xs font-medium truncate">
              {currentTrack ? (
                <span>
                  Playing: <strong className="text-white font-semibold">{currentTrack.title}</strong>
                </span>
              ) : (
                'What do you want to play?'
              )}
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#121212] border border-white/10 font-mono text-[10px] text-[#A7A7A7]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Audio Quality Badge, Mini Player, Profile & Window Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Pro Account Badge */}
        <div className="hidden lg:flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-transform cursor-pointer">
          <ShieldCheck className="size-3.5" />
          <span>PRO DESKTOP</span>
        </div>

        {/* Mini Player Toggle */}
        <button
          onClick={onToggleMiniPlayer}
          title={isMiniPlayer ? 'Exit Mini Player' : 'Picture-in-Picture Mini Player'}
          className="size-8 rounded-full hover:bg-white/10 hover:text-white flex items-center justify-center text-[#B3B3B3] transition-colors cursor-pointer"
        >
          <Minimize2 className="size-4" />
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
