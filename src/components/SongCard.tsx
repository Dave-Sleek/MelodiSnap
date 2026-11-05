import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Share2, Heart, Music, Check } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useToast } from '../context/ToastContext';
import { useShareModal } from '../context/ShareModalContext';

export interface SongResult {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  spotifyId?: string;
  appleMusicId?: string;
  previewUrl?: string;
  isFavourite?: boolean;
  timestamp?: number;
  genre?: string;
  duration?: string;
}

interface SongCardProps {
  song: SongResult;
  onToggleFavourite?: () => void;
  layout?: 'grid' | 'list' | 'hero';
  index?: number;
}

export const SongCard = ({ 
  song, 
  onToggleFavourite, 
  layout = 'grid',
  index
}: SongCardProps) => {
  const { currentTrack, isPlaying, isLoading, playTrack, togglePlay } = useAudioPlayer();
  const { showToast } = useToast();
  const { openShareModal } = useShareModal();

  const isCurrentTrack = Boolean(song.previewUrl && currentTrack?.previewUrl === song.previewUrl);
  const isCurrentTrackPlaying = isCurrentTrack && isPlaying;
  const isCurrentTrackLoading = isCurrentTrack && isLoading;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song.previewUrl) {
      showToast('No audio preview available for this track', 'info');
      return;
    }

    if (currentTrack?.previewUrl === song.previewUrl) {
      togglePlay();
    } else {
      playTrack({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: song.artwork,
        previewUrl: song.previewUrl,
        spotifyId: song.spotifyId,
        appleMusicId: song.appleMusicId,
      });
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open dynamic styled QR code share modal for in-person and digital sharing
    openShareModal(song);
  };

  // Hero Layout (Used on Home after identification)
  if (layout === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1],
          type: 'spring',
          stiffness: 80,
          damping: 20
        }}
        className="glass-card rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden max-w-3xl w-full mx-auto border border-[var(--accent-primary)]/10"
      >
        {/* Subtle top-edge light shimmer - Single Blue Theme */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row gap-8 items-center relative z-10">
          {/* Artwork Container */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 dark:border-white/10 group">
            {song.artwork ? (
              <img 
                src={song.artwork} 
                alt={song.title} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] via-slate-900 to-slate-950 flex items-center justify-center text-[var(--accent-primary)]">
                <Music className="w-16 h-16" />
              </div>
            )}

            {song.previewUrl && (
              <button
                onClick={handlePlayToggle}
                className="absolute inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={isCurrentTrackPlaying ? 'Pause preview' : 'Play preview'}
              >
                <motion.div 
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full btn-primary-glass flex items-center justify-center shadow-xl text-white"
                >
                  {isCurrentTrackLoading ? (
                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isCurrentTrackPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  )}
                </motion.div>
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                <span>Identified Track</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] truncate tracking-tight">
                {song.title}
              </h2>
              <p className="text-base sm:text-lg text-[var(--text-sub)] font-medium truncate mt-0.5">
                {song.artist}
              </p>
              {song.album && (
                <p className="text-xs text-[var(--text-muted)] truncate mt-1">
                  Album · {song.album}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              {song.previewUrl && (
                <button
                  onClick={handlePlayToggle}
                  className="btn-primary-glass px-6 py-3 rounded-xl font-semibold text-xs tracking-wider flex items-center gap-2.5 active:scale-95 transition-all shadow-lg text-white"
                >
                  {isCurrentTrackLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isCurrentTrackPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{isCurrentTrackLoading ? 'Buffering...' : isCurrentTrackPlaying ? 'Pause Preview' : 'Play 30s Preview'}</span>
                </button>
              )}

              {onToggleFavourite && (
                <button
                  onClick={onToggleFavourite}
                  className={`p-3 rounded-xl btn-secondary-glass transition-all ${
                    song.isFavourite
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'text-[var(--text-main)]'
                  }`}
                  title={song.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                >
                  <Heart className={`w-4 h-4 ${song.isFavourite ? 'fill-current' : ''}`} />
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-3 rounded-xl btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 transition-all border-[var(--accent-primary)]/20"
                title="Share track & QR Code"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {song.spotifyId && (
                <button
                  onClick={() => window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank')}
                  className="px-4 py-3 rounded-xl bg-[#1DB954] hover:bg-[#1DB954]/90 text-black font-bold text-xs tracking-wide flex items-center gap-2 shadow-lg shadow-[#1DB954]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
                  <span>Spotify</span>
                </button>
              )}

              {song.appleMusicId && (
                <button
                  onClick={() => window.open(`https://music.apple.com/song/${song.appleMusicId}`, '_blank')}
                  className="px-4 py-3 rounded-xl bg-[#FA2D55] hover:bg-[#FA2D55]/90 text-white force-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-lg shadow-[#FA2D55]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Music className="w-3.5 h-3.5 text-white force-white" />
                  <span className="text-white force-white">Apple Music</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // List Row Layout (Used in History & Favourites when toggled to List)
  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index ? Math.min(index * 0.03, 0.3) : 0 }}
        className="group flex items-center justify-between gap-4 p-3 rounded-2xl glass-card transition-all"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {index !== undefined && (
            <span className="w-6 text-center text-xs font-mono tabular-nums text-[var(--text-muted)] shrink-0 font-bold">
              {index + 1}
            </span>
          )}

          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[var(--subtle-btn-bg)] border border-[var(--glass-border)]">
            {song.artwork ? (
              <img 
                src={song.artwork} 
                alt={song.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--accent-primary)]">
                <Music className="w-5 h-5" />
              </div>
            )}

            {song.previewUrl && (
              <button
                onClick={handlePlayToggle}
                className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${
                  isCurrentTrackPlaying || isCurrentTrackLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                aria-label={isCurrentTrackPlaying ? 'Pause preview' : 'Play preview'}
              >
                <div className="w-8 h-8 rounded-full btn-primary-glass text-white flex items-center justify-center shadow-md">
                  {isCurrentTrackLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isCurrentTrackPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </div>
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-[var(--text-main)] truncate leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
              {song.title}
            </h4>
            <p className="text-xs text-[var(--text-muted)] truncate font-medium mt-0.5">
              {song.artist}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleFavourite && (
            <button
              onClick={onToggleFavourite}
              className={`p-2.5 rounded-xl btn-secondary-glass transition-colors ${
                song.isFavourite
                  ? 'text-rose-500 bg-rose-500/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title={song.isFavourite ? 'Favourited' : 'Add to favourites'}
            >
              <Heart className={`w-4 h-4 ${song.isFavourite ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2.5 btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 rounded-xl transition-colors border-[var(--accent-primary)]/20"
            title="Share & QR Code"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {song.spotifyId && (
            <button
              onClick={() => window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank')}
              className="p-2 text-[#1DB954] hover:bg-[#1DB954]/10 rounded-xl transition-colors"
              title="Open in Spotify"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Default Grid Layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1],
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: index ? Math.min(index * 0.04, 0.25) : 0
      }}
      className="group glass-card rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Subtle top edge light line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />

      <div>
        {/* Artwork with interactive glass play overlay */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3.5 bg-[var(--subtle-btn-bg)] border border-[var(--glass-border)] shadow-sm">
          {song.artwork ? (
            <img 
              src={song.artwork} 
              alt={song.title} 
              className="w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black flex items-center justify-center text-[var(--accent-primary)]/40">
              <Music className="w-12 h-12" />
            </div>
          )}

          {song.previewUrl ? (
            <button
              onClick={handlePlayToggle}
              className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 ${
                isCurrentTrackPlaying || isCurrentTrackLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              }`}
              aria-label={isCurrentTrackPlaying ? 'Pause preview' : 'Play preview'}
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-full btn-primary-glass flex items-center justify-center shadow-xl text-white"
              >
                {isCurrentTrackLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isCurrentTrackPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </motion.div>
            </button>
          ) : (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-white/70 font-medium">
              No Preview
            </div>
          )}

          {/* Equalizer indicator if playing */}
          {isCurrentTrackPlaying && (
            <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-[var(--accent-primary)]/90 backdrop-blur-sm text-white flex items-center gap-1.5 text-[10px] font-bold shadow-md">
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-1.5 bg-white animate-pulse" />
                <span className="w-0.5 h-2.5 bg-white animate-pulse delay-75" />
                <span className="w-0.5 h-1 bg-white animate-pulse delay-150" />
              </span>
              <span>Playing</span>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="space-y-0.5 mb-3">
          <h4 className="text-sm font-bold text-[var(--text-main)] truncate leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
            {song.title}
          </h4>
          <p className="text-xs text-[var(--text-muted)] truncate font-medium">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Footer Actions with refined glass buttons */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-1.5">
          {onToggleFavourite && (
            <button
              onClick={onToggleFavourite}
              className={`p-2 rounded-xl btn-secondary-glass transition-colors ${
                song.isFavourite
                  ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title={song.isFavourite ? 'Favourited' : 'Add to favourites'}
            >
              <Heart className={`w-3.5 h-3.5 ${song.isFavourite ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 rounded-xl transition-colors border-[var(--accent-primary)]/20"
            title="Share & QR Code"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {song.spotifyId && (
            <button
              onClick={() => window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank')}
              className="p-2 text-[#1DB954] hover:bg-[#1DB954]/10 rounded-xl transition-colors"
              title="Listen on Spotify"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
            </button>
          )}

          {song.appleMusicId && (
            <button
              onClick={() => window.open(`https://music.apple.com/song/${song.appleMusicId}`, '_blank')}
              className="p-2 text-[#FA2D55] hover:bg-[#FA2D55]/10 rounded-xl transition-colors"
              title="Listen on Apple Music"
            >
              <Music className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
