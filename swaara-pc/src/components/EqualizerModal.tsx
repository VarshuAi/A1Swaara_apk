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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fadeIn">
      {/* Console Chassis */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#111113] border border-white/[0.08] p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#18181B] border border-white/[0.08] flex items-center justify-center text-[#10B981]">
              <SlidersHorizontal className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Equalizer</h2>
              <p className="text-xs text-[#8E8E93]">
                10-Band EQ & Bass Boost
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#202024] border border-white/[0.08] text-xs font-medium text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
              title="Reset to Flat curve"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Live Frequency Response Visualizer Display */}
        <div className="relative rounded-xl bg-[#0A0A0C] border border-white/[0.06] p-3.5 overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#71717A] mb-1 px-1">
            <span className="flex items-center gap-1">
              <Activity className="size-3 text-[#10B981]" />
              FREQUENCY RESPONSE
            </span>
            <span>±12.0 dB</span>
          </div>

          <svg viewBox="0 0 600 120" className="w-full h-20 overflow-visible">
            <defs>
              <linearGradient id="eqGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="eqAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Guidelines */}
            <line x1="30" y1="20" x2="570" y2="20" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="30" y1="60" x2="570" y2="60" stroke="rgba(255,255,255,0.1)" />
            <line x1="30" y1="100" x2="570" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

            {/* Filled area under the curve */}
            {svgAreaPath && <path d={svgAreaPath} fill="url(#eqAreaGrad)" />}

            {/* Main response spline curve */}
            {svgCurvePath && (
              <path
                d={svgCurvePath}
                fill="none"
                stroke="url(#eqGlowGrad)"
                strokeWidth="2.5"
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
                  r="3.5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        {/* Bass Boost Slider */}
        <div className="p-3.5 rounded-xl bg-[#141416] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#18181B] border border-white/[0.06] text-[#10B981] flex items-center justify-center">
              <Zap className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-white">Bass Boost</h4>
                <span className="text-xs font-mono font-medium text-[#10B981]">+{bassBoost} dB</span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                Low-frequency acoustic drive (40Hz–80Hz)
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={bassBoost}
              onChange={(e) => handleBassBoostChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#10B981]"
            />
          </div>
        </div>

        {/* 10-Band Sliders Channel Strip */}
        <div className="p-4 rounded-xl bg-[#141416] border border-white/[0.06]">
          <div className="flex items-end justify-between gap-2 h-36 pb-1">
            {EQ_FREQUENCIES.map((freq, i) => {
              const gain = gains[i] || 0;
              const formattedFreq = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

              return (
                <div key={freq} className="flex-1 flex flex-col items-center justify-between h-full">
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      gain > 0
                        ? 'text-[#10B981]'
                        : gain < 0
                        ? 'text-zinc-400'
                        : 'text-zinc-600'
                    }`}
                  >
                    {gain > 0 ? `+${gain}` : gain}
                  </span>

                  <div className="relative flex-1 flex items-center justify-center py-1.5 w-full">
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
                        height: '90px',
                      }}
                      className="cursor-pointer accent-[#10B981]"
                    />
                  </div>

                  <span className="text-[10px] font-mono text-[#71717A] mt-1">
                    {formattedFreq}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div>
          <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider block mb-2 font-semibold">
            Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(DEFAULT_PRESETS).map((pName) => {
              const isSelected = activePresetName === pName;
              return (
                <button
                  key={pName}
                  onClick={() => handleSelectPreset(pName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#10B981] text-black border-[#10B981] font-semibold'
                      : 'bg-[#18181B] text-[#8E8E93] border-white/[0.06] hover:text-white'
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
