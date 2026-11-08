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

export interface PlaybackAudioData {
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  bassEnergy: number; // 0 to 1
  midEnergy: number; // 0 to 1
  trebleEnergy: number; // 0 to 1
  overallVolume: number; // 0 to 1
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
  getAudioData: () => PlaybackAudioData;
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const freqBufferRef = useRef<Uint8Array>(new Uint8Array(64));
  const timeBufferRef = useRef<Uint8Array>(new Uint8Array(64));
  const smoothedEnergyRef = useRef<{ bass: number; mid: number; treble: number; vol: number }>({
    bass: 0,
    mid: 0,
    treble: 0,
    vol: 0,
  });
  const { showToast } = useToast();

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
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
      // Safety check: ensure AudioContext is resumed when playback starts
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(err => console.warn('Context resume on play failed:', err));
      }
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

    // Initial hardware resume attempt on user interaction if context exists
    const resumeOnInteraction = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('mousedown', resumeOnInteraction);
    window.addEventListener('touchstart', resumeOnInteraction);

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
      window.removeEventListener('mousedown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
    };
  }, [showToast]);

  const ensureAudioGraph = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;

        if (audioRef.current && !sourceNodeRef.current) {
          try {
            const source = ctx.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            sourceNodeRef.current = source;
          } catch (sourceErr) {
            console.warn('MediaElementAudioSource note (handled gracefully):', sourceErr);
          }
        }

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume().catch((err) => {
          console.warn('AudioContext resume failed:', err);
        });
      }
    } catch (err) {
      console.warn('Audio graph initialization error:', err);
    }
  }, []);

  // Robust internal safe playback executor
  const executePlay = useCallback(async (audio: HTMLAudioElement) => {
    try {
      if (!audio.src || audio.src === window.location.href) {
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Critical: Ensure AudioContext is initialized and active
      await ensureAudioGraph();
      
      // Aggressive resume for browsers that suspend after mic usage
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        // Small hardware release buffer if coming from identification
        await new Promise(resolve => setTimeout(resolve, 50));
      }

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
  }, [ensureAudioGraph, showToast]);

  // Real-time audio playback data getter for 60fps canvas visualizer
  const getAudioData = useCallback((): PlaybackAudioData => {
    const freq = freqBufferRef.current;
    const timeBuff = timeBufferRef.current;
    const analyser = analyserRef.current;
    let hasRealData = false;

    if (analyser && isPlaying) {
      try {
        // Aggressive resume for stuck contexts (especially after mic usage)
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }

        analyser.getByteFrequencyData(freq as any);
        analyser.getByteTimeDomainData(timeBuff as any);
        let sum = 0;
        for (let i = 0; i < 24; i++) {
          sum += freq[i];
        }
        if (sum > 6) {
          hasRealData = true;
        }
      } catch {
        hasRealData = false;
      }
    }

    let rawBass = 0;
    let rawMid = 0;
    let rawTreble = 0;
    let rawVol = 0;

    if (hasRealData && isPlaying) {
      let bassSum = 0;
      for (let i = 0; i < 8; i++) bassSum += freq[i];
      rawBass = Math.min(1, (bassSum / (8 * 255)) * 1.4);

      let midSum = 0;
      for (let i = 8; i < 26; i++) midSum += freq[i];
      rawMid = Math.min(1, (midSum / (18 * 255)) * 1.4);

      let trebleSum = 0;
      for (let i = 26; i < 50; i++) trebleSum += freq[i];
      rawTreble = Math.min(1, (trebleSum / (24 * 255)) * 1.4);

      rawVol = rawBass * 0.5 + rawMid * 0.35 + rawTreble * 0.15;
    } else if (isPlaying) {
      // Harmonic procedural fallback synthesis synchronized with playback time and cadence
      const t = currentTime;
      const beatPulse = Math.abs(Math.sin(t * Math.PI * 2.2)); // ~132 BPM rhythm
      const snarePulse = Math.abs(Math.sin(t * Math.PI * 4.4 + 0.3));
      const kick = Math.pow(beatPulse, 4);

      rawBass = Math.min(1, 0.3 + kick * 0.6 + 0.1 * Math.sin(t * 12));
      rawMid = Math.min(1, 0.25 + 0.45 * snarePulse + 0.15 * Math.cos(t * 6));
      rawTreble = Math.min(1, 0.2 + 0.35 * Math.abs(Math.sin(t * 16 + 1)));
      rawVol = rawBass * 0.5 + rawMid * 0.35 + rawTreble * 0.15;

      for (let i = 0; i < 64; i++) {
        const falloff = 1 - (i / 64) * 0.65;
        const wave = Math.sin(t * 8 + i * 0.35) * 0.25 + 0.75;
        const binVal = (i < 8 ? rawBass : i < 26 ? rawMid : rawTreble) * falloff * wave;
        freq[i] = Math.min(255, Math.max(0, Math.floor(binVal * 255)));
        timeBuff[i] = Math.min(255, Math.max(0, Math.floor(128 + Math.sin(t * 22 + i * 0.5) * 45 * binVal)));
      }
    } else {
      // Idle / settling down
      for (let i = 0; i < 64; i++) {
        freq[i] = Math.max(0, Math.floor(freq[i] * 0.82));
        timeBuff[i] = 128;
      }
      rawBass = 0;
      rawMid = 0;
      rawTreble = 0;
      rawVol = 0;
    }

    // Smooth energies with lerp for organic aesthetic
    const smoothed = smoothedEnergyRef.current;
    const lerpFactor = isPlaying ? 0.3 : 0.15;
    smoothed.bass += (rawBass - smoothed.bass) * lerpFactor;
    smoothed.mid += (rawMid - smoothed.mid) * lerpFactor;
    smoothed.treble += (rawTreble - smoothed.treble) * lerpFactor;
    smoothed.vol += (rawVol - smoothed.vol) * lerpFactor;

    return {
      isPlaying,
      progress,
      currentTime,
      duration,
      frequencyData: freq,
      timeData: timeBuff,
      bassEnergy: smoothed.bass,
      midEnergy: smoothed.mid,
      trebleEnergy: smoothed.treble,
      overallVolume: smoothed.vol,
    };
  }, [isPlaying, progress, currentTime, duration]);

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

  // Safety check: ensure element is in sync with state when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !currentTrack.previewUrl) return;

    // If source isn't set yet or doesn't match, this is a state mismatch that needs correction
    if (audio.src !== currentTrack.previewUrl && !currentTrack.previewUrl.startsWith('synth:')) {
      audio.src = currentTrack.previewUrl;
      audio.load();
      if (isPlaying) {
        executePlay(audio);
      }
    }
  }, [currentTrack, isPlaying, executePlay]);

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
        getAudioData,
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
