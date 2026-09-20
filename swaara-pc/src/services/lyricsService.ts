/**
 * A1 Swaara Pro Lyrics Engine
 * Multi-tiered Synchronized & Plain Lyrics Aggregator
 * 
 * Sources:
 * 1. LRCLIB (Millions of Synced LRC & Plain lyrics, multi-lingual)
 * 2. JioSaavn Official API (Comprehensive Indian regional languages: Kannada, Hindi, Telugu, Tamil, Punjabi, Malayalam, etc.)
 * 3. Lyrics.ovh (Western / International pop, rock, indie)
 * 4. YouTube CC / Transcripts (All available subtitle tracks)
 * 5. Smart Pacing Engine: Automatically generates synchronized karaoke timestamps for plain lyrics
 */

import { Track, SyncedLyricLine } from '../types/music';
import { TranscriptExtractor } from './newpipe/services/youtube/transcript';

export interface LyricsResult {
  text: string;
  synced: SyncedLyricLine[];
  isSynced: boolean; // true if authentic LRC timestamps; false if smart paced
  provider?: string;
}

// In-memory LRU cache to prevent re-fetching on song replay
const lyricsCache = new Map<string, LyricsResult>();

/**
 * Strips noise, bracketed tags, version tags, and video artifacts from track titles
 * Example: "Onde Samane (Version 1)" -> "Onde Samane"
 * Example: "Kesariya - From 'Brahmastra'" -> "Kesariya"
 * Example: "295 (Official Audio)" -> "295"
 */
