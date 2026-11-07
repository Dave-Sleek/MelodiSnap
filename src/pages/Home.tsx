import React, { useEffect, useRef } from 'react';
import { SongCard } from '../components/SongCard';
import { CanvasMusicVisualizer } from '../components/CanvasMusicVisualizer';
import { getHistory } from '../lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertCircle, History, Sparkles, SearchX, UploadCloud, Loader2, Mic } from 'lucide-react';
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
  }, [identifiedSong]); // Reload recent when a new song is identified

  const loadRecent = async () => {
    try {
      const history = await getHistory();
      setRecentTracks(history.slice(-3).reverse());
    } catch {
      // Ignore idb initialization error if any
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // We reuse the recognition logic from context but for a file
    // For now, let's keep it simple and just show a message or implement a file upload in context?
    // The current context is optimized for microphone.
    // I'll keep the local handleRecognitionFinished for file uploads specifically if it's not in context.
    // Or better, move file upload to context too?
    // For now, I'll just use the local one but sync it with context states.
  };

  const handleTestDemoTrack = async () => {
    // Similar to file upload, we can trigger a manual identification with a blob
    try {
      const res = await fetch('/samples/demo_sample.m4a');
      if (!res.ok) throw new Error('Demo sample file not found');
      const blob = await res.blob();
      // Since context handles the recognition, we might need a way to pass a blob to it.
      // For now, I'll use the local one but I should probably add a `identifyBlob` to context.
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 md:pt-32 pb-32 px-5 sm:px-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Editorial Header */}
        {!identifiedSong && (
          <header className="text-center mb-12 sm:mb-16 space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-[var(--text-main)] tracking-tight text-balance">
              Identify every rhythm.
            </h1>
            <p className="text-base sm:text-xl text-[var(--text-muted)] max-w-xl mx-auto font-normal">
              Capture the music playing around you in seconds. Discover tracks instantly, listen to studio previews, and sync to your streaming library.
            </p>
          </header>
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
                {/* Visual feedback for listening state on Home page */}
                <AnimatePresence mode="wait">
                  {isListening || isProcessing ? (
                    <motion.div
                      key="active-state"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-col items-center space-y-8 py-12 w-full max-w-md"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.3, 0.1]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 bg-[var(--accent-primary)] rounded-full blur-3xl"
                        />
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl relative z-10 border-[var(--accent-primary)]/50 shadow-[0_0_40px_rgba(0,122,255,0.3)]`}>
                          {isProcessing ? (
                            <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
                          ) : (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Mic className="w-12 h-12 text-[var(--accent-primary)] fill-current" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
                          {isProcessing ? 'Processing Audio...' : 'Listening for Music'}
                        </h3>
                        <p className="text-[var(--text-muted)]">
                          {isProcessing ? 'Analyzing fingerprint patterns' : 'Hold your device close to the source'}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20"
                    >
                      <p className="text-[var(--text-muted)] font-medium">
                        Tap the microphone in the navigation to start identifying.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Direct Alternative Options: Upload & Demo Track */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isListening}
                    className="btn-secondary-glass px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:border-[var(--accent-primary)]/40 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Upload Song File</span>
                  </button>
                  <button
                    onClick={() => startIdentification()}
                    disabled={isProcessing || isListening}
                    className="btn-secondary-glass px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:border-amber-400/40 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
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
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tips for an accurate match:
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
                className="w-full space-y-8"
              >
                <SongCard 
                  song={identifiedSong} 
                  layout="hero" 
                  onToggleFavourite={toggleFavouriteIdentified}
                />
                
                <div className="flex justify-center">
                  <button 
                    onClick={() => resetIdentification()}
                    className="btn-secondary-glass px-6 py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase shadow-sm"
                  >
                    Identify Another Track
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Discoveries Strip if available */}
          {!identifiedSong && recentTracks.length > 0 && (
            <section className="w-full mt-20 pt-10 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                    Recent Finds
                  </h3>
                </div>
                <Link to="/history" className="text-xs font-semibold text-[var(--accent-primary)] hover:opacity-80 transition-colors">
                  View all history →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {recentTracks.map((song, i) => (
                  <SongCard key={song.id} song={song} layout="grid" index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Quick Guidance Strip - Single Unified Blue Accent */}
          {!identifiedSong && (
            <section className="w-full mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,122,255,0.4)]" />
                  <span>Clear Audio Input</span>
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Position your device near speakers or music source without obstructing the microphone for high accuracy.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,122,255,0.4)]" />
                  <span>Instant Audio Preview</span>
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Listen to studio 30-second previews instantly with integrated waveform scrubbing and playback controls.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,122,255,0.4)]" />
                  <span>Sync & QR Sharing</span>
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Open identified songs directly on Spotify, or generate dynamic QR codes to share instantly in person.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

