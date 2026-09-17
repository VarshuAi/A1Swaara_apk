import React, { useState, useEffect, useRef } from 'react';
import {
  Search as SearchIcon,
  X,
  Play,
  Pause,
  Heart,
  Download,
  Clock,
  Loader2,
  Music,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Track } from '../types/music';
import { searchMusic } from '../services/api';

interface SearchViewProps {
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onToggleLike: (track: Track) => void;
  likedSongIds: Set<string>;
  onDownloadTrack: (track: Track) => void;
  onOpenArtist?: (artistName: string) => void;
}

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs)) return '3:45';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const BROWSE_CATEGORIES = [
  { name: 'Kannada Hits', color: 'from-[#8400e7] to-[#450af5]', query: 'Top Kannada Songs Hits' },
  { name: 'Bollywood Top 50', color: 'from-[#e91429] to-[#b0081c]', query: 'Top Bollywood Songs 2026' },
  { name: 'Punjabi Beats', color: 'from-[#e1118c] to-[#8a0050]', query: 'Latest Punjabi Hits Music' },
  { name: 'Global Pop', color: 'from-[#148a08] to-[#0d5905]', query: 'Top Global Pop Hits 2026' },
  { name: 'Lo-Fi Chill', color: 'from-[#056952] to-[#023b2e]', query: 'Bollywood Lofi Midnight Beats' },
  { name: 'Tamil Anirudh', color: 'from-[#d84000] to-[#8c2a00]', query: 'Anirudh Ravichander Tamil Hits' },
  { name: 'Telugu Anthems', color: 'from-[#ba5d07] to-[#733904]', query: 'Top Telugu Songs Audio' },
  { name: 'Romantic Melodies', color: 'from-[#e91429] to-[#8a0020]', query: 'Arijit Singh Romantic Hits' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  onPlayTrack,
  onAddToQueue,
  currentTrack,
  isPlaying,
  onToggleLike,
  likedSongIds,
  onDownloadTrack,
  onOpenArtist,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      searchMusic(query)
        .then((tracks) => {
          setResults(tracks);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const topResult = results[0];
  const otherResults = results.slice(1);

  return (
    <div className="relative flex-1 h-full overflow-y-auto bg-[#050508] p-6 sm:p-8 space-y-8 select-none font-sans scrollbar-thin">
      {/* Ambient Lighting Blooms */}
      <div className="absolute top-10 right-20 size-96 rounded-full bg-[#00F59B]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 size-96 rounded-full bg-[#8B35FF]/10 blur-[140px] pointer-events-none" />

      {/* Search Input Bar (Obsidian Glass Style) */}
      <div className="relative max-w-xl z-10">
        <SearchIcon className="absolute left-4.5 top-1/2 -translate-y-1/2 size-5 text-[#9A9AA8]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, soundtracks, or moods..."
          className="w-full h-13 pl-12 pr-12 rounded-2xl glass-panel text-white placeholder-[#626278] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00F59B]/60 focus:border-[#00F59B]/80 transition-all shadow-xl"
        />
        {isLoading ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="size-5 animate-spin text-[#00F59B]" />
          </div>
        ) : query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9AA8] hover:text-white cursor-pointer p-1 rounded-full hover:bg-white/[0.08] transition-colors"
          >
            <X className="size-4.5" />
          </button>
        ) : null}
      </div>

      {/* Results View */}
      {results.length > 0 ? (
        <div className="space-y-8 relative z-10">
          {/* Top Result + Top 4 Tracks */}
          {topResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top Result Card */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Top Match</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F59B]/15 text-[#00F59B] border border-[#00F59B]/30 font-bold">
                    320K
                  </span>
                </h3>
                <div
                  onClick={() => onPlayTrack(topResult)}
                  className="p-6 rounded-3xl bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 backdrop-blur-2xl transition-all duration-300 cursor-pointer group relative flex flex-col justify-between h-[260px] shadow-2xl hover:-translate-y-1"
                >
                  <div className="size-28 rounded-2xl overflow-hidden shadow-xl bg-[#141420] border border-white/10">
                    <img src={topResult.artwork} alt={topResult.title} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>

                  <div>
                    <h4 className="text-2xl font-black text-white truncate group-hover:text-[#00F59B] transition-colors">
                      {topResult.title}
                    </h4>
                    <p className="text-sm text-[#9A9AA8] truncate mt-1">
                      <span
                        onClick={(e) => {
                          if (onOpenArtist && topResult.artist) {
                            e.stopPropagation();
                            onOpenArtist(topResult.artist);
                          }
                        }}
                        className={`font-semibold text-white ${
                          onOpenArtist ? 'hover:underline cursor-pointer' : ''
                        }`}
                      >
                        {topResult.artist}
                      </span>
                      <span className="mx-2 text-zinc-600">•</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono font-bold text-white border border-white/5">
                        MASTER SONG
                      </span>
                    </p>
                  </div>

                  {/* Floating Green Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(topResult);
                    }}
                    className="absolute right-6 bottom-6 size-13 rounded-full bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] text-black shadow-[0_0_24px_rgba(0,245,155,0.4)] flex items-center justify-center cursor-pointer transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95"
                  >
                    <Play className="size-5 fill-black stroke-black ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Next 4 Tracks */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-xl font-black text-white tracking-tight">Top Songs</h3>
                <div className="space-y-1.5">
                  {results.slice(0, 4).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isLiked = likedSongIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.07] border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 truncate flex-1">
                          <div className="relative size-11 rounded-xl overflow-hidden shrink-0 bg-[#141420] border border-white/5">
                            <img src={track.artwork} alt={track.title} className="size-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="size-4 text-[#00F59B] fill-[#00F59B]" />
                            </div>
                          </div>

                          <div className="truncate pr-2">
                            <p className={`font-bold text-sm truncate ${
                              isCurrent ? 'text-[#00F59B]' : 'text-white'
                            }`}>
                              {track.title}
                            </p>
                            <p
                              onClick={(e) => {
                                if (onOpenArtist && track.artist) {
                                  e.stopPropagation();
                                  onOpenArtist(track.artist);
                                }
                              }}
                              className={`text-xs text-[#9A9AA8] truncate mt-0.5 ${
                                onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                              }`}
                            >
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-[#9A9AA8]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(track);
                            }}
                            className={`p-1 cursor-pointer transition-all ${
                              isLiked ? 'text-[#00F59B]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                            }`}
                          >
                            <Heart className={`size-4 ${isLiked ? 'fill-[#00F59B] drop-shadow-[0_0_6px_rgba(0,245,155,0.4)]' : ''}`} />
                          </button>

                          <span>{formatDuration(track.duration)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Full Results Table (Obsidian Glass Standard) */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xl font-black text-white tracking-tight">All Discovered Tracks</h3>

            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2.5 border-b border-white/[0.08] text-xs font-mono font-semibold text-[#8E8E9F] uppercase tracking-wider">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-6">Title & Artist</span>
                <span className="col-span-3">Fidelity</span>
                <span className="col-span-2 text-right pr-4 flex items-center justify-end gap-1">
                  <Clock className="size-3.5" />
                </span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-transparent mt-1 space-y-1">
                {results.map((track, i) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isLiked = likedSongIds.has(track.id);

                  return (
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
                          <p className={`font-bold text-sm truncate ${
                            isCurrent ? 'text-[#00F59B]' : 'text-white'
                          }`}>
                            {track.title}
                          </p>
                          <p
                            onClick={(e) => {
                              if (onOpenArtist && track.artist) {
                                e.stopPropagation();
                                onOpenArtist(track.artist);
                              }
                            }}
                            className={`text-xs text-[#9A9AA8] truncate mt-0.5 ${
                              onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                            }`}
                          >
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3 text-xs text-[#9A9AA8] truncate">
                        <span className="px-2 py-0.5 rounded-full bg-[#00F59B]/10 text-[#00F59B] border border-[#00F59B]/25 font-mono text-[10px] font-bold">
                          320K LOSSLESS
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-3 pr-2 text-xs font-mono text-[#9A9AA8]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue(track);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-pointer"
                          title="Add to queue"
                        >
                          <Plus className="size-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(track);
                          }}
                          className={`p-1 cursor-pointer transition-all ${
                            isLiked ? 'text-[#00F59B]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                          }`}
                        >
                          <Heart className={`size-4 ${isLiked ? 'fill-[#00F59B]' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadTrack(track);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-[#00F59B] transition-all cursor-pointer"
                          title="Download"
                        >
                          <Download className="size-4" />
                        </button>

                        <span className="w-10 text-right">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : query ? (
        <div className="text-center py-24 text-[#9A9AA8] space-y-3 relative z-10">
          <Music className="size-12 mx-auto text-[#444455]" />
          <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
          <p className="text-xs text-[#777788]">Try searching by song title, artist name, or genre tags.</p>
        </div>
      ) : (
        /* Empty / Idle State: Browse All Categories (Glass Bento) */
        <div className="space-y-4 pt-2 relative z-10">
          <h2 className="text-2xl font-black text-white tracking-tight">Explore Genres & Moods</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BROWSE_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setQuery(cat.query)}
                className={`h-36 p-5 rounded-3xl bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden relative group border border-white/10`}
              >
                <h3 className="font-black text-xl text-white leading-tight break-words drop-shadow">
                  {cat.name}
                </h3>
                <div className="self-end text-xs font-mono font-bold text-white/90 group-hover:text-white flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                  <span>Explore</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
