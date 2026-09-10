import React, { useState, useMemo } from 'react';
import { X, SlidersHorizontal, Zap, RotateCcw, Activity, Disc, Sparkles } from 'lucide-react';
import { EqualizerPreset } from '../types/music';
import { EQ_FREQUENCIES, DEFAULT_PRESETS, audioEngine } from '../services/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetName: string;
  onSelectPreset: (name: string) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  activePresetName,
  onSelectPreset,
}) => {
  const currentPreset = DEFAULT_PRESETS[activePresetName] || DEFAULT_PRESETS['BOOM BASS'];
  const [gains, setGains] = useState<number[]>([...currentPreset.gains]);
  const [bassBoost, setBassBoost] = useState<number>(currentPreset.bassBoost);

  const handleSelectPreset = (name: string) => {
    onSelectPreset(name);
    const preset = DEFAULT_PRESETS[name];
    if (preset) {
      setGains([...preset.gains]);
      setBassBoost(preset.bassBoost);
      audioEngine.applyPreset(preset);
    }
  };

  const handleBandChange = (index: number, val: number) => {
    const nextGains = [...gains];
    nextGains[index] = val;
    setGains(nextGains);
    audioEngine.setBandGain(index, val);
  };

  const handleBassBoostChange = (val: number) => {
    setBassBoost(val);
    audioEngine.setBassBoost(val);
  };

  const handleReset = () => {
    handleSelectPreset('Flat');
  };

  // Generate smooth SVG curve points for the live frequency graph
  // Coordinate space: width 600, height 120 (0dB is y=60, +12dB is y=10, -12dB is y=110)
  const svgCurvePath = useMemo(() => {
    const width = 600;
    const height = 120;
    const padding = 30;
    const usableWidth = width - padding * 2;
    const step = usableWidth / (gains.length - 1);

    const points = gains.map((g, i) => {
      const x = padding + i * step;
      // map gain (-12 to +12) to y (110 to 10)
      const y = 60 - (g / 12) * 50;
      return { x, y };
    });

    if (points.length === 0) return '';

    // Build smooth cubic bezier curve string
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    return path;
  }, [gains]);

  const svgAreaPath = useMemo(() => {
    if (!svgCurvePath) return '';
    return `${svgCurvePath} L 570 120 L 30 120 Z`;
  }, [svgCurvePath]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 select-none animate-fadeIn">
      {/* Hardware Console Chassis */}
      <div className="relative w-full max-w-3xl rounded-[32px] bg-[#0A0A12] border border-white/15 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] space-y-6 overflow-hidden">
        {/* Specular Ambient Glows */}
        <div className="absolute -top-24 left-1/3 w-96 h-48 bg-[#FF2DAA]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-48 bg-[#20CFFF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Console Header */}
        <div className="flex items-center justify-between relative z-10 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-[#FF2DAA] via-[#8B35FF] to-[#20CFFF] p-[1.5px] shadow-lg shadow-pink-500/25">
              <div className="size-full bg-[#0E0E18] rounded-[14.5px] flex items-center justify-center">
                <SlidersHorizontal className="size-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">BOOM BASS STUDIO RACK</h2>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-[#FF2DAA] text-[10px] font-mono font-bold tracking-wider">
                  PARAMETRIC 10-BAND
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Hardware Biquad Audio Shaping · Zero-Latency DSP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Reset to Flat Studio curve"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Live Frequency Response Visualizer Display */}
        <div className="relative rounded-2xl bg-[#07070D] border border-white/10 p-4 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1 px-2">
            <span className="flex items-center gap-1">
              <Activity className="size-3 text-pink-400 animate-pulse" />
              ACOUSTIC FREQUENCY RESPONSE
            </span>
            <span className="text-zinc-400">±12.0 dB STUDIO SCALE</span>
          </div>

          <svg viewBox="0 0 600 120" className="w-full h-24 overflow-visible">
            <defs>
              <linearGradient id="eqGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF2DAA" />
                <stop offset="50%" stopColor="#8B35FF" />
                <stop offset="100%" stopColor="#20CFFF" />
              </linearGradient>
              <linearGradient id="eqAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF2DAA" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#20CFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Guidelines */}
            <line x1="30" y1="20" x2="570" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="30" y1="60" x2="570" y2="60" stroke="rgba(255,255,255,0.15)" />
            <line x1="30" y1="100" x2="570" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

            {/* Filled area under the curve */}
            {svgAreaPath && <path d={svgAreaPath} fill="url(#eqAreaGrad)" />}

            {/* Main response spline curve */}
            {svgCurvePath && (
              <path
                d={svgCurvePath}
                fill="none"
                stroke="url(#eqGlowGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Individual Gain Node Dots */}
            {gains.map((g, i) => {
              const x = 30 + i * (540 / (gains.length - 1));
              const y = 60 - (g / 12) * 50;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#FFFFFF"
                  stroke="#FF2DAA"
                  strokeWidth="2"
                  className="shadow-md"
                />
              );
            })}
          </svg>
        </div>

        {/* BOOM BASS Sub-Harmonic Reactor Bar */}
        <div className="p-4 rounded-2xl bg-[#0E0E1A] border border-pink-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-pink-500/20 border border-pink-500/30 text-[#FF2DAA] flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Zap className="size-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-tight">BOOM BASS Sub-Woofer Pump</h4>
                <span className="text-xs font-mono font-bold text-[#FF2DAA]">+{bassBoost} dB</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Resonant sub-harmonic acoustic drive (40Hz–80Hz visceral punch)
              </p>
            </div>
          </div>

          <div className="w-full sm:w-56 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={bassBoost}
              onChange={(e) => handleBassBoostChange(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full cursor-pointer accent-[#FF2DAA]"
            />
          </div>
        </div>

        {/* 10-Band Sliders Channel Strip */}
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="flex items-end justify-between gap-2 h-44 pb-1">
            {EQ_FREQUENCIES.map((freq, i) => {
              const gain = gains[i] || 0;
              const formattedFreq = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

              return (
                <div key={freq} className="flex-1 flex flex-col items-center justify-between h-full group">
                  {/* dB Badge Indicator */}
                  <span
                    className={`text-[10px] font-mono font-bold transition-colors ${
                      gain > 0
                        ? 'text-[#FF2DAA]'
                        : gain < 0
                        ? 'text-[#20CFFF]'
                        : 'text-zinc-500'
                    }`}
                  >
                    {gain > 0 ? `+${gain}` : gain}
                  </span>

                  {/* Vertical Channel Slider */}
                  <div className="relative flex-1 flex items-center justify-center py-2 w-full">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={gain}
                      onChange={(e) => handleBandChange(i, parseInt(e.target.value, 10))}
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        height: '110px',
                      }}
                      className="cursor-pointer accent-[#FF2DAA] hover:accent-[#20CFFF] transition-colors"
                    />
                  </div>

                  {/* Frequency Strip Label */}
                  <span className="text-[10px] font-mono text-zinc-400 mt-2 font-semibold">
                    {formattedFreq}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acoustic Preset Selector Buttons */}
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 font-bold">
            Studio Master Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(DEFAULT_PRESETS).map((pName) => {
              const isSelected = activePresetName === pName;
              return (
                <button
                  key={pName}
                  onClick={() => handleSelectPreset(pName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF2DAA] to-[#8B35FF] text-white border-pink-500/50 shadow-lg shadow-pink-500/30 scale-105'
                      : 'bg-white/[0.04] text-zinc-400 border-white/5 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {pName}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
