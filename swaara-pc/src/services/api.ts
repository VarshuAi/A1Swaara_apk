import { Track, SyncedLyricLine, SongInsights, ListenerComment, ArtistDetails, ArtistSearchResult, ArtistReleaseItem } from '../types/music';
import { YTMusicExtractor } from './newpipe/extractors/ytmusic';
import { SearchExtractor } from './newpipe/extractors/search';
import { StreamExtractor } from './newpipe/extractors/stream';
import { TranscriptExtractor } from './newpipe/services/youtube/transcript';
import { CommentsExtractor } from './newpipe/extractors/comments';
import { ChannelExtractor } from './newpipe/extractors/channel';
import { parseDurationToSeconds } from './newpipe/utils/helper';
import { getLyricsForTrack } from './lyricsService';

export function formatListenerCount(rawText?: string): string {
  if (!rawText) return 'Verified Artist';
  // Strip "· X videos", "• X videos", etc.
  const base = rawText.split('•')[0].split('·')[0].trim();
  const replaced = base
    .replace(/subscribers?/gi, 'Monthly Listeners')
    .replace(/subscriber/gi, 'Listener')
    .replace(/channel/gi, '')
    .trim();
  return replaced || 'Verified Artist';
}

export function cleanArtistName(rawArtist?: string): string {
  if (!rawArtist) return 'Studio Artist';
  let cleaned = rawArtist
    .replace(/ - Topic$/i, '')
    .replace(/\s+VEVO$/i, '')
    .replace(/\s+Official(?:\s+Channel)?$/i, '')
    .replace(/\s+Recordings$/i, '')
    .replace(/\s+Music$/i, '')
    .replace(/\s+(?:YouTube|YT|Channel)$/i, '')
    .trim();

  // If contains comma or ampersand, clean each artist part
  if (cleaned.includes(',') || cleaned.includes('&')) {
    const parts = cleaned.split(/[,&]/).map((p) =>
      p
        .replace(/ - Topic$/i, '')
        .replace(/\s+VEVO$/i, '')
        .replace(/\s+(?:YouTube|YT|Channel)$/i, '')
        .trim()
    ).filter(Boolean);

    // Deduplicate and re-join
    const unique = Array.from(new Set(parts));
    if (unique.length > 0) {
      return unique.join(', ');
    }
  }

  return cleaned || 'Studio Artist';
}

