/**
 * ZenTube Universal Platform Router
 * Automatically detects service (YouTube, SoundCloud, Bandcamp) from input URL
 * and delegates to the appropriate extractor
 */

import { StreamExtractor } from '../extractors/stream.ts';
import { SoundCloudExtractor } from '../services/soundcloud/extractor.ts';
import { BandcampExtractor } from '../services/bandcamp/extractor.ts';
import type { StreamInfo, StreamingPlatform } from '../types.ts';

export class UniversalRouter {
  /**
   * Detects the streaming platform from any URL
   */
  public static detectPlatform(input: string): StreamingPlatform {
    const trimmed = input.trim().toLowerCase();

    if (trimmed.includes('soundcloud.com')) {
      return 'soundcloud';
    }

    if (trimmed.includes('bandcamp.com')) {
      return 'bandcamp';
    }

    // Default: YouTube
    return 'youtube';
  }

  /**
   * Automatically routes any URL to its native extractor
   */
  public static async extract(urlOrId: string): Promise<StreamInfo> {
    const platform = this.detectPlatform(urlOrId);

    switch (platform) {
      case 'soundcloud':
        return SoundCloudExtractor.extractTrack(urlOrId);

      case 'bandcamp':
        return BandcampExtractor.extract(urlOrId);

      case 'youtube':
      default:
        const stream = await StreamExtractor.extract(urlOrId);
        stream.platform = 'youtube';
        return stream;
    }
  }
}
