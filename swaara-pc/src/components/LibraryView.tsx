import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Heart,
  FolderDown,
  Play,
  FolderOpen,
  Music,
  Search,
  Clock,
  Download,
  Upload,
  FolderPlus,
} from 'lucide-react';
import { Track } from '../types/music';

interface LibraryViewProps {
  likedSongs: Track[];
  historySongs: Track[];
  downloadedSongs: Track[];
  localTracks?: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle: boolean) => void;
  onToggleLike: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  onImportLocalFiles?: (files: FileList | File[]) => void;
  initialSubTab?: 'liked' | 'history' | 'downloads' | 'local';
  onTrackContextMenu?: (e: React.MouseEvent, track: Track) => void;
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
  localTracks = [],
  onPlayTrack,
  onPlayAll,
  onToggleLike,
  onDownloadTrack,
  onImportLocalFiles,
  initialSubTab = 'liked',
  onTrackContextMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'liked' | 'history' | 'downloads' | 'local'>(initialSubTab);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  const rawList = useMemo(() => {
    switch (activeTab) {
      case 'liked':
        return likedSongs;
      case 'history':
        return historySongs;
      case 'downloads':
        return downloadedSongs;
      case 'local':
        return localTracks;
      default:
        return [];
    }
  }, [activeTab, likedSongs, historySongs, downloadedSongs, localTracks]);

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onImportLocalFiles) {
      onImportLocalFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onImportLocalFiles) {
      onImportLocalFiles(e.dataTransfer.files);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'liked': return 'Liked Songs';
      case 'history': return 'Listening History';
      case 'downloads': return 'Downloaded Songs';
      case 'local': return 'Local Files';
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex-1 h-full overflow-y-auto bg-[#070809] select-none font-sans scrollbar-thin transition-colors ${
        isDragOver ? 'bg-white/[0.02]' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header & Sub-Navigation */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[#F5F5F5] tracking-tight">
              {getTabTitle()}
            </h1>
            <p className="text-xs text-[#9A9FA3]">
              {rawList.length} song{rawList.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Simple Tab Links */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'liked'
                  ? 'text-[#F5F5F5] bg-[#101214] font-medium'
                  : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
              }`}
            >
              Liked Songs ({likedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'text-[#F5F5F5] bg-[#101214] font-medium'
                  : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'downloads'
                  ? 'text-[#F5F5F5] bg-[#101214] font-medium'
                  : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
              }`}
            >
              Downloads ({downloadedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'local'
                  ? 'text-[#F5F5F5] bg-[#101214] font-medium'
                  : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
              }`}
            >
              Local Files ({localTracks.length})
            </button>
          </div>
        </div>

        {/* Action Bar: Play All, Filter & Import */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {rawList.length > 0 && (
              <button
                onClick={() => onPlayAll(rawList, false)}
                className="h-8 px-4 rounded bg-[#F5F5F5] hover:bg-white text-black font-medium text-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shadow"
              >
                <Play className="size-3.5 fill-black stroke-black" />
                <span>Play All</span>
              </button>
            )}

            {activeTab === 'local' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#101214] hover:bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <FolderPlus className="size-3.5 text-[#9A9FA3]" />
                <span>Import Audio</span>
              </button>
            )}

            {activeTab === 'downloads' && (
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#101214] hover:bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <FolderOpen className="size-3.5 text-[#9A9FA3]" />
                <span>Open Folder</span>
              </button>
            )}
          </div>

          {rawList.length > 0 && (
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#9A9FA3]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter songs..."
                className="w-full h-8 pl-8 pr-3 rounded bg-[#0B0D0F] border border-white/[0.06] text-xs text-[#F5F5F5] placeholder-[#9A9FA3]/60 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>
          )}
        </div>

        {/* Primary Song Table */}
        {currentList.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 px-3 py-2 border-b border-white/[0.06] text-xs font-medium text-[#9A9FA3]">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6">Title</span>
              <span className="col-span-3">Artist</span>
              <span className="col-span-2 text-right pr-2 flex items-center justify-end gap-1">
                <Clock className="size-3" />
              </span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-transparent mt-1 space-y-0.5">
              {currentList.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  onClick={() => onPlayTrack(track)}
                  onContextMenu={(e) => onTrackContextMenu && onTrackContextMenu(e, track)}
                  className="grid grid-cols-12 items-center px-3 py-2 rounded hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <div className="col-span-1 text-center text-xs font-mono text-[#9A9FA3]">
                    <span className="group-hover:hidden">{i + 1}</span>
                    <Play className="size-3 text-[#F5F5F5] fill-[#F5F5F5] mx-auto hidden group-hover:block" />
                  </div>

                  <div className="col-span-6 flex items-center gap-3 truncate pr-3">
                    <img
                      src={track.artwork}
                      alt=""
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="size-8 rounded object-cover shrink-0 bg-[#101214]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0';
                      }}
                    />
                    <div className="truncate">
                      <p className="font-medium text-xs text-[#F5F5F5] group-hover:text-[#10B981] transition-colors truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#9A9FA3] truncate sm:hidden mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 text-xs text-[#9A9FA3] truncate hidden sm:block">
                    {track.artist}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2 pr-1 text-xs text-[#9A9FA3]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                      }}
                      className="p-1 cursor-pointer text-[#10B981] transition-transform active:scale-90"
                    >
                      <Heart className="size-3.5 fill-current" />
                    </button>

                    {activeTab !== 'local' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadTrack(track);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-[#F5F5F5] transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </button>
                    )}

                    <span className="w-10 text-right font-mono text-[11px]">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'local' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/[0.08] hover:border-white/[0.15] rounded-lg p-10 text-center flex flex-col items-center justify-center space-y-2 cursor-pointer bg-[#0B0D0F] hover:bg-[#101214] transition-colors"
          >
            <Upload className="size-6 text-[#9A9FA3]" />
            <h3 className="text-xs font-semibold text-[#F5F5F5]">Import local audio files</h3>
            <p className="text-xs text-[#9A9FA3] max-w-sm mx-auto">
              Drag and drop MP3, FLAC, WAV, AAC, M4A, or OGG audio files here to play offline.
            </p>
          </div>
        ) : (
          <div className="text-center py-20 text-[#9A9FA3] space-y-1">
            <Music className="size-8 mx-auto text-[#9A9FA3]/40 mb-2" />
            <p className="text-xs font-medium text-[#F5F5F5]">No songs in this list</p>
            <p className="text-xs text-[#9A9FA3]">Browse music on Home or Search to add songs.</p>
          </div>
        )}
      </div>
    </div>
  );
};
