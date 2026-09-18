import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  TrendingUp,
  Disc3,
  Loader2,
  Zap,
  Moon,
  Compass,
  Music2,
  Coffee,
  Headphones,
  Waves,
} from 'lucide-react';
import { Track, AlgorithmMode } from '../types/music';
import { LANGUAGE_MATRICES, fetchMatrixTracks, searchMusic } from '../services/api';

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
    browseId: 'UCDxKh1gFWeYsqePvgVzmPoQ',
    artwork: 'https://lh3.googleusercontent.com/W_yOqnKSDYyeVOY_AsXhuAtb6rW3vCL3GtJ9DA1GxWOrJfyeSOqzvTv_TkFHijdkVPXWutASBlRFPg=w600-h600-p-l90-rj',
    query: 'Arijit Singh top hits',
  },
  {
    name: 'Anirudh',
    browseId: 'UCbRSywya_rl8YS15Lo9ttsA',
    artwork: 'https://lh3.googleusercontent.com/wBG4jypwBcEGHd-qSbM2_4B46WPEhlOCjusCOEkxdnsoIC4WLS9LmFARZsE854pB-vAEYlsp4x2yiHE=w600-h600-p-l90-rj',
    query: 'Anirudh Ravichander hits',
  },
  {
    name: 'Sid Sriram',
    browseId: 'UC7_KgmSrwM247k2lnh5GhHw',
    artwork: 'https://yt3.googleusercontent.com/Ip35qauI_vMztXkJ3Wd6etvLwiyRrHIGvDyKK3714vyWMBx1ogHxPxkA8ohPnOLyy68wzEVBblPmsHHU=w600-h600-p-l90-rj',
    query: 'Sid Sriram songs',
  },
  {
    name: 'Shreya Ghoshal',
    browseId: 'UCrC-7fsdTCYeaRBpwA6j-Eg',
    artwork: 'https://yt3.ggpht.com/PgINZNe0qVxgMSXKG5vF82bNN4WCC12zgWsz9I7OLs4CLF9Cn0Vxq7Xc1ToupnzXrCv0nKfe3VM=w600-c-h600-k-c0x00ffffff-no-l90-rj',
    query: 'Shreya Ghoshal melodies',
  },
  {
    name: 'The Weeknd',
    browseId: 'UClYV6hHlupm_S_ObS1W-DYw',
    artwork: 'https://lh3.googleusercontent.com/U-SAmNOu4TynE818gLCfKsuHZ0U5YNEtO9mrjSI9WCCKERs98LzrCal5kajBBTQNwdcisoB2Bn-pHp4=w600-h600-p-l90-rj',
    query: 'The Weeknd hits',
  },
  {
    name: 'A.R. Rahman',
    browseId: 'UCtJe0RYzgPddQXKtWduxz_w',
    artwork: 'https://yt3.googleusercontent.com/vHMOuDn8gr3SW9Pm8yFgmtYzM5kj4ayng5HKRjW0OyjG9mPK923XMVtTZTt4NUG_1aemWNLSQ27zjtA=w600-h600-p-l90-rj',
    query: 'A R Rahman hits',
  },
  {
    name: 'Sanjith Hegde',
    browseId: 'UCGCzMLhz0ucUUACQAHw-rmg',
    artwork: 'https://yt3.googleusercontent.com/oom6ZgCVlwOqUZauEjdzerUe00GdRfypxk9pUtkp2U7FiG1tD_uIbzAY90QCjXI-2LpxBNEx6g=w600-h600-p-l90-rj',
    query: 'Sanjith Hegde songs',
  },
  {
    name: 'Karan Aujla',
    browseId: 'UCSmK5WX5U4gdtebWjoL81og',
    artwork: 'https://lh3.googleusercontent.com/k7sgqqcV5VScaMZtTmS8W_tfouLVBpgyJII0epYE2Vjw1-zzhGgUCV51aHxZn6cmZKKJgUfNlIVpZg=w600-h600-p-l90-rj',
    query: 'Karan Aujla hits',
  },
];

