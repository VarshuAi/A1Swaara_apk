import React from 'react';
import {
  Home,
  Compass,
  Library,
  Heart,
  FolderDown,
  HardDrive,
  SlidersHorizontal,
  Music2,
  Disc3,
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
  likedCount,
  downloadCount,
  onOpenNowPlaying,
  hasTrack,
}) => {
  return (
    <aside className="w-56 h-full flex flex-col justify-between py-5 px-3 bg-[#080809] select-none shrink-0 font-sans border-r border-white/[0.05]">
      {/* Top: Brand & Main Navigation */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3">
          <div className="size-7 rounded-lg bg-white/[0.08] flex items-center justify-center text-white">
            <Music2 className="size-4 text-emerald-400" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#F4F4F5]">
            Swaara
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-0.5">
          <button
            onClick={() => onSelectTab('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'discover'
                ? 'text-[#F4F4F5] bg-white/[0.08]'
                : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03]'
            }`}
          >
            <Home className={`size-4 ${activeTab === 'discover' ? 'text-emerald-400' : ''}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'text-[#F4F4F5] bg-white/[0.08]'
                : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03]'
            }`}
          >
            <Compass className={`size-4 ${activeTab === 'search' ? 'text-emerald-400' : ''}`} />
            <span>Explore</span>
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'text-[#F4F4F5] bg-white/[0.08]'
                : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03]'
            }`}
          >
            <Library className={`size-4 ${activeTab === 'library' ? 'text-emerald-400' : ''}`} />
            <span>Library</span>
          </button>
        </nav>

        {/* Collections Section */}
        <div className="space-y-1 pt-3 border-t border-white/[0.04]">
          <span className="px-3 text-[10px] font-semibold text-[#52525B] uppercase tracking-wider block mb-1">
            Collection
          </span>

          <button
            onClick={() => onSelectTab('liked')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'liked'
                ? 'text-[#F4F4F5] bg-white/[0.08]'
                : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className={`size-4 ${activeTab === 'liked' ? 'text-emerald-400 fill-emerald-400' : ''}`} />
              <span>Liked Songs</span>
            </div>
            {likedCount > 0 && (
              <span className="text-[10px] font-mono text-[#52525B]">
                {likedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('downloads')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'downloads'
                ? 'text-[#F4F4F5] bg-white/[0.08]'
                : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderDown className={`size-4 ${activeTab === 'downloads' ? 'text-emerald-400' : ''}`} />
              <span>Downloads</span>
            </div>
            {downloadCount > 0 && (
              <span className="text-[10px] font-mono text-[#52525B]">
                {downloadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('local')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'local'
                ? 'text-[#F4F4F5] bg-white/[0.08]'
                : 'text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03]'
            }`}
          >
            <HardDrive className={`size-4 ${activeTab === 'local' ? 'text-emerald-400' : ''}`} />
            <span>Local Files</span>
          </button>
        </div>
      </div>

      {/* Bottom Tools */}
      <div className="space-y-1 pt-3 border-t border-white/[0.04]">
        <button
          onClick={onOpenEqualizer}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#8E8E93] hover:text-[#F4F4F5] hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="size-4" />
          <span>Equalizer</span>
        </button>

        {hasTrack && (
          <button
            onClick={onOpenNowPlaying}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/[0.06] transition-colors cursor-pointer"
          >
            <Disc3 className="size-4" />
            <span>Now Playing</span>
          </button>
        )}
      </div>
    </aside>
  );
};
