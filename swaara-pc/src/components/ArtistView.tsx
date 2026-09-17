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
      <div className="flex-1 h-full bg-[#080809] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-[#10B981]" />
        <p className="text-xs font-medium text-[#8E8E93]">
          Loading Artist...
        </p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex-1 h-full bg-[#080809] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <p className="text-sm text-[#8E8E93]">Could not load artist profile.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-[#141416] border border-white/[0.08] hover:border-white/20 text-white text-xs font-medium cursor-pointer"
          >
            Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#080809] select-none font-sans scrollbar-thin">
      {/* 1. Cinematic Hero Header */}
      <div className="relative h-64 sm:h-72 md:h-84 w-full flex flex-col justify-between p-6 sm:p-8 overflow-hidden bg-[#0A0A0D]">
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
              className="size-full object-cover blur-md scale-110 opacity-30"
            />
          </div>
        ) : null}

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080809] via-[#080809]/60 to-black/30" />

        {/* Top Floating Back Button */}
        {onBack && (
          <div className="relative z-10">
            <button
              onClick={onBack}
              className="size-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors cursor-pointer border border-white/10"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
          </div>
        )}

        {/* Hero Metadata & Typography */}
        <div className="relative z-10 space-y-1.5 mt-auto">
          {artist.verified && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
              <CheckCircle2 className="size-4 fill-current" />
              <span>Verified Artist</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
            {artist.name}
          </h1>

          <p className="text-xs sm:text-sm text-[#8E8E93] flex items-center gap-2">
            <span>{artist.subscriberCountText || 'Artist'}</span>
          </p>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="p-6 sm:p-8 space-y-7">
        <div className="flex items-center gap-3.5">
          {/* Play Button */}
          <button
            onClick={handlePlayArtistTop}
            className="size-12 rounded-full bg-[#10B981] hover:bg-[#059669] text-black shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Play Artist Top Tracks"
          >
            {isCurrentArtistPlaying ? (
              <Pause className="size-5 fill-black stroke-black" />
            ) : (
              <Play className="size-5 fill-black stroke-black ml-0.5" />
            )}
          </button>

          {/* Follow Button */}
          <button
            onClick={handleFollowToggle}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
              isFollowed
                ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/10'
                : 'border-white/20 text-white hover:border-white'
            }`}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>

          {/* Artist Radio */}
          <button
            onClick={handlePlayArtistTop}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141416] hover:bg-[#1A1A1E] border border-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Radio className="size-3.5 text-[#10B981]" />
            <span>Radio</span>
          </button>

          {/* 3-Dots Menu */}
          <button
            onClick={() => setShowBioModal(true)}
            className="size-8 rounded-full text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer hover:bg-white/[0.04]"
            title="About Artist"
          >
            <MoreHorizontal className="size-4.5" />
          </button>
        </div>

        {/* 3. Popular Songs Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Popular Songs
          </h2>

          <div className="space-y-0.5">
            {displayedTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedSongIds.has(track.id);

              return (
                <div
                  key={track.id + index}
                  onClick={() => onPlayTrack(track)}
                  className={`group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer ${
                    isCurrent ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  {/* Left: Index / Play Icon & Track Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <div className="w-6 text-center shrink-0">
                      {isCurrent && isPlaying ? (
                        <Volume2 className="size-3.5 text-[#10B981] animate-pulse mx-auto" />
                      ) : (
                        <>
                          <span className="text-xs font-mono text-[#71717A] group-hover:hidden">
                            {index + 1}
                          </span>
                          <Play className="size-3 text-white fill-white mx-auto hidden group-hover:block" />
                        </>
                      )}
                    </div>

                    {/* Artwork */}
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="size-9 rounded-lg object-cover shrink-0 bg-[#18181B] border border-white/[0.06]"
                    />

                    {/* Title */}
                    <div className="truncate">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-[#10B981]' : 'text-[#F4F4F5]'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-xs text-[#8E8E93] truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Right Actions: Heart, Download, Duration */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                      }}
                      className={`cursor-pointer transition-colors p-1 ${
                        isLiked
                          ? 'text-[#10B981]'
                          : 'text-[#8E8E93] hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
                    >
                      <Heart className={`size-3.5 ${isLiked ? 'fill-[#10B981]' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadTrack(track);
                      }}
                      className="text-[#8E8E93] hover:text-white opacity-0 group-hover:opacity-100 transition-colors cursor-pointer p-1"
                      title="Download"
                    >
                      <Download className="size-3.5" />
                    </button>

                    <span className="text-xs font-mono text-[#8E8E93] w-10 text-right">
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
              className="text-xs font-semibold text-[#8E8E93] hover:text-white uppercase tracking-wider pt-2 transition-colors cursor-pointer"
            >
              {showAllTracks ? 'Show less' : 'See more'}
            </button>
          )}
        </div>

        {/* 4. Discography */}
        {artist.latestReleases && artist.latestReleases.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Discography
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {artist.latestReleases.map((release) => (
                <div
                  key={release.id}
                  onClick={() => onPlayTrack(release)}
                  className="group p-3 rounded-xl bg-[#111113] hover:bg-[#141416] border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col space-y-2.5 cursor-pointer relative"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#18181B]">
                    <img
                      src={release.artwork}
                      alt={release.title}
                      className="size-full object-cover"
                    />
                    <div className="absolute right-2 bottom-2 size-9 rounded-full bg-[#10B981] text-black shadow-md flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <Play className="size-4 fill-black stroke-black ml-0.5" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-white truncate group-hover:text-[#10B981] transition-colors">
                      {release.title}
                    </h4>
                    <p className="text-[11px] text-[#8E8E93] mt-0.5">Release</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. About Section */}
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            About
          </h2>

          <div
            onClick={() => setShowBioModal(true)}
            className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#111113] border border-white/[0.06] hover:border-white/10 cursor-pointer max-w-xl transition-colors"
          >
            <img
              src={artist.avatarUrl || artist.bannerUrl || artist.topTracks[0]?.artwork}
              alt={artist.name}
              className="absolute inset-0 size-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 space-y-1.5 text-white">
              <span className="text-xs font-semibold text-[#10B981] block">
                {artist.subscriberCountText || 'Artist'}
              </span>

              {artist.description ? (
                <p className="text-xs text-[#CCCCCC] line-clamp-3 leading-relaxed">
                  {artist.description}
                </p>
              ) : (
                <p className="text-xs text-[#CCCCCC]">
                  Recording artist and composer.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio / About Modal */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#141416] max-w-lg w-full rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{artist.name}</h3>
              <button
                onClick={() => setShowBioModal(false)}
                className="text-[#8E8E93] hover:text-white cursor-pointer text-xs font-medium"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#8E8E93] max-h-80 overflow-y-auto pr-2 scrollbar-thin">
              <p className="text-[#10B981] font-medium">
                {artist.subscriberCountText || 'Artist'}
              </p>
              <p className="leading-relaxed whitespace-pre-line">
                {artist.description || 'No biography available.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};