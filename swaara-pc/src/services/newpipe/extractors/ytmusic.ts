/**
 * YouTube Music (WEB_REMIX) Extractor
 * Strictly extracts pure official songs, singles, and radio streams
 * Eliminates video jukeboxes, compilations, full movies, and non-music video content
 */

import { HttpClient } from '../core/http';
import { InnerTubeClient } from '../core/clients';
import { parseDurationToSeconds } from '../utils/helper';
import { Track, ArtistDetails, ArtistSearchResult, ArtistReleaseItem } from '../../../types/music';

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
          const rawArtwork = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
          const artwork = this.getHighResImage(rawArtwork, 600, 600) || rawArtwork;

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
    const rawArtwork =
      thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const artwork = this.getHighResImage(rawArtwork, 600, 600) || rawArtwork;

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

  /**
   * Resizes Google user content image URLs (lh3.googleusercontent.com, yt3.ggpht.com)
   * to requested dimensions for ultra-sharp retina and widescreen displays.
   */
  public static getHighResImage(url?: string, width = 600, height = 600): string | undefined {
    if (!url) return undefined;
    if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
      if (/=w\d+-h\d+.*$/.test(url)) {
        return url.replace(/=w\d+-h\d+.*$/, `=w${width}-h${height}-p-l90-rj`);
      }
      if (/=s\d+.*$/.test(url)) {
        return url.replace(/=s\d+.*$/, `=s${width}`);
      }
      return `${url}=w${width}-h${height}-p-l90-rj`;
    }
    if (url.includes('i.ytimg.com/vi/')) {
      return url.replace(/\/(?:default|mqdefault|hqdefault|sddefault)\.jpg/, '/hq720.jpg');
    }
    return url;
  }

  /**
   * Fetches live search autocomplete suggestions using YouTube Music InnerTube suggestions API,
   * falling back to Google YouTube Suggest endpoint.
   */
  public static async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || !query.trim()) return [];

    const trimmed = query.trim();
    try {
      // 1. Try YouTube Music suggestions endpoint
      const visitorData = await HttpClient.getVisitorData();
      const remixContext = InnerTubeClient.createWebRemixContext(visitorData);
      const body = InnerTubeClient.prepareYtMusicSuggestionsBody(trimmed, remixContext);

      const data = await HttpClient.postJson<any>(
        `${InnerTubeClient.ENDPOINTS.YTM_SUGGESTIONS}?prettyPrint=false`,
        body,
        { headers: InnerTubeClient.getYtMusicHeaders(), timeoutMs: 3500 }
      );

      const suggestions: string[] = [];
      const contents = data?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents;

      if (Array.isArray(contents)) {
        for (const item of contents) {
          const renderer = item.searchSuggestionRenderer || item.historySuggestionRenderer;
          if (!renderer) continue;

          const q = renderer.navigationEndpoint?.searchEndpoint?.query;
          if (q) {
            suggestions.push(q);
          } else if (Array.isArray(renderer.suggestion?.runs)) {
            const text = renderer.suggestion.runs.map((r: any) => r.text).join('').trim();
            if (text) suggestions.push(text);
          }
        }
      }

      if (suggestions.length > 0) {
        return Array.from(new Set(suggestions)).slice(0, 8);
      }
    } catch {
      // Fallback to Google suggest API
    }

    // 2. Fast Fallback: Google Suggest API
    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(HttpClient.resolveUrl(suggestUrl));
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && Array.isArray(json[1])) {
          return (json[1] as string[]).slice(0, 8);
        }
      }
    } catch {
      // Ignore
    }

    return [];
  }

  /**
   * Searches for verified artists on YouTube Music using ViMusic's InnerTube filter.
   * Returns real circular portraits, browseIds, subscriber counts, and artist names.
   */
  public static async searchArtists(query: string): Promise<ArtistSearchResult[]> {
    if (!query.trim()) return [];

    try {
      const visitorData = await HttpClient.getVisitorData();
      const remixContext = InnerTubeClient.createWebRemixContext(visitorData);
      const body = InnerTubeClient.prepareYtMusicArtistSearchBody(query, remixContext);

      const data = await HttpClient.postJson<any>(
        `${InnerTubeClient.ENDPOINTS.YTM_SEARCH}?prettyPrint=false`,
        body,
        { headers: InnerTubeClient.getYtMusicHeaders() }
      );

      const results: ArtistSearchResult[] = [];
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

              const flexCols = item.flexColumns || [];
              const col0Runs = flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
              const name = col0Runs?.map((r: any) => r.text).join('').trim();
              if (!name) continue;

              const browseId =
                item.navigationEndpoint?.browseEndpoint?.browseId ||
                col0Runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
              if (!browseId) continue;

              const col1Runs = flexCols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
              const subText = col1Runs?.map((r: any) => r.text).join('').trim();

              const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
              const rawThumb = thumbs[thumbs.length - 1]?.url;
              const avatarUrl = this.getHighResImage(rawThumb, 600, 600) || rawThumb || '';

              results.push({
                id: browseId,
                name,
                browseId,
                avatarUrl,
                subscribers: subText,
              });
            }
          }
        }
      }

      return results;
    } catch (err) {
      console.warn('YouTube Music artist search failed:', err);
      return [];
    }
  }

  /**
   * Fetches full artist profile from YouTube Music InnerTube browse endpoint.
   * Extracts real high-res widescreen header banner, circular avatar, subscriber count,
   * official top tracks, albums, singles, and similar artists.
   */
  public static async getArtistDetails(browseId: string): Promise<ArtistDetails | null> {
    if (!browseId) return null;

    try {
      const visitorData = await HttpClient.getVisitorData();
      const remixContext = InnerTubeClient.createWebRemixContext(visitorData);
      const body = InnerTubeClient.prepareYtMusicBrowseBody(browseId, remixContext);

      const data = await HttpClient.postJson<any>(
        `${InnerTubeClient.ENDPOINTS.YTM_BROWSE}?prettyPrint=false`,
        body,
        { headers: InnerTubeClient.getYtMusicHeaders() }
      );

      const header =
        data?.header?.musicImmersiveHeaderRenderer ||
        data?.header?.musicVisualHeaderRenderer ||
        data?.header?.musicHeaderRenderer;

      const name = header?.title?.runs?.[0]?.text || 'Artist';
      const subText =
        header?.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.[0]?.text ||
        header?.subtitle?.runs?.map((r: any) => r.text).join('') ||
        'Artist';

      const bannerThumbs =
        header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
        header?.thumbnail?.thumbnails ||
        [];
      const rawBanner = bannerThumbs[bannerThumbs.length - 1]?.url;
      const bannerUrl = this.getHighResImage(rawBanner, 1920, 800);

      const fgThumbs = header?.foregroundThumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      let avatarUrl = this.getHighResImage(fgThumbs[fgThumbs.length - 1]?.url, 600, 600);

      // If avatar wasn't in header foregroundThumbnail, upscale the banner image as a square portrait
      if (!avatarUrl && rawBanner) {
        avatarUrl = this.getHighResImage(rawBanner, 600, 600);
      }

      const desc = header?.description?.runs?.map((r: any) => r.text).join('');

      const sectionList =
        data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;

      const topTracks: Track[] = [];
      const albums: ArtistReleaseItem[] = [];
      const singles: ArtistReleaseItem[] = [];
      const similarArtists: ArtistSearchResult[] = [];

      if (Array.isArray(sectionList)) {
        for (const sec of sectionList) {
          if (sec.musicShelfRenderer) {
            const shelf = sec.musicShelfRenderer;
            const title = shelf.title?.runs?.[0]?.text || '';
            if (title.toLowerCase().includes('top') || title.toLowerCase().includes('song')) {
              for (const row of shelf.contents || []) {
                const item = row.musicResponsiveListItemRenderer;
                if (!item) continue;
                const parsed = this.parseMusicItem(item);
                if (parsed) {
                  topTracks.push({
                    ...parsed,
                    artist: name,
                  });
                } else {
                  // Fallback item parsing
                  const flexCols = item.flexColumns || [];
                  const songTitle = flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
                  const videoId =
                    item.playlistItemData?.videoId ||
                    item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
                      ?.watchEndpoint?.videoId;
                  const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                  const artwork = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                  if (videoId && songTitle) {
                    topTracks.push({
                      id: videoId,
                      title: songTitle,
                      artist: name,
                      duration: 210,
                      artwork,
                      source: 'swaara',
                      bitrate: '320 kbps',
                    });
                  }
                }
              }
            }
          }

          if (sec.musicCarouselShelfRenderer) {
            const carousel = sec.musicCarouselShelfRenderer;
            const headerTitle = carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || '';
            const items = carousel.contents || [];

            if (headerTitle.toLowerCase().includes('album')) {
              for (const item of items) {
                const r2r = item.musicTwoRowItemRenderer;
                if (!r2r) continue;
                const itemTitle = r2r.title?.runs?.[0]?.text || '';
                const year = r2r.subtitle?.runs?.map((r: any) => r.text).join('');
                const thumbs = r2r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                const artwork = thumbs[thumbs.length - 1]?.url;
                const id = r2r.navigationEndpoint?.browseEndpoint?.browseId || itemTitle;
                albums.push({ id, title: itemTitle, year, artwork });
              }
            } else if (headerTitle.toLowerCase().includes('single')) {
              for (const item of items) {
                const r2r = item.musicTwoRowItemRenderer;
                if (!r2r) continue;
                const itemTitle = r2r.title?.runs?.[0]?.text || '';
                const year = r2r.subtitle?.runs?.map((r: any) => r.text).join('');
                const thumbs = r2r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                const artwork = thumbs[thumbs.length - 1]?.url;
                const id = r2r.navigationEndpoint?.browseEndpoint?.browseId || itemTitle;
                singles.push({ id, title: itemTitle, year, artwork });
              }
            } else if (headerTitle.toLowerCase().includes('fans') || headerTitle.toLowerCase().includes('similar')) {
              for (const item of items) {
                const r2r = item.musicTwoRowItemRenderer;
                if (!r2r) continue;
                const itemTitle = r2r.title?.runs?.[0]?.text || '';
                const subs = r2r.subtitle?.runs?.map((r: any) => r.text).join('');
                const thumbs = r2r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                const rawArt = thumbs[thumbs.length - 1]?.url;
                const art = this.getHighResImage(rawArt, 600, 600) || rawArt || '';
                const id = r2r.navigationEndpoint?.browseEndpoint?.browseId || itemTitle;
                similarArtists.push({ id, name: itemTitle, browseId: id, avatarUrl: art, subscribers: subs });
              }
            }
          }
        }
      }

      return {
        id: browseId,
        name,
        avatarUrl,
        bannerUrl,
        subscriberCountText: subText,
        verified: true,
        description: desc,
        topTracks,
        latestReleases: (singles.length > 0 ? singles : albums) as any,
        albums,
        singles,
        similarArtists,
      };
    } catch (err) {
      console.warn('YouTube Music getArtistDetails failed:', err);
      return null;
    }
  }
}
