import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Heart,
  Share2,
  Download,
  SlidersHorizontal,
  Mic2,
  Activity,
  Disc3,
  Radio,
  Sparkles,
  Headphones,
  Gauge,
  Moon,
  Zap,
  Waves,
} from 'lucide-react';
import { Track, SyncedLyricLine, VisualizerMode, SleepTimerOption } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface NowPlayingViewProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  onClose: () => void;
  onToggleLike: () => void;
  isLiked: boolean;
  onDownload: () => void;
  onOpenEqualizer: () => void;
  onOpenStoryCreator: () => void;
  lyrics: { text: string; synced: SyncedLyricLine[] };
  onSeek: (time: number) => void;
  isSpatialAudio?: boolean;
  onToggleSpatialAudio?: () => void;
  playbackSpeed?: number;
  onChangeSpeed?: (speed: number) => void;
  sleepTimerOption?: SleepTimerOption;
  onSelectSleepTimer?: (opt: SleepTimerOption) => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  track,
  isPlaying,
  currentTime,
  onClose,
  onToggleLike,
  isLiked,
  onDownload,
  onOpenEqualizer,
  onOpenStoryCreator,
  lyrics,
  onSeek,
  isSpatialAudio = false,
  onToggleSpatialAudio,
  playbackSpeed = 1.0,
  onChangeSpeed,
  sleepTimerOption = null,
  onSelectSleepTimer,
}) => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics'>('visualizer');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('liquid');
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(48).fill(8));
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Real-time FFT Frequency Spectrum Loop
  useEffect(() => {
    const dataArray = new Uint8Array(64);

    const updateVisualizer = () => {
      audioEngine.getFrequencyData(dataArray);

      const bars: number[] = [];
      const step = 64 / 48;
      for (let i = 0; i < 48; i++) {
        const index = Math.floor(i * step);
        const value = dataArray[index] || 0;
        const percent = Math.max(8, (value / 255) * 100);
        bars.push(percent);
      }
      setSpectrumBars(bars);

      animFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animFrameRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Auto-scroll active synced lyric line
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, activeTab]);

  const activeLyricIndex = lyrics.synced.findIndex((line, i) => {
    const nextLine = lyrics.synced[i + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  return (
    <div className="relative w-full h-full bg-[#040407] overflow-hidden flex flex-col p-8 z-30 select-none">
      {/* Iridescent Dynamic Ambient Mesh Glow */}
      <div className="absolute top-1/4 left-1/4 size-[520px] rounded-full bg-[#FF2DAA]/20 blur-[140px] pointer-events-none animate-ambient-1" />
      <div className="absolute bottom-1/4 right-1/4 size-[550px] rounded-full bg-[#8B35FF]/20 blur-[150px] pointer-events-none animate-ambient-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-[#20CFFF]/10 blur-[160px] pointer-events-none" />

      {/* Top Header Deck */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-xl shadow-md"
        >
          <ChevronDown className="size-4" />
          <span>Minimize Stage</span>
        </button>

        {/* Vision Pro Specular Capsule */}
        <div className="flex items-center bg-[#0F0F18]/90 p-1.5 rounded-full border border-white/10 backdrop-blur-2xl shadow-xl">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'visualizer'
                ? 'bg-gradient-to-r from-[#FF2DAA] to-[#8B35FF] text-white shadow-[0_0_20px_rgba(255,45,170,0.4)] scale-102'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="size-3.5" />
            <span>Studio Visualizer</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lyrics'
                ? 'bg-gradient-to-r from-[#8B35FF] to-[#20CFFF] text-white shadow-[0_0_20px_rgba(32,207,255,0.4)] scale-102'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 className="size-3.5" />
            <span>Karaoke Lyrics</span>
          </button>
        </div>

        {/* Action Dock with Pro Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Spatial 3D Audio */}
          {onToggleSpatialAudio && (
            <button
              onClick={onToggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer backdrop-blur-xl ${
                isSpatialAudio
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Spatial 3D Audio"
            >
              <Headphones className="size-3.5" />
              <span>3D SOUND</span>
            </button>
          )}

          {/* Playback Speed */}
          {onChangeSpeed && (
            <button
              onClick={() => {
                const nextRate = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 0.8 : 1.0;
                onChangeSpeed(nextRate);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-xl"
              title="Playback Speed"
            >
              <Gauge className="size-3.5 text-[#1ED760]" />
              <span>{playbackSpeed}x</span>
            </button>
          )}

          {/* Sleep Timer */}
          {onSelectSleepTimer && (
            <button
              onClick={() => {
                const options: SleepTimerOption[] = [null, 15, 30, 45, 60, 'track_end'];
                const currIdx = options.indexOf(sleepTimerOption);
                const nextOpt = options[(currIdx + 1) % options.length];
                onSelectSleepTimer(nextOpt);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer backdrop-blur-xl ${
                sleepTimerOption
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Sleep Timer"
            >
              <Moon className="size-3.5" />
              <span>{sleepTimerOption ? (sleepTimerOption === 'track_end' ? 'END' : `${sleepTimerOption}m`) : 'SLEEP'}</span>
            </button>
          )}

          <button
            onClick={onOpenEqualizer}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-xl shadow-md"
            title="BOOM BASS Studio EQ"
          >
            <SlidersHorizontal className="size-4 text-[#8B35FF]" />
          </button>
          <button
            onClick={onOpenStoryCreator}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-xl shadow-md"
            title="Create 9:16 Social Story"
          >
            <Share2 className="size-4 text-[#20CFFF]" />
          </button>
        </div>
      </div>

      {/* Main Stage Experience */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full overflow-hidden">
        {activeTab === 'visualizer' ? (
          <div className="flex flex-col items-center justify-center text-center w-full">
            {/* 3D Vinyl Record Hero */}
            <div className="relative flex items-center justify-center my-6 group">
              {/* Spinning Vinyl Record */}
              <div
                className={`absolute size-72 sm:size-84 rounded-full bg-[#0A0A0E] border-4 border-zinc-800/90 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all duration-1000 ease-out ${
                  isPlaying
                    ? 'translate-x-20 sm:translate-x-32 rotate-[360deg] animate-vinyl shadow-pink-500/25'
                    : 'translate-x-0 opacity-40'
                }`}
              >
                {/* Vinyl Grooves with Radial Sheen */}
                <div className="size-60 rounded-full border border-zinc-700/40 flex items-center justify-center">
                  <div className="size-44 rounded-full border border-zinc-700/50 flex items-center justify-center">
                    <div className="size-28 rounded-full border border-zinc-700/60 flex items-center justify-center">
                      <div className="size-20 rounded-full bg-gradient-to-tr from-[#FF2DAA] via-[#8B35FF] to-[#20CFFF] flex items-center justify-center shadow-lg border-2 border-zinc-900">
                        <div className="size-5 rounded-full bg-black border-2 border-white/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Front Beveled Artwork Card */}
              <div className="relative z-10 size-72 sm:size-84 rounded-3xl overflow-hidden border-2 border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.95)] bg-zinc-900">
                <img
                  src={track.artwork}
                  alt={track.title}
                  className="size-full object-cover"
                />
              </div>
            </div>

            {/* Song Metadata */}
            <div className="mt-4 max-w-2xl px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#1ED760] text-[11px] font-mono uppercase tracking-widest mb-2.5 font-bold">
                <Radio className="size-3 animate-pulse" />
                <span>QUANTUM MASTER 320K · LOSSLESS FIDELITY</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight line-clamp-1">
                {track.title}
              </h1>
              <p className="text-lg text-zinc-400 font-semibold mt-1 line-clamp-1">
                {track.artist}
              </p>
            </div>

            {/* Visualizer Mode Switcher */}
            <div className="flex items-center justify-center gap-2 mt-4 mb-1">
              <button
                onClick={() => setVisualizerMode('liquid')}
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  visualizerMode === 'liquid'
                    ? 'bg-gradient-to-r from-[#FF2DAA] to-[#8B35FF] text-white shadow-md scale-105'
                    : 'text-zinc-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                Liquid Wave
              </button>
              <button
                onClick={() => setVisualizerMode('cyberpunk')}
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  visualizerMode === 'cyberpunk'
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-md scale-105'
                    : 'text-zinc-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                Cyberpunk Neon
              </button>
              <button
                onClick={() => setVisualizerMode('nebula')}
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  visualizerMode === 'nebula'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                    : 'text-zinc-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                Cosmic Nebula
              </button>
            </div>

            {/* Multi-Mode Spectrum Visualizer */}
            {visualizerMode === 'liquid' ? (
              <div className="flex items-end justify-center gap-1.5 h-20 w-full max-w-xl my-5 px-4">
                {spectrumBars.map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-[#FF2DAA] via-[#8B35FF] to-[#20CFFF] transition-all duration-75 shadow-[0_0_12px_rgba(255,45,170,0.4)]"
                    style={{
                      height: `${height}%`,
                      opacity: isPlaying ? 0.95 : 0.25,
                    }}
                  />
                ))}
              </div>
            ) : visualizerMode === 'cyberpunk' ? (
              <div className="flex items-end justify-center gap-1 h-20 w-full max-w-xl my-5 px-4">
                {spectrumBars.map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-xs bg-gradient-to-t from-emerald-500 via-[#1ED760] to-cyan-300 transition-all duration-50 shadow-[0_0_10px_#1ED760]"
                    style={{
                      height: `${height}%`,
                      opacity: isPlaying ? 0.95 : 0.25,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 h-20 w-full max-w-xl my-5 px-4">
                {spectrumBars.map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-purple-600 via-pink-500 to-white transition-all duration-100 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    style={{
                      height: `${Math.sin((i / 48) * Math.PI) * height}%`,
                      opacity: isPlaying ? 0.95 : 0.25,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Quick Action Pills */}
            <div className="flex items-center gap-3.5">
              <button
                onClick={onToggleLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer backdrop-blur-md ${
                  isLiked
                    ? 'bg-pink-500/20 text-[#FF2DAA] border-pink-500/50 shadow-[0_0_20px_rgba(255,45,170,0.3)] scale-105'
                    : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Heart className={`size-4 ${isLiked ? 'fill-[#FF2DAA]' : ''}`} />
                <span>{isLiked ? 'In Favorites' : 'Add to Favorites'}</span>
              </button>

              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.04] text-zinc-300 border border-white/10 hover:text-[#20CFFF] hover:border-cyan-500/40 hover:bg-cyan-500/10 text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
              >
                <Download className="size-4" />
                <span>Save Offline Track</span>
              </button>
            </div>
          </div>
        ) : (
          /* Apple-Style Karaoke Lyrics View */
          <div className="w-full max-w-3xl h-[460px] overflow-y-auto px-8 py-10 text-center space-y-8 scroll-smooth">
            {lyrics.synced.length > 0 ? (
              lyrics.synced.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <p
                    key={idx}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => onSeek(line.time)}
                    className={`cursor-pointer transition-all duration-300 text-xl sm:text-3xl font-black leading-relaxed ${
                      isActive
                        ? 'text-white scale-105 text-[#FF2DAA] drop-shadow-[0_0_24px_rgba(255,45,170,0.8)]'
                        : 'text-zinc-600 hover:text-zinc-300 scale-95'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : lyrics.text ? (
              <div className="text-zinc-400 whitespace-pre-line text-lg font-medium leading-loose">
                {lyrics.text}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                <Mic2 className="size-12 text-zinc-600 animate-pulse" />
                <p className="text-base font-semibold text-zinc-400">Synchronizing Studio Karaoke...</p>
                <span className="text-xs font-mono text-zinc-600">Master Studio Lossless Acoustics · Swaara Audio Matrix</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
