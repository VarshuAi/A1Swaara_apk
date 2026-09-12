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
    <div className="flex-1 h-full overflow-y-auto bg-[#121212] p-6 space-y-6 select-none font-sans scrollbar-thin">
      {/* Search Input Bar (Spotify Style) */}
      <div className="relative max-w-lg">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[#B3B3B3]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full h-12 pl-11 pr-10 rounded-full bg-[#242424] text-white placeholder-[#757575] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-md"
        />
        {isLoading ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-[#1ED760]" />
          </div>
        ) : query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white cursor-pointer"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Results View */}
      {results.length > 0 ? (
        <div className="space-y-6">
          {/* Top Result + Top 4 Tracks (Spotify Split Hero) */}
          {topResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top Result Card */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">Top Result</h3>
                <div
                  onClick={() => onPlayTrack(topResult)}
                  className="p-5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-200 cursor-pointer group relative flex flex-col justify-between h-[240px] shadow"
                >
                  <div className="size-24 rounded overflow-hidden shadow-lg bg-[#242424]">
                    <img src={topResult.artwork} alt={topResult.title} className="size-full object-cover" />
                  </div>

                  <div>
                    <h4 className="text-2xl font-black text-white truncate group-hover:underline">
                      {topResult.title}
                    </h4>
                    <p className="text-sm text-[#B3B3B3] truncate mt-1">
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
                      <span className="mx-2">•</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-bold text-white">
                        Song
                      </span>
                    </p>
                  </div>

                  {/* Floating Green Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(topResult);
                    }}
                    className="absolute right-5 bottom-5 size-12 rounded-full bg-[#1ED760] text-black shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95"
                  >
                    <Play className="size-5 fill-black ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Next 4 Tracks */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">Songs</h3>
                <div className="space-y-1">
                  {results.slice(0, 4).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isLiked = likedSongIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <div className="relative size-10 rounded overflow-hidden shrink-0 bg-[#242424]">
                            <img src={track.artwork} alt={track.title} className="size-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="size-4 text-white fill-white" />
                            </div>
                          </div>

                          <div className="truncate pr-2">
                            <p className={`font-semibold text-sm truncate ${
                              isCurrent ? 'text-[#1ED760]' : 'text-white'
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
                              className={`text-xs text-[#B3B3B3] truncate mt-0.5 ${
                                onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                              }`}
                            >
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-[#B3B3B3]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(track);
                            }}
                            className={`p-1 cursor-pointer ${
                              isLiked ? 'text-[#1ED760]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                            }`}
                          >
                            <Heart className={`size-4 ${isLiked ? 'fill-[#1ED760]' : ''}`} />
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

          {/* Full Results Table (Spotify Desktop Standard) */}
          <div className="space-y-2 pt-4">
            <h3 className="text-xl font-bold text-white tracking-tight">All Tracks</h3>

            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2 border-b border-white/[0.08] text-xs font-medium text-[#A7A7A7] uppercase tracking-wider">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-6">Title</span>
                <span className="col-span-3">Bitrate</span>
                <span className="col-span-2 text-right pr-4 flex items-center justify-end gap-1">
                  <Clock className="size-3.5" />
                </span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-transparent">
                {results.map((track, i) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isLiked = likedSongIds.has(track.id);

                  return (
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
                          <p className={`font-semibold text-sm truncate ${
                            isCurrent ? 'text-[#1ED760]' : 'text-white'
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
                            className={`text-xs text-[#B3B3B3] truncate mt-0.5 ${
                              onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                            }`}
                          >
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3 text-xs text-[#B3B3B3] truncate">
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-[10px] text-white">
                          320 KBPS
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-3 pr-2 text-xs font-mono text-[#B3B3B3]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue(track);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
                          title="Add to queue"
                        >
                          <Plus className="size-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(track);
                          }}
                          className={`p-1 cursor-pointer ${
                            isLiked ? 'text-[#1ED760]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                          }`}
                        >
                          <Heart className={`size-4 ${isLiked ? 'fill-[#1ED760]' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadTrack(track);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-[#1ED760] transition-opacity cursor-pointer"
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
        <div className="text-center py-20 text-[#B3B3B3] space-y-2">
          <Music className="size-12 mx-auto text-[#4D4D4D]" />
          <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
          <p className="text-xs text-[#A7A7A7]">Please make sure your words are spelled correctly, or use fewer or different keywords.</p>
        </div>
      ) : (
        /* Empty / Idle State: Spotify Browse All Categories */
        <div className="space-y-4 pt-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Browse All</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BROWSE_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setQuery(cat.query)}
                className={`h-32 p-4 rounded-lg bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex flex-col justify-between overflow-hidden relative group`}
              >
                <h3 className="font-extrabold text-lg text-white leading-tight break-words">
                  {cat.name}
                </h3>
                <div className="self-end text-xs font-bold text-white/80 group-hover:text-white flex items-center gap-1">
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
