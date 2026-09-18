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
import { Track, ArtistSearchResult } from '../types/music';
import { searchMusic, searchArtists, fetchSearchSuggestions } from '../services/api';

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

const POPULAR_SEARCH_CHIPS = [
  'Arijit Singh',
  'Anirudh Ravichander',
  'Kannada Top Hits',
  'Sid Sriram',
  'Bollywood Lo-Fi',
  'The Weeknd',
  'Shreya Ghoshal',
  'Punjabi Hits 2026',
  'Sanjith Hegde',
  'Acoustic Unplugged',
];

const BROWSE_CATEGORIES = [
  { name: 'Kannada Hits', bg: 'bg-[#1e1b4b]', border: 'border-indigo-900/40', query: 'Top Kannada Songs Hits' },
  { name: 'Bollywood Hits', bg: 'bg-[#4c0519]', border: 'border-rose-900/40', query: 'Top Bollywood Songs 2026' },
  { name: 'Punjabi Beats', bg: 'bg-[#3b0764]', border: 'border-purple-900/40', query: 'Latest Punjabi Hits Music' },
  { name: 'Global Pop', bg: 'bg-[#064e3b]', border: 'border-emerald-900/40', query: 'Top Global Pop Hits 2026' },
  { name: 'Lo-Fi Chill', bg: 'bg-[#134e4a]', border: 'border-teal-900/40', query: 'Bollywood Lofi Midnight Beats' },
  { name: 'Tamil Hits', bg: 'bg-[#451a03]', border: 'border-amber-900/40', query: 'Anirudh Ravichander Tamil Hits' },
  { name: 'Telugu Anthems', bg: 'bg-[#1e293b]', border: 'border-slate-800/60', query: 'Top Telugu Songs Audio' },
  { name: 'Romantic Melodies', bg: 'bg-[#312e81]', border: 'border-indigo-950/60', query: 'Arijit Singh Romantic Hits' },
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Track[]>([]);
  const [matchingArtists, setMatchingArtists] = useState<ArtistSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live Autocomplete Suggestions Fetcher
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchSuggestions(query)
        .then((suggs) => {
          // Filter out exact match
          const filtered = suggs.filter((s) => s.toLowerCase() !== query.toLowerCase());
          setSuggestions(filtered.slice(0, 6));
        })
        .catch(() => setSuggestions([]));
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Main Songs & Artists Search Fetcher
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setMatchingArtists([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      Promise.allSettled([
        searchMusic(query),
        searchArtists(query),
      ]).then(([songsRes, artistsRes]) => {
        if (songsRes.status === 'fulfilled') {
          setResults(songsRes.value);
        }
        if (artistsRes.status === 'fulfilled') {
          setMatchingArtists(artistsRes.value);
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectQuery = (selectedText: string) => {
    setQuery(selectedText);
    setSuggestions([]);
  };

  const topResult = results[0];
  const otherResults = results.slice(1);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#070B0E] p-6 sm:p-8 space-y-6 select-none font-sans scrollbar-thin">
      {/* Search Input Field & Auto Suggestions */}
      <div className="space-y-3 max-w-2xl">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#71717A]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, soundtracks, or moods..."
            className="w-full h-11 pl-11 pr-11 rounded-xl bg-[#0E141B] border border-white/[0.08] focus:border-[#2DD4BF]/50 text-white placeholder-[#71717A] text-sm font-medium focus:outline-none transition-colors shadow-inner"
          />
          {isLoading ? (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin text-[#2DD4BF]" />
            </div>
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white cursor-pointer p-1 rounded-md transition-colors"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {/* Live Autocomplete Suggestions Strip */}
        {suggestions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <TrendingUp className="size-3 text-[#2DD4BF]" /> Suggested:
            </span>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuery(sug)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#131B24] hover:bg-[#1A2430] border border-white/[0.08] hover:border-[#2DD4BF]/40 text-[#D1D5DB] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Quick Popular Searches if query is empty */}
        {!query && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-[#71717A]">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCH_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuery(chip)}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-[#0E141B] hover:bg-[#151E28] border border-white/[0.06] hover:border-white/15 text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {results.length > 0 || matchingArtists.length > 0 ? (
        <div className="space-y-8">
          {/* Matching Artists Shelf with Real Circular Portraits */}
          {matchingArtists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93]">
                Artists
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {matchingArtists.slice(0, 6).map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onOpenArtist && onOpenArtist(art.browseId || art.name)}
                    className="group cursor-pointer flex flex-col items-center text-center p-3.5 rounded-xl bg-[#111113] hover:bg-[#141416] border border-white/[0.06] hover:border-white/10 transition-colors"
                  >
                    <div className="relative size-20 sm:size-24 rounded-full overflow-hidden mb-2.5 bg-[#18181B] border border-white/[0.08] group-hover:border-[#10B981]/50 transition-colors shadow-md">
                      <img
                        src={art.avatarUrl}
                        alt={art.name}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h4 className="font-semibold text-xs text-white truncate w-full group-hover:text-[#10B981] transition-colors">
                      {art.name}
                    </h4>
                    <p className="text-[11px] text-[#8E8E93] truncate w-full mt-0.5">
                      {art.subscribers || 'Artist'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Result + Top 4 Tracks */}
          {topResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top Result Card */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Top Match
                </h3>
                <div
                  onClick={() => onPlayTrack(topResult)}
                  className="p-5 rounded-2xl bg-[#111113] hover:bg-[#141416] border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer group relative flex flex-col justify-between h-[230px]"
                >
                  <div className="size-24 rounded-xl overflow-hidden bg-[#18181B] border border-white/[0.06]">
                    <img src={topResult.artwork} alt={topResult.title} className="size-full object-cover" />
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white truncate group-hover:text-[#10B981] transition-colors">
                      {topResult.title}
                    </h4>
                    <p className="text-sm text-[#8E8E93] truncate mt-1">
                      <span
                        onClick={(e) => {
                          if (onOpenArtist && topResult.artist) {
                            e.stopPropagation();
                            onOpenArtist(topResult.artist);
                          }
                        }}
                        className={`hover:text-white ${onOpenArtist ? 'hover:underline cursor-pointer' : ''}`}
                      >
                        {topResult.artist}
                      </span>
                      <span className="mx-2 text-zinc-600">•</span>
                      <span>Song</span>
                    </p>
                  </div>

                  {/* Restrained Hover Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(topResult);
                    }}
                    className="absolute right-5 bottom-5 size-11 rounded-full bg-[#10B981] hover:bg-[#059669] text-black shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                  >
                    <Play className="size-4.5 fill-black stroke-black ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Next 4 Tracks */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Songs
                </h3>
                <div className="space-y-1">
                  {results.slice(0, 4).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isLiked = likedSongIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                          <div className="relative size-10 rounded-lg overflow-hidden shrink-0 bg-[#18181B] border border-white/[0.06]">
                            <img src={track.artwork} alt={track.title} className="size-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="size-3.5 text-white fill-white" />
                            </div>
                          </div>

                          <div className="truncate pr-2">
                            <p className={`font-semibold text-sm truncate ${
                              isCurrent ? 'text-[#10B981]' : 'text-[#F4F4F5]'
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
                              className={`text-xs text-[#8E8E93] truncate mt-0.5 ${
                                onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                              }`}
                            >
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#8E8E93] shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(track);
                            }}
                            className={`p-1 cursor-pointer transition-colors ${
                              isLiked ? 'text-[#10B981]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                            }`}
                          >
                            <Heart className={`size-3.5 ${isLiked ? 'fill-[#10B981]' : ''}`} />
                          </button>

                          <span className="font-mono">{formatDuration(track.duration)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Full Results Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8E8E93]">
              All Results
            </h3>

            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2 border-b border-white/[0.06] text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-6">Title</span>
                <span className="col-span-3">Artist</span>
                <span className="col-span-2 text-right pr-3 flex items-center justify-end gap-1">
                  <Clock className="size-3" />
                </span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-transparent mt-1 space-y-0.5">
                {results.map((track, i) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isLiked = likedSongIds.has(track.id);

                  return (
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
                          <p className={`font-semibold text-sm truncate ${
                            isCurrent ? 'text-[#10B981]' : 'text-[#F4F4F5]'
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
                            className={`text-xs text-[#8E8E93] truncate sm:hidden mt-0.5 ${
                              onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                            }`}
                          >
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3 text-xs text-[#8E8E93] truncate hidden sm:block">
                        <span
                          onClick={(e) => {
                            if (onOpenArtist && track.artist) {
                              e.stopPropagation();
                              onOpenArtist(track.artist);
                            }
                          }}
                          className={`hover:text-white ${onOpenArtist ? 'hover:underline cursor-pointer' : ''}`}
                        >
                          {track.artist}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2.5 pr-2 text-xs text-[#8E8E93]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue(track);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-white transition-colors cursor-pointer"
                          title="Add to queue"
                        >
                          <Plus className="size-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(track);
                          }}
                          className={`p-1 cursor-pointer transition-colors ${
                            isLiked ? 'text-[#10B981]' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                          }`}
                        >
                          <Heart className={`size-3.5 ${isLiked ? 'fill-[#10B981]' : ''}`} />
                        </button>

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

                        <span className="w-10 text-right font-mono">
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
        <div className="text-center py-20 text-[#8E8E93] space-y-2">
          <Music className="size-10 mx-auto text-[#3F3F46]" />
          <h3 className="text-sm font-semibold text-white">No results found for "{query}"</h3>
          <p className="text-xs text-[#71717A]">Try searching by song title, artist name, or genre tags.</p>
        </div>
      ) : (
        /* Empty / Idle State: Clean Browse Tiles */
        <div className="space-y-4 pt-1">
          <h2 className="text-lg font-bold text-white tracking-tight">Browse Genres & Moods</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {BROWSE_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setQuery(cat.query)}
                className={`h-28 p-4 rounded-xl ${cat.bg} border ${cat.border} cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all flex flex-col justify-between overflow-hidden relative group`}
              >
                <h3 className="font-bold text-base text-white leading-snug">
                  {cat.name}
                </h3>
                <span className="self-end text-xs font-medium text-white/70 group-hover:text-white">
                  Explore →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
