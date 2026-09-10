import { Track, SyncedLyricLine, SongInsights, ListenerComment } from '../types/music';
import { SearchExtractor } from './newpipe/extractors/search';
import { StreamExtractor } from './newpipe/extractors/stream';
import { TranscriptExtractor } from './newpipe/services/youtube/transcript';
import { CommentsExtractor } from './newpipe/extractors/comments';
import { ChannelExtractor } from './newpipe/extractors/channel';
import { parseDurationToSeconds } from './newpipe/utils/helper';

function cleanTrackTitle(title: string): { cleanTitle: string; artistGuess?: string } {
  let cleaned = title
    .replace(/\(Official.*?\)|\[Official.*?\]/gi, '')
    .replace(/\(Audio.*?\)|\[Audio.*?\]/gi, '')
    .replace(/\(Lyric.*?\)|\[Lyric.*?\]/gi, '')
    .replace(/\(Video.*?\)|\[Video.*?\]/gi, '')
    .replace(/\(Full Song.*?\)|\[Full Song.*?\]/gi, '')
    .replace(/\(HD.*?\)|\[HD.*?\]/gi, '')
    .replace(/\(4K.*?\)|\[4K.*?\]/gi, '')
    .replace(/\|\s*YouTube Music/gi, '')
    .trim();

  // If title has "Artist - Title" format
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    if (parts.length >= 2) {
      return {
        cleanTitle: parts.slice(1).join(' - ').trim(),
        artistGuess: parts[0].trim(),
      };
    }
  }

  return { cleanTitle: cleaned };
}

// Search tracks via YouTube NewPipe Extractor
export async function searchMusic(query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  try {
    const result = await SearchExtractor.search(query, { type: 'video' });
    const items = result.items || [];

    const tracks: Track[] = [];
    for (const item of items) {
      if (item.type !== 'video') continue;

      const { cleanTitle, artistGuess } = cleanTrackTitle(item.title);
      const artist = artistGuess || item.uploader?.name?.replace(/ - Topic$/i, '') || 'YouTube Artist';
      const durationSecs = parseDurationToSeconds(item.durationText || '3:30');

      // Best thumbnail
      const bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

      tracks.push({
        id: item.id,
        title: cleanTitle,
        artist: artist,
        duration: durationSecs,
        artwork: bestThumb,
        source: 'youtube',
        bitrate: '320 kbps',
      });
    }

    return tracks;
  } catch (err) {
    console.error('YouTube NewPipe search failed:', err);
    return [];
  }
}

