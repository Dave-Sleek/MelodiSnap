import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LyricsViewer } from '../components/LyricsViewer';
import { SongResult } from '../components/SongCard';

interface LyricsModalContextType {
  openLyrics: (song: SongResult) => void;
  closeLyrics: () => void;
  isOpen: boolean;
}

const LyricsModalContext = createContext<LyricsModalContextType | undefined>(undefined);

export const LyricsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState<SongResult | null>(null);

  const openLyrics = useCallback((song: SongResult) => {
    setCurrentSong(song);
    setIsOpen(true);
  }, []);

  const closeLyrics = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <LyricsModalContext.Provider value={{ openLyrics, closeLyrics, isOpen }}>
      {children}
      <AnimatePresence>
        {isOpen && currentSong && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLyrics}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-transparent z-10"
            >
              <LyricsViewer 
                song={currentSong} 
                onClose={closeLyrics} 
                className="max-h-[85vh] shadow-2xl border-[var(--accent-primary)]/20" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LyricsModalContext.Provider>
  );
};

export const useLyricsModal = () => {
  const context = useContext(LyricsModalContext);
  if (!context) throw new Error('useLyricsModal must be used within a LyricsModalProvider');
  return context;
};
