import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSpotifyToken } from '../lib/spotify';
import { useToast } from '../context/ToastContext';
import { Loader2, CheckCircle2, AlertCircle, Music, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(
        error === 'access_denied'
          ? 'Spotify authorization was cancelled.'
          : `Spotify authorization error: ${error}`
      );
      showToast('Spotify connection was cancelled', 'info');
      return;
    }

    if (!code) {
      // If visited directly with no parameters, redirect to connect
      navigate('/connect', { replace: true });
      return;
    }

    // Exchange authorization code for Spotify tokens via PKCE
    const exchangeToken = async () => {
      try {
        await getSpotifyToken(code);
        setStatus('success');
        showToast('Spotify account successfully connected! 🟢');
        
        // Brief delay for delightful confirmation transition
        setTimeout(() => {
          navigate('/connect', { replace: true });
        }, 1200);
      } catch (err: any) {
        console.error('Spotify token exchange failed:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to exchange credentials with Spotify. Please try again.');
        showToast('Failed to connect Spotify', 'error');
      }
    };

    exchangeToken();
  }, [searchParams, navigate, showToast]);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card max-w-md w-full rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden border border-white/10 shadow-2xl"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1DB954] to-transparent pointer-events-none" />

        {/* Status Graphic */}
        <div className="mb-6 flex justify-center">
          {status === 'processing' && (
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-xl shadow-[#1DB954]/10">
                <Music className="w-10 h-10 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-[var(--card-bg)] rounded-full">
                <Loader2 className="w-5 h-5 text-[#1DB954] animate-spin" />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          )}

          {status === 'error' && (
            <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
              <AlertCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Content */}
        {status === 'processing' && (
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
              Connecting Spotify
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Exchanging secure PKCE tokens with Spotify to activate Liked Songs syncing...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-emerald-400 tracking-tight">
              Connected Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Your Spotify account is now linked. Redirecting you to Music Connect...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-rose-400 tracking-tight">
                Connection Failed
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/connect', { replace: true })}
                className="w-full py-3.5 btn-primary-glass rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 text-white active:scale-98 transition-all"
              >
                <span>Return to Music Connect</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