const DAILY_MIXES = [
  {
    id: 'mix-flow',
    title: 'Daily Mix 1: Flow',
    subtitle: 'Arijit Singh, Anirudh, Sid Sriram, Shreya Ghoshal',
    color: 'from-emerald-900/60 via-teal-950/40 to-[#0E141B]',
    borderColor: 'border-emerald-500/25',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    tag: 'Daily Flow',
    query: 'Arijit Singh Anirudh Sid Sriram hits',
    icon: Waves,
  },
  {
    id: 'mix-energy',
    title: 'Daily Mix 2: High Voltage',
    subtitle: 'Karan Aujla, Diljit Dosanjh, Badshah, AP Dhillon',
    color: 'from-amber-900/60 via-orange-950/40 to-[#0E141B]',
    borderColor: 'border-amber-500/25',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    tag: 'High Energy',
    query: 'Latest Punjabi Bollywood Dance Party Hits',
    icon: Zap,
  },
  {
    id: 'mix-lofi',
    title: 'Daily Mix 3: Lo-Fi Nightfall',
    subtitle: 'Midnight Chill, Acoustic Lo-Fi, Slowed Melodies',
    color: 'from-indigo-900/60 via-purple-950/40 to-[#0E141B]',
    borderColor: 'border-indigo-500/25',
    tagColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    tag: 'Late Night',
    query: 'Bollywood Lofi Midnight Chill Beats',
    icon: Moon,
  },
  {
    id: 'mix-acoustic',
    title: 'Daily Mix 4: Acoustic Soul',
    subtitle: 'A.R. Rahman, Sanjith Hegde, Prateek Kuhad',
    color: 'from-rose-900/60 via-pink-950/40 to-[#0E141B]',
    borderColor: 'border-rose-500/25',
    tagColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    tag: 'Soulful & Raw',
    query: 'Acoustic Unplugged Hindi Kannada Melodies',
    icon: Sparkles,
  },
];

const MOOD_SCENES = [
  {
    id: 'night-drive',
    name: 'Late Night Drive',
    desc: 'Synthwave & Smooth Grooves',
    gradient: 'from-blue-900/70 to-[#0E141B]',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    icon: Headphones,
    query: 'Late Night Drive Songs Hits',
  },
  {
    id: 'cafe-acoustic',
    name: 'Cafe Acoustic',
    desc: 'Warm Unplugged Melodies',
    gradient: 'from-amber-900/70 to-[#0E141B]',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    icon: Coffee,
    query: 'Acoustic Coffeehouse Melodies',
  },
  {
    id: 'workout-beast',
    name: 'Workout Beast',
    desc: 'High BPM & Heavy Drops',
    gradient: 'from-red-900/70 to-[#0E141B]',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    icon: Zap,
    query: 'Gym Workout Motivation Music',
  },
  {
    id: 'rainy-melancholy',
    name: 'Rainy Melancholy',
    desc: 'Soulful Ballads & Strings',
    gradient: 'from-teal-900/70 to-[#0E141B]',
    border: 'border-teal-500/30',
    iconColor: 'text-teal-400',
    icon: Waves,
    query: 'Sad Melancholic Soul Songs',
  },
  {
    id: 'desi-party',
    name: 'Desi Party Hits',
    desc: 'Dhol, Beats & Club Anthems',
    gradient: 'from-purple-900/70 to-[#0E141B]',
    border: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    icon: Flame,
    query: 'Punjabi Bollywood Party Bangers',
  },
  {
    id: 'zen-focus',
    name: 'Zen Focus',
    desc: 'Ambient Lo-Fi & Deep Flow',
    gradient: 'from-emerald-900/70 to-[#0E141B]',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    icon: Sparkles,
    query: 'Lo-Fi Chill Study Concentration Beats',
  },
];

