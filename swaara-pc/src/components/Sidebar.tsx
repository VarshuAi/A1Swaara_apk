import React from 'react';
import {
  Home,
  Compass,
  Library,
  Heart,
  ListMusic,
  FolderDown,
  HardDrive,
  SlidersHorizontal,
  Settings,
  Music,
} from 'lucide-react';
import { ActiveTab } from '../types/music';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenEqualizer: () => void;
  onOpenStoryCreator?: () => void;
  likedCount: number;
  downloadCount: number;
  onOpenNowPlaying?: () => void;
  hasTrack?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenEqualizer,
  likedCount,
  downloadCount,
}) => {
  return (
    <aside className="w-56 h-full flex flex-col justify-between py-5 px-3 bg-[#070809] select-none shrink-0 font-sans border-r border-white/[0.06]">
      {/* Top: Logo & Main Navigation */}
      <div className="space-y-5">
        {/* Swaara Logo */}
        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="size-6 rounded-md bg-[#101214] border border-white/[0.08] flex items-center justify-center">
            <Music className="size-3.5 text-[#10B981]" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#F5F5F5]">
            Swaara
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-0.5">
          <button
            onClick={() => onSelectTab('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'discover'
                ? 'text-[#F5F5F5] bg-[#101214]'
                : 'text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
            }`}
          >
            <Home className={`size-4 ${activeTab === 'discover' ? 'text-[#10B981]' : 'text-[#9A9FA3]'}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'text-[#F5F5F5] bg-[#101214]'
                : 'text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
            }`}
          >
            <Compass className={`size-4 ${activeTab === 'search' ? 'text-[#10B981]' : 'text-[#9A9FA3]'}`} />
            <span>Explore</span>
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'text-[#F5F5F5] bg-[#101214]'
                : 'text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
            }`}
          >
            <Library className={`size-4 ${activeTab === 'library' ? 'text-[#10B981]' : 'text-[#9A9FA3]'}`} />
            <span>Library</span>
          </button>
        </nav>

        {/* Separator */}
        <div className="border-t border-white/[0.06] my-3 mx-2" />

        {/* Secondary: Collection */}
        <nav className="space-y-0.5">
          <button
            onClick={() => onSelectTab('liked')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'liked'
                ? 'text-[#F5F5F5] bg-[#101214]'
                : 'text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className={`size-4 ${activeTab === 'liked' ? 'text-[#10B981] fill-[#10B981]' : 'text-[#9A9FA3]'}`} />
              <span>Liked Songs</span>
            </div>
            {likedCount > 0 && (
              <span className="text-[10px] font-mono text-[#9A9FA3]/70">
                {likedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ListMusic className="size-4 text-[#9A9FA3]" />
              <span>Playlists</span>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('downloads')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'downloads'
                ? 'text-[#F5F5F5] bg-[#101214]'
                : 'text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderDown className={`size-4 ${activeTab === 'downloads' ? 'text-[#10B981]' : 'text-[#9A9FA3]'}`} />
              <span>Downloads</span>
            </div>
            {downloadCount > 0 && (
              <span className="text-[10px] font-mono text-[#9A9FA3]/70">
                {downloadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('local')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'local'
                ? 'text-[#F5F5F5] bg-[#101214]'
                : 'text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
            }`}
          >
            <HardDrive className={`size-4 ${activeTab === 'local' ? 'text-[#10B981]' : 'text-[#9A9FA3]'}`} />
            <span>Local Files</span>
          </button>
        </nav>
      </div>

      {/* Bottom: Utilities */}
      <div className="space-y-0.5 pt-3 border-t border-white/[0.06]">
        <button
          onClick={onOpenEqualizer}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="size-4 text-[#9A9FA3]" />
          <span>Equalizer</span>
        </button>

        <button
          onClick={onOpenEqualizer}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#9A9FA3] hover:text-[#F5F5F5] hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <Settings className="size-4 text-[#9A9FA3]" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
