import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { History } from './pages/History';
import { Favourites } from './pages/Favourites';
import { Connect } from './pages/Connect';
import { Callback } from './pages/Callback';
import { WifiOff } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { ShareModalProvider } from './context/ShareModalContext';
import { AudioPlayerBar } from './components/AudioPlayerBar';

export default function App() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AudioPlayerProvider>
          <ShareModalProvider>
            <Router>
              <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] selection:bg-[var(--accent-primary)]/20 transition-colors duration-400 relative">
                {/* Offline indicator banner */}
                <AnimatePresence>
                  {!isOnline && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-red-500 text-white overflow-hidden sticky top-0 z-[100]"
                    >
                      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center space-x-2 text-xs font-semibold">
                        <WifiOff className="w-3.5 h-3.5 text-white" />
                        <span>You are currently offline. Recognition features require internet access.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Navbar />

                <main>
                  <Routes>
                    <Route path="/" element={<Home isOffline={!isOnline} />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/favourites" element={<Favourites />} />
                    <Route path="/connect" element={<Connect />} />
                    <Route path="/callback" element={<Callback />} />
                    <Route path="/callback/spotify" element={<Callback />} />
                  </Routes>
                </main>

                {/* Floating Bottom Audio Preview Bar */}
                <AudioPlayerBar />

                {/* Ambient Background Lighting - Single Unified Blue Accent */}
                <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40">
                  <div 
                    className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-[var(--accent-primary)] rounded-full blur-[140px] transition-opacity duration-700" 
                    style={{ opacity: 'var(--glow-opacity)' } as any} 
                  />
                  <div 
                    className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-[var(--accent-secondary)] rounded-full blur-[140px] transition-opacity duration-700" 
                    style={{ opacity: 'var(--glow-opacity)' } as any} 
                  />
                </div>
              </div>
            </Router>
          </ShareModalProvider>
        </AudioPlayerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
