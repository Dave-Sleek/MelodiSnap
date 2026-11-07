import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, X, Copy, Check, RefreshCw, AlertCircle, Sparkles, Play, Pause, AlignLeft, Clock } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useToast } from '../context/ToastContext';
import { SongResult } from './SongCard';

interface LyricLine {
  id: number;
  time: number; // in seconds
  text: string;
}

interface LyricsViewerProps {
  song: SongResult;
  onClose?: () => void;
  className?: string;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  song,
  onClose,
  className = '',
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncedLyricsRaw, setSyncedLyricsRaw] = useState<string | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'synced' | 'plain'>('synced');
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const { currentTime, duration, isPlaying, togglePlay, playTrack, seekTrack, currentTrack } = useAudioPlayer();
  const { showToast } = useToast();
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSyncedLyricsRaw(null);
    setPlainLyrics(null);
    setIsInstrumental(false);

    const fetchLyrics = async () => {
      try {
        const queryParams = new URLSearchParams({
          title: song.title,
          artist: song.artist,
        });
        if (song.album) queryParams.append('album', song.album);

        const res = await fetch(`/api/lyrics?${queryParams.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.status === 'success') {
          setSyncedLyricsRaw(data.syncedLyrics);
          setPlainLyrics(data.plainLyrics);
          setIsInstrumental(Boolean(data.instrumental));
          setViewMode(data.syncedLyrics ? 'synced' : 'plain');
        } else {
          setError(data.error || 'Lyrics are not available for this song.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Could not connect to the lyrics service.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      isMounted = false;
    };
  }, [song.title, song.artist, song.album]);

  // Parse [mm:ss.xx] LRC formatted lines into timestamped objects
  const parsedLines: LyricLine[] = useMemo(() => {
    if (!syncedLyricsRaw) return [];

    const lines = syncedLyricsRaw.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    lines.forEach((line, index) => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fraction = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        const totalSeconds = minutes * 60 + seconds + fraction;
        const text = line.replace(/\[.*?\]/g, '').trim();

        if (text) {
          result.push({
            id: index,
            time: totalSeconds,
            text,
          });
        }
      }
      timeRegex.lastIndex = 0;
    });

    return result.sort((a, b) => a.time - b.time);
  }, [syncedLyricsRaw]);

  // Determine active line index based on playback currentTime
  const activeLineIndex = useMemo(() => {
    if (parsedLines.length === 0) return -1;

    // Find latest line whose timestamp has passed
    for (let i = parsedLines.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLines[i].time - 0.25) {
        return i;
      }
    }
    return 0;
  }, [parsedLines, currentTime]);

  // Smoothly center the active lyric in the scroll viewport
  useEffect(() => {
    if (!autoScroll || viewMode !== 'synced') return;
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, autoScroll, viewMode]);

  // Jump to specific lyric timestamp
  const handleLineClick = (lineTime: number) => {
    if (song.previewUrl) {
      // If song isn't currently loaded into the player, load it
      if (currentTrack?.previewUrl !== song.previewUrl) {
        playTrack({
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: song.artwork,
          previewUrl: song.previewUrl,
          spotifyId: song.spotifyId,
        });
      }
      // Seek to target line position
      if (duration > 0) {
        const ratio = Math.min(1, Math.max(0, lineTime / duration));
        seekTrack(ratio);
      }
    }
  };

  const handleCopyLyrics = async () => {
    const textToCopy = plainLyrics || parsedLines.map((l) => l.text).join('\n');
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(`${song.title} - ${song.artist}\n\n${textToCopy}`);
      setCopied(true);
      showToast('Lyrics copied to clipboard!');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      showToast('Could not copy lyrics to clipboard', 'error');
    }
  };

  return (
    <div className={`relative rounded-3xl glass-card overflow-hidden border border-[var(--glass-border)] shadow-2xl flex flex-col h-full ${className}`}>
      {/* Subtle top edge gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/40 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)] bg-[var(--subtle-btn-bg)]/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
            <Mic2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
                Real-Time Lyrics
              </h3>
              {parsedLines.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold tracking-wider uppercase">
                  Synced
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate font-medium">
              {song.title} · {song.artist}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {parsedLines.length > 0 && (
            <div className="flex items-center bg-[var(--subtle-btn-bg)] p-1 rounded-xl border border-[var(--glass-border)] mr-1">
              <button
                onClick={() => setViewMode('synced')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  viewMode === 'synced'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Synchronized real-time playback"
              >
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">Live</span>
              </button>
              <button
                onClick={() => setViewMode('plain')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                  viewMode === 'plain'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Full text view"
              >
                <AlignLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Text</span>
              </button>
            </div>
          )}

          <button
            onClick={handleCopyLyrics}
            disabled={loading || !!error}
            className="p-2 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors disabled:opacity-40"
            title="Copy lyrics to clipboard"
            aria-label="Copy lyrics"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Close lyrics"
              aria-label="Close lyrics"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Lyrics Body */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 max-h-[380px] sm:max-h-[440px] relative scroll-smooth focus:outline-none"
        tabIndex={0}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <span className="w-8 h-8 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              Fetching real-time lyrics archive...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">
              No Lyrics Available
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mb-4">
              {error}
            </p>
            {song.spotifyId && (
              <button
                onClick={() => window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank')}
                className="px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1DB954]/90 text-black font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-md shadow-[#1DB954]/20 transition-all"
              >
                <span>View on Spotify</span>
              </button>
            )}
          </div>
        )}

        {isInstrumental && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
              Instrumental Track
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              This musical track contains no vocal lyrics. Enjoy the rhythm!
            </p>
          </div>
        )}

        {/* Real-Time Synced Lyrics Mode */}
        {!loading && !error && !isInstrumental && viewMode === 'synced' && parsedLines.length > 0 && (
          <div className="space-y-4 py-6">
            {parsedLines.map((line, index) => {
              const isActive = index === activeLineIndex;
              const isPast = index < activeLineIndex;

              return (
                <motion.div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(line.time)}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={`cursor-pointer rounded-2xl px-4 py-2.5 transition-all duration-300 ${
                    isActive
                      ? 'text-[var(--accent-primary)] text-lg sm:text-2xl font-black bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 shadow-sm'
                      : isPast
                      ? 'text-[var(--text-muted)] opacity-60 text-base sm:text-lg font-semibold hover:opacity-100 hover:text-[var(--text-main)]'
                      : 'text-[var(--text-sub)] opacity-70 text-base sm:text-lg font-semibold hover:opacity-100 hover:text-[var(--text-main)]'
                  }`}
                >
                  <p className="leading-snug tracking-tight">
                    {line.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Plain Text Full Lyrics Mode */}
        {!loading && !error && !isInstrumental && (viewMode === 'plain' || parsedLines.length === 0) && (
          <div className="py-2">
            <pre className="font-sans text-sm sm:text-base font-medium text-[var(--text-sub)] leading-relaxed whitespace-pre-wrap select-text">
              {plainLyrics || parsedLines.map((l) => l.text).join('\n')}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Navigation / Sync Guidance */}
      <div className="px-5 py-3 border-t border-[var(--glass-border)] bg-[var(--subtle-btn-bg)]/40 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
          <span>Tap any line to jump audio playback</span>
        </span>

        {song.previewUrl && (
          <button
            onClick={togglePlay}
            className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
