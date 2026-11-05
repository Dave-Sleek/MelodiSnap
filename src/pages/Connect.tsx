import React, { useState, useEffect } from 'react';
import { loginWithSpotify, getSpotifyToken } from '../lib/spotify';
import { Music, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const Connect = () => {
  const [spotifyStatus, setSpotifyStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [appleStatus, setAppleStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) setSpotifyStatus('connected');

    // Handle Spotify Callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && window.location.pathname.includes('/callback/spotify')) {
      handleSpotifyCallback(code);
    }
  }, []);

  const handleSpotifyCallback = async (code: string) => {
    try {
      await getSpotifyToken(code);
      setSpotifyStatus('connected');
      window.history.replaceState({}, document.title, "/connect");
    } catch (err) {
      console.error('Spotify connection failed', err);
    }
  };

  const disconnectSpotify = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    setSpotifyStatus('disconnected');
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-black text-[var(--text-main)] mb-3 tracking-tight">Connect Music</h1>
          <p className="text-[var(--text-muted)] text-xl font-medium">Sync your discoveries with your favorite platforms</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Spotify Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group shadow-xl border border-white/10"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-15 transition-opacity duration-700 pointer-events-none">
              <svg viewBox="0 0 24 24" className="w-44 h-44 fill-[#1DB954]"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 bg-[#1DB954] rounded-3xl flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/25">
                  <Music className="w-8 h-8 fill-current" />
                </div>
                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Spotify</h2>
              </div>
              
              <p className="text-[var(--text-muted)] mb-10 leading-relaxed font-medium text-sm sm:text-base">
                Instantly add identified tracks to your Liked Songs and personal playlists with seamless one-click sync.
              </p>

              {spotifyStatus === 'connected' ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-[#1DB954] font-black tracking-widest text-xs uppercase mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONNECTED</span>
                  </div>
                  <button 
                    onClick={disconnectSpotify}
                    className="w-full py-4 btn-secondary-glass rounded-2xl font-bold text-xs tracking-widest transition-all uppercase"
                  >
                    DISCONNECT
                  </button>
                </div>
              ) : (
                <button 
                  onClick={loginWithSpotify}
                  className="w-full py-4.5 bg-[#1DB954] hover:bg-[#1DB954]/90 text-black rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-[#1DB954]/25 uppercase hover:-translate-y-0.5 active:translate-y-0"
                >
                  CONNECT SPOTIFY
                </button>
              )}
            </div>
          </motion.div>

          {/* Apple Music Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group shadow-xl border border-white/10"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-15 transition-opacity duration-700 pointer-events-none">
              <Music className="w-44 h-44 text-[#FA2D55]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 bg-[#FA2D55] rounded-3xl flex items-center justify-center text-white force-white shadow-lg shadow-[#FA2D55]/25">
                  <Music className="w-8 h-8 fill-current text-white force-white" />
                </div>
                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Apple Music</h2>
              </div>
              
              <p className="text-[var(--text-muted)] mb-10 leading-relaxed font-medium text-sm sm:text-base">
                Sync discoveries to your Apple Music cloud library and organize your recognized music with ease.
              </p>

              {appleStatus === 'connected' ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-[#FA2D55] font-black tracking-widest text-xs uppercase mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONNECTED</span>
                  </div>
                  <button 
                    className="w-full py-4 btn-secondary-glass rounded-2xl font-bold text-xs tracking-widest transition-all uppercase"
                  >
                    DISCONNECT
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full py-4.5 bg-[#FA2D55] hover:bg-[#FA2D55]/90 text-white force-white rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-[#FA2D55]/25 uppercase hover:-translate-y-0.5 active:translate-y-0"
                >
                  CONNECT APPLE MUSIC
                </button>
              )}
            </div>
          </motion.div>
        </div>

        <div className="mt-16 glass-card rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-6 shadow-xl border border-[var(--glass-border)]">
          <div className="p-4 bg-[var(--accent-primary)]/10 rounded-2xl text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1.5 tracking-tight">Secure Authentication</h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              We use standard OAuth 2.0 protocols to link your streaming accounts. Your account credentials and passwords are never handled or stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

