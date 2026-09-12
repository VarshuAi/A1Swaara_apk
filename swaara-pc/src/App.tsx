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
import { Track, ActiveTab, SyncedLyricLine } from './types/music';
import { resolveTrackStream, fetchLyrics } from './services/api';
import { audioEngine, DEFAULT_PRESETS } from './services/audioEngine';
import * as storage from './services/storage';
import { CheckCircle2, Download } from 'lucide-react';

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
  const [activeEqPreset, setActiveEqPreset] = useState<string>(storage.getSavedEqPreset());
  const [lyrics, setLyrics] = useState<{ text: string; synced: SyncedLyricLine[] }>({ text: '', synced: [] });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Play a specific track
  const handlePlayTrack = useCallback(async (track: Track) => {
    setIsLoading(true);
    setCurrentTrack(track);

    // In a browser (Vercel / web), start playing track IMMEDIATELY on user click
    // to guarantee user activation is preserved and avoid any browser autoplay block!
    const isWeb = typeof window !== 'undefined' && !(window as any).electronAPI?.isElectron;
    if (isWeb) {
      audioEngine.playTrack(track);
    }

    try {
      // In Electron or background: attempt resolving high-fidelity 320 kbps stream URL
      const resolved = await resolveTrackStream(track);
      setCurrentTrack(resolved);

      // In Electron, or if direct stream URL was newly extracted, play via direct engine
      if (!isWeb || resolved.streamUrl) {
        await audioEngine.playTrack(resolved);
      }
      setIsLoading(false);

      // Save to history
      storage.addToHistory(resolved);
      setHistorySongs(storage.getHistory());

      // Fetch lyrics
      fetchLyrics(resolved.id).then((lyr) => {
        setLyrics(lyr);
      });
    } catch (err) {
      console.error('Track playback failure:', err);
      setIsLoading(false);
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
      handlePlayTrack(nextTrack);
    } else {
      showToast('Queue ended');
    }
  }, [handlePlayTrack]);

  // Previous Track Logic
  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
    } else if (historySongs.length > 1) {
      handlePlayTrack(historySongs[1]);
    }
  }, [currentTime, historySongs, handlePlayTrack]);

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
          audioEngine.seek(currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audioEngine.seek(currentTime + 5);
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
        case 'KeyN':
          if (e.shiftKey) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'KeyP':
          if (e.shiftKey) {
            e.preventDefault();
            handlePrev();
          }
          break;
        case 'Escape':
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
  }, [currentTime, volume, handleNext, handlePrev, isFullscreen]);

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
    handlePlayTrack(first);
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
    <div className="h-screen w-screen bg-[#000000] text-white flex flex-col justify-between overflow-hidden relative selection:bg-[#1ED760] selection:text-black font-sans">
      {/* Frameless Obsidian Custom Title Bar */}
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

      {/* Main Center Layout (Spotify 2-Tier Master Grid) */}
      <div className="flex-1 flex overflow-hidden relative p-2 gap-2 bg-[#000000]">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            navigateTo(tab, null);
            setIsNowPlayingOpen(false);
          }}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onOpenStoryCreator={() => setIsStoryCreatorOpen(true)}
          likedCount={likedSongs.length}
          downloadCount={downloadedSongs.length}
          onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
          hasTrack={!!currentTrack}
        />

        {/* Dynamic Center Viewport in Rounded Spotify Frame */}
        <main className="flex-1 h-full overflow-hidden flex flex-col bg-[#121212] rounded-lg relative">
          {isNowPlayingOpen && currentTrack ? (
            <NowPlayingView
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onClose={() => setIsNowPlayingOpen(false)}
              onToggleLike={() => handleToggleLike()}
              isLiked={isCurrentLiked}
              onDownload={() => handleDownloadTrack(currentTrack)}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onOpenStoryCreator={() => setIsStoryCreatorOpen(true)}
              lyrics={lyrics}
              onSeek={(t) => audioEngine.seek(t)}
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
            />
          ) : (
            <LibraryView
              likedSongs={likedSongs}
              historySongs={historySongs}
              downloadedSongs={downloadedSongs}
              onPlayTrack={handlePlayTrack}
              onPlayAll={handlePlayAll}
              onToggleLike={handleToggleLike}
              onDownloadTrack={handleDownloadTrack}
              initialSubTab={activeTab === 'liked' ? 'liked' : activeTab === 'downloads' ? 'downloads' : 'liked'}
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
            const nextQueue = [...queue];
            nextQueue.splice(index, 1);
            setQueue(nextQueue);
            handlePlayTrack(track);
          }}
          onRemoveFromQueue={(index) => {
            setQueue((prev) => prev.filter((_, i) => i !== index));
          }}
          onClearQueue={() => setQueue([])}
        />
      </div>

      {/* Bottom Sticky Player Bar */}
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
        onExpandNowPlaying={() => setIsNowPlayingOpen(true)}
        onDownloadTrack={handleDownloadTrack}
        onOpenArtist={handleOpenArtist}
        isLyricsActive={isNowPlayingOpen}
        isInsightsActive={isInsightsOpen}
        isQueueActive={isQueueOpen}
        isDownloading={isDownloading}
      />

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

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#141420]/95 border border-pink-500/30 text-white shadow-2xl backdrop-blur-xl text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="size-4 text-[#FF2DAA]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
