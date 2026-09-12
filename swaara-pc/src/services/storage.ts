import { Track, Playlist, EqualizerPreset } from '../types/music';

const LIKED_KEY = 'a1swaara_liked_songs';
const PLAYLISTS_KEY = 'a1swaara_playlists';
const HISTORY_KEY = 'a1swaara_history';
const DOWNLOADS_KEY = 'a1swaara_downloads';
const EQ_PRESET_KEY = 'a1swaara_eq_preset';
const VOLUME_KEY = 'a1swaara_volume';

export function getLikedSongs(): Track[] {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLikedSongs(songs: Track[]) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify(songs));
  } catch (e) {
    console.error('Failed to save liked songs:', e);
  }
}

export function toggleLikedSong(track: Track): boolean {
  const songs = getLikedSongs();
  const index = songs.findIndex((s) => s.id === track.id);
  let isNowLiked = false;
  if (index >= 0) {
    songs.splice(index, 1);
    isNowLiked = false;
  } else {
    songs.unshift({ ...track, isLiked: true });
    isNowLiked = true;
  }
  saveLikedSongs(songs);
  return isNowLiked;
}

export function getPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlaylists(playlists: Playlist[]) {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error('Failed to save playlists:', e);
  }
}

export function getHistory(): Track[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(track: Track) {
  try {
    const history = getHistory().filter((t) => t.id !== track.id);
    history.unshift(track);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Failed to add to history:', e);
  }
}

export function getDownloads(): Track[] {
  try {
    const raw = localStorage.getItem(DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordDownload(track: Track) {
  try {
    const downloads = getDownloads().filter((t) => t.id !== track.id);
    downloads.unshift(track);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
  } catch (e) {
    console.error('Failed to record download:', e);
  }
}

export function getSavedEqPreset(): string {
  return localStorage.getItem(EQ_PRESET_KEY) || 'BOOM BASS';
}

export function saveSavedEqPreset(name: string) {
  localStorage.setItem(EQ_PRESET_KEY, name);
}

export function getSavedVolume(): number {
  const val = localStorage.getItem(VOLUME_KEY);
  return val ? parseFloat(val) : 0.85;
}

export function saveSavedVolume(val: number) {
  localStorage.setItem(VOLUME_KEY, val.toString());
}

const FOLLOWED_ARTISTS_KEY = 'a1swaara_followed_artists';

export interface FollowedArtist {
  id: string;
  name: string;
  avatarUrl?: string;
  followedAt: number;
}

export function getFollowedArtists(): FollowedArtist[] {
  try {
    const raw = localStorage.getItem(FOLLOWED_ARTISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isArtistFollowed(artistIdOrName: string): boolean {
  const list = getFollowedArtists();
  const normalized = artistIdOrName.toLowerCase().trim();
  return list.some(
    (a) => a.id === artistIdOrName || a.name.toLowerCase().trim() === normalized
  );
}

export function toggleFollowArtist(artist: { id: string; name: string; avatarUrl?: string }): boolean {
  const list = getFollowedArtists();
  const normalized = artist.name.toLowerCase().trim();
  const index = list.findIndex(
    (a) => a.id === artist.id || a.name.toLowerCase().trim() === normalized
  );

  let isFollowed = false;
  if (index >= 0) {
    list.splice(index, 1);
    isFollowed = false;
  } else {
    list.unshift({
      id: artist.id,
      name: artist.name,
      avatarUrl: artist.avatarUrl,
      followedAt: Date.now(),
    });
    isFollowed = true;
  }

  try {
    localStorage.setItem(FOLLOWED_ARTISTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save followed artists:', e);
  }

  return isFollowed;
}