// Resolve direct audio stream using NewPipe Stream Extractor (VisionOS unthrottled pipeline)
export async function resolveTrackStream(track: Track): Promise<Track> {
  if (track.streamUrl) return track;

  try {
    const streamInfo = await StreamExtractor.extract(track.id);

    // Audio streams sorted by highest bitrate
    const audioStreams = streamInfo.audioStreams || [];
    if (audioStreams.length > 0) {
      // Prefer m4a or opus with highest bitrate
      const sorted = [...audioStreams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      const best = sorted[0];

      track.streamUrl = best.url;
      track.duration = streamInfo.duration || track.duration;
      const kbps = Math.round((best.bitrate || 160000) / 1000);
      track.bitrate = `${kbps} kbps`;
      if (streamInfo.thumbnails && streamInfo.thumbnails.length > 0) {
        track.artwork = streamInfo.thumbnails[streamInfo.thumbnails.length - 1].url;
      }
      return track;
    }

    // Fallback if no separate audio stream: check videoStreams that contain audio
    const combined = (streamInfo.videoStreams || []).filter((v) => v.type === 'video_audio');
    if (combined.length > 0) {
      track.streamUrl = combined[0].url;
      track.duration = streamInfo.duration || track.duration;
      track.bitrate = '128 kbps';
      return track;
    }
  } catch (err) {
    console.error('Failed to extract audio stream via NewPipe:', err);
  }

  return track;
}

// Fetch YouTube Transcripts as Synchronized Karaoke Lyrics
export async function fetchLyrics(trackId: string): Promise<{ text: string; synced: SyncedLyricLine[] }> {
  try {
    const segments = await TranscriptExtractor.getTranscript(trackId);
    if (segments && segments.length > 0) {
      const synced: SyncedLyricLine[] = segments.map((seg) => ({
        time: seg.startMs / 1000,
        text: seg.text,
      }));

      const text = segments.map((s) => s.text).join('\n');
      return { text, synced };
    }
  } catch (err) {
    console.warn('No transcript found for video:', trackId);
  }

  return { text: '', synced: [] };
}

// Fetch Comprehensive Song Insights: Metadata, Views, Top Listener Comments & Recommended Tracks
export async function fetchSongInsights(trackId: string): Promise<SongInsights> {
  const result: SongInsights = {
    relatedTracks: [],
    comments: [],
  };

  try {
    // 1. Fetch Stream info (which includes related videos and rich metadata)
    const streamInfo = await StreamExtractor.extract(trackId);
    result.viewCountText = streamInfo.viewCount ? `${streamInfo.viewCount.toLocaleString()} views` : undefined;
    result.uploadDate = streamInfo.uploadDate || undefined;
    result.description = streamInfo.description || undefined;
    result.channelName = streamInfo.uploader?.name || undefined;
    result.channelId = streamInfo.uploader?.id || (streamInfo.uploader?.url ? streamInfo.uploader.url.split('/').pop() : undefined);

    // Map related videos into Track[]
    if (streamInfo.relatedVideos && streamInfo.relatedVideos.length > 0) {
      result.relatedTracks = streamInfo.relatedVideos.slice(0, 15).map((v) => {
        const { cleanTitle, artistGuess } = cleanTrackTitle(v.title);
        const artist = artistGuess || v.uploaderName || 'YouTube Artist';
        const bestThumb = v.thumbnails?.[v.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

        return {
          id: v.id,
          title: cleanTitle,
          artist: artist,
          duration: parseDurationToSeconds(v.duration || '3:30'),
          artwork: bestThumb,
          source: 'youtube',
          bitrate: '320 kbps',
        };
      });
    }

    // 2. Fetch Top Comments via CommentsExtractor
    try {
      const commentsData = await CommentsExtractor.getComments(trackId);
      if (commentsData && commentsData.comments) {
        result.comments = commentsData.comments.slice(0, 20).map((c) => ({
          id: c.id,
          author: c.authorName,
          authorAvatar: c.authorAvatarUrl,
          text: c.content,
          likeCount: c.likeCountText || undefined,
          publishedTime: c.publishedTimeText || undefined,
        }));
      }
    } catch (commentErr) {
      console.warn('Could not load comments for video:', trackId);
    }
  } catch (err) {
    console.warn('Error fetching song insights:', err);
  }

  return result;
}

// Fetch Artist Profile Details
export async function fetchArtistProfile(channelIdOrHandle: string) {
  try {
    const channelInfo = await ChannelExtractor.extract(channelIdOrHandle);
    return channelInfo;
  } catch (err) {
    console.error('Failed to extract artist channel:', err);
    return null;
  }
}

// Language Discovery Matrices using YouTube Music searches
export const LANGUAGE_MATRICES = [
  { id: 'kannada', name: 'Kannada', script: 'ಕನ್ನಡ', query: 'Top Kannada Songs Official Audio' },
  { id: 'hindi', name: 'Hindi', script: 'हिन्दी', query: 'Bollywood Top Music Hits 2026 Audio' },
  { id: 'english', name: 'English', script: 'Global', query: 'Top Global Pop Hits 2026' },
  { id: 'punjabi', name: 'Punjabi', script: 'ਪੰਜਾਬੀ', query: 'Latest Punjabi Hits Music Tracks' },
  { id: 'tamil', name: 'Tamil', script: 'தமிழ்', query: 'Latest Tamil Hits Anirudh Audio' },
  { id: 'telugu', name: 'Telugu', script: 'తెలుగు', query: 'Top Telugu Songs Audio Hits' },
  { id: 'malayalam', name: 'Malayalam', script: 'മലയാളം', query: 'Top Malayalam Melody Songs Audio' },
  { id: 'lofi', name: 'Lo-Fi Vibe', script: 'Chill', query: 'Bollywood Lofi Chill Midnight Remix' },
];

export async function fetchMatrixTracks(query: string): Promise<Track[]> {
  return searchMusic(query);
}
