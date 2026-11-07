import React, { useState, useEffect } from 'react';
import { loginWithSpotify, getSpotifyToken } from '../lib/spotify';
import { Music, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

export const Connect = () => {
  const [spotifyStatus, setSpotifyStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) setSpotifyStatus('connected');

    // Handle Spotify Callback if landed on /connect with code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleSpotifyCallback(code);
    }
  }, []);

  const handleSpotifyCallback = async (code: string) => {
    try {
      await getSpotifyToken(code);
      setSpotifyStatus('connected');
      window.history.replaceState({}, document.title, '/connect');
      showToast('Spotify account successfully connected! 🟢');
    } catch (err: any) {
      console.error('Spotify connection failed', err);
      showToast(err.message || 'Spotify connection failed', 'error');
    }
  };

  const handleConnectSpotify = async () => {
    try {
      await loginWithSpotify();
    } catch (err: any) {
      showToast(err.message || 'Please check that SPOTIFY_CLIENT_ID is configured in environment variables.', 'error');
    }
  };

  const disconnectSpotify = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_redirect_uri');
    setSpotifyStatus('disconnected');
    showToast('Disconnected from Spotify');
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--text-main)] mb-3 tracking-tight">
            Connect Spotify
          </h1>
          <p className="text-[var(--text-muted)] text-base sm:text-lg font-medium">
            Sync your captured music discoveries directly to your Spotify Liked Songs and playlists
          </p>
        </header>

        {/* Spotify Showcase Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group shadow-2xl border border-white/10"
        >
          {/* Subtle Spotify Background Glow */}
          <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 group-hover:opacity-15 transition-opacity duration-700 pointer-events-none">
            <svg viewBox="0 0 24 24" className="w-56 h-56 fill-[#1DB954]"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-[#1DB954] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/25">
                <Music className="w-8 h-8 fill-current" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Spotify</h2>
                <span className="text-xs font-semibold text-[#1DB954] uppercase tracking-wider">Official Integration</span>
              </div>
            </div>
            
            <p className="text-[var(--text-muted)] mb-8 leading-relaxed font-medium text-sm sm:text-base max-w-xl">
              Instantly sync recognized songs and history tracklists directly to your Spotify Liked Songs with one tap. Open any track seamlessly in Spotify across all your devices.
            </p>

            {spotifyStatus === 'connected' ? (
              <div className="space-y-4 max-w-md">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] font-black tracking-widest text-xs uppercase mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONNECTED TO SPOTIFY</span>
                </div>
                <button 
                  onClick={disconnectSpotify}
                  className="w-full py-4 btn-secondary-glass rounded-2xl font-bold text-xs tracking-widest transition-all uppercase hover:text-red-400"
                >
                  DISCONNECT ACCOUNT
                </button>
              </div>
            ) : (
              <div className="max-w-md">
                <button 
                  onClick={handleConnectSpotify}
                  className="w-full py-4.5 bg-[#1DB954] hover:bg-[#1DB954]/90 text-black rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-[#1DB954]/25 uppercase hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
                  <span>CONNECT SPOTIFY</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Security Info Card */}
        <div className="mt-10 glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-5 shadow-xl border border-[var(--glass-border)]">
          <div className="p-3.5 bg-[var(--accent-primary)]/10 rounded-2xl text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1 tracking-tight">
              Secure OAuth 2.0 PKCE Authorization
            </h3>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
              We link directly via official Spotify OAuth without storing your password. Only permissions to add and read your saved tracks are requested.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
