import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { getMelodicPreviewUrl } from '../lib/audioEngine';

export interface PlayerTrack {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  previewUrl: string;
  spotifyId?: string;
  appleMusicId?: string;
}

interface AudioPlayerContextType {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number; // 0 to 1
  currentTime: number; // in seconds
  duration: number; // in seconds
  playTrack: (track: PlayerTrack) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seekTrack: (progressRatio: number) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const { showToast } = useToast();

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setCurrentTime(audio.currentTime);
        setProgress(Math.min(1, Math.max(0, audio.currentTime / audio.duration)));
      }
    };

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const audioTarget = e.target as HTMLAudioElement;
      // If error occurs on a remote streaming URL, seamlessly recover with melodic preview
      if (audioTarget?.currentSrc && !audioTarget.currentSrc.startsWith('blob:') && audioTarget.currentSrc !== window.location.href) {
        getMelodicPreviewUrl('synthwave', 'playback-fallback').then((url) => {
          if (audio) {
            audio.src = url;
            audio.load();
            audio.play().then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            }).catch(() => {
              setIsLoading(false);
              setIsPlaying(false);
            });
          }
        }).catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
        });
        return;
      }
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [showToast]);

  // Robust internal safe playback executor
  const executePlay = useCallback(async (audio: HTMLAudioElement) => {
    try {
      if (!audio.src || audio.src === window.location.href) {
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const promise = audio.play();
      playPromiseRef.current = promise;

      if (promise !== undefined && typeof promise.then === 'function') {
        await promise;
      }
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setIsPlaying(false);
      
      // AbortError is normal when rapid user clicks invoke pause() while loading
      if (err?.name === 'AbortError') {
        return;
      }

      if (err?.name === 'NotAllowedError') {
        showToast('Playback permission needed. Tap play to listen.', 'info');
      } else {
        console.warn('Audio preview playback failed:', err);
        showToast('Unable to play audio preview.', 'info');
      }
    } finally {
      playPromiseRef.current = null;
    }
  }, [showToast]);

  const pauseTrack = useCallback(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
    } catch (err) {
      console.warn('Error pausing audio:', err);
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const playTrack = useCallback(async (track: PlayerTrack) => {
    if (!track.previewUrl || !track.previewUrl.trim()) {
      showToast('No audio preview available for this track', 'info');
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // If already on this exact track
    if (currentTrack?.previewUrl === track.previewUrl) {
      if (!isPlaying) {
        executePlay(audio);
      } else {
        pauseTrack();
      }
      return;
    }

    // New track selected
    setCurrentTrack(track);
    setProgress(0);
    setCurrentTime(0);
    setIsLoading(true);

    try {
      audio.pause();
      
      let sourceUrl = track.previewUrl;
      if (sourceUrl.startsWith('synth:')) {
        const parts = sourceUrl.split(':');
        const genre = parts[1] || 'synthwave';
        const seed = parts[2] || track.title;
        sourceUrl = await getMelodicPreviewUrl(genre, seed);
      }

      audio.src = sourceUrl;
      audio.currentTime = 0;
      audio.load();
      await executePlay(audio);
    } catch (err) {
      console.warn('Error initiating track playback, attempting synthesizer fallback:', err);
      try {
        const fallbackUrl = await getMelodicPreviewUrl(track.album || 'synthwave', track.title);
        audio.src = fallbackUrl;
        audio.currentTime = 0;
        audio.load();
        await executePlay(audio);
      } catch (fallbackErr) {
        setIsLoading(false);
        setIsPlaying(false);
        showToast('Could not load audio preview', 'info');
      }
    }
  }, [currentTrack, isPlaying, executePlay, pauseTrack, showToast]);

  const togglePlay = useCallback(() => {
    if (!currentTrack || !currentTrack.previewUrl) {
      showToast('No track selected for playback', 'info');
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      pauseTrack();
    } else {
      // Ensure audio source matches current track
      if (!audio.src || !audio.src.includes(currentTrack.previewUrl)) {
        try {
          audio.src = currentTrack.previewUrl;
          audio.load();
        } catch (err) {
          console.warn('Error reloading audio src:', err);
        }
      }
      executePlay(audio);
    }
  }, [currentTrack, isPlaying, pauseTrack, executePlay, showToast]);

  const seekTrack = useCallback((progressRatio: number) => {
    const audio = audioRef.current;
    if (!audio || !duration || isNaN(duration) || !isFinite(duration)) return;
    try {
      const clamped = Math.max(0, Math.min(1, progressRatio));
      const targetTime = clamped * duration;
      if (isFinite(targetTime)) {
        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
        setProgress(clamped);
      }
    } catch (err) {
      console.warn('Seek error:', err);
    }
  }, [duration]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (err) {
        console.warn('Error closing player:', err);
      }
    }
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTrack(null);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        progress,
        currentTime,
        duration,
        playTrack,
        pauseTrack,
        togglePlay,
        seekTrack,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  return context;
};
