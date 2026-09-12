import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  Download,
  Flame,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Disc3,
  Loader2,
} from 'lucide-react';
import { Track } from '../types/music';
import { LANGUAGE_MATRICES, fetchMatrixTracks } from '../services/api';

interface DiscoverViewProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onToggleLike: (track: Track) => void;
  likedSongIds: Set<string>;
  onDownloadTrack: (track: Track) => void;
  onOpenArtist?: (artistName: string) => void;
}

const POPULAR_ARTISTS = [
  {
    name: 'Arijit Singh',
    genre: 'Artist',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    query: 'Arijit Singh top hits',
  },
  {
    name: 'Anirudh',
    genre: 'Artist',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    query: 'Anirudh Ravichander hits',
  },
  {
    name: 'Sid Sriram',
    genre: 'Artist',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    query: 'Sid Sriram songs',
  },
  {
    name: 'Shreya Ghoshal',
    genre: 'Artist',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    query: 'Shreya Ghoshal melodies',
  },
  {
    name: 'The Weeknd',
    genre: 'Artist',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
    query: 'The Weeknd hits',
  },
  {
    name: 'Sanjith Hegde',
    genre: 'Artist',
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
    query: 'Sanjith Hegde songs',
  },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onPlayTrack,
  currentTrack,
  isPlaying,
  onToggleLike,
  likedSongIds,
  onDownloadTrack,
  onOpenArtist,
}) => {
  const [selectedMatrix, setSelectedMatrix] = useState(LANGUAGE_MATRICES[0]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetchMatrixTracks(selectedMatrix.query)
      .then((data) => {
        setTracks(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedMatrix]);

  // Greeting based on user's current time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const topSixQuickTracks = tracks.slice(0, 6);
  const remainingTracks = tracks.slice(6);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-[#1a1a24] via-[#121212] to-[#121212] p-6 space-y-8 select-none font-sans scrollbar-thin">
      {/* 1. Header & Greeting Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}
          </h1>
          <span className="text-xs font-mono text-[#B3B3B3] bg-[#242424] px-3 py-1 rounded-full border border-white/[0.06]">
            NewPipe 320K Catalog
          </span>
        </div>

        {/* Filter Chips Pill Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {LANGUAGE_MATRICES.map((matrix) => {
            const isSelected = selectedMatrix.id === matrix.id;
            return (
              <button
                key={matrix.id}
                onClick={() => setSelectedMatrix(matrix)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-white text-black'
                    : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
                }`}
              >
                <span>{matrix.name}</span>
                <span className="ml-1 opacity-70">({matrix.script})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Iconic Spotify 2x3 Quick-Play Grid */}
      {topSixQuickTracks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topSixQuickTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group h-16 rounded bg-white/[0.07] hover:bg-white/[0.15] transition-all flex items-center justify-between overflow-hidden shadow cursor-pointer relative"
              >
                <div className="flex items-center gap-3 h-full truncate">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="size-16 object-cover shrink-0 shadow"
                  />
                  <p className="font-bold text-sm text-white truncate pr-2">
                    {track.title}
                  </p>
                </div>

                {/* Floating Spotify Green Play Button */}
                <div className="pr-3 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                    className={`size-10 rounded-full bg-[#1ED760] text-black shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isCurrent && isPlaying
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="size-4.5 fill-black" />
                    ) : (
                      <Play className="size-4.5 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Section: Top Trending Shelf (Spotify Card Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Trending in {selectedMatrix.name}
            </h2>
            <p className="text-xs text-[#B3B3B3] mt-0.5">
              Top chart releases streaming directly in 320 kbps Opus
            </p>
          </div>
          <span className="text-xs font-bold text-[#B3B3B3] hover:text-white transition-colors cursor-pointer">
            Show all ({tracks.length})
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#B3B3B3] space-y-3">
            <Loader2 className="size-8 animate-spin text-[#1ED760]" />
            <p className="text-xs font-medium">Resolving NewPipe Chart...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {remainingTracks.slice(0, 12).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedSongIds.has(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="p-3 rounded-md bg-[#181818] hover:bg-[#282828] transition-all duration-200 cursor-pointer group relative flex flex-col justify-between shadow"
                >
                  {/* Square Album Cover with Floating Spotify Green Play Button */}
                  <div className="relative aspect-square w-full rounded overflow-hidden mb-3 bg-[#242424] shadow-md">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-full object-cover"
                    />

                    {/* Floating Green Play Button on Card Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`absolute right-2 bottom-2 size-11 rounded-full bg-[#1ED760] text-black shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isCurrent && isPlaying
                          ? 'opacity-100 translate-y-0 scale-100'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95'
                      }`}
                      title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="size-5 fill-black" />
                      ) : (
                        <Play className="size-5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="w-full">
                    <h3 className={`font-bold text-sm truncate ${
                      isCurrent ? 'text-[#1ED760]' : 'text-white'
                    }`}>
                      {track.title}
                    </h3>
                    <p
                      onClick={(e) => {
                        if (onOpenArtist && track.artist) {
                          e.stopPropagation();
                          onOpenArtist(track.artist);
                        }
                      }}
                      className={`text-xs text-[#B3B3B3] truncate mt-1 ${
                        onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                      }`}
                    >
                      {track.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Section: Popular Artists (Circular Spotify Avatars) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Popular Artists
            </h2>
            <p className="text-xs text-[#B3B3B3] mt-0.5">
              Listen to the most popular producers and singers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {POPULAR_ARTISTS.map((artist) => (
            <div
              key={artist.name}
              onClick={() => {
                if (onOpenArtist) {
                  onOpenArtist(artist.name);
                } else {
                  setSelectedMatrix({
                    id: 'custom',
                    name: artist.name,
                    script: 'Hits',
                    query: artist.query,
                  });
                }
              }}
              className="p-3.5 rounded-md bg-[#181818] hover:bg-[#282828] transition-all duration-200 cursor-pointer group flex flex-col items-center text-center shadow"
            >
              {/* Circular Avatar */}
              <div className="relative size-28 rounded-full overflow-hidden mb-3 bg-[#242424] shadow-md">
                <img
                  src={artist.artwork}
                  alt={artist.name}
                  className="size-full object-cover"
                />

                {/* Floating Play Button */}
                <button
                  className="absolute right-1 bottom-1 size-10 rounded-full bg-[#1ED760] text-black shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95"
                  title={`Play ${artist.name}`}
                >
                  <Play className="size-4.5 fill-black ml-0.5" />
                </button>
              </div>

              <h4 className="font-bold text-sm text-white truncate w-full">
                {artist.name}
              </h4>
              <p className="text-xs text-[#B3B3B3] mt-1">
                Artist
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
