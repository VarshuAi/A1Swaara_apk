import { Track, AlgorithmMode } from '../types/music';
import { fetchSongInsights, searchMusic, fetchRadioTracks } from './api';

// Stopwords to filter out when extracting salient acoustic keywords
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'song', 'songs', 'audio', 'video', 'official', 'full', 'track', 'remix', 'version',
  'feat', 'ft', 'featuring', 'from', 'movie', 'album', 'soundtrack', 'original'
]);

export interface TrackProfile {
  languageOrRegion?: 'kannada' | 'hindi' | 'tamil' | 'telugu' | 'punjabi' | 'malayalam' | 'english' | 'lofi';
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
  if (/[\u0C80-\u0CFF]|kannada|sandalwood|sanjith\s*hegde|vijay\s*prakash|rajkumar|puneeth|appu|yash|kgf|charlie|yuva|kantara|sapta\s*sagarada|tagaru|arjun\s*janya|charan\s*raj|raghu\s*dixit/i.test(combined)) {
    languageOrRegion = 'kannada';
  } else if (/[\u0B80-\u0BFF]|tamil|kollywood|anirudh|ar\s*rahman|a\.r\.\s*rahman|yuvan|harris\s*jayaraj|ilayaraja|illayaraja|santhosh\s*narayanan|jailer|leo|vikram|beast|master|kaithi|thuppakki|mankatha|dhanush|siva\s*karthikeyan|rajinikanth/i.test(combined)) {
    languageOrRegion = 'tamil';
  } else if (/[\u0C00-\u0C7F]|telugu|tollywood|thaman|devi\s*sri|dsp|sid\s*sriram|pushpa|rrr|devara|guntur\s*kaaram|salaar|kalki|hanuman|allu\s*arjun|mahesh\s*babu|prabhas|ntr|ram\s*charan|keeravani/i.test(combined)) {
    languageOrRegion = 'telugu';
  } else if (/[\u0A00-\u0A7F]|punjabi|sidhu|moose\s*wala|moosewala|karan\s*aujla|aujla|diljit|dosanjh|shubh|ap\s*dhillon|gurinder\s*gill|amrit\s*maan|jass\s*manak|parmish\s*verma|mankirt|b\s*praak|jaani|hardy\s*sandhu|ammy\s*virk|honey\s*singh|bohemia|chani\s*nattan|inderpal|sukhe|arjan\s*dhillon|gippy|babbu\s*maan|jazzy\s*b|smw|295|so\s*high|same\s*beef|elevated|cheques|no\s*love|baller|winning\s*speech|brown\s*munde|excuses|insane/i.test(combined)) {
    languageOrRegion = 'punjabi';
  } else if (/[\u0D00-\u0D7F]|malayalam|mollywood|sushin\s*shyam|shaan\s*rahman|vidyasagar|manjummel|avesham|rdx|lucifer|mohanlal|mammootty/i.test(combined)) {
    languageOrRegion = 'malayalam';
  } else if (/lofi|lo-fi|chill|midnight|slowed|reverb|ambient|sleep|peace/i.test(combined)) {
    languageOrRegion = 'lofi';
    mood = 'chill';
  } else if (/hindi|bollywood|arijit|pritam|shreya|neha\s*kakkar|badshah|jubin|atif\s*aslam|kk|mohit\s*chauhan|sonu\s*nigam|shaan|udit\s*narayan|kumar\s*sanu|alka\s*yagnik|sunidhi|amit\s*trivedi|sachin\s*jigar|vishal\s*shekhar|armaan\s*malik|darshan\s*raval|kesariya/i.test(combined)) {
    languageOrRegion = 'hindi';
  } else if (/the\s*weeknd|taylor\s*swift|drake|billie\s*eilish|ed\s*sheeran|dua\s*lipa|justin\s*bieber|eminem|rihanna|ariana\s*grande|post\s*malone|bruno\s*mars|maroon\s*5|coldplay|imagine\s*dragons|kendrick\s*lamar|travis\s*scott|kanye|adele|olivia\s*rodrigo|billboard/i.test(combined)) {
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
      score += 40;
    } else {
      // Penalty if crossing different language matrix (unless mode is deep_cuts)
      if (mode !== 'deep_cuts') {
        score -= 30;
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
    (l) => l.artist.toLowerCase().trim() === candArtistClean
  );
  if (isLikedArtist) {
    score += 15;
  }

  // 5. Anti-Fatigue & Artist Pacing (prevent repetitive artists or re-playing recent songs)
  const recentIndex = history.slice(0, 15).findIndex((h) => h.id === candidate.id);
  if (recentIndex !== -1) {
    score -= (15 - recentIndex) * 12;
  }

  const lastTwoArtists = history.slice(0, 2).map((h) => h.artist.toLowerCase().trim());
  if (lastTwoArtists.length >= 2 && lastTwoArtists[0] === candArtistClean && lastTwoArtists[1] === candArtistClean) {
    score -= 30;
  }

  // 6. Mode-specific weighting
  if (mode === 'deep_cuts') {
    const inHistory = history.some((h) => h.artist.toLowerCase().trim() === candArtistClean);
    const inLiked = likedSongs.some((l) => l.artist.toLowerCase().trim() === candArtistClean);
    if (!inHistory && !inLiked) score += 40;
    else if (!inHistory) score += 20;
  } else if (mode === 'high_energy') {
    if (candProfile.mood === 'party' || candProfile.mood === 'energetic') {
      score += 45;
    }
  } else if (mode === 'chill') {
    if (candProfile.mood === 'chill' || candProfile.languageOrRegion === 'lofi') {
      score += 45;
    }
  } else if (mode === 'vocal_acoustic') {
    if (
      candProfile.mood === 'romantic' ||
      candProfile.mood === 'melancholic' ||
      candProfile.keywords.some((k) =>
        ['acoustic', 'unplugged', 'melody', 'soul', 'voice', 'classical', 'piano', 'guitar'].includes(k)
      )
    ) {
      score += 45;
    }
  }

  return score;
}

// Retrieve smart, mathematically ranked next tracks using the Algorithm Engine
export async function getSmartNextTracks(
  currentTrack: Track,
  history: Track[] = [],
  likedSongs: Track[] = [],
  count: number = 10,
  mode: AlgorithmMode = 'flow'
): Promise<Track[]> {
  try {
    // 1. Primary Engine: Fetch high-affinity YouTube Music Radio queue (ML similarity stream)
    const radioTracks = await fetchRadioTracks(currentTrack.id);

    const recentHistoryIds = new Set(history.slice(0, 15).map((h) => h.id));
    recentHistoryIds.add(currentTrack.id);

    const validRadioTracks = (radioTracks || []).filter((t) => {
      if (recentHistoryIds.has(t.id)) return false;
      if (t.duration < 40 || t.duration > 480) return false;
      return true;
    });

    if (validRadioTracks.length >= count) {
      if (mode === 'flow') {
        // In default 'flow' mode, YouTube Music Radio sequence is pure gold!
        // We preserve YouTube Music's high-relevance ordering while applying moderate artist diversity
        // (max 3 tracks per artist so top recommendations have kindred variety)
        const finalTracks: Track[] = [];
        const artistCount: Record<string, number> = {};

        for (const track of validRadioTracks) {
          const art = track.artist.toLowerCase().trim();
          const countForArt = artistCount[art] || 0;
          if (countForArt < 3 || finalTracks.length < count - 2) {
            finalTracks.push(track);
            artistCount[art] = countForArt + 1;
          }
          if (finalTracks.length >= count) break;
        }

        // Fill up to count if artist filter was strict
        if (finalTracks.length < count) {
          const chosenIds = new Set(finalTracks.map((t) => t.id));
          for (const track of validRadioTracks) {
            if (!chosenIds.has(track.id)) {
              finalTracks.push(track);
              if (finalTracks.length >= count) break;
            }
          }
        }

        return finalTracks;
      }

      // For specific mood modes (high_energy, chill, vocal_acoustic, deep_cuts)
      const scored = validRadioTracks.map((cand) => ({
        track: cand,
        score: calculateTrackAffinity(cand, currentTrack, history, likedSongs, mode),
      }));
      scored.sort((a, b) => b.score - a.score);

      const finalTracks: Track[] = [];
      const artistCount: Record<string, number> = {};
      for (const item of scored) {
        const art = item.track.artist.toLowerCase().trim();
        const countForArt = artistCount[art] || 0;
        if (countForArt < 3 || finalTracks.length < count - 2) {
          finalTracks.push(item.track);
          artistCount[art] = countForArt + 1;
        }
        if (finalTracks.length >= count) break;
      }

      return finalTracks;
    }

    // 2. Contextual search fallback if radio returned fewer tracks than requested
    const profile = analyzeTrackProfile(currentTrack);
    const candidateMap = new Map<string, Track>();
    validRadioTracks.forEach((t) => candidateMap.set(t.id, t));

    let contextualQuery = `${currentTrack.artist} top songs`;
    if (mode === 'high_energy') {
      contextualQuery = `${currentTrack.artist} dance party energetic hits`;
    } else if (mode === 'chill') {
      contextualQuery = `${currentTrack.artist} lofi chill acoustic`;
    } else if (mode === 'vocal_acoustic') {
      contextualQuery = `${currentTrack.artist} acoustic unplugged melody`;
    } else if (profile.languageOrRegion && profile.languageOrRegion !== 'english') {
      contextualQuery = `${currentTrack.artist} ${profile.languageOrRegion} best hits`;
    }

    const fallbackTracks = await searchMusic(contextualQuery).catch(() => []);
    for (const t of fallbackTracks) {
      if (!recentHistoryIds.has(t.id) && t.duration >= 40 && t.duration <= 480) {
        candidateMap.set(t.id, t);
      }
    }

    const candidateList = Array.from(candidateMap.values());
    const scored = candidateList.map((candidate) => ({
      track: candidate,
      score: calculateTrackAffinity(candidate, currentTrack, history, likedSongs, mode),
    }));
    scored.sort((a, b) => b.score - a.score);

    const finalTracks: Track[] = [];
    const artistCount: Record<string, number> = {};
    for (const item of scored) {
      const art = item.track.artist.toLowerCase().trim();
      const countForArt = artistCount[art] || 0;
      if (countForArt < 3 || finalTracks.length < count - 2) {
        finalTracks.push(item.track);
        artistCount[art] = countForArt + 1;
      }
      if (finalTracks.length >= count) break;
    }

    if (finalTracks.length < count) {
      const chosenIds = new Set(finalTracks.map((t) => t.id));
      for (const item of scored) {
        if (!chosenIds.has(item.track.id)) {
          finalTracks.push(item.track);
          if (finalTracks.length >= count) break;
        }
      }
    }

    return finalTracks;
  } catch (err) {
    console.warn('Recommendation algorithm pipeline encountered warning:', err);
    return [];
  }
}
