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

  const getHeaderGradient = () => {
    switch (activeTab) {
      case 'liked':
        return 'from-[#8B35FF]/40 via-[#FF2DAA]/10 to-[#050508]';
      case 'downloads':
        return 'from-[#00F59B]/30 via-[#1ED760]/10 to-[#050508]';
      case 'local':
        return 'from-[#20CFFF]/30 via-[#0072ff]/10 to-[#050508]';
      case 'history':
        return 'from-white/15 via-white/5 to-[#050508]';
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex-1 h-full overflow-y-auto bg-[#050508] select-none font-sans scrollbar-thin transition-colors ${
        isDragOver ? 'ring-2 ring-[#00F59B] bg-[#00F59B]/5' : ''
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

      {/* 1. Obsidian Hero Header with Glassmorphism 2.0 */}
      <div className={`p-8 bg-gradient-to-b ${getHeaderGradient()} border-b border-white/[0.06] flex flex-col md:flex-row items-end gap-6 relative z-10`}>
        {/* Cover Art Box */}
        <div className="size-48 rounded-3xl shadow-2xl shrink-0 flex items-center justify-center overflow-hidden border border-white/15 backdrop-blur-2xl">
          {activeTab === 'liked' && (
            <div className="size-full bg-gradient-to-br from-[#8B35FF] to-[#FF2DAA] flex items-center justify-center shadow-[0_0_40px_rgba(139,53,255,0.4)]">
              <Heart className="size-20 text-white fill-white drop-shadow-lg" />
            </div>
          )}
          {activeTab === 'downloads' && (
            <div className="size-full bg-gradient-to-br from-[#00F59B]/30 to-[#1ED760]/20 text-[#00F59B] flex items-center justify-center shadow-[0_0_40px_rgba(0,245,155,0.3)]">
              <FolderDown className="size-20" />
            </div>
          )}
          {activeTab === 'local' && (
            <div className="size-full bg-gradient-to-br from-[#20CFFF]/30 to-[#0072ff]/20 text-[#20CFFF] flex items-center justify-center shadow-[0_0_40px_rgba(32,207,255,0.3)]">
              <HardDrive className="size-20" />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="size-full bg-[#161626] text-[#9A9AA8] flex items-center justify-center shadow-2xl">
              <History className="size-20" />
            </div>
          )}
        </div>

        {/* Text Metadata */}
        <div className="space-y-2.5 truncate flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F59B] px-2.5 py-0.5 rounded-full bg-[#00F59B]/10 border border-[#00F59B]/20">
              {activeTab === 'local' ? 'OFFLINE STUDIO' : 'COLLECTION'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {activeTab === 'liked' && 'Liked Songs'}
            {activeTab === 'downloads' && 'Downloaded Lossless'}
            {activeTab === 'local' && 'PC Local Studio Audio'}
            {activeTab === 'history' && 'Listening History'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#9A9AA8] font-medium pt-1">
            <span className="font-bold text-white">Swaara Audio Engine 320K</span>
            <span>•</span>
            <span className="text-white font-semibold font-mono">{rawList.length} Tracks</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher & Controls */}
      <div className="p-6 space-y-6 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Sub-tab pills */}
          <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'liked'
                  ? 'bg-gradient-to-r from-[#8B35FF] to-[#FF2DAA] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Liked ({likedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'downloads'
                  ? 'bg-[#00F59B] text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Downloads ({downloadedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'local'
                  ? 'bg-[#20CFFF] text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PC Local Files ({localTracks.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20CFFF] to-[#0072ff] text-black font-bold text-xs shadow-[0_0_16px_rgba(32,207,255,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <FolderPlus className="size-4" />
                <span>Import Local Audio</span>
              </button>
            )}

            {activeTab === 'downloads' && (
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-xs font-bold text-white hover:scale-105 transition-all cursor-pointer"
              >
                <FolderOpen className="size-4 text-[#00F59B]" />
                <span>Open Folder</span>
              </button>
            )}

            {rawList.length > 0 && (
              <button
                onClick={() => onPlayAll(rawList, false)}
                className="size-11 rounded-full bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] text-black shadow-[0_0_20px_rgba(0,245,155,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Play All"
              >
                <Play className="size-5 fill-black stroke-black ml-0.5" />
              </button>
            )}

          {/* Search Filter Input */}
          {rawList.length > 0 && (
            <div className="relative w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9A9AA8]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter tracks..."
                className="w-full h-9 pl-9 pr-3 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#00F59B] transition-all"
              />
            </div>
          )}
          </div>
        </div>

        {/* 3. Obsidian Track Table */}
        {currentList.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-2.5 border-b border-white/[0.08] text-xs font-mono font-semibold text-[#8E8E9F] uppercase tracking-wider">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6">Title & Artist</span>
              <span className="col-span-3">Fidelity</span>
              <span className="col-span-2 text-right pr-4 flex items-center justify-end gap-1">
                <Clock className="size-3.5" />
              </span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-transparent mt-1 space-y-1">
              {currentList.map((track, i) => (
                <div
                  key={track.id + i}
                  onClick={() => onPlayTrack(track)}
                  className="grid grid-cols-12 items-center px-4 py-3 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                >
                  <div className="col-span-1 text-center text-xs font-mono text-[#9A9AA8]">
                    <span className="group-hover:hidden">{i + 1}</span>
                    <Play className="size-3.5 text-[#00F59B] fill-[#00F59B] mx-auto hidden group-hover:block" />
                  </div>

                  <div className="col-span-6 flex items-center gap-3.5 truncate pr-3">
                    <img src={track.artwork} alt={track.title} className="size-11 rounded-xl object-cover shrink-0 bg-[#141420] border border-white/5 shadow" />
                    <div className="truncate">
                      <p className="font-bold text-sm text-white group-hover:text-[#00F59B] transition-colors truncate">
                        {track.title}
                      </p>
                      <p className="text-xs text-[#9A9AA8] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 text-xs text-[#9A9AA8] truncate">
                    {activeTab === 'downloads' ? (
                      <span className="flex items-center gap-1.5 text-[11px] text-[#00F59B] font-mono font-bold">
                        <CheckCircle2 className="size-3.5" />
                        OFFLINE 320K
                      </span>
                    ) : activeTab === 'local' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#20CFFF]/15 text-[#20CFFF] font-bold border border-[#20CFFF]/25">
                        PC LOSSLESS
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 font-bold">
                        STUDIO 320K
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-3 pr-2 text-xs font-mono text-[#9A9AA8]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                      }}
                      className="p-1 cursor-pointer text-[#00F59B] hover:scale-110 transition-transform"
                    >
                      <Heart className="size-4 fill-current drop-shadow-[0_0_6px_rgba(0,245,155,0.4)]" />
                    </button>

                    {activeTab !== 'local' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadTrack(track);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-[#00F59B] transition-all cursor-pointer"
                        title="Download 320k"
                      >
                        <Download className="size-4" />
                      </button>
                    )}

                    <span className="w-12 text-right">
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
            className="border-2 border-dashed border-white/15 hover:border-[#20CFFF]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-white/[0.02] transition-all group"
          >
            <div className="size-16 rounded-2xl bg-[#20CFFF]/15 border border-[#20CFFF]/30 text-[#20CFFF] flex items-center justify-center shadow-[0_0_24px_rgba(32,207,255,0.2)] group-hover:scale-110 transition-transform">
              <Upload className="size-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Drop your PC Audio files here</h3>
              <p className="text-xs text-[#9A9AA8] max-w-sm mx-auto">
                Supports MP3, FLAC, WAV, AAC, M4A, and OGG with full 10-Band Biquad EQ, Spatial 3D, and Real-Time Spectrum Visualization.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 rounded-full bg-[#20CFFF] text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Browse Audio Files
            </button>
          </div>
        ) : (
          <div className="text-center py-24 text-[#9A9AA8] space-y-3">
            <Music className="size-12 mx-auto text-[#444455]" />
            <h3 className="text-base font-bold text-white">No tracks in this playlist</h3>
            <p className="text-xs text-[#777788]">Browse songs on the Home Stage or Search Catalog to build your library.</p>
          </div>
        )}
      </div>
    </div>
  );
};
