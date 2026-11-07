import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Music, ExternalLink, Share2, Mic2 } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useShareModal } from '../context/ShareModalContext';
import { useLyricsModal } from '../context/LyricsModalContext';

export const AudioPlayerBar = () => {
  const { currentTrack, isPlaying, isLoading, progress, currentTime, duration, togglePlay, seekTrack, closePlayer } = useAudioPlayer();
  const { openShareModal } = useShareModal();
  const { openLyrics } = useLyricsModal();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [currentTrack?.artwork]);

  if (!currentTrack) return null;

  const hasPreview = Boolean(currentTrack.previewUrl && currentTrack.previewUrl.trim());

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    seekTrack(ratio);
  };

  const handleShare = () => {
    openShareModal(currentTrack);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:max-w-xl z-50 pointer-events-auto"
      >
        <div className="glass-card rounded-2xl p-3 md:p-4 shadow-2xl relative overflow-hidden backdrop-blur-2xl border border-[var(--accent-primary)]/10">
          {/* Subtle top edge light line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent pointer-events-none" />

          {/* Progress Bar (Clickable) */}
          <div 
            onClick={handleSeek}
            className="group relative h-1 w-full bg-[var(--subtle-btn-bg)] rounded-full overflow-hidden mb-3 cursor-pointer"
            role="slider"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Audio scrubber"
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-[var(--accent-primary)] rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(0,122,255,0.6)]"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Song Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-[var(--subtle-btn-bg)] border border-[var(--glass-border)] shadow-sm">
                {currentTrack.artwork && !imageError ? (
                  <img 
                    src={currentTrack.artwork} 
                    alt={currentTrack.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : ''}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--accent-primary)]">
                    <Music className="w-5 h-5" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 h-2 bg-[var(--accent-primary)] animate-pulse" />
                      <span className="w-0.5 h-3 bg-[var(--accent-primary)] animate-pulse delay-75" />
                      <span className="w-0.5 h-1.5 bg-[var(--accent-primary)] animate-pulse delay-150" />
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate leading-tight">
                    {currentTrack.title}
                  </h4>
                  <span className="text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded shrink-0">
                    30s Preview
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] truncate font-medium">
                  <span className="truncate">{currentTrack.artist}</span>
                  <span>·</span>
                  <span className="tabular-nums font-mono text-[10px] text-[var(--text-sub)]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Play / Pause Primary Action */}
              <button
                onClick={togglePlay}
                disabled={!hasPreview || isLoading}
                className="w-10 h-10 rounded-full btn-primary-glass flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 text-white"
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                title={isPlaying ? 'Pause' : 'Play preview'}
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Real-time Lyrics Toggle */}
              <button
                onClick={() => openLyrics(currentTrack)}
                className="p-2 rounded-xl btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 transition-colors border-[var(--accent-primary)]/10"
                title="Show real-time lyrics"
                aria-label="Show real-time lyrics"
              >
                <Mic2 className="w-4 h-4" />
              </button>

              {/* Share QR Code Button */}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 transition-colors border-[var(--accent-primary)]/10"
                title="Share & QR Code"
                aria-label="Share track with QR Code"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Spotify Link */}
              {currentTrack.spotifyId && (
                <button
                  onClick={() => window.open(`https://open.spotify.com/track/${currentTrack.spotifyId}`, '_blank')}
                  className="p-2 text-[#1DB954] hover:bg-[#1DB954]/10 rounded-xl transition-colors hidden sm:flex"
                  title="Open on Spotify"
                  aria-label="Open on Spotify"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
                </button>
              )}

              {/* Dismiss Player */}
              <button
                onClick={closePlayer}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-hover)] transition-colors"
                title="Close player"
                aria-label="Close audio player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
