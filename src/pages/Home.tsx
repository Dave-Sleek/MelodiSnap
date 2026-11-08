import React, { useEffect, useRef } from 'react';
import { SongCard } from '../components/SongCard';
import { CanvasMusicVisualizer } from '../components/CanvasMusicVisualizer';
import { getHistory } from '../lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertCircle, History, SearchX, UploadCloud, Loader2, Mic, Lightbulb, Music2, ArrowDown, Play, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useIdentification } from '../context/IdentificationContext';

export const Home = ({ isOffline }: { isOffline?: boolean }) => {
  const { currentTrack, isPlaying } = useAudioPlayer();
  const { 
    isListening, 
    isProcessing, 
    identifiedSong, 
    error, 
    noMatch, 
    resetIdentification, 
    startIdentification, 
    toggleFavouriteIdentified 
  } = useIdentification();
  
  const [recentTracks, setRecentTracks] = React.useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRecent();
  }, [identifiedSong]);

  const loadRecent = async () => {
    try {
      const history = await getHistory();
      setRecentTracks(history.slice(-3).reverse());
    } catch {
      // Ignore idb initialization error
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  };

  return (
    <div className="relative min-h-screen pt-24 md:pt-32 pb-32 px-5 sm:px-8 flex flex-col items-center overflow-x-hidden">
      <div className="max-w-4xl w-full">
        {/* Editorial Header */}
        {!identifiedSong && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 sm:mb-20 space-y-4"
          >
            <h1 className="text-5xl sm:text-7xl font-black text-[var(--text-main)] tracking-tight text-balance leading-[1.1]">
              Identify every <span className="text-[var(--accent-primary)]">rhythm.</span>
            </h1>
            <p className="text-base sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              Capture the music playing around you in seconds. Discover tracks instantly, listen to studio previews, and sync to your streaming library.
            </p>
          </motion.header>
        )}

        <main className="flex flex-col items-center">
          {/* Real-time Canvas Music Visualizer appearing in center of main display area */}
          <AnimatePresence>
            {isPlaying && !identifiedSong && currentTrack && (
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl mb-8"
              >
                <div className="flex items-center justify-between mb-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse shadow-[0_0_8px_rgba(0,122,255,0.7)]" />
                    <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider truncate max-w-[200px] sm:max-w-xs">
                      {currentTrack.title}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium truncate max-w-[150px]">
                    {currentTrack.artist}
                  </span>
                </div>
                <CanvasMusicVisualizer height={125} variant="hero" />
              </motion.div>
            )}
          </AnimatePresence>

          {!identifiedSong && !error && !noMatch && (
            isOffline ? (
              <div className="text-center space-y-4 py-12">
                <div className="w-20 h-20 bg-[var(--subtle-btn-bg)] rounded-full flex items-center justify-center mx-auto text-[var(--text-muted)] border border-[var(--glass-border)]">
                  <WifiOff className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">Offline Mode</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
                  Please connect to the internet to use audio recognition.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* Visual feedback for listening state or Idle state on Home page */}
                <AnimatePresence mode="wait">
                  {isListening || isProcessing ? (
                    <motion.div
                      key="active-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-center space-y-8 py-12 w-full max-w-md"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.1, 0.4, 0.1]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 bg-[var(--accent-primary)] rounded-full blur-3xl"
                        />
                        <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-3xl relative z-10 border-[var(--accent-primary)]/50 shadow-[0_0_60px_rgba(0,122,255,0.2)]`}>
                          {isProcessing ? (
                            <div className="relative">
                              <Loader2 className="w-16 h-16 text-[var(--accent-primary)] animate-spin" />
                              <Music2 className="w-6 h-6 text-[var(--accent-primary)] absolute inset-0 m-auto animate-pulse" />
                            </div>
                          ) : (
                            <motion.div
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Mic className="w-16 h-16 text-[var(--accent-primary)] fill-current" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center space-y-3">
                        <motion.h3 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-3xl font-black text-[var(--text-main)] tracking-tight"
                        >
                          {isProcessing ? 'Processing Audio...' : 'Listening...'}
                        </motion.h3>
                        <p className="text-[var(--text-muted)] font-medium text-lg">
                          {isProcessing ? 'Analyzing fingerprint patterns' : 'Hold your device close to the source'}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center py-10 space-y-12"
                    >
                      {/* Atmospheric Idle Visual (Atmospheric Orb) - Non-interactive decorative element */}
                      <div className="relative">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            rotate: [0, 90, 180, 270, 360]
                          }}
                          transition={{ 
                            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 25, repeat: Infinity, ease: "linear" }
                          }}
                          className="w-48 h-48 rounded-full bg-gradient-to-tr from-[var(--accent-primary)]/15 via-transparent to-[var(--accent-secondary)]/15 blur-3xl absolute inset-0"
                        />
                        <div className="w-48 h-48 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl flex items-center justify-center relative z-10 shadow-2xl">
                           <div className="flex flex-col items-center space-y-3 opacity-60">
                             <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/5 flex items-center justify-center text-[var(--accent-primary)]">
                               <Music2 className="w-6 h-6 animate-pulse" />
                             </div>
                             <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Ambient</span>
                           </div>
                        </div>
                        
                        {/* Soft Breathing Glow */}
                        <motion.div 
                          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/10 pointer-events-none"
                        />
                      </div>

                      <div className="text-center space-y-8">
                        <div className="space-y-3">
                          <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Ready to Capture.</h2>
                          <p className="text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                            The identification control is located at the center of your navigation bar.
                          </p>
                        </div>
                        
                        <motion.div
                          animate={{ y: [0, 6, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="flex justify-center text-[var(--accent-primary)] opacity-40"
                        >
                          <ArrowDown className="w-5 h-5" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Direct Alternative Options: Upload & Demo Track */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isListening}
                    className="btn-secondary-glass px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:border-[var(--accent-primary)]/40 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm bg-[var(--glass-bg)] backdrop-blur-lg"
                  >
                    <UploadCloud className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Upload Audio</span>
                  </button>
                  <button
                    onClick={() => startIdentification()}
                    disabled={isProcessing || isListening}
                    className="btn-secondary-glass px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:border-[var(--accent-primary)]/40 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm bg-[var(--glass-bg)] backdrop-blur-lg"
                  >
                    <Play className="w-4 h-4 text-[var(--accent-primary)] fill-current" />
                    <span>Try Demo Track</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm,.aac"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )
          )}

          <AnimatePresence mode="wait">
            {noMatch && (
              <motion.div
                key="no-match"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg glass-card rounded-3xl p-7 sm:p-8 text-center border border-amber-500/30 shadow-2xl my-6"
              >
                <div className="w-14 h-14 bg-amber-500/15 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <SearchX className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2 tracking-tight">No Matching Song Found</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 max-w-sm mx-auto">
                  Your audio was processed clearly, but wasn't recognized in the music fingerprint database.
                </p>

                <div className="text-left bg-[var(--subtle-btn-bg)] rounded-2xl p-4 sm:p-5 mb-6 space-y-3 text-xs text-[var(--text-muted)] border border-[var(--glass-border)]">
                  <div className="font-semibold text-[var(--text-main)] flex items-center gap-1.5 text-xs">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Tips for an accurate match:
                  </div>
                  <ul className="space-y-2.5 list-none pl-0">
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span><strong>Play official released music</strong> through speakers. Humming, whistling, or singing acapella cannot be matched.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span><strong>Move closer to the speaker</strong> so the song's beat and melody are louder than room noise.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span><strong>Listen during the chorus or beat</strong> for 6–10 seconds rather than quiet intros or spoken voice.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button 
                    onClick={() => resetIdentification()}
                    className="w-full sm:w-auto btn-primary-glass px-7 py-3 rounded-xl font-bold text-xs tracking-wider shadow-lg active:scale-95 text-white"
                  >
                    Try Microphone Again
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg glass-card rounded-3xl p-8 text-center border border-red-500/30 shadow-2xl my-6"
              >
                <div className="w-14 h-14 bg-red-500/15 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-lg shadow-red-500/10">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2 tracking-tight">Recognition Unsuccessful</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 max-w-sm mx-auto">{error}</p>
                <button 
                  onClick={() => resetIdentification()}
                  className="btn-primary-glass px-7 py-3 rounded-xl font-bold text-xs tracking-wider shadow-lg active:scale-95 text-white"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {identifiedSong && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full space-y-10"
              >
                <SongCard 
                  song={identifiedSong} 
                  layout="hero" 
                  onToggleFavourite={toggleFavouriteIdentified}
                />
                
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => resetIdentification()}
                    className="btn-secondary-glass px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95 border-2 border-[var(--accent-primary)]/20"
                  >
                    Identify Another Track
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Discoveries Strip if available */}
          {!identifiedSong && recentTracks.length > 0 && (
            <section className="w-full mt-24 pt-12 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl">
                    <History className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] uppercase tracking-tight">
                    Recent Finds
                  </h3>
                </div>
                <Link to="/history" className="text-sm font-bold text-[var(--accent-primary)] hover:opacity-80 transition-colors bg-[var(--accent-primary)]/5 px-4 py-2 rounded-xl">
                  View History →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {recentTracks.map((song, i) => (
                  <SongCard key={song.id} song={song} layout="grid" index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Quick Guidance Strip - Refined Glass Cards */}
          {!identifiedSong && (
            <section className="w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Crystal Clear', desc: 'Position your device near speakers for high-fidelity recognition accuracy.', icon: <Mic className="w-5 h-5" /> },
                { title: 'Studio Preview', desc: 'Listen to 30-second studio previews instantly with integrated controls.', icon: <Music2 className="w-5 h-5" /> },
                { title: 'Instant Sync', desc: 'Open songs in Spotify or generate QR codes to share your finds.', icon: <Link2 className="w-5 h-5" /> }
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-3xl p-8 relative overflow-hidden group border border-[var(--glass-border)] shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />
                  <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] mb-5 shadow-inner">
                    {item.icon}
                  </div>
                  <h4 className="text-base font-bold text-[var(--text-main)] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

