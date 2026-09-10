/**
 * ZenTube Extractor
 * Multi-Platform Streaming Media & Metadata Extraction Engine (YouTube, SoundCloud, Bandcamp)
 * Inspired by NewPipe Extractor
 */

import { StreamExtractor } from './extractors/stream.ts';
import { SearchExtractor } from './extractors/search.ts';
import { ChannelExtractor } from './extractors/channel.ts';
import { PlaylistExtractor } from './extractors/playlist.ts';
import { CommentsExtractor } from './extractors/comments.ts';
import { TranscriptExtractor } from './services/youtube/transcript.ts';
import { ShortsExtractor } from './services/youtube/shorts.ts';
import { SoundCloudExtractor } from './services/soundcloud/extractor.ts';
import { BandcampExtractor } from './services/bandcamp/extractor.ts';
import { UniversalRouter } from './core/router.ts';
import { StreamDownloader } from './core/downloader.ts';
import type { SearchFilter, DownloadProgress } from './types.ts';

export type * from './types.ts';
export * from './core/itags.ts';
export * from './core/http.ts';
export * from './core/clients.ts';
export * from './core/cipher.ts';
export * from './core/downloader.ts';
export * from './core/router.ts';
export * from './utils/helper.ts';
export * from './utils/parser.ts';

// Service Exports
export { StreamExtractor } from './extractors/stream.ts';
export { SearchExtractor } from './extractors/search.ts';
export { ChannelExtractor } from './extractors/channel.ts';
export { PlaylistExtractor } from './extractors/playlist.ts';
export { CommentsExtractor } from './extractors/comments.ts';
export { TranscriptExtractor } from './services/youtube/transcript.ts';
export { ShortsExtractor } from './services/youtube/shorts.ts';
export { SoundCloudExtractor } from './services/soundcloud/extractor.ts';
export { BandcampExtractor } from './services/bandcamp/extractor.ts';

/**
 * ZenTube Main Multi-Platform Facade
 */
export class ZenTube {
  /**
   * Universal extractor: Automatically detects platform (YouTube, SoundCloud, Bandcamp) from URL
   */
  public static async extract(urlOrId: string) {
    return UniversalRouter.extract(urlOrId);
  }

  // --- YOUTUBE METHODS ---

  /**
   * Extracts playable video/audio streams and rich metadata for a YouTube video
   */
  public static async getStream(videoIdOrUrl: string) {
    const stream = await StreamExtractor.extract(videoIdOrUrl);
    stream.platform = 'youtube';
    return stream;
  }

  /**
   * Searches YouTube for videos, channels, or playlists
   */
  public static async search(query: string, filter?: SearchFilter, continuationToken?: string) {
    return SearchExtractor.search(query, filter, continuationToken);
  }

  /**
   * Retrieves search suggestions for auto-complete
   */
  public static async getSuggestions(query: string) {
    return SearchExtractor.getSuggestions(query);
  }

  /**
   * Extracts channel information, tabs, and recent uploads
   */
  public static async getChannel(channelIdOrHandle: string) {
    return ChannelExtractor.extract(channelIdOrHandle);
  }

  /**
   * Extracts playlist information and video items
   */
  public static async getPlaylist(playlistIdOrUrl: string, continuationToken?: string) {
    return PlaylistExtractor.extract(playlistIdOrUrl, continuationToken);
  }

  /**
   * Extracts comments and replies for a video
   */
  public static async getComments(videoIdOrUrl: string, continuationToken?: string) {
    return CommentsExtractor.getComments(videoIdOrUrl, continuationToken);
  }

  /**
   * Extracts timestamped transcript segments for a video
   */
  public static async getTranscript(videoIdOrUrl: string, languageCode = 'en') {
    return TranscriptExtractor.getTranscript(videoIdOrUrl, languageCode);
  }

  /**
   * Converts subtitles into clean SRT, VTT, or plain text
   */
  public static async convertSubtitles(trackUrl: string, format: 'vtt' | 'srt' | 'text' | 'json' = 'vtt') {
    return TranscriptExtractor.convertSubtitles(trackUrl, format);
  }

  /**
   * Extracts the YouTube Shorts feed
   */
  public static async getShorts(continuationToken?: string) {
    return ShortsExtractor.getShortsFeed(continuationToken);
  }

  // --- SOUNDCLOUD SERVICE NAMESPACE ---
  public static readonly soundcloud = {
    getTrack: (url: string) => SoundCloudExtractor.extractTrack(url),
    getPlaylist: (url: string) => SoundCloudExtractor.extractPlaylist(url),
    search: (query: string) => SoundCloudExtractor.search(query),
  };

  // --- BANDCAMP SERVICE NAMESPACE ---
  public static readonly bandcamp = {
    getAlbum: (url: string) => BandcampExtractor.extractAlbum(url),
    getTrack: (url: string) => BandcampExtractor.extract(url),
  };

  // --- DOWNLOADER METHOD ---

  /**
   * Downloads any audio or video stream URL to a local destination file
   */
  public static async download(
    streamUrl: string,
    outputPath: string,
    onProgress?: (progress: DownloadProgress) => void
  ) {
    return StreamDownloader.download(streamUrl, outputPath, onProgress);
  }
}

export default ZenTube;
