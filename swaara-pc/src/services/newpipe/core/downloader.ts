/**
 * ZenTube Stream Downloader
 * Downloads media streams to disk with progress tracking and speed estimation
 */

import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { DownloadProgress } from '../types.ts';

export class StreamDownloader {
  /**
   * Downloads a media stream URL to a local destination file
   */
  public static async download(
    streamUrl: string,
    outputPath: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const res = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'com.google.visionos.youtube/1.04(RealityDevice17,1; U; CPU visionOS 26_6_0 like Mac OS X; US)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download stream: HTTP ${res.status}`);
    }

    const totalBytes = parseInt(res.headers.get('content-length') || '0', 10);
    let bytesDownloaded = 0;
    const startTime = Date.now();

    const fileStream = fs.createWriteStream(outputPath);

    if (!res.body) {
      throw new Error('Response body is null');
    }

    // @ts-ignore Node 24 WebStream to NodeStream
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fileStream.write(value);
      bytesDownloaded += value.length;

      if (onProgress) {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const speedBytesPerSec = elapsedSec > 0 ? Math.round(bytesDownloaded / elapsedSec) : 0;
        const percent = totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 100) : 0;

        onProgress({
          bytesDownloaded,
          totalBytes,
          percent,
          speedBytesPerSec,
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end();
      fileStream.on('finish', () => resolve());
      fileStream.on('error', reject);
    });

    return outputPath;
  }
}
