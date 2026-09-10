export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  artwork: string;
  streamUrl?: string;
  encryptedMediaUrl?: string;
  bitrate?: string;
  source?: 'youtube';
  language?: string;
  lyrics?: string;
  syncedLyrics?: SyncedLyricLine[];
  isLiked?: boolean;
}

export interface ListenerComment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  likeCount?: string;
  publishedTime?: string;
}

export interface SongInsights {
  viewCountText?: string;
  uploadDate?: string;
  description?: string;
  channelName?: string;
  channelId?: string;
  subscriberCount?: string;
  relatedTracks: Track[];
  comments: ListenerComment[];
}

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 10 bands: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz (-12 to +12 dB)
  bassBoost: number; // 0 to 10 dB
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: Track[];
  createdAt: number;
}

export type ActiveTab = 'discover' | 'search' | 'library' | 'liked' | 'downloads';

export interface ElectronAPI {
  isElectron: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  toggleMiniPlayer: () => Promise<boolean>;
  onWindowStateChanged: (callback: (data: { isMaximized: boolean }) => void) => void;
  downloadTrack: (payload: { url: string; filename?: string; title: string; artist: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
  openDownloadsFolder: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
