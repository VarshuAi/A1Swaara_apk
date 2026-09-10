import React, { useState, useMemo } from 'react';
import {
  Heart,
  History,
  FolderDown,
  Play,
  Shuffle,
  FolderOpen,
  Music,
  Search,
  Clock,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Track } from '../types/music';

interface LibraryViewProps {
  likedSongs: Track[];
  historySongs: Track[];
  downloadedSongs: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle: boolean) => void;
  onToggleLike: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  initialSubTab?: 'liked' | 'history' | 'downloads';
}

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs)) return '3:45';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  likedSongs,
  historySongs,
  downloadedSongs,
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onDownloadTrack,
  initialSubTab = 'liked',
}) => {
  const [activeTab, setActiveTab] = useState<'liked' | 'history' | 'downloads'>(initialSubTab);
  const [searchFilter, setSearchFilter] = useState('');

  const rawList = useMemo(() => {
    switch (activeTab) {
      case 'liked':
        return likedSongs;
      case 'history':
        return historySongs;
      case 'downloads':
        return downloadedSongs;
      default:
        return [];
    }
  }, [activeTab, likedSongs, historySongs, downloadedSongs]);

  const currentList = useMemo(() => {
    if (!searchFilter.trim()) return rawList;
    const q = searchFilter.toLowerCase();
    return rawList.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [rawList, searchFilter]);

  const handleOpenFolder = () => {
    if (window.electronAPI?.openDownloadsFolder) {
      window.electronAPI.openDownloadsFolder();
    }
  };

  const getHeaderGradient = () => {
    switch (activeTab) {
      case 'liked':
        return 'from-[#450af5]/60 via-[#121212]/90 to-[#121212]';
      case 'downloads':
        return 'from-[#004638]/70 via-[#121212]/90 to-[#121212]';
      case 'history':
        return 'from-[#333333]/70 via-[#121212]/90 to-[#121212]';
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#121212] select-none font-sans scrollbar-thin">
      {/* 1. Spotify Hero Header with Gradient Spill */}
      <div className={`p-8 bg-gradient-to-b ${getHeaderGradient()} flex flex-col md:flex-row items-end gap-6`}>
        {/* Cover Art Box */}
        <div className="size-48 rounded shadow-2xl shrink-0 flex items-center justify-center">
          {activeTab === 'liked' && (
            <div className="size-full rounded bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shadow-2xl">
              <Heart className="size-20 text-white fill-white shadow" />
            </div>
          )}
          {activeTab === 'downloads' && (
            <div className="size-full rounded bg-[#004638] text-[#1ED760] flex items-center justify-center shadow-2xl">
              <FolderDown className="size-20" />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="size-full rounded bg-[#282828] text-[#B3B3B3] flex items-center justify-center shadow-2xl">
              <History className="size-20" />
            </div>
          )}
        </div>

        {/* Text Metadata */}
        <div className="space-y-2 truncate flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Playlist
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            {activeTab === 'liked' && 'Liked Songs'}
            {activeTab === 'downloads' && 'Downloaded 320K'}
            {activeTab === 'history' && 'Listening History'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-[#B3B3B3] font-medium pt-1">
            <span className="font-bold text-white">Swaara Audio Engine</span>
            <span>•</span>
            <span className="text-white font-semibold">{rawList.length} songs</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Play Hero Button & Actions */}
          <div className="flex items-center gap-5">
            {rawList.length > 0 && (
              <>
                <button
                  onClick={() => onPlayAll(rawList, false)}
                  className="size-14 rounded-full bg-[#1ED760] text-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title="Play"
                >
                  <Play className="size-6 fill-black ml-0.5" />
                </button>

                <button
                  onClick={() => onPlayAll(rawList, true)}
                  className="text-[#B3B3B3] hover:text-white transition-colors cursor-pointer"
                  title="Shuffle"
                >
                  <Shuffle className="size-6" />
                </button>
              </>
            )}

            {activeTab === 'downloads' && (
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-xs font-bold text-white hover:border-white hover:scale-105 transition-all cursor-pointer"
              >
                <FolderOpen className="size-4 text-[#1ED760]" />
                <span>Open Folder</span>
              </button>
            )}
          </div>

          {/* Right: Search Filter Input */}
          {rawList.length > 0 && (
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#B3B3B3]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search in playlist"
                className="w-full h-9 pl-9 pr-3 rounded-full bg-[#242424] text-xs text-white placeholder-[#757575] focus:outline-none focus:ring-1 focus:ring-white transition-all"
              />
            </div>
          )}
        </div>

        {/* 3. Spotify Track Table */}
        {currentList.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-2 border-b border-white/[0.08] text-xs font-medium text-[#A7A7A7] uppercase tracking-wider">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6">Title</span>
              <span className="col-span-3">Status</span>
              <span className="col-span-2 text-right pr-4 flex items-center justify-end gap-1">
                <Clock className="size-3.5" />
              </span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-transparent mt-1">
              {currentList.map((track, i) => (
                <div
                  key={track.id + i}
                  onClick={() => onPlayTrack(track)}
                  className="grid grid-cols-12 items-center px-4 py-2.5 rounded-md hover:bg-white/[0.07] transition-colors cursor-pointer group"
                >
                  <div className="col-span-1 text-center text-xs font-mono text-[#B3B3B3]">
                    <span className="group-hover:hidden">{i + 1}</span>
                    <Play className="size-3.5 text-white fill-white mx-auto hidden group-hover:block" />
                  </div>

                  <div className="col-span-6 flex items-center gap-3 truncate pr-3">
                    <img src={track.artwork} alt={track.title} className="size-10 rounded object-cover shrink-0 bg-[#242424]" />
                    <div className="truncate">
                      <p className="font-semibold text-sm text-white group-hover:underline truncate">
                        {track.title}
                      </p>
                      <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 text-xs text-[#B3B3B3] truncate">
                    {activeTab === 'downloads' ? (
                      <span className="flex items-center gap-1 text-[11px] text-[#1ED760] font-semibold">
                        <CheckCircle2 className="size-3" />
                        Downloaded 320k
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#A7A7A7]">
                        NewPipe Stream
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-3 pr-2 text-xs font-mono text-[#B3B3B3]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                      }}
                      className="p-1 cursor-pointer text-[#1ED760]"
                    >
                      <Heart className="size-4 fill-current" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadTrack(track);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-[#1ED760] transition-opacity cursor-pointer"
                    >
                      <Download className="size-4" />
                    </button>

                    <span className="w-10 text-right">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-[#B3B3B3] space-y-2">
            <Music className="size-12 mx-auto text-[#4D4D4D]" />
            <h3 className="text-base font-bold text-white">No tracks in this playlist</h3>
            <p className="text-xs text-[#A7A7A7]">Browse and add your favorite tracks to start building your library.</p>
          </div>
        )}
      </div>
    </div>
  );
};
