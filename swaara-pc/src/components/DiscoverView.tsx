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
  Zap,
  Moon,
  Compass,
  Music2,
} from 'lucide-react';
import { Track, AlgorithmMode } from '../types/music';
import { LANGUAGE_MATRICES, fetchMatrixTracks } from '../services/api';

interface DiscoverViewProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onToggleLike: (track: Track) => void;
  likedSongIds: Set<string>;
  onDownloadTrack: (track: Track) => void;
  onOpenArtist?: (artistName: string) => void;
  algorithmMode?: AlgorithmMode;
  onChangeAlgorithmMode?: (mode: AlgorithmMode) => void;
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
  algorithmMode = 'flow',
  onChangeAlgorithmMode,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const topSixQuickTracks = tracks.slice(0, 6);
  const remainingTracks = tracks.slice(6);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0B0B0D] p-8 space-y-9 select-none font-sans scrollbar-thin">
      {/* 1. Header & Greeting */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F4F5] tracking-tight">
            {getGreeting()}
          </h1>

          {/* Simple Language Switcher Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {LANGUAGE_MATRICES.map((matrix) => {
              const isSelected = selectedMatrix.id === matrix.id;
              return (
                <button
                  key={matrix.id}
                  onClick={() => setSelectedMatrix(matrix)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-white/[0.1] text-[#F4F4F5]'
                      : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04]'
                  }`}
                >
                  {matrix.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Quick Picks Grid (6 items) */}
      {topSixQuickTracks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {topSixQuickTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group h-14 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-center justify-between overflow-hidden cursor-pointer pr-3"
              >
                <div className="flex items-center gap-3 h-full truncate pr-2">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="size-14 object-cover shrink-0"
                  />
                  <div className="truncate">
                    <p className={`font-medium text-xs truncate ${
                      isCurrent ? 'text-emerald-400' : 'text-[#F4F4F5]'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#71717A] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Minimalist Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(track);
                  }}
                  className={`size-8 rounded-full bg-[#F4F4F5] text-black shadow flex items-center justify-center transition-opacity cursor-pointer ${
                    isCurrent && isPlaying
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="size-3.5 fill-black stroke-black" />
                  ) : (
                    <Play className="size-3.5 fill-black stroke-black ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Section: Trending Music (Simple Album Art Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F4F4F5] tracking-tight">
            Trending in {selectedMatrix.name}
          </h2>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#71717A] space-y-2">
            <Loader2 className="size-6 animate-spin text-emerald-400" />
            <p className="text-xs">Loading tracks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {remainingTracks.slice(0, 12).map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="group cursor-pointer flex flex-col"
                >
                  {/* Square Album Cover with Subtle Hover Play Button */}
                  <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#18181B] mb-2.5">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-full object-cover"
                    />

                    {/* Small Play Control on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`absolute right-2 bottom-2 size-9 rounded-full bg-[#F4F4F5] text-black shadow-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isCurrent && isPlaying
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="size-4 fill-black stroke-black" />
                      ) : (
                        <Play className="size-4 fill-black stroke-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <p className={`font-medium text-xs truncate ${
                    isCurrent ? 'text-emerald-400' : 'text-[#F4F4F5]'
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
                    className="text-[11px] text-[#71717A] truncate mt-0.5 hover:text-[#A1A1AA]"
                  >
                    {track.artist}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Section: Artists (Clean Circular Portraits) */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-semibold text-[#F4F4F5] tracking-tight">
          Featured Artists
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
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
              className="cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="relative size-24 rounded-full overflow-hidden mb-2 bg-[#18181B]">
                <img
                  src={artist.artwork}
                  alt={artist.name}
                  className="size-full object-cover"
                />
              </div>

              <h4 className="font-medium text-xs text-[#F4F4F5] truncate w-full group-hover:text-white">
                {artist.name}
              </h4>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                Artist
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
