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
  Check,
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
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'playlists' | 'downloads'>('all');

  return (
    <aside className="w-64 md:w-72 h-full flex flex-col gap-2 p-2 bg-[#000000] select-none shrink-0 font-sans">
      {/* Top Block: Primary App Navigation */}
      <div className="bg-[#121212] rounded-lg p-4 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center gap-2 px-1">
          <div className="size-8 rounded-full bg-[#1ED760] flex items-center justify-center text-black font-black text-sm shadow-md">
            <Music2 className="size-4.5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white font-sans">
              Swaara
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#242424] text-[#B3B3B3] uppercase tracking-wider">
              Pro
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <button
            onClick={() => onSelectTab('discover')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'text-white bg-[#242424]'
                : 'text-[#B3B3B3] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home className={`size-5 ${activeTab === 'discover' ? 'text-[#1ED760]' : ''}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'text-white bg-[#242424]'
                : 'text-[#B3B3B3] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Search className={`size-5 ${activeTab === 'search' ? 'text-[#1ED760]' : ''}`} />
            <span>Search</span>
          </button>
        </nav>
      </div>

      {/* Main Block: Your Library (Spotify Desktop Spec) */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col p-3 overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 pb-3">
          <button
            onClick={() => onSelectTab('library')}
            className="flex items-center gap-3 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer font-bold text-sm"
          >
            <Library className="size-5" />
            <span>Your Library</span>
          </button>

          <div className="flex items-center gap-1 text-[#B3B3B3]">
            <button
              onClick={() => onSelectTab('liked')}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Create playlist or add music"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 px-1 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setLibraryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              libraryFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setLibraryFilter('playlists')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              libraryFilter === 'playlists'
                ? 'bg-white text-black'
                : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setLibraryFilter('downloads')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              libraryFilter === 'downloads'
                ? 'bg-white text-black'
                : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Downloaded
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {/* Liked Songs Entry */}
          {(libraryFilter === 'all' || libraryFilter === 'playlists') && (
            <div
              onClick={() => onSelectTab('liked')}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#242424] transition-colors cursor-pointer group ${
                activeTab === 'liked' ? 'bg-[#242424]' : ''
              }`}
            >
              <div className="size-12 rounded bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0 shadow-md">
                <Heart className="size-5 text-white fill-white" />
              </div>
              <div className="truncate">
                <p className={`text-sm font-semibold truncate ${
                  activeTab === 'liked' ? 'text-[#1ED760]' : 'text-white'
                }`}>
                  Liked Songs
                </p>
                <p className="text-xs text-[#B3B3B3] flex items-center gap-1 truncate mt-0.5">
                  <span className="text-[#1ED760]">●</span>
                  <span>Playlist</span>
                  <span>•</span>
                  <span>{likedCount} songs</span>
                </p>
              </div>
            </div>
          )}

          {/* Downloaded Offline Songs Entry */}
          {(libraryFilter === 'all' || libraryFilter === 'downloads') && (
            <div
              onClick={() => onSelectTab('downloads')}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#242424] transition-colors cursor-pointer group ${
                activeTab === 'downloads' ? 'bg-[#242424]' : ''
              }`}
            >
              <div className="size-12 rounded bg-[#004638] text-[#1ED760] flex items-center justify-center shrink-0 shadow-md">
                <FolderDown className="size-5" />
              </div>
              <div className="truncate">
                <p className={`text-sm font-semibold truncate ${
                  activeTab === 'downloads' ? 'text-[#1ED760]' : 'text-white'
                }`}>
                  Downloaded 320K
                </p>
                <p className="text-xs text-[#B3B3B3] flex items-center gap-1 truncate mt-0.5">
                  <span>Offline Ready</span>
                  <span>•</span>
                  <span>{downloadCount} tracks</span>
                </p>
              </div>
            </div>
          )}

          {/* Listening History */}
          {libraryFilter === 'all' && (
            <div
              onClick={() => onSelectTab('library')}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#242424] transition-colors cursor-pointer group ${
                activeTab === 'library' ? 'bg-[#242424]' : ''
              }`}
            >
              <div className="size-12 rounded bg-[#282828] text-[#B3B3B3] flex items-center justify-center shrink-0">
                <History className="size-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">
                  Listening History
                </p>
                <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                  Recent NewPipe streams
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Studio Tools Dock */}
        <div className="pt-3 mt-2 border-t border-white/[0.08] space-y-1">
          <button
            onClick={onOpenEqualizer}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-[#B3B3B3] hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="size-4 text-[#1ED760]" />
              <span>Studio Equalizer</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-white">
              10-BAND
            </span>
          </button>

          <button
            onClick={onOpenStoryCreator}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-[#B3B3B3] hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="size-4 text-[#1ED760]" />
              <span>Story & Note Creator</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-white">
              9:16
            </span>
          </button>

          {hasTrack && (
            <button
              onClick={onOpenNowPlaying}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-[#1ED760] hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Disc3 className="size-4 animate-spin-slow" />
                <span>Now Playing Stage</span>
              </div>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
