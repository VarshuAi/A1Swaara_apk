import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  Download,
  CheckCircle2,
  Radio,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { Track, ArtistDetails } from '../types/music';
import { fetchArtistFullDetails } from '../services/api';
import { isArtistFollowed, toggleFollowArtist } from '../services/storage';

interface ArtistViewProps {
  artistIdOrName: string;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[]) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onToggleLike: (track: Track) => void;
  likedSongIds: Set<string>;
  onDownloadTrack: (track: Track) => void;
  onBack?: () => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artistIdOrName,
  onPlayTrack,
  onPlayAll,
  currentTrack,
  isPlaying,
  onToggleLike,
  likedSongIds,
  onDownloadTrack,
  onBack,
}) => {
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAllTracks, setShowAllTracks] = useState<boolean>(false);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [showBioModal, setShowBioModal] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    fetchArtistFullDetails(artistIdOrName)
      .then((data) => {
        setArtist(data);
        setIsFollowed(isArtistFollowed(data.name) || isArtistFollowed(data.id));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load artist details:', err);
        setIsLoading(false);
      });
  }, [artistIdOrName]);

  const handleFollowToggle = () => {
    if (!artist) return;
    const nowFollowed = toggleFollowArtist({
      id: artist.id,
      name: artist.name,
      avatarUrl: artist.avatarUrl,
    });
    setIsFollowed(nowFollowed);
  };

  const handlePlayArtistTop = () => {
    if (artist && artist.topTracks.length > 0) {
      onPlayAll(artist.topTracks);
    }
  };

  const isCurrentArtistPlaying =
    isPlaying && currentTrack && artist?.topTracks.some((t) => t.id === currentTrack.id);

  const displayedTracks = showAllTracks
    ? artist?.topTracks || []
    : (artist?.topTracks || []).slice(0, 5);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 h-full bg-[#121212] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-10 animate-spin text-[#1ED760]" />
        <p className="text-sm font-semibold text-[#B3B3B3]">
          Loading Artist Hub & Discography...
        </p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex-1 h-full bg-[#121212] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <p className="text-base text-[#B3B3B3]">Could not load artist profile.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold cursor-pointer"
          >
            Back to Home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-[#181818] via-[#121212] to-[#121212] select-none font-sans scrollbar-thin">
      {/* 1. Cinematic Hero Header */}
      <div className="relative h-72 sm:h-80 md:h-96 w-full flex flex-col justify-between p-6 sm:p-8 overflow-hidden bg-[#181818]">
        {/* Background Image / Banner */}
        {artist.bannerUrl ? (
          <img
            src={artist.bannerUrl}
            alt={artist.name}
            className="absolute inset-0 size-full object-cover object-center"
          />
        ) : artist.avatarUrl ? (
          <div className="absolute inset-0 size-full">
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              className="size-full object-cover blur-md scale-110 opacity-40"
            />
          </div>
        ) : null}

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-black/30" />

        {/* Top Floating Back Button */}
        {onBack && (
          <div className="relative z-10">
            <button
              onClick={onBack}
              className="size-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
          </div>
        )}

        {/* Hero Metadata & Typography */}
        <div className="relative z-10 space-y-2 mt-auto">
          {artist.verified && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow">
              <CheckCircle2 className="size-4 text-[#1ED760] fill-[#1ED760]" />
              <span>Verified Artist</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-xl">
            {artist.name}
          </h1>

          <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow">
            {artist.subscriberCountText || 'Global Creator'} · Official Channel
          </p>
        </div>
      </div>

      {/* 2. Spotify Action Bar */}
      <div className="p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-4">
          {/* 56px Spotify Green Play Button */}
          <button
            onClick={handlePlayArtistTop}
            className="size-14 rounded-full bg-[#1ED760] text-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Play Artist"
          >
            {isCurrentArtistPlaying ? (
              <Pause className="size-6 fill-black" />
            ) : (
              <Play className="size-6 fill-black ml-1" />
            )}
          </button>

          {/* Follow / Following Outline Pill Button */}
          <button
            onClick={handleFollowToggle}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isFollowed
                ? 'border border-[#1ED760] text-[#1ED760] bg-[#1ED760]/10 hover:bg-[#1ED760]/20'
                : 'border border-white/30 text-white hover:border-white hover:scale-105'
            }`}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>

          {/* Artist Radio */}
          <button
            onClick={handlePlayArtistTop}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Radio className="size-4 text-[#1ED760]" />
            <span>Artist Radio</span>
          </button>

          {/* 3-Dots Menu */}
          <button
            onClick={() => setShowBioModal(true)}
            className="size-9 rounded-full text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="More Options / About"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>

        {/* 3. Popular Songs Table (Top 5 / 10) */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Popular
          </h2>

          <div className="space-y-1">
            {displayedTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedSongIds.has(track.id);

              return (
                <div
                  key={track.id + index}
                  onClick={() => onPlayTrack(track)}
                  className={`group flex items-center justify-between p-2.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer ${
                    isCurrent ? 'bg-white/[0.06]' : ''
                  }`}
                >
                  {/* Left: Index / Play Icon & Track Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    {/* Index or Live Equalizer */}
                    <div className="w-6 text-center shrink-0">
                      {isCurrent && isPlaying ? (
                        <Volume2 className="size-4 text-[#1ED760] animate-pulse mx-auto" />
                      ) : (
                        <>
                          <span className="text-sm font-mono text-[#A7A7A7] group-hover:hidden">
                            {index + 1}
                          </span>
                          <Play className="size-3.5 text-white fill-white mx-auto hidden group-hover:block" />
                        </>
                      )}
                    </div>

                    {/* Artwork */}
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-10 rounded object-cover shrink-0 shadow"
                    />

                    {/* Title */}
                    <div className="truncate">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-[#1ED760]' : 'text-white group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-xs text-[#A7A7A7] truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Right Actions: Heart, Download, Duration */}
                  <div className="flex items-center gap-4 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                      }}
                      className={`cursor-pointer transition-transform active:scale-90 ${
                        isLiked
                          ? 'text-[#1ED760]'
                          : 'text-[#B3B3B3] hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
                    >
                      <Heart className={`size-4 ${isLiked ? 'fill-[#1ED760]' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadTrack(track);
                      }}
                      className="text-[#B3B3B3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Download 320kbps"
                    >
                      <Download className="size-4" />
                    </button>

                    <span className="text-xs font-mono text-[#A7A7A7] w-10 text-right">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* See More / Show Less Toggle */}
          {artist.topTracks.length > 5 && (
            <button
              onClick={() => setShowAllTracks(!showAllTracks)}
              className="text-xs font-bold text-[#B3B3B3] hover:text-white uppercase tracking-wider pt-2 transition-colors cursor-pointer"
            >
              {showAllTracks ? 'Show less' : 'See more'}
            </button>
          )}
        </div>

        {/* 4. Discography & Recent Releases Shelf */}
        {artist.latestReleases && artist.latestReleases.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Discography & Recent Releases
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {artist.latestReleases.map((release) => (
                <div
                  key={release.id}
                  onClick={() => onPlayTrack(release)}
                  className="group p-3 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 flex flex-col space-y-3 cursor-pointer shadow-lg relative"
                >
                  <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#242424]">
                    <img
                      src={release.artwork}
                      alt={release.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Floating Green Play Button */}
                    <div className="absolute right-2 bottom-2 size-10 rounded-full bg-[#1ED760] text-black shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                      <Play className="size-4.5 fill-black ml-0.5" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                      {release.title}
                    </h4>
                    <p className="text-xs text-[#A7A7A7] mt-0.5">Latest Release</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Spotify-Authentic "About" Card */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            About
          </h2>

          <div
            onClick={() => setShowBioModal(true)}
            className="group relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-[#181818] cursor-pointer shadow-xl max-w-2xl"
          >
            {/* Background Image */}
            <img
              src={artist.avatarUrl || artist.bannerUrl || artist.topTracks[0]?.artwork}
              alt={artist.name}
              className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 space-y-2 text-white">
              <span className="text-sm font-bold block">
                {artist.subscriberCountText || 'Global Artist'}
              </span>

              {artist.description ? (
                <p className="text-xs sm:text-sm text-[#CCCCCC] line-clamp-3 leading-relaxed">
                  {artist.description}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-[#CCCCCC]">
                  Verified official YouTube creator and recording artist.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio / About Modal */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#242424] max-w-lg w-full rounded-2xl p-6 space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{artist.name}</h3>
              <button
                onClick={() => setShowBioModal(false)}
                className="text-[#B3B3B3] hover:text-white cursor-pointer text-sm font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#B3B3B3] max-h-96 overflow-y-auto pr-2 scrollbar-thin">
              <p className="text-[#1ED760] font-bold">
                {artist.subscriberCountText || 'Verified Artist'}
              </p>
              <p className="leading-relaxed whitespace-pre-line">
                {artist.description || 'No detailed biography provided for this artist.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};