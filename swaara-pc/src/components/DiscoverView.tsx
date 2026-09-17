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
    <div className="relative flex-1 h-full overflow-y-auto bg-[#050508] p-6 sm:p-8 space-y-8 select-none font-sans scrollbar-thin">
      {/* Ambient Lighting Blooms */}
      <div className="absolute -top-32 -left-32 size-[480px] rounded-full bg-[#00F59B]/10 blur-[130px] pointer-events-none animate-ambient-1" />
      <div className="absolute top-20 right-10 size-[500px] rounded-full bg-[#8B35FF]/10 blur-[150px] pointer-events-none animate-ambient-2" />

      {/* 1. Header & Greeting Bar */}
      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-xs text-[#9A9AA8] mt-1 font-medium">
              Swaara Studio 320K · Precision Audiophile Soundstage & Lossless Acoustics
            </p>
          </div>
          <span className="text-xs font-mono text-[#00F59B] bg-[#00F59B]/10 px-3.5 py-1.5 rounded-full border border-[#00F59B]/30 shadow-[0_0_16px_rgba(0,245,155,0.2)] flex items-center gap-2 font-bold">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>STUDIO MASTER 320K</span>
          </span>
        </div>

        {/* Hero AI Harmonic Reactor Bento Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C1220]/90 via-[#150F28]/85 to-[#0A0A16]/95 border border-white/10 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F59B]/15 text-[#00F59B] border border-[#00F59B]/30 text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-[0_0_14px_rgba(0,245,155,0.25)]">
              <Radio className="size-3 animate-pulse" />
              <span>Smart AI DJ Continuous Stream</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Infinite Harmonic Music Reactor
            </h3>
            <p className="text-xs text-[#B3B3C2] leading-relaxed">
              Real-time predictive audio engine continuously pairs harmonic chord progressions, linguistic matrices, and tempo energy so your listening session never halts.
            </p>

            {/* Algorithm Vibe Mode Pills */}
            {onChangeAlgorithmMode && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Vibe:
                </span>
                {[
                  { id: 'flow', label: '⚡ Flow' },
                  { id: 'high_energy', label: '🔥 Hype & Bass' },
                  { id: 'chill', label: '🌙 Midnight Lo-Fi' },
                  { id: 'vocal_acoustic', label: '✨ Vocal Melodies' },
                  { id: 'deep_cuts', label: '🌌 Deep Cuts' },
                ].map((modeItem) => {
                  const isActive = algorithmMode === modeItem.id;
                  return (
                    <button
                      key={modeItem.id}
                      onClick={() => onChangeAlgorithmMode(modeItem.id as AlgorithmMode)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#00F59B] text-black border-[#00F59B] shadow-[0_0_14px_rgba(0,245,155,0.4)] scale-105'
                          : 'glass-pill text-zinc-400 hover:text-white'
                      }`}
                    >
                      {modeItem.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 z-10 shrink-0">
            {tracks.length > 0 && (
              <button
                onClick={() => onPlayTrack(tracks[0])}
                className="px-6 py-3 rounded-full bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] hover:opacity-95 text-black font-black text-xs tracking-wider uppercase flex items-center gap-2.5 shadow-[0_0_24px_rgba(0,245,155,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="size-4.5 fill-black stroke-black" />
                <span>Launch Smart Flow</span>
              </button>
            )}
          </div>

          {/* Decorative Specular Reflection */}
          <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-[#00F59B]/10 via-purple-500/10 to-transparent pointer-events-none" />
        </div>

        {/* Filter Chips Pill Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {LANGUAGE_MATRICES.map((matrix) => {
            const isSelected = selectedMatrix.id === matrix.id;
            return (
              <button
                key={matrix.id}
                onClick={() => setSelectedMatrix(matrix)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-102'
                    : 'glass-pill text-[#B3B3C2] hover:text-white'
                }`}
              >
                <span>{matrix.name}</span>
                <span className="ml-1 opacity-70">({matrix.script})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bento Quick-Play Grid */}
      {topSixQuickTracks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
          {topSixQuickTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group h-18 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/20 backdrop-blur-xl transition-all flex items-center justify-between overflow-hidden shadow-lg cursor-pointer relative"
              >
                <div className="flex items-center gap-3.5 h-full truncate pr-2">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="size-18 object-cover shrink-0 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <div className="truncate">
                    <p className={`font-bold text-sm truncate ${
                      isCurrent ? 'text-[#00F59B]' : 'text-white'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-[#9A9AA8] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Floating Neon Green Play Button */}
                <div className="pr-3.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                    className={`size-10 rounded-full bg-gradient-to-tr from-[#00F59B] to-[#20CFFF] text-black shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isCurrent && isPlaying
                        ? 'opacity-100 scale-100 shadow-[0_0_16px_rgba(0,245,155,0.5)]'
                        : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="size-4.5 fill-black stroke-black" />
                    ) : (
                      <Play className="size-4.5 fill-black stroke-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Section: Top Trending Shelf (Glassmorphism 2.0 Card Grid) */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Trending in {selectedMatrix.name}</span>
              <span className="size-2 rounded-full bg-[#00F59B] animate-pulse" />
            </h2>
            <p className="text-xs text-[#9A9AA8] mt-0.5 font-medium">
              Studio Lossless 320 kbps Master Recordings
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#00F59B] hover:underline cursor-pointer">
            {tracks.length} Master Tracks
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#9A9AA8] space-y-3">
            <Loader2 className="size-8 animate-spin text-[#00F59B]" />
            <p className="text-xs font-mono font-bold">Decoding Lossless Harmonic Matrix...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {remainingTracks.slice(0, 12).map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedSongIds.has(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="p-3.5 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group relative flex flex-col justify-between shadow-xl"
                >
                  {/* Square Album Cover with Floating Neon Play Button */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#10101C] shadow-lg border border-white/5">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white border border-white/10">
                      #{idx + 1}
                    </div>

                    {/* Floating Neon Play Button on Card Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`absolute right-2.5 bottom-2.5 size-11 rounded-full bg-gradient-to-tr from-[#00F59B] via-[#1ED760] to-[#20CFFF] text-black shadow-[0_0_20px_rgba(0,245,155,0.4)] flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isCurrent && isPlaying
                          ? 'opacity-100 translate-y-0 scale-100'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95'
                      }`}
                      title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="size-5 fill-black stroke-black" />
                      ) : (
                        <Play className="size-5 fill-black stroke-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="w-full space-y-1">
                    <h3 className={`font-bold text-sm truncate ${
                      isCurrent ? 'text-[#00F59B]' : 'text-white'
                    }`}>
                      {track.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-[#9A9AA8]">
                      <p
                        onClick={(e) => {
                          if (onOpenArtist && track.artist) {
                            e.stopPropagation();
                            onOpenArtist(track.artist);
                          }
                        }}
                        className={`truncate ${
                          onOpenArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                        }`}
                      >
                        {track.artist}
                      </p>
                      <span className="text-[9px] font-mono px-1 rounded bg-white/[0.06] text-white/70 shrink-0">
                        320K
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Section: Popular Artists (Obsidian Glass Circular Cards) */}
      <div className="space-y-4 pt-2 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Featured Studio Artists
            </h2>
            <p className="text-xs text-[#9A9AA8] mt-0.5 font-medium">
              Verified composers and performers in lossless fidelity
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
              className="p-4 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group flex flex-col items-center text-center shadow-xl"
            >
              {/* Circular Avatar */}
              <div className="relative size-28 rounded-full overflow-hidden mb-3 bg-[#10101C] shadow-lg border-2 border-transparent group-hover:border-[#00F59B] transition-colors">
                <img
                  src={artist.artwork}
                  alt={artist.name}
                  className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
                />

                {/* Floating Play Button */}
                <button
                  className="absolute right-1 bottom-1 size-10 rounded-full bg-gradient-to-tr from-[#00F59B] to-[#20CFFF] text-black shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95"
                  title={`Play ${artist.name}`}
                >
                  <Play className="size-4.5 fill-black stroke-black ml-0.5" />
                </button>
              </div>

              <h4 className="font-bold text-sm text-white truncate w-full group-hover:text-[#00F59B] transition-colors">
                {artist.name}
              </h4>
              <p className="text-[11px] font-mono text-[#9A9AA8] mt-0.5 uppercase tracking-wider">
                Studio Artist
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
