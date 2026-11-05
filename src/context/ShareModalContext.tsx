import React, { createContext, useContext, useState, useCallback } from 'react';
import { SongResult } from '../components/SongCard';
import { ShareModal } from '../components/ShareModal';

interface ShareModalContextType {
  openShareModal: (song: SongResult) => void;
  closeShareModal: () => void;
}

const ShareModalContext = createContext<ShareModalContextType | undefined>(undefined);

export const ShareModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openShareModal = useCallback((song: SongResult) => {
    setSelectedSong(song);
    setIsOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ShareModalContext.Provider value={{ openShareModal, closeShareModal }}>
      {children}
      <ShareModal 
        isOpen={isOpen} 
        song={selectedSong} 
        onClose={closeShareModal} 
      />
    </ShareModalContext.Provider>
  );
};

export const useShareModal = () => {
  const context = useContext(ShareModalContext);
  if (!context) {
    throw new Error('useShareModal must be used within a ShareModalProvider');
  }
  return context;
};
