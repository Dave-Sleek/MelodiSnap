import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Activity, Radio, Disc3, Volume2 } from 'lucide-react';

export type VisualizerMode = 'bars' | 'wave' | 'pulse';

interface CanvasMusicVisualizerProps {
  className?: string;
  variant?: 'hero' | 'compact' | 'ambient';
  height?: number;
  showControls?: boolean;
}

export const CanvasMusicVisualizer: React.FC<CanvasMusicVisualizerProps> = ({
  className = '',
  variant = 'hero',
  height = 140,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { currentTrack, isPlaying, getAudioData, togglePlay } = useAudioPlayer();
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const animationFrameRef = useRef<number | null>(null);

  // Peak markers for spectrum bars to add organic physics
  const peaksRef = useRef<number[]>(new Array(36).fill(0));
  const smoothBarsRef = useRef<number[]>(new Array(36).fill(0));
  const phaseRef = useRef<number>(0);

  // Determine current color scheme
  const isNightMode = useCallback(() => {
    return document.documentElement.classList.contains('night-mode');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    // Handle high-DPI retina display rendering
    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = rect.width || 400;
      const displayHeight = height || (variant === 'compact' ? 80 : 140);

      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Animation Render Loop (Runs at native 60fps)
    const render = () => {
      if (!isSubscribed || !canvas) return;

      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || canvas.width;
      const h = height || (variant === 'compact' ? 80 : 140);

      ctx.clearRect(0, 0, width, h);

      const audioData = getAudioData();
      const { frequencyData, timeData, isPlaying: audioPlaying, bassEnergy, midEnergy, trebleEnergy } = audioData;

      phaseRef.current += audioPlaying ? 0.05 + bassEnergy * 0.05 : 0.015;
      const phase = phaseRef.current;

      const dark = isNightMode();
      const primaryHex = dark ? '#0A84FF' : '#007AFF';
      const secondaryHex = dark ? '#5E5CE6' : '#5856D6';
      const accentCyan = dark ? '#64D2FF' : '#00C7BE';

      if (mode === 'bars') {
        // --- SPECTRUM BARS WITH FLOATING PEAKS & GLOW ---
        const barCount = Math.min(36, Math.floor(width / 14));
        const totalSpacing = 4;
        const totalBarWidth = (width - (barCount - 1) * totalSpacing) / barCount;
        const barWidth = Math.max(3, Math.min(10, totalBarWidth));
        const actualSpacing = (width - barCount * barWidth) / (barCount - 1);

        const peaks = peaksRef.current;
        const smoothBars = smoothBarsRef.current;

        for (let i = 0; i < barCount; i++) {
          // Map index to frequency bin with logarithmic weight towards bass
          const binIndex = Math.min(63, Math.floor(Math.pow(i / barCount, 1.3) * 50));
          const rawVal = frequencyData[binIndex] || 0;
          
          let targetHeight = 0;
          if (audioPlaying) {
            targetHeight = (rawVal / 255) * (h * 0.78);
            // Add subtle baseline bounce
            targetHeight = Math.max(4, targetHeight);
          } else {
            // Tranquil idle breath wave
            targetHeight = Math.sin(phase + i * 0.25) * 4 + 6;
          }

          // Smooth interpolation
          smoothBars[i] = (smoothBars[i] || 0) * 0.72 + targetHeight * 0.28;
          const barHeight = smoothBars[i];

          // Peak physics (gravity drop)
          if (barHeight > (peaks[i] || 0)) {
            peaks[i] = barHeight;
          } else {
            peaks[i] = Math.max(0, (peaks[i] || 0) - (audioPlaying ? 1.2 : 0.4));
          }

          const x = i * (barWidth + actualSpacing);
          const y = h - barHeight;

          // Gradient for bar
          const gradient = ctx.createLinearGradient(0, y, 0, h);
          if (i / barCount < 0.4) {
            gradient.addColorStop(0, primaryHex);
            gradient.addColorStop(1, `${primaryHex}33`);
          } else if (i / barCount < 0.75) {
            gradient.addColorStop(0, secondaryHex);
            gradient.addColorStop(1, `${secondaryHex}33`);
          } else {
            gradient.addColorStop(0, accentCyan);
            gradient.addColorStop(1, `${accentCyan}33`);
          }

          // Draw rounded bar
          ctx.fillStyle = gradient;
          ctx.beginPath();
          const radius = Math.min(barWidth / 2, 4);
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 1, 1]);
          ctx.fill();

          // Draw floating peak indicator dot
          if (peaks[i] > 3) {
            const peakY = Math.max(2, h - peaks[i] - 3);
            ctx.fillStyle = dark ? '#FFFFFF' : primaryHex;
            ctx.shadowColor = primaryHex;
            ctx.shadowBlur = audioPlaying ? 6 : 0;
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, peakY, Math.min(2, barWidth / 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else if (mode === 'wave') {
        // --- MULTI-LAYERED ACOUSTIC HARMONIC WAVEFORM ---
        const layers = 3;
        for (let l = 0; l < layers; l++) {
          ctx.beginPath();
          ctx.moveTo(0, h);

          const step = Math.max(4, width / 40);
          const pointsCount = Math.ceil(width / step) + 1;
          const layerSpeed = 1 + l * 0.4;
          const layerPhase = phase * layerSpeed + l * 1.5;
          const layerEnergy = l === 0 ? bassEnergy : l === 1 ? midEnergy : trebleEnergy;

          for (let p = 0; p < pointsCount; p++) {
            const x = p * step;
            const normX = x / width;
            // Center emphasis envelope
            const envelope = Math.sin(normX * Math.PI);

            // Fetch time domain / frequency vibration
            const timeSample = (timeData[p % timeData.length] - 128) / 128;
            const waveA = Math.sin(layerPhase + normX * 8) * (h * 0.22);
            const waveB = Math.cos(layerPhase * 1.3 + normX * 14) * (h * 0.12);
            const dynamicAmp = audioPlaying ? (layerEnergy * 0.8 + 0.2) : 0.15;
            
            const displacement = (waveA + waveB + timeSample * 15) * envelope * dynamicAmp;
            const y = h * 0.55 - displacement;

            if (p === 0) {
              ctx.lineTo(x, y);
            } else {
              const prevX = (p - 1) * step;
              const midX = (prevX + x) / 2;
              ctx.quadraticCurveTo(prevX, y, midX, y);
            }
          }

          ctx.lineTo(width, h);
          ctx.closePath();

          const layerGradient = ctx.createLinearGradient(0, h * 0.2, 0, h);
          if (l === 0) {
            layerGradient.addColorStop(0, `${primaryHex}66`);
            layerGradient.addColorStop(1, `${primaryHex}05`);
          } else if (l === 1) {
            layerGradient.addColorStop(0, `${secondaryHex}55`);
            layerGradient.addColorStop(1, `${secondaryHex}05`);
          } else {
            layerGradient.addColorStop(0, `${accentCyan}44`);
            layerGradient.addColorStop(1, `${accentCyan}05`);
          }

          ctx.fillStyle = layerGradient;
          ctx.fill();

          // Crest outline
          ctx.lineWidth = l === 0 ? 2 : 1.5;
          ctx.strokeStyle = l === 0 ? primaryHex : l === 1 ? secondaryHex : accentCyan;
          ctx.stroke();
        }
      } else if (mode === 'pulse') {
        // --- CONCENTRIC ORBITAL RHYTHM PULSE ---
        const centerX = width / 2;
        const centerY = h / 2;
        const maxRadius = Math.min(width, h) * 0.44;
        const ringsCount = 5;

        for (let r = 1; r <= ringsCount; r++) {
          const normR = r / ringsCount;
          const energyFactor = audioPlaying ? bassEnergy * 0.5 + midEnergy * 0.5 : 0.05;
          const ringRadius = maxRadius * normR * (1 + energyFactor * 0.35);

          ctx.beginPath();
          // Perturb ring with audio frequencies
          const segments = 48;
          for (let s = 0; s <= segments; s++) {
            const angle = (s / segments) * Math.PI * 2;
            const freqSample = (frequencyData[s % 32] || 0) / 255;
            const wobble = audioPlaying ? Math.sin(angle * 6 + phase * 2) * (freqSample * 8) : Math.sin(angle * 4 + phase) * 2;
            const rad = ringRadius + wobble;
            const px = centerX + Math.cos(angle) * rad;
            const py = centerY + Math.sin(angle) * rad;

            if (s === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();

          const alpha = (1 - normR * 0.75) * (audioPlaying ? 0.8 : 0.3);
          ctx.lineWidth = Math.max(1, (ringsCount - r + 1) * 0.8);
          ctx.strokeStyle = r % 2 === 0 ? `${primaryHex}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}` : `${secondaryHex}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.stroke();
        }

        // Center sonic node
        const coreRadius = Math.max(4, 12 * (1 + bassEnergy * 0.7));
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = primaryHex;
        ctx.shadowColor = primaryHex;
        ctx.shadowBlur = audioPlaying ? 16 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [mode, variant, height, getAudioData, isNightMode]);

  return (
    <div 
      ref={containerRef} 
      className={`relative rounded-2xl overflow-hidden glass-card transition-all ${className}`}
    >
      {/* Background ambient glow matching audio tempo */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-[var(--accent-primary)]/5 via-transparent to-transparent pointer-events-none transition-opacity duration-500 ${
          isPlaying ? 'opacity-100' : 'opacity-40'
        }`} 
      />

      {/* Top subtle highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent pointer-events-none" />

      {/* Main Canvas Viewport */}
      <div className="relative w-full flex items-center justify-center p-2">
        <canvas 
          ref={canvasRef} 
          className="w-full block touch-none cursor-pointer"
          onClick={() => {
            if (currentTrack) togglePlay();
          }}
          title={isPlaying ? 'Click visualizer to pause audio' : 'Click visualizer to play audio'}
          aria-label="Real-time audio visualizer canvas"
        />
      </div>

      {/* Visualizer Controls & Status Footer */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--glass-border)] bg-[var(--subtle-btn-bg)]/50 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-[var(--text-muted)]'}`} />
            <span className="font-semibold text-[11px] text-[var(--text-sub)]">
              {isPlaying ? (
                <span className="flex items-center gap-1 text-[var(--accent-primary)]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Live Spectrum</span>
                </span>
              ) : (
                <span className="text-[var(--text-muted)]">Visualizer Ready</span>
              )}
            </span>
          </div>

          {/* Interactive Mode Segmented Tabs */}
          <div className="flex items-center gap-1 bg-[var(--subtle-btn-bg)] p-1 rounded-xl border border-[var(--glass-border)]">
            <button
              onClick={() => setMode('bars')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                mode === 'bars' 
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Equalizer Spectrum Bars"
            >
              <Activity className="w-3 h-3" />
              <span className="hidden sm:inline">Bars</span>
            </button>

            <button
              onClick={() => setMode('wave')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                mode === 'wave' 
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Acoustic Waveform"
            >
              <Radio className="w-3 h-3" />
              <span className="hidden sm:inline">Wave</span>
            </button>

            <button
              onClick={() => setMode('pulse')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                mode === 'pulse' 
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Concentric Rhythm Pulse"
            >
              <Disc3 className="w-3 h-3" />
              <span className="hidden sm:inline">Pulse</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
