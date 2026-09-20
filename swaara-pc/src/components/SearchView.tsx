import React, { useState, useEffect, useRef } from 'react';
import {
  Search as SearchIcon,
  X,
  Play,
  Heart,
  Download,
  Clock,
  Loader2,
  Plus,
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
  onTrackContextMenu?: (e: React.MouseEvent, track: Track) => void;
}

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs)) return '3:45';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const POPULAR_SEARCH_CHIPS = [
  'Arijit Singh',
  'Anirudh',
  'Kannada Hits',
  'Sid Sriram',
  'Bollywood Melodies',
  'The Weeknd',
  'Shreya Ghoshal',
  'Punjabi Hits',
];

export const SearchView: React.FC<SearchViewProps> = ({
  onPlayTrack,
  onAddToQueue,
  likedSongIds,
  onToggleLike,
  onDownloadTrack,
  onOpenArtist,
  onTrackContextMenu,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Track[]>([]);
  const [matchingArtists, setMatchingArtists] = useState<ArtistSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Autocomplete suggestions
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchSuggestions(query)
        .then((suggs) => {
          const filtered = suggs.filter((s) => s.toLowerCase() !== query.toLowerCase());
          setSuggestions(filtered.slice(0, 6));
        })
        .catch(() => setSuggestions([]));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Main search fetcher
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
        if (songsRes.status === 'fulfilled') setResults(songsRes.value);
        if (artistsRes.status === 'fulfilled') setMatchingArtists(artistsRes.value);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectQuery = (selectedText: string) => {
    setQuery(selectedText);
    setSuggestions([]);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#070809] p-6 sm:p-8 space-y-7 select-none font-sans scrollbar-thin">
      {/* Search Input Bar */}
      <div className="space-y-3 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9A9FA3]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full h-10 pl-10 pr-10 rounded-md bg-[#0B0D0F] border border-white/[0.06] focus:border-white/[0.15] text-[#F5F5F5] placeholder-[#9A9FA3]/60 text-xs font-normal focus:outline-none transition-colors"
          />
          {isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="size-3.5 animate-spin text-[#10B981]" />
            </div>
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9FA3] hover:text-[#F5F5F5] cursor-pointer p-1"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuery(sug)}
                className="px-2.5 py-1 rounded bg-[#101214] hover:bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Popular chips if empty */}
        {!query && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-[#9A9FA3]">Popular Searches</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCH_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuery(chip)}
                  className="px-2.5 py-1 rounded bg-[#0B0D0F] hover:bg-[#101214] border border-white/[0.06] text-xs text-[#9A9FA3] hover:text-[#F5F5F5] transition-colors cursor-pointer"
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
          {/* Artists Section */}
          {matchingArtists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A9FA3]">
                Artists
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {matchingArtists.slice(0, 6).map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onOpenArtist && onOpenArtist(art.browseId || art.name)}
                    className="group flex flex-col items-center text-center cursor-pointer select-none"
                  >
                    <div className="size-20 rounded-full overflow-hidden bg-[#101214] mb-2 border border-white/[0.06]">
                      <img
                        src={art.avatarUrl}
                        alt={art.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs font-medium text-[#F5F5F5] group-hover:text-[#10B981] transition-colors truncate max-w-full">
                      {art.name}
                    </p>
                    <p className="text-[11px] text-[#9A9FA3]">Artist</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Songs Section */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A9FA3]">
                Songs
              </h3>
              <div>
                {/* Header */}
                <div className="grid grid-cols-12 px-3 py-2 border-b border-white/[0.06] text-xs font-medium text-[#9A9FA3]">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-6">Title</span>
                  <span className="col-span-3">Artist</span>
                  <span className="col-span-2 text-right pr-2 flex items-center justify-end gap-1">
                    <Clock className="size-3" />
                  </span>
                </div>

                {/* Song List */}
                <div className="divide-y divide-transparent mt-1 space-y-0.5">
                  {results.map((track, i) => (
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
                          alt={track.title}
                          loading="lazy"
                          className="size-8 rounded object-cover shrink-0 bg-[#101214]"
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
                            onAddToQueue(track);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#F5F5F5] transition-opacity cursor-pointer"
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
                            likedSongIds.has(track.id) ? 'text-[#10B981]' : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                          }`}
                          title="Like"
                        >
                          <Heart className={`size-3.5 ${likedSongIds.has(track.id) ? 'fill-[#10B981]' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadTrack(track);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#F5F5F5] transition-opacity cursor-pointer"
                          title="Download"
                        >
                          <Download className="size-3.5" />
                        </button>

                        <span className="w-10 text-right font-mono text-[11px]">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : query && !isLoading ? (
        <div className="py-20 text-center text-[#9A9FA3] space-y-1">
          <p className="text-xs font-medium text-[#F5F5F5]">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs">Check spelling or search for another song or artist.</p>
        </div>
      ) : null}
    </div>
  );
};