export function cleanTitleForLyrics(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*[\(\[](?:official|audio|video|music video|lyric|lyrics|full song|version \d+|remastered|hd|4k|from "[^"]*"|from '[^']*'|soundtrack|ost|audio song).*?[\)\]]/gi, '')
    .replace(/\s*-\s*(?:from|official|audio|video|lyrical).*$/gi, '')
    .replace(/\s*\|.*$/g, '')
    .replace(/\s*-\s*Single$/gi, '')
    .trim();
}

/**
 * Extracts primary artist name for search queries
 * Example: "Shreya Ghoshal, Sadhu Kokila" -> "Shreya Ghoshal"
 */
export function cleanArtistForLyrics(rawArtist: string): string {
  if (!rawArtist) return '';
  const first = rawArtist.split(/[,&/|]/)[0].trim();
  return first.replace(/\s*(?:feat\.|ft\.|x\s|vs\s).*$/gi, '').trim();
}

/**
 * Parses standard LRC timestamps: [mm:ss.xx] or [mm:ss.xxx] or [mm:ss] into SyncedLyricLine[]
 */
export function parseLrc(lrcContent: string): SyncedLyricLine[] {
  if (!lrcContent) return [];
  const lines = lrcContent.split(/\r?\n/);
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip metadata headers: [ar: ...], [ti: ...], [al: ...], etc.
    if (/^\[[a-z]{2,8}:.*\]$/i.test(trimmed)) continue;

    let match: RegExpExecArray | null;
    const timestamps: number[] = [];
    timeRegex.lastIndex = 0;

    let textIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      timestamps.push(minutes * 60 + seconds + millis);
      textIndex = timeRegex.lastIndex;
    }

    const text = trimmed.slice(textIndex).trim();
    if (timestamps.length > 0 && text) {
      for (const t of timestamps) {
        result.push({ time: Math.round(t * 100) / 100, text });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Smart Lyric Pacer:
 * Generates natural, timed karaoke lines from plain lyrics across the track's duration.
 * Accounts for song intro and outro buffers, weighting lines by character count.
 */
export function generateTimedLyricsFromPlain(plainText: string, durationSecs = 240): SyncedLyricLine[] {
  const rawLines = plainText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[.+\]$/.test(l));

  if (rawLines.length === 0) return [];

  const duration = durationSecs > 30 ? durationSecs : 240;
  const intro = Math.min(16, duration * 0.06);
  const outro = Math.min(14, duration * 0.05);
  const activeDuration = Math.max(30, duration - intro - outro);

  const weights = rawLines.map((l) => Math.max(8, Math.min(100, l.length)));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let currentSec = intro;
  const result: SyncedLyricLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    result.push({
      time: Math.round(currentSec * 10) / 10,
      text: rawLines[i],
    });
    const lineDuration = (weights[i] / totalWeight) * activeDuration;
    currentSec += lineDuration;
  }

  return result;
}

/**
 * Fetch helper with timeout
 */
async function fetchWithTimeout(url: string, headers: Record<string, string> = {}, timeoutMs = 5000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) A1Swaara/1.0.0',
        ...headers,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * 1. LRCLIB Provider
 */
async function fetchFromLrclib(title: string, artist: string, duration?: number): Promise<LyricsResult | null> {
  const cleanTitle = cleanTitleForLyrics(title);
  const cleanArtist = cleanArtistForLyrics(artist);

  // 1a. Try exact GET match
  if (cleanTitle && cleanArtist) {
    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    if (duration && duration > 30) {
      getUrl += `&duration=${Math.round(duration)}`;
    }
    const exact = await fetchWithTimeout(getUrl);
    if (exact) {
      if (exact.syncedLyrics) {
        const synced = parseLrc(exact.syncedLyrics);
        if (synced.length > 0) {
          return {
            text: exact.plainLyrics || synced.map((s) => s.text).join('\n'),
            synced,
            isSynced: true,
            provider: 'LRCLIB (Synced)',
          };
        }
      }
      if (exact.plainLyrics) {
        return {
          text: exact.plainLyrics,
          synced: generateTimedLyricsFromPlain(exact.plainLyrics, duration || 240),
          isSynced: false,
          provider: 'LRCLIB (Plain)',
        };
      }
    }
  }

  // 1b. Search query: Title + Artist
  const queries = [
    `${cleanTitle} ${cleanArtist}`.trim(),
    cleanTitle,
  ];

  for (const q of queries) {
    if (!q) continue;
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
    const results = await fetchWithTimeout(searchUrl);
    if (Array.isArray(results) && results.length > 0) {
      // Find candidate with syncedLyrics first
      const withSynced = results.find((r) => r.syncedLyrics);
      if (withSynced && withSynced.syncedLyrics) {
        const synced = parseLrc(withSynced.syncedLyrics);
        if (synced.length > 0) {
          return {
            text: withSynced.plainLyrics || synced.map((s) => s.text).join('\n'),
            synced,
            isSynced: true,
            provider: 'LRCLIB (Synced)',
          };
        }
      }

      // Fallback to plain lyrics candidate
      const withPlain = results.find((r) => r.plainLyrics);
      if (withPlain && withPlain.plainLyrics) {
        return {
          text: withPlain.plainLyrics,
          synced: generateTimedLyricsFromPlain(withPlain.plainLyrics, duration || 240),
          isSynced: false,
          provider: 'LRCLIB (Plain)',
        };
      }
    }
  }

  return null;
}

/**
 * 2. JioSaavn Provider (Specialized in Kannada, Hindi, Tamil, Telugu, Punjabi, Malayalam, etc.)
 */
async function fetchFromJioSaavn(title: string, artist: string, duration?: number): Promise<LyricsResult | null> {
  const cleanTitle = cleanTitleForLyrics(title);
  const cleanArtist = cleanArtistForLyrics(artist);
  const query = `${cleanTitle} ${cleanArtist}`.trim();

  try {
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&n=5&p=1&q=${encodeURIComponent(query)}`;
    const searchRes = await fetchWithTimeout(searchUrl);
    if (!searchRes || !searchRes.results || searchRes.results.length === 0) {
      return null;
    }

    // Find first song flagged with has_lyrics
    const songWithLyrics =
      searchRes.results.find((s: any) => s.has_lyrics === 'true' || s.has_lyrics === true) ||
      searchRes.results[0];

    if (!songWithLyrics || !songWithLyrics.id) {
      return null;
    }

    const lyricsUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&lyrics_id=${songWithLyrics.id}&ctx=web6dot0&_format=json`;
    const lyricsRes = await fetchWithTimeout(lyricsUrl);
    if (lyricsRes && lyricsRes.lyrics) {
      const plain = lyricsRes.lyrics
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      if (plain) {
        return {
          text: plain,
          synced: generateTimedLyricsFromPlain(plain, duration || parseInt(songWithLyrics.duration, 10) || 240),
          isSynced: false,
          provider: 'JioSaavn Studio',
        };
      }
    }
  } catch (err) {
    console.warn('JioSaavn lyrics lookup failed:', err);
  }

  return null;
}

/**
 * 3. Lyrics.ovh Provider (Western / Pop / Indie catalog)
 */
async function fetchFromLyricsOvh(title: string, artist: string, duration?: number): Promise<LyricsResult | null> {
  const cleanTitle = cleanTitleForLyrics(title);
  const cleanArtist = cleanArtistForLyrics(artist);
  if (!cleanTitle || !cleanArtist) return null;

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const res = await fetchWithTimeout(url);
    if (res && res.lyrics) {
      const plain = res.lyrics.trim();
      if (plain) {
        return {
          text: plain,
          synced: generateTimedLyricsFromPlain(plain, duration || 240),
          isSynced: false,
          provider: 'Studio Lyrics OVH',
        };
      }
    }
  } catch {
    // Non-critical fallback
  }

  return null;
}

/**
 * 4. YouTube Transcript Subtitle Fallback
 */
async function fetchFromYouTubeCaptions(videoId: string): Promise<LyricsResult | null> {
  if (!videoId || videoId.startsWith('local-')) return null;

  try {
    const segments = await TranscriptExtractor.getTranscript(videoId);
    if (segments && segments.length > 0) {
      const synced: SyncedLyricLine[] = segments.map((seg) => ({
        time: seg.startMs / 1000,
        text: seg.text,
      }));

      const text = segments.map((s) => s.text).join('\n');
      return {
        text,
        synced,
        isSynced: true,
        provider: 'YouTube Synchronized Captions',
      };
    }
  } catch {
    // No transcript found
  }

  return null;
}

/**
 * Master multi-tiered lyrics fetcher
 */
export async function getLyricsForTrack(
  track: Track | { id: string; title: string; artist: string; duration?: number }
): Promise<LyricsResult> {
  if (!track) {
    return { text: '', synced: [], isSynced: false };
  }

  const cacheKey = `${track.id}-${track.title}-${track.artist}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  // 1. Try LRCLIB (Synchronized LRC preferred)
  const lrclibRes = await fetchFromLrclib(track.title, track.artist, track.duration);
  if (lrclibRes && lrclibRes.isSynced) {
    lyricsCache.set(cacheKey, lrclibRes);
    return lrclibRes;
  }

  // 2. Try JioSaavn (Dominant for Indian regional songs like Kannada, Hindi, Punjabi, Tamil, etc.)
  const saavnRes = await fetchFromJioSaavn(track.title, track.artist, track.duration);
  if (saavnRes) {
    lyricsCache.set(cacheKey, saavnRes);
    return saavnRes;
  }

  // If LRCLIB had plain lyrics earlier and JioSaavn didn't have lyrics, use LRCLIB plain
  if (lrclibRes) {
    lyricsCache.set(cacheKey, lrclibRes);
    return lrclibRes;
  }

  // 3. Try Lyrics.ovh
  const ovhRes = await fetchFromLyricsOvh(track.title, track.artist, track.duration);
  if (ovhRes) {
    lyricsCache.set(cacheKey, ovhRes);
    return ovhRes;
  }

  // 4. Try YouTube Video CC Transcripts
  const ytRes = await fetchFromYouTubeCaptions(track.id);
  if (ytRes) {
    lyricsCache.set(cacheKey, ytRes);
    return ytRes;
  }

  const fallbackEmpty: LyricsResult = { text: '', synced: [], isSynced: false };
  lyricsCache.set(cacheKey, fallbackEmpty);
  return fallbackEmpty;
}