const ALGO_MODES: { mode: AlgorithmMode; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  { mode: 'flow', label: 'Flow', icon: Waves, desc: 'Smart Harmonic Blend' },
  { mode: 'high_energy', label: 'High Energy', icon: Zap, desc: 'Upbeat & Workout' },
  { mode: 'chill', label: 'Chill Lo-Fi', icon: Moon, desc: 'Late Night & Ambient' },
  { mode: 'vocal_acoustic', label: 'Acoustic Soul', icon: Sparkles, desc: 'Unplugged Vocals' },
  { mode: 'deep_cuts', label: 'Deep Cuts', icon: Compass, desc: 'Rare Gems & B-Sides' },
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
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [newDropTracks, setNewDropTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMixId, setLoadingMixId] = useState<string | null>(null);

  // Horizontal shelf scroll references
  const trendingShelfRef = useRef<HTMLDivElement>(null);
  const chartsShelfRef = useRef<HTMLDivElement>(null);
  const newDropsShelfRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -520 : 520;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Fetch Matrix Tracks & Charts
  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      fetchMatrixTracks(selectedMatrix.query),
      searchMusic(`${selectedMatrix.name} Top Viral 50 Songs`),
      searchMusic(`New Latest ${selectedMatrix.name} Hits 2026`),
    ])
      .then(([matrixRes, chartsRes, dropsRes]) => {
        if (matrixRes.status === 'fulfilled') {
          setTracks(matrixRes.value);
        }
        if (chartsRes.status === 'fulfilled') {
          setChartTracks(chartsRes.value);
        }
        if (dropsRes.status === 'fulfilled') {
          setNewDropTracks(dropsRes.value);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedMatrix]);

  const handlePlayMix = async (mixQuery: string, mixId: string) => {
    try {
      setLoadingMixId(mixId);
      const mixTracks = await searchMusic(mixQuery);
      if (mixTracks && mixTracks.length > 0) {
        onPlayTrack(mixTracks[0]);
      }
    } finally {
      setLoadingMixId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Hero Spotlight Track is the top track of current matrix
  const spotlightTrack = tracks[0] || currentTrack;
  const quickPickTracks = tracks.slice(1, 7);
  const trendingShelfTracks = tracks.slice(7, 22);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#070B0E] p-6 sm:p-8 space-y-9 select-none font-sans scrollbar-thin">
      {/* 1. Header & Language Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-xs text-[#8E96A0] mt-1">
              Curated for pure acoustic fidelity & effortless discovery
            </p>
          </div>

          {/* Clean Language Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {LANGUAGE_MATRICES.map((matrix) => {
              const isSelected = selectedMatrix.id === matrix.id;
              return (
                <button
                  key={matrix.id}
                  onClick={() => setSelectedMatrix(matrix)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#2DD4BF] text-black font-semibold shadow-sm'
                      : 'text-[#8E96A0] hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  {matrix.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Algorithm Mode Pill Bar ("Listen Your Way") */}
        {onChangeAlgorithmMode && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] font-bold text-[#8E96A0] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Compass className="size-3 text-[#2DD4BF]" /> Mode:
            </span>
            {ALGO_MODES.map((modeItem) => {
              const isActive = algorithmMode === modeItem.mode;
              const Icon = modeItem.icon;
              return (
                <button
                  key={modeItem.mode}
                  onClick={() => onChangeAlgorithmMode(modeItem.mode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-white/[0.1] text-white border-[#2DD4BF]/50 shadow-sm'
                      : 'bg-[#0E141B] text-[#8E96A0] hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                  title={modeItem.desc}
                >
                  <Icon className={`size-3.5 ${isActive ? 'text-[#2DD4BF]' : 'text-[#8E96A0]'}`} />
                  <span>{modeItem.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Cinematic Spotlight Hero Banner */}
      {spotlightTrack && (
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#0E141B] border border-white/[0.08] shadow-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 group">
          {/* Ambient blurred backdrop artwork */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-3xl scale-125 pointer-events-none"
            style={{ backgroundImage: `url(${spotlightTrack.artwork})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070B0E] via-[#0E141B]/90 to-transparent pointer-events-none" />

          {/* Left: Spotlight Content & Metadata */}
          <div className="relative z-10 flex-1 space-y-4 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center gap-1">
                <Sparkles className="size-3" /> Spotlight Release
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[#8E96A0] bg-white/[0.05] border border-white/[0.06]">
                320 kbps High Fidelity
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight line-clamp-2">
                {spotlightTrack.title}
              </h2>
              <p
                onClick={() => onOpenArtist && onOpenArtist(spotlightTrack.artist)}
                className="text-sm sm:text-base text-[#2DD4BF] font-semibold mt-1.5 cursor-pointer hover:underline inline-block"
              >
                {spotlightTrack.artist}
              </p>
              {spotlightTrack.album && (
                <p className="text-xs text-[#8E96A0] mt-0.5 truncate">
                  Album • {spotlightTrack.album}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onPlayTrack(spotlightTrack)}
                className="h-11 px-6 rounded-full bg-[#2DD4BF] hover:bg-[#20C0AC] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-transform duration-150 active:scale-95 shadow-lg shadow-[#2DD4BF]/20 cursor-pointer"
              >
                {currentTrack?.id === spotlightTrack.id && isPlaying ? (
                  <>
                    <Pause className="size-4 fill-black stroke-black" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="size-4 fill-black stroke-black ml-0.5" />
                    <span>Play Now</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onToggleLike(spotlightTrack)}
                className={`size-11 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  likedSongIds.has(spotlightTrack.id)
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-white/[0.04] border-white/[0.08] text-[#8E96A0] hover:text-white hover:bg-white/[0.08]'
                }`}
                title={likedSongIds.has(spotlightTrack.id) ? 'Liked' : 'Like'}
              >
                <Heart className={`size-4.5 ${likedSongIds.has(spotlightTrack.id) ? 'fill-rose-400' : ''}`} />
              </button>

              <button
                onClick={() => onDownloadTrack(spotlightTrack)}
                className="size-11 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Download Track"
              >
                <Download className="size-4.5" />
              </button>
            </div>
          </div>

          {/* Right: High-Res Cover Visual with 3D Depth */}
          <div className="relative z-10 shrink-0">
            <div className="relative size-44 sm:size-52 rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
              <img
                src={spotlightTrack.artwork}
                alt={spotlightTrack.title}
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Curated "Made For You" Daily Mixes Shelf */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Disc3 className="size-4 text-[#2DD4BF]" /> Made For You
            </h2>
            <p className="text-xs text-[#8E96A0]">Daily bespoke mixes powered by the Swaara recommendation engine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DAILY_MIXES.map((mix) => {
            const Icon = mix.icon;
            const isMixLoading = loadingMixId === mix.id;

            return (
              <div
                key={mix.id}
                onClick={() => handlePlayMix(mix.query, mix.id)}
                className={`group relative p-5 rounded-2xl bg-gradient-to-b ${mix.color} border ${mix.borderColor} hover:border-white/20 transition-all duration-200 cursor-pointer flex flex-col justify-between h-48 overflow-hidden shadow-lg`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${mix.tagColor}`}>
                      {mix.tag}
                    </span>
                    <Icon className="size-5 text-white/50 group-hover:text-white transition-colors" />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white tracking-tight">
                      {mix.title}
                    </h3>
                    <p className="text-xs text-[#8E96A0] line-clamp-2 mt-1">
                      {mix.subtitle}
                    </p>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-medium text-white/40 group-hover:text-white/80 transition-colors">
                    Infinite Stream
                  </span>
                  <button
                    className="size-10 rounded-full bg-[#2DD4BF] text-black shadow-md flex items-center justify-center transition-transform duration-150 group-hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isMixLoading ? (
                      <Loader2 className="size-4 animate-spin text-black" />
                    ) : (
                      <Play className="size-4 fill-black stroke-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Quick Picks Grid (6 items) */}
      {quickPickTracks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Quick Picks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {quickPickTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="group h-16 rounded-xl bg-[#0E141B] hover:bg-[#141C25] border border-white/[0.05] hover:border-white/[0.1] transition-all flex items-center justify-between overflow-hidden cursor-pointer pr-3"
                >
                  <div className="flex items-center gap-3 h-full truncate pr-2">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-16 object-cover shrink-0"
                    />
                    <div className="truncate">
                      <p className={`font-semibold text-xs truncate ${
                        isCurrent ? 'text-[#2DD4BF]' : 'text-white'
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
                        className="text-[11px] text-[#8E96A0] hover:text-white truncate mt-0.5"
                      >
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Play / Pause Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                    className={`size-8 rounded-full bg-[#2DD4BF] text-black shadow flex items-center justify-center transition-all cursor-pointer ${
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
        </div>
      )}

      {/* 6. Horizontal Shelf Carousel: Trending Now in {Language} */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="size-4 text-amber-400" /> Trending in {selectedMatrix.name}
            </h2>
            <p className="text-xs text-[#8E96A0]">Top rotating anthems streaming right now</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollShelf(trendingShelfRef, 'left')}
              className="size-8 rounded-lg bg-[#0E141B] hover:bg-white/10 border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => scrollShelf(trendingShelfRef, 'right')}
              className="size-8 rounded-lg bg-[#0E141B] hover:bg-white/10 border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#8E96A0] space-y-2">
            <Loader2 className="size-6 animate-spin text-[#2DD4BF]" />
            <p className="text-xs">Gathering high-fidelity streams...</p>
          </div>
        ) : (
          <div
            ref={trendingShelfRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
          >
            {trendingShelfTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="group cursor-pointer flex flex-col shrink-0 w-40 sm:w-44"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0E141B] border border-white/[0.08] mb-2.5 shadow-md">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Small Play Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`absolute right-2.5 bottom-2.5 size-10 rounded-full bg-[#2DD4BF] text-black shadow-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isCurrent && isPlaying
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="size-4 fill-black stroke-black" />
                      ) : (
                        <Play className="size-4 fill-black stroke-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  <p className={`font-semibold text-xs truncate ${
                    isCurrent ? 'text-[#2DD4BF]' : 'text-white'
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
                    className="text-[11px] text-[#8E96A0] hover:text-white truncate mt-0.5"
                  >
                    {track.artist}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Horizontal Shelf Carousel: Top Charts & Viral 50 */}
      {chartTracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="size-4 text-[#2DD4BF]" /> Top Charts & Viral 50
              </h2>
              <p className="text-xs text-[#8E96A0]">The most played and viral audio releases</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollShelf(chartsShelfRef, 'left')}
                className="size-8 rounded-lg bg-[#0E141B] hover:bg-white/10 border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => scrollShelf(chartsShelfRef, 'right')}
                className="size-8 rounded-lg bg-[#0E141B] hover:bg-white/10 border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div
            ref={chartsShelfRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
          >
            {chartTracks.slice(0, 15).map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="group cursor-pointer flex flex-col shrink-0 w-40 sm:w-44"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0E141B] border border-white/[0.08] mb-2.5 shadow-md">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Chart Rank Badge (#1, #2, #3...) */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-extrabold text-white">
                      #{idx + 1}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`absolute right-2.5 bottom-2.5 size-10 rounded-full bg-[#2DD4BF] text-black shadow-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isCurrent && isPlaying
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="size-4 fill-black stroke-black" />
                      ) : (
                        <Play className="size-4 fill-black stroke-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  <p className={`font-semibold text-xs truncate ${
                    isCurrent ? 'text-[#2DD4BF]' : 'text-white'
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
                    className="text-[11px] text-[#8E96A0] hover:text-white truncate mt-0.5"
                  >
                    {track.artist}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. "Explore Moods & Scenes" Visual Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-400" /> Explore Moods & Scenes
          </h2>
          <p className="text-xs text-[#8E96A0]">Atmospheres designed for every frame of mind</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {MOOD_SCENES.map((scene) => {
            const Icon = scene.icon;

            return (
              <div
                key={scene.id}
                onClick={() => {
                  setSelectedMatrix({
                    id: 'custom-scene',
                    name: scene.name,
                    script: 'Mood',
                    query: scene.query,
                  });
                }}
                className={`group p-4 rounded-xl bg-gradient-to-b ${scene.gradient} border ${scene.border} hover:border-white/25 transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`size-5 ${scene.iconColor}`} />
                  <ChevronRight className="size-3.5 text-white/30 group-hover:text-white transition-colors" />
                </div>

                <div>
                  <h4 className="font-bold text-xs text-white truncate">
                    {scene.name}
                  </h4>
                  <p className="text-[10px] text-[#8E96A0] truncate mt-0.5">
                    {scene.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 9. Horizontal Shelf Carousel: New Drops & Fresh Releases */}
      {newDropTracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Music2 className="size-4 text-pink-400" /> New Drops & Fresh Discoveries
              </h2>
              <p className="text-xs text-[#8E96A0]">Fresh arrivals and newly released singles</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollShelf(newDropsShelfRef, 'left')}
                className="size-8 rounded-lg bg-[#0E141B] hover:bg-white/10 border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => scrollShelf(newDropsShelfRef, 'right')}
                className="size-8 rounded-lg bg-[#0E141B] hover:bg-white/10 border border-white/[0.08] text-[#8E96A0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div
            ref={newDropsShelfRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
          >
            {newDropTracks.slice(0, 15).map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="group cursor-pointer flex flex-col shrink-0 w-40 sm:w-44"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0E141B] border border-white/[0.08] mb-2.5 shadow-md">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* NEW tag */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#2DD4BF] text-black">
                      NEW
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`absolute right-2.5 bottom-2.5 size-10 rounded-full bg-[#2DD4BF] text-black shadow-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isCurrent && isPlaying
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="size-4 fill-black stroke-black" />
                      ) : (
                        <Play className="size-4 fill-black stroke-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  <p className={`font-semibold text-xs truncate ${
                    isCurrent ? 'text-[#2DD4BF]' : 'text-white'
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
                    className="text-[11px] text-[#8E96A0] hover:text-white truncate mt-0.5"
                  >
                    {track.artist}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10. Featured Artists (High-Res Circular Portraits) */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Featured Artists
          </h2>
          <p className="text-xs text-[#8E96A0]">Master creators shaping the modern soundscape</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-5">
          {POPULAR_ARTISTS.map((artist) => (
            <div
              key={artist.name}
              onClick={() => {
                if (onOpenArtist) {
                  onOpenArtist(artist.browseId || artist.name);
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
              <div className="relative size-20 sm:size-24 rounded-full overflow-hidden mb-2.5 bg-[#0E141B] border border-white/[0.08] group-hover:border-[#2DD4BF]/60 transition-all duration-200 shadow-md">
                <img
                  src={artist.artwork}
                  alt={artist.name}
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              <h4 className="font-semibold text-xs text-white truncate w-full group-hover:text-[#2DD4BF] transition-colors">
                {artist.name}
              </h4>
              <p className="text-[11px] text-[#8E96A0] mt-0.5">
                Artist
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