export function cleanTrackTitle(title: string): { cleanTitle: string; artistGuess?: string; albumGuess?: string } {
  if (!title) return { cleanTitle: 'Unknown Track' };

  let cleaned = title;
  let albumGuess: string | undefined;
  let artistGuess: string | undefined;

  // 1. Extract movie / soundtrack tag if present: e.g. (From "Leo") or [From 'Brahmastra'] or - From KGF
  const fromMatch = cleaned.match(/(?:[\(\[]|\s*-\s*|\s*\|\s*)From\s+["']?([^"'\]\)]+?)["']?(?:[\)\]]|\s*-\s*|\s*\|\s*|$)/i);
  if (fromMatch && fromMatch[1]) {
    albumGuess = fromMatch[1].trim();
    cleaned = cleaned.replace(fromMatch[0], ' ');
  }

  // 2. Strip bracketed or parenthesized video / promotional tags
  cleaned = cleaned
    .replace(/[\(\[]\s*(?:Official\s*(?:Music\s*)?(?:Video|Audio|Song|Visualizer|Lyric\s*Video|Lyrical|Teaser|Trailer|Promo)?|Full\s*(?:Song|Video|Audio)?|Lyric\s*Video|Lyrical(?:\s*Video)?|Music\s*Video|Video\s*Song|Audio\s*Song|4K(?:\s*UHD)?|8K|HD|HQ|1080p|Visualizer|Teaser|Trailer|Promo|Original\s*(?:Audio|Song|Motion\s*Picture\s*Soundtrack)|Performance\s*Video|Live\s*Performance|Studio\s*Version|Slowed(?:\s*\+\s*Reverb)?|Reverb|Bass\s*Boosted|Remastered(?:\s*\d{4})?).*?[\)\]]/gi, '')
    // 3. Strip trailing record label or channel promo pipes
    .replace(/\|\s*(?:T-Series|Zee Music(?:\s*Company)?|Sony Music(?:\s*(?:India|South))?|Aditya Music|Tips Official|Saregama(?:\s*Music)?|Speed Records|YRF|Lahari Music|Anand Audio|YouTube Music|YouTube|YT Music|YT|NewPipe|Think Music(?:\s*India)?|SVF|Junglee Music|Eros Now|Times Music|Muzik247|Divo|Speed Punjabi|Geetha Arts|Star Maa|Star Suvarna|Zee Kannada|Colors Kannada).*?$/gi, '')
    .replace(/\|\s*(?:Official|Full|Video|Audio|Lyrical|Lyrical Video|HD|4K|8K).*?$/gi, '')
    .replace(/\b(?:YouTube\s*Music|YouTube|YT\s*Music)\b/gi, '')
    .replace(/\/\/\s*.*$/gi, '');

  // 4. Strip multi-pipe Bollywood / Tollywood / Sandalwood cast dumps in title (e.g. "| Ranbir Kapoor | Alia Bhatt | Pritam")
  if (cleaned.includes(' | ')) {
    const pipeParts = cleaned.split(/\s*\|\s*/);
    cleaned = pipeParts[0].trim();
  }

  // 5. If title has "Artist - Title" format
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    if (parts.length === 2) {
      artistGuess = cleanArtistName(parts[0].trim());
      cleaned = parts[1].trim();
    }
  }

  // 6. Strip trailing artifacts like "- Audio Song", "Video Song", etc.
  cleaned = cleaned
    .replace(/(?:-\s*)?(?:Audio\s*Song|Video\s*Song|Lyrical\s*Song|Full\s*Song)$/i, '')
    .replace(/^["'“”]/, '')
    .replace(/["'“”]$/, '')
    .replace(/[-|:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { cleanTitle: cleaned || title, artistGuess, albumGuess };
}

// Blacklist filter to reject non-song video compilations & noise
const VIDEO_NOISE_REGEX =
  /\b(?:jukebox|compilation|all\s+songs|full\s+album|non\s*stop|audio\s+jukebox|mega\s*mix|all\s+hit\s+songs|full\s+movie|trailer|teaser|dialogue|interview|podcast|scene|episode|ep\s*\d+|reaction)\b/i;

// Search official tracks via YouTube Music API (WEB_REMIX songs catalog)
export async function searchMusic(query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  try {
    // 1. Primary Engine: YouTube Music (WEB_REMIX) official songs only
    const ytmTracks = await YTMusicExtractor.searchSongs(query);
    if (ytmTracks && ytmTracks.length > 0) {
      return ytmTracks.map((t) => {
        const { cleanTitle, artistGuess, albumGuess } = cleanTrackTitle(t.title);
        return {
          ...t,
          title: cleanTitle,
          artist: artistGuess || cleanArtistName(t.artist),
          album: t.album || albumGuess,
          artwork: YTMusicExtractor.getHighResImage(t.artwork, 600, 600) || t.artwork,
        };
      });
    }

    // 2. Fallback Engine: Strictly filtered individual song tracks
    const result = await SearchExtractor.search(`${query} audio song`, { type: 'video' });
    const items = result.items || [];

    const tracks: Track[] = [];
    for (const item of items) {
      if (item.type !== 'video') continue;
      if (VIDEO_NOISE_REGEX.test(item.title)) continue;

      const durationSecs = parseDurationToSeconds(item.durationText || '3:30');
      // Strictly filter out long videos/jukeboxes (> 8 mins) or tiny clips (< 40s)
      if (durationSecs > 480 || (durationSecs > 0 && durationSecs < 40)) continue;

      const { cleanTitle, artistGuess, albumGuess } = cleanTrackTitle(item.title);
      const artist = artistGuess || cleanArtistName(item.uploader?.name) || 'Studio Artist';

      const rawThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
      const artwork = YTMusicExtractor.getHighResImage(rawThumb, 600, 600) || rawThumb;

      tracks.push({
        id: item.id,
        title: cleanTitle,
        artist: artist,
        album: albumGuess,
        duration: durationSecs || 210,
        artwork: artwork,
        source: 'swaara',
        bitrate: '320 kbps',
      });
    }

    return tracks;
  } catch (err) {
    console.error('Lossless search error:', err);
    return [];
  }
}

// Fetch YouTube Music live autocomplete suggestions
export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  return YTMusicExtractor.getSearchSuggestions(query);
}

// Fetch YouTube Music infinite radio queue for a song
export async function fetchRadioTracks(videoId: string): Promise<Track[]> {
  const tracks = await YTMusicExtractor.getRadioTracks(videoId);
  return tracks.map((t) => {
    const { cleanTitle, artistGuess, albumGuess } = cleanTrackTitle(t.title);
    return {
      ...t,
      title: cleanTitle,
      artist: artistGuess || cleanArtistName(t.artist),
      album: t.album || albumGuess,
      artwork: YTMusicExtractor.getHighResImage(t.artwork, 600, 600) || t.artwork,
    };
  });
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
      track.bitrate = '320 kbps High Fidelity';
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
      track.bitrate = '320 kbps High Fidelity';
      return track;
    }
  } catch (err) {
    console.error('Failed to extract studio lossless stream:', err);
  }

  return track;
}

// Multi-Tiered Synchronized Karaoke & Plain Lyrics Fetcher
export async function fetchLyrics(
  trackOrId: Track | string,
  artistName?: string,
  durationSecs?: number
): Promise<{ text: string; synced: SyncedLyricLine[]; isSynced?: boolean; provider?: string }> {
  if (typeof trackOrId === 'string') {
    return getLyricsForTrack({
      id: trackOrId,
      title: trackOrId,
      artist: artistName || '',
      duration: durationSecs,
    });
  }
  return getLyricsForTrack(trackOrId);
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
        const artist = artistGuess || cleanArtistName(v.uploaderName) || 'Independent Artist';
        const bestThumb = v.thumbnails?.[v.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

        return {
          id: v.id,
          title: cleanTitle,
          artist: artist,
          duration: parseDurationToSeconds(v.duration || '3:30'),
          artwork: bestThumb,
          source: 'swaara',
          bitrate: '320 kbps',
        };
      });
    }

    // Fallback if relatedVideos is empty: search for similar tracks by uploader or title
    if (!result.relatedTracks || result.relatedTracks.length === 0) {
      try {
        const recQuery = streamInfo.uploader?.name
          ? `${streamInfo.uploader.name} songs`
          : cleanTrackTitle(streamInfo.title).cleanTitle;
        const recs = await searchMusic(recQuery);
        result.relatedTracks = recs.filter((t) => t.id !== trackId).slice(0, 15);
      } catch (recErr) {
        console.warn('Fallback recommendations search failed:', recErr);
      }
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
    if (channelInfo && channelInfo.subscriberCountText) {
      channelInfo.subscriberCountText = formatListenerCount(channelInfo.subscriberCountText);
    }
    return channelInfo;
  } catch (err) {
    console.error('Failed to extract artist profile:', err);
    return null;
  }
}

