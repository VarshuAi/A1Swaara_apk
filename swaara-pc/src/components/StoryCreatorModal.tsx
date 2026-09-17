import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  Camera,
  Layers,
  Flame,
  Palette,
  Headphones,
  Repeat,
  Radio,
  Moon,
} from 'lucide-react';
import { Track } from '../types/music';

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

const PALETTES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    from: '#FF2DAA',
    to: '#8B35FF',
    bg: 'from-[#1A0B2E] via-[#0E071D] to-[#06040A]',
  },
  {
    id: 'aurora',
    name: 'Arctic Aurora',
    from: '#20CFFF',
    to: '#05FFA1',
    bg: 'from-[#051C24] via-[#031017] to-[#02070A]',
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    from: '#FF6B00',
    to: '#FF2D55',
    bg: 'from-[#290E08] via-[#140604] to-[#080202]',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Minimal',
    from: '#FFFFFF',
    to: '#9CA3AF',
    bg: 'from-[#14141E] via-[#0A0A10] to-[#040407]',
  },
];

const VIBE_OPTIONS = [
  { id: 'Listening', label: 'Listening', icon: Headphones },
  { id: 'Repeat', label: 'Repeat', icon: Repeat },
  { id: 'Radio', label: 'Radio', icon: Radio },
  { id: 'Favorite', label: 'Favorite', icon: Sparkles },
  { id: 'Night', label: 'Late Night', icon: Moon },
  { id: 'Energy', label: 'Energy', icon: Flame },
];

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState(VIBE_OPTIONS[0]);
  const [activePalette, setActivePalette] = useState(PALETTES[0]);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !track) return null;

  const cleanTitle = track.title.replace(/\(Official.*?\)|\[Official.*?\]/gi, '').trim();
  const noteText = `${cleanTitle.slice(0, 26)} — ${track.artist.slice(0, 16)} // ${selectedVibe.label}`.slice(0, 60);

  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(noteText);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `https://a1raaga.vercel.app/s/${track.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export 9:16 Story Card as 1080x1920 high-res PNG using Canvas
  const handleExportCard = () => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#06060A');
    bgGrad.addColorStop(0.5, '#100C1C');
    bgGrad.addColorStop(1, '#040306');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient Color Orbs
    const orb1 = ctx.createRadialGradient(280, 420, 50, 280, 420, 560);
    orb1.addColorStop(0, `${activePalette.from}55`);
    orb1.addColorStop(1, 'transparent');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, 1080, 1920);

    const orb2 = ctx.createRadialGradient(840, 1380, 50, 840, 1380, 600);
    orb2.addColorStop(0, `${activePalette.to}45`);
    orb2.addColorStop(1, 'transparent');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. Top Branding Badge
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = activePalette.from;
    ctx.textAlign = 'center';
    ctx.fillText('A1 SWAARA PRO', 540, 240);

    ctx.font = '26px "JetBrains Mono", monospace';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('PURE 320 KBPS HIGH-FIDELITY MASTER', 540, 290);

    // 4. Load & Draw Artwork
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const artX = 180;
      const artY = 420;
      const artSize = 720;

      // Drop shadow for artwork
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(artX, artY, artSize, artSize, [48]);
      ctx.clip();
      ctx.drawImage(img, artX, artY, artSize, artSize);
      ctx.restore();

      ctx.shadowColor = 'transparent';

      // 5. Title & Artist
      ctx.font = '900 62px Inter, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      const maxTitle = cleanTitle.length > 24 ? cleanTitle.slice(0, 24) + '...' : cleanTitle;
      ctx.fillText(maxTitle, 540, 1260);

      ctx.font = '600 40px Inter, sans-serif';
      ctx.fillStyle = '#A1A1AA';
      const maxArtist = track.artist.length > 28 ? track.artist.slice(0, 28) + '...' : track.artist;
      ctx.fillText(maxArtist, 540, 1330);

      // 6. Audio Waveform Spectrum Bars
      const barCount = 32;
      const startX = 200;
      const barWidth = 14;
      const spacing = 22;
      for (let i = 0; i < barCount; i++) {
        const height = 45 + Math.sin(i * 0.45) * 55 + (i % 4) * 20;
        const x = startX + i * spacing;
        const y = 1480 - height / 2;

        const barGrad = ctx.createLinearGradient(0, y, 0, y + height);
        barGrad.addColorStop(0, activePalette.from);
        barGrad.addColorStop(1, activePalette.to);

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, [7]);
        ctx.fill();
      }

      // 7. Watermark / Engineered signature
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillStyle = '#52525B';
      ctx.fillText('SWAARA MASTER SOUND · QUANTUM LOSSLESS', 540, 1720);

      // Trigger high-res file download
      const link = document.createElement('a');
      link.download = `Swaara_Story_${cleanTitle.slice(0, 15).replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsExporting(false);
    };

    img.onerror = () => {
      setIsExporting(false);
    };

    img.src = track.artwork;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-[32px] bg-[#0C0C14] border border-white/15 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] space-y-6 overflow-hidden">
        {/* Specular Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-[#FF2DAA]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-[#20CFFF] to-[#8B35FF] p-[1.5px] shadow-lg shadow-cyan-500/25">
              <div className="size-full bg-[#0E0E18] rounded-[14.5px] flex items-center justify-center">
                <Share2 className="size-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Social Share Studio</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#20CFFF] border border-cyan-500/40 text-[10px] font-mono font-bold tracking-wider">
                  9:16 PRO CANVAS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generate high-res Instagram/TikTok stories and 60-char vibe notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Two-Column Studio Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Column: 9:16 Preview Card */}
          <div className="flex justify-center">
            <div
              className={`w-56 aspect-[9/16] rounded-3xl bg-gradient-to-b ${activePalette.bg} border border-white/20 p-4 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden`}
            >
              {/* Internal Glow Orbs */}
              <div
                className="absolute -top-12 -left-12 size-36 rounded-full blur-2xl pointer-events-none opacity-60"
                style={{ backgroundColor: activePalette.from }}
              />
              <div
                className="absolute -bottom-12 -right-12 size-36 rounded-full blur-2xl pointer-events-none opacity-50"
                style={{ backgroundColor: activePalette.to }}
              />

              {/* Card Header */}
              <div className="relative z-10 pt-2">
                <span
                  className="text-[10px] font-mono font-extrabold tracking-widest uppercase"
                  style={{ color: activePalette.from }}
                >
                  A1 Swaara Pro
                </span>
              </div>

              {/* Artwork Cover */}
              <div className="relative z-10 size-32 rounded-2xl overflow-hidden shadow-2xl border border-white/25 my-auto bg-zinc-900 group">
                <img src={track.artwork} alt={track.title} className="size-full object-cover" />
              </div>

              {/* Track Info & Spectrum */}
              <div className="relative z-10 w-full space-y-2 pb-2">
                <h4 className="font-bold text-xs text-white truncate px-1">{cleanTitle}</h4>
                <p className="text-[10px] text-zinc-400 truncate">{track.artist}</p>

                {/* Animated Spectrum Simulation */}
                <div className="flex items-end justify-center gap-0.5 h-6 pt-1">
                  {[35, 75, 50, 95, 80, 45, 90, 60, 85, 45, 70, 50].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(to top, ${activePalette.from}, ${activePalette.to})`,
                      }}
                    />
                  ))}
                </div>

                <span className="text-[8px] font-mono text-zinc-500 block pt-1 tracking-wider">
                  320 KBPS MASTER · QUANTUM LOSSLESS
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Customizer & Action Controls */}
          <div className="space-y-4">
            {/* Palette Picker */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-zinc-400 font-semibold flex items-center gap-1.5">
                <Palette className="size-3.5 text-cyan-400" />
                Color Theme
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePalette(p)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      activePalette.id === p.id
                        ? 'bg-white/10 border-white/40 text-white shadow'
                        : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ background: `linear-gradient(to right, ${p.from}, ${p.to})` }}
                    />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Instagram Vibe Note Box */}
            <div className="p-3.5 rounded-2xl bg-[#12121E] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <InstagramIcon className="size-4 text-pink-400" />
                  <span>Instagram Note Status</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">60-char limit</span>
              </div>

              {/* Premium status badge presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {VIBE_OPTIONS.map((vibe) => {
                  const Icon = vibe.icon;
                  const isSelected = selectedVibe.id === vibe.id;
                  return (
                    <button
                      key={vibe.id}
                      onClick={() => setSelectedVibe(vibe)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-500/25 border border-pink-500 text-white shadow-sm'
                          : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="size-3" />
                      <span>{vibe.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-pink-300 truncate">
                {noteText}
              </div>

              <button
                onClick={handleCopyNote}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                {copiedNote ? (
                  <>
                    <Check className="size-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied Note to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 text-zinc-300" />
                    <span>Copy Instagram Note</span>
                  </>
                )}
              </button>
            </div>

            {/* High-Resolution PNG Export Button */}
            <button
              onClick={handleExportCard}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#FF2DAA] via-[#8B35FF] to-[#20CFFF] text-white font-bold text-xs shadow-xl shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="size-4" />
              <span>{isExporting ? 'Rendering HD Card...' : 'Export 9:16 Story (1080x1920 PNG)'}</span>
            </button>

            {/* Copy Share Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-4 text-zinc-400" />
                  <span>Copy Web Player Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
