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
    <aside className="w-56 h-full flex flex-col justify-between py-5 px-3 bg-[#070B0E] select-none shrink-0 font-sans border-r border-white/[0.05]">
      {/* Top: Brand & Main Navigation */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3">
          <div className="size-6 text-[#2DD4BF] flex items-center justify-center">
            <Music2 className="size-5 text-[#2DD4BF] filter drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            Swaara
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => onSelectTab('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'text-white bg-[#0F1D20] border border-[#19403B] shadow-sm'
                : 'text-[#8E96A0] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Home className={`size-4.5 ${activeTab === 'discover' ? 'text-[#2DD4BF]' : 'text-[#8E96A0]'}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'text-white bg-[#0F1D20] border border-[#19403B]'
                : 'text-[#8E96A0] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Compass className={`size-4.5 ${activeTab === 'search' ? 'text-[#2DD4BF]' : 'text-[#8E96A0]'}`} />
            <span>Explore</span>
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'text-white bg-[#0F1D20] border border-[#19403B]'
                : 'text-[#8E96A0] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Library className={`size-4.5 ${activeTab === 'library' ? 'text-[#2DD4BF]' : 'text-[#8E96A0]'}`} />
            <span>Library</span>
          </button>
        </nav>

        {/* Collections Section */}
        <div className="space-y-1 pt-2">
          <span className="px-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
            COLLECTION
          </span>

          <button
            onClick={() => onSelectTab('liked')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'liked'
                ? 'text-white bg-[#0F1D20] border border-[#19403B]'
                : 'text-[#8E96A0] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className={`size-4.5 ${activeTab === 'liked' ? 'text-[#2DD4BF] fill-[#2DD4BF]' : 'text-[#8E96A0]'}`} />
              <span>Liked Songs</span>
            </div>
            {likedCount > 0 && (
              <span className="text-[10px] font-mono text-[#64748B]">
                {likedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#8E96A0] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FolderDown className="size-4.5 text-[#8E96A0]" />
              <span>Playlists</span>
            </div>
            <span className="text-[10px] font-mono text-[#8E96A0]">
              1
            </span>
          </button>

          <button
            onClick={() => onSelectTab('downloads')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'downloads'
                ? 'text-white bg-[#0F1D20] border border-[#19403B]'
                : 'text-[#8E96A0] hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className={`size-4.5 ${activeTab === 'downloads' ? 'text-[#2DD4BF]' : 'text-[#8E96A0]'}`} />
              <span>Downloads</span>
            </div>
            {downloadCount > 0 && (
              <span className="text-[10px] font-mono text-[#64748B]">
                {downloadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Tools */}
      <div className="space-y-1 pt-3 border-t border-white/[0.04]">
        <button
          onClick={onOpenEqualizer}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#8E96A0] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="size-4.5 text-[#8E96A0]" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