// Search artists using YouTube Music ViMusic InnerTube filter
export async function searchArtists(query: string): Promise<ArtistSearchResult[]> {
  return YTMusicExtractor.searchArtists(query);
}

// Get real artist avatar photo for any artist name
export async function getRealArtistAvatar(artistName: string): Promise<string | undefined> {
  try {
    const results = await YTMusicExtractor.searchArtists(artistName);
    return results[0]?.avatarUrl;
  } catch {
    return undefined;
  }
}

// Fetch Comprehensive Artist Profile, Real Images, Top Songs & Discography
export async function fetchArtistFullDetails(artistNameOrChannelId: string): Promise<ArtistDetails> {
  const isBrowseId =
    (artistNameOrChannelId.startsWith('UC') || artistNameOrChannelId.startsWith('MPRE')) &&
    artistNameOrChannelId.length >= 20;

  let browseId = isBrowseId ? artistNameOrChannelId : '';
  let artistName = isBrowseId ? '' : artistNameOrChannelId;
  let resolvedAvatarUrl: string | undefined;

  // 1. If not already a browseId, search YouTube Music for the verified artist
  if (!browseId) {
    try {
      const searchArtistsResults = await YTMusicExtractor.searchArtists(artistNameOrChannelId);
      if (searchArtistsResults.length > 0) {
        const topMatch = searchArtistsResults[0];
        browseId = topMatch.browseId;
        artistName = topMatch.name;
        resolvedAvatarUrl = topMatch.avatarUrl;
      }
    } catch (err) {
      console.warn('YTM artist search lookup failed:', err);
    }
  }

  // 2. Fetch full details using the ViMusic browse endpoint
  let ytmDetails: ArtistDetails | null = null;
  if (browseId) {
    try {
      ytmDetails = await YTMusicExtractor.getArtistDetails(browseId);
      if (ytmDetails?.name) {
        artistName = ytmDetails.name;
      }
    } catch (err) {
      console.warn('YTM getArtistDetails failed, falling back:', err);
    }
  }

  // 3. Fallback or additional top songs if needed
  let topTracks: Track[] = ytmDetails?.topTracks || [];
  if (topTracks.length < 10) {
    try {
      const extraTracks = await searchMusic(`${artistName || artistNameOrChannelId} official songs`);
      const existingIds = new Set(topTracks.map((t) => t.id));
      for (const t of extraTracks) {
        if (!existingIds.has(t.id)) {
          existingIds.add(t.id);
          topTracks.push({ ...t, artist: artistName || t.artist });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch additional tracks:', err);
    }
  }

  const finalAvatar =
    resolvedAvatarUrl ||
    ytmDetails?.avatarUrl ||
    (ytmDetails?.bannerUrl ? YTMusicExtractor.getHighResImage(ytmDetails.bannerUrl, 600, 600) : undefined) ||
    topTracks[0]?.artwork;

  return {
    id: browseId || `artist-${encodeURIComponent(artistName || artistNameOrChannelId)}`,
    name: artistName || artistNameOrChannelId,
    avatarUrl: finalAvatar,
    bannerUrl: ytmDetails?.bannerUrl,
    subscriberCountText: formatListenerCount(ytmDetails?.subscriberCountText),
    verified: true,
    description: ytmDetails?.description,
    topTracks: topTracks.slice(0, 20),
    latestReleases: (ytmDetails?.singles && ytmDetails.singles.length > 0
      ? ytmDetails.singles
      : ytmDetails?.albums || []) as any,
    albums: ytmDetails?.albums || [],
    singles: ytmDetails?.singles || [],
    similarArtists: ytmDetails?.similarArtists || [],
  };
}

// Language Discovery Matrices using YouTube Music searches
export const LANGUAGE_MATRICES = [
  { id: 'kannada', name: 'Kannada', script: 'ಕನ್ನಡ', query: 'Top Kannada Songs Hits' },
  { id: 'hindi', name: 'Hindi', script: 'हिन्दी', query: 'Bollywood Top Hits' },
  { id: 'english', name: 'English', script: 'Global', query: 'Global Pop Hits 2026' },
  { id: 'punjabi', name: 'Punjabi', script: 'ਪੰਜਾਬੀ', query: 'Latest Punjabi Hits' },
  { id: 'tamil', name: 'Tamil', script: 'தமிழ்', query: 'Tamil Top Hits Songs' },
  { id: 'telugu', name: 'Telugu', script: 'తెలుగు', query: 'Top Telugu Songs' },
  { id: 'malayalam', name: 'Malayalam', script: 'മലയാളം', query: 'Malayalam Melody Hits' },
  { id: 'lofi', name: 'Lo-Fi Vibe', script: 'Chill', query: 'Lofi Chill Indian Hits' },
];

export async function fetchMatrixTracks(query: string): Promise<Track[]> {
  return searchMusic(query);
}
