import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Download, Share2, Music, ExternalLink, QrCode, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { SongResult } from './SongCard';
import { useToast } from '../context/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  song: SongResult | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, song, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { showToast } = useToast();

  // Compute the best shareable song link
  const shareUrl = React.useMemo(() => {
    if (!song) return window.location.href;
    if (song.spotifyId) {
      return `https://open.spotify.com/track/${song.spotifyId}`;
    }
    if (song.appleMusicId) {
      return `https://music.apple.com/song/${song.appleMusicId}`;
    }
    // Search fallback link on Spotify
    return `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`;
  }, [song]);

  useEffect(() => {
    if (!isOpen || !song) return;

    let isMounted = true;
    setIsGenerating(true);
    setCopied(false);

    // Generate QR Code data URL with high contrast and optimal mobile scannability
    QRCode.toDataURL(shareUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#09090F',     // Crisp dark modules
        light: '#FFFFFF',    // High-contrast clean white background for reliable camera scanning
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, song, shareUrl]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Track link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy link to clipboard', 'error');
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !song) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const sanitizedTitle = song.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    link.download = `melodisnap_${sanitizedTitle}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code image downloaded');
  };

  const handleNativeShare = async () => {
    if (!song) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} · ${song.artist}`,
          text: `Check out "${song.title}" by ${song.artist} on melodisnap`,
          url: shareUrl,
        });
      } catch {
        // User closed the share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen || !song) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-cyan-500/30 overflow-hidden z-10"
        >
          {/* Subtle top edge light line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>Share In Person</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              aria-label="Close share modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Song Mini Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--subtle-btn-bg)] border border-[var(--glass-border)] mb-5">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[var(--card-bg)] border border-white/10 shadow-sm">
              {song.artwork ? (
                <img
                  src={song.artwork}
                  alt={song.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-400">
                  <Music className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] truncate leading-snug">
                {song.title}
              </h3>
              <p className="text-xs text-[var(--text-sub)] truncate font-medium mt-0.5">
                {song.artist}
              </p>
              {song.album && (
                <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                  {song.album}
                </p>
              )}
            </div>
          </div>

          {/* Styled Dynamic QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-cyan-950/20 to-black/30 border border-cyan-500/20 mb-5 relative group">
            <div className="relative p-3.5 rounded-2xl bg-white shadow-xl shadow-cyan-500/10 border-2 border-cyan-400/40">
              {isGenerating ? (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center gap-2">
                  <span className="w-8 h-8 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-600">Generating QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${song.title} by ${song.artist}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-lg object-contain block select-none"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-red-500">
                  Unable to render QR
                </div>
              )}
            </div>

            {/* In-Person Mobile Camera Guidance */}
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium mt-3.5 text-center">
              <Smartphone className="w-4 h-4 shrink-0 text-cyan-400 animate-pulse" />
              <span>Scan with any smartphone camera to listen</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="btn-secondary-glass py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:border-cyan-400 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              {/* Download QR Code Button */}
              <button
                onClick={handleDownloadQR}
                disabled={isGenerating || !qrDataUrl}
                className="btn-secondary-glass py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:border-cyan-400 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Save QR Code</span>
              </button>
            </div>

            {/* Direct Platform or System Share Button */}
            <div className="flex items-center gap-2.5 pt-1">
              {song.spotifyId && (
                <button
                  onClick={() => window.open(shareUrl, '_blank')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1DB954]/90 text-black font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-md shadow-[#1DB954]/20 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z" />
                  </svg>
                  <span>Open Spotify</span>
                </button>
              )}

              <button
                onClick={handleNativeShare}
                className="btn-primary-glass flex-1 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via App</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
