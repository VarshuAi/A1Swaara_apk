import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Loader2,
} from 'lucide-react';
import { Track, AlgorithmMode } from '../types/music';
import { LANGUAGE_MATRICES, fetchMatrixTracks, searchMusic } from '../services/api';
import * as storage from '../services/storage';

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
  onTrackContextMenu?: (e: React.MouseEvent, track: Track) => void;
}

const POPULAR_ARTISTS = [
  {
    name: 'Arijit Singh',
    artwork: 'https://lh3.googleusercontent.com/W_yOqnKSDYyeVOY_AsXhuAtb6rW3vCL3GtJ9DA1GxWOrJfyeSOqzvTv_TkFHijdkVPXWutASBlRFPg=w600-h600-p-l90-rj',
  },
  {
    name: 'Anirudh',
    artwork: 'https://lh3.googleusercontent.com/wBG4jypwBcEGHd-qSbM2_4B46WPEhlOCjusCOEkxdnsoIC4WLS9LmFARZsE854pB-vAEYlsp4x2yiHE=w600-h600-p-l90-rj',
  },
  {
    name: 'Sid Sriram',
    artwork: 'https://yt3.googleusercontent.com/Ip35qauI_vMztXkJ3Wd6etvLwiyRrHIGvDyKK3714vyWMBx1ogHxPxkA8ohPnOLyy68wzEVBblPmsHHU=w600-h600-p-l90-rj',
  },
  {
    name: 'Shreya Ghoshal',
    artwork: 'https://yt3.ggpht.com/PgINZNe0qVxgMSXKG5vF82bNN4WCC12zgWsz9I7OLs4CLF9Cn0Vxq7Xc1ToupnzXrCv0nKfe3VM=w600-c-h600-k-c0x00ffffff-no-l90-rj',
  },
  {
    name: 'The Weeknd',
    artwork: 'https://lh3.googleusercontent.com/U-SAmNOu4TynE818gLCfKsuHZ0U5YNEtO9mrjSI9WCCKERs98LzrCal5kajBBTQNwdcisoB2Bn-pHp4=w600-h600-p-l90-rj',
  },
  {
    name: 'A.R. Rahman',
    artwork: 'https://yt3.googleusercontent.com/vHMOuDn8gr3SW9Pm8yFgmtYzM5kj4ayng5HKRjW0OyjG9mPK923XMVtTZTt4NUG_1aemWNLSQ27zjtA=w600-h600-p-l90-rj',
  },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onPlayTrack,
  currentTrack,
  isPlaying,
  onOpenArtist,
  onTrackContextMenu,
}) => {
  const [selectedMatrix, setSelectedMatrix] = useState(LANGUAGE_MATRICES[0]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [newDropTracks, setNewDropTracks] = useState<Track[]>([]);
  const [historyTracks, setHistoryTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    setHistoryTracks(storage.getHistory().slice(0, 6));
  }, [currentTrack]);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      fetchMatrixTracks(selectedMatrix.query),
      searchMusic(`${selectedMatrix.name} Top Hits 50`),
      searchMusic(`Latest New ${selectedMatrix.name} Songs`),
    ])
      .then(([matrixRes, chartsRes, dropsRes]) => {
        if (matrixRes.status === 'fulfilled') setTracks(matrixRes.value);
        if (chartsRes.status === 'fulfilled') setChartTracks(chartsRes.value);
        if (dropsRes.status === 'fulfilled') setNewDropTracks(dropsRes.value);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedMatrix]);

  const recentlyPlayedList = historyTracks.length > 0 ? historyTracks : tracks.slice(0, 6);
  const madeForYouList = tracks.slice(6, 12);
  const topChartsList = chartTracks.slice(0, 6);
  const newReleasesList = newDropTracks.slice(0, 6);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#070809] p-6 sm:p-8 space-y-8 select-none font-sans scrollbar-thin">
      {/* Header & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F5F5] tracking-tight">
            {getGreeting()}
          </h1>
        </div>

        {/* Clean Language Matrix Links */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {LANGUAGE_MATRICES.map((matrix) => {
            const isSelected = selectedMatrix.id === matrix.id;
            return (
              <button
                key={matrix.id}
                onClick={() => setSelectedMatrix(matrix)}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'text-[#F5F5F5] bg-[#101214] font-medium'
                    : 'text-[#9A9FA3] hover:text-[#F5F5F5]'
                }`}
              >
                {matrix.name}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#9A9FA3] space-y-2">
          <Loader2 className="size-5 animate-spin text-[#10B981]" />
          <span className="text-xs">Loading music...</span>
        </div>
      ) : (
        <div className="space-y-9">
          {/* 1. Recently Played */}
          {recentlyPlayedList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#F5F5F5] tracking-tight">
                Recently Played
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recentlyPlayedList.map((track, idx) => (
                  <AlbumCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    isPlayingThis={currentTrack?.id === track.id && isPlaying}
                    onPlay={() => onPlayTrack(track)}
                    onContextMenu={(e) => onTrackContextMenu && onTrackContextMenu(e, track)}
                    onOpenArtist={onOpenArtist}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 2. Made For You */}
          {madeForYouList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#F5F5F5] tracking-tight">
                Made For You
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {madeForYouList.map((track, idx) => (
                  <AlbumCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    isPlayingThis={currentTrack?.id === track.id && isPlaying}
                    onPlay={() => onPlayTrack(track)}
                    onContextMenu={(e) => onTrackContextMenu && onTrackContextMenu(e, track)}
                    onOpenArtist={onOpenArtist}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. Popular Artists */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5] tracking-tight">
              Popular Artists
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {POPULAR_ARTISTS.map((artist) => (
                <div
                  key={artist.name}
                  onClick={() => onOpenArtist && onOpenArtist(artist.name)}
                  className="group flex flex-col items-center text-center cursor-pointer select-none"
                >
                  <div className="size-24 sm:size-28 rounded-full overflow-hidden bg-[#101214] mb-2.5">
                    <img
                      src={artist.artwork}
                      alt={artist.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-xs font-medium text-[#F5F5F5] group-hover:text-[#10B981] transition-colors truncate max-w-full">
                    {artist.name}
                  </p>
                  <p className="text-[11px] text-[#9A9FA3]">Artist</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Top Charts */}
          {topChartsList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#F5F5F5] tracking-tight">
                Top Charts
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {topChartsList.map((track, idx) => (
                  <AlbumCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    isPlayingThis={currentTrack?.id === track.id && isPlaying}
                    onPlay={() => onPlayTrack(track)}
                    onContextMenu={(e) => onTrackContextMenu && onTrackContextMenu(e, track)}
                    onOpenArtist={onOpenArtist}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 5. Recently Added / New Releases */}
          {newReleasesList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#F5F5F5] tracking-tight">
                Recently Added
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {newReleasesList.map((track, idx) => (
                  <AlbumCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    isPlayingThis={currentTrack?.id === track.id && isPlaying}
                    onPlay={() => onPlayTrack(track)}
                    onContextMenu={(e) => onTrackContextMenu && onTrackContextMenu(e, track)}
                    onOpenArtist={onOpenArtist}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

interface AlbumCardProps {
  track: Track;
  isPlayingThis: boolean;
  onPlay: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onOpenArtist?: (artist: string) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  track,
  isPlayingThis,
  onPlay,
  onContextMenu,
  onOpenArtist,
}) => {
  return (
    <div
      onClick={onPlay}
      onContextMenu={onContextMenu}
      className="group flex flex-col cursor-pointer select-none"
    >
      {/* Artwork container */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#101214] mb-2.5">
        <img
          src={track.artwork}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="size-full object-cover transition-transform duration-200 group-hover:scale-103"
          onError={(e) => {
            // Gracefully hide broken image element so clean dark background stays intact
            (e.target as HTMLElement).style.opacity = '0';
          }}
        />

        {/* Hover play button */}
        <div
          className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity duration-150 ${
            isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="size-9 rounded-full bg-[#F5F5F5] text-black flex items-center justify-center shadow-lg transition-transform active:scale-95">
            {isPlayingThis ? (
              <Pause className="size-4 fill-black stroke-black" />
            ) : (
              <Play className="size-4 fill-black stroke-black ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Song / Album title */}
      <p className="text-xs font-medium text-[#F5F5F5] truncate leading-tight">
        {track.title}
      </p>

      {/* Artist */}
      <p
        onClick={(e) => {
          if (onOpenArtist && track.artist) {
            e.stopPropagation();
            onOpenArtist(track.artist);
          }
        }}
        className="text-[11px] text-[#9A9FA3] hover:text-[#F5F5F5] truncate mt-1 transition-colors"
      >
        {track.artist}
      </p>
    </div>
  );
};
