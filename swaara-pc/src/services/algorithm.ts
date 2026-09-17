import { Track, AlgorithmMode } from '../types/music';
import { fetchSongInsights, searchMusic } from './api';

// Stopwords to filter out when extracting salient acoustic keywords
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'song', 'songs', 'audio', 'video', 'official', 'full', 'track', 'remix', 'version',
  'feat', 'ft', 'featuring', 'from', 'movie', 'album', 'soundtrack', 'original'
]);

export interface TrackProfile {
  languageOrRegion?: 'kannada' | 'hindi' | 'tamil' | 'telugu' | 'punjabi' | 'english' | 'lofi';
  mood?: 'energetic' | 'chill' | 'melancholic' | 'romantic' | 'party';
  keywords: string[];
}

// Extract clean alphanumeric keywords from a string
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Detect linguistic matrix and mood profile from track metadata
export function analyzeTrackProfile(track: Track): TrackProfile {
  const combined = `${track.title} ${track.artist} ${track.album || ''}`.toLowerCase();
  const keywords = extractKeywords(combined);

  let languageOrRegion: TrackProfile['languageOrRegion'] = undefined;
  let mood: TrackProfile['mood'] = undefined;

  // Language/Regional Heuristics
  if (/[\u0C80-\u0CFF]|kannada|sandalwood|sanjith|rajkumar|kgf|charlie|yuva/i.test(combined)) {
    languageOrRegion = 'kannada';
  } else if (/[\u0B80-\u0BFF]|tamil|anirudh|ar\s*rahman|kollywood|yuvan|harris|illayaraja|jailer|leo/i.test(combined)) {
    languageOrRegion = 'tamil';
  } else if (/[\u0C00-\u0C7F]|telugu|tollywood|thaman|devi\s*sri|sid\s*sriram|pushpa|rrr|devara/i.test(combined)) {
    languageOrRegion = 'telugu';
  } else if (/[\u0A00-\u0A7F]|punjabi|ap\s*dhillon|diljit|sidhu|karan\s*aujla|shubh/i.test(combined)) {
    languageOrRegion = 'punjabi';
  } else if (/lofi|lo-fi|chill|midnight|slowed|reverb|ambient|sleep|peace/i.test(combined)) {
    languageOrRegion = 'lofi';
    mood = 'chill';
  } else if (/hindi|bollywood|arijit|pritam|shreya|neha|badshah|jubin|atif/i.test(combined)) {
    languageOrRegion = 'hindi';
  } else if (/[a-zA-Z]/i.test(combined) && !/[^\x00-\x7F]/.test(combined)) {
    // English Pop or Global
    languageOrRegion = 'english';
  }

  // Mood Heuristics
  if (!mood) {
    if (/dance|party|club|dj|remix|blast|bass|drop|beat|house/i.test(combined)) {
      mood = 'party';
    } else if (/sad|broken|pain|tears|alone|melancholy|heartbreak/i.test(combined)) {
      mood = 'melancholic';
    } else if (/love|romantic|tum|ishq|pyar|kadhal|prema|beloved/i.test(combined)) {
      mood = 'romantic';
    } else if (/fire|pump|energy|fast|run|power|workout/i.test(combined)) {
      mood = 'energetic';
    } else {
      mood = 'chill';
    }
  }

  return { languageOrRegion, mood, keywords };
}

