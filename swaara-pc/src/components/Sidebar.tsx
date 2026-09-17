import React, { useState } from 'react';
import {
  Home,
  Search,
  Library,
  Heart,
  FolderDown,
  History,
  SlidersHorizontal,
  Share2,
  Plus,
  ArrowRight,
  Disc3,
  Music2,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../types/music';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenEqualizer: () => void;
  onOpenStoryCreator: () => void;
  likedCount: number;
  downloadCount: number;
  onOpenNowPlaying: () => void;
  hasTrack: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenEqualizer,
  onOpenStoryCreator,
  likedCount,
  downloadCount,
  onOpenNowPlaying,
  hasTrack,
}) => {
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'playlists' | 'downloads' | 'local'>('all');

  return (
    <aside className="w-64 md:w-72 h-full flex flex-col gap-2.5 p-2.5 bg-[#050508] select-none shrink-0 font-sans">
      {/* Top Block: Primary App Navigation with Frosted Glass Panel */}
      <div className="bg-[#0D0D18]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 space-y-4 shadow-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] flex items-center justify-center text-black font-black text-sm shadow-[0_0_16px_rgba(0,245,155,0.4)]">
              <Music2 className="size-4.5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                Swaara
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#00F59B]/15 text-[#00F59B] border border-[#00F59B]/30 tracking-wider">
                STUDIO
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <button
            onClick={() => onSelectTab('discover')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'text-white bg-white/[0.08] border border-white/10 shadow-[0_0_20px_rgba(0,245,155,0.1)]'
                : 'text-[#9A9AA8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home className={`size-4.5 ${activeTab === 'discover' ? 'text-[#00F59B]' : ''}`} />
            <span>Home Stage</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'text-white bg-white/[0.08] border border-white/10 shadow-[0_0_20px_rgba(0,245,155,0.1)]'
                : 'text-[#9A9AA8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Search className={`size-4.5 ${activeTab === 'search' ? 'text-[#00F59B]' : ''}`} />
            <span>Explore Catalog</span>
          </button>

          <button
            onClick={() => onSelectTab('local')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'text-white bg-white/[0.08] border border-white/10 shadow-[0_0_20px_rgba(32,207,255,0.15)]'
                : 'text-[#9A9AA8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <HardDrive className={`size-4.5 ${activeTab === 'local' ? 'text-[#20CFFF]' : ''}`} />
            <div className="flex items-center justify-between flex-1">
              <span>PC Local Studio</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70">
                OFFLINE
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Main Block: Your Library (Obsidian Glass Card) */}
      <div className="bg-[#0D0D18]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl flex-1 flex flex-col p-3.5 overflow-hidden shadow-xl">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 pb-3">
          <button
            onClick={() => onSelectTab('library')}
            className="flex items-center gap-2.5 text-[#B3B3C2] hover:text-white transition-colors cursor-pointer font-bold text-sm"
          >
            <Library className="size-4.5 text-[#00F59B]" />
            <span>Studio Vault</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 px-1 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setLibraryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              libraryFilter === 'all'
                ? 'bg-white text-black font-bold shadow-md'
                : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setLibraryFilter('playlists')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              libraryFilter === 'playlists'
                ? 'bg-white text-black font-bold shadow-md'
                : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1]'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setLibraryFilter('downloads')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              libraryFilter === 'downloads'
                ? 'bg-white text-black font-bold shadow-md'
                : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1]'
            }`}
          >
            Downloaded
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-none">
          {/* Liked Songs Entry */}
          {(libraryFilter === 'all' || libraryFilter === 'playlists') && (
            <div
              onClick={() => onSelectTab('liked')}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group ${
                activeTab === 'liked' ? 'bg-white/[0.08] border border-white/10' : ''
              }`}
            >
              <div className="size-11 rounded-xl bg-gradient-to-br from-[#8B35FF] to-[#FF2DAA] flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                <Heart className="size-5 text-white fill-white" />
              </div>
              <div className="truncate">
                <p className={`text-sm font-semibold truncate ${
                  activeTab === 'liked' ? 'text-[#00F59B]' : 'text-white'
                }`}>
                  Liked Songs
                </p>
                <p className="text-xs text-[#9A9AA8] flex items-center gap-1.5 truncate mt-0.5">
                  <span className="text-[#00F59B]">●</span>
                  <span>Playlist</span>
                  <span>•</span>
                  <span>{likedCount} tracks</span>
                </p>
              </div>
            </div>
          )}

          {/* Downloaded Offline Songs Entry */}
          {(libraryFilter === 'all' || libraryFilter === 'downloads') && (
            <div
              onClick={() => onSelectTab('downloads')}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group ${
                activeTab === 'downloads' ? 'bg-white/[0.08] border border-white/10' : ''
              }`}
            >
              <div className="size-11 rounded-xl bg-gradient-to-br from-[#00F59B]/20 to-[#20CFFF]/20 border border-[#00F59B]/30 text-[#00F59B] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                <FolderDown className="size-5" />
              </div>
              <div className="truncate">
                <p className={`text-sm font-semibold truncate ${
                  activeTab === 'downloads' ? 'text-[#00F59B]' : 'text-white'
                }`}>
                  Downloaded 320K
                </p>
                <p className="text-xs text-[#9A9AA8] flex items-center gap-1.5 truncate mt-0.5">
                  <span>Offline Ready</span>
                  <span>•</span>
                  <span>{downloadCount} tracks</span>
                </p>
              </div>
            </div>
          )}

          {/* PC Local Studio Audio Entry */}
          <div
            onClick={() => onSelectTab('local')}
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group ${
              activeTab === 'local' ? 'bg-white/[0.08] border border-white/10' : ''
            }`}
          >
            <div className="size-11 rounded-xl bg-[#161626] border border-white/10 text-[#20CFFF] flex items-center justify-center shrink-0 shadow-md">
              <HardDrive className="size-5" />
            </div>
            <div className="truncate">
              <p className={`text-sm font-semibold truncate ${
                activeTab === 'local' ? 'text-[#20CFFF]' : 'text-white'
              }`}>
                PC Local Studio
              </p>
              <p className="text-xs text-[#9A9AA8] truncate mt-0.5">
                Local disk audio & lossless
              </p>
            </div>
          </div>

          {/* Listening History */}
          {libraryFilter === 'all' && (
            <div
              onClick={() => onSelectTab('library')}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group ${
                activeTab === 'library' ? 'bg-white/[0.08] border border-white/10' : ''
              }`}
            >
              <div className="size-11 rounded-xl bg-white/[0.04] text-[#9A9AA8] flex items-center justify-center shrink-0 border border-white/5">
                <History className="size-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">
                  Recent Sessions
                </p>
                <p className="text-xs text-[#9A9AA8] truncate mt-0.5">
                  Listening timeline
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Studio Tools Dock */}
        <div className="pt-3 mt-2 border-t border-white/[0.08] space-y-1.5">
          <button
            onClick={onOpenEqualizer}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#B3B3C2] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer border border-transparent hover:border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="size-4 text-[#00F59B]" />
              <span>BOOM BASS Studio EQ</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F59B]/10 text-[#00F59B] border border-[#00F59B]/20 font-bold">
              10-BAND
            </span>
          </button>

          <button
            onClick={onOpenStoryCreator}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#B3B3C2] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer border border-transparent hover:border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="size-4 text-[#FF2DAA]" />
              <span>Studio Story Card</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF2DAA]/10 text-[#FF2DAA] border border-[#FF2DAA]/20 font-bold">
              9:16 HD
            </span>
          </button>

          {hasTrack && (
            <button
              onClick={onOpenNowPlaying}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#00F59B]/20 to-[#8B35FF]/20 hover:from-[#00F59B]/30 hover:to-[#8B35FF]/30 border border-[#00F59B]/30 shadow-[0_0_20px_rgba(0,245,155,0.15)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Disc3 className="size-4 text-[#00F59B] animate-spin-slow" />
                <span>Now Playing Stage</span>
              </div>
              <ArrowRight className="size-3.5 text-[#00F59B]" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
