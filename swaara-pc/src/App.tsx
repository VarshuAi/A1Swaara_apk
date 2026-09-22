import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { DiscoverView } from './components/DiscoverView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { NowPlayingView } from './components/NowPlayingView';
import { EqualizerModal } from './components/EqualizerModal';
import { StoryCreatorModal } from './components/StoryCreatorModal';
import { QueueDrawer } from './components/QueueDrawer';
import { MiniPlayer } from './components/MiniPlayer';
import { SongInsightsDrawer } from './components/SongInsightsDrawer';
import { ArtistView } from './components/ArtistView';
import { ContextMenu } from './components/ContextMenu';
import { Track, ActiveTab, SyncedLyricLine, AlgorithmMode, SleepTimerOption } from './types/music';
import { resolveTrackStream, fetchLyrics, fetchRadioTracks } from './services/api';
import { audioEngine, DEFAULT_PRESETS } from './services/audioEngine';
import { getSmartNextTracks } from './services/algorithm';
import * as storage from './services/storage';
import { CheckCircle2, Download, Radio, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<{ tab: ActiveTab; artist?: string | null }[]>([
    { tab: 'discover' },
  ]);
  const [navIndex, setNavIndex] = useState<number>(0);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolume] = useState<number>(storage.getSavedVolume());
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Intelligent Algorithm & Pro Audio DSP State
  const [isAutoDJ, setIsAutoDJ] = useState<boolean>(true);
  const [algorithmMode, setAlgorithmMode] = useState<AlgorithmMode>('flow');
  const [isSpatialAudio, setIsSpatialAudio] = useState<boolean>(audioEngine.isSpatialAudio());
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(audioEngine.getPlaybackRate());
  const [sleepTimerOption, setSleepTimerOption] = useState<SleepTimerOption>(audioEngine.getSleepTimerOption());

  // Modals & Views
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState<boolean>(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Queue & Collections
  const [queue, setQueue] = useState<Track[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>(storage.getLikedSongs());
  const [historySongs, setHistorySongs] = useState<Track[]>(storage.getHistory());
  const [downloadedSongs, setDownloadedSongs] = useState<Track[]>(storage.getDownloads());
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [activeEqPreset, setActiveEqPreset] = useState<string>(storage.getSavedEqPreset());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<{
    text: string;
    synced: SyncedLyricLine[];
    isSynced?: boolean;
    provider?: string;
    isLoading?: boolean;
  }>({ text: '', synced: [], isLoading: false });
  const [isDownloading, setIsDownloading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    track: Track;
  } | null>(null);

  const likedSongIds = new Set(likedSongs.map((s) => s.id));
  const isCurrentLiked = currentTrack ? likedSongIds.has(currentTrack.id) : false;

  // Sync state refs for callbacks
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;
  const isRepeatRef = useRef(isRepeat);
  isRepeatRef.current = isRepeat;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const isAutoDJRef = useRef(isAutoDJ);
  isAutoDJRef.current = isAutoDJ;
  const algorithmModeRef = useRef(algorithmMode);
  algorithmModeRef.current = algorithmMode;
  const historySongsRef = useRef(historySongs);
  historySongsRef.current = historySongs;
  const likedSongsRef = useRef(likedSongs);
  likedSongsRef.current = likedSongs;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navigateTo = useCallback((tab: ActiveTab, artist?: string | null) => {
    setActiveTab(tab);
    if (artist !== undefined) {
      setSelectedArtist(artist);
    }
    setNavHistory((prev) => {
      const next = prev.slice(0, navIndex + 1);
      return [...next, { tab, artist: artist ?? null }];
    });
    setNavIndex((prev) => prev + 1);
  }, [navIndex]);

  const handleGoBack = useCallback(() => {
    if (navIndex > 0) {
      const prevItem = navHistory[navIndex - 1];
      setNavIndex((i) => i - 1);
      setActiveTab(prevItem.tab);
      setSelectedArtist(prevItem.artist || null);
    }
  }, [navIndex, navHistory]);

  const handleGoForward = useCallback(() => {
    if (navIndex < navHistory.length - 1) {
      const nextItem = navHistory[navIndex + 1];
      setNavIndex((i) => i + 1);
      setActiveTab(nextItem.tab);
      setSelectedArtist(nextItem.artist || null);
    }
  }, [navIndex, navHistory]);

  const handleOpenArtist = useCallback((artistNameOrChannelId: string) => {
    setSelectedArtist(artistNameOrChannelId);
    setIsNowPlayingOpen(false);
    navigateTo('artist', artistNameOrChannelId);
  }, [navigateTo]);

  // Import local PC studio files directly into lossless player
  const handleImportLocalFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const audioFiles = fileArray.filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(f.name)
    );
    if (audioFiles.length === 0) {
      showToast('No compatible audio files found in selection');
      return;
    }

    const newTracks: Track[] = audioFiles.map((file, idx) => {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const parts = cleanName.split(' - ');
      const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
      const title = (parts.length > 1 ? parts.slice(1).join(' - ') : parts[0]).replace(/\.[^/.]+$/, '');
      const streamUrl = URL.createObjectURL(file);

      return {
        id: `local-${Date.now()}-${idx}`,
        title: title || file.name,
        artist,
        album: 'Local Audio',
        artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        duration: 0,
        streamUrl,
        source: 'local',
        isLiked: false,
      };
    });

    setLocalTracks((prev) => [...newTracks, ...prev]);
    showToast(`Loaded ${newTracks.length} lossless local track${newTracks.length > 1 ? 's' : ''} ⚡`);
  }, []);

  // Play a specific track
  const handlePlayTrack = useCallback(async (track: Track, keepExistingQueue: boolean = false) => {
    setIsLoading(true);
    setCurrentTrack(track);

    // If starting a fresh track outside the existing queue, immediately reseed Up Next queue with kindred tracks
    if (!keepExistingQueue && track.source !== 'local') {
      getSmartNextTracks(track, historySongsRef.current, likedSongsRef.current, 12, algorithmModeRef.current)
        .then((nextTracks) => {
          if (nextTracks && nextTracks.length > 0) {
            setQueue(nextTracks);
          }
        })
        .catch((err) => {
          console.warn('Failed to seed smart next tracks:', err);
        });
    }

    // Route local PC studio files through Web Audio 10-Band EQ & Spatial DSP
    if (track.source === 'local' && track.streamUrl) {
      try {
        await audioEngine.playLocalFile(track.streamUrl, track);
        setIsLoading(false);
        storage.addToHistory(track);
        setHistorySongs(storage.getHistory());
        setLyrics({
          text: 'Offline Local Audio\nRouted through Swaara Equalizer & Audio Engine',
          synced: [],
        });
      } catch (err) {
        console.error('Local file playback failure:', err);
        setIsLoading(false);
      }
      return;
    }

    setLyrics({ text: '', synced: [], isLoading: true });

    const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isElectron);

    if (isElectron) {
      try {
        const resolved = await resolveTrackStream(track);
        setCurrentTrack(resolved);
        await audioEngine.playTrack(resolved);
        setIsLoading(false);

        storage.addToHistory(resolved);
        setHistorySongs(storage.getHistory());
        fetchLyrics(resolved).then((lyr) => setLyrics({ ...lyr, isLoading: false }));
      } catch (err) {
        console.error('Track playback failure:', err);
        try {
          await audioEngine.playTrack(track);
        } catch {
          showToast('Could not load stream. Please check network connection.');
        }
        setIsLoading(false);
      }
    } else {
      // In Web Browser: Start playback immediately without CORS double-load glitch
      try {
        await audioEngine.playTrack(track);
        setIsLoading(false);
        storage.addToHistory(track);
        setHistorySongs(storage.getHistory());
        fetchLyrics(track).then((lyr) => setLyrics({ ...lyr, isLoading: false }));
      } catch (err) {
        console.error('Web playback failure:', err);
        showToast('Playback error. Check audio source or connection.');
        setIsLoading(false);
      }
    }
  }, []);

  // Next Track Logic
  const handleNext = useCallback(() => {
    if (isRepeatRef.current && currentTrackRef.current) {
      audioEngine.seek(0);
      audioEngine.playTrack(currentTrackRef.current);
      return;
    }

    const currentQueue = queueRef.current;
    if (currentQueue.length > 0) {
      const nextIndex = isShuffleRef.current ? Math.floor(Math.random() * currentQueue.length) : 0;
      const nextTrack = currentQueue[nextIndex];
      const newQueue = [...currentQueue];
      newQueue.splice(nextIndex, 1);
      setQueue(newQueue);
      handlePlayTrack(nextTrack, true);
    } else if (isAutoDJRef.current && currentTrackRef.current) {
      showToast('Smart AI DJ: Generating continuous stream...');
      getSmartNextTracks(
        currentTrackRef.current,
        historySongsRef.current,
        likedSongsRef.current,
        10,
        algorithmModeRef.current
      )
        .then((nextTracks) => {
          if (nextTracks.length > 0) {
            const first = nextTracks[0];
            const rest = nextTracks.slice(1);
            setQueue(rest);
            handlePlayTrack(first, true);
          } else {
            showToast('Queue ended');
          }
        })
        .catch(() => {
          showToast('Queue ended');
        });
    } else {
      showToast('Queue ended');
    }
  }, [handlePlayTrack]);

  // Previous Track Logic
  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
    } else if (historySongs.length > 1) {
      handlePlayTrack(historySongs[1], true);
    }
  }, [currentTime, historySongs, handlePlayTrack]);

  // Automatically pre-fill queue with high-affinity YouTube Music songs so autoplay NEVER stalls
  useEffect(() => {
    if (!isAutoDJ || !currentTrack || currentTrack.source === 'local') return;

    if (queue.length < 4) {
      getSmartNextTracks(currentTrack, historySongs, likedSongs, 8, algorithmMode)
        .then((recs) => {
          if (recs.length > 0) {
            setQueue((prev) => {
              const existingIds = new Set([currentTrack.id, ...prev.map((t) => t.id)]);
              const fresh = recs.filter((t) => !existingIds.has(t.id));
              return [...prev, ...fresh];
            });
          }
        })
        .catch(() => {});
    }
  }, [currentTrack?.id, isAutoDJ, algorithmMode, queue.length, historySongs, likedSongs]);

  // Audio DSP & Pro Handlers
  const handleToggleSpatialAudio = () => {
    const next = !isSpatialAudio;
    setIsSpatialAudio(next);
    audioEngine.setSpatialAudio(next);
    showToast(next ? 'Spatial 3D Audio: ON 🎧' : 'Spatial 3D Audio: OFF');
  };

  const handleStartRadio = async (track: Track) => {
    handlePlayTrack(track, false);
    try {
      const radioTracks = await fetchRadioTracks(track.id);
      if (radioTracks && radioTracks.length > 0) {
        setQueue(radioTracks);
        showToast(`Infinite Radio: ${track.title}`);
      }
    } catch (err) {
      console.warn('Failed to load radio queue:', err);
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    audioEngine.setPlaybackRate(speed);
    showToast(`Playback Speed: ${speed}x`);
  };

  const handleSelectSleepTimer = (option: SleepTimerOption) => {
    setSleepTimerOption(option);
    audioEngine.setSleepTimer(option, () => {
      showToast('Sleep Timer: Music Paused 🌙');
    });
    if (option === 'track_end') {
      showToast('Sleep Timer: Stop at End of Track');
    } else if (option) {
      showToast(`Sleep Timer: ${option} minutes`);
    } else {
      showToast('Sleep Timer: Disabled');
    }
  };

  const handleToggleAutoDJ = () => {
    const next = !isAutoDJ;
    setIsAutoDJ(next);
    showToast(next ? 'Smart AI DJ: Continuous Flow ON ⚡' : 'Smart AI DJ: OFF');
  };

  // Initialize AudioEngine callbacks & presets on startup
  useEffect(() => {
    audioEngine.setVolume(volume);

    // Apply saved preset
    const preset = DEFAULT_PRESETS[activeEqPreset] || DEFAULT_PRESETS['BOOM BASS'];
    audioEngine.applyPreset(preset);

    audioEngine.setCallbacks({
      onTimeUpdate: (curr, dur, buff) => {
        setCurrentTime(curr);
        setDuration(dur);
        setBuffered(buff);
      },
      onEnd: () => {
        handleNext();
      },
      onPlayChange: (playing) => {
        setIsPlaying(playing);
      },
      onLoading: (loading) => {
        setIsLoading(loading);
      },
      onError: (err) => {
        showToast(err);
      },
    });

    audioEngine.setupMediaSessionHandlers({
      play: () => audioEngine.togglePlay(),
      pause: () => audioEngine.togglePlay(),
      next: handleNext,
      previous: handlePrev,
      seek: (t) => audioEngine.seek(t),
    });
  }, [handleNext, handlePrev, activeEqPreset, volume]);

  // Listen for hardware media keys dispatched by Electron main process
  useEffect(() => {
    if (window.electronAPI?.onMediaCommand) {
      window.electronAPI.onMediaCommand((cmd) => {
        if (cmd === 'play-pause') {
          audioEngine.togglePlay();
        } else if (cmd === 'next') {
          handleNext();
        } else if (cmd === 'previous') {
          handlePrev();
        }
      });
    }
  }, [handleNext, handlePrev]);

  // OTA In-App Auto-Updater
  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data) => {
        if (data.status === 'available') {
          showToast(`⚡ New update v${data.remoteVersion || ''} found! Downloading OTA update...`);
          window.electronAPI?.downloadUpdate?.();
        } else if (data.status === 'downloading') {
          if (data.percent !== undefined && data.percent % 25 === 0) {
            showToast(`Downloading update... ${data.percent}%`);
          }
        } else if (data.status === 'downloaded') {
          showToast(`Update ready! Restarting Swaara to apply...`);
          setTimeout(() => {
            window.electronAPI?.installUpdate?.();
          }, 2500);
        } else if (data.status === 'error' && data.error && !data.error.includes('404')) {
          console.warn('OTA update notice:', data.error);
        }
      });
    }
  }, []);

  // Toggle Like
  const handleToggleLike = (trackToToggle?: Track) => {
    const target = trackToToggle || currentTrack;
    if (!target) return;
    const isNowLiked = storage.toggleLikedSong(target);
    setLikedSongs(storage.getLikedSongs());
    showToast(isNowLiked ? 'Added to Liked Songs ❤️' : 'Removed from Liked Songs');
  };

  // 1-Click High-Speed 320 kbps Downloader
  const handleDownloadTrack = async (trackToDownload: Track) => {
    setIsDownloading(true);
    showToast(`Downloading 320kbps: ${trackToDownload.title}...`);

    try {
      const resolved = await resolveTrackStream(trackToDownload);
      if (!resolved.streamUrl) {
        showToast('Stream URL not found for download');
        setIsDownloading(false);
        return;
      }

      if (window.electronAPI?.downloadTrack) {
        const res = await window.electronAPI.downloadTrack({
          url: resolved.streamUrl,
          title: resolved.title,
          artist: resolved.artist,
        });

        if (res.success) {
          storage.recordDownload(resolved);
          setDownloadedSongs(storage.getDownloads());
          showToast(`Saved to Music/A1 Swaara: ${resolved.title}`);
        } else {
          showToast(`Download failed: ${res.error || 'Unknown error'}`);
        }
      } else {
        // Fallback for browser download
        const a = document.createElement('a');
        a.href = resolved.streamUrl;
        a.download = `${resolved.artist} - ${resolved.title}.mp4`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        storage.recordDownload(resolved);
        setDownloadedSongs(storage.getDownloads());
        showToast(`Download started: ${resolved.title}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // Desktop Native Right-Click Context Menu Handlers
  const handleOpenContextMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      track,
    });
  };

  const handlePlayNext = (track: Track) => {
    setQueue((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
    showToast(`Added to play next: ${track.title}`);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to trigger global search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('search');
        setIsNowPlayingOpen(false);
        return;
      }

      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          audioEngine.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.ctrlKey) {
            handlePrev();
          } else {
            audioEngine.seek(currentTime - 5);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.ctrlKey) {
            handleNext();
          } else {
            audioEngine.seek(currentTime + 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          const volUp = Math.min(1, volume + 0.05);
          setVolume(volUp);
          audioEngine.setVolume(volUp);
          storage.saveSavedVolume(volUp);
          break;
        case 'ArrowDown':
          e.preventDefault();
          const volDown = Math.max(0, volume - 0.05);
          setVolume(volDown);
          audioEngine.setVolume(volDown);
          storage.saveSavedVolume(volDown);
          break;
        case 'KeyM':
          e.preventDefault();
          const newVol = volume === 0 ? 0.85 : 0;
          setVolume(newVol);
          audioEngine.setVolume(newVol);
          break;
        case 'KeyF':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'KeyL':
          e.preventDefault();
          handleToggleLike();
          break;
        case 'KeyE':
          e.preventDefault();
          setIsEqualizerOpen((prev) => !prev);
          break;
        case 'KeyQ':
          e.preventDefault();
          setIsQueueOpen((prev) => !prev);
          break;
        case 'KeyK':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigateTo('search', null);
            setIsNowPlayingOpen(false);
          }
          break;
        case 'KeyN':
          e.preventDefault();
          handleNext();
          break;
        case 'KeyP':
          e.preventDefault();
          handlePrev();
          break;
        case 'Escape':
          if (isNowPlayingOpen) {
            setIsNowPlayingOpen(false);
          }
          setIsEqualizerOpen(false);
          setIsStoryCreatorOpen(false);
          setIsQueueOpen(false);
          setIsInsightsOpen(false);
          if (isFullscreen) {
            document.exitFullscreen?.();
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, volume, handleNext, handlePrev, isFullscreen, handleToggleLike, isNowPlayingOpen]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Mini player toggle
  const handleToggleMiniPlayer = async () => {
    if (window.electronAPI?.toggleMiniPlayer) {
      const isMini = await window.electronAPI.toggleMiniPlayer();
      setIsMiniPlayer(isMini);
    } else {
      setIsMiniPlayer(!isMiniPlayer);
    }
  };

  // Batch Play All
  const handlePlayAll = (tracks: Track[], shuffle: boolean = false) => {
    if (tracks.length === 0) return;
    const list = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : [...tracks];
    const first = list[0];
    setQueue(list.slice(1));
    handlePlayTrack(first, true);
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    showToast(`Added to queue: ${track.title}`);
  };

  // If Mini Player mode is active
  if (isMiniPlayer) {
    return (
      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        isLoading={isLoading}
        currentTime={currentTime}
        duration={duration}
        isLiked={isCurrentLiked}
        onTogglePlay={() => audioEngine.togglePlay()}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleLike={() => handleToggleLike()}
        onSeek={(t) => audioEngine.seek(t)}
        onRestore={handleToggleMiniPlayer}
        onClose={() => window.electronAPI?.close() || setIsMiniPlayer(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#080809] text-[#F4F4F5] flex flex-col justify-between overflow-hidden relative selection:bg-[#10B981] selection:text-black font-sans">
      {/* Frameless Title Bar */}
      <TitleBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onToggleMiniPlayer={handleToggleMiniPlayer}
        isMiniPlayer={isMiniPlayer}
        onOpenSearch={() => {
          navigateTo('search', null);
          setIsNowPlayingOpen(false);
        }}
        onNavigateBack={handleGoBack}
        onNavigateForward={handleGoForward}
        canGoBack={navIndex > 0}
        canGoForward={navIndex < navHistory.length - 1}
      />

      {/* Main Layout: Slim Navigation + Continuous Content */}
      <div className="flex-1 flex overflow-hidden relative bg-[#070809]">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            navigateTo(tab, null);
            setIsNowPlayingOpen(false);
          }}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          likedCount={likedSongs.length}
          downloadCount={downloadedSongs.length}
        />

        {/* Continuous Center Viewport */}
        <main className="flex-1 h-full overflow-hidden flex flex-col bg-[#070809] relative">
          {isNowPlayingOpen && currentTrack ? (
            <NowPlayingView
              track={currentTrack}
              isPlaying={isPlaying}
              isLoading={isLoading}
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              volume={volume}
              onChangeVolume={(vol) => {
                setVolume(vol);
                audioEngine.setVolume(vol);
                storage.saveSavedVolume(vol);
              }}
              onClose={() => setIsNowPlayingOpen(false)}
              onTogglePlay={() => audioEngine.togglePlay()}
              onPrev={handlePrev}
              onNext={handleNext}
              onToggleShuffle={() => setIsShuffle(!isShuffle)}
              isShuffle={isShuffle}
              onToggleRepeat={() => setIsRepeat(!isRepeat)}
              isRepeat={isRepeat}
              queue={queue}
              onPlayTrack={handlePlayTrack}
              onPlayQueueTrack={(index) => {
                const track = queue[index];
                const nextQueue = queue.slice(index + 1);
                setQueue(nextQueue);
                handlePlayTrack(track, true);
              }}
              onRemoveFromQueue={(index) => {
                setQueue((prev) => prev.filter((_, i) => i !== index));
              }}
              onClearQueue={() => setQueue([])}
              onOpenArtist={handleOpenArtist}
              onToggleLike={() => handleToggleLike()}
              isLiked={isCurrentLiked}
              onDownload={() => handleDownloadTrack(currentTrack)}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onOpenStoryCreator={() => setIsStoryCreatorOpen(true)}
              lyrics={lyrics}
              onSeek={(t) => audioEngine.seek(t)}
              isSpatialAudio={isSpatialAudio}
              onToggleSpatialAudio={handleToggleSpatialAudio}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={handleChangeSpeed}
              sleepTimerOption={sleepTimerOption}
              onSelectSleepTimer={handleSelectSleepTimer}
              isAutoDJ={isAutoDJ}
            />
          ) : activeTab === 'artist' && selectedArtist ? (
            <ArtistView
              artistIdOrName={selectedArtist}
              onPlayTrack={handlePlayTrack}
              onPlayAll={handlePlayAll}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onToggleLike={handleToggleLike}
              likedSongIds={likedSongIds}
              onDownloadTrack={handleDownloadTrack}
              onBack={handleGoBack}
              onOpenArtist={handleOpenArtist}
              onTrackContextMenu={handleOpenContextMenu}
            />
          ) : activeTab === 'discover' ? (
            <DiscoverView
              onPlayTrack={handlePlayTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onToggleLike={handleToggleLike}
              likedSongIds={likedSongIds}
              onDownloadTrack={handleDownloadTrack}
              onOpenArtist={handleOpenArtist}
              algorithmMode={algorithmMode}
              onChangeAlgorithmMode={(mode) => {
                setAlgorithmMode(mode);
                showToast(`Harmonic Engine Mode: ${mode.toUpperCase()} ⚡`);
              }}
              onTrackContextMenu={handleOpenContextMenu}
            />
          ) : activeTab === 'search' ? (
            <SearchView
              onPlayTrack={handlePlayTrack}
              onAddToQueue={handleAddToQueue}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onToggleLike={handleToggleLike}
              likedSongIds={likedSongIds}
              onDownloadTrack={handleDownloadTrack}
              onOpenArtist={handleOpenArtist}
              onTrackContextMenu={handleOpenContextMenu}
            />
          ) : activeTab === 'local' ? (
            <LibraryView
              likedSongs={likedSongs}
              historySongs={historySongs}
              downloadedSongs={downloadedSongs}
              localTracks={localTracks}
              onPlayTrack={handlePlayTrack}
              onPlayAll={handlePlayAll}
              onToggleLike={handleToggleLike}
              onDownloadTrack={handleDownloadTrack}
              onImportLocalFiles={handleImportLocalFiles}
              initialSubTab="local"
              onTrackContextMenu={handleOpenContextMenu}
            />
          ) : (
            <LibraryView
              likedSongs={likedSongs}
              historySongs={historySongs}
              downloadedSongs={downloadedSongs}
              localTracks={localTracks}
              onPlayTrack={handlePlayTrack}
              onPlayAll={handlePlayAll}
              onToggleLike={handleToggleLike}
              onDownloadTrack={handleDownloadTrack}
              onImportLocalFiles={handleImportLocalFiles}
              initialSubTab={
                activeTab === 'liked'
                  ? 'liked'
                  : activeTab === 'downloads'
                  ? 'downloads'
                  : activeTab === 'history'
                  ? 'history'
                  : 'liked'
              }
              onTrackContextMenu={handleOpenContextMenu}
            />
          )}
        </main>

        {/* Right Drawer: Song Insights, Analytics & Comments (Spotify Now Playing View) */}
        <SongInsightsDrawer
          isOpen={isInsightsOpen}
          onClose={() => setIsInsightsOpen(false)}
          track={currentTrack}
          onPlayTrack={handlePlayTrack}
          onOpenArtist={handleOpenArtist}
        />

        {/* Up Next Queue Slide-over */}
        <QueueDrawer
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          queue={queue}
          currentTrack={currentTrack}
          onPlayQueueTrack={(index) => {
            const track = queue[index];
            const nextQueue = queue.slice(index + 1);
            setQueue(nextQueue);
            handlePlayTrack(track, true);
          }}
          onRemoveFromQueue={(index) => {
            setQueue((prev) => prev.filter((_, i) => i !== index));
          }}
          onClearQueue={() => setQueue([])}
        />
      </div>

      {/* Bottom Sticky Player Bar (Only shown when not in full Now Playing view) */}
      {!isNowPlayingOpen && (
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          isLiked={isCurrentLiked}
          onTogglePlay={() => audioEngine.togglePlay()}
          onSeek={(t) => audioEngine.seek(t)}
          onPrev={handlePrev}
          onNext={handleNext}
          onToggleShuffle={() => setIsShuffle(!isShuffle)}
          onToggleRepeat={() => setIsRepeat(!isRepeat)}
          onToggleLike={() => handleToggleLike()}
          onChangeVolume={(vol) => {
            setVolume(vol);
            audioEngine.setVolume(vol);
            storage.saveSavedVolume(vol);
          }}
          onOpenLyrics={() => setIsNowPlayingOpen(true)}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
          onToggleInsights={() => setIsInsightsOpen(!isInsightsOpen)}
          onToggleFullscreen={handleToggleFullscreen}
          onExpandNowPlaying={() => setIsNowPlayingOpen((prev) => !prev)}
          onDownloadTrack={handleDownloadTrack}
          onOpenArtist={handleOpenArtist}
          isNowPlayingOpen={isNowPlayingOpen}
          isLyricsActive={isNowPlayingOpen}
          isInsightsActive={isInsightsOpen}
          isQueueActive={isQueueOpen}
          isDownloading={isDownloading}
          isSpatialAudio={isSpatialAudio}
          onToggleSpatialAudio={handleToggleSpatialAudio}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={handleChangeSpeed}
          isAutoDJ={isAutoDJ}
          onToggleAutoDJ={handleToggleAutoDJ}
          algorithmMode={algorithmMode}
          onChangeAlgorithmMode={(mode) => {
            setAlgorithmMode(mode);
            showToast(`Harmonic Engine Mode: ${mode.toUpperCase()} ⚡`);
          }}
        />
      )}

      {/* Modals */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        activePresetName={activeEqPreset}
        onSelectPreset={(name) => {
          setActiveEqPreset(name);
          storage.saveSavedEqPreset(name);
        }}
      />

      <StoryCreatorModal
        isOpen={isStoryCreatorOpen}
        onClose={() => setIsStoryCreatorOpen(false)}
        track={currentTrack}
      />

      {/* Desktop Native Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          track={contextMenu.track}
          isLiked={likedSongIds.has(contextMenu.track.id)}
          onClose={() => setContextMenu(null)}
          onPlayNow={(t) => handlePlayTrack(t, false)}
          onPlayNext={handlePlayNext}
          onAddToQueue={(t) => handleAddToQueue(t)}
          onToggleLike={handleToggleLike}
          onDownload={handleDownloadTrack}
          onOpenArtist={handleOpenArtist}
          onStartRadio={handleStartRadio}
        />
      )}

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#18181B] border border-white/[0.12] text-white shadow-xl text-xs font-medium animate-slideUp">
          <CheckCircle2 className="size-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