// Mathematical similarity scoring algorithm between a candidate track and reference
export function calculateTrackAffinity(
  candidate: Track,
  current: Track,
  history: Track[] = [],
  likedSongs: Track[] = [],
  mode: AlgorithmMode = 'flow'
): number {
  if (candidate.id === current.id) return -999;

  let score = 50; // baseline score

  const currentProfile = analyzeTrackProfile(current);
  const candProfile = analyzeTrackProfile(candidate);

  // 1. Same artist bonus
  const candArtistClean = candidate.artist.toLowerCase().trim();
  const currArtistClean = current.artist.toLowerCase().trim();
  if (candArtistClean.length > 0 && currArtistClean.length > 0) {
    if (candArtistClean === currArtistClean) {
      score += 45;
    } else if (candArtistClean.includes(currArtistClean) || currArtistClean.includes(candArtistClean)) {
      score += 30;
    }
  }

  // 2. Language / Regional Matrix harmony
  if (currentProfile.languageOrRegion && candProfile.languageOrRegion) {
    if (currentProfile.languageOrRegion === candProfile.languageOrRegion) {
      score += 35;
    } else {
      // Small penalty if crossing widely different language matrix (unless mode is deep_cuts)
      if (mode !== 'deep_cuts') {
        score -= 15;
      }
    }
  }

  // 3. Keyword semantic overlap
  const currKeySet = new Set(currentProfile.keywords);
  let overlap = 0;
  for (const kw of candProfile.keywords) {
    if (currKeySet.has(kw)) overlap++;
  }
  score += Math.min(30, overlap * 8);

  // 4. User Affinity (Liked Songs boost)
  const isLikedArtist = likedSongs.some(
    (l) => l.artist.toLowerCase() === candArtistClean
  );
  if (isLikedArtist) {
    score += 25;
  }

  // 5. Anti-Fatigue / Decay Penalty (prevent playing the same song repeatedly)
  const recentIndex = history.slice(0, 15).findIndex((h) => h.id === candidate.id);
  if (recentIndex !== -1) {
    // Strongly penalize recently played tracks
    score -= (15 - recentIndex) * 8;
  }

  // 6. Mode-specific weighting
  if (mode === 'deep_cuts') {
    // Reward novel artists not in the current history
    const inHistory = history.some((h) => h.artist.toLowerCase() === candArtistClean);
    if (!inHistory) score += 35;
  } else if (mode === 'high_energy') {
    if (candProfile.mood === 'party' || candProfile.mood === 'energetic') {
      score += 40;
    }
  } else if (mode === 'chill') {
    if (candProfile.mood === 'chill' || candProfile.languageOrRegion === 'lofi') {
      score += 40;
    }
  } else if (mode === 'vocal_acoustic') {
    if (candProfile.mood === 'romantic' || candProfile.mood === 'melancholic' || candProfile.keywords.some(k => ['acoustic', 'unplugged', 'melody', 'soul', 'voice'].includes(k))) {
      score += 40;
    }
  }

  return score;
}

// Retrieve smart, mathematically ranked next tracks using the Algorithm Engine
export async function getSmartNextTracks(
  currentTrack: Track,
  history: Track[] = [],
  likedSongs: Track[] = [],
  count: number = 8,
  mode: AlgorithmMode = 'flow'
): Promise<Track[]> {
  const candidates: Map<string, Track> = new Map();

  try {
    // 1. Fetch related tracks from the streaming graph via Insights
    const insightsPromise = fetchSongInsights(currentTrack.id)
      .then((insights) => {
        if (insights?.relatedTracks) {
          insights.relatedTracks.forEach((t) => {
            if (t.id !== currentTrack.id) candidates.set(t.id, t);
          });
        }
      })
      .catch(() => {});

    // 2. Fetch contextually targeted search tracks in parallel based on profile
    const profile = analyzeTrackProfile(currentTrack);
    let contextualQuery = `${currentTrack.artist} similar hits`;
    if (mode === 'high_energy') {
      contextualQuery = `${currentTrack.artist} dance party songs`;
    } else if (mode === 'chill') {
      contextualQuery = `${currentTrack.artist} lofi acoustic melody`;
    } else if (mode === 'vocal_acoustic') {
      contextualQuery = `${currentTrack.artist} unplugged acoustic songs`;
    } else if (profile.languageOrRegion) {
      contextualQuery = `${currentTrack.artist} ${profile.languageOrRegion} top songs`;
    }

    const searchPromise = searchMusic(contextualQuery)
      .then((results) => {
        results.forEach((t) => {
          if (t.id !== currentTrack.id) candidates.set(t.id, t);
        });
      })
      .catch(() => {});

    await Promise.allSettled([insightsPromise, searchPromise]);
  } catch (err) {
    console.warn('Recommendation algorithm pipeline encountered warning:', err);
  }

  // 3. Score and rank all candidate tracks
  const candidateList = Array.from(candidates.values());

  const scored = candidateList.map((candidate) => ({
    track: candidate,
    score: calculateTrackAffinity(candidate, currentTrack, history, likedSongs, mode),
  }));

  // Sort descending by algorithmic score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((item) => item.track);
}
