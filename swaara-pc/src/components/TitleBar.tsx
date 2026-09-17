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
    <header className="h-12 w-full bg-[#050508]/95 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between px-4 select-none drag-region z-50 text-xs text-[#9A9AA8]">
      {/* Left: Window History Navigation Buttons & Brand */}
      <div className="flex items-center gap-3 no-drag">
        {/* Navigation History Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateBack || (() => window.history.back())}
            disabled={canGoBack === false}
            className={`size-7.5 rounded-full bg-white/[0.04] text-[#9A9AA8] flex items-center justify-center transition-colors cursor-pointer border border-white/5 ${
              canGoBack === false ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.1] hover:text-white'
            }`}
            title="Go back"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={onNavigateForward || (() => window.history.forward())}
            disabled={canGoForward === false}
            className={`size-7.5 rounded-full bg-white/[0.04] text-[#9A9AA8] flex items-center justify-center transition-colors cursor-pointer border border-white/5 ${
              canGoForward === false ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.1] hover:text-white'
            }`}
            title="Go forward"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Engine Status Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#B3B3C2] font-mono text-[11px] font-semibold border border-white/[0.08] transition-colors shadow-sm">
          <span className="size-2 rounded-full bg-[#00F59B] animate-pulse shadow-[0_0_8px_#00F59B]" />
          <span className="text-white font-medium">Swaara Lossless</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#00F59B]/15 text-[#00F59B] font-extrabold border border-[#00F59B]/30">320K MASTER</span>
        </div>
      </div>

      {/* Center: Spotify-Style Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4 flex items-center justify-center no-drag">
        <button
          onClick={onOpenSearch}
          className="w-full max-w-sm h-8.5 px-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 flex items-center justify-between text-[#9A9AA8] hover:text-white transition-all cursor-pointer group shadow-inner"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="size-3.5 text-[#9A9AA8] group-hover:text-white transition-colors shrink-0" />
            <span className="text-xs font-medium truncate">
              {currentTrack ? (
                <span>
                  Playing: <strong className="text-white font-semibold">{currentTrack.title}</strong>
                </span>
              ) : (
                'Search catalog, artists, or local files...'
              )}
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[9px] text-[#888899]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Audio Quality Badge, Mini Player, Profile & Window Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Pro Account Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#00F59B] to-[#20CFFF] text-black font-extrabold text-[11px] shadow-[0_0_12px_rgba(0,245,155,0.3)] hover:scale-105 transition-transform cursor-pointer">
          <ShieldCheck className="size-3.5 stroke-[2.5]" />
          <span>PRO STUDIO</span>
        </div>

        {/* Mini Player Toggle */}
        <button
          onClick={onToggleMiniPlayer}
          title={isMiniPlayer ? 'Exit Mini Player' : 'Picture-in-Picture Mini Player'}
          className="size-7.5 rounded-full hover:bg-white/10 hover:text-white flex items-center justify-center text-[#9A9AA8] transition-colors cursor-pointer"
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
