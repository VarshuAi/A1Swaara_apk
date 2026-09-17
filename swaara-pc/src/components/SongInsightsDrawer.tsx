import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Heart,
  Eye,
  Calendar,
  Sparkles,
  MessageSquare,
  Radio,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Users,
  Music,
} from 'lucide-react';
import { Track, SongInsights } from '../types/music';
import { fetchSongInsights, fetchArtistProfile } from '../services/api';

interface SongInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onPlayTrack: (track: Track) => void;
  onOpenArtist?: (artistName: string) => void;
}

export const SongInsightsDrawer: React.FC<SongInsightsDrawerProps> = ({
  isOpen,
  onClose,
  track,
  onPlayTrack,
  onOpenArtist,
}) => {
  const [insights, setInsights] = useState<SongInsights | null>(null);
  const [channelDetails, setChannelDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'related'>('overview');

  useEffect(() => {
    if (!isOpen || !track?.id) {
      return;
    }

    setIsLoading(true);
    setChannelDetails(null);
    fetchSongInsights(track.id)
      .then((data) => {
        setInsights(data);
        setIsLoading(false);
        if (data.channelId) {
          fetchArtistProfile(data.channelId)
            .then((ch) => {
              if (ch) setChannelDetails(ch);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load song insights:', err);
        setIsLoading(false);
      });
  }, [isOpen, track?.id]);

  if (!isOpen || !track) return null;

  return (
    <aside className="w-80 md:w-96 h-full bg-[#121212] border-l border-[#242424] flex flex-col justify-between select-none z-30 font-sans shadow-2xl animate-slideLeft">
      {/* Top Header */}
      <div className="p-4 border-b border-[#242424] flex items-center justify-between">
        <h3 className="text-sm font-bold text-white truncate max-w-[240px]">
          {track.title}
        </h3>
        <button
          onClick={onClose}
          className="size-8 rounded-full hover:bg-white/10 text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="size-4.5" />
        </button>
      </div>

      {/* Segmented Switcher */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-[#181818] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#282828] text-white'
              : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'comments'
              ? 'bg-[#282828] text-white'
              : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          <span>Comments</span>
          {insights?.comments?.length ? (
            <span className="text-[10px] px-1 rounded-full bg-[#333] text-[#1ED760]">
              {insights.comments.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('related')}
          className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
            activeTab === 'related'
              ? 'bg-[#282828] text-white'
              : 'text-[#B3B3B3] hover:text-white'
          }`}
        >
          Recommended
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#B3B3B3] space-y-3">
            <Loader2 className="size-8 animate-spin text-[#1ED760]" />
            <p className="text-xs font-medium">Analyzing Song Insights & Community Pulse...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Large Album Artwork Card */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-2xl bg-[#181818]">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="size-full object-cover"
                  />
                </div>

                {/* Track Info */}
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    {track.title}
                  </h2>
                  <p className="text-sm font-medium text-[#B3B3B3] mt-0.5">
                    {track.artist}
                  </p>
                </div>

                {/* Studio Streaming Analytics Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] text-[#A7A7A7] uppercase font-bold flex items-center gap-1">
                      <Eye className="size-3 text-[#1ED760]" />
                      Total Views
                    </span>
                    <p className="text-sm font-bold text-white">
                      {insights?.viewCountText || 'Streaming HQ'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.04] space-y-1">
                    <span className="text-[10px] text-[#A7A7A7] uppercase font-bold flex items-center gap-1">
                      <Calendar className="size-3 text-[#1ED760]" />
                      Uploaded
                    </span>
                    <p className="text-sm font-bold text-white truncate">
                      {insights?.uploadDate || 'Official Release'}
                    </p>
                  </div>
                </div>

                {/* About the Artist / Channel Card (Spotify Signature Spec) */}
                <div className="p-4 rounded-xl bg-[#181818] border border-white/[0.04] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      About The Artist
                    </span>
                    {onOpenArtist && (
                      <button
                        onClick={() => {
                          const target = channelDetails?.id || channelDetails?.name || insights?.channelName || track.artist;
                          if (target) onOpenArtist(target);
                        }}
                        className="text-[11px] font-bold text-[#1ED760] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Profile</span>
                        <ExternalLink className="size-3" />
                      </button>
                    )}
                  </div>

                  {channelDetails?.bannerUrl && (
                    <div className="w-full h-24 rounded-lg overflow-hidden relative">
                      <img src={channelDetails.bannerUrl} alt="Banner" className="size-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent opacity-80" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <div className="size-12 rounded-full overflow-hidden bg-[#282828] shrink-0 border border-white/10">
                      <img
                        src={channelDetails?.avatarUrl || track.artwork}
                        alt={track.artist}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="truncate flex-1">
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                        <span>{channelDetails?.name || insights?.channelName || track.artist}</span>
                        <CheckCircle2 className="size-3.5 text-[#1ED760] shrink-0" />
                      </h4>
                      <p className="text-xs text-[#B3B3B3] mt-0.5">
                        {channelDetails?.subscriberCountText ? `${channelDetails.subscriberCountText}` : 'Verified Artist Channel'}
                      </p>
                    </div>
                  </div>

                  {(channelDetails?.description || insights?.description) && (
                    <p className="text-xs text-[#A7A7A7] leading-relaxed line-clamp-3 pt-1">
                      {channelDetails?.description || insights?.description}
                    </p>
                  )}
                </div>

                {/* Audio Engine Specs */}
                <div className="p-3 rounded-lg bg-[#181818] flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#A7A7A7] font-mono uppercase">Audio Quality</span>
                    <p className="font-bold text-white">Opus 48kHz · 320 kbps</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#1ED760]/20 text-[#1ED760] font-mono text-[10px] font-bold">
                    UNTHROTTLED
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: LISTENER COMMENTS (Powered by CommentsExtractor) */}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Listener Discussion
                  </h4>
                  <span className="text-xs text-[#1ED760] font-semibold">Live Community Pulse</span>
                </div>

                {insights?.comments && insights.comments.length > 0 ? (
                  <div className="space-y-3">
                    {insights.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-lg bg-[#181818] border border-white/[0.04] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            {comment.authorAvatar ? (
                              <img
                                src={comment.authorAvatar}
                                alt={comment.author}
                                className="size-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="size-6 rounded-full bg-[#282828] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                                {comment.author[0] || 'U'}
                              </div>
                            )}
                            <span className="font-bold text-xs text-white truncate">
                              {comment.author}
                            </span>
                          </div>
                          {comment.publishedTime && (
                            <span className="text-[10px] text-[#6A6A6A] shrink-0 font-mono">
                              {comment.publishedTime}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#B3B3B3] leading-relaxed break-words">
                          {comment.text}
                        </p>

                        {comment.likeCount && (
                          <div className="flex items-center gap-1 text-[10px] text-[#A7A7A7] pt-0.5 font-mono">
                            <span>👍</span>
                            <span>{comment.likeCount}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-[#A7A7A7] space-y-2">
                    <MessageSquare className="size-8 mx-auto text-[#4D4D4D]" />
                    <p className="text-xs">No comments available for this stream</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RECOMMENDED RELATED TRACKS (Powered by StreamExtractor.relatedVideos) */}
            {activeTab === 'related' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recommended Next
                  </h4>
                  <span className="text-xs text-[#1ED760] font-semibold">Infinite Radio</span>
                </div>

                {insights?.relatedTracks && insights.relatedTracks.length > 0 ? (
                  <div className="space-y-1">
                    {insights.relatedTracks.map((relTrack, i) => (
                      <div
                        key={relTrack.id + i}
                        onClick={() => onPlayTrack(relTrack)}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-[#282828] transition-colors cursor-pointer group"
                      >
                        <div className="relative size-11 rounded overflow-hidden shrink-0 bg-[#282828]">
                          <img
                            src={relTrack.artwork}
                            alt={relTrack.title}
                            className="size-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="size-4 text-white fill-white" />
                          </div>
                        </div>

                        <div className="truncate flex-1">
                          <p className="font-semibold text-xs text-white group-hover:text-[#1ED760] transition-colors truncate">
                            {relTrack.title}
                          </p>
                          <p className="text-[11px] text-[#B3B3B3] truncate mt-0.5">
                            {relTrack.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-[#A7A7A7] space-y-2">
                    <Radio className="size-8 mx-auto text-[#4D4D4D]" />
                    <p className="text-xs">No related tracks returned</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
