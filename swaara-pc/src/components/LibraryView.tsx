import React, { useState, useMemo, useRef } from 'react';
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
  HardDrive,
  Upload,
  FolderPlus,
  Sparkles,
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
}) => {
  const [activeTab, setActiveTab] = useState<'liked' | 'history' | 'downloads' | 'local'>(initialSubTab);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex-1 h-full overflow-y-auto bg-[#080809] select-none font-sans scrollbar-thin transition-colors ${
        isDragOver ? 'ring-1 ring-[#10B981] bg-[#10B981]/5' : ''
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

      {/* 1. Clean Editorial Header */}
      <div className="p-8 bg-[#0B0B0D] border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-end gap-6">
        {/* Cover Art Box */}
        <div className="size-36 rounded-2xl bg-[#141416] border border-white/[0.08] shrink-0 flex items-center justify-center">
          {activeTab === 'liked' && (
            <Heart className="size-16 text-[#10B981] fill-[#10B981]" />
          )}
          {activeTab === 'downloads' && (
            <FolderDown className="size-16 text-white" />
          )}
          {activeTab === 'local' && (
            <HardDrive className="size-16 text-white" />
          )}
          {activeTab === 'history' && (
            <History className="size-16 text-[#8E8E93]" />
          )}
        </div>

        {/* Text Metadata */}
        <div className="space-y-1.5 truncate flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {activeTab === 'liked' && 'Liked Songs'}
            {activeTab === 'downloads' && 'Downloaded Songs'}
            {activeTab === 'local' && 'Local Audio Files'}
            {activeTab === 'history' && 'Listening History'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#8E8E93] pt-1">
            <span>{rawList.length} tracks</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher & Controls */}
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Sub-tab pills */}
          <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'liked'
                  ? 'bg-[#202024] text-white'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Liked ({likedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'downloads'
                  ? 'bg-[#202024] text-white'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Downloads ({downloadedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'local'
                  ? 'bg-[#202024] text-white'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Local Files ({localTracks.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#202024] text-white'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              History
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {activeTab === 'local' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <FolderPlus className="size-3.5" />
                <span>Import Audio</span>
              </button>
            )}

            {activeTab === 'downloads' && (
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <FolderOpen className="size-3.5" />
                <span>Open Folder</span>
              </button>
            )}

            {rawList.length > 0 && (
              <button
                onClick={() => onPlayAll(rawList, false)}
                className="size-10 rounded-full bg-[#10B981] hover:bg-[#059669] text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title="Play All"
              >
                <Play className="size-4.5 fill-black stroke-black ml-0.5" />
              </button>
            )}

            {/* Search Filter Input */}
            {rawList.length > 0 && (
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#71717A]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter tracks..."
                  className="w-full h-9 pl-8.5 pr-3 rounded-lg bg-[#121214] border border-white/[0.08] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Clean Track Table */}
        {currentList.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-2 border-b border-white/[0.06] text-xs font-semibold text-[#71717A] uppercase tracking-wider">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6">Title</span>
              <span className="col-span-3">Artist</span>
              <span className="col-span-2 text-right pr-3 flex items-center justify-end gap-1">
                <Clock className="size-3" />
              </span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-transparent mt-1 space-y-0.5">
              {currentList.map((track, i) => (
                <div
                  key={track.id + i}
                  onClick={() => onPlayTrack(track)}
                  className="grid grid-cols-12 items-center px-4 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="col-span-1 text-center text-xs font-mono text-[#71717A]">
                    <span className="group-hover:hidden">{i + 1}</span>
                    <Play className="size-3 text-white fill-white mx-auto hidden group-hover:block" />
                  </div>

                  <div className="col-span-6 flex items-center gap-3 truncate pr-3">
                    <img src={track.artwork} alt={track.title} className="size-9 rounded-lg object-cover shrink-0 bg-[#18181B] border border-white/[0.06]" />
                    <div className="truncate">
                      <p className="font-semibold text-sm text-[#F4F4F5] group-hover:text-[#10B981] transition-colors truncate">
                        {track.title}
                      </p>
                      <p className="text-xs text-[#8E8E93] truncate sm:hidden mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 text-xs text-[#8E8E93] truncate hidden sm:block">
                    {track.artist}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2.5 pr-2 text-xs text-[#8E8E93]">
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
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-white transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </button>
                    )}

                    <span className="w-10 text-right font-mono">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'local' ? (
          /* Local Audio Drag-and-Drop Area */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/[0.12] hover:border-white/25 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer bg-[#111113]/50 hover:bg-[#111113] transition-colors group"
          >
            <div className="size-12 rounded-xl bg-[#18181B] border border-white/[0.08] text-[#8E8E93] flex items-center justify-center">
              <Upload className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Import local audio files</h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Drag and drop MP3, FLAC, WAV, AAC, M4A, or OGG audio files here to play offline.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-lg bg-[#18181B] hover:bg-[#202024] border border-white/[0.08] text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Browse Audio Files
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-[#8E8E93] space-y-2">
            <Music className="size-10 mx-auto text-[#3F3F46]" />
            <h3 className="text-sm font-semibold text-white">No tracks in this playlist</h3>
            <p className="text-xs text-[#71717A]">Browse music on Home or Search to build your library.</p>
          </div>
        )}
      </div>
    </div>
  );
};
