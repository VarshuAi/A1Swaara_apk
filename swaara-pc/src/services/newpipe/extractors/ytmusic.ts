/**
 * YouTube Music (WEB_REMIX) Extractor
 * Strictly extracts pure official songs, singles, and radio streams
 * Eliminates video jukeboxes, compilations, full movies, and non-music video content
 */

import { HttpClient } from '../core/http';
import { InnerTubeClient } from '../core/clients';
import { parseDurationToSeconds } from '../utils/helper';
import { Track } from '../../../types/music';

// Blacklist filter to reject non-song video compilations & noise
const VIDEO_NOISE_REGEX =
  /\b(?:jukebox|compilation|all\s+songs|full\s+album|non\s*stop|audio\s+jukebox|mega\s*mix|all\s+hit\s+songs|full\s+movie|trailer|teaser|dialogue|interview|podcast|scene|episode|ep\s*\d+|reaction)\b/i;

export class YTMusicExtractor {
  /**
   * Search official music tracks using YouTube Music's WEB_REMIX Songs endpoint
   */
  public static async searchSongs(query: string): Promise<Track[]> {
    if (!query.trim()) return [];

    try {
      const visitorData = await HttpClient.getVisitorData();
      const remixContext = InnerTubeClient.createWebRemixContext(visitorData);
      const body = InnerTubeClient.prepareYtMusicSearchBody(query, remixContext);

      const data = await HttpClient.postJson<any>(
        `${InnerTubeClient.ENDPOINTS.YTM_SEARCH}?prettyPrint=false`,
        body,
        { headers: InnerTubeClient.getYtMusicHeaders() }
      );

      const tracks: Track[] = [];

      // Navigate YouTube Music tabbed search results
      const sectionList =
        data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;

      if (Array.isArray(sectionList)) {
        for (const section of sectionList) {
          const shelf = section.musicShelfRenderer || section.musicCardShelfRenderer;
          const contents = shelf?.contents;

          if (Array.isArray(contents)) {
            for (const row of contents) {
              const item = row.musicResponsiveListItemRenderer;
              if (!item) continue;

              const parsed = this.parseMusicItem(item);
              if (parsed) {
                tracks.push(parsed);
              }
            }
          }
        }
      }

      return tracks;
    } catch (err) {
      console.warn('YouTube Music search failed, falling back:', err);
      return [];
    }
  }

  /**
   * Fetch infinite radio recommendations for continuous harmonic autoplay
   */
  public static async getRadioTracks(videoId: string): Promise<Track[]> {
    if (!videoId) return [];

    try {
      const visitorData = await HttpClient.getVisitorData();
      const remixContext = InnerTubeClient.createWebRemixContext(visitorData);
      const body = InnerTubeClient.prepareYtMusicRadioBody(videoId, remixContext);

      const data = await HttpClient.postJson<any>(
        `${InnerTubeClient.ENDPOINTS.YTM_NEXT}?prettyPrint=false`,
        body,
        { headers: InnerTubeClient.getYtMusicHeaders() }
      );

      const tracks: Track[] = [];
      const tab =
        data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer
          ?.tabs?.[0]?.tabRenderer;
      const playlistPanel = tab?.content?.musicQueueRenderer?.content?.playlistPanelRenderer;
      const contents = playlistPanel?.contents;

      if (Array.isArray(contents)) {
        for (const entry of contents) {
          const item = entry.playlistPanelVideoRenderer;
          if (!item || !item.videoId || item.videoId === videoId) continue;

          const title = item.title?.runs?.[0]?.text?.trim() || '';
          if (VIDEO_NOISE_REGEX.test(title)) continue;

          const lengthStr = item.lengthText?.runs?.[0]?.text || '';
          const durSecs = parseDurationToSeconds(lengthStr);

          // Strictly filter out videos > 8 minutes (480s) or < 40s
          if (durSecs > 480 || (durSecs > 0 && durSecs < 40)) continue;

          const byline = item.longBylineText?.runs?.map((r: any) => r.text).join('') || '';
          const bylineParts = byline.split('•').map((s: string) => s.trim());
          const artist = bylineParts[0] || 'Studio Artist';
          const album = bylineParts.length > 1 ? bylineParts[1] : undefined;

          const thumbs = item.thumbnail?.thumbnails || [];
          const artwork = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

          tracks.push({
            id: item.videoId,
            title,
            artist,
            album,
            duration: durSecs || 210,
            artwork,
            source: 'swaara',
            bitrate: '320 kbps',
          });
        }
      }

      return tracks;
    } catch (err) {
      console.warn('Failed to fetch YouTube Music radio queue:', err);
      return [];
    }
  }

  /**
   * Parse a YouTube Music responsive item renderer
   */
  private static parseMusicItem(item: any): Track | null {
    const flexCols = item.flexColumns || [];
    const col0Runs = flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
    const col1Runs = flexCols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;

    const title = col0Runs?.map((r: any) => r.text).join('').trim();
    if (!title || VIDEO_NOISE_REGEX.test(title)) return null;

    // Track ID
    const videoId =
      item.playlistItemData?.videoId ||
      item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
        ?.watchEndpoint?.videoId ||
      col0Runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

    if (!videoId) return null;

    // Extract artist, album, and duration from flexColumn 1 runs
    // Format: [Artist, " • ", Album, " • ", Duration]
    let artist = 'Studio Artist';
    let album: string | undefined;
    let durationSecs = 0;

    if (Array.isArray(col1Runs)) {
      const parts: string[] = [];
      let current = '';
      for (const run of col1Runs) {
        if (run.text === ' • ') {
          if (current) parts.push(current.trim());
          current = '';
        } else {
          current += run.text;
        }
      }
      if (current) parts.push(current.trim());

      if (parts.length >= 1) artist = parts[0];
      if (parts.length >= 2) {
        // If second part is duration
        if (/^\d+:\d+$/.test(parts[1])) {
          durationSecs = parseDurationToSeconds(parts[1]);
        } else {
          album = parts[1];
          if (parts.length >= 3 && /^\d+:\d+$/.test(parts[2])) {
            durationSecs = parseDurationToSeconds(parts[2]);
          }
        }
      }
    }

    // Strictly discard videos > 8 minutes (480s) or < 40s
    if (durationSecs > 480 || (durationSecs > 0 && durationSecs < 40)) {
      return null;
    }

    // High quality artwork
    const thumbnails = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
    const artwork =
      thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id: videoId,
      title,
      artist,
      album,
      duration: durationSecs || 210,
      artwork,
      source: 'swaara',
      bitrate: '320 kbps',
    };
  }
}
